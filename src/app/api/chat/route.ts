import type { NextRequest } from "next/server";

type IncomingMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestBody = {
  model: string;
  messages: IncomingMessage[];
  temperature?: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_NVIDIA_MODEL = "deepseek-ai/deepseek-v4-flash";
const MAX_OUTPUT_TOKENS = 3200;
const CONTINUATION_TOKENS = 1600;
const UPSTREAM_TIMEOUT_MS = 45000;

type Provider = "nvidia" | "openrouter";

type ModelAttempt = {
  provider: Provider;
  model: string;
  apiKey: string;
};

type StreamPayload = {
  choices?: {
    delta?: { content?: string };
    finish_reason?: string | null;
  }[];
  error?: {
    message?: string;
    code?: string | number;
  };
};

function normalizeOpenRouterModel(model: string) {
  if (model === "nvidia/deepseek-v4-flash") return "deepseek/deepseek-v4-flash";
  return model.replace(/:free$/, "");
}

function nvidiaModelFor(model: string) {
  const normalized = model.replace(/:free$/, "");
  if (normalized === "nvidia/deepseek-v4-flash") {
    return DEFAULT_NVIDIA_MODEL;
  }
  return null;
}

function buildAttempts(model: string, openRouterKey?: string, nvidiaKey?: string): ModelAttempt[] {
  const attempts: ModelAttempt[] = [];
  const nvidiaModel = nvidiaModelFor(model);

  if (nvidiaKey && nvidiaModel) {
    attempts.push({ provider: "nvidia", model: nvidiaModel, apiKey: nvidiaKey });
  }

  if (openRouterKey) {
    attempts.push({
      provider: "openrouter",
      model: normalizeOpenRouterModel(model),
      apiKey: openRouterKey,
    });

    if (normalizeOpenRouterModel(model) !== DEFAULT_OPENROUTER_MODEL) {
      attempts.push({
        provider: "openrouter",
        model: DEFAULT_OPENROUTER_MODEL,
        apiKey: openRouterKey,
      });
    }
  }

  return attempts;
}

async function tryModel(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: IncomingMessage[],
  temperature: number,
  maxTokens = MAX_OUTPUT_TOKENS,
): Promise<Response | null> {
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    top_p: 0.9,
    stream: true,
    max_tokens: maxTokens,
  };

  if (provider === "openrouter") {
    payload.provider = {
      sort: "throughput",
      allow_fallbacks: true,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(provider === "nvidia" ? NVIDIA_URL : OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        ...(provider === "openrouter"
          ? {
              "HTTP-Referer": process.env.OPENROUTER_REFERER ?? "https://ember.local",
              "X-Title": "Ember",
            }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    clearTimeout(timeout);

    if (upstream.status === 429 || upstream.status === 402 || upstream.status >= 500) {
      await upstream.text().catch(() => {});
      return null;
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "(no body)");
      return new Response(
        JSON.stringify({ error: "API error " + upstream.status + ": " + text.slice(0, 400) }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return upstream as unknown as Response;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!openRouterKey && !nvidiaKey) {
    return new Response(
      JSON.stringify({ error: "Set OPENROUTER_API_KEY or NVIDIA_API_KEY." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" } },
    );
  }

  if (!body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Body must include model and a non-empty messages array." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const temperature = body.temperature ?? 0.72;
  const modelAttempts = buildAttempts(body.model, openRouterKey, nvidiaKey);
  let lastErrorResponse: Response | null = null;

  for (const attempt of modelAttempts) {
    const result = await tryModel(
      attempt.provider,
      attempt.apiKey,
      attempt.model,
      body.messages,
      temperature,
    );

    if (result === null) { continue; }

    if (result.headers.get("Content-Type")?.includes("application/json")) {
      lastErrorResponse = result;
      continue;
    }

    const upstreamBody = (result as unknown as { body: ReadableStream<Uint8Array> }).body;
    if (!upstreamBody) continue;

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = "";

        const pipeModelStream = async (
          bodyStream: ReadableStream<Uint8Array>,
          continuationCount = 0,
        ): Promise<void> => {
          const reader = bodyStream.getReader();
          let buffer = "";
          let finishReason: string | null = null;
          const startLength = assistantText.trim().length;

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line || !line.startsWith("data:")) continue;

                const payload = line.slice(5).trim();
                if (payload === "[DONE]") {
                  if (finishReason === "length" && continuationCount < 1 && assistantText.trim()) {
                    controller.enqueue(encoder.encode("\n\n"));
                    const continuationMessages: IncomingMessage[] = [
                      ...body.messages,
                      { role: "assistant", content: assistantText },
                      {
                        role: "user",
                        content:
                          "Continue from exactly where you stopped and finish the remaining required sections. Do not repeat earlier text. End with a clear final option list.",
                      },
                    ];
                    const nextResult = await tryModel(
                      attempt.provider,
                      attempt.apiKey,
                      attempt.model,
                      continuationMessages,
                      temperature,
                      CONTINUATION_TOKENS,
                    );
                    const nextBody = (nextResult as unknown as { body?: ReadableStream<Uint8Array> } | null)?.body;
                    if (nextBody) {
                      await pipeModelStream(nextBody, continuationCount + 1);
                    }
                  }
                  return;
                }

                let json: StreamPayload;
                try {
                  json = JSON.parse(payload) as StreamPayload;
                } catch {
                  continue;
                }

                if (json.error) {
                  throw new Error(json.error.message ?? "The model returned a streaming error.");
                }

                finishReason = json.choices?.[0]?.finish_reason ?? finishReason;
                const delta = json.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  assistantText += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              }
            }
            if (continuationCount === 0 && assistantText.trim().length === startLength) {
              throw new Error("The model returned no usable text. Please retry or choose another model.");
            }
          } finally {
            reader.cancel().catch(() => {});
          }
        };

        try {
          await pipeModelStream(upstreamBody);
        } catch (streamErr) {
          controller.error(streamErr);
          return;
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  if (lastErrorResponse) return lastErrorResponse;

  return new Response(
    JSON.stringify({ error: "All models unavailable. Please try again." }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

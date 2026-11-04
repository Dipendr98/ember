import type { NextRequest } from "next/server";
import { GEMMA_MODEL_ID, MODEL_OPTIONS } from "@/lib/models";
import { MINOR_BLOCK_MESSAGE, MINOR_RULE, mentionsMinor } from "@/lib/minor-guard";

type IncomingMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestBody = {
  model: string;
  messages: IncomingMessage[];
  temperature?: number;
  max_tokens?: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_NVIDIA_MODEL = "deepseek-ai/deepseek-v4-flash";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3-flash-preview"];

const GEMINI_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
];
const MAX_OUTPUT_TOKENS = 2048;
// Cap how much chat history is sent upstream — a shorter prompt means the
// model starts replying sooner. The system prompt is always kept.
const MAX_HISTORY_MESSAGES = 24;
const CONTINUATION_TOKENS = 1024;
const UPSTREAM_TIMEOUT_MS = 90000;
const MAX_AUTO_CONTINUATIONS = 2;
const MIN_RETRY_TOKENS = 96;
// Short chat texts ("hmm 🥵", "aur?") often end without punctuation on
// purpose. Only guess "cut off" for longer replies like story turns.
const MIN_LENGTH_FOR_INCOMPLETE_CHECK = 400;

type Provider = "nvidia" | "openrouter" | "gemini" | "gemma";

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
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string | null;
  }[];
  error?: {
    message?: string;
    code?: string | number;
  };
};

function extractDelta(json: StreamPayload): { delta: string; finishReason: string | null } {
  if (json.candidates) {
    const candidate = json.candidates[0];
    const delta = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const reason = candidate?.finishReason ?? null;
    const finishReason = reason === "MAX_TOKENS" ? "length" : reason === "STOP" ? "stop" : reason;
    return { delta, finishReason };
  }
  return {
    delta: json.choices?.[0]?.delta?.content ?? "",
    finishReason: json.choices?.[0]?.finish_reason ?? null,
  };
}

function isGeminiModel(model: string) {
  return model.startsWith("google/gemini-") && !model.includes(":free");
}

function toGeminiModel(model: string) {
  const name = model.replace(/^google\//, "");
  return name || DEFAULT_GEMINI_MODEL;
}

function buildGeminiPayload(
  messages: IncomingMessage[],
  temperature: number,
  maxTokens: number,
  disableThinking = true,
) {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Start." }] });
  }

  // Prefill an in-character assistant opener so Gemini continues the roleplay
  // instead of emitting a top-level refusal. The prefill ends on a blank line
  // so the streamed continuation reads as clean standalone text.
  if (contents[contents.length - 1].role === "user") {
    contents.push({ role: "model", parts: [{ text: "🔥\n\n" }] });
  }

  const payload: Record<string, unknown> = {
    contents,
    safetySettings: GEMINI_SAFETY_SETTINGS,
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: maxTokens,
      // Skip the model's internal "thinking" phase so the first token
      // arrives immediately instead of after several seconds.
      ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };
  if (systemText) {
    payload.systemInstruction = { parts: [{ text: systemText }] };
  }
  return payload;
}

// The self-hosted Gemma endpoint takes one `prompt` string and answers with
// `{ "text": "..." }` in a single response (no streaming, no API key).
function buildGemmaPrompt(messages: IncomingMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "assistant" ? "ASSISTANT" : "USER"}: ${m.content}`)
    .join("\n\n");
  return [
    system,
    "Below is the conversation so far. Write only the next ASSISTANT reply — never write USER lines and never add the \"ASSISTANT:\" label.",
    turns,
    "ASSISTANT:",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Wrap Gemma's single JSON reply as an OpenAI-style SSE stream so the rest of
// the pipeline (streaming, auto-continuation) handles it like any provider.
function gemmaTextToSse(text: string) {
  const clean = text.replace(/^\s*ASSISTANT:\s*/i, "");
  const chunk = { choices: [{ delta: { content: clean }, finish_reason: "stop" }] };
  return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function normalizeOpenRouterModel(model: string) {
  if (model === "nvidia/deepseek-v4-flash") return "deepseek/deepseek-v4-flash";
  return model;
}

function buildAttempts(
  model: string,
  openRouterKey?: string,
  nvidiaKey?: string,
  geminiKey?: string,
  gemmaUrl?: string,
): ModelAttempt[] {
  const attempts: ModelAttempt[] = [];

  // For the gemma provider, apiKey carries the endpoint URL (it needs no key).
  if (model === GEMMA_MODEL_ID && gemmaUrl) {
    attempts.push({ provider: "gemma", model: GEMMA_MODEL_ID, apiKey: gemmaUrl });
  }
  const normalizedModel = normalizeOpenRouterModel(model);
  const isExplicitNvidia = model === "nvidia/deepseek-v4-flash";
  const isExplicitGemini = isGeminiModel(model);

  if (isExplicitGemini && geminiKey) {
    attempts.push({ provider: "gemini", model: toGeminiModel(model), apiKey: geminiKey });
  }

  if (openRouterKey && !isExplicitNvidia && !isExplicitGemini && model !== GEMMA_MODEL_ID) {
    attempts.push({
      provider: "openrouter",
      model: normalizedModel,
      apiKey: openRouterKey,
    });
  }

  if (isExplicitNvidia && nvidiaKey) {
    attempts.push({ provider: "nvidia", model: DEFAULT_NVIDIA_MODEL, apiKey: nvidiaKey });
  }

  for (const option of MODEL_OPTIONS) {
    if (option.id === model) continue;

    if (option.id === GEMMA_MODEL_ID) {
      if (gemmaUrl) {
        attempts.push({ provider: "gemma", model: GEMMA_MODEL_ID, apiKey: gemmaUrl });
      }
    } else if (isGeminiModel(option.id)) {
      if (geminiKey) {
        attempts.push({ provider: "gemini", model: toGeminiModel(option.id), apiKey: geminiKey });
      }
    } else if (option.id === "nvidia/deepseek-v4-flash") {
      if (nvidiaKey) {
        attempts.push({ provider: "nvidia", model: DEFAULT_NVIDIA_MODEL, apiKey: nvidiaKey });
      }
    } else if (openRouterKey) {
      attempts.push({
        provider: "openrouter",
        model: normalizeOpenRouterModel(option.id),
        apiKey: openRouterKey,
      });
    }
  }

  if (geminiKey) {
    for (const fallback of GEMINI_FALLBACK_MODELS) {
      attempts.push({ provider: "gemini", model: fallback, apiKey: geminiKey });
    }
  }

  // Deduplicate attempts (keep the first occurrence)
  const uniqueAttempts: ModelAttempt[] = [];
  const seen = new Set<string>();
  for (const attempt of attempts) {
    const key = `${attempt.provider}:${attempt.model}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAttempts.push(attempt);
    }
  }

  return uniqueAttempts;
}

function affordableTokenCount(message: string) {
  const match = message.match(/can only afford\s+(\d+)/i);
  if (!match) return null;
  const count = Number(match[1]);
  if (!Number.isFinite(count)) return null;
  return count;
}

function friendlyProviderError(message: string) {
  if (/requires more credits|can only afford|higher monthly limit|paid account/i.test(message)) {
    return "Free AI limit hit for this long reply. I shortened the request and tried the free route; please try again with a shorter message.";
  }
  return message;
}

function looksIncomplete(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const withoutMarkdown = trimmed.replace(/[*_`~\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+$/gu, "");
  if (!withoutMarkdown) return true;

  const withoutClosingMarks = withoutMarkdown.replace(/[)"'\]}\u201d\u2019]+$/g, "");
  const lastChar = withoutClosingMarks.at(-1) ?? "";
  const completeEndings = new Set([
    ".",
    "!",
    "?",
    "।",
    "…",
  ]);

  if (completeEndings.has(lastChar)) return false;

  return true;
}

async function tryModel(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: IncomingMessage[],
  temperature: number,
  maxTokens = MAX_OUTPUT_TOKENS,
): Promise<Response | null> {
  const requestUpstream = async (tokenLimit: number, disableThinking = true) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      if (provider === "gemma") {
        const res = await fetch(apiKey, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildGemmaPrompt(messages) }),
        });
        if (!res.ok) return res;
        const json = (await res.json().catch(() => null)) as { text?: string } | null;
        const text = json?.text?.trim();
        if (!text) {
          return new Response(JSON.stringify({ error: "Gemma returned no text" }), { status: 502 });
        }
        return gemmaTextToSse(text);
      }

      if (provider === "gemini") {
        return await fetch(`${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildGeminiPayload(messages, temperature, tokenLimit, disableThinking)),
        });
      }

      const payload: Record<string, unknown> = {
        model,
        messages,
        temperature,
        top_p: 0.9,
        stream: true,
        max_tokens: tokenLimit,
      };

      if (provider === "openrouter") {
        payload.provider = {
          sort: "throughput",
          allow_fallbacks: true,
        };
      }

      return await fetch(provider === "nvidia" ? NVIDIA_URL : OPENROUTER_URL, {
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
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    let upstream = await requestUpstream(maxTokens);

    // Some Gemini models reject thinkingConfig with a 400 — retry without it.
    if (provider === "gemini" && upstream.status === 400) {
      await upstream.text().catch(() => "");
      upstream = await requestUpstream(maxTokens, false);
    }

    if (upstream.status === 429 || upstream.status === 402 || upstream.status >= 500) {
      const text = await upstream.text().catch(() => "");
      let errorMessage = `Provider error ${upstream.status}`;
      try {
        const json = JSON.parse(text);
        if (json.error?.message) {
          errorMessage = json.error.message;
        }
      } catch {
        if (text) errorMessage += `: ${text.slice(0, 200)}`;
      }

      const affordable = affordableTokenCount(errorMessage);
      if (upstream.status === 402 && affordable !== null && affordable >= MIN_RETRY_TOKENS) {
        try {
          upstream = await requestUpstream(Math.max(MIN_RETRY_TOKENS, Math.min(affordable - 16, maxTokens)));
          if (upstream.ok && upstream.body) {
            return upstream as unknown as Response;
          }
          await upstream.text().catch(() => "");
        } catch {}
      }

      return new Response(
        JSON.stringify({ error: friendlyProviderError(errorMessage) }),
        { status: upstream.status, headers: { "Content-Type": "application/json" } }
      );
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
    return null;
  }
}

export async function POST(req: NextRequest) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const gemmaUrl = process.env.GEMMA_API_URL;
  if (!openRouterKey && !nvidiaKey && !geminiKey && !gemmaUrl) {
    return new Response(
      JSON.stringify({ error: "Set GEMMA_API_URL, GEMINI_API_KEY, OPENROUTER_API_KEY, or NVIDIA_API_KEY." }),
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
  const maxTokens = body.max_tokens ?? MAX_OUTPUT_TOKENS;

  // Trim old history: keep system messages plus the most recent turns.
  const systemMessages = body.messages.filter((m) => m.role === "system");
  let chatMessages = body.messages.filter((m) => m.role !== "system");
  if (chatMessages.length > MAX_HISTORY_MESSAGES) {
    chatMessages = chatMessages.slice(-MAX_HISTORY_MESSAGES);
    // Don't start the trimmed window on an assistant turn.
    while (chatMessages.length > 0 && chatMessages[0].role === "assistant") {
      chatMessages = chatMessages.slice(1);
    }
  }

  // Under-18 block: check the client-built system prompt (custom scenarios,
  // characters) and the latest user turn, then always append the hard rule.
  const lastUserMessage = [...chatMessages].reverse().find((m) => m.role === "user");
  const textToCheck = [...systemMessages, ...(lastUserMessage ? [lastUserMessage] : [])]
    .map((m) => m.content)
    .join("\n");
  if (mentionsMinor(textToCheck)) {
    return new Response(JSON.stringify({ error: MINOR_BLOCK_MESSAGE }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const requestMessages: IncomingMessage[] = [
    ...systemMessages,
    { role: "system", content: MINOR_RULE },
    ...chatMessages,
  ];

  const modelAttempts = buildAttempts(body.model, openRouterKey, nvidiaKey, geminiKey, gemmaUrl);
  let lastErrorResponse: Response | null = null;

  for (const attempt of modelAttempts) {
    const result = await tryModel(
      attempt.provider,
      attempt.apiKey,
      attempt.model,
      requestMessages,
      temperature,
      maxTokens,
    );

    if (result === null) {
      console.warn(`[chat] ${attempt.provider}:${attempt.model} failed: network error or timeout`);
      continue;
    }

    if (result.headers.get("Content-Type")?.includes("application/json")) {
      lastErrorResponse = result;
      const detail = await result.clone().text().catch(() => "");
      console.warn(`[chat] ${attempt.provider}:${attempt.model} failed: ${result.status} ${detail.slice(0, 300)}`);
      // Small delay before retrying next model to avoid rate limit cascades
      await new Promise((r) => setTimeout(r, 200));
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

          const continueIfNeeded = async () => {
            const hasNewText = assistantText.trim().length > startLength;
            const needsContinuation =
              hasNewText &&
              continuationCount < MAX_AUTO_CONTINUATIONS &&
              (finishReason === "length" ||
                (assistantText.trim().length >= MIN_LENGTH_FOR_INCOMPLETE_CHECK &&
                  looksIncomplete(assistantText)));

            if (!needsContinuation) return;

            controller.enqueue(encoder.encode("\n\n"));
            const continuationMessages: IncomingMessage[] = [
              ...requestMessages,
              { role: "assistant", content: assistantText },
              {
                role: "user",
                content:
                  "Continue from the exact last word where you stopped. Return only the missing continuation, never repeat earlier text. Finish with a complete sentence.",
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
          };

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
                  await continueIfNeeded();
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

                const extracted = extractDelta(json);
                finishReason = extracted.finishReason ?? finishReason;
                const delta = extracted.delta;
                if (delta) {
                  assistantText += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              }
            }
            if (continuationCount === 0 && assistantText.trim().length === startLength) {
              throw new Error("The model returned no usable text. Please retry or choose another model.");
            }
            await continueIfNeeded();
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
        "X-Ember-Provider": `${attempt.provider}:${attempt.model}`,
      },
    });
  }

  if (lastErrorResponse) return lastErrorResponse;

  return new Response(
    JSON.stringify({ error: "All models unavailable. Please try again." }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

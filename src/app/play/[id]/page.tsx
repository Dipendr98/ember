"use client";

import ReactMarkdown from "react-markdown";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  StopCircle,
  RefreshCw,
  Undo2,
  AlertOctagon,
  Users,
  Settings2,
  Flame,
  ArrowLeft,
} from "lucide-react";

import { Shell } from "@/components/Shell";
import { CharacterEditor } from "@/components/CharacterEditor";
import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/models";
import { buildSystemPrompt, openingPrompt } from "@/lib/prompts";
import {
  getProfile,
  getSession,
  newId,
  saveSession,
} from "@/lib/storage";
import type {
  ChatMessage,
  Character,
  CoupleProfile,
  Session,
} from "@/lib/types";
import { useLanguage } from "@/components/LanguageContext";

const QUICK_ACTIONS_EN = [
  { label: "Romance 🔥", text: "Make it more romantic and passionate." },
  { label: "Dirty Talk 😈", text: "Add bold, intimate dialogue while keeping the scene flowing." },
  { label: "Go Deeper 🥵", text: "Go deeper emotionally and physically, with vivid but non-graphic detail." },
  { label: "Take Control ⛓️", text: "Make the dynamic more commanding and intense while keeping it consensual." },
  { label: "Wild Twist 🔞", text: "Throw in a wild, unexpected twist that completely surprises." },
  { label: "Full Speed ⚡", text: "Raise the pace and intensity, then finish the beat cleanly." },
];

const QUICK_ACTIONS_HI = [
  { label: "रोमांस 🔥", text: "इसे और रोमांटिक और भावुक बनाओ।" },
  { label: "डायलॉग 😈", text: "बोल्ड और अंतरंग dialogue जोड़ो, लेकिन scene साफ़ तरीके से आगे बढ़े।" },
  { label: "और गहरा 🥵", text: "भावना और chemistry को और गहरा बनाओ, vivid लेकिन non-graphic detail में।" },
  { label: "कंट्रोल लो ⛓️", text: "dynamic को ज्यादा confident और intense बनाओ, consent साफ रखो।" },
  { label: "नया मोड़ 🔞", text: "एक बहुत ही वाइल्ड और अचानक मोड़ लाओ जो पूरी तरह से सरप्राइज़ करे।" },
  { label: "पूरी रफ़्तार ⚡", text: "pace और intensity बढ़ाओ, फिर beat को साफ़ sentence में finish करो।" },
];

const CONTINUE_PROMPT_EN =
  "Continue from the exact last word where the previous answer stopped. Return only new text. Do not repeat any prior sentence. Finish with a complete sentence.";

const CONTINUE_PROMPT_HI =
  "पिछला जवाब जहां रुका था, वहीं से आगे जारी रखो। सिर्फ नया text दो। पुराना sentence repeat मत करो। Complete sentence पर finish करो।";

function looksIncomplete(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const withoutDecor = trimmed.replace(/[*_`~\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+$/gu, "");
  if (!withoutDecor) return true;

  const withoutClosingMarks = withoutDecor.replace(/[)"'\]}\u201d\u2019]+$/g, "");
  const lastChar = withoutClosingMarks.at(-1) ?? "";
  return ![".", "!", "?", "।", "…"].includes(lastChar);
}

function isTechnicalOpeningPrompt(text: string) {
  return (
    text.startsWith("[Unique story seed:") ||
    text.includes("Follow the format in order:") ||
    text.includes("Format follow kar")
  );
}

function normalizeForOverlap(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function mergeContinuation(base: string, continuation: string) {
  const first = base.trimEnd();
  let second = continuation.trimStart();
  if (!second) return first;

  const maxOverlap = Math.min(240, first.length, second.length);
  for (let size = maxOverlap; size >= 8; size -= 1) {
    const suffix = normalizeForOverlap(first.slice(-size));
    const prefix = normalizeForOverlap(second.slice(0, size));
    if (suffix && suffix === prefix) {
      second = second.slice(size).trimStart();
      break;
    }
  }

  const lastSentence = first.match(/[^.!?।…]+[.!?।…]\s*$/)?.[0]?.trim();
  if (lastSentence && normalizeForOverlap(second).startsWith(normalizeForOverlap(lastSentence))) {
    second = second.slice(lastSentence.length).trimStart();
  }

  return second ? `${first}\n\n${second}` : first;
}

function fallbackAssistantText(language: string, userText: string) {
  const topic = userText.trim();
  if (language === "hi") {
    return [
      "मैं अभी छोटा लेकिन पूरा जवाब दे रहा हूँ, ताकि चैट रुके नहीं।",
      "",
      `**सीन की दिशा:** ${topic || "एक intense romantic scene"} को consensual, cinematic और emotional रखो।`,
      "",
      "**अगला बीट:** दोनों characters के बीच tension बढ़ती है, dialogue sharp होता है, और scene एक साफ़ मोड़ पर खत्म होता है ताकि आप Romance, Go Deeper या Continue से आगे बढ़ा सकें।",
    ].join("\n");
  }

  return [
    "I’m giving you a short complete reply so the chat does not stop.",
    "",
    `**Scene direction:** Keep ${topic || "the scene"} consensual, cinematic, emotional, and easy to continue.`,
    "",
    "**Next beat:** The tension rises, the dialogue gets sharper, and the moment lands on a clean hook so you can continue with Romance, Go Deeper, or Continue.",
  ].join("\n");
}

async function readChatStream(
  payload: {
    model: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature: number;
  },
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }

  return text.trim();
}

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const sessionId = params?.id;

  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);


  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const profileRef = useRef<CoupleProfile | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const s = getSession(sessionId);
    if (!s) {
      router.replace("/sessions");
      return;
    }
    const knownModels = MODEL_OPTIONS.map((m) => m.id);
    if (!knownModels.includes(s.model)) {
      s.model = DEFAULT_MODEL;
      saveSession(s);
    }
    // Hydrate from localStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(s);
    setProfile(getProfile());
    sessionRef.current = s;
    profileRef.current = getProfile();
  }, [sessionId, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages.length, streamText]);

  const QUICK_ACTIONS = language === "hi" ? QUICK_ACTIONS_HI : QUICK_ACTIONS_EN;

  const systemPrompt = useMemo(() => {
    if (!session || !profile) return "";
    return buildSystemPrompt({
      profile,
      scenario: session.scenarioSnapshot,
      characters: session.characters,
      intensity: session.intensity,
      language,
    });
  }, [session, profile, language]);

  const persist = useCallback((next: Session) => {
    setSession(next);
    saveSession(next);
    sessionRef.current = next;
  }, []);

  const sendMessage = useCallback(
    async (content: string, opts?: { replaceLastAssistant?: boolean }) => {
      const currSession = sessionRef.current;
      const currProfile = profileRef.current;
      if (!currSession || !currProfile) return;
      if (!content.trim()) return;

      setError(null);
      setStreaming(true);
      setStreamText("");

      let baseMessages = currSession.messages;
      let userMessage: ChatMessage | null = null;

      if (opts?.replaceLastAssistant) {
        const last = baseMessages[baseMessages.length - 1];
        if (last?.role === "assistant") {
          baseMessages = baseMessages.slice(0, -1);
        }
      } else {
        userMessage = {
          id: newId(),
          role: "user",
          content,
          createdAt: Date.now(),
        };
        baseMessages = [...baseMessages, userMessage];
      }

      const withUser: Session = {
        ...currSession,
        messages: baseMessages,
        updatedAt: Date.now(),
      };
      persist(withUser);
      sessionRef.current = withUser;

      const requestMessages = [
        { role: "system" as const, content: systemPrompt },
        ...baseMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      const modelsToTry = [
        currSession.model,
        ...MODEL_OPTIONS.map((m) => m.id).filter((id) => id !== currSession.model),
      ];

      let succeeded = false;

      for (const modelId of modelsToTry) {
        if (controller.signal.aborted) break;

        const payload = {
          model: modelId,
          messages: requestMessages,
          temperature: 0.72,
        };

        try {
          setStreamText("");
          let finalAssistantText = await readChatStream(
            payload,
            controller.signal,
            setStreamText,
          );

          if (!finalAssistantText || finalAssistantText.trim().length < 5) {
            continue;
          }

          for (let continuationAttempt = 0; continuationAttempt < 2 && looksIncomplete(finalAssistantText); continuationAttempt += 1) {
            const continuationPayload = {
              model: modelId,
              messages: [
                ...requestMessages,
                { role: "assistant" as const, content: finalAssistantText },
                {
                  role: "user" as const,
                  content: language === "hi" ? CONTINUE_PROMPT_HI : CONTINUE_PROMPT_EN,
                },
              ],
              temperature: 0.72,
            };

            let continuationText = "";
            try {
              continuationText = await readChatStream(
                continuationPayload,
                controller.signal,
                (nextText) => setStreamText(mergeContinuation(finalAssistantText, nextText)),
              );
            } catch {
              break;
            }

            if (continuationText.length > 0) {
              finalAssistantText = mergeContinuation(finalAssistantText, continuationText);
            }
          }

          const assistantMessage: ChatMessage = {
            id: newId(),
            role: "assistant",
            content: finalAssistantText,
            createdAt: Date.now(),
          };
          const finalMessages = [...baseMessages, assistantMessage];
          const updatedSession = { ...withUser, messages: finalMessages, model: modelId, updatedAt: Date.now() };
          persist(updatedSession);
          sessionRef.current = updatedSession;
          succeeded = true;
          break;
        } catch (err) {
          if ((err as Error).name === "AbortError") break;
          continue;
        }
      }

      if (!succeeded && !controller.signal.aborted) {
        const assistantMessage: ChatMessage = {
          id: newId(),
          role: "assistant",
          content: fallbackAssistantText(language, content),
          createdAt: Date.now(),
        };
        const finalMessages = [...baseMessages, assistantMessage];
        persist({ ...withUser, messages: finalMessages, updatedAt: Date.now() });
      }
      setStreamText("");
      setStreaming(false);
      abortRef.current = null;
    },
    [language, persist, systemPrompt],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (streaming) return;
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }

  function regenerate() {
    const s = sessionRef.current;
    if (!s) return;
    const lastUser = [...s.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      sendMessage(openingPrompt(s.scenarioSnapshot, s.characters, language));
      return;
    }
    sendMessage(lastUser.content, { replaceLastAssistant: true });
  }

  function continueLastResponse() {
    sendMessage(language === "hi" ? CONTINUE_PROMPT_HI : CONTINUE_PROMPT_EN);
  }

  function undoLastExchange() {
    const s = sessionRef.current;
    if (!s) return;
    const msgs = [...s.messages];
    while (msgs.length && msgs[msgs.length - 1].role === "assistant") msgs.pop();
    while (msgs.length && msgs[msgs.length - 1].role === "user") msgs.pop();
    const updated = { ...s, messages: msgs, updatedAt: Date.now() };
    persist(updated);
    sessionRef.current = updated;
  }

  function startScene() {
    const s = sessionRef.current;
    if (!s) return;
    const techPrompt = openingPrompt(s.scenarioSnapshot, s.characters, language);
    sendMessage(techPrompt);
  }

  function stop() {
    abortRef.current?.abort();
  }



  if (!session || !profile) {
    return (
      <Shell>
        <div className="text-muted animate-pulse-soft">
          {language === "hi" ? "सेशन लोड हो रहा है…" : "Loading session…"}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/sessions"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
              aria-label="Back to sessions"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <input
                value={session.title}
                onChange={(e) =>
                  persist({ ...session, title: e.target.value })
                }
                className="bg-transparent border-0 outline-none text-xl sm:text-2xl font-semibold w-full max-w-xs focus:underline decoration-accent underline-offset-4"
              />
              {session.scenarioSnapshot?.tagline && (
                <p className="text-xs text-muted">
                  {session.scenarioSnapshot.tagline}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSidebar((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-card-border hover:border-accent text-sm transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {showSidebar
              ? (language === "hi" ? "छिपाएं" : "Hide")
              : (language === "hi" ? "सीन टूल्स" : "Scene tools")}
          </button>
        </div>

        <div
          className={`grid gap-4 ${
            showSidebar ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"
          }`}
        >
          <div className="bg-card border border-card-border rounded-2xl flex flex-col min-h-[60vh]">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {session.messages.length === 0 && !streaming && (
                <div className="text-center py-10 px-4">
                  <Flame className="w-8 h-8 text-accent-soft mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">
                    {language === "hi" ? "जब आप तैयार हों।" : "Ready when you are."}
                  </h3>
                  <p className="text-muted text-sm mb-5 max-w-sm mx-auto">
                    {language === "hi"
                      ? "Ember को सीन शुरू करने दें, या नीचे अपनी पहली बात लिखें।"
                      : "Let Ember open the scene for you, or write your own first move below."}
                  </p>
                  <button
                    type="button"
                    onClick={startScene}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-soft text-white font-medium transition-colors"
                  >
                    <Flame className="w-4 h-4" />
                    {language === "hi" ? "🔥 कहानी शुरू करो…" : "🔥 Start the scene…"}
                  </button>
                </div>
              )}

              {session.messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}

              {streaming && streamText && (
                <Bubble
                  message={{
                    id: "streaming",
                    role: "assistant",
                    content: streamText,
                    createdAt: 0,
                  }}
                  streaming
                />
              )}

              {streaming && !streamText && (
                <div className="text-muted text-sm animate-pulse-soft pl-1">
                  {language === "hi" ? "Ember लिख रहा है…" : "Ember is writing…"}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/40 text-red-200 rounded-xl p-3 text-sm">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" />
                    {language === "hi" ? "कुछ गलत हो गया" : "Something went wrong"}
                  </div>
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-card-border p-3 sm:p-4 space-y-3">
                {session.messages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        disabled={streaming}
                        onClick={() => sendMessage(a.text)}
                        className="text-xs px-2.5 py-1 rounded-md border border-card-border hover:border-accent text-muted hover:text-foreground transition-colors disabled:opacity-40"
                      >
                        {a.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={streaming || session.messages.length < 2}
                      onClick={regenerate}
                      className="text-xs px-2.5 py-1 rounded-md border border-card-border hover:border-accent text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" /> {language === "hi" ? "दोबारा लिखो" : "Rewrite"}
                    </button>
                    <button
                      type="button"
                      disabled={streaming || session.messages.length === 0}
                      onClick={continueLastResponse}
                      className="text-xs px-2.5 py-1 rounded-md border border-card-border hover:border-accent text-muted hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      {language === "hi" ? "आगे जारी" : "Continue"}
                    </button>
                    <button
                      type="button"
                      disabled={streaming || session.messages.length === 0}
                      onClick={undoLastExchange}
                      className="text-xs px-2.5 py-1 rounded-md border border-card-border hover:border-accent text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 disabled:opacity-40"
                    >
                      <Undo2 className="w-3 h-3" /> {language === "hi" ? "वापस" : "Undo"}
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder={language === "hi"
                      ? "फुसफुसाएं, बताएं, प्रतिक्रिया दें… (Enter भेजने के लिए)"
                      : "Whisper, narrate, react… (Enter to send)"}
                    rows={2}
                    className="flex-1 bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors resize-y text-sm"
                  />
                  {streaming ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="p-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                      aria-label="Stop"
                    >
                      <StopCircle className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="p-3 rounded-xl bg-accent hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                      aria-label="Send"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </form>
              </div>
          </div>

          {showSidebar && (
            <aside className="bg-card border border-card-border rounded-2xl p-4 space-y-5 self-start animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-accent-soft mb-2">
                  {language === "hi" ? "तीव्रता" : "Intensity"}
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={session.intensity}
                    onChange={(e) =>
                      persist({ ...session, intensity: Number(e.target.value) })
                    }
                    className="flex-1 accent-pink-500"
                  />
                  <span className="text-accent-soft font-mono w-8 text-center text-sm">
                    {session.intensity}/5
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {language === "hi"
                    ? "अगली कहानी में क्या दिखेगा, यह तय करता है।"
                    : "Adjusts what gets described next reply."}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-accent-soft mb-2">
                  {language === "hi" ? "मॉडल" : "Model"}
                </h3>
                <select
                  value={session.model}
                  onChange={(e) => persist({ ...session, model: e.target.value })}
                  className="w-full bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors text-sm"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-accent-soft mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {language === "hi" ? "किरदार" : "Characters"}
                </h3>
                <CharacterEditor
                  characters={session.characters}
                  onChange={(chars: Character[]) =>
                    persist({ ...session, characters: chars })
                  }
                />
              </div>

              {session.scenarioSnapshot && (
                <div>
                  <h3 className="text-sm font-semibold text-accent-soft mb-2">
                  {language === "hi" ? "परिदृश्य" : "Scenario"}
                </h3>
                  <p className="text-xs text-foreground/80 leading-relaxed mb-1">
                    <strong>{session.scenarioSnapshot.title}.</strong>{" "}
                    {session.scenarioSnapshot.premise}
                  </p>
                </div>
              )}


            </aside>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Bubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  // Hide raw steering prompts from the user.
  const isOpeningPrompt = isUser && isTechnicalOpeningPrompt(message.content);
  const displayContent = isOpeningPrompt ? "🔥 Starting the scene…" : message.content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-5 py-4 leading-relaxed text-[15px] ${
          isUser
            ? "bg-gradient-to-br from-accent/20 to-accent-soft/20 border border-accent/30 text-foreground rounded-br-sm shadow-sm"
            : "bg-gradient-to-br from-background/60 to-card/60 border border-card-border/60 text-foreground/95 rounded-bl-sm shadow-md"
        }`}
      >
        {!isUser && (
          <div className="text-[10px] uppercase tracking-widest text-accent-soft/80 mb-2 font-medium flex items-center gap-1.5">
            <Flame className="w-3 h-3" /> Ember
          </div>
        )}
        
        {isOpeningPrompt ? (
          <div className="whitespace-pre-wrap">{displayContent}</div>
        ) : (
          <div className="prose prose-invert prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0 prose-strong:text-accent-soft prose-strong:font-semibold prose-ul:my-2 prose-ul:pl-4 prose-li:my-1 prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
            <ReactMarkdown
            components={{
              h3: ({ ...props}) => <h3 className="text-lg text-accent-soft font-semibold mt-4 mb-2" {...props} />,
              strong: ({ ...props}) => <strong className="text-accent-soft font-bold" {...props} />,
              ul: ({ ...props}) => <ul className="space-y-1.5 my-3 pl-2" {...props} />,
              li: ({ ...props}) => <li className="flex gap-2 items-start before:content-['•'] before:text-accent-soft before:font-bold" {...props} />,
              p: ({ ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground/90" {...props} />,
            }}
          >
            {displayContent}
          </ReactMarkdown>
          </div>
        )}
        
        {streaming && <span className="inline-block w-2 h-4 ml-1 bg-accent-soft animate-pulse align-middle rounded-sm"></span>}
      </div>
    </div>
  );
}

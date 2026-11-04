"use client";

import ReactMarkdown from "react-markdown";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  StopCircle,
  ArrowLeft,
  Trash2,
} from "lucide-react";

import { Shell } from "@/components/Shell";
import { MODEL_OPTIONS, SEXCHAT_DEFAULT_MODEL, FAST_MODELS } from "@/lib/models";
import { buildSexChatSystemPrompt, sexChatGreeting } from "@/lib/sexchat-prompts";
import {
  getSexChatSession,
  saveSexChatSession,
  newId,
} from "@/lib/storage";
import type {
  ChatMessage,
  SexChatSession,
} from "@/lib/types";

const UI_TEXT = {
  en: {
    placeholder: "Type your message... (Enter to send)",
    typing: "typing...",
    clearChat: "Clear Chat",
    model: "Model",
    chatWith: "Chatting with",
  },
  hi: {
    placeholder: "अपना मेसेज टाइप करो... (Enter भेजने के लिए)",
    typing: "टाइप कर रहा/रही है...",
    clearChat: "चैट मिटाओ",
    model: "मॉडल",
    chatWith: "चैट कर रहे हो",
  },
  hinglish: {
    placeholder: "Apna message type karo... (Enter to send)",
    typing: "typing...",
    clearChat: "Chat Clear Karo",
    model: "Model",
    chatWith: "Chat kar rahe ho",
  },
};

async function readChatStream(
  payload: {
    model: string;
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature: number;
    max_tokens?: number;
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
    throw new Error((errBody as { error?: string }).error ?? `Request failed (${res.status})`);
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

export default function SexChatPlayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id;

  const [session, setSession] = useState<SexChatSession | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<SexChatSession | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const s = getSexChatSession(sessionId);
    if (!s) {
      router.replace("/sexchat");
      return;
    }
    const knownModels = MODEL_OPTIONS.map((m) => m.id);
    if (!knownModels.includes(s.model)) {
      s.model = SEXCHAT_DEFAULT_MODEL;
      saveSexChatSession(s);
    }
    // Backfill aiName for old sessions created before random names
    if (!s.aiName) {
      const fallbackNames: Record<string, Record<string, string>> = {
        male: { hi: "राज", en: "Raj", hinglish: "Raj" },
        female: { hi: "नेहा", en: "Neha", hinglish: "Neha" },
      };
      s.aiName = fallbackNames[s.aiGender]?.[s.chatLanguage] ?? (s.aiGender === "male" ? "Raj" : "Neha");
      saveSexChatSession(s);
    }
    // Auto-greet if no messages
    if (s.messages.length === 0) {
      const greeting = sexChatGreeting({
        userName: s.userName,
        aiName: s.aiName,
        aiGender: s.aiGender,
        chatLanguage: s.chatLanguage,
      });
      const greetingMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: greeting,
        createdAt: Date.now(),
      };
      const updated = { ...s, messages: [greetingMsg], updatedAt: Date.now() };
      saveSexChatSession(updated);
      // Hydrate from localStorage on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(updated);
      sessionRef.current = updated;
    } else {
      setSession(s);
      sessionRef.current = s;
    }
  }, [sessionId, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages.length, streamText]);

  const t = UI_TEXT[session?.chatLanguage ?? "en"] ?? UI_TEXT.en;

  const persist = useCallback((next: SexChatSession) => {
    setSession(next);
    saveSexChatSession(next);
    sessionRef.current = next;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const curr = sessionRef.current;
      if (!curr || !content.trim()) return;

      setError(null);
      setStreaming(true);
      setStreamText("");

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content,
        createdAt: Date.now(),
      };

      const withUser: SexChatSession = {
        ...curr,
        messages: [...curr.messages, userMessage],
        updatedAt: Date.now(),
      };
      persist(withUser);

      const systemPrompt = buildSexChatSystemPrompt({
        userName: curr.userName,
        userGender: curr.userGender,
        aiGender: curr.aiGender,
        aiName: curr.aiName,
        chatLanguage: curr.chatLanguage,
        messages: withUser.messages,
      });

      const requestMessages = [
        { role: "system" as const, content: systemPrompt },
        ...withUser.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      // Order: current model first, then fast models, then slow (reasoning) models
      const otherModels = MODEL_OPTIONS.map((m) => m.id).filter((id) => id !== curr.model);
      const fastFirst = [
        ...otherModels.filter((id) => FAST_MODELS.has(id)),
        ...otherModels.filter((id) => !FAST_MODELS.has(id)),
      ];
      const modelsToTry = [curr.model, ...fastFirst];

      let succeeded = false;

      for (const modelId of modelsToTry) {
        if (controller.signal.aborted) break;

        const payload = {
          model: modelId,
          messages: requestMessages,
          // Higher temperature keeps replies varied and human — avoids the
          // model falling into the same repetitive phrasing every message.
          temperature: 0.95,
          max_tokens: 512,
        };

        try {
          setStreamText("");
          const finalText = await readChatStream(payload, controller.signal, setStreamText);

          // Short human replies ("hmm", "aur?") are valid — only skip empty ones.
          if (!finalText || !finalText.trim()) {
            continue;
          }

          const assistantMsg: ChatMessage = {
            id: newId(),
            role: "assistant",
            content: finalText,
            createdAt: Date.now(),
          };

          const updated: SexChatSession = {
            ...withUser,
            messages: [...withUser.messages, assistantMsg],
            model: modelId,
            updatedAt: Date.now(),
          };
          persist(updated);
          succeeded = true;
          break;
        } catch (err) {
          if ((err as Error).name === "AbortError") break;
          continue;
        }
      }

      if (!succeeded && !controller.signal.aborted) {
        setError("All models failed. Please try again.");
      }

      setStreaming(false);
      setStreamText("");
      abortRef.current = null;
    },
    [persist],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleClearChat = () => {
    const curr = sessionRef.current;
    if (!curr) return;
    const greeting = sexChatGreeting({
      userName: curr.userName,
      aiName: curr.aiName,
      aiGender: curr.aiGender,
      chatLanguage: curr.chatLanguage,
    });
    const greetingMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: greeting,
      createdAt: Date.now(),
    };
    const updated: SexChatSession = {
      ...curr,
      messages: [greetingMsg],
      updatedAt: Date.now(),
    };
    persist(updated);
  };

  if (!session) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted animate-pulse">Loading...</div>
        </div>
      </Shell>
    );
  }

  const aiDisplayName = session.aiName;

  const aiAvatar = session.aiGender === "male" ? "🧑" : "👩";

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
          <div className="flex items-center gap-3">
            <Link href="/sexchat" className="text-muted hover:text-accent-soft transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{aiAvatar}</span>
              <div>
                <h2 className="font-semibold text-foreground">{aiDisplayName}</h2>
                <p className="text-xs text-green-400">
                  {streaming ? t.typing : "online"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title={t.clearChat}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent/20 border border-accent/30 text-foreground rounded-br-md"
                    : "bg-card/80 border border-card-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{aiAvatar}</span>
                    <span className="text-xs font-medium text-accent-soft">{aiDisplayName}</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className="text-[10px] text-muted mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streaming && streamText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-card/80 border border-card-border text-foreground rounded-bl-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{aiAvatar}</span>
                  <span className="text-xs font-medium text-accent-soft">{aiDisplayName}</span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{streamText}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {streaming && !streamText && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-card/80 border border-card-border rounded-bl-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{aiAvatar}</span>
                  <span className="text-xs text-accent-soft">{t.typing}</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-2 text-sm">
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-accent/20 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 bg-background/60 border border-card-border rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none text-sm"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          {streaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-accent/20 text-accent-soft hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </Shell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { deleteSession, getSessions } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { Flame, Trash2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const t_en = {
  title: "Saved sessions",
  subtitle: "Every story you start is saved here. Resume anywhere it left off.",
  empty: "No sessions yet.",
  startFirst: "Start your first story",
  resume: "Resume",
  deleteConfirm: "Delete this session? This can't be undone.",
  message: "message",
  messages: "messages",
  lastTouched: "last touched",
};

const t_hi = {
  title: "सेव किए गए सेशन",
  subtitle: "आपकी हर कहानी यहाँ सेव होती है। जहाँ छोड़ा था वहीं से आगे बढ़ाएं।",
  empty: "अभी कोई सेशन नहीं।",
  startFirst: "पहली कहानी शुरू करें",
  resume: "जारी रखें",
  deleteConfirm: "क्या आप यह सेशन मिटाना चाहते हैं? यह वापस नहीं होगा।",
  message: "संदेश",
  messages: "संदेश",
  lastTouched: "आखिरी बार",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { language } = useLanguage();
  const t = language === "hi" ? t_hi : t_en;

  useEffect(() => {
    queueMicrotask(() => setSessions(getSessions()));
  }, []);

  function remove(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    deleteSession(id);
    setSessions(getSessions());
  }

  return (
    <Shell>
      <div className="animate-fade-in">
        <div className="relative w-full h-48 sm:h-56 rounded-[2rem] overflow-hidden mb-8 shadow-2xl shadow-accent/10 border border-accent/20 group">
          <div className="absolute inset-0 bg-[url('/sensual-4.svg')] bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="relative z-10 p-6 sm:p-10 h-full flex flex-col justify-end">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 drop-shadow-lg mb-2">
              {t.title}
            </h1>
            <p className="text-foreground/90 text-sm sm:text-base leading-relaxed drop-shadow-md font-medium max-w-xl">
              {t.subtitle}
            </p>
          </div>
        </div>

        {sessions.length === 0 && (
          <div className="bg-card/60 backdrop-blur-sm border border-card-border rounded-2xl p-8 text-center">
            <Flame className="w-8 h-8 mx-auto text-accent-soft mb-3" />
            <p className="text-foreground/85 mb-4">{t.empty}</p>
            <Link
              href="/scenarios"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-soft text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
            >
              {t.startFirst} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-card/60 backdrop-blur-sm border border-card-border hover:border-accent/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-accent-soft truncate">
                  {s.title}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {s.messages.length} {s.messages.length === 1 ? t.message : t.messages} • {t.lastTouched}{" "}
                  {new Date(s.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/play/${s.id}`}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-soft text-white text-sm font-medium transition-all hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                >
                  {t.resume}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-background/40 transition-colors"
                  aria-label="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

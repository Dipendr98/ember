"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { DEFAULT_MODEL } from "@/lib/models";
import { newId, saveSexChatSession } from "@/lib/storage";
import type { ChatLanguage, SexChatSession, UserGender } from "@/lib/types";
import { MessageCircleHeart, Flame } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const content = {
  en: {
    title: "AI Sex Chat",
    subtitle: "Chat intimately with an AI partner. Pick your gender, choose who you want to chat with, and start your private conversation.",
    yourName: "Your Name",
    yourGender: "I am a...",
    male: "Boy (Ladka)",
    female: "Girl (Ladki)",
    chatWith: "I want to chat with a...",
    chatWithMale: "Boy (Ladka) 🧑",
    chatWithFemale: "Girl (Ladki) 👩",
    language: "Chat Language",
    langEn: "English",
    langHi: "हिंदी (Hindi)",
    langHinglish: "Hinglish",
    startBtn: "Start Chatting 🔥",
    privacy: "100% private. Everything stays in your browser.",
  },
  hi: {
    title: "AI सेक्स चैट",
    subtitle: "AI पार्टनर के साथ इंटिमेट चैट करो। अपना gender चुनो, किससे चैट करना है वो चुनो, और शुरू करो।",
    yourName: "आपका नाम",
    yourGender: "मैं हूँ...",
    male: "लड़का",
    female: "लड़की",
    chatWith: "मैं चैट करना चाहता/चाहती हूँ...",
    chatWithMale: "लड़के से 🧑",
    chatWithFemale: "लड़की से 👩",
    language: "चैट की भाषा",
    langEn: "English",
    langHi: "हिंदी",
    langHinglish: "Hinglish",
    startBtn: "चैट शुरू करो 🔥",
    privacy: "100% प्राइवेट। सब कुछ आपके ब्राउज़र में रहता है।",
  },
  hinglish: {
    title: "AI Sex Chat",
    subtitle: "AI partner ke saath intimate chat karo. Apna gender chuno, kisse chat karna hai wo chuno, aur shuru karo.",
    yourName: "Tumhara Naam",
    yourGender: "Main hoon...",
    male: "Ladka 🧑",
    female: "Ladki 👩",
    chatWith: "Main chat karna chahta/chahti hoon...",
    chatWithMale: "Ladke se 🧑",
    chatWithFemale: "Ladki se 👩",
    language: "Chat ki Language",
    langEn: "English",
    langHi: "हिंदी (Hindi)",
    langHinglish: "Hinglish",
    startBtn: "Chat Shuru Karo 🔥",
    privacy: "100% private. Sab kuch tumhare browser mein rehta hai.",
  },
};

export default function SexChatSetupPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = content[language] || content.en;

  const [userName, setUserName] = useState("");
  const [userGender, setUserGender] = useState<UserGender | null>(null);
  const [aiGender, setAiGender] = useState<UserGender | null>(null);
  const [chatLanguage, setChatLanguage] = useState<ChatLanguage>(
    language === "hinglish" ? "hinglish" : language === "hi" ? "hi" : "en"
  );

  function startChat() {
    if (!userName.trim() || !userGender || !aiGender) return;

    const session: SexChatSession = {
      id: newId(),
      userName: userName.trim(),
      userGender,
      aiGender,
      chatLanguage,
      model: DEFAULT_MODEL,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSexChatSession(session);
    router.push(`/sexchat/${session.id}`);
  }

  const canStart = userName.trim() && userGender && aiGender;

  return (
    <Shell>
      <div className="animate-fade-in max-w-2xl mx-auto">
        {/* Hero */}
        <div className="relative w-full rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-accent/20 border border-accent/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 via-purple-900/30 to-background" />
          <div className="relative z-10 p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent/20 backdrop-blur-md rounded-xl border border-accent/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <MessageCircleHeart className="w-8 h-8 text-accent-soft" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
                {t.title}
              </h1>
            </div>
            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div className="sexy-card rounded-2xl p-6">
            <label className="block text-sm font-medium text-accent-soft mb-3">
              {t.yourName}
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t.yourName}
              className="w-full bg-background/60 border border-card-border rounded-xl px-5 py-4 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner text-lg"
            />
          </div>

          {/* Your Gender */}
          <div className="sexy-card rounded-2xl p-6">
            <label className="block text-sm font-medium text-accent-soft mb-3">
              {t.yourGender}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserGender("male");
                  if (!aiGender) setAiGender("female");
                }}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                  userGender === "male"
                    ? "border-accent bg-accent/20 text-accent-soft shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                    : "border-card-border hover:border-accent/50 text-foreground/70"
                }`}
              >
                🧑 {t.male}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserGender("female");
                  if (!aiGender) setAiGender("male");
                }}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                  userGender === "female"
                    ? "border-accent bg-accent/20 text-accent-soft shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                    : "border-card-border hover:border-accent/50 text-foreground/70"
                }`}
              >
                👩 {t.female}
              </button>
            </div>
          </div>

          {/* Chat With */}
          <div className="sexy-card rounded-2xl p-6">
            <label className="block text-sm font-medium text-accent-soft mb-3">
              {t.chatWith}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAiGender("male")}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                  aiGender === "male"
                    ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : "border-card-border hover:border-blue-500/50 text-foreground/70"
                }`}
              >
                {t.chatWithMale}
              </button>
              <button
                type="button"
                onClick={() => setAiGender("female")}
                className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                  aiGender === "female"
                    ? "border-pink-500 bg-pink-500/20 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                    : "border-card-border hover:border-pink-500/50 text-foreground/70"
                }`}
              >
                {t.chatWithFemale}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="sexy-card rounded-2xl p-6">
            <label className="block text-sm font-medium text-accent-soft mb-3">
              {t.language}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["en", "hi", "hinglish"] as ChatLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setChatLanguage(lang)}
                  className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                    chatLanguage === lang
                      ? "border-accent bg-accent/20 text-accent-soft shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                      : "border-card-border hover:border-accent/50 text-foreground/70"
                  }`}
                >
                  {lang === "en" ? t.langEn : lang === "hi" ? t.langHi : t.langHinglish}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={startChat}
            disabled={!canStart}
            className={`w-full flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-lg font-semibold transition-all ${
              canStart
                ? "sexy-btn cursor-pointer"
                : "bg-card border border-card-border text-muted cursor-not-allowed"
            }`}
          >
            <Flame className="w-5 h-5" />
            {t.startBtn}
          </button>

          {/* Privacy note */}
          <p className="text-center text-xs text-muted">
            🔒 {t.privacy}
          </p>
        </div>
      </div>
    </Shell>
  );
}

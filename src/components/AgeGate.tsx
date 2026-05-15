"use client";

import { useEffect, useState } from "react";
import { getAgeConfirmed, setAgeConfirmed } from "@/lib/storage";
import { useLanguage } from "./LanguageContext";

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // One-time hydration from localStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmed(getAgeConfirmed());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted text-sm animate-pulse-soft">
          {language === "hi" ? "लोड हो रहा है…" : "Loading…"}
        </div>
      </div>
    );
  }

  if (confirmed) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-card border border-card-border rounded-2xl p-8 shadow-2xl animate-fade-in">
        <h1 className="text-2xl font-semibold text-accent-soft mb-3">
          {language === "hi" ? "Ember सिर्फ बड़ों के लिए है।" : "Ember is for adults."}
        </h1>
        <p className="text-foreground/85 leading-relaxed mb-4">
          {language === "hi"
            ? "यह ऐप consenting partners के लिए adult romantic role-play stories बनाता है। आगे बढ़कर, आप पुष्टि करते हैं कि:"
            : "This app generates adult romantic role-play content for consenting partners. By continuing, you confirm that:"}
        </p>
        <ul className="text-foreground/75 text-sm space-y-1.5 mb-6 list-disc pl-5">
          <li>
            {language === "hi"
              ? <>आपकी उम्र <strong>18 साल या उससे ज़्यादा</strong> है।</>
              : <>You are <strong>18 years or older</strong>.</>}
          </li>
          <li>
            {language === "hi"
              ? "आप इसे अपने पार्टनर की जानकारी के साथ, प्राइवेट में इस्तेमाल कर रहे हैं।"
              : "You are using this privately, with your partner's knowledge."}
          </li>
          <li>
            {language === "hi"
              ? "जो भी बनता है वह काल्पनिक है। आप एक-दूसरे के सेफ वर्ड और सीमाओं का सम्मान करेंगे।"
              : "Anything generated is fiction. You will honor each other's safe word and hard limits."}
          </li>
        </ul>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setAgeConfirmed(true);
              setConfirmed(true);
            }}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-soft text-white font-medium transition-colors"
          >
            {language === "hi" ? "मैं 18+ हूँ — अंदर जाने दो" : "I'm 18+ — let me in"}
          </button>
          <a
            href="https://www.google.com"
            className="w-full py-3 rounded-xl border border-card-border text-muted hover:text-foreground text-center text-sm transition-colors"
          >
            {language === "hi" ? "मुझे कहीं और ले जाओ" : "Take me somewhere else"}
          </a>
        </div>
      </div>
    </div>
  );
}

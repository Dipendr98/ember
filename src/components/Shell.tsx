"use client";

import { Nav } from "./Nav";
import { useLanguage } from "./LanguageContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  return (
    <>
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>
      <footer className="text-center text-xs text-muted/60 py-6 px-4 border-t border-accent/10">
        <span className="inline-flex items-center gap-1">
          <span className="text-accent-soft">🔥</span>
          {language === "hi"
            ? " प्राइवेट। आप जो भी लिखते हैं वह सिर्फ आपके ब्राउज़र में रहता है।"
            : " Private. Everything you write stays in your browser."}
          <span className="text-accent-soft">💋</span>
        </span>
      </footer>
    </>
  );
}

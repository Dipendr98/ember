"use client";

import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "hi";
  const saved = localStorage.getItem("ember.language") as Language | null;
  if (saved === "en" || saved === "hi") return saved;
  return "hi";
};

const LanguageContext = createContext<LanguageContextType>({
  language: "hi",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("ember.language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
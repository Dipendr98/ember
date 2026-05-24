"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { BUILTIN_SCENARIOS } from "@/lib/scenarios";
import { getProfile, newId, saveSession } from "@/lib/storage";
import type { Character, Scenario, Session } from "@/lib/types";
import { Flame, Plus, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const content_en = {
  title: "Pick a scenario",
  subtitle: "A starting point for tonight. You can twist it however you want once you're inside.",
  blank: "Blank / improvise",
  custom: "Custom scenario",
  writeOwn: "Write your own",
  customTitle: "Title (e.g. The Last Train Home)",
  customPremise: "Premise — describe the setting, the characters, what's about to happen…",
  customVibes: "Vibes (comma-separated, e.g. slow-burn, power-play, public)",
  begin: "Begin",
  setting: "Setting:",
  premise: "Premise:",
  suggestedCharacters: "Suggested characters:",
  moreDetails: "More details",
  hideDetails: "Hide details",
  start: "Start",
};

const content_hi = {
  title: "एक परिदृश्य चुनें",
  subtitle: "आज रात के लिए एक शुरुआत। अंदर जाने के बाद आप इसे जैसे चाहें मोड़ सकते हैं।",
  blank: "खाली / इम्प्रोवाइज",
  custom: "कस्टम परिदृश्य",
  writeOwn: "अपना स्वयं का लिखें",
  customTitle: "शीर्षक (उदा. घर के लिए आखिरी ट्रेन)",
  customPremise: "आधार — सेटिंग, पात्रों और क्या होने वाला है, इसका वर्णन करें…",
  customVibes: "वाइब्स (अल्पविराम से अलग, उदा. धीमा-दहन, शक्ति-प्रदर्शन, सार्वजनिक)",
  begin: "शुरू करें",
  setting: "सेटिंग:",
  premise: "आधार:",
  suggestedCharacters: "सुझाए गए चरित्र:",
  moreDetails: "और विवरण",
  hideDetails: "विवरण छिपाएं",
  start: "शुरू करें",
};

export default function ScenariosPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = language === "hi" ? content_hi : content_en;
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPremise, setCustomPremise] = useState("");
  const [customVibes, setCustomVibes] = useState("");

  function startScenario(scenario: Scenario, characters: Character[]) {
    const profile = getProfile();
    const session: Session = {
      id: newId(),
      title: scenario.title,
      scenarioId: scenario.id,
      scenarioSnapshot: scenario,
      characters,
      intensity: profile.defaultIntensity,
      model: profile.preferredModel,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
    router.push(`/play/${session.id}`);
  }

  function startBlank() {
    const profile = getProfile();
    const session: Session = {
      id: newId(),
      title: "Free play",
      scenarioId: null,
      scenarioSnapshot: null,
      characters: [],
      intensity: profile.defaultIntensity,
      model: profile.preferredModel,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
    router.push(`/play/${session.id}`);
  }

  function startCustom() {
    const profile = getProfile();
    const scenario: Scenario = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || "Untitled",
      tagline: "",
      setting: "",
      premise: customPremise.trim(),
      vibes: customVibes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      suggestedCharacters: [],
    };
    const session: Session = {
      id: newId(),
      title: scenario.title,
      scenarioId: scenario.id,
      scenarioSnapshot: scenario,
      characters: [],
      intensity: profile.defaultIntensity,
      model: profile.preferredModel,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
    router.push(`/play/${session.id}`);
  }

  return (
    <Shell>
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="relative w-full h-48 sm:h-64 rounded-[2rem] overflow-hidden mb-8 shadow-2xl shadow-accent/20 border border-accent/30 neon-border-strong group">
          <div className="absolute inset-0 bg-[url('/sensual-5.svg')] bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

          <div className="relative z-10 p-6 sm:p-10 h-full flex flex-col justify-end">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight gradient-text mb-2 drop-shadow-lg">
              {t.title}
            </h1>
            <p className="text-foreground/90 text-sm sm:text-base leading-relaxed drop-shadow-md font-medium max-w-xl">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-end mb-6 flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startBlank}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-card-border hover:border-accent text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" /> {t.blank}
            </button>
            <button
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-accent-soft text-white text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.custom}
            </button>
          </div>
        </div>

        {showCustom && (
          <div className="bg-card border border-card-border rounded-2xl p-5 mb-6 animate-fade-in">
            <h2 className="text-accent-soft font-semibold mb-3">
              {t.writeOwn}
            </h2>
            <div className="space-y-3">
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={t.customTitle}
                className="w-full bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
              />
              <textarea
                value={customPremise}
                onChange={(e) => setCustomPremise(e.target.value)}
                placeholder={t.customPremise}
                rows={4}
                className="w-full bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors resize-y"
              />
              <input
                value={customVibes}
                onChange={(e) => setCustomVibes(e.target.value)}
                placeholder={t.customVibes}
                className="w-full bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!customPremise.trim()}
                  onClick={startCustom}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  <Flame className="w-4 h-4" /> {t.begin}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {BUILTIN_SCENARIOS.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={startScenario} language={language} t={t} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ScenarioCard({
  scenario,
  onStart,
  language,
  t,
}: {
  scenario: Scenario;
  onStart: (s: Scenario, chars: Character[]) => void;
  language: string;
  t: typeof content_en;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHindi = language === "hi";
  const title = isHindi && scenario.title_hi ? scenario.title_hi : scenario.title;
  const tagline = isHindi && scenario.tagline_hi ? scenario.tagline_hi : scenario.tagline;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 flex flex-col">
      <h3 className="text-lg font-semibold text-accent-soft mb-1">
        {title}
      </h3>
      <p className="text-foreground/85 text-sm mb-2">{tagline}</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {scenario.vibes.map((v) => (
          <span
            key={v}
            className="text-xs px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-accent-soft"
          >
            {v}
          </span>
        ))}
      </div>
      {expanded && (
        <div className="text-sm text-foreground/75 space-y-2 mb-3 animate-fade-in">
          <p>
            <span className="text-muted">{t.setting}</span> {scenario.setting}
          </p>
          <p>
            <span className="text-muted">{t.premise}</span> {scenario.premise}
          </p>
          {scenario.suggestedCharacters.length > 0 && (
            <div>
              <p className="text-muted mb-1">{t.suggestedCharacters}</p>
              <ul className="space-y-1 pl-3">
                {scenario.suggestedCharacters.map((c) => (
                  <li key={c.id} className="text-xs">
                    <strong>{c.name}</strong> — {c.role}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          {expanded ? t.hideDetails : t.moreDetails}
        </button>
        <button
          type="button"
          onClick={() => onStart(scenario, scenario.suggestedCharacters)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-soft text-white text-sm font-medium transition-colors"
        >
          <Flame className="w-4 h-4" /> {t.start}
        </button>
      </div>
    </div>
  );
}

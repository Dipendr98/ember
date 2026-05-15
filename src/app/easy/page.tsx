"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { BUILTIN_SCENARIOS } from "@/lib/scenarios";
import { DEFAULT_MODEL } from "@/lib/models";
import { getProfile, saveProfile, newId, saveSession } from "@/lib/storage";
import type { Character, Scenario, Session, CoupleProfile } from "@/lib/types";
import { Zap, Flame } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const content_en = {
  title: "Start now",
  subtitle: "Bypass the long setup. Enter your names and pick a scenario. We'll handle the rest with fast, private settings.",
  partnerA: "Your Name",
  partnerB: "Partner's Name",
  pickScenario: "Pick a scenario",
  startBtn: "Start",
  moreDetails: "More details",
  hideDetails: "Hide details",
  setting: "Setting:",
  premise: "Premise:",
  suggestedCharacters: "Suggested characters:",
};

const content_hi = {
  title: "अभी शुरू करें",
  subtitle: "लंबे सेटअप को छोड़ें। अपने नाम दर्ज करें और एक परिदृश्य चुनें। हम fast, private settings के साथ बाकी काम संभाल लेंगे।",
  partnerA: "आपका नाम",
  partnerB: "पार्टनर का नाम",
  pickScenario: "एक परिदृश्य चुनें",
  startBtn: "शुरू करें",
  moreDetails: "और विवरण",
  hideDetails: "विवरण छिपाएं",
  setting: "सेटिंग:",
  premise: "आधार:",
  suggestedCharacters: "सुझाए गए चरित्र:",
};

export default function EasyModePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = language === "hi" ? content_hi : content_en;

  const [partnerA, setPartnerA] = useState("");
  const [partnerB, setPartnerB] = useState("");

  function startScenario(scenario: Scenario, characters: Character[]) {
    // Override profile with easy mode defaults
    const profile = getProfile();
    const updatedProfile: CoupleProfile = {
      ...profile,
      partnerA: { ...profile.partnerA, name: partnerA || "Partner A" },
      partnerB: { ...profile.partnerB, name: partnerB || "Partner B" },
      defaultIntensity: 5,
      preferredModel: DEFAULT_MODEL,
    };
    saveProfile(updatedProfile);

    const session: Session = {
      id: newId(),
      title: scenario.title,
      scenarioId: scenario.id,
      scenarioSnapshot: scenario,
      characters,
      intensity: 5,
      model: DEFAULT_MODEL,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
    router.push(`/play/${session.id}`);
  }

  return (
    <Shell>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-accent/20 border border-accent/20 group">
          <div className="absolute inset-0 bg-[url('/sensual-bg.png')] bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105 opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          
          <div className="relative z-10 p-6 sm:p-10 h-full flex flex-col justify-end max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-accent/20 backdrop-blur-md rounded-xl border border-accent/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <Zap className="w-6 h-6 text-accent-soft" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 drop-shadow-lg">
                {t.title}
              </h1>
            </div>
            <p className="text-foreground/90 text-sm sm:text-base leading-relaxed drop-shadow-md font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-sm border border-card-border hover:border-accent/40 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row gap-5 shadow-xl transition-colors">
          <input
            value={partnerA}
            onChange={(e) => setPartnerA(e.target.value)}
            placeholder={t.partnerA}
            className="flex-1 bg-background/60 border border-card-border rounded-xl px-5 py-4 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner text-lg"
          />
          <input
            value={partnerB}
            onChange={(e) => setPartnerB(e.target.value)}
            placeholder={t.partnerB}
            className="flex-1 bg-background/60 border border-card-border rounded-xl px-5 py-4 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner text-lg"
          />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-accent-soft">{t.pickScenario}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {BUILTIN_SCENARIOS.map((s) => (
            <ScenarioCard 
              key={s.id} 
              scenario={s} 
              onStart={startScenario} 
              language={language}
              t={t}
            />
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
  language: "en" | "hi";
  t: typeof content_en;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = language === "hi" && scenario.title_hi ? scenario.title_hi : scenario.title;
  const tagline = language === "hi" && scenario.tagline_hi ? scenario.tagline_hi : scenario.tagline;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 flex flex-col">
      <h3 className="text-lg font-semibold text-accent-soft mb-1">{title}</h3>
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
          <Flame className="w-4 h-4" /> {t.startBtn}
        </button>
      </div>
    </div>
  );
}

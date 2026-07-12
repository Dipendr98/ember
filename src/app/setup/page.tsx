"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { ChipInput } from "@/components/ChipInput";
import { DEFAULT_PROFILE, getProfile, saveProfile } from "@/lib/storage";
import type { CoupleProfile, Pronouns } from "@/lib/types";
import { Save, RotateCcw, Check } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const PRONOUN_OPTIONS: Pronouns[] = ["she/her", "he/him", "they/them", "other"];

const t_en = {
  title: "Couple profile",
  subtitle: "Everything here is saved only in your browser. It shapes every story so Ember knows you and your partner.",
  partnerA: "Partner A",
  partnerB: "Partner B",
  namePlaceholder: "Name (or alias)",
  customPronounsPlaceholder: "Custom pronouns",
  relationshipStyle: "Relationship style",
  relationshipPlaceholder: "e.g. married 6 years, playful, exploring kink together",
  loves: "Loves / yes-list",
  lovesHint: "What you both already love and want to see more of.",
  curious: "Curious about",
  curiousHint: "Things you'd like to explore in fiction. Ember will weave these in gently.",
  intensity: "Default intensity",
  intensityHint: "You can change this any time inside a scene.",
  intensityScale: "1 = slow-burn teasing • 5 = maximum heat",
  reset: "Reset",
  resetConfirm: "Reset your couple profile to defaults?",
  saved: "Saved",
  saveProfile: "Save profile",
  chipPlaceholder: "Type and press Enter…",
};

const t_hi = {
  title: "कपल प्रोफाइल",
  subtitle: "यहाँ सब कुछ सिर्फ आपके ब्राउज़र में सेव होता है। यह हर कहानी के लिए Ember को आपकी और आपके पार्टनर की जानकारी देता है।",
  partnerA: "पार्टनर A",
  partnerB: "पार्टनर B",
  namePlaceholder: "नाम (या उपनाम)",
  customPronounsPlaceholder: "अपने सर्वनाम लिखें",
  relationshipStyle: "रिश्ते का अंदाज़",
  relationshipPlaceholder: "उदा. 6 साल से शादीशुदा, मस्ती-भरा, साथ में नई चीज़ें आज़मा रहे",
  loves: "पसंद / हाँ-लिस्ट",
  lovesHint: "जो आप दोनों को पहले से पसंद है और जो आप और देखना चाहते हैं।",
  curious: "जानने को उत्सुक",
  curiousHint: "जो चीज़ें आप कहानी में आज़माना चाहते हैं। Ember इन्हें धीरे-धीरे शामिल करेगा।",
  intensity: "डिफ़ॉल्ट तीव्रता",
  intensityHint: "आप इसे किसी भी सीन में बदल सकते हैं।",
  intensityScale: "1 = slow-burn • 5 = maximum heat",
  reset: "रीसेट",
  resetConfirm: "क्या आप कपल प्रोफ़ाइल को डिफ़ॉल्ट पर रीसेट करना चाहते हैं?",
  saved: "सेव हो गया",
  saveProfile: "प्रोफ़ाइल सेव करें",
  chipPlaceholder: "टाइप करें और Enter दबाएं…",
};

export default function SetupPage() {
  const [profile, setProfile] = useState<CoupleProfile>(DEFAULT_PROFILE);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const { language } = useLanguage();
  const t = language === "hi" ? t_hi : t_en;

  useEffect(() => {
    queueMicrotask(() => setProfile(getProfile()));
  }, []);

  function update<K extends keyof CoupleProfile>(key: K, value: CoupleProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function save() {
    saveProfile(profile);
    setSavedAt(Date.now());
  }

  function reset() {
    if (!confirm(t.resetConfirm)) return;
    const def = DEFAULT_PROFILE;
    setProfile(def);
    saveProfile(def);
  }

  return (
    <Shell>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="relative w-full h-56 sm:h-72 rounded-[2rem] overflow-hidden mb-8 shadow-2xl shadow-accent/10 border border-accent/20 group">
          <div className="absolute inset-0 bg-[url('/sensual-3.svg')] bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105" />
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

        <div className="space-y-6">
          <PartnerCard
            label={t.partnerA}
            value={profile.partnerA}
            onChange={(p) => update("partnerA", p)}
            t={t}
          />
          <PartnerCard
            label={t.partnerB}
            value={profile.partnerB}
            onChange={(p) => update("partnerB", p)}
            t={t}
          />

          <Section title={t.relationshipStyle}>
            <input
              value={profile.relationshipStyle}
              onChange={(e) => update("relationshipStyle", e.target.value)}
              placeholder={t.relationshipPlaceholder}
              className="w-full bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
            />
          </Section>

          <Section title={t.loves} hint={t.lovesHint}>
            <ChipInput
              values={profile.loves}
              onChange={(v) => update("loves", v)}
              placeholder={t.chipPlaceholder}
            />
          </Section>

          <Section title={t.curious} hint={t.curiousHint}>
            <ChipInput
              values={profile.curious}
              onChange={(v) => update("curious", v)}
              placeholder={t.chipPlaceholder}
            />
          </Section>

          <Section title={t.intensity} hint={t.intensityHint}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={profile.defaultIntensity}
                onChange={(e) => update("defaultIntensity", Number(e.target.value))}
                className="flex-1 accent-pink-500"
              />
              <span className="text-accent-soft font-mono w-8 text-center">
                {profile.defaultIntensity}/5
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {t.intensityScale}
            </p>
          </Section>

        </div>

        <div className="sticky bottom-4 mt-10 flex items-center justify-between gap-3 bg-card/95 backdrop-blur border border-card-border rounded-2xl p-3 shadow-lg">
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-background/40 transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> {t.reset}
          </button>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="text-xs text-accent-soft inline-flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> {t.saved}
              </span>
            )}
            <button
              type="button"
              onClick={save}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-soft text-white font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {t.saveProfile}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground/90 mb-1">
        {title}
      </label>
      {hint && <p className="text-xs text-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function PartnerCard({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: CoupleProfile["partnerA"];
  onChange: (p: CoupleProfile["partnerA"]) => void;
  t: typeof t_en;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 sm:p-5">
      <h3 className="text-accent-soft font-medium mb-3">{label}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder={t.namePlaceholder}
          className="bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
        />
        <select
          value={value.pronouns}
          onChange={(e) =>
            onChange({ ...value, pronouns: e.target.value as Pronouns })
          }
          className="bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
        >
          {PRONOUN_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {value.pronouns === "other" && (
          <input
            value={value.customPronouns ?? ""}
            onChange={(e) =>
              onChange({ ...value, customPronouns: e.target.value })
            }
            placeholder={t.customPronounsPlaceholder}
            className="sm:col-span-2 bg-background/40 border border-card-border rounded-xl px-3 py-2 outline-none focus:border-accent transition-colors"
          />
        )}
      </div>
    </div>
  );
}

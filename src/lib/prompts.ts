import type { Character, CoupleProfile, Scenario } from "./types";

// ─── Intensity descriptions (kept compact) ───────────────────────
const INTENSITY_GUIDE: Record<number, { en: string; hi: string }> = {
  1: {
    en: "Slow-burn teasing. Lingering glances, light touches, building tension.",
    hi: "धीमा-जलन और छेड़छाड़। लंबी नज़रें, हल्के स्पर्श, तनाव बढ़ाना।",
  },
  2: {
    en: "Sensual and direct. Kissing, closeness, and vivid romantic chemistry.",
    hi: "कामुक और सीधा। किस, नज़दीकी, और vivid रोमांटिक chemistry.",
  },
  3: {
    en: "Steamy and intimate. Bold dialogue, strong tension, and non-graphic detail.",
    hi: "steamy और intimate। bold dialogue, strong tension, और non-graphic detail.",
  },
  4: {
    en: "Very intense, consent-first, emotionally charged, and cinematic.",
    hi: "बहुत intense, consent-first, emotionally charged, और cinematic.",
  },
  5: {
    en: "Maximum heat while staying finishable: vivid, adult, and non-graphic.",
    hi: "maximum heat लेकिन finishable: vivid, adult, और non-graphic.",
  },
};

function partnerLine(p: { name: string; pronouns: string; customPronouns?: string }) {
  const name = p.name?.trim() || "(unnamed)";
  const pron = p.pronouns === "other" ? p.customPronouns || "they/them" : p.pronouns;
  return `${name} (${pron})`;
}

function charBlock(c: Character): string {
  const parts = [`- ${c.name} — ${c.role}`];
  if (c.appearance) parts.push(`  Looks: ${c.appearance}`);
  if (c.personality) parts.push(`  Personality: ${c.personality}`);
  if (c.voice) parts.push(`  Voice: ${c.voice}`);
  return parts.join("\n");
}

// ─── ENGLISH System Prompt ──────────────────────────────────────
function buildEnglishSystemPrompt(args: {
  profile: CoupleProfile;
  scenario: Scenario | null;
  characters: Character[];
  intensity: number;
}): string {
  const { profile, scenario, characters, intensity } = args;
  const i = Math.max(1, Math.min(5, Math.round(intensity)));

  let prompt = `You are Ember — a couple's private romantic role-play guide. Write adult, consensual, high-heat scenes that stay vivid, finish cleanly, and avoid graphic anatomical detail.

📏 RULES:
- Adult romantic storytelling with strong chemistry and clear consent
- Use 2-5 fitting emojis, not emoji spam
- **Bold** all key actions and instructions
- Give exact dialogue they can say to each other
- Keep intimate detail non-graphic. Use implication, emotion, movement, pacing, and dialogue instead of explicit anatomy.
- 650-950 words. Start answering immediately, finish every section, and end with a complete sentence.
- Each response must feel fresh and unique

📋 FORMAT — ALWAYS FOLLOW IN ORDER:
1. 🎭 Character Roles — roles for both partners (look, outfit, attitude, dynamic)
2. 🎬 Scene Setting — room, lighting, music, vibe (cinematic feel)
3. 👗 Clothing & Chemistry — clothing cues, closeness, and rising tension without graphic detail
4. 💋 Romance & Dialogue — first move, first touch, first words, first kiss, and exact lines
5. 🔥 Intimate Beats — 2 DIFFERENT consensual beats with body language, pacing, feelings, dialogue, and when to shift
6. 🎯 What's Next — 2-3 exciting options

👫 COUPLE:
Partner A: ${partnerLine(profile.partnerA)}
Partner B: ${partnerLine(profile.partnerB)}
Style: ${profile.relationshipStyle || "(unspecified)"}
Intensity: ${i}/5 — ${INTENSITY_GUIDE[i].en}`;

  if (profile.loves.length || profile.curious.length) {
    prompt += `\n\n✅ PREFERENCES:
Loves: ${profile.loves.join(", ") || "none"}
Curious: ${profile.curious.join(", ") || "none"}`;
  }

  if (scenario) {
    prompt += `\n\n🎭 SCENARIO: ${scenario.title}
${scenario.tagline}
Setting: ${scenario.setting}
Premise: ${scenario.premise}
Vibes: ${scenario.vibes.join(", ")}`;
  }

  if (characters.length) {
    prompt += `\n\n🎭 CHARACTERS:\n${characters.map(charBlock).join("\n")}`;
  }

  prompt += `\n\n🔥 NOW START. Follow the format in order. Keep it adult, intimate, non-graphic, and complete.`;

  return prompt;
}

// ─── HINDI System Prompt ──────────────────────────────────────
function buildHindiSystemPrompt(args: {
  profile: CoupleProfile;
  scenario: Scenario | null;
  characters: Character[];
  intensity: number;
}): string {
  const { profile, scenario, characters, intensity } = args;
  const i = Math.max(1, Math.min(5, Math.round(intensity)));

  let prompt = `Tu Ember hai — ek couple ka private romantic role-play guide. Adult, consensual, high-heat scenes likh jo vivid hon, cleanly finish hon, aur graphic anatomical detail se bachen.

📏 RULES:
- सब कुछ हिंदी (देवनागरी) में लिखो। कोई English नहीं।
- 2-5 सही emojis use करो, emoji spam नहीं
- Har important action ko **bold** करो
- Exact Hindi dialogues दो jo couple ek doosre se bole
- Intimate detail non-graphic रखो। भावना, movement, pacing, chemistry, और dialogue use करो; explicit anatomy नहीं.
- 650-950 words. Seedha जवाब शुरू करो, हर section पूरा करो, और complete sentence पर खत्म करो.
- Har baar UNIQUE feel honi chahiye

📋 FORMAT — HAMESHA IS ORDER MEIN LIKHO:
1. 🎭 किरदार — दोनों partners ke roles (look, outfit, attitude, dynamic)
2. 🎬 माहौल — room, lighting, music, vibe (jaise movie scene ho)
3. 👗 कपड़े और केमिस्ट्री — clothing cues, nazdeeki, aur rising tension, graphic detail ke bina
4. 💋 रोमांस और डायलॉग — pehla kadam, pehla sparsh, pehli baat, pehla kiss, exact lines
5. 🔥 इंटिमेट बीट्स — 2 ALAG consensual beats with body language, pacing, feelings, dialogue, aur kab shift karna hai
6. 🎯 अगला क्या — 2-3 exciting options

👫 COUPLE:
Partner A: ${partnerLine(profile.partnerA)}
Partner B: ${partnerLine(profile.partnerB)}
Style: ${profile.relationshipStyle || "(unspecified)"}
Intensity: ${i}/5 — ${INTENSITY_GUIDE[i].hi}`;

  if (profile.loves.length || profile.curious.length) {
    prompt += `\n\n✅ PREFERENCES:
Loves: ${profile.loves.join(", ") || "none"}
Curious: ${profile.curious.join(", ") || "none"}`;
  }

  if (scenario) {
    prompt += `\n\n🎭 SCENARIO: ${scenario.title}
${scenario.tagline}
Setting: ${scenario.setting}
Premise: ${scenario.premise}
Vibes: ${scenario.vibes.join(", ")}`;
  }

  if (characters.length) {
    prompt += `\n\n🎭 CHARACTERS:\n${characters.map(charBlock).join("\n")}`;
  }

  // The final line anchors the model on the constraints it must finish with.
  prompt += `\n\n🔥 AB SHURU KAR. Format follow kar. Adult, intimate, non-graphic, aur complete likh.\n🔴 SAB KUCH SIRF HINDI MEIN LIKHO. ENGLISH BILKUL MAT LIKHO. PEHLA SHABD HINDI MEIN HONA CHAHIYE.`;

  return prompt;
}

// ─── Public API ──────────────────────────────────────

export function buildSystemPrompt(args: {
  profile: CoupleProfile;
  scenario: Scenario | null;
  characters: Character[];
  intensity: number;
  language?: "en" | "hi";
}): string {
  const lang = args.language || "hi";
  if (lang === "en") return buildEnglishSystemPrompt(args);
  return buildHindiSystemPrompt(args);
}

const OPENING_MOODS = [
  "mysterious and dangerous",
  "intensely passionate from the first second",
  "slow-burn with unbearable tension",
  "playfully dominant and teasing",
  "raw and desperate with longing",
  "darkly seductive and forbidden",
  "electric with unspoken desire",
  "wild and reckless",
  "possessive and commanding",
  "tender at first, then consuming",
];

export function openingPrompt(
  scenario: Scenario | null,
  characters: Character[],
  language?: "en" | "hi",
): string {
  const lang = language || "hi";
  const mood = OPENING_MOODS[Math.floor(Math.random() * OPENING_MOODS.length)];

  if (lang === "en") {
    let prompt = `🔥 Start the scene NOW. Follow the format in order: characters, setting, clothing and chemistry, romance/dialogue, 2 intimate beats, next. Use 650-950 words, 2-5 emojis, **bold** actions, exact dialogue. Keep it adult, consensual, non-graphic, and finish every section.\nMood: ${mood}`;
    if (scenario) {
      const charPart = characters.length ? ` featuring ${characters.map((c) => c.name).join(" and ")}` : "";
      prompt += `\nScenario: "${scenario.title}"${charPart}`;
    }
    return prompt;
  }

  // Hindi opening — short, direct, all Hindi
  let prompt = `🔥 Abhi scene shuru kar. Format follow kar is order mein: किरदार, माहौल, कपड़े और केमिस्ट्री, रोमांस/डायलॉग, 2 इंटिमेट बीट्स, अगला क्या. 650-950 words, 2-5 emojis, **bold** actions, exact Hindi dialogues. Adult, consensual, non-graphic rakho aur हर section पूरा kar.\nMood: ${mood}`;
  if (scenario) {
    const charPart = characters.length ? ` featuring ${characters.map((c) => c.name).join(" and ")}` : "";
    prompt += `\nScenario: "${scenario.title}"${charPart}`;
  }
  return prompt;
}

export type Pronouns = "he/him" | "she/her" | "they/them" | "other";

export type Partner = {
  name: string;
  pronouns: Pronouns;
  customPronouns?: string;
};

export type CoupleProfile = {
  partnerA: Partner;
  partnerB: Partner;
  relationshipStyle: string;
  loves: string[];
  curious: string[];
  hardLimits: string[];
  safeWord: string;
  defaultIntensity: number;
  preferredModel: string;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  appearance: string;
  personality: string;
  voice: string;
};

export type Scenario = {
  id: string;
  title: string;
  title_hi?: string;
  tagline: string;
  tagline_hi?: string;
  setting: string;
  premise: string;
  vibes: string[];
  suggestedCharacters: Character[];
  builtin?: boolean;
};

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type Session = {
  id: string;
  title: string;
  scenarioId: string | null;
  scenarioSnapshot: Scenario | null;
  characters: Character[];
  intensity: number;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ModelOption = {
  id: string;
  label: string;
  notes: string;
  recommended?: boolean;
};

// ─── AI Sex Chat Types ───────────────────────────────
export type UserGender = "male" | "female";
export type ChatLanguage = "en" | "hi" | "hinglish";

export type SexChatSession = {
  id: string;
  userName: string;
  userGender: UserGender;
  aiGender: UserGender;
  chatLanguage: ChatLanguage;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

import type { CoupleProfile, Session, SexChatSession } from "./types";
import { DEFAULT_MODEL } from "./models";

const AGE_KEY = "ember.age_confirmed";
const PROFILE_KEY = "ember.couple_profile";
const SESSIONS_KEY = "ember.sessions";
const SEXCHAT_SESSIONS_KEY = "ember.sexchat_sessions";

export const DEFAULT_PROFILE: CoupleProfile = {
  partnerA: { name: "", pronouns: "she/her" },
  partnerB: { name: "", pronouns: "he/him" },
  relationshipStyle: "",
  loves: [],
  curious: [],
  hardLimits: [],
  safeWord: "red",
  defaultIntensity: 5,
  preferredModel: DEFAULT_MODEL,
};

const isBrowser = () => typeof window !== "undefined";

export function getAgeConfirmed(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(AGE_KEY) === "true";
}

export function setAgeConfirmed(value: boolean) {
  if (!isBrowser()) return;
  if (value) localStorage.setItem(AGE_KEY, "true");
  else localStorage.removeItem(AGE_KEY);
}

export function getProfile(): CoupleProfile {
  if (!isBrowser()) return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<CoupleProfile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: CoupleProfile) {
  if (!isBrowser()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getSessions(): Session[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export function getSession(id: string): Session | null {
  return getSessions().find((s) => s.id === id) ?? null;
}

export function saveSession(session: Session) {
  if (!isBrowser()) return;
  const all = getSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  const updated = { ...session, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
}

export function deleteSession(id: string) {
  if (!isBrowser()) return;
  const all = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Sex Chat Session Storage ────────────────────────
export function getSexChatSessions(): SexChatSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SEXCHAT_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SexChatSession[];
  } catch {
    return [];
  }
}

export function getSexChatSession(id: string): SexChatSession | null {
  return getSexChatSessions().find((s) => s.id === id) ?? null;
}

export function saveSexChatSession(session: SexChatSession) {
  if (!isBrowser()) return;
  const all = getSexChatSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  const updated = { ...session, updatedAt: Date.now() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  localStorage.setItem(SEXCHAT_SESSIONS_KEY, JSON.stringify(all));
}

export function deleteSexChatSession(id: string) {
  if (!isBrowser()) return;
  const all = getSexChatSessions().filter((s) => s.id !== id);
  localStorage.setItem(SEXCHAT_SESSIONS_KEY, JSON.stringify(all));
}

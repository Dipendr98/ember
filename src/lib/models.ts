import type { ModelOption } from "./types";

// The app uses a single fixed model: Gemini 3.5 Flash.
export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "google/gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    notes: "Google Gemini via GEMINI_API_KEY with all safety filters disabled. Fast and reliable.",
    recommended: true,
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

export const SEXCHAT_DEFAULT_MODEL = DEFAULT_MODEL;

// Fast models that respond quickly (no reasoning/thinking phase)
export const FAST_MODELS = new Set([DEFAULT_MODEL]);

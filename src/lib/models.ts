import type { ModelOption } from "./types";

export const GEMMA_MODEL_ID = "gemma/gemma-4-e4b";

// Gemini stays the default; self-hosted Gemma is selectable and is the
// automatic fallback when Gemini errors (quota, outage).
export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "google/gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    notes: "Google Gemini via GEMINI_API_KEY with all safety filters disabled. Fast and reliable.",
    recommended: true,
  },
  {
    id: GEMMA_MODEL_ID,
    label: "Gemma 4 E4B (self-hosted)",
    notes: "Self-hosted Gemma via GEMMA_API_URL. Very natural casual chat; declines explicit story prompts.",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

export const SEXCHAT_DEFAULT_MODEL = DEFAULT_MODEL;

// Fast models that respond quickly (no reasoning/thinking phase)
export const FAST_MODELS = new Set([DEFAULT_MODEL]);

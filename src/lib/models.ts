import type { ModelOption } from "./types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "google/gemini-3.5-flash",
    label: "Gemini 3.5 Flash (Recommended)",
    notes: "Google Gemini via GEMINI_API_KEY with all safety filters disabled. Fast and reliable.",
    recommended: true,
  },
  {
    id: "google/gemini-flash-latest",
    label: "Gemini Flash (Latest)",
    notes: "Latest Gemini Flash model via GEMINI_API_KEY with all safety filters disabled.",
  },
  {
    id: "deepseek/deepseek-r1-0528",
    label: "DeepSeek R1",
    notes: "Latest DeepSeek reasoning model. Very capable, uncensored, and fast for long-form roleplay.",
  },
  {
    id: "deepseek/deepseek-chat",
    label: "DeepSeek V3 Chat",
    notes: "Excellent quality for creative writing and roleplay. Uncensored and fast.",
  },
  {
    id: "qwen/qwen3-235b-a22b",
    label: "Qwen3 235B",
    notes: "Very large model with excellent creative writing. Great for detailed scenes.",
  },
  {
    id: "mistralai/mistral-nemo",
    label: "Mistral Nemo",
    notes: "Fast and uncensored. Good for quick responses with solid quality.",
  },
  {
    id: "nvidia/deepseek-v4-flash",
    label: "NVIDIA DeepSeek V4 Flash",
    notes: "Uses NVIDIA directly when NVIDIA_API_KEY is set.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    notes: "Strong quality for roleplay. Slower but more detailed output.",
  },
  {
    id: "google/gemini-2.5-flash:free",
    label: "Gemini 2.5 Flash (Free)",
    notes: "Free model. May refuse explicit content. Good fallback for non-explicit scenes.",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

// For sex chat, use a fast model (no "thinking" phase) since messages are short
export const SEXCHAT_DEFAULT_MODEL = "google/gemini-3.5-flash";

// Fast models that respond quickly (no reasoning/thinking phase)
export const FAST_MODELS = new Set([
  "google/gemini-3.5-flash",
  "google/gemini-flash-latest",
  "deepseek/deepseek-chat",
  "mistralai/mistral-nemo",
  "nvidia/deepseek-v4-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-2.5-flash:free",
]);

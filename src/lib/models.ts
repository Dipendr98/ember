import type { ModelOption } from "./types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "openrouter/free",
    label: "OpenRouter Free Router",
    notes: "Automatically selects an available free model on OpenRouter. Best choice when you want the app to run without buying credits.",
    recommended: true,
  },
  {
    id: "google/gemini-2.5-flash:free",
    label: "Gemini 2.5 Flash (Free)",
    notes: "Free OpenRouter model with high context. Good fallback when the free router is busy.",
  },
  {
    id: "nvidia/deepseek-v4-flash",
    label: "NVIDIA DeepSeek V4 Flash",
    notes: "Uses NVIDIA directly when NVIDIA_API_KEY is set. Backup path if OpenRouter free routing is rate-limited.",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

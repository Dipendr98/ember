import type { ModelOption } from "./types";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash (Fastest)",
    notes: "Fastest useful first-token result in local testing. Uses OpenRouter throughput routing.",
    recommended: true,
  },
  {
    id: "nvidia/deepseek-v4-flash",
    label: "NVIDIA DeepSeek V4 Flash",
    notes: "Uses NVIDIA directly when NVIDIA_API_KEY is set. Keep as backup if OpenRouter is busy.",
  },
  {
    id: "qwen/qwen3.5-flash-02-23",
    label: "Qwen3.5 Flash (OpenRouter)",
    notes: "Cheap, high-context OpenRouter model. Good fallback, but it was slower to produce useful text in local testing.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B (OpenRouter)",
    notes: "Higher quality, usually slower than Flash models. Use when quality matters more than speed.",
  },
  {
    id: "gryphe/mythomax-l2-13b",
    label: "MythoMax 13B (OpenRouter)",
    notes: "Small and cheap. Useful as a backup, but quality is less consistent.",
  },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

"use client";

import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  accent?: "soft" | "danger";
};

export function ChipInput({ values, onChange, placeholder, accent = "soft" }: Props) {
  const [draft, setDraft] = useState("");

  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    if (values.some((existing) => existing.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
    setDraft("");
  }

  const chipClass =
    accent === "danger"
      ? "bg-red-500/15 border-red-500/40 text-red-200"
      : "bg-accent/15 border-accent/40 text-accent-soft";

  return (
    <div className="border border-card-border rounded-xl bg-background/40 p-2 flex flex-wrap gap-1.5 focus-within:border-accent transition-colors">
      {values.map((v) => (
        <span
          key={v}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm border ${chipClass}`}
        >
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="hover:text-foreground transition-colors"
            aria-label={`Remove ${v}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={values.length ? "" : placeholder}
        className="flex-1 min-w-[120px] bg-transparent outline-none px-2 py-1 text-sm placeholder:text-muted"
      />
    </div>
  );
}

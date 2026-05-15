"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { Character } from "@/lib/types";
import { newId } from "@/lib/storage";

type Props = {
  characters: Character[];
  onChange: (next: Character[]) => void;
};

export function CharacterEditor({ characters, onChange }: Props) {
  const [editing, setEditing] = useState<Character | null>(null);

  function add() {
    setEditing({
      id: newId(),
      name: "",
      role: "",
      appearance: "",
      personality: "",
      voice: "",
    });
  }

  function save() {
    if (!editing) return;
    const idx = characters.findIndex((c) => c.id === editing.id);
    if (idx >= 0) {
      const copy = characters.slice();
      copy[idx] = editing;
      onChange(copy);
    } else {
      onChange([...characters, editing]);
    }
    setEditing(null);
  }

  function remove(id: string) {
    onChange(characters.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-3">
      {characters.map((c) => (
        <div
          key={c.id}
          className="bg-background/40 border border-card-border rounded-xl p-3 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="font-medium text-accent-soft">{c.name || "(unnamed)"}</div>
            <div className="text-xs text-muted truncate">{c.role}</div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(c)}
              className="text-xs px-2 py-1 rounded-md border border-card-border hover:border-accent text-muted hover:text-foreground transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="p-1.5 rounded-md text-muted hover:text-red-400 transition-colors"
              aria-label="Remove character"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-card-border hover:border-accent text-muted hover:text-foreground text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> Add character
      </button>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-card border border-card-border rounded-2xl p-5 shadow-2xl">
            <h3 className="text-accent-soft font-semibold mb-4">
              {characters.some((c) => c.id === editing.id) ? "Edit" : "New"} character
            </h3>
            <div className="space-y-3">
              <Field
                label="Name"
                value={editing.name}
                onChange={(v) => setEditing({ ...editing, name: v })}
              />
              <Field
                label="Role"
                value={editing.role}
                onChange={(v) => setEditing({ ...editing, role: v })}
                placeholder="e.g. backcountry guide, masked stranger"
              />
              <Field
                label="Appearance"
                value={editing.appearance}
                onChange={(v) => setEditing({ ...editing, appearance: v })}
                multiline
              />
              <Field
                label="Personality"
                value={editing.personality}
                onChange={(v) => setEditing({ ...editing, personality: v })}
                multiline
              />
              <Field
                label="Voice"
                value={editing.voice}
                onChange={(v) => setEditing({ ...editing, voice: v })}
                placeholder="e.g. low, unhurried, dry humor"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-lg text-muted hover:text-foreground transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-soft text-white font-medium text-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-muted mb-1">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-background/40 border border-card-border rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors text-sm resize-y"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background/40 border border-card-border rounded-lg px-3 py-2 outline-none focus:border-accent transition-colors text-sm"
        />
      )}
    </label>
  );
}

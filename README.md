# Ember — Intimate Role-Play for Couples

A private, AI-powered role-play web app for couples. Pick a scenario, shape a
character, and let an AI storyteller weave a long-form, slow-burn story you
both steer together. Everything you write is saved only in your browser.

Built with Next.js 16, TypeScript, Tailwind v4, NVIDIA NIM, and OpenRouter for AI.

## Features

- **18+ age gate** on first visit.
- **Couple profile** — names, pronouns, relationship style, loves / curious /
  hard-limit lists, safe word, default intensity, preferred model. Stored
  entirely in `localStorage`.
- **Scenario library** — six built-in scenarios (Snowed In, Rooftop Rivals,
  Honeymoon Suite, Private Lessons, Masquerade, The Late-Night Call) plus
  free-play and full custom-scenario authoring.
- **Character builder** — name, role, appearance, personality, voice. Add or
  edit mid-scene.
- **Streaming role-play chat** with steering controls: continue / slow down /
  go deeper / change angle / add detail / fade out, plus rewrite-last and
  undo-last-exchange.
- **Intensity slider** (1–5) — tasteful to fully explicit. Live-applies to the
  next AI reply.
- **Safe-word detection** — type your safe word at any time and Ember pauses
  the scene with check-in options.
- **Model picker** — choose between fast chat models through NVIDIA and
  OpenRouter.
- **Saved sessions** — every story is auto-persisted to `localStorage` so you
  can resume later, with full message history.
- **Privacy** — no accounts, no analytics, no server storage. The only network
  request is your browser → your own Next.js server → OpenRouter, using a key
  you provide.

## Getting started

```bash
# 1. Install deps
npm install

# 2. Add your API keys
cp .env.local.example .env.local
# then edit .env.local and paste NVIDIA_API_KEY and/or OPENROUTER_API_KEY

# 3. Run the dev server
npm run dev
```

Then open <http://localhost:3000>.

## Deploy

This is a standard Next.js app and can be deployed to any platform that
supports Node.js (Vercel, Netlify, Render, Fly, your own VPS, etc.).

Set at least one provider key:

- `NVIDIA_API_KEY` — your NVIDIA API key. Used first for the fastest DeepSeek
  Flash path.
- `OPENROUTER_API_KEY` — your OpenRouter API key. Used for selected OpenRouter
  models and fallback routing.

Optional:

- `OPENROUTER_REFERER` — your deployed origin URL, e.g. `https://ember.example`.
  OpenRouter uses this for attribution.

### Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Add `OPENROUTER_API_KEY` in the project settings → Environment Variables.
4. Deploy.

## Choosing a model

For fast chat, the default is **DeepSeek V4 Flash on OpenRouter** with
throughput routing enabled. In local smoke tests from this machine it produced
useful streamed content faster than the NVIDIA-hosted path.

Good alternatives in the dropdown:

- **NVIDIA DeepSeek V4 Flash** — direct NVIDIA path when `NVIDIA_API_KEY` is
  set. Useful as a backup if OpenRouter is busy.
- **Qwen3.5 Flash** — cheap OpenRouter model with a large context window.
- **Llama 3.3 70B** — better quality, usually slower than Flash models.
- **MythoMax 13B** — small, cheap backup with less consistent quality.

## Project structure

```
src/
  app/
    api/chat/route.ts    # Server-side OpenRouter proxy with SSE-streaming
    page.tsx             # Landing page
    setup/page.tsx       # Couple profile editor
    scenarios/page.tsx   # Scenario library + custom builder
    sessions/page.tsx    # Saved sessions list
    play/[id]/page.tsx   # Main role-play chat
    globals.css          # Theme
    layout.tsx           # Root layout
  components/
    AgeGate.tsx          # 18+ gate
    Nav.tsx              # Top navigation
    Shell.tsx            # Layout wrapper (Nav + AgeGate)
    CharacterEditor.tsx  # Add/edit characters
    ChipInput.tsx        # Tag-style multi-input for likes / limits
  lib/
    types.ts             # Domain types
    models.ts            # Model dropdown options
    scenarios.ts         # Built-in scenarios
    storage.ts           # localStorage helpers
    prompts.ts           # System-prompt builder
```

## Safety and consent

Ember writes consent and safety directly into every system prompt:

- The couple's **hard limits** are listed and labeled as never-include.
- The **safe word** is named in the prompt; the AI is instructed to drop the
  scene immediately when it's used.
- The client also detects the safe word locally and pauses the UI even before
  hitting the network.
- Intensity is opt-in and starts at level 3. You can drop to level 1
  ("tasteful, suggestive only") at any time.

This app is intended for two consenting adults using it together privately.
Do not use it to depict minors or non-consenting parties.

## License

MIT. Use it, fork it, change it — please be kind to each other.

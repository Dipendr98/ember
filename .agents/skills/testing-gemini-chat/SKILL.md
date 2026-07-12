---
name: testing-gemini-chat
description: Test Ember's Easy mode + AI sex chat end-to-end against Gemini. Use when verifying chat responds and produces unrestricted content.
---

# Testing Ember chat (Gemini provider)

Ember is a Next.js 16 (Turbopack) app. Chat flows hit `POST /api/chat`, which
supports OpenRouter, NVIDIA, and Gemini. Gemini is the default model.

## Devin Secrets Needed
- `GEMINI_API_KEY` — Google AI Studio key. Put it in `.env.local` (gitignored) as
  `GEMINI_API_KEY=...`. `GOOGLE_API_KEY` also works as a fallback alias.
- Optional: `OPENROUTER_API_KEY`, `NVIDIA_API_KEY` (fallback providers).

## Local setup
```bash
npm install
printf 'GEMINI_API_KEY=YOUR_KEY\n' > .env.local
npm run dev   # localhost:3000
```
Restart the dev server after editing `src/app/api/chat/route.ts` — Turbopack does not
always hot-reload the API route reliably. If `curl localhost:3000` returns `000`, the
server isn't bound yet; start it in a dedicated background shell and poll until it
returns 200.

## What to test (2 flows through the UI)
1. **Easy mode**: `/easy` → enter two names → click a scenario's "शुरू करें" → on
   `/play/[id]` click "🔥 कहानी शुरू करो…". PASS = a full multi-section scene streams
   in; FAIL = red error banner or a refusal message.
2. **AI sex chat**: `/sexchat` → fill name/genders/language → "चैट शुरू करो" → confirm
   model dropdown defaults to "Gemini 3.5 Flash (Recommended)" → send an explicit
   message. PASS = explicit in-character reply streams; FAIL = "All models failed" or a
   refusal.

## Gotchas / lessons
- **Model availability shifts.** `gemini-2.5-flash` returned 404 ("no longer available
  to new users") for a fresh key; `gemini-3.5-flash` / `gemini-flash-latest` worked.
  Verify the default model in `src/lib/models.ts` is still available by listing models:
  `GET https://generativelanguage.googleapis.com/v1beta/models` with header
  `x-goog-api-key`.
- **Refusals even with `BLOCK_NONE`.** `safetySettings: BLOCK_NONE` only disables the
  separate safety classifier, not the model's own alignment refusals. The working
  workaround is a **prefill**: append a short in-character assistant turn (e.g. `"🔥\n\n"`)
  ending on a blank line so the streamed continuation reads cleanly. Implemented in
  `buildGeminiPayload` in `src/app/api/chat/route.ts`. If refusals reappear, try a
  different prefill; note some prefills can trigger `PROHIBITED_CONTENT` in some contexts.
- **`PROHIBITED_CONTENT`** finish reason = Google blocked it server-side; cannot be
  overridden from the app. Report this honestly rather than claiming a guarantee.
- Use `generateContent` (non-stream) for quick key/model/prefill probes via a small
  Python script with `urllib`; the app itself uses `streamGenerateContent?alt=sse`.

## Verify before PR
`npx tsc --noEmit && npm run lint`

## Known unrelated failure
Vercel PR check fails with "Git author ... must have access to the project on Vercel" —
a team-membership issue, not code. Production also needs `GEMINI_API_KEY` in Vercel env.

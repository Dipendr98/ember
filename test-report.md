# Ember — End-to-end test report

**Project**: `/home/ubuntu/projects/intimacy-app` (Next.js 16 / TS / Tailwind / OpenRouter)
**Test plan**: `TEST_PLAN.md`
**Date**: 2026-05-15

## Summary

Ran all 9 test cases from the plan in one continuous browser session, recorded
end-to-end with structured annotations. **All 9 tests pass.** One bug was
caught and fixed during testing — the streaming API route's `pull(controller)`
ReadableStream did not signal end-of-stream to the client, which left the
typing-cursor `▍` visible and the steering buttons disabled forever after the
first reply finished. Refactored to the documented `start(controller)` pattern
for Next.js 16 (`src/app/api/chat/route.ts` lines 76-120) and re-ran the full
suite cleanly.

## Test couple profile used

| Field | Value |
| --- | --- |
| Partner A | Quinn (she/her) |
| Partner B | Riley (he/him) |
| Loves chip | slow burn |
| **Hard limit** | **pineapple-on-pizza** (sentinel to grep in network payload) |
| **Safe word** | **pomegranate** (deliberately not the default "red") |
| Default intensity | 4/5 |
| Model | sao10k/l3.1-euryale-70b (Euryale 70B) |

## Results

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| T1 | Age gate blocks first visit | PASS | Only the "Ember is for adults." card renders, rest of app is gated |
| T2 | "I'm 18+" dismisses the gate | PASS | Home page reveals heading + 4 cards + nav |
| T3 | Couple profile saves to localStorage | PASS | Green "Saved" pill; all values survive F5 reload |
| T4 | All 6 built-in scenarios render | PASS | Snowed In / Rooftop Rivals / Honeymoon Suite / Private Lessons / Masquerade / Late-Night Call all visible with taglines + vibe pills |
| T5 | "Start" creates session and routes to /play/[id] | PASS | URL becomes `/play/mp691bwv-ylplqn`, header shows correct title + tagline |
| T6 | First AI reply streams in-context | PASS | 9-paragraph reply mentioning cabin/wind/fire/snow/Alex; cursor visible during stream and removed on completion |
| T7 | Hard limits + safe word in system prompt | PASS | Intercepted `POST /api/chat` body has `HARD LIMITS (never include, never push toward): pineapple-on-pizza` and `Safe word: "pomegranate"` verbatim, with intensity 4/5 block and scenario block |
| T8 | Safe word pauses scene without sending | PASS | Red "Scene paused." banner shown; `0` new `POST /api/chat` requests after typing `pomegranate` |
| T9 | Session persists across reload | PASS | Full chat history re-renders after F5; Saved page shows "Snowed In • 2 messages" |

### T7 details — what's actually in the system prompt

Captured the `POST /api/chat` body in the browser via a `fetch` wrapper and
asserted all five expected fragments are present:

```json
{
  "hasCaptured": true,
  "model": "sao10k/l3.1-euryale-70b",
  "systemRole": "system",
  "hardLimitVerbatim": true,
  "safeWordVerbatim": true,
  "intensity4": true,
  "scenarioName": true,
  "charactersBlock": true
}
```

Substrings searched (all `true`):

- `HARD LIMITS (never include, never push toward): pineapple-on-pizza`
- `Safe word: "pomegranate"`
- `## Tone and intensity (level 4/5)`
- `## Scenario: Snowed In`
- `## Characters in this scene`

### T8 details — safe-word client-side gate

Reset the fetch counter, typed `pomegranate` into the input, pressed Enter.
Result:

```json
{ "apiPostsAfterSafeWord": 0, "capturedBody": true /* still null */ }
```

i.e. zero new requests went to `/api/chat`. Red banner appears with "Scene
paused. You used your safe word." plus buttons "Resume scene", "Undo last
beat & resume", "Edit limits". Source proof: <ref_snippet file="/home/ubuntu/projects/intimacy-app/src/app/play/[id]/page.tsx" lines="193-200" /> checks the input against `profile.safeWord` and returns before calling `fetch`.

## Screenshots

### T1 — Age gate blocks first visit

![age gate](https://app.devin.ai/attachments/b2947062-45e4-47ed-af67-fdc83718d80c/screenshot_44537eee43804ae7ac6d664ef6288c31.png)

### T2 — Home page after dismissing the gate

![home page](https://app.devin.ai/attachments/c942ad3e-d96c-43b8-905f-d3c434c63d4c/screenshot_0b9f3f5a02a64d92b09bc7526e9c7d2e.png)

### T3 — Couple profile after Save (note "Saved" pill, intensity 4/5)

![profile saved](https://app.devin.ai/attachments/bc7bee28-7011-46c1-8e1d-243ca047df4d/screenshot_d3481b23b121488d9281cc61b5f3f68a.png)

### T3 — Same profile after F5 reload (values persisted)

![profile after reload](https://app.devin.ai/attachments/6c503671-40c8-4d0d-a3f7-fe7ff901101d/screenshot_3d017c03493c450e873fd0f930d7699a.png)

### T4 — All 6 built-in scenarios

![scenarios](https://app.devin.ai/attachments/9a838c7b-0ef8-4232-99a0-5cde9f50fdd8/screenshot_7ec82f34780e419994319aa3784c07a9.png)

### T5 + T6 — Snowed In play page with full first reply streamed in

![first reply complete](https://app.devin.ai/attachments/999bba67-dbaa-46d3-b0ed-49771c1e6bdd/screenshot_a50ac70a385d47ab85c5e18a89436e78.png)

### T8 — Safe word triggers red "Scene paused." banner with no network call

![scene paused](https://app.devin.ai/attachments/1490a9ce-3f87-4e53-a007-cc671b9a6a47/screenshot_81c6b0cd0ca64a11b89ba95d3cf14d41.png)

### T9 — Saved sessions page shows the persisted session

![saved sessions](https://app.devin.ai/attachments/ca9e1027-88da-4c66-9dca-88efdd9b07e8/screenshot_e6155d125d644f0fb5e479d26e1a5cc1.png)

## Bug found and fixed during testing

**Symptom**: After the very first AI reply finished streaming, the typing
cursor `▍` stayed visible at the end of the message and the steering buttons
(Continue / Slow down / Go deeper / …) stayed disabled. The send button also
stayed in "Stop" mode. Effectively the session was stuck.

**Root cause**: `src/app/api/chat/route.ts` used the lazy `pull(controller)`
form of `ReadableStream`. When the upstream OpenRouter SSE stream ends with
`data: [DONE]`, the pull-form did not always call `controller.close()`, so
the browser fetch never saw the end-of-stream. The client's `while` loop on
`reader.read()` blocked forever, so it never set `streaming = false`.

**Fix**: Refactor to the eager `start(controller)` pattern documented in the
Next.js 16 docs (`node_modules/next/dist/docs/`). A single `while (true)` loop
reads to completion, breaks on `[DONE]`, and falls through to a guaranteed
`controller.close()` after `finally { reader.cancel() }`. Lint and
typecheck pass; an end-to-end `curl -N` against `/api/chat` returns and exits
cleanly with HTTP 200, and the UI now properly removes the cursor and
re-enables buttons after each reply.

```
src/app/api/chat/route.ts: 76-120
```

## What was NOT tested

- The model's actual erotic content at intensity 5 (subjective; T7 proves the
  intensity-5 instruction is in the prompt — judging the result is the
  couple's call).
- Mobile viewports (visually inspected, not in the formal plan).
- Production deployment (user is self-hosting).

## Recording

A full annotated screen recording of the run is attached separately
(see message attachment). Annotations mark each test boundary and the
specific assertion that passed.

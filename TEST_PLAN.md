# Test Plan — Ember intimate role-play app

## What changed
Brand-new Next.js 16 / TypeScript app at `/home/ubuntu/projects/intimacy-app`.
Six pages (home, setup, scenarios, sessions, play/[id], api/chat) and the
matching components/lib files were written from scratch. The intent is a
private, AI-powered role-play companion for couples, streaming long-context
responses from OpenRouter, with hard-limit/safe-word safety, intensity
slider, scenario library, character builder, and `localStorage`-backed
sessions.

## Primary flow under test
**One continuous run** through the app: pass the age gate → fill a couple
profile with a custom safe word and an unmistakable hard limit → start a
built-in scenario → trigger the AI's first streamed reply and confirm it is
on-context → adjust the intensity slider → send the safe word and confirm
the scene actually pauses → reload the page to confirm the session was
persisted to `localStorage` and resumes with full history.

Every step has a concrete pass/fail criterion designed so that a broken
implementation would visibly fail.

## Test cases

### T1 — Age gate blocks initial access
- **Action**: Open <http://localhost:3000> in a fresh profile (no localStorage).
- **PASS if**: the page shows the heading **"Ember is for adults."** and the
  scenarios/setup/etc. links are NOT reachable (the rest of the app is not
  rendered).
- **FAIL if**: the home page renders without the gate, or the gate appears
  but the home page also renders under it.

### T2 — Age gate dismissal persists
- **Action**: Click **"I'm 18+ — let me in"**.
- **PASS if**: home page renders with heading **"Make the night last."** and
  four cards (Start a new story / Set up your couple profile / Continue a
  saved session / Improvise). The nav bar at top shows **Scenarios / Saved
  / Couple** links.
- **FAIL if**: still on gate, or any card missing.

### T3 — Couple profile saves to localStorage
- **Action**: Click **Couple** in the nav. Fill in:
  - Partner A name = `Quinn`, pronouns = `she/her`
  - Partner B name = `Riley`, pronouns = `he/him`
  - Loves chip = add `slow burn`
  - Hard Limits chip = add a sentinel I can recognize later, e.g. `pineapple-on-pizza`
  - Safe word = `pomegranate` (deliberately not the default `red`)
  - Default intensity = `4`
  - Preferred AI model = leave on Euryale 70B (recommended)
- Click **Save profile**.
- **PASS if**: green "Saved" pill appears next to the Save button. Reload the
  page (Ctrl+R); all inputs still show those values.
- **FAIL if**: the form resets to empty/defaults on reload, or no "Saved"
  indicator appears.

### T4 — Scenario library renders all built-in scenarios
- **Action**: Click **Scenarios** in the nav.
- **PASS if**: All six built-in scenario cards render with these titles —
  Snowed In, Rooftop Rivals, The Honeymoon Suite, Private Lessons,
  Masquerade, The Late-Night Call. Each card shows a tagline and at least
  one vibe pill.
- **FAIL if**: any built-in is missing, duplicated, or missing tagline/vibes.

### T5 — Starting a scenario creates a saved session and routes to /play
- **Action**: Click **Start** on the "Snowed In" card.
- **PASS if**: URL changes to `/play/<some-id>`. Page header shows the
  editable title **"Snowed In"** and the tagline **"Two travelers, one
  cabin, and a storm that won't end."** A "Open the scene" button is
  visible.
- **FAIL if**: stuck on /scenarios, header shows wrong title/tagline, or no
  "Open the scene" CTA.

### T6 — First AI reply streams in-context (proves the OpenRouter pipe works)
- **Action**: Click **Open the scene**.
- **PASS if**: Within ~30 s, an assistant bubble (labeled `Ember`) streams
  in token-by-token. The text must reference at least one element of the
  scenario — e.g. cabin / blizzard / storm / fireplace / cold / cabin
  setting — proving the system prompt with scenario context was actually
  sent. Token-by-token rendering is visually verifiable (the bubble grows
  while the "Ember is writing…" indicator is gone, or a cursor `▍` shows).
- **FAIL if**: no reply, an error banner appears, the reply is generic and
  contains zero scenario-relevant words, or the bubble appears instantly
  with no streaming.

### T7 — Hard limits are written into the system prompt
- **Action**: Open DevTools → Network tab. Filter to `chat`. With the
  previous reply already streamed, click the **Continue** quick-action
  button so a fresh POST `/api/chat` request fires. Click that request →
  Payload tab.
- **PASS if**: the JSON request body contains
  `"HARD LIMITS (never include, never push toward): pineapple-on-pizza"`
  (or substring `pineapple-on-pizza`) inside the system message.
- **FAIL if**: no system message, or the sentinel hard-limit string is
  missing.

### T8 — Safe word pauses the scene WITHOUT sending the message
- **Action**: In the chat input, type `pomegranate` and press Enter. Watch
  the Network tab.
- **PASS if**: a red banner appears reading **"Scene paused."** with
  message **"You used your safe word."** No new POST to `/api/chat` is
  fired. The input is cleared. **"Resume scene"** and **"Undo last beat &
  resume"** buttons are visible.
- **FAIL if**: the message is sent to the AI (visible POST in network tab),
  no pause banner appears, or pause appears but a new assistant reply also
  streams in.

### T9 — Session persists across reload
- **Action**: Note the assistant text from T6. Reload the page (Ctrl+R).
- **PASS if**: the chat thread reappears with the same first user prompt
  ("Open the scene…") and the same streamed assistant reply visible. The
  session also appears under **Saved** in the nav with title "Snowed In"
  and a message count of at least 2.
- **FAIL if**: chat is empty after reload, or the saved-sessions list does
  not contain the session.

## What I'm explicitly NOT testing
- That the model itself produces erotic content at intensity 5. The point of
  the explicit-model setting is verified by the system-prompt assertion in
  T7 (the intensity directive is in the same prompt). Actually evaluating
  the spiciness is the user's call.
- Production deployment (the user said they'll host it themselves).
- Mobile responsiveness — visually inspected only, not in the test plan.

## Recording
A single screen recording will cover T1 through T9 in order. The recording
will use `annotate_recording` to mark each test boundary so the user can
skim.

# 2 — Server-side answer authority

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

Questions are rendered in React, so the full question bank — including
`correctIndex` — ships to the browser:

- `src/lib/practice.ts` (`ORD_BANK`, `DTK_BANK`, `MEK_BANK`)
- `src/lib/practice-mek.ts`
- `src/lib/practice-kvant.ts` (`KVA_BANK`, `NOG_BANK`, `XYZ_BANK`)

A determined player can read `correctIndex` from their own bundle/network and
submit the right `p_chosen` for every question. Phase 1 made the *server* the
authority on scoring (it derives `correct` from `p_chosen` vs the `duel_questions`
answer key), but it cannot prevent a client from *knowing* the answer.

## Why it was deferred

Fixing this requires moving question content (or at least the answer key) out of
the client bundle and validating answers server-side — a large change that
touches practice, duels, and flashcards. It is inherent to client-rendered
quizzes.

## Impact

- Ranked duels remain "beatable" by a player who inspects their bundle.
- Casual practice integrity is unaffected (no stakes).
- This is a moderate-severity limitation for a study app, not a full security
  break.

## Options

### A. Server-render questions (recommended for full integrity)

Store full question content (prompt, options, `correct_index`) in Postgres. Fetch
each question at play time *without* `correct_index`; after the user submits, the
server checks `p_chosen` against the stored key. Question content leaves the
client bundle.

- **Pros:** Closes the leak; also enables content updates without redeploys.
- **Cons:** Large migration (content → DB), new APIs, affects
  practice/duel/flashcards, and DTK/MEK assets.

### B. Server-side answer key only (partial)

Keep content in the client but fetch `correct_index` per question only at answer
time from the server (a "reveal after submit" endpoint). The server still
validates.

- **Pros:** Smaller change than A.
- **Cons:** The key is still in memory after reveal; only blocks casual copying,
  not determined cheating.

### C. Accept the limitation (current state)

Rely on server-side scoring plus the existing reputation/flagging system
(`duel_submit_review` auto-flags low-rated/reported players) for moderation.

- **Pros:** No work.
- **Cons:** No real anti-cheat for ranked integrity.

## Related

This is tightly coupled to the "match question set" problem: fully binding
scoring to a match's exact 10 questions (rather than just capping at 10, which
Phase 1 does via `duel_submit_answer`'s answer cap) requires the server to know
the question set, which in turn requires server-side questions (option A). See
`supabase/migrations/0004_duel_integrity.sql`.

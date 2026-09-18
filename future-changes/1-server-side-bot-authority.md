# 1 — Server-side bot authority

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

In `duel_finish_bot(p_match_id, p_bot_correct)` (see
`supabase/migrations/0004_duel_integrity.sql`), the bot's correct count is still
supplied by the client. The bot is simulated entirely in the browser:

- `src/lib/duel/bot.ts` — `simulateBotAnswer()` uses `Math.random()` plus a
  `botAccuracy()` curve derived from the player's ELO.
- `src/components/duel/duel-match.tsx` — `finishMatch` computes `botFinal` from
  `botDecisionsRef` and passes it to `duel_finish_bot`.

The server only clamps `p_bot_correct` to `[0, 10]`. A player can call the RPC
directly with `p_bot_correct = 0` (or any low value) to guarantee a win in a
*ranked* bot match and farm ELO/wins (K = 16 ⇒ +8 per win) with zero risk. The
player's own score is already verified server-side (derived from
`duel_answers`); only the bot's score remains client-trusted.

## Why it was deferred

The bot logic lives only in the client and is not persisted server-side. Moving
it server-side is a larger change than Phase 1–2: it touches match creation, the
bot RNG, and the ranking path. Phase 1 closed the human-vs-human and
player-score holes; this is the remaining bot-specific hole.

## Impact

- Ranked ELO can be farmed via bot matches (unbounded, no opponent).
- Bot matches are the intended low-stakes practice path; the ranked-bot ELO gain
  is the main exploit.

## Options

### A. Deterministic server-side bot (recommended)

Generate the bot's 10 answers deterministically on the server from `bot_elo` and
`question_seed` (both already stored on `duel_matches`), using the same
`botAccuracy()` / seeded-PRNG logic as `src/lib/duel/bot.ts` ported to PL/pgSQL.
Store the bot's decisions (or just its correct count) at match creation in
`duel_start_bot_match`, then have `duel_finish_bot` read the stored count instead
of accepting `p_bot_correct`.

- **Pros:** Closes the exploit fully; `duel_finish_bot` no longer needs a
  `p_bot_correct` argument.
- **Cons:** Must port the accuracy/RNG exactly. `Math.random()` is not
  deterministic, so the bot must switch to a seeded PRNG (e.g. `mulberry32`,
  which `src/lib/duel/questions.ts` already uses for question selection) so the
  server can reproduce the same decisions.

### B. Disable ranked bot matches

Make `duel_start_bot_match` always create `mode = 'casual'` (or reject ranked).
Bot matches then never affect ELO.

- **Pros:** Trivial change.
- **Cons:** Removes the ranked-bot feature entirely.

### C. Cap or rate-limit ranked bot ELO

e.g. K = 0 for bot matches, allow only N ranked bot matches per day, or only
apply ELO when the player loses.

- **Pros:** Small change.
- **Cons:** Still partially exploitable; does not fix the root cause.

## Related

- The bot's answers are regenerated with `Math.random()` on a mid-match page
  reload (the resume path in `duel-match.tsx`), so the bot's score can change
  across reloads. Switching to a seeded PRNG (option A) also fixes this
  non-determinism.

# Phase 3 — SQL consolidation & deduplication

**Status:** Not started. This is the next phase after Phase 1–2 (duel integrity
+ sync/auth fixes) are verified and committed.

## Goal

Reduce duplicated SQL logic in `supabase/migrations/` so the backend is easier
to audit, extend, and keep consistent. Behavior must not change.

## Current state

The migrations total ~1600 lines across four files and contain real duplication:

- `supabase/migrations/0001_user_state.sql` (32 lines)
- `supabase/migrations/0002_duel_pvp.sql` (664 lines)
- `supabase/migrations/0003_duel_reviews.sql` (265 lines)
- `supabase/migrations/0004_duel_integrity.sql` (646 lines)

Concrete duplication found:

1. **Flagged-account guard.** The "konto är under granskning" check is
   copy-pasted in `duel_join_queue` (0003:233) and `duel_start_bot_match`
   (0004:479). Should be a shared helper, e.g. `assert_not_flagged(p_user)`.
2. **Winner determination + Elo application.** The "compare a_correct vs
   b_correct, resolve draws, compute expected scores, apply K, bump
   wins/losses/draws" block is largely duplicated between `duel_mark_finished`
   (PvP, K=32) and `duel_finish_bot` (bot, K=16). Extract shared
   `apply_result(...)` / `finalize_match(...)` helpers parameterized by K.
3. **Review aggregate update.** The `sum(rating * weight)` / `sum(weight)`
   denormalized update appears in both 0003 and 0004. Extract a single
   `refresh_received_ratings(target)` helper.
4. **RLS / grant boilerplate.** Every `SECURITY DEFINER` function is followed by
   the same `revoke execute ... from public, anon; grant execute ... to
   authenticated;` block. This can be standardized (e.g. a helper DO block or a
   shared convention) for all *future* functions.

## Constraints

- **Migrations 0001–0003 are already applied and must not be edited** (per
  `AGENTS.md`). Dedup must ship as a **new** migration `0005_<name>.sql` that
  introduces shared helper functions and re-points/re-defines the duplicated
  logic, or be applied only to fresh installs via a squashed baseline.
- Any new/renamed function must keep the same RPC name and signature (or the
  typed client in `src/lib/supabase/client.ts` and the wrappers in
  `src/lib/duel/*` must be updated in lockstep).
- Keep RLS least-privilege; new helpers must stay `SECURITY DEFINER` with
  `search_path = public` and re-check `auth.uid()`.

## Acceptance criteria

- Duplicated logic identified above is reduced to shared helpers.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- The duel flows (PvP finalize, bot finalize, review submit, join ranked queue)
  behave identically — verified against the existing SQL reviewer checklist.

## Risks

- Rewriting Elo/winner logic risks subtle behavioral drift; extract and compare
  the two copies carefully, parameterizing only what actually differs (K).
- Renaming a helper that existing applied migrations reference is not possible
  in-place; new helpers must be additive.

## Related

- `AGENTS.md` — backend/Supabase rules.
- Future-change #4 (`received_rating_count` naming) is naturally resolved while
  extracting `refresh_received_ratings`.

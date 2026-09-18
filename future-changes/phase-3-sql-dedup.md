# Phase 3 — SQL consolidation & deduplication (implementation spec)

**Status:** Not started. Deferred — needs a live/staging Supabase to verify
Elo/winner/review behavior end-to-end. This doc is the implementation spec.

## Goal

Reduce duplicated SQL across `supabase/migrations/` with **zero behavior
change**. Extract shared `SECURITY DEFINER` helpers and re-point the live RPCs
at them. Everything ships as a single additive migration.

## File inventory

| File | Lines | Role |
|---|---|---|
| `0001_user_state.sql` | 32 | `user_state` key/value sync table (never touch) |
| `0002_duel_pvp.sql` | 664 | PvP core: profiles, queue, matches, answers, finish/forfeit, private lobbies |
| `0003_duel_reviews.sql` | 265 | reviews + flagged-account ranked block |
| `0004_duel_integrity.sql` | 646 | integrity refactor: auth re-check, bot finish, weighted reviews |

## Live function map (what actually runs after all migrations)

Because later migrations `create or replace` earlier ones, the *effective*
functions are:

| RPC | Defined in | Live? |
|---|---|---|
| `duel_ensure_profile` | 0002:163 | ✅ live |
| `duel_cancel_queue` | 0002:222 | ✅ live |
| `duel_forfeit` | 0002:453 | ✅ live |
| `duel_claim_stall_win` | 0002:509 | ✅ live |
| `duel_create_private` | 0002:562 | ✅ live |
| `duel_join_private` | 0002:595 | ✅ live |
| `duel_cancel_private` | 0002:622 | ✅ live |
| `duel_submit_review` | 0003:68 → replaced by 0004:492 | ✅ live (0004) |
| `duel_join_queue` | 0002:178 → replaced by 0003:210 | ✅ live (0003) |
| `duel_submit_answer` | 0002:258 → replaced by 0004:224 | ✅ live (0004) |
| `duel_mark_finished` | 0002:288 → replaced by 0004:276 | ✅ live (0004) |
| `duel_finish_bot` | 0002:391 → replaced by 0004:394 | ✅ live (0004) |
| `duel_start_bot_match` | 0002:234 → replaced by 0004:460 | ✅ live (0004) |

Key consequence: the *only* real duplication among **live** functions is the
flagged guard (between 0003 and 0004) and the Elo formula (within 0004). The
0003 copy of `duel_submit_review` is superseded dead code — do not dedupe
against it.

## Duplication map (live code only)

### 1. Flagged-account guard — real duplication, two live functions

Identical block:
```sql
if p_mode = 'ranked' then
  select flagged into v_flagged from public.player_profiles where user_id = v_user;
  if coalesce(v_flagged, false) then
    raise exception 'Ditt konto är under granskning och kan inte spela Ranked just nu.';
  end if;
end if;
```
Locations:
- `0003_duel_reviews.sql` · `duel_join_queue` · lines **230–235**
- `0004_duel_integrity.sql` · `duel_start_bot_match` · lines **476–481**

Extract:
```sql
create or replace function public.assert_not_flagged(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flagged boolean;
begin
  select flagged into v_flagged from public.player_profiles where user_id = p_user;
  if coalesce(v_flagged, false) then
    raise exception 'Ditt konto är under granskning och kan inte spela Ranked just nu.';
  end if;
end;
$$;
```
Call sites become:
```sql
if p_mode = 'ranked' then perform public.assert_not_flagged(v_user); end if;
```

### 2. Elo expected-score + single-row W/L/D update — shared formula, shared row update

The expected-score formula appears twice, identically:
```sql
1.0 / (1.0 + power(10.0, (<b> - <a>)::numeric / 400.0))
```
- `0004:352–353` · `duel_mark_finished` (PvP, K=32)
- `0004:434–437` · `duel_finish_bot` (bot, expected fixed at 0.5, K=16)

The two **winner** determinations are structurally different and must stay in
their RPCs:

- PvP (`duel_mark_finished`): winner = higher `a_correct`/`b_correct`; tie-break
  by lower `a_time_ms`/`b_time_ms`; else draw (`null`). Applies to **two**
  profiles with two expected scores (`v_ea`, `v_eb`).
- Bot (`duel_finish_bot`): winner = higher of `v_player_correct` vs
  `p_bot_correct`; bot is ranked at the player's own Elo so expected is a fixed
  `0.5`; applies to **one** profile.

Genuinely shared pieces to extract:
```sql
create or replace function public.elo_expected(p_elo_a numeric, p_elo_b numeric)
returns numeric
language sql
immutable
as $$
  select 1.0 / (1.0 + power(10.0, (p_elo_b - p_elo_a) / 400.0));
$$;

create or replace function public.apply_elo_update(
  p_user uuid,
  p_delta integer,
  p_is_win boolean,
  p_is_loss boolean,
  p_is_draw boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.player_profiles
  set elo = greatest(0, elo + p_delta),
      wins = wins + (case when p_is_win then 1 else 0 end),
      losses = losses + (case when p_is_loss then 1 else 0 end),
      draws = draws + (case when p_is_draw then 1 else 0 end),
      updated_at = now()
  where user_id = p_user;
end;
$$;
```
Then:
- `duel_mark_finished` computes `v_ea := elo_expected(v_elo_a, v_elo_b)` and
  `v_eb := elo_expected(v_elo_b, v_elo_a)`, then calls `apply_elo_update` twice
  (once per player) with the derived win/loss/draw booleans.
- `duel_finish_bot` computes `v_delta := round(16 * (v_score - 0.5))::integer`
  and calls `apply_elo_update(v_user, v_delta, v_score=1, v_score=0, v_score=0.5)`.

**Do not** force the two winner-determination branches into one helper — the
tie-break (time) and one-vs-two-player shape differ; merging them is where
behavioral drift sneaks in.

### 3. Review aggregate + auto-flag — extract for reuse + fix semantics

Live copy: `0004:492` `duel_submit_review`. The aggregate + auto-flag block
(`0004:584–635`) is:
- `sum(rating * weight)` / `sum(weight)` → `received_rating_sum` / `count`
- `report_count`
- auto-flag (`v_count >= 3` and weighted avg `<= 2.0`, or `>= 3` recent reports)
- auto-unflag (`v_count >= 5` and avg `>= 3.5` and `< 2` recent reports)

Extract `refresh_received_ratings(p_target uuid)` that recomputes the
denormalized fields and runs the flag/unflag logic; `duel_submit_review` calls
it after inserting the review. Centralizing this also resolves future-change #4.

### 4. `received_rating_count` semantic drift (also future-change #4)

⚠️ The two historical definitions disagree on what `received_rating_count`
stores:
- `0003:172` (superseded): `received_rating_count = v_count`, where
  `v_count = count(*)` → a real **count**.
- `0004:606` (live): `received_rating_count = v_wcount`, where
  `v_wcount = round(sum(weight), 2)` → a **weighted sum**, stored in a `numeric`
  column (`0004:208–212` alters it to numeric "för konsistens med
  received_rating_sum").

So in the live schema `received_rating_count` is **misnamed** — it actually
holds the summed review weights, not a count. When extracting
`refresh_received_ratings`, decide explicitly (and update the column comment)
whether to keep the weighted sum under this name, or introduce a true
`received_rating_count` plus a separate `received_rating_weight_sum`. This is a
naming/semantics decision, not mechanical dedup — flag to product first.

### 5. RLS/grant boilerplate

Every `SECURITY DEFINER` function is followed by:
```sql
revoke execute on function <sig> from public, anon;
grant execute on function <sig> to authenticated;
```
Standardize for all **future** functions. Note: `create or replace` preserves
existing grants when the signature is unchanged, so redefining existing RPCs in
the new migration does **not** require re-granting.

## Migration strategy (additive; 0001–0003 untouched)

Ship one new migration `supabase/migrations/0005_duel_dedup.sql`:

1. `create or replace function` the shared helpers: `assert_not_flagged`,
   `elo_expected`, `apply_elo_update`, `refresh_received_ratings`.
2. `create or replace function` the five live RPCs to call the helpers — **same
   names, same signatures, same return types**:
   `duel_join_queue`, `duel_start_bot_match`, `duel_mark_finished`,
   `duel_finish_bot`, `duel_submit_review`.
3. Do **not** re-grant (grants survive `create or replace` with unchanged
   signature). Add matching `revoke`/`grant` only if a signature changes.
4. `create or replace` is idempotent and safe on both fresh installs and
   already-applied databases.

Constraints (from `AGENTS.md`):
- `security definer` + `set search_path = public` on every helper.
- Re-check `auth.uid()` inside the caller; helpers receive the target `uuid` as
  a parameter from a caller that has already verified `auth.uid()`.
- RLS stays least-privilege.

## Client / TypeScript lockstep

Signatures and RPC names are unchanged, so:
- `src/lib/supabase/client.ts` (typed `Database`) — **no change**. The new SQL
  helpers are internal-only; do not add them to the typed client unless the
  client ever calls them.
- `src/lib/duel/*` wrappers — **no change**.
- Only touch TS if a signature or return type actually changes.

## Verification checklist (requires a live DB)

- Apply `0005` to a staging DB seeded with migrations `0001`–`0004`.
- Regression-test the five flows:
  1. Ranked join blocks a flagged account (`assert_not_flagged`).
  2. PvP finish: winner by correct count, tie-break by time, draw → Elo deltas
     match K=32 formula; W/L/D bump correctly for both players.
  3. Bot finish: K=16, expected 0.5, W/L/D correct for the single player.
  4. Review submit: `received_rating_sum`/`count`/`report_count` recomputed;
     auto-flag/auto-unflag thresholds unchanged.
  5. RPC permissions: authenticated-only; anon rejected.
- Compare pre/post values for a scripted set of matches (Elo deltas,
  wins/losses/draws, reviews) — must be **bit-identical**.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Acceptance criteria

- Four shared helpers introduced; the five live RPCs call them.
- `received_rating_count` semantics decided and documented (or resolved per
  future-change #4).
- No behavior change — bit-identical Elo/W/L/D/review outcomes on scripted data.
- TS/typed client unchanged unless a signature changed.
- All three checks pass.

## Risks

- Winner/Elo extraction is the highest-risk step: extract only `elo_expected`
  and `apply_elo_update`; keep the branch-y winner logic in the RPCs.
  Parameterize only K (and the fixed 0.5 expected for bots).
- Renaming `received_rating_count` (or changing its meaning) is a schema/
  semantics change — keep it separate from the mechanical dedup.
- Re-running `create or replace` on an already-migrated DB must be idempotent —
  verify against a DB that already has `0001`–`0004` applied.

## Related

- `AGENTS.md` — backend/Supabase rules.
- Future-change #4 (`received_rating_count` naming/semantics) is resolved here.
- Future-change #1/#2 (server-side bot/answer authority) will later build on
  `assert_not_flagged` and `refresh_received_ratings`.

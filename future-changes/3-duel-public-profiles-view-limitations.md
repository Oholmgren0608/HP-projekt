# 3 — `duel_public_profiles` view limitations

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

`duel_public_profiles` (defined in `supabase/migrations/0004_duel_integrity.sql`)
is a Postgres **view** over `player_profiles` that exposes only public fields
(`user_id`, `display_name`, `elo`, `wins`, `losses`, `draws`). Views cannot have
a primary key, and Supabase Realtime only supports change subscriptions on
tables with a replica identity / primary key.

Consequence: the client can `SELECT` the view (which is all we use today — the
hub and match header fetch it once), but it **cannot** subscribe to live
leaderboard/opponent updates via Realtime. Any "live" feature (live leaderboard,
opponent-joined toast, live ELO updates) would have to poll or re-fetch.

## Why it was deferred

Phase 1–2 only needed read-only snapshots, which the view serves. Live
subscriptions were out of scope.

## Impact

- Blocks future Realtime-driven UI (leaderboard, match lobby, live opponent ELO).
- No impact on current correctness.

## Options

### A. Mirror table with a primary key (recommended for Realtime)

Replace the view with a real table `duel_public_profiles` (PK = `user_id`)
kept in sync by a trigger on `player_profiles` (insert/update/delete of the
public columns only). Realtime can then subscribe to it.

- **Pros:** Full Realtime support; still least-privilege.
- **Cons:** Adds a trigger and a second source of truth to keep consistent.

### B. Subscribe to `player_profiles` with a filtered channel

Subscribe to the underlying table but only expose public fields via RLS.

- **Pros:** No new table.
- **Cons:** `player_profiles` RLS already allows `SELECT` on the whole row to the
  owner; Realtime would deliver whatever the query selects, and row-level
  filtering of individual columns is limited — higher leak risk.

### C. Polling (current)

Keep the view; refresh data on an interval or on navigation.

- **Pros:** No schema change.
- **Cons:** Not truly live; extra requests.

## Related

- See `getLeaderboard` / `getPublicProfile` in `src/lib/duel/profile.ts`.

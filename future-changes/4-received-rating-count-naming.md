# 4 — `received_rating_count` stores a weighted sum, not a count

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

In `supabase/migrations/0003_duel_reviews.sql`, the denormalized aggregate
column `received_rating_count` is an `integer` but actually stores
`sum(weight)` — the **total weight**, not the number of reviews:

```sql
select coalesce(sum(rating * weight), 0), coalesce(sum(weight), 0)
  into v_wsum, v_count ...
set received_rating_sum = v_wsum,
    received_rating_count = v_count;   -- v_count = sum(weight), not count(*)
```

The weighted average is then `received_rating_sum / received_rating_count`.
Migration `0004_duel_integrity.sql` (lines 208–212) changed the column to
`numeric` to match, but the **name** still says "count". The name is
misleading: a future reader will assume it is a review count and may use it
as such (e.g. "≥ 5 reviews" logic).

## Why it was deferred

Renaming a live column is a breaking schema change that touches the typed
`Database` client and any consumer. It is purely a naming/documentation issue —
no behavior is wrong today.

## Impact

- Maintainability/correctness risk for future work (someone may treat it as an
  integer review count).
- No current functional bug.

## Options

### A. Rename the column (recommended)

Add a migration that renames `received_rating_count` →
`received_rating_weight` (or `received_rating_weight_total`) on both
`player_profiles` and any consumer, and update the typed `Database` in
`src/lib/supabase/client.ts`.

- **Pros:** Removes the ambiguity permanently.
- **Cons:** Breaking; requires a coordinated SQL + typed-client change.

### B. Add a clarifying comment / generated description

Leave the name but document it in the migration and typed client.

- **Pros:** Non-breaking.
- **Cons:** The name remains misleading.

### C. Restore true "count"

Store both a real `received_rating_count` (count of reviews) and keep the
weighted sum separate.

- **Pros:** Semantically correct and more informative.
- **Cons:** Slightly larger aggregate update; changes the meaning of an
  existing column.

## Related

- See `duel_submit_review` in `supabase/migrations/0004_duel_integrity.sql`.

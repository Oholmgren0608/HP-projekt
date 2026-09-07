# Future Changes

Planned follow-up work intentionally left out of the Phase 1–2 duel-integrity
refactor. Each file describes one item: the problem, why it was deferred, the
impact, and concrete implementation options.

## Deferred issues

- [1 — Server-side bot authority](./1-server-side-bot-authority.md)
- [2 — Server-side answer authority](./2-server-side-answer-authority.md)
- [3 — `duel_public_profiles` view limitations](./3-duel-public-profiles-view-limitations.md)
- [4 — `received_rating_count` naming/semantics](./4-received-rating-count-naming.md)
- [5 — Opponent score "—" in match header after finishing](./5-match-header-finished-score.md)
- [6 — Narrow `storage-sync` merge race](./6-storage-sync-merge-race.md)

## Remaining phases

- [Phase 3 — SQL consolidation & deduplication](./phase-3-sql-dedup.md) —
  in-depth implementation spec (additive `0005_duel_dedup.sql`; needs a live DB
  to verify Elo/winner/review behavior).

## Completed phases

- [Phase 4 — TypeScript consolidation & deduplication](./phase-4-typescript-consolidation.md) —
  ✅ completed and committed (see the completion summary in that file).

## Resolved content fixes

- XYZ `name` corrected to `"Matematisk problemlösning"` (grammar) across
  `subtests.ts`, `plan-generator.ts`, `section-tips.ts`, and `practice-hub.tsx`
  (the latter derives it via `nameFor`).
- ELF `isReading` flipped to `true` (reading comprehension → 1–5 questions).
- LÄS/ELF names aligned to the `subtests.ts` word order
  (`Läsförståelse svenska` / `Läsförståelse engelska`).

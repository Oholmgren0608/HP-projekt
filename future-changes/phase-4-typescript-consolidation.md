# Phase 4 — TypeScript consolidation & deduplication

**Status:** Not started. This phase runs after Phase 3 (SQL dedup) or in
parallel with it (disjoint files).

## Goal

Remove duplicated logic and hardcoded subtest data across `src/lib` and
`src/components`, so `src/lib/subtests.ts` is the single source of truth and
shared helpers live in one place. Behavior must not change.

## Current state

### 1. Seeded RNG / shuffle helpers duplicated

The same `mulberry32`/hash-seed/shuffle logic appears in three places:

- `src/lib/practice.ts`
- `src/lib/duel/questions.ts`
- `src/components/flashcards.tsx`

Extract into a shared module (e.g. `src/lib/random.ts`) exporting a seeded PRNG
and deterministic shuffle, then import it in all three. This also lays the
groundwork for future-change #1 (deterministic server-side bot), which needs the
same PRNG ported to SQL.

### 2. Hardcoded subtest data

The following modules still hardcode subtest ids/names/labels/counts/pace
instead of deriving from `src/lib/subtests.ts` (`SUBTESTS` / `SUBTEST_BY_ID` /
`SectionId`):

- `src/lib/mini-level-test.ts`
- `src/lib/plan-generator.ts`
- `src/lib/practice.ts` (`practiceLabel`, `kindBadge`, `defaultQuestionCount`)
- `src/lib/progress-history.ts`
- `src/lib/study-plan.ts`
- `src/lib/section-tips.ts`
- `src/components/practice-hub.tsx`
- `src/components/practice-subtest-selector.tsx`
- `src/components/practice-session.tsx`
- `src/components/free-practice-session.tsx`
- `src/components/daily-srs-review.tsx`
- `src/components/timed-mock-exam.tsx`

Migrate each module to derive from the catalogue, using the `subtests-migrator`
agent. Note the known data divergence: `practice-hub.tsx` has swapped `XYZ`/`NOG`
titles vs the catalogue — flag, do **not** silently change data.

### 3. Practice banks split across three files

- `src/lib/practice.ts` (`ORD_BANK`, `LAS_BANK`, `ELF_BANK`, `DTK_BANK`, `REFLECT_BANK`)
- `src/lib/practice-mek.ts` (`MEK_BANK`)
- `src/lib/practice-kvant.ts` (`XYZ_BANK`, `KVA_BANK`, `NOG_BANK`)

Consider consolidating into a single `banks/` directory or a unified registry keyed
by `PracticeKind`, while keeping files importable to avoid churn. This is optional;
the bigger win is the subtest dedup above.

## Acceptance criteria

- Each module above derives subtest data from `src/lib/subtests.ts` (or is
  explicitly flagged as intentionally divergent).
- Shared RNG/shuffle imported from one module; no duplicated `mulberry32`.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- No functional change to practice, mock exam, SRS, or study-plan behavior.

## Risks

- Changing hardcoded values to match the catalogue is a **data change**, not
  dedup. Preserve existing values and flag discrepancies instead.
- Keep `as const` / `satisfies` / literal types narrow so derived types don't
  widen.

## Related

- `AGENTS.md` — `src/lib/subtests.ts` is the single source of truth.
- `.agents/agents/subtests-migrator.md` — the dedicated migration agent.
- Future-change #1 (bot authority) depends on the shared PRNG extraction.

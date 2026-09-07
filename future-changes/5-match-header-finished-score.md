# 5 — Opponent score shows "—" in match header right after finishing

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

In a human-vs-human duel, when the local player finishes and is shown the
`ResultView`, the `MatchHeader` still renders `—` (dash) for the opponent's
score until the page reloads or the opponent's answers are re-fetched. The real
score is available server-side and shown in `ResultView`, but the header
component's source of truth has not been refreshed in that moment.

## Why it was deferred

Purely cosmetic — the authoritative result is shown elsewhere, and fixing it
requires a small state/refetch wiring change in the match component that was
out of scope for the integrity refactor.

## Impact

- Minor UX confusion: the header and the result view can disagree briefly.

## Options

### A. Refresh opponent data on finalize

After `duel_mark_finished` returns, re-fetch the opponent's public profile /
answers and update the header state before rendering the result.

### B. Derive the header from the same data as `ResultView`

Share the computed score state so the header and result view are always
consistent.

## Related

- `src/components/duel/duel-match.tsx` — `MatchHeader`, `ResultView`.

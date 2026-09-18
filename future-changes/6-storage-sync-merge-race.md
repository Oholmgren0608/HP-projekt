# 6 — Narrow race in `storage-sync` during offline-delete merge

**Status:** Not started. Deferred from the Phase 1–2 duel-integrity refactor.

## Problem

`src/lib/sync/storage-sync.ts` now uses a tombstone value (`-1`) to represent an
offline deletion, and merges local vs. cloud state with "newest wins"
(`updated_at`). There is a narrow race window: if a delete and a concurrent
update for the same key are merged (or a merge runs while a write is in
flight), the tombstone can be incorrectly resurrected or an update can be
dropped. This only manifests under very specific timing (an offline delete that
has not yet synced colliding with another device's write to the same key).

## Why it was deferred

The window is extremely small and requires two devices racing on the same key
during an offline-delete sync. Phase 1–2 fixed the common offline-delete case;
this is the residual edge case.

## Impact

- Low probability of a lost update or resurrected deletion for a single key.
- No data corruption beyond one key's value.

## Options

### A. Per-key merge queue with monotonic versions

Serialize reads/writes/merges per key (e.g. a promise chain per key) so a merge
never interleaves with an in-flight write.

### B. Compare-and-swap / LWW with tombstones on the server

Make `user_state` upserts use a monotonic version or explicit tombstone
comparison so stale writes never resurrect a delete.

### C. Full offline-first sync library

If offline support grows, adopt a proper sync primitive (CRDT or revision-based)
rather than the hand-rolled LWW.

## Related

- `src/lib/sync/storage-sync.ts` (tombstone `-1`, LWW merge).
- See future-change #1 for the related, separate issue of bot decision
  non-determinism on mid-match reload.

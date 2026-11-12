/**
 * Delprov och tid per fråga i tävlingslägena (duell och Alla mot alla).
 * Servern äger tiden (`pool_time_limit_ms` i migration 0037); de här värdena
 * används bara för att visa nedräkningen och måste stämma med servern.
 */
export const POOL_KINDS = ["ord", "mek", "xyz", "kva", "nog"] as const;
export type PoolKind = (typeof POOL_KINDS)[number];

/**
 * Delprov vars frågor kommer ur den stängda spelpoolen (questions.pool = 'spel').
 * XYZ, KVA och NOG väljs bland de publicerade UHR-frågorna (migration 0041), så
 * egna frågor i de delproven hör hemma i övningen.
 */
export const CLOSED_POOL_KINDS: readonly PoolKind[] = ["ord", "mek"];

export function isClosedPoolKind(kind: string): boolean {
  return (CLOSED_POOL_KINDS as readonly string[]).includes(kind);
}

const LIMITS_MS: Record<PoolKind, number> = {
  ord: 20_000,
  mek: 45_000,
  kva: 75_000,
  xyz: 90_000,
  nog: 90_000,
};

export function isPoolKind(kind: string): kind is PoolKind {
  return (POOL_KINDS as readonly string[]).includes(kind);
}

/** Tid per fråga i millisekunder; okända delprov får 60 s som på servern. */
export function poolTimeLimitMs(kind: string): number {
  return isPoolKind(kind) ? LIMITS_MS[kind] : 60_000;
}

/** Servern godtar svar så här länge efter tidsgränsen (nätfördröjning). */
export const POOL_TIME_GRACE_MS = 2_000;

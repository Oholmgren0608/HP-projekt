import type { AmaPlayer } from "@/lib/supabase/client";

/** "1:a", "2:a", "3:e" … */
export function placement(rank: number): string {
  return `${rank}:${rank === 1 || rank === 2 ? "a" : "e"}`;
}

/** Poäng med svenskt tusentalsavgränsare: 12 400. */
export function formatPoints(points: number): string {
  const n = Math.round(points);
  const grouped = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 ? `−${grouped}` : grouped;
}

/** Topp 5 plus den egna raden om den inte redan är med. */
export function topWithMe(players: AmaPlayer[], n = 5): { rows: AmaPlayer[]; meOutside: AmaPlayer | null } {
  const rows = players.slice(0, n);
  const me = players.find((p) => p.is_me) ?? null;
  return { rows, meOutside: me && !rows.includes(me) ? me : null };
}

/** Andel (0–100) av svaren som valde varje alternativ. */
export function distributionPercent(distribution: number[]): number[] {
  const total = distribution.reduce((a, b) => a + b, 0);
  return distribution.map((n) => (total === 0 ? 0 : Math.round((n / total) * 100)));
}

/** Läsbar delprovslista: "ORD, KVA och NOG". */
export function kindsText(kinds: string[]): string {
  const up = kinds.map((k) => k.toUpperCase());
  if (up.length <= 1) return up.join("");
  return `${up.slice(0, -1).join(", ")} och ${up[up.length - 1]}`;
}

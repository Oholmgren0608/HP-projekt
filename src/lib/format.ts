export function formatMmSs(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function pct(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}

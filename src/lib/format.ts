export function formatMmSs(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function pct(correct: number, total: number): number {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Kort relativ tidsangivelse på svenska, t.ex. "5 min sedan" eller "i går". */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const sekunder = Math.round((now - then) / 1000);
  if (sekunder < 45) return "nyss";
  if (sekunder < 3600) return `${Math.max(1, Math.round(sekunder / 60))} min sedan`;
  if (sekunder < 86400) return `${Math.round(sekunder / 3600)} tim sedan`;
  const dagar = Math.round(sekunder / 86400);
  if (dagar === 1) return "i går";
  if (dagar < 7) return `${dagar} dagar sedan`;
  if (dagar < 30) return `${Math.round(dagar / 7)} v sedan`;
  return new Date(then).toLocaleDateString("sv-SE");
}

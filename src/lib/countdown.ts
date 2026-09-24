/**
 * Delade hjälpare för nedräkning i de tidsatta lägena (nivåtest, övning,
 * provpass). Ren logik utan React så att den kan återanvändas och testas.
 */

/** Diskret varning när så här många sekunder återstår. */
export const COUNTDOWN_WARN_SECONDS = 5 * 60;
/** Sista varningen innan tiden tar slut. */
export const COUNTDOWN_FINAL_WARN_SECONDS = 60;

export type CountdownWarning = "five" | "final" | null;

/** Nedräkning som "18:42" (även under tio minuter och över en timme). */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Varningsnivå utifrån återstående tid (null = ingen tidsgräns eller gott om tid). */
export function countdownWarning(remainingSeconds: number | null): CountdownWarning {
  if (remainingSeconds === null) return null;
  if (remainingSeconds <= COUNTDOWN_FINAL_WARN_SECONDS) return "final";
  if (remainingSeconds <= COUNTDOWN_WARN_SECONDS) return "five";
  return null;
}

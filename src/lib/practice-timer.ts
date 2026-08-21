/** Pausbar övningstimer — räknar bara medan användaren är inne i passet. */

export type PracticeTimerState = {
  accumulatedMs: number;
};

export function practiceTimerKey(week: number, taskId: string) {
  return `hp-practice-timer:w${week}:${taskId}`;
}

export function loadPracticeTimer(week: number, taskId: string): PracticeTimerState {
  if (typeof window === "undefined") return { accumulatedMs: 0 };
  try {
    const raw = window.sessionStorage.getItem(practiceTimerKey(week, taskId));
    if (!raw) return { accumulatedMs: 0 };
    const parsed = JSON.parse(raw) as PracticeTimerState;
    if (typeof parsed?.accumulatedMs === "number" && parsed.accumulatedMs >= 0) {
      return { accumulatedMs: parsed.accumulatedMs };
    }
  } catch {
    /* ignore */
  }
  return { accumulatedMs: 0 };
}

export function savePracticeTimer(week: number, taskId: string, state: PracticeTimerState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(practiceTimerKey(week, taskId), JSON.stringify(state));
}

export function clearPracticeTimer(week: number, taskId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(practiceTimerKey(week, taskId));
  // legacy key from wall-clock timer
  window.sessionStorage.removeItem(`hp-session-start:w${week}:${taskId}`);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

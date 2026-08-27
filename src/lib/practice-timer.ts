/** Pausbar övningstimer — räknar bara medan användaren är inne i passet. */

export type PracticeTimerState = {
  accumulatedMs: number;
  /** Stabilt id för ett pågående försök — nya frågor vid nytt försök */
  attemptId: string;
};

export function practiceTimerKey(week: number, taskId: string) {
  return `hp-practice-timer:w${week}:${taskId}`;
}

export function createAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadPracticeTimer(week: number, taskId: string): PracticeTimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(practiceTimerKey(week, taskId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeTimerState>;
    if (typeof parsed?.accumulatedMs === "number" && parsed.accumulatedMs >= 0) {
      return {
        accumulatedMs: parsed.accumulatedMs,
        attemptId:
          typeof parsed.attemptId === "string" && parsed.attemptId.length > 0
            ? parsed.attemptId
            : createAttemptId(),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Ladda pågående försök, eller skapa ett nytt (nya frågor). */
export function loadOrStartPracticeSession(
  week: number,
  taskId: string,
): PracticeTimerState {
  const existing = loadPracticeTimer(week, taskId);
  if (existing) {
    // Se till att äldre sparad data utan attemptId skrivs tillbaka
    savePracticeTimer(week, taskId, existing);
    return existing;
  }
  const created: PracticeTimerState = {
    accumulatedMs: 0,
    attemptId: createAttemptId(),
  };
  savePracticeTimer(week, taskId, created);
  return created;
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

/** Starta om samma uppgift med ett nytt frågeset (nollställer tid). */
export function resetPracticeSession(week: number, taskId: string): PracticeTimerState {
  const created: PracticeTimerState = {
    accumulatedMs: 0,
    attemptId: createAttemptId(),
  };
  savePracticeTimer(week, taskId, created);
  return created;
}

/** Nytt frågeset på samma uppgift — behåller sparad aktiv tid mot veckomålet. */
export function newPracticeAttempt(week: number, taskId: string): PracticeTimerState {
  const existing = loadPracticeTimer(week, taskId);
  const next: PracticeTimerState = {
    accumulatedMs: existing?.accumulatedMs ?? 0,
    attemptId: createAttemptId(),
  };
  savePracticeTimer(week, taskId, next);
  return next;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Pausbar övningstimer — räknar bara medan användaren är inne i passet. */

import { formatMmSs } from "@/lib/format";

export type PracticeTimerState = {
  accumulatedMs: number;
  /** Stabilt id för ett pågående försök — nya frågor vid nytt försök */
  attemptId: string;
  /** Sant när frågesetet är färdiggjort (sista frågan loggad). */
  quizComplete?: boolean;
};

export function practiceTimerKey(week: number, taskId: string) {
  return `hp-practice-timer:w${week}:${taskId}`;
}

export function createAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeTimerState(parsed: Partial<PracticeTimerState>): PracticeTimerState | null {
  if (typeof parsed?.accumulatedMs !== "number" || parsed.accumulatedMs < 0) return null;
  return {
    accumulatedMs: parsed.accumulatedMs,
    attemptId:
      typeof parsed.attemptId === "string" && parsed.attemptId.length > 0
        ? parsed.attemptId
        : createAttemptId(),
    ...(parsed.quizComplete === true ? { quizComplete: true as const } : {}),
  };
}

export function loadPracticeTimer(week: number, taskId: string): PracticeTimerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(practiceTimerKey(week, taskId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeTimerState>;
    return normalizeTimerState(parsed);
  } catch {
    /* ignore */
  }
  return null;
}

/** Pågående pass: tid sparad och frågesetet inte klart. */
export function isPracticeInProgress(state: PracticeTimerState | null): boolean {
  return Boolean(state && !state.quizComplete && state.accumulatedMs > 0);
}

/** Ladda pågående försök, eller skapa ett nytt (nya frågor). */
export function loadOrStartPracticeSession(
  week: number,
  taskId: string,
): PracticeTimerState {
  const existing = loadPracticeTimer(week, taskId);
  if (existing?.quizComplete) {
    return newPracticeAttempt(week, taskId);
  }
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

/**
 * Spara pausad tid. Om sessionStorage redan har ett nyare attemptId
 * (t.ex. “Ny övning” innan unmount) skrivs inte det gamla id:t tillbaka —
 * bara extraMs läggs på det lagrade försöket.
 */
export function savePausedPracticeTimer(
  week: number,
  taskId: string,
  current: PracticeTimerState,
  extraMs: number,
): { saved: PracticeTimerState; replacedByNewerAttempt: boolean } {
  const extra = Math.max(0, extraMs);
  const stored = loadPracticeTimer(week, taskId);
  if (stored && stored.attemptId !== current.attemptId) {
    const saved: PracticeTimerState = {
      ...stored,
      accumulatedMs: stored.accumulatedMs + extra,
    };
    savePracticeTimer(week, taskId, saved);
    return { saved, replacedByNewerAttempt: true };
  }
  const saved: PracticeTimerState = {
    ...current,
    accumulatedMs: current.accumulatedMs + extra,
  };
  savePracticeTimer(week, taskId, saved);
  return { saved, replacedByNewerAttempt: false };
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
  return formatMmSs(totalSeconds);
}

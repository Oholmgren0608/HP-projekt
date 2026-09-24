import { storageSet } from "@/lib/sync/storage-sync";
import { loadJson } from "@/lib/storage";

/**
 * Tidsgräns för nivåtestet.
 *
 * Tiderna är kalibrerade mot provets tempo (ca 1,3 minuter per fråga) och
 * används för att räkna fram en rekommenderad tid utifrån antalet valda
 * frågor. Timern påverkar varken frågeurvalet eller hur nivån räknas — den
 * styr bara hur lång tid man har på sig.
 *
 * Nedräkning, varningar och tidsformat delas med övriga tidsatta lägen i
 * `@/lib/countdown` och `@/lib/use-quiz-countdown`.
 */

export const NIVATEST_TIME_TABLE = [
  { questions: 8, minutes: 11 },
  { questions: 12, minutes: 16 },
  { questions: 16, minutes: 21 },
  { questions: 24, minutes: 32 },
  { questions: 32, minutes: 43 },
  { questions: 40, minutes: 53 },
] as const;

/**
 * Rekommenderad tid i hela minuter. Exakta träffar i tabellen returneras rakt
 * av; mellanliggande antal frågor interpoleras linjärt mellan nivåerna, och
 * översta nivån fortsätter med samma tid per fråga.
 */
export function nivatestMinutesFor(totalQuestions: number): number {
  const total = Math.round(totalQuestions);
  if (!Number.isFinite(total) || total <= 0) return 0;

  const first = NIVATEST_TIME_TABLE[0];
  if (total <= first.questions) {
    return Math.max(1, Math.round((first.minutes * total) / first.questions));
  }

  for (let i = 1; i < NIVATEST_TIME_TABLE.length; i += 1) {
    const lower = NIVATEST_TIME_TABLE[i - 1];
    const upper = NIVATEST_TIME_TABLE[i];
    if (total <= upper.questions) {
      const share = (total - lower.questions) / (upper.questions - lower.questions);
      return Math.round(lower.minutes + share * (upper.minutes - lower.minutes));
    }
  }

  const last = NIVATEST_TIME_TABLE[NIVATEST_TIME_TABLE.length - 1];
  const previous = NIVATEST_TIME_TABLE[NIVATEST_TIME_TABLE.length - 2];
  const minutesPerQuestion = (last.minutes - previous.minutes) / (last.questions - previous.questions);
  return Math.round(last.minutes + (total - last.questions) * minutesPerQuestion);
}

export const NIVATEST_TIMER_STORAGE_KEY = "hp-lift-nivatest-timer-v1";

/** Påslagen som standard — den rekommenderade tiden är det som visas först. */
export function loadNivatestTimerEnabled(): boolean {
  return loadJson<boolean | null>(NIVATEST_TIMER_STORAGE_KEY, null) !== false;
}

export function saveNivatestTimerEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    storageSet(NIVATEST_TIMER_STORAGE_KEY, JSON.stringify(enabled));
  } catch {
    // Kvot/privat läge: valet får inte krascha testet.
  }
}

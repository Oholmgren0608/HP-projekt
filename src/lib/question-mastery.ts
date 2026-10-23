import { isCorrect } from "@/lib/quiz";
import type { ChoiceQuestion } from "@/lib/practice-types";
import { storageSet } from "@/lib/sync/storage-sync";
import { loadJson } from "@/lib/storage";

/**
 * Bemästrade frågor: en fråga är bemästrad när användaren svarat rätt på den
 * tre gånger i rad. Ett fel svar nollställer serien, så en fråga kan sluta vara
 * bemästrad. Obesvarade frågor (t.ex. när tiden tog slut) påverkar inte serien.
 *
 * Lagras som rätta svar i rad per fråge-id. Den tidigare nyckeln
 * `hp-lift-mastered-v1` räknade ett enda rätt svar som bemästrat och läses inte
 * längre.
 */
export const MASTERY_STORAGE_KEY = "hp-lift-mastery-v2";

/** Antal rätta svar i rad som krävs. */
export const MASTERY_STREAK = 3;

/** Rätta svar i rad per fråge-id, ur ett lagrat (eller synkat) värde. */
export function parseMasteryStreaks(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const streaks: Record<string, number> = {};
  for (const [id, streak] of Object.entries(value)) {
    if (id && typeof streak === "number" && Number.isInteger(streak) && streak > 0) {
      streaks[id] = Math.min(streak, MASTERY_STREAK);
    }
  }
  return streaks;
}

export function countMastered(streaks: Record<string, number>): number {
  return Object.values(streaks).filter((streak) => streak >= MASTERY_STREAK).length;
}

function loadMasteryStreaks(): Record<string, number> {
  return parseMasteryStreaks(loadJson<unknown>(MASTERY_STORAGE_KEY, null));
}

export function loadMasteredQuestionIds(): Set<string> {
  const streaks = loadMasteryStreaks();
  return new Set(Object.keys(streaks).filter((id) => streaks[id] >= MASTERY_STREAK));
}

/** Uppdatera serierna med svaren från ett avslutat pass (alla delprov). */
export function recordMasteryAnswers(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
) {
  if (typeof window === "undefined") return;
  const streaks = loadMasteryStreaks();
  let changed = false;
  for (const q of questions) {
    if (answers[q.id] === undefined) continue;
    if (isCorrect(q, answers)) {
      const next = Math.min((streaks[q.id] ?? 0) + 1, MASTERY_STREAK);
      if (next !== streaks[q.id]) {
        streaks[q.id] = next;
        changed = true;
      }
    } else if (streaks[q.id] !== undefined) {
      delete streaks[q.id];
      changed = true;
    }
  }
  if (changed) storageSet(MASTERY_STORAGE_KEY, JSON.stringify(streaks));
}

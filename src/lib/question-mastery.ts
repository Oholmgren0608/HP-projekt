import { isCorrect } from "@/lib/quiz";
import type { ChoiceQuestion } from "@/lib/practice-types";
import { storageSet } from "@/lib/sync/storage-sync";
import { loadJson } from "@/lib/storage";

const MASTERY_STORAGE_KEY = "hp-lift-mastered-v1";

export function loadMasteredQuestionIds(): Set<string> {
  const parsed = loadJson<unknown>(MASTERY_STORAGE_KEY, null);
  if (!Array.isArray(parsed)) return new Set();
  return new Set(
    parsed.filter((id): id is string => typeof id === "string" && id.length > 0),
  );
}

function saveMasteredQuestionIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  storageSet(MASTERY_STORAGE_KEY, JSON.stringify([...ids]));
}

/** Spara fråge-id som användaren svarat rätt på (alla delprov). */
export function recordMasteredQuestions(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
) {
  const mastered = loadMasteredQuestionIds();
  let added = false;
  for (const q of questions) {
    if (isCorrect(q, answers) && !mastered.has(q.id)) {
      mastered.add(q.id);
      added = true;
    }
  }
  if (added) saveMasteredQuestionIds(mastered);
}

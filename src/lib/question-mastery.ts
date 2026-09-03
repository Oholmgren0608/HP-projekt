import { storageGet, storageSet } from "@/lib/sync/storage-sync";

const MASTERY_STORAGE_KEY = "hp-lift-mastered-v1";

type GradedItem = {
  id: string;
  correctIndex: number;
};

export function loadMasteredQuestionIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = storageGet(MASTERY_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is string => typeof id === "string" && id.length > 0),
    );
  } catch {
    return new Set();
  }
}

function saveMasteredQuestionIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  storageSet(MASTERY_STORAGE_KEY, JSON.stringify([...ids]));
}

/** Spara fråge-id som användaren svarat rätt på (alla delprov). */
export function recordMasteredQuestions(
  questions: readonly GradedItem[],
  answers: Record<string, number>,
) {
  const mastered = loadMasteredQuestionIds();
  let added = false;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex && !mastered.has(q.id)) {
      mastered.add(q.id);
      added = true;
    }
  }
  if (added) saveMasteredQuestionIds(mastered);
}

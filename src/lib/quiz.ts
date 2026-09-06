import type { ChoiceQuestion } from "@/lib/practice-types";

export type KindTally = { correct: number; total: number };

export function isCorrect(q: ChoiceQuestion, answers: Record<string, number>): boolean {
  return answers[q.id] === q.correctIndex;
}

export function tally(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  return { correct, total: questions.length };
}

export function tallyByKind(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
): Record<string, KindTally> {
  const map: Record<string, KindTally> = {};
  for (const q of questions) {
    const row = (map[q.kind] ??= { correct: 0, total: 0 });
    row.total += 1;
    if (answers[q.id] === q.correctIndex) row.correct += 1;
  }
  return map;
}

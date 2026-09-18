import { tally, tallyByKind } from "@/lib/quiz";
import { appendQuizResult, type QuizSource } from "@/lib/progress-history";
import { recordMasteredQuestions } from "@/lib/question-mastery";
import { recordMissedQuestions } from "@/lib/error-srs";
import { rememberShownQuestions } from "@/lib/practice";
import type { ChoiceQuestion, PracticeKind } from "@/lib/practice-types";

export type QuizOutcomeOptions = {
  source: string;
  questions: readonly ChoiceQuestion[];
  answers: Record<string, number>;
  /** Active time for the pass, when known. Omitted from history when undefined. */
  durationMs?: number;
  /** Defaults to the unique kinds present in `questions`. */
  kinds?: PracticeKind[];
  /** Record missed questions into SRS error cards. Default true. */
  trackSrs?: boolean;
  /** Record correctly answered questions as mastered. Default true. */
  trackMastery?: boolean;
  /** Remember shown question ids per kind. Default true. */
  rememberShown?: boolean;
};

/**
 * Logga ett avslutat quiz i ett enda anrop: övningshistorik + (valfritt)
 * felkort i SRS, mastered-frågor och "visade frågor" per delprov.
 */
export function recordQuizOutcome(opts: QuizOutcomeOptions) {
  const {
    source,
    questions,
    answers,
    durationMs,
    kinds = [...new Set(questions.map((q) => q.kind))],
    trackSrs = true,
    trackMastery = true,
    rememberShown = true,
  } = opts;

  const { correct, total } = tally(questions, answers);
  const perKind = tallyByKind(questions, answers);

  appendQuizResult({
    source: source as QuizSource,
    kinds,
    correct,
    total,
    perKind,
    ...(durationMs !== undefined ? { durationMs } : {}),
  });

  if (trackSrs) recordMissedQuestions([...questions], answers);
  if (trackMastery) recordMasteredQuestions([...questions], answers);
  if (rememberShown) rememberShownQuestions([...questions]);
}

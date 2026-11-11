/** Datamodeller som delas mellan review-server actions och review-klienten. */

import { isPublishableProvfraga } from "@/lib/uhr";

export type QuestionStatus = "draft" | "published" | "rejected";

export type ReviewQuestion = {
  id: string;
  kind: string;
  prompt: string;
  passage: string | null;
  options: string[];
  correctIndex: number;
  explain: string;
  examId: string | null;
  examDate: string | null;
  passNumber: number | null;
  questionNumber: number | null;
  figureUrl: string | null;
  sourceUrl: string | null;
  status: QuestionStatus | (string & {});
  /** Andra kontrollen av en övningsfråga; null för äldre frågor och provfrågor. */
  verification: "agreed" | "disagreed" | null;
  verificationNote: string | null;
  /** Öppna felrapporter från användare (utan vem som skickade dem). */
  openReports: { reason: string; createdAt: string }[];
  /** Sant när frågan har en figur som inte gick att signera. */
  figureUnavailable?: boolean;
  /** 'ovning' (publik) eller 'spel' (stängd spelpool för duell och Alla mot alla, 0035). */
  pool: "ovning" | "spel";
};

/** Grupp-id för övningsfrågorna (frågor utan provtillhörighet). */
export const PRACTICE_GROUP_ID = "__legacy__";

/** Grupp-id för provfrågor som saknar exam_id men har ett provfråge-id. */
export const UNKNOWN_EXAM_GROUP_ID = "__provfragor__";

/**
 * Provfråga = fråga ur UHR:s prov: har exam_id eller ett id på formen "hp-…".
 * De kvantitativa får publiceras sedan 0040 (UHR:s tillstånd); de verbala är
 * förlagor som aldrig publiceras.
 */
export function isProvfraga(q: { id: string; examId: string | null }): boolean {
  return q.examId != null || q.id.startsWith("hp-");
}

/** Får frågan publiceras? Övningsfrågor alltid, Provfrågor enligt databasens villkor (0040). */
export function canPublish(q: Pick<ReviewQuestion, "id" | "kind" | "examId" | "explain" | "pool">): boolean {
  return !isProvfraga(q) || isPublishableProvfraga(q);
}

export type ReviewExamGroup = {
  /** Provets id, eller PRACTICE_GROUP_ID för övningsfrågorna. */
  examId: string;
  examDate: string | null;
  title: string;
  questions: ReviewQuestion[];
};

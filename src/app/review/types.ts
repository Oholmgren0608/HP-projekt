/** Datamodeller som delas mellan review-server actions och review-klienten. */

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
};

export type ReviewExamGroup = {
  /** Examens id, eller "__legacy__" för frågor utan provtillhörighet. */
  examId: string;
  examDate: string | null;
  title: string;
  examStatus: string;
  questions: ReviewQuestion[];
};

export type PracticeKind =
  | "ord"
  | "mek"
  | "las"
  | "elf"
  | "dtk"
  | "xyz"
  | "kva"
  | "nog"
  | "reflect";

export type ChoiceQuestion = {
  id: string;
  kind: Exclude<PracticeKind, "reflect">;
  prompt: string;
  passage?: string;
  options: string[];
  correctIndex: number;
  explain: string;
  examId?: string;
  examDate?: string;
  passNumber?: number;
  questionNumber?: number;
  figureUrl?: string;
  status?: string;
};

export interface ExamRecord {
  id: string;
  examDate: string;
  title: string;
  status: string;
}

export type ReflectPrompt = {
  id: string;
  title: string;
  prompts: string[];
};

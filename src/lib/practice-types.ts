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
  figureUrl?: string;
};

export type ReflectPrompt = {
  id: string;
  title: string;
  prompts: string[];
};

import type { PracticeKind } from "@/lib/practice";
import type { SectionId } from "@/lib/subtests";
import { SUBTEST_BY_ID } from "@/lib/subtests";

export type { SectionId } from "@/lib/subtests";

export type Priority = "kritiskt" | "huvudfokus" | "underhall" | "styrka";

export type StudyTask = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  section: SectionId;
  /** Interaktiva övningar som körs på webbsidan */
  practiceKinds: PracticeKind[];
  questionCount?: number;
};

export type WeekPlan = {
  week: number;
  phase: string;
  theme: string;
  focus: string;
  tasks: StudyTask[];
};

export type SectionGuide = {
  id: SectionId;
  name: string;
  short: string;
  priority: Priority;
  scoreLabel: string;
  why: string;
  methods: string[];
  weeklyGoal: string;
};

export type DelprovScore = {
  id: SectionId;
  name: string;
  correct: number;
  total: number;
  block: "kvant" | "verbal";
};

export function pct(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}

export const READING_METHOD = [
  "Primärt mål med läsning nu: ORD-ord + MEK-konnektorer (LÄS är redan 75 %).",
  "Efter varje text: en mening sammanfattning utan att titta tillbaka.",
  "Plocka 5 ord/uttryck → ORD-decket samma dag.",
  "Markera konnektorer (emellertid, således, däremot…) — det är din MEK-träning.",
  "Undvik sport/nöje/talspråkskrönikor — för låg densitet för HP.",
];

export function sectionLabel(id: SectionId): string {
  if (id === "KVA") return "Kvant";
  return SUBTEST_BY_ID[id].short;
}

export function priorityLabel(p: Priority): string {
  if (p === "kritiskt") return "Kritiskt";
  if (p === "huvudfokus") return "Huvudfokus";
  if (p === "underhall") return "Underhåll";
  return "Styrka";
}

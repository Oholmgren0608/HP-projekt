import type { PracticeKind } from "@/lib/practice-types";

export type SectionId = "ORD" | "LAS" | "MEK" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK";

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

export function sectionLabel(id: SectionId): string {
  const map: Partial<Record<SectionId, string>> = {
    LAS: "LÄS",
    KVA: "Kvant",
  };
  return map[id] ?? id;
}

export function priorityLabel(p: Priority): string {
  if (p === "kritiskt") return "Kritiskt";
  if (p === "huvudfokus") return "Huvudfokus";
  if (p === "underhall") return "Underhåll";
  return "Styrka";
}

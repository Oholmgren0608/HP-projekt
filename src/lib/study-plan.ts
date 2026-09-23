import type { PracticeKind } from "@/lib/practice-types";
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

export function sectionLabel(id: SectionId): string {
  return SUBTEST_BY_ID[id].short;
}

export function priorityLabel(p: Priority): string {
  if (p === "kritiskt") return "Kritiskt";
  if (p === "huvudfokus") return "Huvudfokus";
  if (p === "underhall") return "Underhåll";
  return "Styrka";
}

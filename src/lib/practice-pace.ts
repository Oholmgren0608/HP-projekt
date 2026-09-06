import { formatMmSs } from "@/lib/format";
import { kindToSection } from "@/lib/section-kinds";
import type { SectionId } from "@/lib/study-plan";

export { kindToSection } from "@/lib/section-kinds";

/** HP-pass: 40 frågor på 55 min ≈ 82 s/fråga. Text/DTK får mer, ORD/KVA lite mindre. */
export const SEC_PER_QUESTION_CAP: Record<SectionId, number> = {
  ORD: 50,
  KVA: 70,
  MEK: 75,
  XYZ: 82,
  NOG: 82,
  DTK: 100,
  LAS: 110,
  ELF: 110,
};

export const MIXED_SEC_PER_QUESTION_CAP = 82;

export function capForKinds(kinds: string[]): number {
  const sections = kinds
    .map((k) => kindToSection(k))
    .filter((id): id is SectionId => Boolean(id));
  if (sections.length === 0) return MIXED_SEC_PER_QUESTION_CAP;
  if (sections.length === 1) return SEC_PER_QUESTION_CAP[sections[0]];
  const sum = sections.reduce((acc, id) => acc + SEC_PER_QUESTION_CAP[id], 0);
  return Math.round(sum / sections.length);
}

export function secondsPerQuestion(durationMs: number, total: number): number | null {
  if (total <= 0 || durationMs <= 0) return null;
  return durationMs / 1000 / total;
}

export function formatSecondsPerQuestion(sec: number): string {
  return formatMmSs(Math.round(sec));
}

export type PaceVerdict = {
  secPerQ: number;
  cap: number;
  over: boolean;
};

export function paceVerdict(
  durationMs: number,
  total: number,
  kinds: string[],
): PaceVerdict | null {
  const secPerQ = secondsPerQuestion(durationMs, total);
  if (secPerQ === null) return null;
  const cap = capForKinds(kinds);
  return { secPerQ, cap, over: secPerQ > cap };
}

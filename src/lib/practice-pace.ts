import { SUBTESTS } from "@/lib/subtests";
import { formatMmSs } from "@/lib/format";
import { mixedQuizSize } from "@/lib/practice";
import { kindToSection } from "@/lib/section-kinds";
import type { SectionId, StudyTask } from "@/lib/study-plan";

export { kindToSection } from "@/lib/section-kinds";

/** HP-pass: 40 frågor på 55 min ≈ 82 s/fråga. Text/DTK får mer, ORD/KVA lite mindre. */
export const SEC_PER_QUESTION_CAP = SUBTESTS.reduce<Record<SectionId, number>>(
  (acc, s) => {
    acc[s.id] = s.secPerQuestion;
    return acc;
  },
  {} as Record<SectionId, number>,
);

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

/** Svara i provtempo plus tid att läsa facit och förklaringar. */
const REVIEW_FACTOR = 1.25;
const REFLECT_MINUTES = 10;
const MIN_REQUIRED_MINUTES = 5;

/**
 * Aktiv övningstid som krävs innan en veckouppgift kan markeras klar: frågorna
 * passet faktiskt får (banken kan vara mindre än questionCount) i provtempo plus
 * genomgång, avrundat till 5 min och aldrig mer än uppgiftens planerade minuter.
 * De planerade minuterna skalas efter veckotiden och kan vara flera timmar — att
 * kräva dem gav t.ex. 155 min för fyra frågor.
 */
export function requiredPracticeMinutes(task: StudyTask): number {
  const isReflect = task.practiceKinds.length === 1 && task.practiceKinds[0] === "reflect";
  const minutes = isReflect
    ? REFLECT_MINUTES
    : (mixedQuizSize(task.practiceKinds, task.questionCount ?? 8) *
        capForKinds(task.practiceKinds) *
        REVIEW_FACTOR) /
      60;
  const rounded = Math.max(MIN_REQUIRED_MINUTES, Math.round(minutes / 5) * 5);
  return Math.min(task.minutes, rounded);
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

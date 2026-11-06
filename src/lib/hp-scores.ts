import type { SectionId } from "@/lib/study-plan";
import { SUBTESTS } from "@/lib/subtests";
import { storageGet, storageRemove, storageSet } from "@/lib/sync/storage-sync";
import { loadJson } from "@/lib/storage";
import { isDateKey, planStartFor, planWeekCount } from "@/lib/exam-date";

export const DELPROV_META: {
  id: SectionId;
  name: string;
  total: number;
  block: "kvant" | "verbal";
}[] = SUBTESTS.map(({ id, name, total, block }) => ({ id, name, total, block }));

export type ScoreInput = {
  quantNorm: number;
  verbalNorm: number;
  hoursPerWeek: number;
  /**
   * Veckor i planen. Med provdatum räknas det fram ur `planStart` och
   * `examDate` (se exam-date.ts); äldre sparade underlag har bara talet.
   */
  weeksUntilExam: number;
  /** Provdatum, "YYYY-MM-DD". Saknas i underlag från före provdatumen. */
  examDate?: string;
  /** Planens första måndag, "YYYY-MM-DD". Sätts tillsammans med examDate. */
  planStart?: string;
  /**
   * Dagen planen skapades, "YYYY-MM-DD". Skapas den mitt i en vecka räknas
   * veckans tidigare dagar inte som missade.
   */
  planCreated?: string;
  /** correct answers per delprov id */
  delprov: Record<SectionId, number>;
};

/**
 * Sätter provdatumet på ett underlag. Planens start behålls om provdatumet är
 * detsamma som förut (nya resultat ska inte flytta kalendern), annars blir den
 * den här veckan (eller en senare måndag om provet är mer än 16 veckor bort).
 */
export function withExamDate(
  scores: Omit<ScoreInput, "examDate" | "planStart" | "planCreated">,
  examDate: string,
  today: string,
  previous?: Pick<ScoreInput, "examDate" | "planStart" | "planCreated"> | null,
): ScoreInput {
  const keep = previous?.examDate === examDate && previous.planStart && isDateKey(previous.planStart);
  const planStart = keep ? previous!.planStart! : planStartFor(examDate, today);
  const planCreated = keep ? (isDateKey(previous!.planCreated) ? previous!.planCreated : undefined) : today;
  return {
    ...scores,
    examDate,
    planStart,
    ...(planCreated ? { planCreated } : {}),
    weeksUntilExam: planWeekCount(planStart, examDate),
  };
}

/**
 * Neutrala reservvärden för enskilda fält som saknar giltigt värde i *sparad*
 * data. Är aldrig ett påhittat underlag: finns inget sparat underlag returnerar
 * `loadScores()` null och appen visar ett tomt läge i stället.
 */
export const DEFAULT_SCORES: ScoreInput = {
  quantNorm: 1.4,
  verbalNorm: 1.0,
  hoursPerWeek: 10,
  weeksUntilExam: 8,
  delprov: {
    KVA: 15,
    DTK: 16,
    XYZ: 21,
    NOG: 10,
    ORD: 11,
    LAS: 15,
    MEK: 8,
    ELF: 17,
  },
};

export const SCORES_STORAGE_KEY = "hp-lift-scores-v1";

export function clampDelprov(id: SectionId, value: number): number {
  const meta = DELPROV_META.find((m) => m.id === id)!;
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(meta.total, Math.round(value)));
}

export function clampNorm(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(2, Math.round(value * 10) / 10));
}

export function clampHoursPerWeek(value: unknown): number {
  if (value === null || value === undefined) return DEFAULT_SCORES.hoursPerWeek;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SCORES.hoursPerWeek;
  return Math.round(Math.max(3, Math.min(40, n)));
}

export function clampWeeksUntilExam(value: unknown): number {
  if (value === null || value === undefined) return DEFAULT_SCORES.weeksUntilExam;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SCORES.weeksUntilExam;
  // 1-3 veckor är giltiga: planen lägger då nedtrappningen på sista veckan.
  return Math.round(Math.max(1, Math.min(16, n)));
}

/**
 * Läser användarens sparade underlag. Returnerar `null` när inget underlag
 * sparats (flaggan saknas) eller när det som ligger i storage är ofullständigt —
 * appen visar då ett tomt läge i stället för påhittade siffror.
 */
export function loadScores(): ScoreInput | null {
  if (typeof window === "undefined") return null;
  if (!loadHasSavedScores()) return null;
  const parsed = loadJson<Partial<ScoreInput> | null>(SCORES_STORAGE_KEY, null);
  if (!parsed || !parsed.delprov) return null;
  try {
    const delprov = { ...DEFAULT_SCORES.delprov };
    for (const m of DELPROV_META) {
      const value = parsed.delprov[m.id];
      if (typeof value !== "number" || Number.isNaN(value)) return null;
      delprov[m.id] = clampDelprov(m.id, value);
    }
    if (typeof parsed.quantNorm !== "number" || typeof parsed.verbalNorm !== "number") {
      return null;
    }
    const base = {
      quantNorm: clampNorm(parsed.quantNorm),
      verbalNorm: clampNorm(parsed.verbalNorm),
      hoursPerWeek: clampHoursPerWeek(parsed.hoursPerWeek),
      weeksUntilExam: clampWeeksUntilExam(parsed.weeksUntilExam),
      delprov,
    };
    if (isDateKey(parsed.examDate) && isDateKey(parsed.planStart)) {
      return {
        ...base,
        examDate: parsed.examDate,
        planStart: parsed.planStart,
        ...(isDateKey(parsed.planCreated) ? { planCreated: parsed.planCreated } : {}),
        weeksUntilExam: planWeekCount(parsed.planStart, parsed.examDate),
      };
    }
    return base;
  } catch {
    return null;
  }
}

/** Raderar sparat underlag. Tombstone → sprids till molnet när man är inloggad. */
export function clearScores(): void {
  if (typeof window === "undefined") return;
  storageRemove(SCORES_STORAGE_KEY);
  storageRemove(SCORES_SAVED_FLAG_KEY);
}

export function saveScores(scores: ScoreInput) {
  if (typeof window === "undefined") return;
  storageSet(SCORES_STORAGE_KEY, JSON.stringify(scores));
}

/** Sätts en gång när användaren sparar sina egna resultat (formulär eller nivåtest). */
export const SCORES_SAVED_FLAG_KEY = "hp-lift-scores-saved-v1";

function loadHasSavedScores(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return storageGet(SCORES_SAVED_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function markScoresSaved(): void {
  if (typeof window === "undefined") return;
  try {
    storageSet(SCORES_SAVED_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

export function formatNorm(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

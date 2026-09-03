import type { SectionId } from "@/lib/study-plan";
import { storageGet, storageSet } from "@/lib/sync/storage-sync";

export const DELPROV_META: {
  id: SectionId;
  name: string;
  total: number;
  block: "kvant" | "verbal";
}[] = [
  { id: "KVA", name: "Kvantitativa jämförelser", total: 20, block: "kvant" },
  { id: "DTK", name: "Diagram, tabeller och kartor", total: 24, block: "kvant" },
  { id: "XYZ", name: "Matematik problemlösning", total: 24, block: "kvant" },
  { id: "NOG", name: "Kvantitativa resonemang", total: 12, block: "kvant" },
  { id: "ORD", name: "Ordförståelse", total: 20, block: "verbal" },
  { id: "LAS", name: "Läsförståelse svenska", total: 20, block: "verbal" },
  { id: "MEK", name: "Meningskomplettering", total: 20, block: "verbal" },
  { id: "ELF", name: "Läsförståelse engelska", total: 20, block: "verbal" },
];

export type ScoreInput = {
  quantNorm: number;
  verbalNorm: number;
  hoursPerWeek: number;
  weeksUntilExam: number;
  /** correct answers per delprov id */
  delprov: Record<SectionId, number>;
};

/** Default = dina tidigare resultat (kan ändras i formuläret). */
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
  return Math.max(3, Math.min(40, n));
}

export function clampWeeksUntilExam(value: unknown): number {
  if (value === null || value === undefined) return DEFAULT_SCORES.weeksUntilExam;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SCORES.weeksUntilExam;
  return Math.max(4, Math.min(16, n));
}

export function loadScores(): ScoreInput {
  if (typeof window === "undefined") return DEFAULT_SCORES;
  try {
    const raw = storageGet(SCORES_STORAGE_KEY);
    if (!raw) return DEFAULT_SCORES;
    const parsed = JSON.parse(raw) as Partial<ScoreInput>;
    const delprov = { ...DEFAULT_SCORES.delprov };
    for (const m of DELPROV_META) {
      if (typeof parsed.delprov?.[m.id] === "number") {
        delprov[m.id] = clampDelprov(m.id, parsed.delprov[m.id]);
      }
    }
    return {
      quantNorm: clampNorm(parsed.quantNorm ?? DEFAULT_SCORES.quantNorm),
      verbalNorm: clampNorm(parsed.verbalNorm ?? DEFAULT_SCORES.verbalNorm),
      hoursPerWeek: clampHoursPerWeek(parsed.hoursPerWeek),
      weeksUntilExam: clampWeeksUntilExam(parsed.weeksUntilExam),
      delprov,
    };
  } catch {
    return DEFAULT_SCORES;
  }
}

export function saveScores(scores: ScoreInput) {
  if (typeof window === "undefined") return;
  storageSet(SCORES_STORAGE_KEY, JSON.stringify(scores));
}

/** Sätts en gång när användaren sparar sina egna resultat (formulär eller nivåtest). */
export const SCORES_SAVED_FLAG_KEY = "hp-lift-scores-saved-v1";

export function loadHasSavedScores(): boolean {
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

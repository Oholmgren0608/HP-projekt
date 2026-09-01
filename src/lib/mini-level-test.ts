import {
  DELPROV_META,
  clampDelprov,
  type ScoreInput,
} from "@/lib/hp-scores";
import {
  buildQuiz,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { estimateNormFromPercent } from "@/lib/progress-history";
import type { SectionId } from "@/lib/study-plan";

/** Antal frågor per delprov i nivåtestet (standardval, matchar tidigare beteende). */
export const MINI_TEST_DEFAULT_COUNT = 3;

/** Användarens valda antal frågor per delprov. */
export type NivatestCounts = Record<SectionId, number>;

/** Högsta valbara antal frågor per delprov, begränsat av respektive övningsbank. */
export const MINI_TEST_MAX_COUNTS: Record<SectionId, number> = {
  ELF: 4,
  LAS: 4,
  DTK: 8,
  XYZ: 8,
  KVA: 8,
  NOG: 8,
  ORD: 8,
  MEK: 8,
};

export function defaultNivatestCounts(): NivatestCounts {
  return {
    ORD: MINI_TEST_DEFAULT_COUNT,
    MEK: MINI_TEST_DEFAULT_COUNT,
    LAS: MINI_TEST_DEFAULT_COUNT,
    ELF: MINI_TEST_DEFAULT_COUNT,
    XYZ: MINI_TEST_DEFAULT_COUNT,
    KVA: MINI_TEST_DEFAULT_COUNT,
    NOG: MINI_TEST_DEFAULT_COUNT,
    DTK: MINI_TEST_DEFAULT_COUNT,
  };
}

export const NIVATEST_COUNTS_STORAGE_KEY = "hp-lift-nivatest-counts-v1";

/** Klipper ett valt antal till [1, max] för delprovet. */
export function clampNivatestCount(id: SectionId, value: number): number {
  const max = MINI_TEST_MAX_COUNTS[id];
  const n = Math.round(value);
  return Math.max(1, Math.min(max, Number.isFinite(n) ? n : 1));
}

export function loadNivatestCounts(): NivatestCounts {
  const defaults = defaultNivatestCounts();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(NIVATEST_COUNTS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<SectionId, unknown>>;
    for (const { id } of SECTION_KINDS) {
      const value = parsed[id];
      if (typeof value === "number") defaults[id] = clampNivatestCount(id, value);
    }
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveNivatestCounts(counts: NivatestCounts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NIVATEST_COUNTS_STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

/**
 * Delproven som ingår i nivåtestet — alla åtta, kopplade till respektive
 * övningsbank. Ordningen används bara som utgångspunkt; frågorna blandas
 * sedan så att delproven varvas.
 */
export const SECTION_KINDS: { id: SectionId; kind: Exclude<PracticeKind, "reflect"> }[] = [
  { id: "ORD", kind: "ord" },
  { id: "MEK", kind: "mek" },
  { id: "LAS", kind: "las" },
  { id: "ELF", kind: "elf" },
  { id: "XYZ", kind: "xyz" },
  { id: "KVA", kind: "kva" },
  { id: "NOG", kind: "nog" },
  { id: "DTK", kind: "dtk" },
];

/**
 * Bygger ett nivåtest med frågor från varje delprov. Frågorna varvas
 * (round-robin) så att användaren möter olika delprov om vartannat i stället
 * för flera likadana i rad. Antalet per delprov styrs av `counts` och klipps
 * mot respektive banks storlek.
 */
export function buildMiniTest(
  seed: string,
  counts: NivatestCounts = defaultNivatestCounts(),
): ChoiceQuestion[] {
  const perSection = SECTION_KINDS.map(({ kind, id }) =>
    buildQuiz(kind, `${seed}:${kind}`, clampNivatestCount(id, counts[id] ?? MINI_TEST_DEFAULT_COUNT)),
  );
  const maxLen = perSection.reduce((max, qs) => Math.max(max, qs.length), 0);
  const interleaved: ChoiceQuestion[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const qs of perSection) {
      const q = qs[i];
      if (q) interleaved.push(q);
    }
  }
  return interleaved;
}

/** Delprovets id ur en frågas kind (ord → ORD, las → LAS, …). */
function sectionIdFromKind(kind: ChoiceQuestion["kind"]): SectionId {
  return kind.toUpperCase() as SectionId;
}

export type MiniSectionResult = {
  id: SectionId;
  name: string;
  block: "kvant" | "verbal";
  /** Rätt i nivåtestet. */
  correct: number;
  /** Antal frågor i nivåtestet för delprovet. */
  asked: number;
  /** Andel rätt (0–100). */
  percent: number;
  /** Delprovets fulla antal frågor på ett riktigt prov. */
  total: number;
  /** Uppskattad råpoäng skalad till delprovets fulla antal. */
  estCorrect: number;
};

/** Resultat per delprov från nivåtestet. */
export function sectionBreakdown(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
): MiniSectionResult[] {
  return DELPROV_META.map((m) => {
    const asked = questions.filter((q) => sectionIdFromKind(q.kind) === m.id);
    const correct = asked.filter((q) => answers[q.id] === q.correctIndex).length;
    const percent = asked.length ? Math.round((correct / asked.length) * 100) : 0;
    const estCorrect = clampDelprov(m.id, Math.round((percent / 100) * m.total));
    return {
      id: m.id,
      name: m.name,
      block: m.block,
      correct,
      asked: asked.length,
      percent,
      total: m.total,
      estCorrect,
    };
  });
}

export type MiniTestOutcome = {
  input: ScoreInput;
  sections: MiniSectionResult[];
  verbalPercent: number;
  quantPercent: number;
  overallNorm: number;
};

/**
 * Översätter nivåtestets svar till samma `ScoreInput` som resultatformuläret
 * använder, så att veckoplanen kan byggas på exakt samma sätt som när poäng
 * matas in för hand.
 *
 * - Per delprov skalas andelen rätt upp till delprovets fulla antal frågor.
 * - Norm per block (verbal/kvant) uppskattas från andelen rätt i blocket.
 */
export function miniTestToScoreInput(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
  opts: { hoursPerWeek: number; weeksUntilExam: number },
): MiniTestOutcome {
  const sections = sectionBreakdown(questions, answers);

  const delprov = {} as ScoreInput["delprov"];
  for (const s of sections) {
    delprov[s.id] = s.estCorrect;
  }

  const blockPercent = (block: "kvant" | "verbal") => {
    const rows = sections.filter((s) => s.block === block);
    const asked = rows.reduce((sum, r) => sum + r.asked, 0);
    const correct = rows.reduce((sum, r) => sum + r.correct, 0);
    return asked ? (correct / asked) * 100 : 0;
  };

  const verbalPercent = blockPercent("verbal");
  const quantPercent = blockPercent("kvant");
  const quantNorm = estimateNormFromPercent(quantPercent);
  const verbalNorm = estimateNormFromPercent(verbalPercent);

  const input: ScoreInput = {
    quantNorm,
    verbalNorm,
    hoursPerWeek: Math.max(3, Math.min(40, Math.round(opts.hoursPerWeek) || 10)),
    weeksUntilExam: Math.max(4, Math.min(16, Math.round(opts.weeksUntilExam) || 8)),
    delprov,
  };

  return {
    input,
    sections,
    verbalPercent: Math.round(verbalPercent),
    quantPercent: Math.round(quantPercent),
    overallNorm: Math.round(((quantNorm + verbalNorm) / 2) * 100) / 100,
  };
}

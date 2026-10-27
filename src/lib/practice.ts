import {
  getFallbackReflectPrompts,
  getQuestions,
  getReflectPrompts,
} from "@/lib/content/questions-provider";
import { loadMasteredQuestionIds } from "@/lib/question-mastery";
import { loadJson, saveJson } from "@/lib/storage";
import { hashSeed, shuffle } from "@/lib/random";
import { SUBTESTS } from "@/lib/subtests";
import type {
  ChoiceQuestion,
  PracticeKind,
  ReflectPrompt,
} from "@/lib/practice-types";

export { tally } from "@/lib/quiz";
export type { ChoiceQuestion, PracticeKind, ReflectPrompt } from "@/lib/practice-types";

export const MOCK_KINDS: Exclude<PracticeKind, "reflect">[] = [
  "ord",
  "mek",
  "las",
  "elf",
  "xyz",
  "kva",
  "nog",
  "dtk",
];

let banksCache: Record<Exclude<PracticeKind, "reflect">, ChoiceQuestion[]> | null = null;
let banksCacheSource: ChoiceQuestion[] | null = null;

/**
 * Frågebanken grupperad per delprov, hämtad från runtime-providern (Supabase
 * eller bundlad fallback). Cachas mot providerns array-identitet så att
 * grupperingen byggs om först när banken faktiskt byts ut.
 */
function getBanks(): Record<Exclude<PracticeKind, "reflect">, ChoiceQuestion[]> {
  const questions = getQuestions();
  if (banksCache && banksCacheSource === questions) return banksCache;
  const banks: Record<Exclude<PracticeKind, "reflect">, ChoiceQuestion[]> = {
    ord: [],
    mek: [],
    las: [],
    elf: [],
    dtk: [],
    xyz: [],
    kva: [],
    nog: [],
  };
  for (const q of questions) {
    const list = banks[q.kind];
    if (list) list.push(q);
  }
  banksCache = banks;
  banksCacheSource = questions;
  return banks;
}

/** Antal frågor per övningstyp i den laddade banken (för veckoplanens passlängder). */
export function bankSizes(): Record<Exclude<PracticeKind, "reflect">, number> {
  const banks = getBanks();
  return Object.fromEntries(
    Object.entries(banks).map(([kind, qs]) => [kind, qs.length]),
  ) as Record<Exclude<PracticeKind, "reflect">, number>;
}

export function findQuestionById(id: string): ChoiceQuestion | undefined {
  for (const bank of Object.values(getBanks())) {
    const found = bank.find((q) => q.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Visade frågor per delprov, äldst först. Sparas i localStorage och synkas vid
 * inloggning, så att nya frågor väljs före redan visade även mellan dagar och
 * enheter. När alla frågor i ett delprov har visats glöms den äldre hälften,
 * så att de frågorna åter räknas som nya och banken roteras.
 */
export const SEEN_QUESTIONS_KEY = "hp-lift-seen-questions-v1";

type SeenQuestions = Partial<Record<Exclude<PracticeKind, "reflect">, string[]>>;

function loadSeenQuestions(): SeenQuestions {
  const value = loadJson<unknown>(SEEN_QUESTIONS_KEY, null);
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const seen: SeenQuestions = {};
  for (const [kind, ids] of Object.entries(value)) {
    if (!Array.isArray(ids)) continue;
    seen[kind as Exclude<PracticeKind, "reflect">] = ids.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
  }
  return seen;
}

export function loadLastShownQuestionIds(
  kind: Exclude<PracticeKind, "reflect">,
): string[] {
  if (typeof window === "undefined") return [];
  return loadSeenQuestions()[kind] ?? [];
}

/** Spara visade fråge-id:n per delprov – ackumuleras, nyast sist. */
export function rememberShownQuestions(questions: ChoiceQuestion[]) {
  if (typeof window === "undefined" || questions.length === 0) return;
  const seen = loadSeenQuestions();
  const banks = getBanks();
  const byKind = new Map<Exclude<PracticeKind, "reflect">, string[]>();
  for (const q of questions) byKind.set(q.kind, [...(byKind.get(q.kind) ?? []), q.id]);
  for (const [kind, ids] of byKind) {
    const fresh = new Set(ids);
    let list = [...(seen[kind] ?? []).filter((id) => !fresh.has(id)), ...fresh];
    const bankIds = new Set(banks[kind].map((q) => q.id));
    list = list.filter((id) => bankIds.has(id));
    if (bankIds.size > 0 && list.length >= bankIds.size) {
      list = list.slice(list.length - Math.floor(bankIds.size / 2));
    }
    seen[kind] = list;
  }
  saveJson(SEEN_QUESTIONS_KEY, seen);
}

export function buildQuiz(
  kind: Exclude<PracticeKind, "reflect">,
  seed: string,
  count: number,
  avoidIds: ReadonlySet<string> | readonly string[] = [],
): ChoiceQuestion[] {
  const bank = getBanks()[kind];
  const avoid = avoidIds instanceof Set ? avoidIds : new Set(avoidIds);
  const mastered = loadMasteredQuestionIds();

  const unmasteredFresh: ChoiceQuestion[] = [];
  const unmasteredRecent: ChoiceQuestion[] = [];
  const masteredFresh: ChoiceQuestion[] = [];
  const masteredRecent: ChoiceQuestion[] = [];

  for (const q of bank) {
    const isMastered = mastered.has(q.id);
    const isRecent = avoid.has(q.id);
    if (!isMastered && !isRecent) unmasteredFresh.push(q);
    else if (!isMastered) unmasteredRecent.push(q);
    else if (!isRecent) masteredFresh.push(q);
    else masteredRecent.push(q);
  }

  const ordered = [
    ...shuffle(unmasteredFresh, seed),
    ...shuffle(unmasteredRecent, `${seed}:recent`),
    ...shuffle(masteredFresh, `${seed}:mastered`),
    ...shuffle(masteredRecent, `${seed}:mastered-recent`),
  ];
  return ordered.slice(0, Math.min(count, ordered.length));
}

function quizKindsOf(kinds: PracticeKind[]): Exclude<PracticeKind, "reflect">[] {
  return kinds.filter((k): k is Exclude<PracticeKind, "reflect"> => k !== "reflect");
}

/** Antal frågor buildMixedQuiz ger för `kinds` och `count` — banken kan vara mindre. */
export function mixedQuizSize(kinds: PracticeKind[], count: number): number {
  const quizKinds = quizKindsOf(kinds);
  if (quizKinds.length === 0) return 0;
  const perKind = Math.max(1, Math.ceil(count / quizKinds.length));
  const banks = getBanks();
  const pooled = quizKinds.reduce((sum, kind) => sum + Math.min(perKind + 2, banks[kind].length), 0);
  return Math.min(count, pooled);
}

export function buildMixedQuiz(
  kinds: PracticeKind[],
  seed: string,
  count: number,
): ChoiceQuestion[] {
  const quizKinds = quizKindsOf(kinds);
  if (quizKinds.length === 0) return [];

  const perKind = Math.max(1, Math.ceil(count / quizKinds.length));
  const pooled: ChoiceQuestion[] = [];
  for (const kind of quizKinds) {
    pooled.push(
      ...buildQuiz(kind, `${seed}:${kind}`, perKind + 2, loadLastShownQuestionIds(kind)),
    );
  }
  return shuffle(pooled, `${seed}:mix`).slice(0, Math.min(count, pooled.length));
}

export function getReflectPrompt(seed: string): ReflectPrompt {
  const prompts = getReflectPrompts();
  // Guard: om Supabase-data saknar reflektioner, fall tillbaka på den bundlade.
  const list = prompts.length > 0 ? prompts : getFallbackReflectPrompts();
  const idx = hashSeed(seed) % list.length;
  return list[idx];
}

export function practiceLabel(kind: PracticeKind): string {
  switch (kind) {
    case "ord":
      return "ORD-övning";
    case "mek":
      return "MEK-övning";
    case "las":
      return "LÄS-övning";
    case "elf":
      return "ELF-övning";
    case "dtk":
      return "DTK-övning";
    case "xyz":
      return "XYZ-övning";
    case "kva":
      return "KVA-övning";
    case "nog":
      return "NOG-övning";
    case "reflect":
      return "Reflektion";
  }
}

export function kindBadge(kind: PracticeKind): string {
  if (kind === "reflect") return "Reflektion";
  return SUBTESTS.find((s) => s.kind === kind)?.short ?? kind.toUpperCase();
}

export function buildMockExam(seed: string, count = 24): ChoiceQuestion[] {
  return buildMixedQuiz(MOCK_KINDS, seed, count);
}

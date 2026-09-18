import { getQuestions } from "@/lib/content/questions-provider";
import type { ChoiceQuestion } from "@/lib/practice";
import { shuffle } from "@/lib/random";

/**
 * Vilka delprov som används i dueller. Läsförståelse (LÄS, ELF) är medvetet
 * uteslutet: långa texter passar dåligt i ett snabbt duellformat.
 */
export const DUEL_KINDS = ["ord", "mek", "xyz", "kva", "nog", "dtk"] as const;
export type DuelKind = (typeof DUEL_KINDS)[number];

/** Frågebanken per duell-delprov, hämtad från runtime-providern (Supabase/fallback). */
function getBanks(): Record<DuelKind, ChoiceQuestion[]> {
  const banks: Record<DuelKind, ChoiceQuestion[]> = {
    ord: [],
    mek: [],
    xyz: [],
    kva: [],
    nog: [],
    dtk: [],
  };
  for (const q of getQuestions()) {
    const list = banks[q.kind as DuelKind];
    if (list) list.push(q);
  }
  return banks;
}

// Samma deterministiska hash/shuffle som i practice.ts — men här utan
// per-spelare-filtrering (mastered/recent), så att båda spelarna får
// *exakt samma* frågor utifrån den delade seed:en.

/**
 * Bygger en deterministisk duellfrågeserie utifrån en seed. Frågorna
 * fördelas jämnt mellan delproven (round-robin) så att en match inte
 * domineras av ett enda delprov.
 */
export function buildDuelQuiz(seed: string, count = 10): ChoiceQuestion[] {
  const banks = getBanks();
  const pools = DUEL_KINDS.map((kind) => shuffle(banks[kind], `${seed}:${kind}`));
  const result: ChoiceQuestion[] = [];
  let round = 0;

  while (result.length < count) {
    let added = false;
    for (let k = 0; k < pools.length && result.length < count; k++) {
      const question = pools[k][round];
      if (question) {
        result.push(question);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  return result;
}

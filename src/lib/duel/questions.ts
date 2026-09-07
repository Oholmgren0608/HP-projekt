import {
  DTK_BANK,
  MEK_BANK,
  ORD_BANK,
  type ChoiceQuestion,
} from "@/lib/practice";
import { KVA_BANK, NOG_BANK, XYZ_BANK } from "@/lib/practice-kvant";
import { shuffle } from "@/lib/random";

/**
 * Vilka delprov som används i dueller. Läsförståelse (LÄS, ELF) är medvetet
 * uteslutet: långa texter passar dåligt i ett snabbt duellformat.
 */
export const DUEL_KINDS = ["ord", "mek", "xyz", "kva", "nog", "dtk"] as const;
export type DuelKind = (typeof DUEL_KINDS)[number];

const BANKS: Record<DuelKind, ChoiceQuestion[]> = {
  ord: ORD_BANK,
  mek: MEK_BANK,
  xyz: XYZ_BANK,
  kva: KVA_BANK,
  nog: NOG_BANK,
  dtk: DTK_BANK,
};

/**
 * Bygger en deterministisk duellfrågeserie utifrån en seed. Frågorna
 * fördelas jämnt mellan delproven (round-robin) så att en match inte
 * domineras av ett enda delprov.
 */
export function buildDuelQuiz(seed: string, count = 10): ChoiceQuestion[] {
  const pools = DUEL_KINDS.map((kind) => shuffle(BANKS[kind], `${seed}:${kind}`));
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

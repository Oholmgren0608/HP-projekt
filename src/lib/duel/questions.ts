import {
  DTK_BANK,
  MEK_BANK,
  ORD_BANK,
  type ChoiceQuestion,
} from "@/lib/practice";
import { KVA_BANK, NOG_BANK, XYZ_BANK } from "@/lib/practice-kvant";

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

// Samma deterministiska hash/shuffle som i practice.ts — men här utan
// per-spelare-filtrering (mastered/recent), så att båda spelarna får
// *exakt samma* frågor utifrån den delade seed:en.
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  const rand = mulberry32(hashSeed(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

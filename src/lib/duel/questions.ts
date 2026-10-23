import {
  fetchPublishedQuestionIds,
  fetchPublishedQuestionsByIds,
  getQuestions,
} from "@/lib/content/questions-provider";
import type { ChoiceQuestion } from "@/lib/practice";
import { hashSeed, mulberry32 } from "@/lib/random";

/**
 * Vilka delprov som används i dueller. Läsförståelse (LÄS, ELF) är medvetet
 * uteslutet: långa texter passar dåligt i ett snabbt duellformat.
 */
export const DUEL_KINDS = ["ord", "mek", "xyz", "kva", "nog", "dtk"] as const;
export type DuelKind = (typeof DUEL_KINDS)[number];

/**
 * Endast frågor med facit i den server-side tabellen `duel_questions` får
 * användas i dueller. Servern rättar svaren mot den tabellen, och ett id utan
 * facit ger tyst 0 poäng (`duel_submit_answer` svarar "unknown question").
 * Tabellen är inte läsbar för klienten (RLS utan policies). Sedan 0017 får
 * varje publicerad övningsfråga facit där: de äldre id:na "<delprov>-<nummer>"
 * och de nya "ovn-<delprov>-<nummer>". Provfrågor ("hp-<datum>-p<n>-q<m>")
 * får aldrig facit och publiceras aldrig.
 */
const FACIT_BACKED_ID = /^(?:ovn-)?(ord|mek|xyz|kva|nog|dtk)-\d+$/;

export function isFacitBackedId(id: string): boolean {
  return FACIT_BACKED_ID.test(id);
}

/**
 * Rangordning av en fråga i en match. Varje fråga får sin plats ur seed + id
 * (rendezvous-hashning), så valet beror inte på i vilken ordning eller hur stor
 * banken är: en fråga som publiceras eller dras tillbaka påverkar bara matcher
 * där just den frågan hade valts.
 */
function rank(seed: string, id: string): number {
  return mulberry32(hashSeed(`${seed}:${id}`))();
}

/**
 * Väljer duellens fråge-id ur en lista med (id, delprov). Frågorna fördelas
 * jämnt mellan delproven (round-robin) så att en match inte domineras av ett
 * enda delprov.
 */
export function pickDuelQuestionIds(
  candidates: readonly { id: string; kind: string }[],
  seed: string,
  count = 10,
): string[] {
  const pools = DUEL_KINDS.map((kind) =>
    candidates
      .filter((c) => c.kind === kind && isFacitBackedId(c.id))
      .map((c) => ({ id: c.id, r: rank(`${seed}:${kind}`, c.id) }))
      .sort((a, b) => a.r - b.r || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((c) => c.id),
  );
  const result: string[] = [];
  let round = 0;

  while (result.length < count) {
    let added = false;
    for (let k = 0; k < pools.length && result.length < count; k++) {
      const id = pools[k][round];
      if (id && !result.includes(id)) {
        result.push(id);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }

  return result;
}

/**
 * Matchens frågor per match-id, så att en omladdning mitt i matchen ger samma
 * frågor även om banken ändrats – också om en fråga har dragits tillbaka
 * under tiden (den går då inte längre att hämta). Per enhet: medvetet inte med
 * i storage-sync:ns SYNCED_KEYS, men rensas vid utloggning.
 */
const MATCH_QUESTIONS_KEY = "hp-lift-duel-questions-v2";
const MAX_STORED_MATCHES = 5;

function isStoredQuestion(value: unknown): value is ChoiceQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<ChoiceQuestion>;
  return (
    typeof q.id === "string" &&
    typeof q.kind === "string" &&
    typeof q.prompt === "string" &&
    typeof q.explain === "string" &&
    Array.isArray(q.options) &&
    q.options.every((o) => typeof o === "string") &&
    typeof q.correctIndex === "number"
  );
}

function readStored(matchId: string): ChoiceQuestion[] | null {
  try {
    const raw = localStorage.getItem(MATCH_QUESTIONS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const questions = (parsed as Record<string, unknown>)[matchId];
    if (!Array.isArray(questions) || questions.length === 0) return null;
    return questions.every(isStoredQuestion) ? questions : null;
  } catch {
    return null;
  }
}

function writeStored(matchId: string, questions: ChoiceQuestion[]): void {
  try {
    const raw = localStorage.getItem(MATCH_QUESTIONS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const all =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, ChoiceQuestion[]>)
        : {};
    delete all[matchId];
    all[matchId] = questions;
    const keys = Object.keys(all);
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_STORED_MATCHES))) delete all[key];
    localStorage.setItem(MATCH_QUESTIONS_KEY, JSON.stringify(all));
  } catch {
    /* ignorera — matchen får aldrig krascha p.g.a. lagring */
  }
}

/**
 * Bygger matchens frågeserie. Båda spelarna väljer ur listan över frågor som
 * är publicerade just nu (hämtad från databasen när matchen öppnas), inte ur
 * sin egen kanske gamla bank, och frågor som publicerats efter sidladdningen
 * hämtas på id. Utan Supabase används den lokala banken. Kräver att
 * `loadQuestions()` har körts.
 */
export async function buildDuelQuiz(
  matchId: string,
  seed: string,
  count = 10,
): Promise<ChoiceQuestion[]> {
  const stored = readStored(matchId);
  if (stored) return stored;

  const local = new Map(getQuestions().map((q) => [q.id, q]));
  const published = await fetchPublishedQuestionIds(DUEL_KINDS);
  const candidates = published ?? [...local.values()].map((q) => ({ id: q.id, kind: q.kind }));
  const ids = pickDuelQuestionIds(candidates, seed, count);

  const missing = ids.filter((id) => !local.has(id));
  if (missing.length > 0) {
    for (const q of await fetchPublishedQuestionsByIds(missing)) local.set(q.id, q);
  }

  const questions = ids.map((id) => local.get(id)).filter((q): q is ChoiceQuestion => q !== undefined);
  // Listan sparas bara när den byggdes ur databasens aktuella lista; utan den
  // (offline) ska en senare omladdning få försöka igen.
  if (published && questions.length === ids.length) writeStored(matchId, questions);
  return questions;
}

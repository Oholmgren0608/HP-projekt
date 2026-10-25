/**
 * Jämnar ut rätt svars position i de äldre övningsfrågorna (id utan "ovn-").
 * I flera delprov ligger rätt svar nästan alltid på B, så den som gissar B får
 * ett för högt resultat, till exempel på nivåtestet.
 *
 *   npm run fragebank:balansera -- --dry-run              # visa ändringarna
 *   npm run fragebank:balansera -- --dry-run --fallback   # prova mot reservbanken
 *   npm run fragebank:balansera                           # skriv till databasen
 *
 * Bara ordningen ändras: rätt svar byter plats med ett annat alternativ och
 * correct_index följer med i samma uppdatering, så texten är densamma och
 * duellfacit följer med via triggern i 0017. Delprov med fasta alternativ (KVA,
 * NOG) rörs inte, och inte heller frågor vars alternativ är bokstäver eller
 * siffror (stigande ordning ska behållas) eller vars förklaring hänvisar till
 * en bokstav. Ett delprov som redan är jämnt fördelat lämnas orört.
 *
 * Mot databasen krävs SUPABASE_SERVICE_ROLE_KEY och SUPABASE_URL (eller
 * NEXT_PUBLIC_SUPABASE_URL) i .env.local. Kör `npm run fragebank:export`
 * efteråt så att reservbanken får den nya ordningen.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { hashSeed } from "@/lib/random";
import { FIXED_OPTIONS, isKind, letter, OPTION_COUNT, readEnvLocal, readFallbackQuestions, type Kind } from "./lib";

type Question = { id: string; kind: Kind; options: string[]; correctIndex: number; explain: string };
type Change = { id: string; kind: Kind; from: number; to: number; options: string[] };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const useFallback = args.includes("--fallback");

/** Alternativ som är etiketter eller tal har en naturlig ordning som ska behållas. */
const ORDERED_OPTION = /^([A-F]|[-−]?[\d\s.,/%²³]+[^\d]{0,4})$/;
const LETTER_REFERENCE = /\b(alternativ|svar|option|answer)\s+[A-E]\b|\([A-E]\)|\b[A-E]\s+(är|stämmer|blir)\b/i;

function isMovable(q: Question): boolean {
  if (FIXED_OPTIONS[q.kind]) return false;
  if (q.options.every((o) => ORDERED_OPTION.test(o.trim()))) return false;
  return !LETTER_REFERENCE.test(q.explain);
}

function counts(qs: { correctIndex: number }[], n: number): number[] {
  const c = new Array<number>(n).fill(0);
  for (const q of qs) if (q.correctIndex >= 0 && q.correctIndex < n) c[q.correctIndex] += 1;
  return c;
}

/** Planera bytena för ett delprov: varje flyttbar fråga får den minst använda positionen. */
function plan(kind: Kind, questions: Question[]): Change[] {
  const n = questions.length > 0 ? Math.max(...questions.map((q) => q.options.length)) : OPTION_COUNT[kind];
  const before = counts(questions, n);
  if (questions.length < 4 || Math.max(...before) / questions.length <= 0.4) return [];

  const fixed = questions.filter((q) => !isMovable(q));
  const movable = questions
    .filter(isMovable)
    .sort((a, b) => hashSeed(`balans:${a.id}`) - hashSeed(`balans:${b.id}`));
  const running = counts(fixed, n);
  const changes: Change[] = [];
  for (const q of movable) {
    const slots = q.options.length;
    let target = 0;
    for (let i = 1; i < slots; i++) {
      if (running[i] < running[target] || (running[i] === running[target] && i === q.correctIndex)) {
        target = i;
      }
    }
    if (running[q.correctIndex] === running[target]) target = q.correctIndex;
    running[target] += 1;
    if (target === q.correctIndex) continue;
    const options = [...q.options];
    [options[q.correctIndex], options[target]] = [options[target], options[q.correctIndex]];
    changes.push({ id: q.id, kind, from: q.correctIndex, to: target, options });
  }
  return changes;
}

async function loadQuestions(): Promise<{
  questions: Question[];
  sb: ReturnType<typeof createClient<Database>> | null;
}> {
  const isLegacy = (id: string) => !id.startsWith("ovn-") && !id.startsWith("hp-");
  if (useFallback) {
    const questions = readFallbackQuestions()
      .filter((q) => isLegacy(q.id))
      .map((q) => ({ id: q.id, kind: q.kind, options: q.options, correctIndex: q.correctIndex, explain: q.explain }));
    return { questions, sb: null };
  }
  const url = readEnvLocal("SUPABASE_URL") || readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvLocal("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs i .env.local.");
  }
  const sb = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = await fetchAllPages((from, to) =>
    sb
      .from("questions")
      .select("id, kind, options, correct_index, explain, exam_id", { count: "exact" })
      .eq("status", "published")
      .order("id")
      .range(from, to),
  );
  if (!rows) throw new Error("Kunde inte läsa frågorna.");
  const questions = rows
    .filter((r) => r.exam_id === null && isLegacy(r.id) && isKind(r.kind))
    .map((r) => ({
      id: r.id,
      kind: r.kind as Kind,
      options: r.options,
      correctIndex: r.correct_index,
      explain: r.explain,
    }));
  return { questions, sb };
}

async function main() {
  const { questions, sb } = await loadQuestions();
  const kinds = [...new Set(questions.map((q) => q.kind))];
  const changes: Change[] = [];

  for (const kind of kinds) {
    const qs = questions.filter((q) => q.kind === kind);
    const kindChanges = plan(kind, qs);
    const n = Math.max(...qs.map((q) => q.options.length));
    const after = qs.map((q) => {
      const c = kindChanges.find((ch) => ch.id === q.id);
      return { correctIndex: c ? c.to : q.correctIndex };
    });
    const show = (c: number[]) => c.map((v, i) => `${letter(i)}=${v}`).join(" ");
    console.log(
      `${kind}: ${qs.length} frågor, rätt svar ${show(counts(qs, n))} → ${show(counts(after, n))}` +
        ` (${kindChanges.length} byten, ${qs.filter((q) => !isMovable(q)).length} rörs inte)`,
    );
    changes.push(...kindChanges);
  }

  if (dryRun || !sb) {
    for (const c of changes) console.log(`  ${c.id}: ${letter(c.from)} → ${letter(c.to)}`);
    console.log(useFallback ? "--fallback: provkörning mot reservbanken, inget skrevs." : "--dry-run: inget skrevs.");
    return;
  }

  let done = 0;
  for (const c of changes) {
    // Villkoret på correct_index gör att en fråga som ändrats sedan läsningen lämnas orörd.
    const { data, error } = await sb
      .from("questions")
      .update({ options: c.options, correct_index: c.to })
      .eq("id", c.id)
      .eq("correct_index", c.from)
      .select("id");
    if (error) throw new Error(`Kunde inte uppdatera ${c.id}: ${error.message}`);
    if ((data ?? []).length === 1) done += 1;
    else console.warn(`Hoppade över ${c.id}: frågan har ändrats sedan den lästes.`);
  }
  console.log(`Bytte ordning i ${done} frågor. Kör npm run fragebank:export så att reservbanken följer med.`);
}

void main().catch((e) => {
  console.error("FEL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

/**
 * Generator för supabase/migrations/0005_questions.sql.
 *
 * Läser in de hårdkodade frågebankerna från src/lib/* och skriver ut en
 * komplett SQL-migration (DDL + RLS-policies + INSERT-seeds) på stdout.
 * Sammanfattning (antal frågor, dubblett-kontroll) skrivs till stderr så att
 * stdout kan redirectas rakt in i migrationsfilen:
 *
 *   npx tsx scripts/emit-questions-sql.ts > supabase/migrations/0005_questions.sql
 */

import {
  ORD_BANK,
  LAS_BANK,
  ELF_BANK,
  DTK_BANK,
  REFLECT_BANK,
} from "@/lib/practice";
import { MEK_BANK } from "@/lib/practice-mek";
import { XYZ_BANK, KVA_BANK, NOG_BANK } from "@/lib/practice-kvant";
import type { ChoiceQuestion, ReflectPrompt } from "@/lib/practice-types";

/** SQL-strängliteral: dubbla alla enkla citattecken (''). */
function sqlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/** JSON-array av strängar via jsonb_build_array (slipper hand-escapa JSON). */
function jsonbArray(values: string[]): string {
  return `jsonb_build_array(${values.map(sqlString).join(", ")})`;
}

function questionInsert(q: ChoiceQuestion): string {
  const passage = q.passage == null ? "null" : sqlString(q.passage);
  return (
    "insert into public.questions " +
    "(id, kind, prompt, passage, options, correct_index, explain) values (" +
    `${sqlString(q.id)}, ${sqlString(q.kind)}, ${sqlString(q.prompt)}, ${passage}, ` +
    `${jsonbArray(q.options)}, ${q.correctIndex}, ${sqlString(q.explain)});`
  );
}

function reflectInsert(r: ReflectPrompt): string {
  return (
    "insert into public.reflect_prompts " +
    "(id, title, prompts) values (" +
    `${sqlString(r.id)}, ${sqlString(r.title)}, ${jsonbArray(r.prompts)});`
  );
}

const questionBanks: Array<[string, ChoiceQuestion[]]> = [
  ["ord", ORD_BANK],
  ["las", LAS_BANK],
  ["elf", ELF_BANK],
  ["dtk", DTK_BANK],
  ["mek", MEK_BANK],
  ["xyz", XYZ_BANK],
  ["kva", KVA_BANK],
  ["nog", NOG_BANK],
];

// ---- Kontrollräkna och upptäck dubbletter innan vi skriver ut något ----
const seen = new Set<string>();
let totalQuestions = 0;
for (const [bankKey, bank] of questionBanks) {
  for (const q of bank) {
    totalQuestions += 1;
    if (seen.has(q.id)) {
      throw new Error(`Dubblett fråge-id: ${q.id}`);
    }
    seen.add(q.id);
    if (q.kind !== bankKey) {
      throw new Error(
        `Frågan ${q.id} har kind "${q.kind}" men ligger i banken "${bankKey}"`,
      );
    }
  }
}

const reflectSeen = new Set<string>();
for (const r of REFLECT_BANK) {
  if (reflectSeen.has(r.id)) {
    throw new Error(`Dubblett reflect-id: ${r.id}`);
  }
  reflectSeen.add(r.id);
}

// ---- DDL + policies ----
const header = `-- HP Lift: Frågebanker för övning (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG)
-- samt reflektionsprompter. Innehållet är en 1:1-seed av de hårdkodade
-- TypeScript-bankerna i src/lib/{practice,practice-mek,practice-kvant}.ts.
-- Regenereras med: npx tsx scripts/emit-questions-sql.ts
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0003).

create table public.questions (
  id text primary key,
  kind text not null,
  prompt text not null,
  passage text,
  options jsonb not null,
  correct_index smallint not null,
  explain text not null
);

create table public.reflect_prompts (
  id text primary key,
  title text not null,
  prompts jsonb not null
);

alter table public.questions enable row level security;
alter table public.reflect_prompts enable row level security;

-- Skrivskyddad: frågorna läses av alla, men skrivs enbart via
-- Supabase Dashboard / service role.
create policy "public read questions" on public.questions
  for select to anon, authenticated using (true);

create policy "public read reflect_prompts" on public.reflect_prompts
  for select to anon, authenticated using (true);
`;

// ---- INSERT-seeds ----
const questionSql = questionBanks
  .flatMap(([, bank]) => bank.map(questionInsert))
  .join("\n");

const reflectSql = REFLECT_BANK.map(reflectInsert).join("\n");

process.stdout.write(header);
process.stdout.write("\n");
process.stdout.write(questionSql);
process.stdout.write("\n");
process.stdout.write(reflectSql);
process.stdout.write("\n");

// ---- Sammanfattning -> stderr (så att stdout förblir ren SQL) ----
const log = (...args: unknown[]) => console.error(...args);
log("=== emit-questions-sql sammanfattning ===");
for (const [bankKey, bank] of questionBanks) {
  log(`${bankKey.padEnd(5)}: ${bank.length}`);
}
log(`totala frågor (questions): ${totalQuestions}`);
log(`reflektionsprompter (reflect_prompts): ${REFLECT_BANK.length}`);
log(`unika fråge-id: ${seen.size} (förväntat 146)`);
log(`unika reflect-id: ${reflectSeen.size} (förväntat 3)`);

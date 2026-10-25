/**
 * Andra kontrollen av de äldre övningsfrågorna (de 146 som fanns innan
 * content/ovningsfragor/). Samma metod som för nya frågor: en annan AI löser
 * frågorna utan facit och granskar sedan förklaringen.
 *
 *   npm run fragebank:aldre -- merge
 *     Läser kontrollanternas svar (content/ovningsfragor/.andra-kontroll/
 *     legacy-*.svar.json), jämför med facit i reservbanken och skriver
 *     content/aldre-fragor/andra-kontrollen.json.
 *
 *   npm run fragebank:aldre -- apply --dry-run
 *   npm run fragebank:aldre -- apply
 *     Skriver resultatet (verification, verification_note) till databasen för
 *     publicerade äldre frågor som ännu saknar resultat. Oense frågor syns
 *     sedan under "Att granska" på /review. Kräver SUPABASE_SERVICE_ROLE_KEY.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import { CHECK_DIR, PROJECT_ROOT, readEnvLocal, readFallbackQuestions, type Verification } from "./lib";

type CheckAnswer = { id: string; answerIndex: number; explanationOk: boolean; issues?: string };
type Result = { id: string; verification: Verification; verificationNote?: string };

const RESULT_DIR = join(PROJECT_ROOT, "content", "aldre-fragor");
const RESULT_PATH = join(RESULT_DIR, "andra-kontrollen.json");

const [command, ...rest] = process.argv.slice(2);
const dryRun = rest.includes("--dry-run");

function merge() {
  const bank = new Map(readFallbackQuestions().map((q) => [q.id, q]));
  const files = existsSync(CHECK_DIR)
    ? readdirSync(CHECK_DIR).filter((f) => /^legacy-.+\.svar\.json$/.test(f))
    : [];
  if (files.length === 0) throw new Error(`Inga legacy-*.svar.json i ${CHECK_DIR}.`);

  const results: Result[] = [];
  for (const file of files) {
    const answers = JSON.parse(readFileSync(join(CHECK_DIR, file), "utf8")) as CheckAnswer[];
    for (const a of answers) {
      const q = bank.get(a.id);
      if (!q) {
        console.warn(`${file}: ${a.id} finns inte i reservbanken – hoppar över.`);
        continue;
      }
      const notes: string[] = [];
      if (a.answerIndex !== q.correctIndex) {
        const chosen = q.options[a.answerIndex];
        notes.push(
          chosen !== undefined
            ? `Andra kontrollen valde ”${chosen}” men facit är ”${q.options[q.correctIndex]}”.`
            : `Andra kontrollen kunde inte välja ett svar (facit är ”${q.options[q.correctIndex]}”).`,
        );
      }
      if (a.explanationOk !== true) notes.push("Förklaringen godkändes inte.");
      if (a.issues && a.issues.trim()) notes.push(a.issues.trim());
      results.push(
        notes.length === 0
          ? { id: a.id, verification: "agreed" }
          : { id: a.id, verification: "disagreed", verificationNote: notes.join(" ") },
      );
    }
  }
  results.sort((x, y) => x.id.localeCompare(y.id, "sv", { numeric: true }));
  mkdirSync(RESULT_DIR, { recursive: true });
  writeFileSync(RESULT_PATH, JSON.stringify(results, null, 2) + "\n");
  const disagreed = results.filter((r) => r.verification === "disagreed").length;
  console.log(`Skrev ${results.length} resultat (ense ${results.length - disagreed}, oense ${disagreed}) till ${RESULT_PATH}`);
}

async function apply() {
  if (!existsSync(RESULT_PATH)) throw new Error(`Kör merge först (${RESULT_PATH} saknas).`);
  const results = JSON.parse(readFileSync(RESULT_PATH, "utf8")) as Result[];
  const disagreed = results.filter((r) => r.verification === "disagreed").length;
  if (dryRun) {
    console.log(`--dry-run: skulle skriva ${results.length} resultat (oense ${disagreed}); inget skrevs.`);
    return;
  }
  const url = readEnvLocal("SUPABASE_URL") || readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvLocal("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs i .env.local.");
  }
  const sb = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let written = 0;
  let skipped = 0;
  for (const r of results) {
    // Bara frågor som ännu saknar resultat; en granskare kan redan ha hanterat dem.
    const { data, error } = await sb
      .from("questions")
      .update({ verification: r.verification, verification_note: r.verificationNote ?? null })
      .eq("id", r.id)
      .is("verification", null)
      .is("exam_id", null)
      .select("id");
    if (error) throw new Error(`Kunde inte uppdatera ${r.id}: ${error.message}`);
    if ((data ?? []).length === 1) written += 1;
    else skipped += 1;
  }
  console.log(`Skrev ${written} resultat; ${skipped} hoppades över (redan granskade eller saknas).`);
}

if (command === "merge") {
  merge();
} else if (command === "apply") {
  void apply().catch((e) => {
    console.error("FEL:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
} else {
  console.error("Användning: legacy-check.ts merge | apply [--dry-run]");
  process.exit(1);
}

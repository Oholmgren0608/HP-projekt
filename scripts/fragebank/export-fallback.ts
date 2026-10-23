/**
 * Genererar den bundlade frågebanken (src/lib/content/fallback-bank.json) från
 * databasen, som är sanningen. Appen använder filen när Supabase inte nås.
 *
 *   npm run fragebank:export
 *
 * Läser NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY ur
 * .env.local och hämtar med den publika nyckeln – alltså exakt det RLS släpper
 * igenom till användare: publicerade frågor. Skriver inget om databasen inte
 * gav några frågor, så att reservbanken aldrig töms av misstag.
 */

import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/paginate";
import type { ChoiceQuestion, ReflectPrompt } from "@/lib/practice-types";
import { FALLBACK_PATH, isKind, KINDS, readEnvLocal } from "./lib";

type QuestionRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "id" | "kind" | "prompt" | "passage" | "options" | "correct_index" | "explain" | "figure_url"
>;

function toQuestion(row: QuestionRow): ChoiceQuestion | null {
  const options = Array.isArray(row.options) ? row.options : [];
  const valid =
    isKind(row.kind) &&
    row.prompt.trim().length > 0 &&
    row.explain.trim().length > 0 &&
    options.length >= 2 &&
    options.every((o) => typeof o === "string" && o.length > 0) &&
    Number.isInteger(row.correct_index) &&
    row.correct_index >= 0 &&
    row.correct_index < options.length;
  if (!valid) {
    console.warn(`Hoppar över ogiltig fråga ${row.id}.`);
    return null;
  }
  return {
    id: row.id,
    kind: row.kind as ChoiceQuestion["kind"],
    prompt: row.prompt,
    ...(row.passage ? { passage: row.passage } : {}),
    options,
    correctIndex: row.correct_index,
    explain: row.explain,
    ...(row.figure_url ? { figureUrl: row.figure_url } : {}),
  };
}

async function main() {
  const url = readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvLocal("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY krävs i .env.local.");
  }
  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: QuestionRow[] | null = await fetchAllPages((from, to) =>
    sb
      .from("questions")
      .select("id, kind, prompt, passage, options, correct_index, explain, figure_url", {
        count: "exact",
      })
      .eq("status", "published")
      .order("id")
      .range(from, to),
  );
  if (!rows) throw new Error("Kunde inte hämta frågorna.");

  const { data: reflectRows, error: reflectError } = await sb.from("reflect_prompts").select("*");
  if (reflectError) throw new Error(`Kunde inte hämta reflektioner: ${reflectError.message}`);

  const questions = rows
    .map(toQuestion)
    .filter((q): q is ChoiceQuestion => q !== null)
    .sort(
      (a, b) =>
        KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) ||
        a.id.localeCompare(b.id, "sv", { numeric: true }),
    );
  const reflect: ReflectPrompt[] = (reflectRows ?? [])
    .filter((r) => Array.isArray(r.prompts) && r.prompts.length > 0)
    .map((r) => ({ id: r.id, title: r.title, prompts: r.prompts }));

  if (questions.length === 0) throw new Error("Databasen gav inga publicerade frågor – skriver inte över reservbanken.");

  writeFileSync(FALLBACK_PATH, JSON.stringify({ questions, reflect }, null, 2) + "\n");
  console.log(`Skrev ${questions.length} frågor och ${reflect.length} reflektioner till ${FALLBACK_PATH}`);
}

void main().catch((e) => {
  console.error("FEL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

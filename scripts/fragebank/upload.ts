/**
 * Laddar upp nya övningsfrågor från content/ovningsfragor/ till databasen som utkast.
 *
 *   npm run fragebank:upload -- --dry-run          # visa vad som skulle hända
 *   npm run fragebank:upload                       # alla delprov
 *   npm run fragebank:upload -- elf las            # bara vissa delprov
 *
 * Kräver SUPABASE_SERVICE_ROLE_KEY och SUPABASE_URL (eller
 * NEXT_PUBLIC_SUPABASE_URL) i .env.local. Nya frågor får status 'draft' och
 * resultatet från andra kontrollen. Frågor som redan finns i databasen rörs
 * aldrig: databasen är sanningen, och ändringar efter uppladdningen görs på
 * /review. Ska en uppladdad fråga ersättas, avvisa den där och ladda upp en ny
 * med nytt id.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import {
  contentKinds,
  isKind,
  readDrafts,
  readEnvLocal,
  readFallbackQuestions,
  validateDrafts,
  type DraftQuestion,
} from "./lib";

type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"];
type ExistingRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "id" | "prompt" | "passage" | "options" | "correct_index" | "explain" | "status" | "verification"
>;

/** Fält där databasens rad skiljer sig från filen (blanksteg i kanterna räknas inte, som på /review). */
function differingFields(q: DraftQuestion, row: ExistingRow): string[] {
  const same = (a: string | null | undefined, b: string | null | undefined) =>
    (a ?? "").trim() === (b ?? "").trim();
  const options = Array.isArray(row.options) ? row.options : [];
  const fields: string[] = [];
  if (!same(q.prompt, row.prompt)) fields.push("prompt");
  if (!same(q.passage, row.passage)) fields.push("passage");
  if (options.length !== q.options.length || q.options.some((o, i) => !same(o, options[i]))) {
    fields.push("options");
  }
  if (q.correctIndex !== row.correct_index) fields.push("correctIndex");
  if (!same(q.explain, row.explain)) fields.push("explain");
  return fields;
}

const CHUNK = 200;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const kindArgs = args.filter((a) => !a.startsWith("--"));

function toRow(q: DraftQuestion): QuestionInsert {
  return {
    id: q.id,
    kind: q.kind,
    prompt: q.prompt,
    passage: q.passage ?? null,
    options: q.options,
    correct_index: q.correctIndex,
    explain: q.explain,
    status: "draft",
    verification: q.verification ?? null,
    verification_note: q.verificationNote ?? null,
  };
}

async function main() {
  const unknown = kindArgs.filter((a) => !isKind(a));
  if (unknown.length > 0) throw new Error(`Okänt delprov: ${unknown.join(", ")}`);
  const kinds = kindArgs.length > 0 ? kindArgs.filter(isKind) : contentKinds();

  const existing = readFallbackQuestions();
  const drafts: DraftQuestion[] = [];
  let invalid = false;
  for (const kind of kinds) {
    const questions = readDrafts(kind);
    const { errors } = validateDrafts(kind, questions, { existing, requireVerification: true });
    for (const e of errors) console.error(`FEL: ${e}`);
    if (errors.length > 0) invalid = true;
    drafts.push(...questions);
  }
  if (invalid) throw new Error("Rätta felen ovan (npm run fragebank:validate) innan uppladdning.");
  if (drafts.length === 0) throw new Error("Inga frågor i content/ovningsfragor/.");

  const url = readEnvLocal("SUPABASE_URL") || readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvLocal("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs i .env.local.");
  }
  const sb = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const inDatabase = new Map<string, ExistingRow>();
  for (let i = 0; i < drafts.length; i += CHUNK) {
    const ids = drafts.slice(i, i + CHUNK).map((q) => q.id);
    const { data, error } = await sb
      .from("questions")
      .select("id, prompt, passage, options, correct_index, explain, status, verification")
      .in("id", ids);
    if (error) throw new Error(`Kunde inte läsa befintliga frågor: ${error.message}`);
    for (const row of data ?? []) inDatabase.set(row.id, row);
  }

  const fresh = drafts.filter((q) => !inDatabase.has(q.id));
  // Ett id som redan finns med annat innehåll är antingen ändrat på /review
  // (då gäller databasen) eller återanvänt av misstag (då når den nya frågan
  // aldrig databasen). Skriv ut dem, med de fält som skiljer, så att en person
  // kan avgöra vilket. Alla fält jämförs: i KVA och NOG är frågetexten
  // densamma i varje fråga.
  const differing = drafts
    .filter((q) => inDatabase.has(q.id))
    .map((q) => ({ id: q.id, fields: differingFields(q, inDatabase.get(q.id)!) }))
    .filter((d) => d.fields.length > 0);
  if (differing.length > 0) {
    console.warn(
      `Varning: ${differing.length} id finns redan i databasen med annat innehåll ` +
        `(ändrade på /review eller återanvända id?): ` +
        differing.map((d) => `${d.id} (${d.fields.join(", ")})`).join(", "),
    );
  }
  if (inDatabase.size > 0) {
    const byStatus = new Map<string, number>();
    for (const row of inDatabase.values()) {
      const key = `${row.status}${row.verification ? `/${row.verification}` : ""}`;
      byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
    }
    console.log(
      `I databasen (status/andra kontrollen): ${[...byStatus.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, n]) => `${key} ${n}`)
        .join(", ")}.`,
    );
  }
  const disagreed = fresh.filter((q) => q.verification === "disagreed").length;
  console.log(
    `${drafts.length} frågor (${kinds.join(", ")}): ${fresh.length} nya, varav ${disagreed} där andra ` +
      `kontrollen var oense. ${drafts.length - fresh.length} finns redan i databasen och lämnas orörda.`,
  );
  if (dryRun) {
    console.log("--dry-run: inget skrevs.");
    return;
  }

  for (let i = 0; i < fresh.length; i += CHUNK) {
    const rows = fresh.slice(i, i + CHUNK).map(toRow);
    const { error } = await sb.from("questions").insert(rows);
    if (error) throw new Error(`Uppladdningen avbröts: ${error.message}`);
  }
  console.log(`La in ${fresh.length} nya utkast. Gör stickprov och publicera på /review.`);
}

void main().catch((e) => {
  console.error("FEL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

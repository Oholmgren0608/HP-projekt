/**
 * Laddar upp de avskrivna kvantitativa UHR-frågorna (content/uhr/) som utkast.
 * Körs via `npm run fragebank:upload -- --uhr` (se upload.ts):
 *
 *   npm run fragebank:upload -- --uhr --dry-run                    # visa vad som skulle hända
 *   npm run fragebank:upload -- --uhr                              # alla avskrivna provpass
 *   npm run fragebank:upload -- --uhr hp-2019-10-20 hp-2024-10-20-p1   # vissa prov/provpass
 *   npm run fragebank:upload -- --uhr --skriv-over-utkast ...      # ersätt även redigerade utkast
 *   npm run fragebank:upload -- --uhr --publicera [--dry-run]      # publicera utkasten utan anteckning
 *
 * Importen (scripts/import-prov/insert.ts) lade in frågorna som utkast med
 * trasig text och en platshållare som förklaring. Här ersätts de utkasten med
 * avskriften: text, UHR:s facit, förklaring, figur (public/uhr/) och resultatet
 * av jämförelsen med facit. Publicerade och refuserade frågor rörs aldrig, och
 * ett utkast som redan har en riktig förklaring (t.ex. redigerat på /review)
 * ersätts bara med --skriv-over-utkast. Frågorna publiceras efter stickprov på
 * /review; databasen släpper bara igenom kvantitativa Provfrågor (0040).
 *
 * --publicera (Oscars beslut 2026-11-12) publicerar de utkast där AI:n fick
 * samma svar som facit och avskriften saknar anteckning ("Att kontrollera"),
 * och bara om utkastet i databasen är oförändrat sedan uppladdningen. Frågor med
 * anteckning, redigerade utkast och refuserade frågor lämnas till /review.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/client";
import { readEnvLocal } from "./lib";
import { checkPass } from "../uhr/kontroll";
import {
  facitIndex,
  figurePath,
  isPlaceholderExplain,
  passKey,
  questionId,
  readAllPasses,
  readFacit,
  readManifest,
  type UhrQuestion,
} from "../uhr/lib";

type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"];
type ExistingRow = Pick<
  Database["public"]["Tables"]["questions"]["Row"],
  "id" | "status" | "explain" | "prompt" | "passage" | "options" | "correct_index" | "figure_url" | "verification"
>;

const CHUNK = 200;
const AGREED_NOTE = "AI:n löste uppgiften utan facit och fick samma svar som UHR:s facit.";

/** Det granskaren ser på /review: jämförelsen med facit och avskriftens osäkerheter. */
function verificationNote(q: UhrQuestion): string | null {
  const parts = [
    q.verification === "agreed" ? AGREED_NOTE : q.verificationNote?.trim() ?? "",
    q.note?.trim() ? `Att kontrollera: ${q.note.trim()}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

function differs(row: QuestionInsert, old: ExistingRow): string[] {
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const fields: string[] = [];
  if (!same(row.prompt, old.prompt)) fields.push("prompt");
  if (!same(row.passage, old.passage)) fields.push("passage");
  if (!same(row.options, old.options)) fields.push("options");
  if (row.correct_index !== old.correct_index) fields.push("facit");
  if (!same(row.explain, old.explain)) fields.push("explain");
  if (!same(row.figure_url, old.figure_url)) fields.push("figur");
  if (!same(row.verification, old.verification)) fields.push("verification");
  return fields;
}

export async function uploadUhr(args: string[]) {
  const dryRun = args.includes("--dry-run");
  const overwrite = args.includes("--skriv-over-utkast");
  const wanted = args.filter((a) => !a.startsWith("--"));
  const facit = readFacit();
  const manifest = readManifest();

  const passes = readAllPasses().filter((p) => {
    const key = passKey(p.examId, p.passNumber);
    return wanted.length === 0 || wanted.includes(p.examId) || wanted.includes(key);
  });
  if (passes.length === 0) throw new Error("Inga avskrivna provpass i content/uhr/ matchar.");

  const rows: QuestionInsert[] = [];
  let invalid = false;
  for (const pass of passes) {
    const key = passKey(pass.examId, pass.passNumber);
    const report = checkPass(pass, facit);
    for (const e of report.errors) console.error(`FEL ${key}: ${e}`);
    const open = report.mismatches.filter((m) => !m.hasNote).map((m) => m.number);
    if (open.length > 0) console.error(`FEL ${key}: uppgift ${open.join(", ")} skiljer sig från facit men är inte genomgångna.`);
    const unverified = pass.questions.filter((q) => !q.verification).map((q) => q.number);
    if (unverified.length > 0) console.error(`FEL ${key}: kör scripts/uhr/kontroll.ts --write (saknar verification: ${unverified.join(", ")}).`);
    if (report.errors.length > 0 || open.length > 0 || unverified.length > 0) {
      invalid = true;
      continue;
    }

    const exam = manifest.find((e) => e.examId === pass.examId);
    const source = exam?.passes.find((p) => p.passNumber === pass.passNumber)?.url ?? null;
    for (const q of pass.questions) {
      const fig = figurePath(pass.examId, pass.passNumber, q);
      rows.push({
        id: questionId(pass.examId, pass.passNumber, q.number),
        kind: q.kind,
        prompt: q.prompt,
        passage: q.passage?.trim() ? q.passage : null,
        options: q.options,
        correct_index: facitIndex(facit, pass.examId, pass.passNumber, q.number)!,
        explain: q.explain,
        figure_url: fig ? `/${fig}` : null,
        verification: q.verification ?? null,
        verification_note: verificationNote(q),
        exam_id: pass.examId,
        exam_date: exam?.date ?? null,
        pass_number: pass.passNumber,
        question_number: q.number,
        source_url: source,
        status: "draft",
        pool: "ovning",
      });
    }
  }
  if (invalid) throw new Error("Rätta felen ovan (scripts/uhr/kontroll.ts) innan uppladdning.");

  const url = readEnvLocal("SUPABASE_URL") || readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvLocal("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY krävs i .env.local.");
  }
  const sb = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const existing = new Map<string, ExistingRow>();
  for (let i = 0; i < rows.length; i += CHUNK) {
    const ids = rows.slice(i, i + CHUNK).map((r) => r.id);
    const { data, error } = await sb
      .from("questions")
      .select("id, status, explain, prompt, passage, options, correct_index, figure_url, verification")
      .in("id", ids);
    if (error) throw new Error(`Kunde inte läsa befintliga frågor: ${error.message}`);
    for (const r of data ?? []) existing.set(r.id, r);
  }

  if (args.includes("--publicera")) {
    await publish(sb, rows, existing, dryRun);
    return;
  }

  const inserts: QuestionInsert[] = [];
  const updates: QuestionInsert[] = [];
  const kept: string[] = [];
  const edited: string[] = [];
  let unchanged = 0;
  for (const row of rows) {
    const old = existing.get(row.id);
    if (!old) {
      inserts.push(row);
      continue;
    }
    if (old.status !== "draft") {
      kept.push(`${row.id} (${old.status})`);
      continue;
    }
    const fields = differs(row, old);
    if (fields.length === 0) {
      unchanged++;
      continue;
    }
    if (!isPlaceholderExplain(old.explain ?? "") && !overwrite) {
      edited.push(`${row.id} (${fields.join(", ")})`);
      continue;
    }
    updates.push(row);
  }

  const byKind = new Map<string, number>();
  for (const r of rows) byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);
  const disagreed = rows.filter((r) => r.verification === "disagreed").length;
  console.log(
    `${passes.length} provpass, ${rows.length} frågor (${[...byKind].map(([k, n]) => `${k} ${n}`).join(", ")}), ` +
      `${disagreed} där AI:ns första svar skilde sig från facit.`,
  );
  console.log(
    `Nya: ${inserts.length}. Utkast som ersätts: ${updates.length}. Oförändrade: ${unchanged}. ` +
      `Publicerade/refuserade som lämnas orörda: ${kept.length}. Redigerade utkast som lämnas: ${edited.length}.`,
  );
  if (kept.length > 0) console.log(`  Orörda: ${kept.join(", ")}`);
  if (edited.length > 0) console.log(`  Redigerade utkast (ersätt med --skriv-over-utkast): ${edited.join(", ")}`);

  if (dryRun) {
    console.log("--dry-run: inget skrevs.");
    return;
  }

  const exams = [...new Set(rows.map((r) => r.exam_id!))].map((id) => {
    const exam = manifest.find((e) => e.examId === id);
    return { id, exam_date: exam?.date ?? id.slice(3), title: exam?.title ?? id };
  });
  const { error: examError } = await sb.from("exams").upsert(exams, { onConflict: "id", ignoreDuplicates: true });
  if (examError) throw new Error(`Kunde inte lägga in proven: ${examError.message}`);

  for (let i = 0; i < inserts.length; i += CHUNK) {
    const { error } = await sb.from("questions").insert(inserts.slice(i, i + CHUNK));
    if (error) throw new Error(`Uppladdningen avbröts: ${error.message}`);
  }
  // En rad i taget och bara så länge den är ett utkast: hinner någon publicera
  // frågan medan skriptet kör, rörs den inte.
  let replaced = 0;
  for (let i = 0; i < updates.length; i += 10) {
    const results = await Promise.all(
      updates.slice(i, i + 10).map(({ id, ...fields }) =>
        sb.from("questions").update(fields).eq("id", id!).eq("status", "draft").select("id"),
      ),
    );
    for (const { data, error } of results) {
      if (error) throw new Error(`Uppladdningen avbröts: ${error.message}`);
      replaced += data?.length ?? 0;
    }
  }
  console.log(`Klart: ${inserts.length} nya och ${replaced} ersatta utkast. Gör stickprov och publicera på /review.`);
}

/** Publicerar utkasten som AI:n löste lika med facit och som saknar anteckning (se --publicera ovan). */
async function publish(
  sb: ReturnType<typeof createClient<Database>>,
  rows: QuestionInsert[],
  existing: Map<string, ExistingRow>,
  dryRun: boolean,
) {
  const ready: string[] = [];
  const withNote: string[] = [];
  const notAgreed: string[] = [];
  const missing: string[] = [];
  const changed: string[] = [];
  let published = 0;
  let other = 0;
  for (const row of rows) {
    const old = existing.get(row.id);
    if (!old) missing.push(row.id);
    else if (old.status === "published") published++;
    else if (old.status !== "draft") other++;
    else if (row.verification !== "agreed") notAgreed.push(row.id);
    else if (row.verification_note?.includes("Att kontrollera:")) withNote.push(row.id);
    else if (differs(row, old).length > 0) changed.push(row.id);
    else ready.push(row.id);
  }
  console.log(
    `Publiceras: ${ready.length}. Redan publicerade: ${published}. Väntar på granskning på /review: ` +
      `${withNote.length} med anteckning, ${notAgreed.length} där AI:n var oense med facit, ` +
      `${changed.length} som ändrats sedan uppladdningen. Refuserade: ${other}. Saknas i databasen: ${missing.length}.`,
  );
  if (changed.length > 0) console.log(`  Ändrade sedan uppladdningen: ${changed.join(", ")}`);
  if (missing.length > 0) console.log(`  Saknas (kör uppladdningen först): ${missing.join(", ")}`);
  if (dryRun) {
    console.log("--dry-run: inget publicerades.");
    return;
  }
  let done = 0;
  for (let i = 0; i < ready.length; i += CHUNK) {
    const { data, error } = await sb
      .from("questions")
      .update({ status: "published" })
      .in("id", ready.slice(i, i + CHUNK))
      .eq("status", "draft")
      .select("id");
    if (error) throw new Error(`Publiceringen avbröts efter ${done} frågor: ${error.message}`);
    done += data?.length ?? 0;
  }
  console.log(`Klart: ${done} UHR-frågor publicerade. Kör npm run fragebank:export så att offlinekopian får dem.`);
}


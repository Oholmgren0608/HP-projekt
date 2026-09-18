/**
 * Insert parsed exams into Supabase (service-role key).
 *
 *   npx tsx scripts/import-prov/insert.ts hp-2024-10-20
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the project's
 * .env.local. Idempotent: upserts questions (status='draft') and an exam row.
 * Uploads figure PNGs to storage bucket "prov-figures" under hp-YYYY-MM-DD/.
 *
 * Does NOT run automatically during parser verification — only when invoked.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dirname;
const PROJECT_ROOT = join(ROOT, "..", "..");

interface ParsedQuestion {
  id: string;
  kind: string;
  questionNumber: number;
  prompt: string;
  passage?: string;
  options: string[];
  correctIndex: number;
  figureFile?: string;
  flags: string[];
}

interface ParsedPass {
  examId: string;
  examDate: string;
  passNumber: number;
  passKind: string;
  sourceUrl: string;
  questions: ParsedQuestion[];
  flags: string[];
}

interface ParsedExam {
  examId: string;
  examDate: string;
  title: string;
  passes: ParsedPass[];
}

function readEnv(): { url: string; key: string } {
  const envPath = join(PROJECT_ROOT, ".env.local");
  if (!existsSync(envPath)) return { url: "", key: "" };
  const raw = readFileSync(envPath, "utf8");
  const get = (name: string) => {
    for (const line of raw.split("\n")) {
      const i = line.indexOf("=");
      if (i < 0) continue;
      if (line.slice(0, i).trim() === name) return line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    return "";
  };
  return {
    url: get("NEXT_PUBLIC_SUPABASE_URL") || get("SUPABASE_URL"),
    key: get("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

async function main() {
  const examId = process.argv[2];
  if (!examId) {
    console.error("Usage: npx tsx scripts/import-prov/insert.ts <examId>  (e.g. hp-2024-10-20)");
    process.exit(1);
  }

  const { url, key } = readEnv();
  if (!key) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing from .env.local.");
    console.error("");
    console.error("Add it to /home/hej/hp/HP-projekt/.env.local:");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...");
    console.error("(Get it from Supabase Dashboard -> Project Settings -> API -> service_role key.)");
    console.error("");
    console.error("SUPABASE_URL currently read as:", url || "(missing)");
    process.exit(1);
  }
  if (!url) {
    console.error("SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.");
    process.exit(1);
  }

  const jsonPath = join(ROOT, "parsed", `${examId}.json`);
  if (!existsSync(jsonPath)) {
    console.error(`No parsed file: ${jsonPath}. Run the parser first (npx tsx scripts/import-prov/run.ts).`);
    process.exit(1);
  }
  const exam: ParsedExam = JSON.parse(readFileSync(jsonPath, "utf8"));

  // Title comes from the manifest (source of truth); fall back to the JSON.
  let title = exam.title;
  const manifestPath = join(ROOT, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      const hit = (m.exams ?? []).find((e: { examId?: string; date?: string }) => e.examId === examId || e.date === exam.examDate);
      if (hit?.title) title = hit.title;
    } catch {
      // ignore malformed manifest; keep the JSON title
    }
  }

  // Lazy-require @supabase/supabase-js (already in package.json).
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Upsert exam row.
  const { error: examErr } = await sb.from("exams").upsert(
    { id: exam.examId, exam_date: exam.examDate, title, status: "imported" },
    { onConflict: "id" },
  );
  if (examErr) console.error("exams upsert error:", examErr.message);

  // 2. Upload figures.
  const bucket = "prov-figures";
  const figureDir = join(ROOT, "figures");
  const uploaded = new Map<string, string>(); // filename -> public url

  for (const pass of exam.passes) {
    for (const q of pass.questions) {
      if (!q.figureFile) continue;
      if (uploaded.has(q.figureFile)) continue;
      const local = join(figureDir, q.figureFile);
      if (!existsSync(local)) continue;
      const storagePath = `${exam.examId}/${q.figureFile}`;
      const data = readFileSync(local);
      const { error: upErr } = await sb.storage
        .from(bucket)
        .upload(storagePath, data, { upsert: true, contentType: "image/png" });
      if (upErr) {
        console.error(`upload ${q.figureFile}: ${upErr.message}`);
        continue;
      }
      uploaded.set(q.figureFile, `${url}/storage/v1/object/public/${bucket}/${storagePath}`);
    }
  }

  // 3. Upsert questions.
  for (const pass of exam.passes) {
    for (const q of pass.questions) {
      const figureUrl = q.figureFile ? uploaded.get(q.figureFile) ?? null : null;
      const row = {
        id: q.id,
        kind: q.kind,
        prompt: q.prompt,
        passage: q.passage ?? null,
        options: q.options,
        correct_index: q.correctIndex,
        explain: "",
        exam_id: exam.examId,
        exam_date: exam.examDate,
        pass_number: pass.passNumber,
        question_number: q.questionNumber,
        figure_url: figureUrl,
        source_url: pass.sourceUrl,
        status: "draft",
      };
      const { error } = await sb.from("questions").upsert(row, { onConflict: "id" });
      if (error) console.error(`question ${q.id}: ${error.message}`);
    }
  }

  const total = exam.passes.reduce((n, p) => n + p.questions.length, 0);
  console.log(`Done. Upserted exam ${exam.examId} + ${total} questions, uploaded ${uploaded.size} figures.`);
}

void main().catch((e) => {
  console.error("FATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});

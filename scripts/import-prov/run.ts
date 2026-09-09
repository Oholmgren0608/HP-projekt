/**
 * CLI: parse official exams from scripts/import-prov/manifest.json.
 *
 *   npx tsx scripts/import-prov/run.ts [examId ...]
 *
 * With no args, parses the two verification exams (hösten 2013, hösten 2024).
 * With examIds, parses exactly those (e.g. hp-2020-10-25).
 *
 * The manifest is the SOURCE OF TRUTH: examId, title, date, passes[]
 * (passNumber + type), facitUrl. Pass numbers are NOT hardcoded — they vary
 * per exam ({1,3,4,5} vs {2,3,4,5} vs {1,2,4,5}).
 *
 * Downloads PDFs to scripts/import-prov/downloads/, writes JSON to
 * scripts/import-prov/parsed/ and figures to scripts/import-prov/figures/.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseExam, type ParsedExam, type PassKind } from "./lib/parse";

const ROOT = import.meta.dirname;

interface ManifestPass {
  passNumber: number;
  type: "kvant" | "verbal";
  url: string;
}

interface ManifestExam {
  examId: string;
  title: string;
  date: string; // YYYY-MM-DD
  passes: ManifestPass[];
  facitUrl: string;
  notes?: string[];
}

interface Manifest {
  exams: ManifestExam[];
}

function loadManifest(): ManifestExam[] {
  const p = join(ROOT, "manifest.json");
  const data: Manifest = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(data.exams)) throw new Error("manifest.json: missing exams[]");
  return data.exams;
}

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function printSamples(exam: ParsedExam) {
  const kindOrder = ["ord", "las", "mek", "xyz", "kva", "nog", "dtk"];
  for (const kind of kindOrder) {
    const qs = exam.passes.flatMap((p) => p.questions).filter((q) => q.kind === kind);
    if (qs.length === 0) continue;
    const q = qs[0];
    const pass = exam.passes.find((p) => p.questions.includes(q))!;
    console.log(`\n[${q.id}] kind=${q.kind} pass=${pass.passNumber} q=${q.questionNumber} correct=${q.options[q.correctIndex] ?? "?"}`);
    console.log(`  prompt: ${truncate(q.prompt, 160)}`);
    if (q.passage) console.log(`  passage: ${truncate(q.passage, 120)}`);
    q.options.forEach((o, i) => console.log(`  ${"ABCDE"[i]}: ${truncate(o, 70)}`));
    if (q.figureFile) console.log(`  figure: ${q.figureFile}`);
    if (q.flags.length) console.log(`  flags: ${q.flags.join(", ")}`);
  }
}

function runOne(manifest: ManifestExam): ParsedExam {
  const examDate = manifest.date;
  console.log(`\n${"=".repeat(72)}`);
  console.log(`Parsing ${manifest.examId} (${manifest.title})`);
  console.log(`passes: ${manifest.passes.map((p) => `p${p.passNumber}(${p.type})`).join(", ")}`);
  console.log(`${"=".repeat(72)}`);

  const exam = parseExam({
    examId: manifest.examId,
    examDate,
    title: manifest.title,
    facitUrl: manifest.facitUrl,
    passes: manifest.passes.map((p) => ({
      passNumber: p.passNumber,
      url: p.url,
      passKindHint: p.type as PassKind,
    })),
    workDir: join(ROOT, "downloads", manifest.examId),
    outDir: join(ROOT, "parsed"),
    figureDir: join(ROOT, "figures"),
  });

  let total = 0;
  for (const pass of exam.passes) {
    const byKind = new Map<string, number>();
    for (const q of pass.questions) byKind.set(q.kind, (byKind.get(q.kind) ?? 0) + 1);
    const sectionStats = [...byKind.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, c]) => `${k}:${c}`).join("  ");
    total += pass.questions.length;
    console.log(`\n-- pass ${pass.passNumber} (${pass.passKind}) : ${pass.questions.length} questions --`);
    console.log(`   sections: ${sectionStats}`);
    if (pass.flags.length) console.log(`   pass flags: ${pass.flags.join(" | ")}`);

    const qFlags = pass.questions.filter((q) => q.flags.length > 0);
    if (qFlags.length) {
      const tally = new Map<string, number>();
      for (const q of qFlags) for (const f of q.flags) tally.set(f, (tally.get(f) ?? 0) + 1);
      console.log(`   ${qFlags.length} questions flagged: ${[...tally.entries()].map(([f, c]) => `${f}×${c}`).join(", ")}`);
    }
  }
  console.log(`\nTOTAL for ${manifest.examId}: ${total} questions`);
  return exam;
}

function main() {
  const manifest = loadManifest();
  console.log(`manifest.json loaded: ${manifest.length} exams`);

  const targets = process.argv.slice(2);
  const selected =
    targets.length > 0
      ? targets.map((id) => {
          const hit = manifest.find((e) => e.examId === id || e.date === id);
          if (!hit) throw new Error(`exam ${id} not found in manifest.json`);
          return hit;
        })
      : manifest.filter((e) => e.date === "2024-10-20" || e.date === "2013-10-26");

  const exams = selected.map(runOne);

  console.log(`\n${"=".repeat(72)}`);
  console.log("SAMPLE parsed questions (eyeball check)");
  console.log(`${"=".repeat(72)}`);
  for (const exam of exams) printSamples(exam);
}

main();

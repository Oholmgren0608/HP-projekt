/**
 * Kontrollerar de avskrivna UHR-frågorna och jämför AI:ns svar med UHR:s facit.
 *
 *   npx tsx scripts/uhr/kontroll.ts                       # alla provpass i content/uhr/
 *   npx tsx scripts/uhr/kontroll.ts hp-2019-10-20-p1      # ett provpass
 *   npx tsx scripts/uhr/kontroll.ts --write ...           # skriv verification till filerna
 *
 * Fel (formatet, saknade figurer) gör att skriptet avslutas med kod 1.
 * Frågor där AI:ns svar utan facit skiljer sig från facit listas: de ska gås
 * igenom en gång till med facit (är avskriften fel eller lösningen?) och får
 * då en verificationNote. Med --write sätts verification till 'agreed' när
 * svaren stämmer och 'disagreed' annars; /review visar de senare tydligt.
 */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_ROOT,
  facitIndex,
  figurePath,
  isPlaceholderExplain,
  kindOfNumber,
  passFile,
  passKey,
  readAllPasses,
  readFacit,
  type Facit,
  type UhrPass,
} from "./lib";

/** Samma fasta alternativ och frågetexter som i övningsfrågorna (scripts/fragebank/lib.ts). */
import { FIXED_OPTIONS, FIXED_PROMPTS, OPTION_COUNT } from "../fragebank/lib";

export type PassReport = {
  key: string;
  errors: string[];
  mismatches: { number: number; blind: number; facit: number; hasNote: boolean }[];
  agreed: number;
};

export function checkPass(pass: UhrPass, facit: Facit): PassReport {
  const key = passKey(pass.examId, pass.passNumber);
  const errors: string[] = [];
  const mismatches: PassReport["mismatches"] = [];
  let agreed = 0;

  const numbers = pass.questions.map((q) => q.number);
  for (let n = 1; n <= 40; n++) {
    const count = numbers.filter((x) => x === n).length;
    if (count === 0) errors.push(`uppgift ${n} saknas`);
    if (count > 1) errors.push(`uppgift ${n} finns ${count} gånger`);
  }

  for (const q of pass.questions) {
    const at = `uppgift ${q.number}`;
    if (!Number.isInteger(q.number) || q.number < 1 || q.number > 40) {
      errors.push(`${at}: ogiltigt nummer`);
      continue;
    }
    if (q.kind !== kindOfNumber(q.number)) errors.push(`${at}: delprov ${q.kind}, väntade ${kindOfNumber(q.number)}`);
    if (!q.prompt?.trim()) errors.push(`${at}: frågetext saknas`);
    const fixedPrompt = FIXED_PROMPTS[q.kind];
    if (fixedPrompt && q.prompt !== fixedPrompt) errors.push(`${at}: frågetexten ska vara "${fixedPrompt}"`);
    if ((q.kind === "kva" || q.kind === "nog") && !q.passage?.trim()) errors.push(`${at}: passage saknas`);
    if (q.kind === "kva" && q.passage && !/Kvantitet I:[\s\S]*Kvantitet II:/.test(q.passage)) {
      errors.push(`${at}: passage ska innehålla "Kvantitet I:" och "Kvantitet II:"`);
    }
    if (q.kind === "nog" && q.passage && !/\(1\)[\s\S]*\(2\)/.test(q.passage)) {
      errors.push(`${at}: passage ska innehålla påståendena (1) och (2)`);
    }
    if (!Array.isArray(q.options) || q.options.length !== OPTION_COUNT[q.kind]) {
      errors.push(`${at}: ${q.options?.length ?? 0} alternativ, väntade ${OPTION_COUNT[q.kind]}`);
    } else {
      if (q.options.some((o) => typeof o !== "string" || !o.trim())) errors.push(`${at}: tomt alternativ`);
      const fixed = FIXED_OPTIONS[q.kind];
      if (fixed && q.options.some((o, i) => o !== fixed[i])) errors.push(`${at}: alternativen ska vara de fasta`);
    }
    if (!q.explain?.trim() || isPlaceholderExplain(q.explain)) errors.push(`${at}: förklaring saknas`);
    else if (q.explain.trim().length < 60) errors.push(`${at}: förklaringen är för kort`);
    if (!Number.isInteger(q.blindAnswer) || q.blindAnswer < 0 || q.blindAnswer >= (q.options?.length ?? 0)) {
      errors.push(`${at}: blindAnswer saknas eller är ogiltigt`);
    }
    if (q.kind === "dtk" && !q.figure) errors.push(`${at}: DTK-fråga utan figur`);
    if (q.figure) {
      if (!Array.isArray(q.figure.pages) || q.figure.pages.length === 0) errors.push(`${at}: figurens sidor saknas`);
      if (q.figure.rotate !== undefined && ![90, 180, 270].includes(q.figure.rotate)) {
        errors.push(`${at}: rotate måste vara 90, 180 eller 270`);
      }
      if (q.figure.box && (q.figure.box.length !== 4 || q.figure.box.some((v) => typeof v !== "number" || v < 0 || v > 1))) {
        errors.push(`${at}: box ska vara fyra andelar mellan 0 och 1`);
      }
      const rel = figurePath(pass.examId, pass.passNumber, q);
      if (rel && !existsSync(join(PROJECT_ROOT, "public", rel))) {
        errors.push(`${at}: figuren public/${rel} saknas (kör scripts/uhr/figur.ts ${key})`);
      }
    }

    const correct = facitIndex(facit, pass.examId, pass.passNumber, q.number);
    if (correct === null) {
      errors.push(`${at}: facit saknas (kör scripts/uhr/prepare.ts ${pass.examId})`);
    } else if (q.blindAnswer === correct) {
      agreed++;
    } else {
      mismatches.push({ number: q.number, blind: q.blindAnswer, facit: correct, hasNote: Boolean(q.verificationNote?.trim()) });
    }
  }
  return { key, errors, mismatches, agreed };
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const keys = args.filter((a) => !a.startsWith("--"));
  if (write && keys.length === 0) {
    // Flera avskrifter kan pågå samtidigt; skriv bara de provpass som anges.
    throw new Error("--write kräver provpass, t.ex. kontroll.ts --write hp-2019-10-20-p1.");
  }
  const facit = readFacit();
  const passes = readAllPasses().filter((p) => keys.length === 0 || keys.includes(passKey(p.examId, p.passNumber)));
  if (passes.length === 0) throw new Error("Inga avskrivna provpass hittades i content/uhr/.");

  let errorCount = 0;
  let open = 0;
  let total = 0;
  let agreedTotal = 0;
  const letters = "ABCDE";
  for (const pass of passes) {
    const r = checkPass(pass, facit);
    total += pass.questions.length;
    agreedTotal += r.agreed;
    errorCount += r.errors.length;
    const pending = r.mismatches.filter((m) => !m.hasNote);
    open += pending.length;
    console.log(
      `${r.key}: ${r.agreed}/${pass.questions.length} lika med facit` +
        (r.mismatches.length > 0
          ? `; olika: ${r.mismatches
              .map((m) => `${m.number} (AI ${letters[m.blind] ?? "?"}, facit ${letters[m.facit]}${m.hasNote ? ", genomgången" : ""})`)
              .join(", ")}`
          : ""),
    );
    for (const e of r.errors) console.log(`  FEL: ${e}`);

    if (write) {
      for (const q of pass.questions) {
        const correct = facitIndex(facit, pass.examId, pass.passNumber, q.number);
        if (correct === null) continue;
        q.verification = q.blindAnswer === correct ? "agreed" : "disagreed";
      }
      writeFileSync(passFile(pass.examId, pass.passNumber), `${JSON.stringify(pass, null, 2)}\n`);
    }
  }
  console.log(
    `\n${passes.length} provpass, ${total} frågor: ${agreedTotal} lika med facit, ` +
      `${total - agreedTotal} olika (${open} ej genomgångna), ${errorCount} fel.`,
  );
  if (errorCount > 0) process.exit(1);
}

if (process.argv[1]?.endsWith("kontroll.ts")) main();

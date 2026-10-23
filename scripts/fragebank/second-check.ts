/**
 * Andra kontrollen av nya övningsfrågor.
 *
 *   npm run fragebank:kontroll -- blind elf
 *     Skriver content/ovningsfragor/.andra-kontroll/elf.blind.json: frågorna
 *     utan facit och förklaring. Kontrollanten (en annan AI än den som skrev
 *     frågorna) löser dem från början och skriver elf.svar.json:
 *       [{ "id": "...", "answerIndex": 2, "explanationOk": true, "issues": "" }]
 *     `explanationOk` och `issues` fylls i efter den blinda lösningen, när
 *     kontrollanten jämför med frågans förklaring.
 *
 *   npm run fragebank:kontroll -- merge elf
 *     För över resultatet till content/ovningsfragor/elf.json. Ense (agreed)
 *     kräver samma svar som facit, godkänd förklaring och inga anmärkningar;
 *     allt annat blir oense (disagreed) och måste granskas manuellt på /review.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHECK_DIR, contentPath, isKind, letter, readDrafts, type DraftQuestion } from "./lib";

type CheckAnswer = {
  id: string;
  answerIndex: number;
  explanationOk: boolean;
  issues?: string;
};

const [command, kindArg] = process.argv.slice(2);
if ((command !== "blind" && command !== "merge") || !kindArg || !isKind(kindArg)) {
  console.error("Användning: second-check.ts blind|merge <delprov>");
  process.exit(1);
}
const kind = kindArg;
const questions = readDrafts(kind);
mkdirSync(CHECK_DIR, { recursive: true });
const blindPath = join(CHECK_DIR, `${kind}.blind.json`);
const answerPath = join(CHECK_DIR, `${kind}.svar.json`);

if (command === "blind") {
  const blind = questions.map((q) => ({
    id: q.id,
    kind: q.kind,
    ...(q.passage ? { passage: q.passage } : {}),
    prompt: q.prompt,
    options: q.options,
  }));
  writeFileSync(blindPath, JSON.stringify(blind, null, 2) + "\n");
  console.log(`Skrev ${blind.length} frågor utan facit till ${blindPath}`);
  process.exit(0);
}

if (!existsSync(answerPath)) {
  console.error(`Hittar inte kontrollantens svar: ${answerPath}`);
  process.exit(1);
}
const answers = JSON.parse(readFileSync(answerPath, "utf8")) as CheckAnswer[];
const byId = new Map(answers.map((a) => [a.id, a]));
const missing = questions.filter((q) => !byId.has(q.id)).map((q) => q.id);
if (missing.length > 0) {
  console.error(`Kontrollanten har inte svarat på: ${missing.join(", ")}`);
  process.exit(1);
}

let agreed = 0;
const merged: DraftQuestion[] = questions.map((q) => {
  const a = byId.get(q.id)!;
  const notes: string[] = [];
  if (a.answerIndex !== q.correctIndex) {
    notes.push(
      Number.isInteger(a.answerIndex) && a.answerIndex >= 0 && a.answerIndex < q.options.length
        ? `Andra kontrollen valde ${letter(a.answerIndex)} men facit är ${letter(q.correctIndex)}.`
        : `Andra kontrollen kunde inte välja ett svar (facit är ${letter(q.correctIndex)}).`,
    );
  }
  if (a.explanationOk !== true) notes.push("Förklaringen godkändes inte.");
  if (a.issues && a.issues.trim()) notes.push(a.issues.trim());

  const rest: DraftQuestion = { ...q };
  delete rest.verification;
  delete rest.verificationNote;
  if (notes.length === 0) {
    agreed += 1;
    return { ...rest, verification: "agreed" };
  }
  return { ...rest, verification: "disagreed", verificationNote: notes.join(" ") };
});

writeFileSync(contentPath(kind), JSON.stringify(merged, null, 2) + "\n");
console.log(`${kind}: ense ${agreed}, oense ${merged.length - agreed} av ${merged.length}.`);

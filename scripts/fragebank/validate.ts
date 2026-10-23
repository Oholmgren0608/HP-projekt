/**
 * Automatiska kontroller av övningsfrågorna i content/ovningsfragor/.
 *
 *   npm run fragebank:validate            # alla delprov
 *   npm run fragebank:validate -- elf las # bara vissa
 *
 * Avslutar med felkod om någon fråga bryter mot reglerna i lib.ts.
 */

import {
  contentKinds,
  isKind,
  letter,
  OPTION_COUNT,
  readDrafts,
  readFallbackQuestions,
  validateDrafts,
} from "./lib";

const args = process.argv.slice(2);
const unknown = args.filter((a) => !isKind(a));
if (unknown.length > 0) {
  console.error(`Okänt delprov: ${unknown.join(", ")}`);
  process.exit(1);
}
const kinds = args.length > 0 ? args.filter(isKind) : contentKinds();
if (kinds.length === 0) {
  console.error("Hittade inga filer i content/ovningsfragor/.");
  process.exit(1);
}

const existing = readFallbackQuestions();
let failed = false;

for (const kind of kinds) {
  const questions = readDrafts(kind);
  const { errors, warnings } = validateDrafts(kind, questions, { existing });
  const counts = new Array<number>(OPTION_COUNT[kind]).fill(0);
  for (const q of questions) if (counts[q.correctIndex] !== undefined) counts[q.correctIndex] += 1;
  const agreed = questions.filter((q) => q.verification === "agreed").length;
  const disagreed = questions.filter((q) => q.verification === "disagreed").length;

  console.log(
    `${kind}: ${questions.length} frågor, rätt svar ${counts.map((c, i) => `${letter(i)}=${c}`).join(" ")}, ` +
      `andra kontrollen ense=${agreed} oense=${disagreed} saknas=${questions.length - agreed - disagreed}`,
  );
  for (const w of warnings) console.log(`  varning: ${w}`);
  for (const e of errors) console.log(`  FEL: ${e}`);
  if (errors.length > 0) failed = true;
}

process.exit(failed ? 1 : 0);

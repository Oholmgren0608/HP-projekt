/**
 * Gemensam kod för frågebanksskripten (validate, second-check, upload,
 * export-fallback).
 *
 * Övningsfrågor skrivs som JSON i `content/ovningsfragor/<delprov>.json`,
 * kontrolleras automatiskt (validate), får en oberoende andra kontroll
 * (second-check) och laddas upp till databasen som utkast (upload). De
 * publiceras först efter stickprov på /review. Databasen är sanningen; den
 * bundlade banken i appen genereras därifrån (export-fallback).
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChoiceQuestion } from "@/lib/practice-types";

export const PROJECT_ROOT = join(import.meta.dirname, "..", "..");
export const CONTENT_DIR = join(PROJECT_ROOT, "content", "ovningsfragor");
/** Underlag för andra kontrollen (frågor utan facit + kontrollantens svar). Ej i git. */
export const CHECK_DIR = join(CONTENT_DIR, ".andra-kontroll");
export const FALLBACK_PATH = join(PROJECT_ROOT, "src", "lib", "content", "fallback-bank.json");

export type Kind = ChoiceQuestion["kind"];

export const KINDS: Kind[] = ["ord", "mek", "las", "elf", "dtk", "xyz", "kva", "nog"];

export type Verification = "agreed" | "disagreed";

/** En övningsfråga som den skrivs i content/ovningsfragor/<delprov>.json. */
export type DraftQuestion = {
  id: string;
  kind: Kind;
  prompt: string;
  passage?: string;
  options: string[];
  correctIndex: number;
  explain: string;
  /** Sätts av `second-check merge`. Saknas tills andra kontrollen är gjord. */
  verification?: Verification;
  verificationNote?: string;
};

/** Fasta svarsalternativ, i provets ordning. */
export const FIXED_OPTIONS: Partial<Record<Kind, string[]>> = {
  kva: [
    "I är större än II",
    "II är större än I",
    "I är lika med II",
    "Informationen är otillräcklig",
  ],
  nog: [
    "i (1) men ej i (2)",
    "i (2) men ej i (1)",
    "i (1) tillsammans med (2)",
    "i (1) och (2) var för sig",
    "ej genom de båda påståendena",
  ],
};

/** Fasta frågetexter för delprov där uppgiften står i texten (passage). */
export const FIXED_PROMPTS: Partial<Record<Kind, string>> = {
  kva: "Jämför kvantitet I och kvantitet II.",
  nog: "Tillräcklig information för lösningen erhålls",
};

/** Antal svarsalternativ per delprov, som på provet. */
export const OPTION_COUNT: Record<Kind, number> = {
  ord: 5,
  mek: 4,
  las: 4,
  elf: 4,
  dtk: 4,
  xyz: 4,
  kva: 4,
  nog: 5,
};

/**
 * Delprov där texten (passage) krävs. Frågetexten visas på en rad, så allt som
 * behöver radbrytningar (texter, tabeller, kvantiteter, påståenden) ligger där.
 */
const PASSAGE_REQUIRED = new Set<Kind>(["mek", "las", "elf", "dtk", "kva", "nog"]);
const PASSAGE_FORBIDDEN = new Set<Kind>(["ord"]);

export const ID_PATTERN = /^ovn-(ord|mek|las|elf|dtk|xyz|kva|nog)-\d{3}$/;

export function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

function normalize(text: string): string {
  return text.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim();
}

export function contentPath(kind: Kind): string {
  return join(CONTENT_DIR, `${kind}.json`);
}

export function isKind(value: string): value is Kind {
  return (KINDS as string[]).includes(value);
}

/** Delprov som har en innehållsfil. */
export function contentKinds(): Kind[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter(isKind);
}

export function readDrafts(kind: Kind): DraftQuestion[] {
  const raw = JSON.parse(readFileSync(contentPath(kind), "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error(`${kind}.json ska vara en JSON-array.`);
  return raw as DraftQuestion[];
}

export function readFallbackQuestions(): ChoiceQuestion[] {
  const raw = JSON.parse(readFileSync(FALLBACK_PATH, "utf8")) as { questions?: ChoiceQuestion[] };
  return raw.questions ?? [];
}

export type Report = { errors: string[]; warnings: string[] };

/**
 * Automatiska kontroller av en delprovsfil. `requireVerification` används vid
 * uppladdning: då måste andra kontrollen vara gjord för varje fråga.
 */
export function validateDrafts(
  kind: Kind,
  questions: DraftQuestion[],
  opts: { existing: ChoiceQuestion[]; requireVerification?: boolean },
): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  // Publicerade övningsfrågor finns både här och (efter export) i
  // reservbanken; en träff på samma id är samma fråga, inte en dubblett.
  const existingTexts = new Map(
    opts.existing.map((q) => [normalize(`${q.passage ?? ""} ${q.prompt}`), q.id]),
  );
  const ownTexts = new Map<string, string>();
  const optionCount = OPTION_COUNT[kind];
  const fixedOptions = FIXED_OPTIONS[kind];
  const fixedPrompt = FIXED_PROMPTS[kind];

  questions.forEach((q, i) => {
    const at = `${kind}.json[${i}]${q && typeof q.id === "string" ? ` (${q.id})` : ""}`;
    if (!q || typeof q !== "object") {
      errors.push(`${at}: ska vara ett objekt.`);
      return;
    }

    if (typeof q.id !== "string" || !ID_PATTERN.test(q.id)) {
      errors.push(`${at}: id ska ha formen ovn-${kind}-001.`);
    } else {
      if (!q.id.startsWith(`ovn-${kind}-`)) errors.push(`${at}: id hör till fel delprov.`);
      if (seenIds.has(q.id)) errors.push(`${at}: id förekommer flera gånger.`);
      seenIds.add(q.id);
    }
    if (q.kind !== kind) errors.push(`${at}: kind ska vara "${kind}".`);

    if (typeof q.prompt !== "string" || !q.prompt.trim()) {
      errors.push(`${at}: prompt saknas.`);
    } else {
      if (q.prompt.includes("\n")) errors.push(`${at}: prompt visas på en rad – flytta radbrytningar till passage.`);
      if (q.prompt.length > 600) errors.push(`${at}: prompt är längre än 600 tecken.`);
      if (fixedPrompt && q.prompt !== fixedPrompt) {
        errors.push(`${at}: prompt ska vara exakt "${fixedPrompt}".`);
      }
    }

    const hasPassage = typeof q.passage === "string" && q.passage.trim().length > 0;
    if (q.passage !== undefined && typeof q.passage !== "string") {
      errors.push(`${at}: passage ska vara en sträng.`);
    }
    if (PASSAGE_REQUIRED.has(kind) && !hasPassage) errors.push(`${at}: passage krävs för ${kind}.`);
    if (PASSAGE_FORBIDDEN.has(kind) && q.passage !== undefined) {
      errors.push(`${at}: ${kind} ska inte ha passage.`);
    }
    if (hasPassage && q.passage!.length > 6000) errors.push(`${at}: passage är längre än 6000 tecken.`);
    if (kind === "kva" && hasPassage) {
      if (!/Kvantitet I:/.test(q.passage!) || !/Kvantitet II:/.test(q.passage!)) {
        errors.push(`${at}: passage ska innehålla "Kvantitet I:" och "Kvantitet II:".`);
      }
    }
    if (kind === "nog" && hasPassage) {
      if (!/\(1\)/.test(q.passage!) || !/\(2\)/.test(q.passage!)) {
        errors.push(`${at}: passage ska innehålla påståendena (1) och (2).`);
      }
    }
    if (kind === "mek" && hasPassage && !q.passage!.includes("____")) {
      errors.push(`${at}: passage ska markera luckorna med ____.`);
    }

    if (!Array.isArray(q.options) || !q.options.every((o) => typeof o === "string" && o.trim())) {
      errors.push(`${at}: options ska vara icke-tomma strängar.`);
    } else {
      if (q.options.length !== optionCount) {
        errors.push(`${at}: ${kind} ska ha ${optionCount} svarsalternativ (har ${q.options.length}).`);
      }
      const normalized = q.options.map(normalize);
      if (new Set(normalized).size !== normalized.length) errors.push(`${at}: två svarsalternativ är lika.`);
      if (fixedOptions && q.options.join("|") !== fixedOptions.join("|")) {
        errors.push(`${at}: svarsalternativen ska vara exakt ${JSON.stringify(fixedOptions)}.`);
      }
    }

    if (
      typeof q.correctIndex !== "number" ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= (Array.isArray(q.options) ? q.options.length : 0)
    ) {
      errors.push(`${at}: correctIndex pekar inte på ett svarsalternativ.`);
    }

    if (typeof q.explain !== "string" || q.explain.trim().length < 80) {
      errors.push(`${at}: explain saknas eller är kortare än 80 tecken.`);
    } else if (/\b(alternativ|svar)\s+[A-E]\b/.test(q.explain)) {
      warnings.push(`${at}: förklaringen hänvisar till en bokstav – skriv ut alternativet i stället.`);
    }

    if (q.verification !== undefined && q.verification !== "agreed" && q.verification !== "disagreed") {
      errors.push(`${at}: verification ska vara "agreed" eller "disagreed".`);
    }
    if (opts.requireVerification && q.verification === undefined) {
      errors.push(`${at}: andra kontrollen saknas (kör second-check).`);
    }

    if (typeof q.prompt === "string") {
      const text = normalize(`${q.passage ?? ""} ${q.prompt}`);
      const existingDupe = existingTexts.get(text);
      const dupeOf = existingDupe !== q.id ? existingDupe : undefined;
      const ownDupe = ownTexts.get(text);
      if (dupeOf ?? ownDupe) errors.push(`${at}: samma text som ${dupeOf ?? ownDupe}.`);
      ownTexts.set(text, q.id);
    }
  });

  // Inga blanksteg i kanterna: granskningsformuläret trimmar texterna, så
  // annars ser en orörd fråga ändrad ut när den sparas.
  questions.forEach((q, i) => {
    const at = `${kind}.json[${i}]${q && typeof q.id === "string" ? ` (${q.id})` : ""}`;
    const texts = [q?.prompt, q?.passage, q?.explain, ...(Array.isArray(q?.options) ? q.options : [])];
    if (texts.some((t) => typeof t === "string" && t !== t.trim())) {
      errors.push(`${at}: text börjar eller slutar med blanksteg eller radbrytning.`);
    }
  });

  // Rätt svar ska vara spritt över positionerna, annars går det att gissa.
  const n = questions.length;
  if (n >= 10) {
    const counts = new Array<number>(optionCount).fill(0);
    for (const q of questions) {
      if (Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < optionCount) {
        counts[q.correctIndex] += 1;
      }
    }
    const maxShare = Math.max(...counts) / n;
    const limit = fixedOptions ? 0.5 : 0.4;
    if (maxShare > limit) {
      errors.push(
        `${kind}: för många rätta svar på samma position (${counts.map((c, i) => `${letter(i)}=${c}`).join(" ")}).`,
      );
    }
    if (!fixedOptions && n >= optionCount * 2 && counts.some((c) => c === 0)) {
      errors.push(
        `${kind}: någon position är aldrig rätt svar (${counts.map((c, i) => `${letter(i)}=${c}`).join(" ")}).`,
      );
    }
  }

  return { errors, warnings };
}

/** Läser en variabel ur .env.local (samma format som scripts/import-prov). */
export function readEnvLocal(name: string): string {
  if (process.env[name]) return process.env[name]!.trim();
  const envPath = join(PROJECT_ROOT, ".env.local");
  if (!existsSync(envPath)) return "";
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i < 0) continue;
    if (line.slice(0, i).trim() === name) {
      return line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

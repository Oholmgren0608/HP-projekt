/**
 * Gemensam kod för UHR:s kvantitativa frågor (docs/uhr-fragor/plan.md).
 *
 * Kedjan per provpass:
 *   1. prepare  – renderar sidorna ur UHR:s PDF och skriver underlag + facit
 *   2. en AI skriver av frågorna från sidbilderna, löser dem utan facit och
 *      skriver förklaringar → content/uhr/<examId>-p<N>.json
 *   3. figur    – klipper ut figurerna till public/uhr/<examId>/
 *   4. kontroll – jämför AI:ns svar med UHR:s facit och kontrollerar formatet
 *   5. npm run fragebank:upload -- --uhr – uppdaterar utkasten i databasen
 * Frågorna publiceras först efter stickprov på /review.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChoiceQuestion } from "@/lib/practice-types";

export const PROJECT_ROOT = join(import.meta.dirname, "..", "..");
export const UHR_DIR = join(PROJECT_ROOT, "content", "uhr");
/** Sidbilder och underlag för den som skriver av frågorna. Ej i git. */
export const WORK_DIR = join(UHR_DIR, ".arbete");
export const FACIT_PATH = join(UHR_DIR, "facit.json");
export const FIGURE_DIR = join(PROJECT_ROOT, "public", "uhr");
export const IMPORT_DIR = join(PROJECT_ROOT, "scripts", "import-prov");
export const MANIFEST_PATH = join(IMPORT_DIR, "manifest.json");

export type UhrKind = Extract<ChoiceQuestion["kind"], "xyz" | "kva" | "nog" | "dtk">;
export const UHR_KINDS: UhrKind[] = ["xyz", "kva", "nog", "dtk"];

/** Uppgiftsnummer per delprov i ett kvantitativt provpass (samma 2012–2024). */
export function kindOfNumber(n: number): UhrKind {
  if (n >= 1 && n <= 12) return "xyz";
  if (n <= 22) return "kva";
  if (n <= 28) return "nog";
  if (n <= 40) return "dtk";
  throw new Error(`Uppgift ${n} finns inte i ett kvantitativt provpass.`);
}

export type ManifestPass = { passNumber: number; type: "kvant" | "verbal"; url: string };
export type ManifestExam = {
  examId: string;
  title: string;
  date: string;
  facitUrl: string;
  passes: ManifestPass[];
};

export function readManifest(): ManifestExam[] {
  return (JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { exams: ManifestExam[] }).exams;
}

export function kvantPasses(exam: ManifestExam): ManifestPass[] {
  return exam.passes.filter((p) => p.type === "kvant");
}

export function passKey(examId: string, passNumber: number): string {
  return `${examId}-p${passNumber}`;
}

export function questionId(examId: string, passNumber: number, number: number): string {
  return `${examId}-p${passNumber}-q${number}`;
}

export function pdfPath(examId: string, passNumber: number): string {
  return join(IMPORT_DIR, "downloads", examId, `provpass-${passNumber}.pdf`);
}

/** UHR:s facit: facit[examId][passNumber] = 40 bokstäver ("A"–"E"). */
export type Facit = Record<string, Record<string, string[]>>;

export function readFacit(): Facit {
  return existsSync(FACIT_PATH) ? (JSON.parse(readFileSync(FACIT_PATH, "utf8")) as Facit) : {};
}

export function facitIndex(facit: Facit, examId: string, passNumber: number, number: number): number | null {
  const letter = facit[examId]?.[String(passNumber)]?.[number - 1];
  if (!letter) return null;
  const idx = "ABCDE".indexOf(letter);
  return idx >= 0 ? idx : null;
}

/**
 * Figur till en fråga. `box` är x0, y0, x1, y1 som andel (0–1) av sidans
 * bredd och höjd. En DTK-figur utan box klipps automatiskt ur sidan (allt
 * mellan sidhuvudet och sidnumret); flera sidor läggs under varandra.
 * `boxes` ger en egen box per sida (null = hela DTK-sidan), när underlaget
 * står på flera sidor och bara en del av någon av dem behövs.
 * `rotate` vrider varje utklipp medurs (liggande sidor i provhäftet).
 */
export type UhrFigure = {
  pages: number[];
  box?: [number, number, number, number];
  boxes?: ([number, number, number, number] | null)[];
  rotate?: 90 | 180 | 270;
};

/** En avskriven fråga som den står i content/uhr/<examId>-p<N>.json. */
export type UhrQuestion = {
  number: number;
  kind: UhrKind;
  prompt: string;
  passage?: string;
  options: string[];
  /** Svaret som AI:n kom fram till utan facit (0 = A). */
  blindAnswer: number;
  explain: string;
  figure?: UhrFigure | null;
  /** Fritext om något i avskriften är osäkert. Tom när allt stämmer. */
  note?: string;
  /** Sätts av kontrollen efter jämförelse med facit. */
  verification?: "agreed" | "disagreed";
  verificationNote?: string;
};

export type UhrPass = {
  examId: string;
  passNumber: number;
  questions: UhrQuestion[];
};

export function passFile(examId: string, passNumber: number): string {
  return join(UHR_DIR, `${passKey(examId, passNumber)}.json`);
}

export function readPass(examId: string, passNumber: number): UhrPass | null {
  const file = passFile(examId, passNumber);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as UhrPass) : null;
}

/** Alla avskrivna provpass i content/uhr/, sorterade. */
export function readAllPasses(): UhrPass[] {
  if (!existsSync(UHR_DIR)) return [];
  return readdirSync(UHR_DIR)
    .filter((f) => /^hp-\d{4}-\d{2}-\d{2}-p\d\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(UHR_DIR, f), "utf8")) as UhrPass);
}

/** Filnamn (relativt public/) för figuren till en fråga. DTK-figurer delas per sida. */
export function figurePath(examId: string, passNumber: number, q: Pick<UhrQuestion, "number" | "kind" | "figure">): string | null {
  if (!q.figure) return null;
  const name =
    q.kind === "dtk" && !q.figure.box && !q.figure.boxes
      ? `p${passNumber}-s${q.figure.pages.join("-")}.webp`
      : `p${passNumber}-q${q.number}.webp`;
  return `uhr/${examId}/${name}`;
}

export { isPlaceholderExplain } from "@/lib/uhr";

/**
 * Bildförklaringar till UHR-frågornas facit: markeringar på frågans egen bild
 * (src/lib/content/uhr-marks.ts). Arbetsgången står i scripts/uhr/FORKLARING.md.
 *
 *   npx tsx scripts/uhr/forklaring.ts lista hp-2019-10-20-p1          # frågorna som ska ha markeringar
 *   npx tsx scripts/uhr/forklaring.ts rendera hp-2019-10-20-p1 [q3]   # förhandsbilder med markeringarna
 *   npx tsx scripts/uhr/forklaring.ts kontroll [hp-2019-10-20-p1 ...] # kontrollera filerna (alla om inget anges)
 *   npx tsx scripts/uhr/forklaring.ts status                          # hur många frågor som har markeringar
 *
 * Frågorna som ska ha markeringar är de publicerade UHR-frågorna med bild, alltså de
 * i offlinekopian (src/lib/content/fallback-bank.json) som har figureUrl. `lista` och
 * `rendera` lägger PNG-bilder i content/uhr/.arbete/forklaring/ (ingår inte i git).
 * Fel gör att skriptet avslutas med kod 1.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { marksToSvg, validateMarks, type UhrMarksFile } from "@/lib/content/uhr-marks";
import { PROJECT_ROOT, WORK_DIR, facitIndex, figurePath, readFacit, readPass, type UhrPass } from "./lib";

const MARKS_DIR = join(PROJECT_ROOT, "public", "uhr", "forklaring");
const OUT_DIR = join(WORK_DIR, "forklaring");
const LETTERS = "ABCDE";

type Target = { id: string; number: number; image: string };

/** Publicerade UHR-frågor med bild, per provpass ("hp-2019-10-20-p1"). */
function targets(): Map<string, Target[]> {
  const bank = JSON.parse(readFileSync(join(PROJECT_ROOT, "src", "lib", "content", "fallback-bank.json"), "utf8"));
  const questions: { id: string; figureUrl?: string }[] = bank.questions ?? bank;
  const out = new Map<string, Target[]>();
  for (const q of questions) {
    const m = /^(hp-\d{4}-\d{2}-\d{2}-p\d)-q(\d{1,2})$/.exec(q.id);
    if (!m || !q.figureUrl) continue;
    const list = out.get(m[1]) ?? [];
    list.push({ id: q.id, number: Number(m[2]), image: q.figureUrl });
    out.set(m[1], list);
  }
  for (const list of out.values()) list.sort((a, b) => a.number - b.number);
  return out;
}

function splitPass(key: string): { examId: string; passNumber: number } {
  const m = /^(hp-\d{4}-\d{2}-\d{2})-p(\d)$/.exec(key);
  if (!m) throw new Error(`Okänt provpass: ${key} (skriv t.ex. hp-2019-10-20-p1)`);
  return { examId: m[1], passNumber: Number(m[2]) };
}

function readMarks(key: string): UhrMarksFile | null {
  const file = join(MARKS_DIR, `${key}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as UhrMarksFile) : null;
}

const imageFile = (image: string) => join(PROJECT_ROOT, "public", image);

/**
 * Bilden med ett rutnät var 50:e pixel (tal var 100:e), så att koordinaterna går att
 * läsa av när markeringarna placeras. Rutnätet finns bara i arbetsbilden.
 */
async function gridImage(image: string, width: number, height: number, out: string) {
  const lines: string[] = [];
  for (let x = 50; x < width; x += 50)
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${x % 100 ? "#ff8c00" : "#e0218a"}" stroke-opacity="${x % 100 ? 0.25 : 0.45}" stroke-width="1"/>`);
  for (let y = 50; y < height; y += 50)
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${y % 100 ? "#ff8c00" : "#e0218a"}" stroke-opacity="${y % 100 ? 0.25 : 0.45}" stroke-width="1"/>`);
  const labels: string[] = [];
  for (let x = 100; x < width; x += 100) labels.push(`<text x="${x + 2}" y="12" font-size="11" fill="#e0218a">${x}</text>`);
  for (let y = 100; y < height; y += 100) labels.push(`<text x="2" y="${y - 2}" font-size="11" fill="#e0218a">${y}</text>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${lines.join("")}${labels.join("")}</svg>`;
  await sharp(imageFile(image))
    .flatten({ background: "#ffffff" })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(out);
}

async function list(key: string) {
  const { examId, passNumber } = splitPass(key);
  const pass = readPass(examId, passNumber) as UhrPass | null;
  const wanted = targets().get(key) ?? [];
  if (!pass || wanted.length === 0) throw new Error(`Inga publicerade frågor med bild i ${key}.`);
  const facit = readFacit();
  mkdirSync(join(OUT_DIR, "bild"), { recursive: true });
  for (const t of wanted) {
    const q = pass.questions.find((x) => x.number === t.number)!;
    const meta = await sharp(imageFile(t.image)).metadata();
    const png = join(OUT_DIR, "bild", `${t.id}.png`);
    if (!existsSync(png)) await gridImage(t.image, meta.width!, meta.height!, png);
    const correct = facitIndex(facit, examId, passNumber, t.number);
    console.log(`\n=== ${t.id} (${q.kind.toUpperCase()}, uppgift ${t.number})`);
    console.log(`Bild: ${t.image}  ${meta.width} × ${meta.height} px  (med rutnät var 50:e pixel: ${png})`);
    if (q.passage) console.log(`Underlag: ${q.passage}`);
    console.log(`Fråga: ${q.prompt}`);
    q.options.forEach((o, i) => console.log(`  ${LETTERS[i]}. ${o}${i === correct ? "   ← rätt" : ""}`));
    console.log(`Förklaring: ${q.explain}`);
  }
  console.log(`\n${wanted.length} frågor. Markeringarna skrivs till public/uhr/forklaring/${key}.json.`);
}

async function render(key: string, only?: string) {
  const file = readMarks(key);
  if (!file) throw new Error(`public/uhr/forklaring/${key}.json finns inte ännu.`);
  mkdirSync(join(OUT_DIR, "forhandsvisning"), { recursive: true });
  for (const [id, m] of Object.entries(file.marks)) {
    if (only && !id.endsWith(`-${only}`)) continue;
    const errors = validateMarks(id, m);
    if (errors.length) {
      console.log(errors.join("\n"));
      continue;
    }
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 ${m.width} ${m.height}">${marksToSvg(m)}</svg>`;
    const out = join(OUT_DIR, "forhandsvisning", `${id}.png`);
    await sharp(imageFile(m.image))
      .flatten({ background: "#ffffff" })
      .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
      .png()
      .toFile(out);
    console.log(`${id}: ${out}\n  Bildtext: ${m.caption}`);
  }
}

/** Fel i ett provpass markeringar; tom lista = godkänt. */
async function check(key: string, wanted: Target[]): Promise<{ errors: string[]; missing: string[] }> {
  const errors: string[] = [];
  const file = readMarks(key);
  if (!file) return { errors, missing: wanted.map((t) => t.id) };
  const { examId, passNumber } = splitPass(key);
  if (file.examId !== examId || file.passNumber !== passNumber) errors.push(`${key}: examId/passNumber stämmer inte med filnamnet`);
  const pass = readPass(examId, passNumber);
  const byId = new Map(wanted.map((t) => [t.id, t]));
  for (const [id, m] of Object.entries(file.marks ?? {})) {
    const t = byId.get(id);
    if (!t) {
      errors.push(`${id}: är ingen publicerad fråga med bild i ${key}`);
      continue;
    }
    errors.push(...validateMarks(id, m));
    const q = pass?.questions.find((x) => x.number === t.number);
    const expected = q ? `/${figurePath(examId, passNumber, q)}` : t.image;
    if (m.image !== t.image || m.image !== expected) errors.push(`${id}: image ska vara ${t.image}`);
    else {
      const meta = await sharp(imageFile(m.image)).metadata();
      if (meta.width !== m.width || meta.height !== m.height)
        errors.push(`${id}: width/height ska vara ${meta.width} × ${meta.height} (bildens mått)`);
    }
  }
  const missing = wanted.filter((t) => !(file.marks ?? {})[t.id]).map((t) => t.id);
  return { errors, missing };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const all = targets();
  if (command === "lista" && args[0]) return list(args[0]);
  if (command === "rendera" && args[0]) return render(args[0], args[1]);
  if (command === "kontroll" || command === "status") {
    const keys = args.length ? args : [...all.keys()].sort();
    let errors = 0;
    let done = 0;
    let total = 0;
    for (const key of keys) {
      const wanted = all.get(key) ?? [];
      const res = await check(key, wanted);
      total += wanted.length;
      done += wanted.length - res.missing.length;
      errors += res.errors.length;
      if (command === "kontroll") {
        for (const e of res.errors) console.log(`FEL ${e}`);
        if (res.missing.length && args.length) console.log(`${key}: saknar markeringar för ${res.missing.join(", ")}`);
      } else {
        console.log(`${key}: ${wanted.length - res.missing.length}/${wanted.length}${res.errors.length ? `, ${res.errors.length} fel` : ""}`);
      }
    }
    const extra = existsSync(MARKS_DIR)
      ? readdirSync(MARKS_DIR).filter((f) => f.endsWith(".json") && !all.has(f.replace(/\.json$/, "")))
      : [];
    for (const f of extra) {
      console.log(`FEL ${f}: inget provpass med publicerade frågor med bild`);
      errors++;
    }
    console.log(`\n${done}/${total} frågor har markeringar, ${errors} fel.`);
    if (errors) process.exit(1);
    return;
  }
  console.error("Användning: lista <pass> | rendera <pass> [qN] | kontroll [pass ...] | status");
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

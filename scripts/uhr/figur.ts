/**
 * Klipper ut figurerna till UHR-frågorna ur provets PDF.
 *
 *   npx tsx scripts/uhr/figur.ts hp-2019-10-20-p1            # alla figurer i ett provpass
 *   npx tsx scripts/uhr/figur.ts hp-2019-10-20-p1 3 30       # bara vissa uppgifter
 *   npx tsx scripts/uhr/figur.ts --all                       # alla avskrivna provpass
 *   npx tsx scripts/uhr/figur.ts --zoom hp-2019-10-20-p1 3 0.1 0.1 0.9 0.5 [--dpi 600] [--rotate 90]
 *        # förstoring av en del av sida 3 (andelar av sidan) till .arbete/<pass>/zoom.png
 *
 * Läser `figure` per fråga i content/uhr/<examId>-p<N>.json och skriver WebP
 * till public/uhr/<examId>/ (se figurePath i lib.ts). Med `box` (eller en box
 * per sida i `boxes`) klipps den delen av sidan ut; en DTK-figur utan box blir
 * hela sidan mellan sidhuvudet och sidnumret. Vita kanter tas bort. Kräver
 * poppler-utils (pdftoppm).
 */

import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { pdfWordBoxes, renderPage } from "../import-prov/lib/pdf";
import type { PageBox } from "../import-prov/lib/pdf";
import {
  FIGURE_DIR,
  PROJECT_ROOT,
  WORK_DIR,
  figurePath,
  passKey,
  pdfPath,
  readAllPasses,
  readPass,
  type UhrPass,
  type UhrQuestion,
} from "./lib";

const RENDER_DPI = 200;
const MAX_WIDTH = { dtk: 1400, other: 1000 };
const PADDING = 12;

type Box = [number, number, number, number];

function parseKey(key: string): { examId: string; passNumber: number } {
  const m = /^(hp-\d{4}-\d{2}-\d{2})-p(\d)$/.exec(key);
  if (!m) throw new Error(`Okänt provpass "${key}" (väntade t.ex. hp-2019-10-20-p1).`);
  return { examId: m[1], passNumber: Number(m[2]) };
}

/** Sidan i hög upplösning, renderad en gång per provpass, sida och upplösning. */
function hiResPage(examId: string, passNumber: number, page: number, dpi = RENDER_DPI): string {
  const suffix = dpi === RENDER_DPI ? "" : `-${dpi}dpi`;
  const file = join(WORK_DIR, passKey(examId, passNumber), `hog-${String(page).padStart(2, "0")}${suffix}.png`);
  if (!existsSync(file)) renderPage(pdfPath(examId, passNumber), page, file, dpi);
  return file;
}

async function rotated(buf: Buffer, rotate: number | undefined): Promise<Buffer> {
  if (!rotate) return buf;
  if (![90, 180, 270].includes(rotate)) throw new Error(`rotate måste vara 90, 180 eller 270 (fick ${rotate}).`);
  return sharp(buf).rotate(rotate).png().toBuffer();
}

/**
 * DTK-sidans innehåll: under sidhuvudet ("DTK – Diagram, tabeller och kartor"
 * eller "DTK"), ovanför sidnumret ("– 16 –"), innanför skärmärkena.
 * Sidhuvudet är ordet "DTK" och de vågräta orden på samma rad, och sidnumret
 * är ett tal mellan två streck mitt på sidan. Ord ur rubriker, tabeller och
 * fotnoter nära kanterna (även lodräta på liggande sidor) tas alltså inte för
 * sidhuvud eller sidnummer.
 */
function dtkBox(page: PageBox): Box {
  type Word = PageBox["words"][number];
  const horizontal = (w: Word) => w.x1 - w.x0 >= w.y1 - w.y0;
  const sameLine = (a: Word, b: Word) => Math.abs(a.y0 - b.y0) < 3 && Math.abs(a.y1 - b.y1) < 3;
  // Sidhuvudet ligger 2,5–5 % ned (olika år); skärmärkena överst är grafik, inte ord.
  const band = page.words.filter((w) => w.y1 < page.height * 0.1 && w.y0 > page.height * 0.01);
  // Äldre häften: "DELPROV DTK – DIAGRAM, TABELLER OCH KARTOR" (i PDF:ens text ibland gemener).
  const marks = band.filter((w) => /^dtk$/i.test(w.text));
  const head = band.filter((w) => marks.includes(w) || (horizontal(w) && marks.some((m) => horizontal(m) && sameLine(w, m))));
  const dashes = page.words.filter((w) => w.text === "–" || w.text === "-");
  const foot = page.words.filter(
    (w) =>
      w.y0 > page.height * 0.9 &&
      w.y1 < page.height * 0.985 &&
      w.x0 > page.width * 0.35 &&
      w.x1 < page.width * 0.65 &&
      (/^[–-]\d{1,2}[–-]$/.test(w.text) ||
        (/^\d{1,2}$/.test(w.text) &&
          dashes.some((d) => sameLine(d, w) && d.x1 <= w.x0 + 1 && w.x0 - d.x1 < 15) &&
          dashes.some((d) => sameLine(d, w) && d.x0 >= w.x1 - 1 && d.x0 - w.x1 < 15))),
  );
  const top = head.length > 0 ? Math.max(...head.map((w) => w.y1)) + 1 : page.height * 0.04;
  const bottom = foot.length > 0 ? Math.min(...foot.map((w) => w.y0)) - 4 : page.height * 0.95;
  // Sidled: 5–95 % av bredden, men vidare om text står närmare kanten (rader på
  // liggande sidor, axeltitlar).
  const inside = page.words.filter((w) => w.y0 >= top && w.y1 <= bottom);
  const left = Math.min(0.05, (Math.min(...inside.map((w) => w.x0)) - 6) / page.width);
  const right = Math.max(0.95, (Math.max(...inside.map((w) => w.x1)) + 6) / page.width);
  return [Math.max(0.01, left), top / page.height, Math.min(0.99, right), bottom / page.height];
}

async function cropBox(file: string, box: Box, trim = true): Promise<Buffer> {
  const img = sharp(file);
  const { width = 0, height = 0 } = await img.metadata();
  const [x0, y0, x1, y1] = box.map((v) => Math.min(1, Math.max(0, v))) as Box;
  if (x1 <= x0 || y1 <= y0) throw new Error(`Ogiltig box ${JSON.stringify(box)}.`);
  const left = Math.round(x0 * width);
  const top = Math.round(y0 * height);
  const region = {
    left,
    top,
    width: Math.max(1, Math.round(x1 * width) - left),
    height: Math.max(1, Math.round(y1 * height) - top),
  };
  const cut = await sharp(file).extract(region).png().toBuffer();
  if (!trim) return cut;
  // Bara vita kanter tas bort; en helt vit ruta (fel box) lämnas som den är.
  try {
    return await sharp(cut).trim({ background: "#ffffff", threshold: 20 }).png().toBuffer();
  } catch {
    return cut;
  }
}

async function stackVertically(parts: Buffer[]): Promise<Buffer> {
  if (parts.length === 1) return parts[0];
  const metas = await Promise.all(parts.map((p) => sharp(p).metadata()));
  const width = Math.max(...metas.map((m) => m.width ?? 0));
  const gap = 40;
  const height = metas.reduce((n, m) => n + (m.height ?? 0), 0) + gap * (parts.length - 1);
  let y = 0;
  const composites = parts.map((input, i) => {
    const c = { input, top: y, left: 0 };
    y += (metas[i].height ?? 0) + gap;
    return c;
  });
  return sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite(composites)
    .png()
    .toBuffer();
}

async function writeFigure(buf: Buffer, out: string, maxWidth: number) {
  mkdirSync(dirname(out), { recursive: true });
  await sharp(buf)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .extend({ top: PADDING, bottom: PADDING, left: PADDING, right: PADDING, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .webp({ quality: 80 })
    .toFile(out);
}

async function figureFor(pass: UhrPass, q: UhrQuestion, pages: () => PageBox[]): Promise<string | null> {
  const rel = figurePath(pass.examId, pass.passNumber, q);
  if (!rel || !q.figure) return null;
  const out = join(PROJECT_ROOT, "public", rel);
  const parts: Buffer[] = [];
  for (const [i, page] of q.figure.pages.entries()) {
    const file = hiResPage(pass.examId, pass.passNumber, page);
    let box = q.figure.boxes ? q.figure.boxes[i] ?? undefined : q.figure.box;
    if (!box) {
      if (q.kind !== "dtk") throw new Error(`Uppgift ${q.number}: figur utan box (bara DTK får sakna box).`);
      const pb = pages().find((p) => p.page === page);
      if (!pb) throw new Error(`Uppgift ${q.number}: sidan ${page} finns inte.`);
      box = dtkBox(pb);
    }
    parts.push(await rotated(await cropBox(file, box), q.figure.rotate));
  }
  await writeFigure(await stackVertically(parts), out, q.kind === "dtk" ? MAX_WIDTH.dtk : MAX_WIDTH.other);
  return out;
}

function option(args: string[], name: string): number | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const value = Number(args[i + 1]);
  if (!Number.isFinite(value)) throw new Error(`${name} kräver ett tal.`);
  args.splice(i, 2);
  return value;
}

async function zoom(input: string[]) {
  const args = [...input];
  const dpi = option(args, "--dpi") ?? RENDER_DPI;
  const rotate = option(args, "--rotate");
  if (dpi < 72 || dpi > 900) throw new Error("--dpi ska vara mellan 72 och 900.");
  const [key, pageArg, ...nums] = args;
  const { examId, passNumber } = parseKey(key);
  const box = nums.map(Number) as Box;
  if (box.length !== 4 || box.some((n) => Number.isNaN(n))) throw new Error("Ange sida och x0 y0 x1 y1.");
  const file = hiResPage(examId, passNumber, Number(pageArg), dpi);
  const out = join(WORK_DIR, key, "zoom.png");
  // Ingen kantborttagning: bildens pixlar motsvarar exakt boxen, så att man kan mäta i den.
  await sharp(await rotated(await cropBox(file, box, false), rotate)).toFile(out);
  console.log(out);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--zoom") return zoom(args.slice(1));

  const passes: { pass: UhrPass; only: number[] }[] = [];
  if (args[0] === "--all") {
    for (const pass of readAllPasses()) passes.push({ pass, only: [] });
  } else {
    if (!args[0]) throw new Error("Ange ett provpass (t.ex. hp-2019-10-20-p1) eller --all.");
    const { examId, passNumber } = parseKey(args[0]);
    const pass = readPass(examId, passNumber);
    if (!pass) throw new Error(`content/uhr/${args[0]}.json finns inte.`);
    passes.push({ pass, only: args.slice(1).map(Number) });
  }

  let written = 0;
  for (const { pass, only } of passes) {
    let pageBoxes: PageBox[] | null = null;
    const pages = () => (pageBoxes ??= pdfWordBoxes(pdfPath(pass.examId, pass.passNumber)));
    const done = new Set<string>();
    for (const q of pass.questions) {
      if (only.length > 0 && !only.includes(q.number)) continue;
      const rel = figurePath(pass.examId, pass.passNumber, q);
      if (!rel || done.has(rel)) continue;
      done.add(rel);
      const out = await figureFor(pass, q, pages);
      if (out) {
        written++;
        console.log(out);
      }
    }
    // Hela provpasset: ta bort figurer som ingen uppgift längre använder (t.ex. efter ändrad box).
    if (only.length === 0) {
      const dir = join(FIGURE_DIR, pass.examId);
      const prefix = `p${pass.passNumber}-`;
      for (const file of existsSync(dir) ? readdirSync(dir) : []) {
        if (!file.startsWith(prefix) || !file.endsWith(".webp")) continue;
        if (done.has(`uhr/${pass.examId}/${file}`)) continue;
        unlinkSync(join(dir, file));
        console.log(`Tog bort oanvänd figur ${join(dir, file)}`);
      }
    }
  }
  console.log(`${written} figurer skrivna till ${FIGURE_DIR}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

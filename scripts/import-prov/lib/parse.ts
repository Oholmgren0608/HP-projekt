/**
 * Core parser: official högskoleprov PDFs -> structured questions.
 *
 * Strategy (validated against hösten 2013 and hösten 2024):
 *  - Text comes from `pdftotext -bbox` word boxes (top-left origin, points).
 *  - Question boundaries come from printed "N." markers; the printed number is
 *    authoritative (two-column layouts are disambiguated by x-position).
 *  - Options are the lettered A–E lines under each stem.
 *  - LÄS passages are the flowing text above each "Uppgifter" block.
 *  - DTK figures live on a dedicated page immediately BEFORE the question page
 *    (charts are raster images sliced into 1px strips; tables are text). We
 *    render that page to a PNG and share it across the question group.
 *  - Inline figures in XYZ/KVA/NOG (e.g. geometry) are cropped from the
 *    question's own page via pdftohtml image boxes.
 */

import {
  checkTools,
  download,
  pdfImageList,
  pdfPageCount,
  pdfText,
  pdfWordBoxes,
  renderPage,
  renderRegion,
  type ImageInfo,
  type PageBox,
  type WordBox,
} from "./pdf";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Kind = "ord" | "mek" | "las" | "xyz" | "kva" | "nog" | "dtk";
export type PassKind = "verbal" | "kvant";

export interface ParsedQuestion {
  id: string;
  kind: Kind;
  questionNumber: number; // 1..40 within the pass
  prompt: string;
  passage?: string;
  options: string[];
  correctIndex: number; // 0-based (A=0 … E=4)
  figureFile?: string;
  flags: string[];
}

export interface ParsedPass {
  examId: string;
  examDate: string;
  passNumber: number;
  passKind: PassKind;
  sourceUrl: string;
  questions: ParsedQuestion[];
  flags: string[];
}

export interface ParsedExam {
  examId: string;
  examDate: string;
  title: string;
  passes: ParsedPass[];
}

// ---- section ranges ------------------------------------------------------

const KVANT_RANGES: Array<{ kind: Kind; start: number; end: number }> = [
  { kind: "xyz", start: 1, end: 12 },
  { kind: "kva", start: 13, end: 22 },
  { kind: "nog", start: 23, end: 28 },
  { kind: "dtk", start: 29, end: 40 },
];

const VERBAL_RANGES: Array<{ kind: Kind; start: number; end: number }> = [
  { kind: "ord", start: 1, end: 10 },
  { kind: "las", start: 11, end: 20 },
  { kind: "mek", start: 21, end: 30 },
];

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

// ---- small utils ---------------------------------------------------------

/** Strip soft hyphens / zero-width chars. */
function clean(s: string): string {
  return s
    .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Merge hyphenation across line breaks: "problemlösnings-\nlösning" -> "problemlösningslösning". */
function mergeHyphenation(text: string): string {
  return text.replace(/-\n([a-zåäöé])/g, "$1").replace(/ \n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Word boxes grouped into visual lines (same ~baseline). */
interface Line {
  y: number;
  words: WordBox[];
}

function groupLines(words: WordBox[], yTolerance = 4): Line[] {
  const sorted = [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const lines: Line[] = [];
  for (const w of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(w.y0 - last.y) <= yTolerance) {
      last.words.push(w);
      last.y = (last.y * last.words.length + w.y0) / (last.words.length + 1); // rolling
    } else {
      lines.push({ y: w.y0, words: [w] });
    }
  }
  for (const l of lines) l.words.sort((a, b) => a.x0 - b.x0);
  return lines;
}

/** Join words on a line with spaces (skip zero-width boxes). */
function lineText(words: WordBox[]): string {
  return clean(words.filter((w) => w.x1 > w.x0).map((w) => w.text).join(" "));
}

/** Render a question's word region into text with line breaks. */
function renderWords(words: WordBox[]): string {
  const lines = groupLines(words, 5);
  const parts = lines
    .filter((l) => !looksLikePageNumber(l.words))
    .map((l) => lineText(l.words))
    .filter((t) => t.length > 0);
  return mergeHyphenation(parts.join("\n"));
}

/** A line that is only "– 16 –" (page number) or similar. */
function looksLikePageNumber(words: WordBox[]): boolean {
  const texts = words.map((w) => clean(w.text)).filter(Boolean);
  if (texts.length === 0 || texts.length > 4) return false;
  const hasDash = texts.some((t) => /^[-–—]+$/.test(t));
  return hasDash && texts.every((t) => /^[-–—]+$/.test(t) || /^\d+$/.test(t));
}

function questionNumberFromMarker(text: string): number | null {
  // Question numbers are printed as "N." (trailing period required — this
  // rejects stray digits like "1" in "Provpass 1" or "40" in "40 uppgifter").
  const m = /^(\d+)\.$/.exec(clean(text));
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 40 ? n : null;
}

function sectionHeaderKind(word: string): Kind | null {
  const w = clean(word).toUpperCase().replace(/[^A-ZÅÄÖ]/g, "");
  if (w === "ORD" || w === "ORDFÖRSTÅELSE" || w === "ORDFORSTAELSE") return "ord";
  if (w === "MEK" || w === "MENINGSKOMPLETTERING") return "mek";
  if (w === "LAS" || w === "LÄS" || w === "LÄSFÖRSTÅELSE" || w === "LASFÖRSTÅELSE" || w === "LASFORSTAELSE" || w === "LÄSFORSTAELSE") return "las";
  if (w === "ELF") return "las"; // never creates ELF; treated as absent
  if (w === "XYZ") return "xyz";
  if (w === "KVA") return "kva";
  if (w === "NOG") return "nog";
  if (w === "DTK") return "dtk";
  return null;
}

// ---- facit ---------------------------------------------------------------

/**
 * Parse the facit PDF (1 page, 4 columns "Provpass N", 40 letters each).
 * Returns { passNumber -> 40 letters A-E }.
 */
export function parseFacit(facitPath: string): Map<number, string[]> {
  const text = pdfText(facitPath, { layout: true });
  const lines = text.split("\n");

  // Locate header columns: "Provpass 1 (= DYS 1)" style.
  const headerLine = lines.find((l) => /\bProvpass\s+\d+/.test(l));
  if (!headerLine) throw new Error(`facit: no "Provpass" header found in ${facitPath}`);

  // Extract pass numbers in order from the header line.
  const passNumbers: number[] = [];
  const re = /\bProvpass\s+(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(headerLine)) !== null) passNumbers.push(parseInt(m[1], 10));

  // Collect data rows: "  1   D  ..." — each row has "num letter" repeated per column.
  const result = new Map<number, string[]>();
  for (const pn of passNumbers) result.set(pn, []);

  for (const line of lines) {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    // A data row looks like:  "1 D   1 C   1 D   1 E" (row number repeated
    // once per column, followed by that column's letter).
    const rowNum = parseInt(tokens[0], 10);
    if (!Number.isInteger(rowNum) || rowNum < 1 || rowNum > 40) continue;
    const letters = tokens.slice(1).filter((t) => /^[A-E]$/.test(t));
    if (letters.length !== passNumbers.length) {
      throw new Error(
        `facit: row ${rowNum} has ${letters.length} letters, expected ${passNumbers.length} (${tokens.join(" ")})`,
      );
    }
    passNumbers.forEach((pn, i) => result.get(pn)!.push(letters[i]));
  }

  for (const pn of passNumbers) {
    if (result.get(pn)!.length !== 40) {
      throw new Error(`facit: pass ${pn} has ${result.get(pn)!.length} answers, expected 40`);
    }
  }
  return result;
}

// ---- question extraction -------------------------------------------------

interface QuestionMarker {
  number: number;
  page: number;
  x: number;
  y: number;
  word: WordBox;
}

interface OptionRun {
  letter: string;
  words: WordBox[];
}

/** A detected question region on one or more pages. */
interface QuestionRegion {
  marker: QuestionMarker;
  page: number;
  column: "left" | "right";
  // words belonging to this question (stem + options), in reading order
  words: WordBox[];
  // option runs in order
  options: OptionRun[];
  // words before the first option letter (the stem/prompt)
  stemWords: WordBox[];
}

function findMarkers(pages: PageBox[]): QuestionMarker[] {
  const markers: QuestionMarker[] = [];
  for (const page of pages) {
    for (const w of page.words) {
      const n = questionNumberFromMarker(w.text);
      if (n === null) continue;
      if (w.x1 - w.x0 > 60) continue; // a real question number is narrow
      // A question number sits at the left edge of its column: nothing may sit
      // just to its left on the same line. Sentence-ending "är 7." has "är"
      // ~12pt to its left; a 2-column right marker has the previous column's
      // text ~50pt away (column gutter). 25pt cleanly separates the two.
      const hasLeftNeighbour = page.words.some(
        (o) => o !== w && Math.abs(o.y0 - w.y0) < 6 && o.x0 < w.x0 - 4 && o.x0 > w.x0 - 25,
      );
      if (hasLeftNeighbour) continue;
      markers.push({ number: n, page: page.page, x: w.x0, y: w.y0, word: w });
    }
  }

  // dedupe identical (number,page,y) markers.
  const seen = new Set<string>();
  return markers.filter((m) => {
    const key = `${m.number}|${m.page}|${Math.round(m.y)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function columnOf(x: number, pageWidth: number): "left" | "right" {
  return x < pageWidth * 0.5 ? "left" : "right";
}

/**
 * Extract all question regions from a pass PDF.
 */
function extractQuestions(pages: PageBox[]): QuestionRegion[] {
  const markers = findMarkers(pages);
  const pageW = new Map<number, number>();
  for (const p of pages) pageW.set(p.page, p.width);

  const regions: QuestionRegion[] = [];

  // Process markers per page and per column.
  for (const page of pages) {
    const w = page.width;
    const pageMarkers = markers.filter((m) => m.page === page.page).sort((a, b) => a.y - b.y || a.x - b.x);
    const leftMarkers = pageMarkers.filter((m) => columnOf(m.x, w) === "left");
    const rightMarkers = pageMarkers.filter((m) => columnOf(m.x, w) === "right");
    // A page is two-column only when question markers actually appear in both
    // halves. Otherwise questions span the full width and we must not drop the
    // right half of a stem.
    const twoCol = leftMarkers.length > 0 && rightMarkers.length > 0;
    const columns: Array<{ col: "left" | "right"; colMarkers: QuestionMarker[] }> = twoCol
      ? [
          { col: "left", colMarkers: leftMarkers },
          { col: "right", colMarkers: rightMarkers },
        ]
      : [{ col: "left", colMarkers: pageMarkers }];

    for (const { col, colMarkers } of columns) {
      colMarkers.sort((a, b) => a.y - b.y);
      for (let i = 0; i < colMarkers.length; i++) {
        const marker = colMarkers[i];
        const next = colMarkers[i + 1];
        const yEnd = next ? next.y : page.height;

        // Collect words in this column between marker.y and yEnd.
        const colWords: WordBox[] = [];
        for (const word of page.words) {
          if (word === marker.word) continue;
          if (twoCol && columnOf(word.x0, w) !== col) continue;
          if (word.y0 < marker.y - 2) continue;
          if (word.y0 >= yEnd) continue;
          colWords.push(word);
        }
        colWords.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);

        regions.push({ marker, page: page.page, column: col, words: colWords, options: [], stemWords: [] });
      }
    }
  }

  // Sort regions into reading order: page, then column-block (left column fully
  // then right column), then y. This matters for passage reconstruction order.
  regions.sort((a, b) => a.page - b.page || (a.column === b.column ? 0 : a.column === "left" ? -1 : 1) || a.marker.y - b.marker.y);

  // Split each region into stem + options.
  for (const r of regions) {
    const { stem, options } = splitStemOptions(r.words);
    r.stemWords = stem;
    r.options = options;
  }

  return regions;
}

/**
 * Split a question region's words into stem + lettered options.
 *
 * Robust against two layout styles seen in the official PDFs:
 *  1. Normal: option letters A–E at the left indent, text after them on the
 *     same line (sometimes wrapping to further lines).
 *  2. Stacked fractions: the option letter is vertically centered next to a
 *     fraction whose digits are above/below it (e.g. "1/3" rendered as "1"
 *     over "3" with "B" to their left).
 *
 * Option letters are identified as single A–E tokens near the region's left
 * indent; their text is whatever sits to their right within their vertical
 * band (down to the next option letter).
 */
function splitStemOptions(regionWords: WordBox[]): { stem: WordBox[]; options: OptionRun[] } {
  const words = [...regionWords].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  if (words.length === 0) return { stem: [], options: [] };

  const minX = Math.min(...words.map((w) => w.x0));
  const letters = words.filter((w) => /^[A-E]$/.test(clean(w.text)) && w.x0 < minX + 55);

  // Cluster letters by x (option indents). Real options form an alphabetically
  // consecutive run (A, B, C, D, E) at one indent; stray single letters in the
  // stem (e.g. people named "A" and "B" in a NOG word problem) don't.
  const byX = new Map<number, WordBox[]>();
  for (const L of letters) {
    let key: number | null = null;
    for (const k of byX.keys()) if (Math.abs(k - L.x0) <= 8) { key = k; break; }
    if (key === null) byX.set(L.x0, [L]);
    else byX.get(key)!.push(L);
  }

  let best: WordBox[] = [];
  for (const cluster of byX.values()) {
    const sorted = [...cluster].sort((a, b) => a.y0 - b.y0);
    let run: WordBox[] = [];
    let bestRun: WordBox[] = [];
    let prevIdx = -1;
    for (const L of sorted) {
      const idx = "ABCDE".indexOf(clean(L.text));
      const gapOk = run.length === 0 || L.y0 - run[run.length - 1].y0 < 70;
      if (run.length === 0 || (idx === prevIdx + 1 && gapOk)) {
        run.push(L);
        prevIdx = idx;
      } else {
        if (run.length > bestRun.length) bestRun = run;
        run = [L];
        prevIdx = idx;
      }
    }
    if (run.length > bestRun.length) bestRun = run;
    if (bestRun.length > best.length) best = bestRun;
  }

  if (best.length < 2) return { stem: words, options: [] };

  const optLetters = best; // sorted by y
  const first = optLetters[0];

  const options: OptionRun[] = [];
  for (let i = 0; i < optLetters.length; i++) {
    const L = optLetters[i];
    const yTop = L.y0 - 14;
    const yBottom = i + 1 < optLetters.length ? optLetters[i + 1].y0 - 8 : L.y0 + 60;
    const text = words.filter(
      (w) => w !== L && !optLetters.includes(w) && w.x0 > L.x0 + 3 && w.y0 >= yTop && w.y0 <= yBottom,
    );
    options.push({ letter: clean(L.text), words: text });
  }

  const stem = words.filter((w) => !optLetters.includes(w) && w.y0 < first.y0 - 12);
  return { stem, options };
}

// ---- option count expectations -------------------------------------------

function expectedOptionCount(kind: Kind): number[] {
  switch (kind) {
    case "ord":
    case "nog":
      return [5]; // A–E
    case "dtk":
      return [4, 5]; // DTK uses A–D or A–E depending on the task
    default:
      return [4]; // A–D (mek, las, xyz, kva)
  }
}

// ---- main per-pass parse -------------------------------------------------

export interface PassSource {
  passNumber: number;
  pdfPath: string;
  sourceUrl: string;
  passKindHint?: PassKind;
}

export function parsePass(
  pass: PassSource,
  facitLetters: string[] | undefined,
  examId: string,
  examDate: string,
  figureDir: string,
): ParsedPass {
  const pages = pdfWordBoxes(pass.pdfPath);
  const fullText = pdfText(pass.pdfPath, { layout: true }).toUpperCase();

  // Detect pass kind from content (authoritative) with filename as fallback.
  const hasKvantHeaders = /\bXYZ\b/.test(fullText) && /\bDTK\b/.test(fullText);
  const hasVerbalHeaders = /\bORD\b/.test(fullText) && /\bMEK\b/.test(fullText);
  let passKind: PassKind;
  if (hasKvantHeaders && !hasVerbalHeaders) passKind = "kvant";
  else if (hasVerbalHeaders && !hasKvantHeaders) passKind = "verbal";
  else passKind = pass.passKindHint ?? "kvant";

  const ranges = passKind === "kvant" ? KVANT_RANGES : VERBAL_RANGES;
  const expectedCount = passKind === "kvant" ? 40 : 30;

  const regions = extractQuestions(pages);
  const passFlags: string[] = [];

  // Map number -> region (first occurrence wins; duplicates unlikely).
  const byNumber = new Map<number, QuestionRegion>();
  for (const r of regions) if (!byNumber.has(r.marker.number)) byNumber.set(r.marker.number, r);

  const imageList = pdfImageList(pass.pdfPath);
  const imagesByPage = new Map<number, ImageInfo[]>();
  for (const im of imageList) {
    if (!imagesByPage.has(im.page)) imagesByPage.set(im.page, []);
    imagesByPage.get(im.page)!.push(im);
  }

  const questions: ParsedQuestion[] = [];
  const seenNumbers = new Set<number>();
  const dtkFigureByPage = new Map<number, string>(); // page -> figure filename
  const stemRenderedPages = new Set<number>(); // pages with a rendered stem figure

  for (const range of ranges) {
    for (let n = range.start; n <= range.end; n++) {
      const region = byNumber.get(n);
      if (!region) {
        passFlags.push(`missing-question-${n}`);
        continue;
      }
      seenNumbers.add(n);
      const kind = range.kind;

      const prompt = renderWords(region.stemWords);
      const options = region.options.map((o) => renderWords(o.words));
      const optionCount = options.length;

      const flags: string[] = [];
      const letter = facitLetters?.[n - 1];

      // Map facit letter -> index.
      let correctIndex = -1;
      if (letter) {
        correctIndex = OPTION_LETTERS.indexOf(letter);
        if (correctIndex < 0 || correctIndex >= optionCount) {
          flags.push("facit-letter-mismatch");
          correctIndex = Math.min(correctIndex < 0 ? 0 : correctIndex, Math.max(0, optionCount - 1));
        }
      } else {
        flags.push("no-facit");
      }

      // Option count sanity.
      const expected = expectedOptionCount(kind);
      if (!expected.includes(optionCount)) flags.push(`option-count-${optionCount}-expected-${expected.join("or")}`);

      // Figure handling.
      let figureFile: string | undefined;

      if (kind === "dtk") {
        // DTK figure lives on the page immediately before the question page.
        const figPage = region.page - 1;
        const hasImages = (imagesByPage.get(figPage)?.length ?? 0) > 0;
        let figName = dtkFigureByPage.get(figPage);
        if (figPage >= 1 && figPage <= pages.length && !figName) {
          figName = `hp-${examDate}-p${pass.passNumber}-fig-${figPage}.png`;
          renderPage(pass.pdfPath, figPage, join(figureDir, figName), 150);
          dtkFigureByPage.set(figPage, figName);
        }
        if (figName) {
          figureFile = figName;
        } else {
          flags.push("missing-figure");
        }
        if (!hasImages && figPage >= 1) {
          // A DTK figure that is a pure text table — note it, not an error.
          flags.push("figure-is-text-table");
        }
      } else if (kind === "xyz" || kind === "kva" || kind === "nog") {
        // XYZ/KVA/NOG: math notation and geometry figures are drawn as VECTOR
        // art in these PDFs (not raster images), so pdftotext silently drops or
        // garbles them ("3 x=6", fractions reordered, etc.). Render the stem
        // region (question number down to the first option, full width) to a
        // PNG so the visual math/figure is preserved. This also captures the
        // few genuine raster geometry figures (e.g. 2013 NOG triangle).
        const pageW = pages[region.page - 1]?.width ?? 595;
        const qTop = Math.min(region.marker.y, ...(region.stemWords.length ? region.stemWords.map((w) => w.y0) : [region.marker.y])) - 6;
        const firstOptionTop = region.options[0]?.words[0]?.y0;
        const stemBottom = region.stemWords.length ? Math.max(...region.stemWords.map((w) => w.y1)) : region.marker.y + 12;
        const qBottom = firstOptionTop ?? stemBottom + 8;
        const figName = `hp-${examDate}-p${pass.passNumber}-q${n}.png`;
        renderRegion(
          pass.pdfPath,
          region.page,
          { x: 6, y: Math.max(0, qTop), w: Math.max(20, pageW - 12), h: Math.max(20, qBottom - qTop + 8) },
          join(figureDir, figName),
          150,
        );
        figureFile = figName;
        stemRenderedPages.add(region.page);
      }

      questions.push({
        id: `hp-${examDate}-p${pass.passNumber}-q${n}`,
        kind,
        questionNumber: n,
        prompt,
        passage: undefined,
        options,
        correctIndex,
        figureFile,
        flags,
      });
    }
  }

  // Attach LÄS passages.
  if (passKind === "verbal") {
    attachPassages(questions, regions, pages);
  }

  // Extra questions / wrong count.
  const extra = [...byNumber.keys()].filter((n) => !seenNumbers.has(n));
  for (const n of extra) passFlags.push(`unexpected-question-${n}`);
  if (questions.length !== expectedCount) {
    passFlags.push(`wrong-question-count (${questions.length}/${expectedCount})`);
  }

  // Raster images on a page that we did not associate with any question.
  for (const [pageNo, imgs] of imagesByPage) {
    if (dtkFigureByPage.has(pageNo)) continue; // DTK figure page
    if (stemRenderedPages.has(pageNo)) continue; // inline figure page (rendered)
    if (imgs.length > 0) passFlags.push(`unattached-images-page-${pageNo} (${imgs.length})`);
  }

  return {
    examId,
    examDate,
    passNumber: pass.passNumber,
    passKind,
    sourceUrl: pass.sourceUrl,
    questions,
    flags: passFlags,
  };
}

// ---- LÄS passage attachment ----------------------------------------------

/**
 * LÄS passages: the verbal section is a stream of [passage][Uppgifter][questions]
 * repeated. The passage for a question group is the flowing text between the
 * previous group's questions and this group's "Uppgifter" header.
 */
function attachPassages(questions: ParsedQuestion[], regions: QuestionRegion[], pages: PageBox[]): void {
  const las = questions.filter((q) => q.kind === "las");
  if (las.length === 0) return;

  // Exclude ALL question-region words (1–40), so ORD/MEK/LÄS stems+options
  // never leak into passage text.
  const qWords = new Set<WordBox>();
  for (const r of regions) {
    qWords.add(r.marker.word);
    for (const w of r.words) qWords.add(w);
    for (const o of r.options) for (const w of o.words) qWords.add(w);
    for (const w of r.stemWords) qWords.add(w);
  }

  // LÄS content span: from the first LÄS question page to the first MEK page.
  const q11 = regions.find((r) => r.marker.number === 11);
  const q21 = regions.find((r) => r.marker.number === 21);
  const minPage = q11 ? q11.page : 1;
  const maxPage = q21 ? q21.page : pages.length;

  // Reading order: page, then column (left before right), then y, then x.
  const all: WordBox[] = [];
  for (const p of pages) {
    if (p.page < minPage || p.page > maxPage) continue;
    const twoCol = p.words.some((w) => w.x0 >= p.width / 2);
    const left = p.words.filter((w) => w.x0 < p.width / 2).sort(byYX);
    const right = p.words.filter((w) => w.x0 >= p.width / 2).sort(byYX);
    if (twoCol) {
      all.push(...left, ...right);
    } else {
      all.push(...left, ...right);
    }
  }

  // Whole section-header lines (e.g. "Svensk läsförståelse – LÄS") must not
  // leak into passage text — skip every word on such a line.
  const headerLineWords = new Set<WordBox>();
  for (const p of pages) {
    for (const l of groupLines(p.words, 5)) {
      if (l.words.some((w) => sectionHeaderKind(w.text))) {
        for (const w of l.words) headerLineWords.add(w);
      }
    }
  }

  const uppgifter: WordBox[] = [];
  for (const w of all) {
    const t = clean(w.text).toUpperCase();
    if (t === "UPPGIFTER") uppgifter.push(w);
  }

  // Candidate passage words (excluded question words, headers, page numbers).
  const candidates: WordBox[] = [];
  for (const w of all) {
    if (qWords.has(w)) continue;
    if (headerLineWords.has(w)) continue;
    const t = clean(w.text);
    if (t.toUpperCase() === "UPPGIFTER") continue;
    if (/^–?\s*\d+\s*–?$/.test(t)) continue; // page number "– 16 –"
    if (/^(Högskoleprovet|Provpass|DELPROV|Anvisningar|Svarshäfte)/i.test(t)) continue;
    candidates.push(w);
  }

  // Split candidates at each "Uppgifter" (in reading order).
  const chunks: WordBox[][] = [];
  let cur: WordBox[] = [];
  let ui = 0;
  for (const w of candidates) {
    while (ui < uppgifter.length && isBefore(uppgifter[ui], w)) {
      chunks.push(cur);
      cur = [];
      ui++;
    }
    cur.push(w);
  }
  chunks.push(cur);

  // Group LÄS questions by their nearest preceding "Uppgifter".
  const groups: Array<{ questions: ParsedQuestion[]; chunkIndex: number }> = [];
  for (const q of las) {
    const region = regions.find((r) => r.marker.number === q.questionNumber);
    if (!region) continue;
    let idx = -1;
    for (let i = 0; i < uppgifter.length; i++) {
      if (isBefore(uppgifter[i], region.marker.word)) idx = i;
      else break;
    }
    let group = groups.find((g) => g.chunkIndex === idx);
    if (!group) {
      group = { questions: [], chunkIndex: idx };
      groups.push(group);
    }
    group.questions.push(q);
  }

  for (const g of groups) {
    const chunk = chunks[g.chunkIndex] ?? [];
    const text = mergeHyphenation(chunk.length ? renderWords(chunk) : "");
    for (const q of g.questions) {
      if (text) q.passage = text;
      else q.flags.push("missing-passage");
    }
  }
}

function byYX(a: WordBox, b: WordBox): number {
  return a.y0 - b.y0 || a.x0 - b.x0;
}

/** Reading-order comparison: a before b? */
function isBefore(a: WordBox, b: WordBox): boolean {
  if (a.page !== b.page) return a.page < b.page;
  if (Math.abs(a.y0 - b.y0) > 6) return a.y0 < b.y0;
  return a.x0 < b.x0;
}

// ---- exam-level orchestration --------------------------------------------

export interface ExamInput {
  examId: string;
  examDate: string; // YYYY-MM-DD
  title: string;
  facitUrl: string;
  passes: Array<{ passNumber: number; url: string; passKindHint?: PassKind }>;
  workDir: string; // where to download PDFs
  outDir: string; // where to write parsed json
  figureDir?: string; // where to write figures (default outDir/figures)
}

export function parseExam(input: ExamInput): ParsedExam {
  const missing = checkTools();
  if (missing.length > 0) {
    throw new Error(`Missing poppler tools: ${missing.join(", ")}. Run: sudo apt install poppler-utils`);
  }

  mkdirSync(input.workDir, { recursive: true });
  mkdirSync(input.outDir, { recursive: true });
  const figureDir = input.figureDir ?? join(input.outDir, "figures");
  mkdirSync(figureDir, { recursive: true });

  // Download facit + passes.
  const facitPath = join(input.workDir, "facit.pdf");
  download(input.facitUrl, facitPath);
  const facit = parseFacit(facitPath);

  const passes: ParsedPass[] = [];
  for (const p of input.passes) {
    const pdfPath = join(input.workDir, `provpass-${p.passNumber}.pdf`);
    download(p.url, pdfPath);
    const facitLetters = facit.get(p.passNumber);
    if (!facitLetters) {
      throw new Error(`facit has no column for pass ${p.passNumber}`);
    }
    passes.push(parsePass(
      { passNumber: p.passNumber, pdfPath, sourceUrl: p.url, passKindHint: p.passKindHint },
      facitLetters,
      input.examId,
      input.examDate,
      figureDir,
    ));
  }

  const exam: ParsedExam = {
    examId: input.examId,
    examDate: input.examDate,
    title: input.title,
    passes,
  };

  // Write JSON.
  const jsonPath = join(input.outDir, `${input.examId}.json`);
  writeFileSync(jsonPath, JSON.stringify(exam, null, 2));

  return exam;
}

export { pdfText, pdfWordBoxes, pdfImageList, pdfPageCount };

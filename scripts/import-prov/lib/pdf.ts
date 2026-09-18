/**
 * PDF helpers for the högskoleprov importer.
 *
 * Thin wrappers around poppler-utils (pdftotext, pdfimages, pdftoppm,
 * pdfinfo) plus a curl downloader. No third-party deps.
 *
 * Requires poppler-utils to be installed:
 *   sudo apt install poppler-utils
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type PdfTool = "pdftotext" | "pdfimages" | "pdftoppm" | "pdfinfo";

/** Check that the poppler tools exist. Returns a list of missing tools. */
export function checkTools(): string[] {
  const missing: string[] = [];
  for (const tool of ["pdftotext", "pdfimages", "pdftoppm", "pdfinfo"] as const) {
    const r = spawnSync("which", [tool], { encoding: "utf8" });
    if (r.status !== 0 || !r.stdout.trim()) missing.push(tool);
  }
  return missing;
}

function sh(cmd: string, args: string[], opts: { cwd?: string; timeoutMs?: number } = {}) {
  const r = execFileSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd,
    timeout: opts.timeoutMs ?? 120_000,
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return r;
}

/** Download a file with curl (follows redirects, retries once). */
export function download(url: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) return; // already downloaded
  const r = spawnSync("curl", ["-sfL", "--retry", "3", "-o", dest, url], {
    encoding: "utf8",
    timeout: 120_000,
  });
  if (r.status !== 0) {
    throw new Error(`curl failed (${r.status}) for ${url}: ${r.stderr ?? ""}`);
  }
}

/** Number of pages in a PDF. */
export function pdfPageCount(pdfPath: string): number {
  const out = sh("pdfinfo", [pdfPath]);
  const m = out.match(/^Pages:\s+(\d+)/m);
  if (!m) throw new Error(`pdfinfo could not find page count in ${pdfPath}`);
  return parseInt(m[1], 10);
}

/** Plain text (optionally with -layout) of a PDF. */
export function pdfText(pdfPath: string, opts: { layout?: boolean; firstPage?: number; lastPage?: number } = {}): string {
  const args: string[] = [];
  if (opts.layout) args.push("-layout");
  if (opts.firstPage) args.push("-f", String(opts.firstPage));
  if (opts.lastPage) args.push("-l", String(opts.lastPage));
  args.push(pdfPath, "-");
  return sh("pdftotext", args);
}

export interface WordBox {
  page: number;
  x0: number;
  y0: number; // top-left origin, y increases downward (PDF point units)
  x1: number;
  y1: number;
  text: string;
}

export interface PageBox {
  page: number;
  width: number;
  height: number;
  words: WordBox[];
}

const ENTITY: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITY[m] ?? m);
}

/**
 * Word boxes via `pdftotext -bbox -`. Returns one PageBox per page, each with
 * the page's point dimensions and every word's bounding box.
 */
export function pdfWordBoxes(pdfPath: string): PageBox[] {
  const out = sh("pdftotext", ["-bbox", pdfPath, "-"]);
  const pages: PageBox[] = [];

  // <page width="612.283000" height="858.898000"> ... <word xMin=... yMin=... xMax=... yMax=...>text</word>
  const pageRe = /<page\s+width="([\d.]+)"\s+height="([\d.]+)">/g;
  const wordRe = /<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)">([^<]*)<\/word>/g;

  let m: RegExpExecArray | null;
  const pageStarts: number[] = [];
  pageRe.lastIndex = 0;
  while ((m = pageRe.exec(out)) !== null) pageStarts.push(m.index);

  // Split the doc into per-page chunks by <page ...> open tags.
  const chunks: string[] = [];
  for (let i = 0; i < pageStarts.length; i++) {
    const start = pageStarts[i];
    const end = i + 1 < pageStarts.length ? pageStarts[i + 1] : out.length;
    chunks.push(out.slice(start, end));
  }

  chunks.forEach((chunk, idx) => {
    const pm = /<page\s+width="([\d.]+)"\s+height="([\d.]+)">/.exec(chunk);
    if (!pm) return;
    const page: PageBox = {
      page: idx + 1,
      width: parseFloat(pm[1]),
      height: parseFloat(pm[2]),
      words: [],
    };
    let wm: RegExpExecArray | null;
    wordRe.lastIndex = 0;
    while ((wm = wordRe.exec(chunk)) !== null) {
      page.words.push({
        page: idx + 1,
        x0: parseFloat(wm[1]),
        y0: parseFloat(wm[2]),
        x1: parseFloat(wm[3]),
        y1: parseFloat(wm[4]),
        text: decodeEntities(wm[5]),
      });
    }
    pages.push(page);
  });

  if (pages.length === 0) throw new Error(`pdftotext -bbox produced no pages for ${pdfPath}`);
  return pages;
}

export interface ImageInfo {
  page: number;
  num: number;
  type: string;
  width: number;
  height: number;
  color: string;
  comp: number;
  bpc: number;
  enc: string;
  objectId: number;
  xPpi: number;
  yPpi: number;
  size: string;
}

/** Image inventory via `pdfimages -list`. NOTE: no positions, just dims per page. */
export function pdfImageList(pdfPath: string): ImageInfo[] {
  const out = sh("pdfimages", ["-list", pdfPath]);
  const rows: ImageInfo[] = [];
  for (const line of out.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 15 || parts[2] !== "image") continue;
    // page num type width height color comp bpc enc interp objectID x-ppi y-ppi size ratio
    rows.push({
      page: parseInt(parts[0], 10),
      num: parseInt(parts[1], 10),
      type: parts[2],
      width: parseInt(parts[3], 10),
      height: parseInt(parts[4], 10),
      color: parts[5],
      comp: parseInt(parts[6], 10),
      bpc: parseInt(parts[7], 10),
      enc: parts[8],
      objectId: parseInt(parts[10], 10),
      xPpi: parseInt(parts[11], 10),
      yPpi: parseInt(parts[12], 10),
      size: parts[13],
    });
  }
  return rows;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Render a region of a page to PNG via pdftoppm. bbox is in PDF points
 * (top-left origin); we convert to device pixels at `dpi`.
 */
export function renderRegion(
  pdfPath: string,
  page: number,
  bbox: Rect,
  outPath: string,
  dpi = 150,
): string {
  mkdirSync(dirname(outPath), { recursive: true });
  const k = dpi / 72;
  const x = Math.max(0, Math.round(bbox.x * k));
  const y = Math.max(0, Math.round(bbox.y * k));
  const w = Math.max(1, Math.round(bbox.w * k));
  const h = Math.max(1, Math.round(bbox.h * k));
  sh("pdftoppm", [
    "-png",
    "-singlefile",
    "-r", String(dpi),
    "-f", String(page),
    "-l", String(page),
    "-x", String(x),
    "-y", String(y),
    "-W", String(w),
    "-H", String(h),
    pdfPath,
    outPath.replace(/\.png$/i, ""),
  ]);
  return outPath;
}

/** Render a full page to PNG. */
export function renderPage(pdfPath: string, page: number, outPath: string, dpi = 150): string {
  mkdirSync(dirname(outPath), { recursive: true });
  sh("pdftoppm", [
    "-png",
    "-singlefile",
    "-r", String(dpi),
    "-f", String(page),
    "-l", String(page),
    pdfPath,
    outPath.replace(/\.png$/i, ""),
  ]);
  return outPath;
}

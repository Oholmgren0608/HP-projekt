/**
 * Bildförklaringar till UHR-frågornas facit (Oscar, 2026-11-20): frågans egen bild ur
 * provhäftet visas igen efter svaret, med markeringar som förklarar svaret – rätt stapel
 * eller rad i DTK, hjälplinjer och uträknade mått i geometrin – och en kort bildtext.
 *
 * Markeringarna ligger som data i `public/uhr/forklaring/<examId>-p<N>.json` (en fil per
 * provpass, hämtas först när en förklaring visas) med koordinater i bildens pixlar.
 * `uhr-marks-passes.json` listar provpassen som har en fil, så att appen bara hämtar filer
 * som finns; `scripts/uhr/forklaring.ts kontroll` skriver om listan från mappen.
 * Samma funktion ritar markeringarna i appen och i kontrollverktyget
 * (`scripts/uhr/forklaring.ts`), så förhandsbilden är det användaren ser.
 */

import passesWithMarks from "./uhr-marks-passes.json";

export type UhrMarkShape =
  | { type: "box"; x: number; y: number; w: number; h: number }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; dashed?: boolean }
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { type: "polygon"; points: [number, number][] }
  | { type: "label"; x: number; y: number; text: string; anchor?: "start" | "middle" | "end" };

export type UhrMarks = {
  /** Bildens sökväg, samma som frågans figure_url. */
  image: string;
  width: number;
  height: number;
  /** Kort svensk bildtext: vad markeringarna visar. */
  caption: string;
  /**
   * Storleken på text, linjer och pilar (standard 1). Sätts så att etiketterna blir ungefär
   * lika höga som bildens egna tal, t.ex. 0,5 på en hel DTK-sida med små diagram.
   */
  scale?: number;
  shapes: UhrMarkShape[];
};

export type UhrMarksFile = {
  examId: string;
  passNumber: number;
  marks: Record<string, UhrMarks>;
};

/** Markeringsfärgen: Skymningsblå. Bilderna har alltid vit bakgrund, så färgen byter inte i mörkt läge. */
export const MARK_COLOR = "#2b4c7e";
export const CAPTION_MAX = 160;
export const LABEL_MAX = 24;

const PASS_RE = /^(hp-\d{4}-\d{2}-\d{2})-p(\d)-q\d{1,2}$/;

/** Provpassen som har en fil i `public/uhr/forklaring/`, t.ex. "hp-2019-10-20-p1". */
const PASSES_WITH_MARKS: ReadonlySet<string> = new Set(passesWithMarks);

/**
 * Filen med markeringarna för en UHR-fråga, t.ex. "/uhr/forklaring/hp-2019-10-20-p1.json",
 * eller null om frågans provpass inte har någon fil. Då hämtas ingenting, så pass utan
 * bildförklaringar ger inga 404-fel.
 */
export function marksFileUrl(questionId: string): string | null {
  const m = PASS_RE.exec(questionId);
  if (!m) return null;
  const pass = `${m[1]}-p${m[2]}`;
  return PASSES_WITH_MARKS.has(pass) ? `/uhr/forklaring/${pass}.json` : null;
}

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Fel i en frågas markeringar (tom lista = giltig). Bildens mått kontrolleras mot `width`/`height`. */
export function validateMarks(id: string, m: unknown): string[] {
  const errors: string[] = [];
  const fail = (msg: string) => errors.push(`${id}: ${msg}`);
  if (!m || typeof m !== "object") return [`${id}: saknar markeringar`];
  const e = m as Partial<UhrMarks>;
  if (typeof e.image !== "string" || !e.image.startsWith("/uhr/")) fail("image ska vara en /uhr/-sökväg");
  if (!num(e.width) || !num(e.height) || e.width <= 0 || e.height <= 0) fail("width/height saknas");
  if (typeof e.caption !== "string" || e.caption.trim().length < 10) fail("caption saknas eller är för kort");
  else if (e.caption.length > CAPTION_MAX) fail(`caption är längre än ${CAPTION_MAX} tecken`);
  if (e.scale !== undefined && (!num(e.scale) || e.scale < 0.3 || e.scale > 3)) fail("scale ska vara mellan 0,3 och 3");
  if (!Array.isArray(e.shapes) || e.shapes.length === 0) {
    fail("shapes saknas");
    return errors;
  }
  const W = num(e.width) ? e.width : 0;
  const H = num(e.height) ? e.height : 0;
  const inside = (x: unknown, y: unknown) => num(x) && num(y) && x >= 0 && y >= 0 && x <= W && y <= H;
  e.shapes.forEach((s, i) => {
    const where = `shape ${i} (${(s as { type?: string })?.type ?? "?"})`;
    if (!s || typeof s !== "object") return fail(`${where} är inte ett objekt`);
    switch (s.type) {
      case "box":
        if (!inside(s.x, s.y) || !num(s.w) || !num(s.h) || s.w <= 0 || s.h <= 0 || !inside(s.x + s.w, s.y + s.h))
          fail(`${where} ligger utanför bilden eller saknar mått`);
        break;
      case "ellipse":
        if (!inside(s.cx, s.cy) || !num(s.rx) || !num(s.ry) || s.rx <= 0 || s.ry <= 0) fail(`${where} är ogiltig`);
        break;
      case "line":
      case "arrow":
        if (!inside(s.x1, s.y1) || !inside(s.x2, s.y2)) fail(`${where} ligger utanför bilden`);
        break;
      case "polygon":
        if (!Array.isArray(s.points) || s.points.length < 3 || !s.points.every((p) => Array.isArray(p) && inside(p[0], p[1])))
          fail(`${where} behöver minst tre punkter i bilden`);
        break;
      case "label":
        if (!inside(s.x, s.y)) fail(`${where} ligger utanför bilden`);
        if (typeof s.text !== "string" || s.text.trim() === "") fail(`${where} saknar text`);
        else if (s.text.length > LABEL_MAX) fail(`${where} har längre text än ${LABEL_MAX} tecken`);
        break;
      default:
        fail(`${where} har okänd typ`);
    }
  });
  return errors;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const r = (n: number) => Math.round(n * 10) / 10;

/**
 * Markeringarna som SVG-element i bildens koordinater (utan yttre <svg>). Linjebredd och
 * textstorlek följer bildens bredd, så markeringarna ser lika stora ut på alla bilder.
 */
export function marksToSvg(m: UhrMarks, color = MARK_COLOR): string {
  // En bild som visas 560 px bred får 18 px text och 2,5 px linjer; större bilder skalas ner i
  // appen, så deras markeringar ritas större i bildens pixlar.
  const unit = (Math.max(m.width, 560) / 560) * (m.scale ?? 1);
  const sw = r(2.5 * unit);
  const font = r(18 * unit);
  const fill = `fill="${color}" fill-opacity="0.14"`;
  const stroke = `stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  const parts = m.shapes.map((s) => {
    switch (s.type) {
      case "box":
        return `<rect x="${r(s.x)}" y="${r(s.y)}" width="${r(s.w)}" height="${r(s.h)}" rx="${r(2 * unit)}" ${fill} ${stroke}/>`;
      case "ellipse":
        return `<ellipse cx="${r(s.cx)}" cy="${r(s.cy)}" rx="${r(s.rx)}" ry="${r(s.ry)}" fill="none" ${stroke}/>`;
      case "line":
        return `<line x1="${r(s.x1)}" y1="${r(s.y1)}" x2="${r(s.x2)}" y2="${r(s.y2)}" ${stroke}${
          s.dashed ? ` stroke-dasharray="${r(6 * unit)} ${r(5 * unit)}"` : ""
        }/>`;
      case "arrow": {
        const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
        const len = 11 * unit;
        const p = (da: number) => `${r(s.x2 - len * Math.cos(a + da))},${r(s.y2 - len * Math.sin(a + da))}`;
        return (
          `<line x1="${r(s.x1)}" y1="${r(s.y1)}" x2="${r(s.x2)}" y2="${r(s.y2)}" ${stroke}/>` +
          `<polygon points="${r(s.x2)},${r(s.y2)} ${p(0.45)} ${p(-0.45)}" fill="${color}"/>`
        );
      }
      case "polygon":
        return `<polygon points="${s.points.map(([x, y]) => `${r(x)},${r(y)}`).join(" ")}" ${fill} ${stroke}/>`;
      case "label":
        return `<text x="${r(s.x)}" y="${r(s.y)}" text-anchor="${s.anchor ?? "middle"}" dominant-baseline="middle" font-family="IBM Plex Sans, Arial, sans-serif" font-size="${font}" font-weight="600" fill="${color}" stroke="#ffffff" stroke-width="${r(
          3.5 * unit,
        )}" paint-order="stroke" stroke-linejoin="round">${escapeXml(s.text)}</text>`;
    }
  });
  return parts.join("");
}

const cache = new Map<string, Promise<UhrMarksFile | null>>();

/**
 * Markeringarna för en UHR-fråga, eller null om frågan saknar dem. Filen hämtas en gång per
 * provpass, och bara för provpass som har en fil (`marksFileUrl`).
 */
export async function loadUhrMarks(questionId: string): Promise<UhrMarks | null> {
  const url = marksFileUrl(questionId);
  if (!url) return null;
  let file = cache.get(url);
  if (!file) {
    file = fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<UhrMarksFile>) : null))
      .catch(() => null);
    cache.set(url, file);
  }
  const data = await file;
  const marks = data?.marks?.[questionId];
  return marks && validateMarks(questionId, marks).length === 0 ? marks : null;
}

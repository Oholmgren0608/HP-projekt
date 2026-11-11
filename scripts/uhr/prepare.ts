/**
 * Förbereder avskriften av UHR:s kvantitativa provpass.
 *
 *   npx tsx scripts/uhr/prepare.ts                 # alla kvantitativa provpass i manifestet
 *   npx tsx scripts/uhr/prepare.ts hp-2019-10-20   # bara vissa prov
 *
 * Kräver poppler-utils (pdftotext, pdftoppm). Laddar ner PDF:erna vid behov
 * (scripts/import-prov/downloads/, ej i git), skriver UHR:s facit till
 * content/uhr/facit.json och för varje provpass sidbilder och underlag till
 * content/uhr/.arbete/<examId>-p<N>/ (ej i git):
 *   sida-NN.png    – sidan i 110 dpi (renderas bara om den saknas)
 *   underlag.json  – vilka uppgifter som står på vilken sida, liggande sidor,
 *                    DTK-uppgifternas figursidor, delprov per uppgift och
 *                    importens tolkade text som stöd (ofta trasig)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findMarkers, parseFacit, type ParsedExam } from "../import-prov/lib/parse";
import { download, pdfWordBoxes, renderPage } from "../import-prov/lib/pdf";
import {
  FACIT_PATH,
  IMPORT_DIR,
  WORK_DIR,
  kindOfNumber,
  kvantPasses,
  passKey,
  pdfPath,
  readFacit,
  readManifest,
} from "./lib";

const PAGE_DPI = 110;
const LABELS = ["XYZ", "KVA", "NOG", "DTK"];

function main() {
  const wanted = process.argv.slice(2);
  const exams = readManifest().filter((e) => wanted.length === 0 || wanted.includes(e.examId));
  const unknown = wanted.filter((id) => !exams.some((e) => e.examId === id));
  if (unknown.length > 0) throw new Error(`Okänt prov: ${unknown.join(", ")}`);

  const facit = readFacit();
  for (const exam of exams) {
    const dir = join(IMPORT_DIR, "downloads", exam.examId);
    const facitPdf = join(dir, "facit.pdf");
    download(exam.facitUrl, facitPdf);
    const letters = parseFacit(facitPdf);
    facit[exam.examId] = {};

    const parsedFile = join(IMPORT_DIR, "parsed", `${exam.examId}.json`);
    const parsed = existsSync(parsedFile) ? (JSON.parse(readFileSync(parsedFile, "utf8")) as ParsedExam) : null;

    for (const pass of kvantPasses(exam)) {
      const pdf = pdfPath(exam.examId, pass.passNumber);
      download(pass.url, pdf);
      const passLetters = letters.get(pass.passNumber);
      if (!passLetters) throw new Error(`${exam.examId}: facit saknar provpass ${pass.passNumber}`);
      facit[exam.examId][String(pass.passNumber)] = passLetters;

      const key = passKey(exam.examId, pass.passNumber);
      const out = join(WORK_DIR, key);
      mkdirSync(out, { recursive: true });

      const pages = pdfWordBoxes(pdf);
      const markers = findMarkers(pages).filter((m) => m.number >= 1 && m.number <= 40);
      const pageInfo = pages.map((p) => {
        const label = p.words.find((w) => w.y1 < p.height * 0.12 && LABELS.includes(w.text))?.text ?? null;
        const numbers = [...new Set(markers.filter((m) => m.page === p.page).map((m) => m.number))].sort((a, b) => a - b);
        const image = `sida-${String(p.page).padStart(2, "0")}.png`;
        if (!existsSync(join(out, image))) renderPage(pdf, p.page, join(out, image), PAGE_DPI);
        // Liggande sida: det mesta av texten går lodrätt (ordets ruta är högre än bred).
        const longWords = p.words.filter((w) => w.text.length >= 4);
        const vertical = longWords.filter((w) => w.y1 - w.y0 > w.x1 - w.x0).length;
        const landscape = longWords.length >= 10 && vertical / longWords.length > 0.5;
        return { page: p.page, label, questions: numbers, image, ...(landscape ? { landscape: true } : {}) };
      });
      /**
       * DTK: underlaget står på sidorna närmast före uppgiftssidan som saknar
       * uppgifter (efter NOG-sidorna; sidhuvudet "DTK" går inte alltid att läsa).
       */
      const lastNogPage = Math.max(0, ...pageInfo.filter((p) => p.questions.some((n) => n >= 23 && n <= 28)).map((p) => p.page));
      const figurePagesFor = (page: number): number[] => {
        const result: number[] = [];
        for (let i = pageInfo.findIndex((p) => p.page === page) - 1; i >= 0; i--) {
          const p = pageInfo[i];
          if (p.questions.length > 0 || p.page <= lastNogPage) break;
          result.unshift(p.page);
        }
        return result;
      };

      const parsedPass = parsed?.passes.find((pp) => pp.passNumber === pass.passNumber);
      const questions = Array.from({ length: 40 }, (_, i) => {
        const number = i + 1;
        const hint = parsedPass?.questions.find((q) => q.questionNumber === number);
        const qPages = pageInfo.filter((p) => p.questions.includes(number)).map((p) => p.page);
        const kind = kindOfNumber(number);
        return {
          number,
          kind,
          pages: qPages,
          ...(kind === "dtk" && qPages.length > 0 ? { figurePages: figurePagesFor(qPages[0]) } : {}),
          importText: hint
            ? { prompt: hint.prompt, passage: hint.passage ?? null, options: hint.options }
            : null,
        };
      });
      const missing = questions.filter((q) => q.pages.length === 0).map((q) => q.number);

      writeFileSync(
        join(out, "underlag.json"),
        JSON.stringify(
          {
            examId: exam.examId,
            title: exam.title,
            passNumber: pass.passNumber,
            pdf,
            pageDpi: PAGE_DPI,
            pages: pageInfo,
            questions,
          },
          null,
          2,
        ),
      );
      console.log(
        `${key}: ${pageInfo.length} sidor` +
          (missing.length > 0 ? `, hittade inte uppgift ${missing.join(", ")} (leta i sidbilderna)` : ""),
      );
    }
  }

  writeFileSync(FACIT_PATH, `${JSON.stringify(sortKeys(facit), null, 1)}\n`);
  console.log(`Facit: ${FACIT_PATH}`);
}

function sortKeys<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))) as T;
}

main();

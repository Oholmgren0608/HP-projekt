"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  OFFICIAL_EXAMS,
  OFFICIAL_INDEX_URL,
  type OfficialDocument,
  type OfficialExam,
} from "@/lib/official-exams";

/** Så många provtillfällen visas innan "Visa alla". */
const INITIAL_COUNT = 4;

const BOOKLET_KINDS = new Set<OfficialDocument["kind"]>(["verbal", "kvantitativ", "provpass"]);

/** Ordning i gruppen "Facit och normering". */
const EXTRA_ORDER: Record<string, number> = { facit: 0, normering: 1, kallor: 2, ovrigt: 3 };

/** Titlarna i datan använder " · " som avgränsare; i listan räcker ett kommatecken. */
function plain(text: string): string {
  return text.replace(/\s·\s/g, ", ");
}

function docLabel(doc: OfficialDocument): string {
  if (doc.kind === "ovrigt" && !doc.title.includes(" ")) {
    const words = doc.title.replace(/-/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  // "Provpass 1 · Kvantitativ" → "Provpass 1, kvantitativ"
  return plain(doc.title).replace(/, ([A-ZÅÄÖ])/g, (_, c: string) => `, ${c.toLowerCase()}`);
}

function passNumber(doc: OfficialDocument): number {
  const m = doc.title.match(/provpass\s*(\d+)/i);
  return m ? Number(m[1]) : 99;
}

function splitDocuments(exam: OfficialExam) {
  const booklets = exam.documents
    .filter((d) => BOOKLET_KINDS.has(d.kind))
    .sort((a, b) => passNumber(a) - passNumber(b));
  const extras = exam.documents
    .filter((d) => !BOOKLET_KINDS.has(d.kind))
    .sort((a, b) => (EXTRA_ORDER[a.kind] ?? 9) - (EXTRA_ORDER[b.kind] ?? 9));
  return { booklets, extras };
}

function summary(exam: OfficialExam): string {
  const { booklets, extras } = splitDocuments(exam);
  const parts = [booklets.length === 1 ? "1 provhäfte" : `${booklets.length} provhäften`];
  if (extras.some((d) => d.kind === "facit")) parts.push("facit");
  if (extras.some((d) => d.kind === "normering")) parts.push("normering");
  return parts.join(", ");
}

function DocumentLinks({ title, docs }: { title: string; docs: OfficialDocument[] }) {
  if (docs.length === 0) return null;
  return (
    <div>
      <h4 className="text-[13px] text-[var(--ink-muted)]">{title}</h4>
      <ul className="mt-1.5 space-y-0.5">
        {docs.map((doc) => (
          <li key={doc.url}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-md py-1 text-sm font-medium text-[var(--brand)] underline-offset-4 hover:underline"
            >
              {docLabel(doc)}
              <ArrowUpRight
                className="size-3.5 text-[var(--ink-muted)] group-hover:text-[var(--brand)]"
                aria-hidden
              />
              <span className="sr-only">(PDF, öppnas i ny flik)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OfficialExamsBrowser() {
  const [showAll, setShowAll] = useState(false);
  const exams = showAll ? OFFICIAL_EXAMS : OFFICIAL_EXAMS.slice(0, INITIAL_COUNT);
  const hidden = OFFICIAL_EXAMS.length - INITIAL_COUNT;

  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--ink)]">Gamla provhäften från UHR</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
        De officiella PDF:erna från studera.nu, med facit och normering. De öppnas i en ny flik.
        ELF-texterna saknas ofta eftersom UHR bara visar dem en kort tid. Fler år finns i{" "}
        <a
          href={OFFICIAL_INDEX_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
        >
          UHR:s arkiv
        </a>
        .
      </p>

      <ul className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-[10px] border border-[var(--line)] bg-card">
        {exams.map((exam, i) => {
          const { booklets, extras } = splitDocuments(exam);
          return (
            <li key={exam.id}>
              <details className="group" open={i === 0}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--mist)]/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)] sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--ink)]">{plain(exam.title)}</span>
                    <span className="block text-[13px] text-[var(--ink-muted)]">{summary(exam)}</span>
                  </span>
                  <ChevronDown
                    className="size-4 shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2 sm:px-5">
                  <DocumentLinks title="Provhäften" docs={booklets} />
                  <DocumentLinks title="Facit och normering" docs={extras} />
                  <a
                    href={exam.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline sm:col-span-2"
                  >
                    Provets sida hos UHR
                  </a>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-3 inline-flex min-h-10 items-center rounded-md border border-[var(--line-strong)] bg-card px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
        >
          {showAll ? "Visa färre" : `Visa alla ${OFFICIAL_EXAMS.length} provtillfällen`}
        </button>
      ) : null}
    </section>
  );
}

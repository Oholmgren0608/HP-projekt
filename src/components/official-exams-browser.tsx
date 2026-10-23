"use client";

import { useMemo, useState } from "react";
import { Disclosure } from "@/components/disclosure";
import { TimedMockExam } from "@/components/timed-mock-exam";
import { ProvpassSession } from "@/components/provpass-session";
import {
  OFFICIAL_EXAMS,
  OFFICIAL_INDEX_URL,
  type OfficialDocument,
  type OfficialExam,
} from "@/lib/official-exams";

function kindLabel(kind: OfficialDocument["kind"]): string {
  switch (kind) {
    case "verbal":
      return "Verbal";
    case "kvantitativ":
      return "Kvant";
    case "facit":
      return "Facit";
    case "kallor":
      return "Källor";
    case "normering":
      return "Normering";
    default:
      return "PDF";
  }
}

export function OfficialExamsBrowser() {
  const years = useMemo(
    () => [...new Set(OFFICIAL_EXAMS.map((e) => e.year))].sort((a, b) => b - a),
    [],
  );
  const [year, setYear] = useState<number | "alla">(years[0] ?? "alla");
  const [activeExamId, setActiveExamId] = useState(OFFICIAL_EXAMS[0]?.id ?? "");
  const [activeDocUrl, setActiveDocUrl] = useState(
    OFFICIAL_EXAMS[0]?.documents.find((d) => d.kind === "verbal" || d.kind === "kvantitativ")
      ?.url ??
      OFFICIAL_EXAMS[0]?.documents[0]?.url ??
      "",
  );
  // null = ingen extern PDF har begärts ännu (klick-för-att-ladda).
  const [loadedDocUrl, setLoadedDocUrl] = useState<string | null>(null);

  const pdfExams = useMemo(
    () => OFFICIAL_EXAMS.filter((e) => year === "alla" || e.year === year),
    [year],
  );

  /** Proven grupperade per år — varje år blir en vikbar sektion. */
  const yearGroups = useMemo(() => {
    const groups = new Map<number, OfficialExam[]>();
    for (const exam of pdfExams) {
      const list = groups.get(exam.year);
      if (list) list.push(exam);
      else groups.set(exam.year, [exam]);
    }
    return [...groups.entries()].map(([groupYear, exams]) => ({
      year: groupYear,
      exams,
      pdfCount: exams.reduce((sum, exam) => sum + exam.documents.length, 0),
    }));
  }, [pdfExams]);

  const activePdfExam: OfficialExam | undefined =
    pdfExams.find((e) => e.id === activeExamId) ?? pdfExams[0];

  const activeDoc =
    activePdfExam?.documents.find((d) => d.url === activeDocUrl) ??
    activePdfExam?.documents[0];

  function selectPdfExam(exam: OfficialExam) {
    setActiveExamId(exam.id);
    const preferred =
      exam.documents.find((d) => d.kind === "verbal") ??
      exam.documents.find((d) => d.kind === "kvantitativ") ??
      exam.documents[0];
    setActiveDocUrl(preferred?.url ?? "");
    setLoadedDocUrl(null);
  }

  return (
    <div className="space-y-5">
      <ProvpassSession />

      <TimedMockExam />

      {/* Sekundär: original-PDF:er */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Original-PDF:er
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Officiella provhäften och facit
        </h2>
        <div className="mt-3 rounded-lg border border-[var(--line)] bg-card/60 px-4 py-3 text-sm text-[var(--ink-muted)]">
          PDF från studera.nu — vi omhostar inte filerna. ELF saknas ofta (UHR visar texterna kort tid). För fler år:{" "}
          <a
            href={OFFICIAL_INDEX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
          >
            UHR:s arkiv
          </a>
          .
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setYear("alla")}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              year === "alla"
                ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                : "border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
            }`}
          >
            Alla
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                year === y
                  ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {yearGroups.map((group) => {
            const isActivePdfGroup = group.exams.some(
              (exam) => exam.id === activePdfExam?.id,
            );
            const examLabel =
              group.exams.length === 1
                ? "1 provtillfälle"
                : `${group.exams.length} provtillfällen`;
            return (
              <Disclosure
                key={group.year}
                title={group.year}
                subtitle={`${examLabel} · ${group.pdfCount} PDF:er`}
                hint={
                  isActivePdfGroup && activePdfExam ? (
                    <span className="max-w-[13rem] truncate rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                      {activePdfExam.title}
                    </span>
                  ) : undefined
                }
              >
                <div className="grid gap-5 lg:gap-6 lg:grid-cols-[16rem_1fr]">
                  <div className="space-y-2.5">
                    {group.exams.map((exam) => {
                      const selected = exam.id === activePdfExam?.id;
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => selectPdfExam(exam)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                            selected
                              ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                              : "border-[var(--line-strong)] bg-card/70 hover:border-[var(--ink-soft)]"
                          }`}
                        >
                          <div className="font-medium text-[var(--ink)]">{exam.title}</div>
                          <div className="mt-1 text-xs text-[var(--ink-muted)]">
                            {exam.documents.length} PDF:er
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="min-w-0 space-y-3">
                    {isActivePdfGroup && activePdfExam ? (
                      <>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                              {activePdfExam.title}
                            </h3>
                            <p className="text-sm text-[var(--ink-muted)]">
                              Välj häfte nedan — öppnas i läsaren på den här sidan.
                            </p>
                          </div>
                          <a
                            href={activePdfExam.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--brand)] underline-offset-4 hover:underline"
                          >
                            UHR-sida →
                          </a>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {activePdfExam.documents.map((doc) => {
                            const selected = doc.url === activeDoc?.url;
                            return (
                              <button
                                key={doc.url}
                                type="button"
                                onClick={() => { setActiveDocUrl(doc.url); setLoadedDocUrl(null); }}
                                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                                  selected
                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                                    : "border-[var(--line-strong)] bg-card text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
                                }`}
                              >
                                <span className="mr-1.5 text-[10px] uppercase tracking-wide opacity-70">
                                  {kindLabel(doc.kind)}
                                </span>
                                {doc.title}
                              </button>
                            );
                          })}
                        </div>

                        {activeDoc ? (
                          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-card shadow-[0_16px_40px_-28px_rgba(18,42,48,0.45)]">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-2">
                              <p className="text-sm font-medium text-[var(--ink)]">{activeDoc.title}</p>
                              <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--brand)] underline-offset-4 hover:underline"
                              >
                                Öppna PDF i ny flik →
                              </a>
                            </div>
                            {loadedDocUrl === activeDoc.url ? (
                              <iframe
                                title={activeDoc.title}
                                src={`${activeDoc.url}#view=FitH`}
                                className="h-[min(80vh,920px)] w-full bg-[#525659]"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-3 bg-[var(--paper)] px-6 py-16 text-center">
                                <p className="text-sm text-[var(--ink-muted)]">
                                  PDF:en laddas inte automatiskt — studera.nu kan blockera inbäddning.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setLoadedDocUrl(activeDoc.url)}
                                  className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                                >
                                  Visa PDF i läsaren
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--ink-muted)]">
                            Inga PDF:er hittades för detta prov.
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </Disclosure>
            );
          })}
        </div>
      </section>
    </div>
  );
}

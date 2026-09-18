"use client";

import { useMemo, useState } from "react";
import { TimedMockExam } from "@/components/timed-mock-exam";
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

  const exams = useMemo(
    () => OFFICIAL_EXAMS.filter((e) => year === "alla" || e.year === year),
    [year],
  );

  const activeExam: OfficialExam | undefined =
    exams.find((e) => e.id === activeExamId) ?? exams[0];

  const activeDoc =
    activeExam?.documents.find((d) => d.url === activeDocUrl) ??
    activeExam?.documents[0];

  function selectExam(exam: OfficialExam) {
    setActiveExamId(exam.id);
    const preferred =
      exam.documents.find((d) => d.kind === "verbal") ??
      exam.documents.find((d) => d.kind === "kvantitativ") ??
      exam.documents[0];
    setActiveDocUrl(preferred?.url ?? "");
  }

  return (
    <div className="space-y-5">
      <TimedMockExam />

      <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink-muted)]">
        Officiella provhäften och facit från UHR visas här direkt (PDF från studera.nu). Vi
        omhostar inte filerna — ELF saknas ofta eftersom UHR bara får visa de texterna en kort
        tid. För fler år:{" "}
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setYear("alla")}
          className={`rounded-md border px-3 py-1.5 text-sm transition ${
            year === "alla"
              ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
              : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
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
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-2">
          {exams.map((exam) => {
            const selected = exam.id === activeExam?.id;
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => selectExam(exam)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  selected
                    ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-white/70 hover:border-[var(--ink-soft)]"
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
          {activeExam ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {activeExam.title}
                  </h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    Välj häfte nedan — öppnas i läsaren på den här sidan.
                  </p>
                </div>
                <a
                  href={activeExam.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--brand)] underline-offset-4 hover:underline"
                >
                  UHR-sida →
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeExam.documents.map((doc) => {
                  const selected = doc.url === activeDoc?.url;
                  return (
                    <button
                      key={doc.url}
                      type="button"
                      onClick={() => setActiveDocUrl(doc.url)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                          : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
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
                <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_16px_40px_-28px_rgba(18,42,48,0.45)]">
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
                  <iframe
                    title={activeDoc.title}
                    src={`${activeDoc.url}#view=FitH`}
                    className="h-[min(80vh,920px)] w-full bg-[#525659]"
                  />
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-muted)]">Inga PDF:er hittades för detta prov.</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

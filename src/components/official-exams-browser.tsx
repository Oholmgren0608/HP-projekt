"use client";

import { useMemo, useState } from "react";
import { Disclosure } from "@/components/disclosure";
import { TimedMockExam } from "@/components/timed-mock-exam";
import { ExamMockExam } from "@/components/exam-mock-exam";
import { FreePracticeSession } from "@/components/free-practice-session";
import { getQuestions } from "@/lib/content/questions-provider";
import { useQuestions } from "@/lib/content/use-questions";
import { useExams } from "@/lib/content/use-exams";
import { kindBadge, type PracticeKind } from "@/lib/practice";
import type { ExamRecord } from "@/lib/practice-types";
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

type ExamKind = Exclude<PracticeKind, "reflect">;

/** Ordning för sektionslänkar (verbal först, sedan kvantitativ). */
const SECTION_ORDER: ExamKind[] = [
  "ord",
  "las",
  "mek",
  "elf",
  "xyz",
  "kva",
  "nog",
  "dtk",
];

type ExamQuestionInfo = {
  count: number;
  kinds: ExamKind[];
  byKind: Record<string, number>;
};

type ExamMode = { exam: ExamRecord };
type PracticeMode = { exam: ExamRecord; subtest: ExamKind; count: number };

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

  const { exams: dbExams, ready: examsReady } = useExams();
  const { ready: questionsReady } = useQuestions();

  const [examMode, setExamMode] = useState<ExamMode | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);

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

  const visibleDbExams = useMemo(() => {
    if (!examsReady) return [] as ExamRecord[];
    return dbExams.filter((e) => e.status !== "rejected");
  }, [dbExams, examsReady]);

  /** Frågetillgänglighet per importerat prov, byggd från publicerade frågor. */
  const examQuestionInfo = useMemo(() => {
    const map = new Map<string, ExamQuestionInfo>();
    if (!questionsReady) return map;
    for (const q of getQuestions()) {
      if (!q.examId) continue;
      const entry =
        map.get(q.examId) ?? { count: 0, kinds: [] as ExamKind[], byKind: {} as Record<string, number> };
      entry.count += 1;
      entry.byKind[q.kind] = (entry.byKind[q.kind] ?? 0) + 1;
      if (!entry.kinds.includes(q.kind)) entry.kinds.push(q.kind);
      map.set(q.examId, entry);
    }
    for (const entry of map.values()) {
      entry.kinds.sort(
        (a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b),
      );
    }
    return map;
  }, [questionsReady]);

  function selectPdfExam(exam: OfficialExam) {
    setActiveExamId(exam.id);
    const preferred =
      exam.documents.find((d) => d.kind === "verbal") ??
      exam.documents.find((d) => d.kind === "kvantitativ") ??
      exam.documents[0];
    setActiveDocUrl(preferred?.url ?? "");
    setLoadedDocUrl(null);
  }

  if (examMode) {
    return (
      <ExamMockExam
        examId={examMode.exam.id}
        title={examMode.exam.title}
        onExit={() => setExamMode(null)}
      />
    );
  }

  if (practiceMode) {
    return (
      <FreePracticeSession
        subtest={practiceMode.subtest}
        questionCount={practiceMode.count}
        examId={practiceMode.exam.id}
        onClose={() => setPracticeMode(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Primär: importerade prov med frågor i appen */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
              Importerade prov
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Gamla prov att träna på
            </h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Kör ett helt prov med riktiga uppgifter eller öva en del i taget. Här visas de prov som
          har importerats med frågor i appen.
        </p>

        {!examsReady || !questionsReady ? (
          <div className="mt-4 flex items-center gap-2 py-6 text-sm text-[var(--ink-muted)]">
            <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
            Laddar prov…
          </div>
        ) : visibleDbExams.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--line)] bg-card/60 px-4 py-6 text-center">
            <p className="text-sm font-medium text-[var(--ink)]">Inga importerade prov ännu</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Fler äldre prov importeras löpande. Tills dess hittar du originalhäften som PDF
              längre ner på sidan.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visibleDbExams.map((exam) => {
              const info = examQuestionInfo.get(exam.id);
              const count = info?.count ?? 0;
              const hasQuestions = count > 0;
              return (
                <div
                  key={exam.id}
                  className="rounded-lg border border-[var(--line)] bg-card/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--ink)]">{exam.title}</div>
                      <div className="mt-0.5 text-xs text-[var(--ink-muted)]">{exam.examDate}</div>
                      {hasQuestions ? (
                        <div className="mt-1 text-xs text-[var(--ink-muted)]">
                          {count} frågor · {info!.kinds.map((k) => kindBadge(k)).join(" · ")}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-[var(--ink-muted)]">
                          Inga publicerade frågor ännu
                        </div>
                      )}
                    </div>
                    {hasQuestions ? (
                      <button
                        type="button"
                        onClick={() => setExamMode({ exam })}
                        className="inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                      >
                        Helt prov
                      </button>
                    ) : null}
                  </div>

                  {hasQuestions ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {info!.kinds.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() =>
                            setPracticeMode({
                              exam,
                              subtest: k,
                              count: info!.byKind[k] ?? 0,
                            })
                          }
                          className="rounded-md border border-[var(--line-strong)] bg-card px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:border-[var(--ink-soft)]"
                        >
                          Öva {kindBadge(k)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

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

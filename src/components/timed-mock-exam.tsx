"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordMissedQuestions } from "@/lib/error-srs";
import { formatClock } from "@/lib/practice-timer";
import {
  buildMockExam,
  kindBadge,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { PaceNotice } from "@/components/pace-notice";
import { paceVerdict } from "@/lib/practice-pace";
import { appendQuizResult, estimateNormFromPercent } from "@/lib/progress-history";

const QUESTION_COUNT = 24;
const LIMIT_SECONDS = 20 * 60;

type Phase = "intro" | "quiz" | "review";

export function TimedMockExam() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [seed, setSeed] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const loggedRef = useRef(false);
  const startTsRef = useRef<number | null>(null);
  const [loggedDurationMs, setLoggedDurationMs] = useState<number | null>(null);

  const questions = useMemo(() => {
    if (!seed) return [] as ChoiceQuestion[];
    return buildMockExam(seed, QUESTION_COUNT);
  }, [seed]);

  const remainingSeconds =
    deadline === null ? LIMIT_SECONDS : Math.max(0, Math.ceil((deadline - now) / 1000));

  const score = useMemo(() => tally(questions, answers), [answers, questions]);

  function start() {
    loggedRef.current = false;
    startTsRef.current = Date.now();
    setLoggedDurationMs(null);
    setSeed(`mock:${Date.now()}`);
    setIndex(0);
    setAnswers({});
    setSelected(null);
    setDeadline(Date.now() + LIMIT_SECONDS * 1000);
    setNow(Date.now());
    setPhase("quiz");
  }

  function finishQuiz(nextAnswers?: Record<string, number>) {
    const ans =
      nextAnswers ??
      (selected !== null && questions[index]
        ? { ...answers, [questions[index].id]: selected }
        : answers);
    if (ans !== answers) setAnswers(ans);
    setPhase("review");
    if (loggedRef.current || questions.length === 0) return;
    loggedRef.current = true;
    const kinds = [...new Set(questions.map((q) => q.kind))] as PracticeKind[];
    const result = tally(questions, ans);
    const durationMs = startTsRef.current ? Date.now() - startTsRef.current : undefined;
    if (durationMs && durationMs > 0) setLoggedDurationMs(durationMs);
    appendQuizResult({
      source: "mock",
      kinds,
      correct: result.correct,
      total: result.total,
      durationMs,
    });
    recordMissedQuestions(questions, ans);
  }

  useEffect(() => {
    if (phase !== "quiz") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "quiz" && remainingSeconds <= 0) {
      finishQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingSeconds]);

  function submitAnswer() {
    if (selected === null || !questions[index]) return;
    const q = questions[index];
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    if (index >= questions.length - 1) {
      finishQuiz(next);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(next[questions[index + 1]?.id] ?? null);
  }

  const current = questions[index];
  const estimated = questions.length
    ? estimateNormFromPercent((score.correct / questions.length) * 100)
    : 0;

  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Mini-prov · appens egna frågor
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Tidsatt provpass
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
          {QUESTION_COUNT} originalfrågor från ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.{" "}
          {LIMIT_SECONDS / 60} minuter nedräkning, sedan genomgång med rätt/fel. Obesvarade räknas
          som fel. Det här är inte ett officiellt UHR-prov — PDF:erna nedan är de riktiga häftena.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:brightness-110"
        >
          Starta mini-prov ({LIMIT_SECONDS / 60} min)
        </button>
      </div>
    );
  }

  if (phase === "quiz" && current) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Mini-prov · {kindBadge(current.kind)}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Fråga {index + 1} av {questions.length}
            </p>
          </div>
          <p
            className={`rounded-md px-3 py-1.5 font-semibold tabular-nums ${
              remainingSeconds <= 60
                ? "bg-[#fff7f3] text-[#9a3412]"
                : "bg-[var(--mist)] text-[var(--ink)]"
            }`}
          >
            {formatClock(remainingSeconds)}
          </p>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        {current.passage ? (
          <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {current.passage}
          </div>
        ) : null}

        <p className="mt-5 text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Svarsalternativ">
          {current.options.map((opt, i) => {
            const active = selected === i;
            return (
              <button
                key={`${current.id}-${i}`}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(i)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink-muted)]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[var(--ink)]">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={selected === null}
            onClick={submitAnswer}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white enabled:hover:brightness-110 disabled:opacity-40"
          >
            {index >= questions.length - 1 ? "Lämna in" : "Nästa"}
          </button>
          <button
            type="button"
            onClick={() => finishQuiz()}
            className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Avsluta nu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Genomgång
      </p>
      <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        {score.correct}/{score.total}
        <span className="ml-2 text-xl text-[var(--ink-muted)]">
          ({score.total ? Math.round((score.correct / score.total) * 100) : 0} %)
        </span>
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Uppskattad norm {estimated.toFixed(1).replace(".", ",")} — inte UHR:s officiella tabell.
        Resultatet är sparat i historiken. Missade frågor blir felkort.
      </p>
      <div className="mt-3">
        <PaceNotice
          verdict={
            loggedDurationMs != null
              ? paceVerdict(
                  loggedDurationMs,
                  score.total,
                  [...new Set(questions.map((q) => q.kind))],
                )
              : null
          }
          kinds={[...new Set(questions.map((q) => q.kind))]}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          const ok = chosen === q.correctIndex;
          return (
            <li
              key={q.id}
              className={`rounded-lg border px-4 py-3 ${
                ok
                  ? "border-[var(--lagoon)]/40 bg-[#eef8f6]"
                  : "border-[#9a3412]/30 bg-[#fff7f3]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                <span>
                  {qi + 1}. {kindBadge(q.kind)}
                </span>
                <span>{ok ? "Rätt" : chosen === undefined ? "Obesvarad" : "Fel"}</span>
              </div>
              <p className="mt-1 font-medium text-[var(--ink)]">{q.prompt}</p>
              {q.passage ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">{q.passage}</p>
              ) : null}
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {ok
                  ? `Rätt svar: ${q.options[q.correctIndex]}`
                  : `Ditt svar: ${chosen !== undefined ? q.options[chosen] : "—"} · Rätt: ${q.options[q.correctIndex]}`}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{q.explain}</p>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => {
          setPhase("intro");
          setSeed("");
          setDeadline(null);
        }}
        className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--ink-soft)]"
      >
        Tillbaka till mini-prov
      </button>
    </div>
  );
}

function tally(questions: ChoiceQuestion[], answers: Record<string, number>) {
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  return { correct, total: questions.length };
}

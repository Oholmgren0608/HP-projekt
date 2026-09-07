"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeKind } from "@/lib/practice";
import { buildMixedQuiz, tally, kindBadge } from "@/lib/practice";
import { QuestionReviewList } from "@/components/question-review";
import { recordMissedQuestions } from "@/lib/error-srs";
import { recordMasteredQuestions } from "@/lib/question-mastery";
import { appendQuizResult, tallyPerKind } from "@/lib/progress-history";
import { formatClock } from "@/lib/practice-timer";

type Props = {
  subtest: PracticeKind;
  questionCount: number;
  onClose: () => void;
};

type Phase = "quiz" | "review";

export function FreePracticeSession({ subtest, questionCount, onClose }: Props) {
  const [sessionStartTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const seed = `free:${subtest}:${sessionStartTime}`;
  const questions = useMemo(() => {
    return buildMixedQuiz([subtest], seed, questionCount);
  }, [subtest, seed, questionCount]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number> | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("quiz");
  const loggedRef = useRef(false);

  const current = questions[index];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(
    () => tally(questions, finalAnswers ?? {}),
    [finalAnswers, questions],
  );

  const elapsedSeconds = Math.floor((now - sessionStartTime) / 1000);

  // Timer effect
  useEffect(() => {
    if (phase !== "quiz") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  function logQuizOnce(locked: Record<string, number>) {
    if (loggedRef.current) return;
    loggedRef.current = true;
    const result = tally(questions, locked);
    appendQuizResult({
      source: "free",
      kinds: [subtest],
      correct: result.correct,
      total: result.total,
      perKind: tallyPerKind(questions, locked),
    });
    recordMissedQuestions(questions, locked);
    recordMasteredQuestions(questions, locked);
  }

  function lockAndReview(locked: Record<string, number>) {
    setFinalAnswers(locked);
    logQuizOnce(locked);
    setPhase("review");
  }

  function submitAnswer() {
    if (selected === null || !current) return;
    const nextAnswers = { ...answers, [current.id]: selected };
    setAnswers(nextAnswers);

    if (index >= total - 1) {
      lockAndReview(nextAnswers);
      return;
    }

    setIndex((i) => i + 1);
    setSelected(nextAnswers[questions[index + 1]?.id] ?? null);
  }

  function goPrevious() {
    if (index <= 0 || !current) return;
    const nextAnswers =
      selected !== null ? { ...answers, [current.id]: selected } : answers;
    if (nextAnswers !== answers) setAnswers(nextAnswers);
    setIndex((i) => i - 1);
    setSelected(nextAnswers[questions[index - 1]?.id] ?? null);
  }

  function handleRestart() {
    onClose();
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Fri övning · {kindBadge(subtest)}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {kindBadge(subtest)}-övning
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          Stäng
        </button>
      </div>

      {phase === "quiz" && current ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-muted)]">
            <span>
              Fråga {index + 1} av {total}
            </span>
            <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
              Tid: {formatClock(elapsedSeconds)}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>

          {current.passage ? (
            <div className="whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {current.passage}
            </div>
          ) : null}

          <p className="text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

          <div className="space-y-2" role="radiogroup" aria-label="Svarsalternativ">
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

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={selected === null}
              onClick={submitAnswer}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {index >= total - 1 ? "Visa resultat" : "Nästa fråga"}
            </button>
            <button
              type="button"
              onClick={goPrevious}
              disabled={index === 0}
              className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-muted)] disabled:opacity-40"
            >
              Föregående
            </button>
          </div>
        </div>
      ) : null}

      {phase === "review" ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-sm text-[var(--ink-muted)]">Resultat</p>
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
              {score.correct}/{score.total}
              <span className="ml-2 text-xl text-[var(--ink-muted)]">
                ({score.total ? Math.round((score.correct / score.total) * 100) : 0} %)
              </span>
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Tid: {formatClock(elapsedSeconds)} · {kindBadge(subtest)}
            </p>
          </div>

          <QuestionReviewList questions={questions} answers={finalAnswers ?? {}} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ny övning
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
            >
              Till övningsval
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

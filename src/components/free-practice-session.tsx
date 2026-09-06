"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeKind } from "@/lib/practice";
import { buildMixedQuiz, tally, kindBadge } from "@/lib/practice";
import { QuestionReviewList } from "@/components/question-review";
import { formatClock } from "@/lib/practice-timer";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";

type Props = {
  subtest: PracticeKind;
  questionCount: number;
  onClose: () => void;
};

export function FreePracticeSession({ subtest, questionCount, onClose }: Props) {
  const [sessionStartTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const seed = `free:${subtest}:${sessionStartTime}`;
  const questions = useMemo(() => {
    return buildMixedQuiz([subtest], seed, questionCount);
  }, [subtest, seed, questionCount]);

  const loggedRef = useRef(false);

  function logQuizOnce(locked: Record<string, number>) {
    if (loggedRef.current) return;
    loggedRef.current = true;
    recordQuizOutcome({
      source: "free",
      questions,
      answers: locked,
      kinds: [subtest],
      rememberShown: false,
    });
  }

  const quiz = useQuiz({ questions, onFinish: logQuizOnce });

  const {
    index,
    total,
    finalAnswers,
    selected,
    setSelected,
    phase,
    current,
    answeredCount,
    submitAnswer,
    goPrevious,
  } = quiz;

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

          <QuizProgress current={answeredCount} total={total} />

          {current.passage ? (
            <div className="whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {current.passage}
            </div>
          ) : null}

          <p className="text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

          <QuizOptions
            questionId={current.id}
            options={current.options}
            selected={selected}
            onSelect={setSelected}
          />

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

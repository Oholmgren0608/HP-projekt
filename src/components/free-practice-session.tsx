"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordEvent } from "@/lib/gamification/engine";
import type { ChoiceQuestion, PracticeKind } from "@/lib/practice";
import { buildMixedQuiz, tally, kindBadge } from "@/lib/practice";
import { useQuestions } from "@/lib/content/use-questions";
import { QuestionReviewList } from "@/components/question-review";
import { formatClock } from "@/lib/practice-timer";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";

type Props = {
  subtest: PracticeKind;
  questionCount: number;
  /** Filtrera till frågor från ett specifikt importerat prov. */
  examId?: string;
  onClose: () => void;
};

export function FreePracticeSession({ subtest, questionCount, examId, onClose }: Props) {
  const [sessionStartTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const seed = `free:${subtest}:${sessionStartTime}`;
  const { ready: questionsReady } = useQuestions();

  const questions = useMemo(() => {
    if (!questionsReady) return [] as ChoiceQuestion[];
    return buildMixedQuiz([subtest], seed, questionCount, examId);
  }, [subtest, seed, questionCount, examId, questionsReady]);

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
    const result = tally(questions, locked);
    recordEvent({
      type: "practice_session_complete",
      correct: result.correct,
      total: result.total,
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

  function handleSubmit() {
    if (selected !== null && current) {
      recordEvent({ type: "question", correct: selected === current.correctIndex });
    }
    submitAnswer();
  }

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
    <div className="rounded-xl border border-[var(--line)] bg-card p-5 shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            Fri övning · {kindBadge(subtest)}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {kindBadge(subtest)}-övning
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[var(--line-strong)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          Stäng
        </button>
      </div>

      {phase === "quiz" && !questionsReady ? (
        <div className="mt-5 flex items-center justify-center gap-2 py-10 text-sm text-[var(--ink-muted)]">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Laddar frågor…
        </div>
      ) : null}

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

          <QuestionFigure question={current} position={index + 1} />

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
              onClick={handleSubmit}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {index >= total - 1 ? "Visa resultat" : "Nästa fråga"}
            </button>
            <button
              type="button"
              onClick={goPrevious}
              disabled={index === 0}
              className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-muted)] disabled:opacity-40"
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
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Ny övning
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
            >
              Till övningsval
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

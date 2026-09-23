"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordEvent } from "@/lib/gamification/engine";
import { formatClock } from "@/lib/practice-timer";
import { useQuestions } from "@/lib/content/use-questions";
import {
  buildMockExam,
  kindBadge,
  tally,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { QuestionReviewList } from "@/components/question-review";
import { PaceNotice } from "@/components/pace-notice";
import { paceVerdict } from "@/lib/practice-pace";
import { estimateNormFromPercent } from "@/lib/progress-history";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";

const QUESTION_COUNT = 24;
const LIMIT_SECONDS = 20 * 60;

type Phase = "intro" | "quiz" | "review";

export function TimedMockExam() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [seed, setSeed] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const loggedRef = useRef(false);
  const startTsRef = useRef<number | null>(null);
  const [loggedDurationMs, setLoggedDurationMs] = useState<number | null>(null);

  const { ready: questionsReady } = useQuestions();

  const questions = useMemo(() => {
    if (!seed || !questionsReady) return [] as ChoiceQuestion[];
    return buildMockExam(seed, QUESTION_COUNT);
  }, [seed, questionsReady]);

  function logFinish(locked: Record<string, number>) {
    setPhase("review");
    if (loggedRef.current || questions.length === 0) return;
    loggedRef.current = true;
    recordEvent({ type: "mock_exam_complete" });
    const kinds = [...new Set(questions.map((q) => q.kind))] as PracticeKind[];
    const durationMs = startTsRef.current ? Date.now() - startTsRef.current : undefined;
    if (durationMs && durationMs > 0) setLoggedDurationMs(durationMs);
    recordQuizOutcome({
      source: "mock",
      questions,
      answers: locked,
      durationMs,
      kinds,
    });
  }

  const quiz = useQuiz({ questions, onFinish: logFinish });

  // Latest finish so the timeout interval never calls a stale closure.
  const finishRef = useRef(quiz.finish);
  useEffect(() => {
    finishRef.current = quiz.finish;
  });

  const remainingSeconds =
    deadline === null ? LIMIT_SECONDS : Math.max(0, Math.ceil((deadline - now) / 1000));

  const score = useMemo(
    () => tally(questions, quiz.finalAnswers ?? {}),
    [quiz.finalAnswers, questions],
  );

  function start() {
    if (!questionsReady) return;
    loggedRef.current = false;
    startTsRef.current = Date.now();
    setLoggedDurationMs(null);
    setSeed(`mock:${Date.now()}`);
    quiz.reset();
    setDeadline(Date.now() + LIMIT_SECONDS * 1000);
    setNow(Date.now());
    setPhase("quiz");
  }

  useEffect(() => {
    if (phase !== "quiz") return;
    const id = window.setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      // Auto-submit from the timer tick (event context) instead of a
      // render-triggered effect, avoiding a setState-in-effect cascade.
      if (deadline !== null && ts >= deadline) {
        finishRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, deadline]);

  const current = quiz.current;
  const estimated = questions.length
    ? estimateNormFromPercent((score.correct / questions.length) * 100)
    : 0;

  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
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
          disabled={!questionsReady}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questionsReady ? `Starta mini-prov (${LIMIT_SECONDS / 60} min)` : "Laddar frågor…"}
        </button>
      </div>
    );
  }

  if (phase === "quiz" && current) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
              Mini-prov · {kindBadge(current.kind)}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Fråga {quiz.index + 1} av {questions.length}
            </p>
          </div>
          <p
            className={`rounded-md px-3 py-1.5 font-semibold tabular-nums ${
              remainingSeconds <= 60
                ? "bg-[var(--coral-soft)] text-[var(--destructive)]"
                : "bg-[var(--mist)] text-[var(--ink)]"
            }`}
          >
            {formatClock(remainingSeconds)}
          </p>
        </div>

        <div className="mt-4">
          <QuizProgress
            current={quiz.index + 1}
            total={questions.length}
            transition={false}
          />
        </div>

        {current.passage ? (
          <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {current.passage}
          </div>
        ) : null}

        <QuestionFigure question={current} position={quiz.index + 1} />

        <p className="mt-5 text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

        <div className="mt-4">
          <QuizOptions
            questionId={current.id}
            options={current.options}
            selected={quiz.selected}
            onSelect={quiz.setSelected}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={quiz.selected === null}
            onClick={quiz.submitAnswer}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground enabled:hover:brightness-110 disabled:opacity-40"
          >
            {quiz.index >= questions.length - 1 ? "Lämna in" : "Nästa"}
          </button>
          <button
            type="button"
            onClick={() => quiz.finish()}
            className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Avsluta nu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
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

      <div className="mt-5">
        <QuestionReviewList questions={questions} answers={quiz.finalAnswers ?? {}} />
      </div>

      <button
        type="button"
        onClick={start}
        className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--ink-soft)]"
      >
        Nytt mini-prov
      </button>
    </div>
  );
}

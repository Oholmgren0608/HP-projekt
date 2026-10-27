"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordEvent } from "@/lib/gamification/engine";
import { formatClock } from "@/lib/practice-timer";
import { useQuestions } from "@/lib/content/use-questions";
import {
  buildMockExam,
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
import { ExamQuiz } from "@/components/quiz/exam-quiz";
import type { ExamPhase } from "@/components/provpass-session";

const QUESTION_COUNT = 24;
const LIMIT_SECONDS = 20 * 60;

export function TimedMockExam({
  onPhaseChange,
}: {
  onPhaseChange?: (phase: ExamPhase) => void;
}) {
  const [phase, setPhaseState] = useState<ExamPhase>("intro");
  function setPhase(next: ExamPhase) {
    setPhaseState(next);
    onPhaseChange?.(next);
  }
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
    window.scrollTo({ top: 0 });
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
      <section className="flex h-full flex-col rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Snabbprov</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
          Blandade frågor från alla åtta delprov, för när du inte har tid för ett helt pass. Rätt och
          fel visas efteråt, och resultatet sparas i din historik.
        </p>
        <div className="mt-auto pt-5">
          <p className="text-sm font-medium tabular-nums text-[var(--ink)]">
            {QUESTION_COUNT} frågor, {LIMIT_SECONDS / 60} minuter
          </p>
          <button
            type="button"
            onClick={start}
            disabled={!questionsReady}
            className="mt-3 inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-card px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {questionsReady ? "Starta snabbprov" : "Laddar frågor…"}
          </button>
        </div>
      </section>
    );
  }

  if (phase === "quiz" && current) {
    return (
      <ExamQuiz
        label="Snabbprov"
        quiz={quiz}
        questions={questions}
        clock={
          <p
            className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums ${
              remainingSeconds <= 60
                ? "bg-[var(--coral-soft)] text-[var(--destructive)]"
                : "bg-[var(--mist)] text-[var(--ink)]"
            }`}
          >
            Tid kvar: {formatClock(remainingSeconds)}
          </p>
        }
      />
    );
  }

  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
      <p className="text-[13px] text-[var(--ink-muted)]">Snabbprov: genomgång</p>
      <p className="font-[family-name:var(--font-display)] font-semibold text-4xl text-[var(--ink)]">
        {score.correct}/{score.total}
        <span className="ml-2 text-xl text-[var(--ink-muted)]">
          ({score.total ? Math.round((score.correct / score.total) * 100) : 0} %)
        </span>
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Uppskattad normerad poäng {estimated.toFixed(1).replace(".", ",")}, inte UHR:s officiella tabell.
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

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={start}
          className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
        >
          Nytt snabbprov
        </button>
        <button
          type="button"
          onClick={() => setPhase("intro")}
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-card px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
        >
          Tillbaka till Prov
        </button>
      </div>
    </div>
  );
}

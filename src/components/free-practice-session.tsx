"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordEvent } from "@/lib/gamification/engine";
import type { ChoiceQuestion, PracticeKind } from "@/lib/practice";
import { buildMixedQuiz, tally, kindBadge } from "@/lib/practice";
import type { RevealMode } from "@/lib/practice-modes";
import { useQuestions } from "@/lib/content/use-questions";
import { QuestionReviewList } from "@/components/question-review";
import { formatClock } from "@/lib/practice-timer";
import { formatCountdown } from "@/lib/countdown";
import { ExplainFigure } from "@/lib/content/explain-figures";
import { useQuizCountdown } from "@/lib/use-quiz-countdown";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";
import { QuestionPassage } from "@/components/question-passage";

type Props = {
  subtest: PracticeKind;
  questionCount: number;
  /** Tidsgräns i sekunder, eller null för att öva utan klocka. */
  timeLimitSeconds?: number | null;
  /** "immediate" visar rätt/fel direkt efter varje besvarad fråga. */
  reveal?: RevealMode;
  onClose: () => void;
};

export function FreePracticeSession({
  subtest,
  questionCount,
  timeLimitSeconds = null,
  reveal = "after",
  onClose,
}: Props) {
  const [sessionStartTime] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  // Tidsgränsen räknas från det att övningen startar.
  const [deadline] = useState(() =>
    timeLimitSeconds && timeLimitSeconds > 0 ? Date.now() + timeLimitSeconds * 1000 : null,
  );
  const [timedOut, setTimedOut] = useState(false);

  const seed = `free:${subtest}:${sessionStartTime}`;
  const { ready: questionsReady } = useQuestions();

  const questions = useMemo(() => {
    if (!questionsReady) return [] as ChoiceQuestion[];
    return buildMixedQuiz([subtest], seed, questionCount);
  }, [subtest, seed, questionCount, questionsReady]);

  const loggedRef = useRef(false);

  function logQuizOnce(locked: Record<string, number>) {
    if (loggedRef.current) return;
    loggedRef.current = true;
    recordQuizOutcome({
      source: "free",
      questions,
      answers: locked,
      kinds: [subtest],
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
    answers,
    finalAnswers,
    selected,
    setSelected,
    phase,
    current,
    answeredCount,
    submitAnswer,
    commitAnswer,
    goPrevious,
  } = quiz;

  // Nedräkning, varningar och avslut delas med nivåtestet och provpasset.
  const { remainingSeconds, warning } = useQuizCountdown({
    deadline,
    active: phase === "quiz",
    onExpire: () => {
      setTimedOut(true);
      quiz.finish();
    },
  });

  /** Registrerat svar på aktuell fråga (visas bara när rättningen sker direkt). */
  const committed = reveal === "immediate" && current ? answers[current.id] : undefined;
  const isLast = index >= total - 1;
  const primaryLabel = isLast
    ? "Visa resultat"
    : reveal === "immediate" && committed === undefined
      ? "Svara"
      : "Nästa fråga";

  // En fråga rapporteras högst en gång per pass: annars dubbelräknas XP,
  // statistik och dagliga uppdrag när man går tillbaka och skickar samma svar igen.
  const reportedRef = useRef<Set<string>>(new Set());

  function handleSubmit() {
    if (selected !== null && current && !reportedRef.current.has(current.id)) {
      reportedRef.current.add(current.id);
      recordEvent({ type: "question", correct: selected === current.correctIndex });
    }
    // Direkt rättning: registrera svaret och stanna kvar på frågan så att
    // rätt/fel hinner visas innan man går vidare.
    if (reveal === "immediate") commitAnswer();
    else submitAnswer();
  }

  const score = useMemo(
    () => tally(questions, finalAnswers ?? {}),
    [finalAnswers, questions],
  );

  const elapsedSeconds = Math.floor((now - sessionStartTime) / 1000);

  // Klockan för "Tid:"-märket; när en tidsgräns finns sköter nedräkningen ticken.
  useEffect(() => {
    if (phase !== "quiz" || deadline !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase, deadline]);

  function handleRestart() {
    onClose();
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-medium text-[var(--brand)]">
            Fri övning · {kindBadge(subtest)}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
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
            {remainingSeconds !== null ? (
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium tabular-nums ${
                  warning
                    ? "bg-[var(--coral-soft)] text-[var(--destructive)]"
                    : "bg-[var(--mist)] text-[var(--ink-soft)]"
                }`}
              >
                Tid kvar: {formatCountdown(remainingSeconds)}
              </span>
            ) : (
              <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium text-[var(--ink-soft)]">
                Tid: {formatClock(elapsedSeconds)}
              </span>
            )}
          </div>

          {warning ? (
            <p
              role="status"
              className={`text-sm font-medium ${
                warning === "final" ? "text-[var(--destructive)]" : "text-[var(--energy-ink)]"
              }`}
            >
              {warning === "final"
                ? "1 minut kvar — övningen avslutas automatiskt."
                : "5 minuter kvar."}
            </p>
          ) : null}

          <QuizProgress current={answeredCount} total={total} />

          <QuestionPassage
            passage={current.passage}
            textClassName="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]"
          />

          <QuestionFigure question={current} position={index + 1} />

          <p className="text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

          {committed !== undefined ? (
            <QuizOptions
              questionId={current.id}
              options={current.options}
              selected={committed}
              correctIndex={current.correctIndex}
            />
          ) : (
            <QuizOptions
              questionId={current.id}
              options={current.options}
              selected={selected}
              onSelect={setSelected}
            />
          )}

          {committed !== undefined ? (
            <div
              className={`rounded-lg border px-4 py-3 ${
                committed === current.correctIndex
                  ? "border-[var(--success-ink)]/40 bg-[var(--success-soft)]"
                  : "border-[var(--destructive)]/30 bg-[var(--coral-soft)]"
              }`}
            >
              <p className="text-sm font-medium text-[var(--ink)]">
                {committed === current.correctIndex
                  ? "Rätt svar!"
                  : `Fel — rätt svar är ${String.fromCharCode(65 + current.correctIndex)}.`}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
                {current.explain}
              </p>
              <ExplainFigure questionId={current.id} />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={committed === undefined && selected === null}
              onClick={committed !== undefined ? submitAnswer : handleSubmit}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {primaryLabel}
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
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="text-sm text-[var(--ink-muted)]">Resultat</p>
            <p className="font-[family-name:var(--font-display)] font-semibold text-4xl text-[var(--ink)]">
              {score.correct}/{score.total}
              <span className="ml-2 text-xl text-[var(--ink-muted)]">
                ({score.total ? Math.round((score.correct / score.total) * 100) : 0} %)
              </span>
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Tid: {formatClock(elapsedSeconds)} · {kindBadge(subtest)}
            </p>
            {timedOut ? (
              <p className="mt-2 text-sm text-[var(--ink)]">
                Tiden tog slut — besvarade frågor rättades och obesvarade räknades som fel.
              </p>
            ) : null}
          </div>

          <QuestionReviewList questions={questions} answers={finalAnswers ?? {}} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Ny övning
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
            >
              Till övningsval
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

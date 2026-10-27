"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import type { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuestionFigure } from "@/components/question-figure";
import { QuestionPassage } from "@/components/question-passage";
import { cn } from "@/lib/utils";

type Quiz = ReturnType<typeof useQuiz>;

/**
 * Provskärmen för tidtagna prov: fri navigering som på provdagen (hoppa över,
 * gå tillbaka, hoppa till valfri fråga via översikten) och inlämning som
 * varnar för obesvarade frågor. Rätt/fel visas inte här — bara i genomgången.
 */
export function ExamQuiz({
  label,
  quiz,
  questions,
  clock,
  notice,
}: {
  /** Provets namn, t.ex. "Helt provpass · Verbalt". */
  label: string;
  quiz: Quiz;
  questions: ChoiceQuestion[];
  /** Nedräkningen, renderad av provet som äger timern. */
  clock: ReactNode;
  /** Tidsvarning eller annan statusrad under rubriken. */
  notice?: ReactNode;
}) {
  const [showOverview, setShowOverview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const topRef = useRef<HTMLElement>(null);

  // Ett påbörjat prov ska inte försvinna av en råkad omladdning eller stängd flik.
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const current = quiz.current;
  if (!current) return null;

  const isAnswered = (q: ChoiceQuestion, i: number) =>
    quiz.answers[q.id] !== undefined || (i === quiz.index && quiz.selected !== null);
  const answered = questions.filter(isAnswered).length;
  const unanswered = questions.length - answered;
  const isLast = quiz.index >= questions.length - 1;

  function keepInView() {
    const top = topRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) topRef.current?.scrollIntoView({ block: "start" });
  }

  function goTo(i: number) {
    setConfirming(false);
    quiz.goTo(i);
    keepInView();
  }

  function handIn() {
    if (unanswered > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    quiz.finish();
  }

  return (
    <section
      ref={topRef}
      className="scroll-mt-4 rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6"
      aria-label={label}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-[13px] text-[var(--ink-muted)]">{label}</p>
          <p className="mt-0.5 font-medium text-[var(--ink)]">
            Fråga {quiz.index + 1} av {questions.length}
            <span className="ml-2 rounded-md bg-[var(--mist)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-soft)]">
              {kindBadge(current.kind)}
            </span>
          </p>
        </div>
        {clock}
      </div>

      {notice}

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowOverview((v) => !v)}
          aria-expanded={showOverview}
          className="flex w-full items-center justify-between gap-3 text-left text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <span>
            <span className="font-medium tabular-nums text-[var(--ink)]">
              {answered}/{questions.length}
            </span>{" "}
            besvarade
          </span>
          <span className="font-medium text-[var(--brand)]">
            {showOverview ? "Dölj översikt" : "Visa alla frågor"}
          </span>
        </button>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
          <div
            className="h-full rounded-full bg-[var(--brand)]"
            style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }}
          />
        </div>
        {showOverview ? (
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Frågeöversikt">
            {questions.map((q, i) => {
              const done = isAnswered(q, i);
              const here = i === quiz.index;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={here ? "step" : undefined}
                    aria-label={`Fråga ${i + 1}, ${done ? "besvarad" : "obesvarad"}`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-colors",
                      here
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
                        : done
                          ? "border-transparent bg-[var(--mist)] text-[var(--ink)]"
                          : "border-[var(--line-strong)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>

      <QuestionPassage
        passage={current.passage}
        className="mt-5"
        textClassName="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]"
      />

      <QuestionFigure question={current} position={quiz.index + 1} />

      <p className="mt-5 text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

      <div className="mt-4">
        <QuizOptions
          questionId={current.id}
          options={current.options}
          selected={quiz.selected}
          onSelect={(i) => {
            setConfirming(false);
            quiz.setSelected(i);
          }}
        />
      </div>

      {confirming ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3"
        >
          <p className="text-sm font-medium text-[var(--ink)]">
            {unanswered === 1
              ? "1 fråga är obesvarad."
              : `${unanswered} frågor är obesvarade.`}{" "}
            Obesvarade frågor räknas som fel.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handIn}
              className="inline-flex min-h-10 items-center rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
            >
              Lämna in ändå
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                const first = questions.findIndex((q, i) => !isAnswered(q, i));
                if (first >= 0) goTo(first);
              }}
              className="inline-flex min-h-10 items-center rounded-md border border-[var(--line-strong)] bg-card px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
            >
              Gå till första obesvarade
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(quiz.index - 1)}
          disabled={quiz.index === 0}
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-card px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:opacity-40 disabled:hover:bg-card"
        >
          Föregående
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={handIn}
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
          >
            Lämna in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(quiz.index + 1)}
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
          >
            {quiz.selected === null ? "Hoppa över" : "Nästa"}
          </button>
        )}
        {!isLast ? (
          <button
            type="button"
            onClick={handIn}
            className="ml-auto text-sm font-medium text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
          >
            Lämna in
          </button>
        ) : null}
      </div>
    </section>
  );
}

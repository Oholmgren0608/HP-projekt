"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatClock } from "@/lib/practice-timer";
import { useQuestions } from "@/lib/content/use-questions";
import {
  groupExamQuestionsByPass,
  kindBadge,
  tally,
  type ExamPassGroup,
} from "@/lib/practice";
import { QuestionReviewList } from "@/components/question-review";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";

/**
 * Helt prov från ett importerat exam. Kör provpassen i ordning (1, 3, 4, 5),
 * 55 min per pass. Verbala pass har bara 30 frågor (ELF saknas) men får ändå
 * full pass-tid — enklaste försvarbara valet, och matchar hur UHR schemalägger
 * provpassen oavsett frågeantal. Endast råpoäng: rätt per pass + totalt, ingen
 * normering. Ingenting sparas i historik/SRS.
 */

const PASS_SECONDS = 55 * 60;

const VERBAL_KINDS = new Set(["ord", "las", "mek", "elf"]);

type Phase = "intro" | "quiz" | "review";

function passTypeLabel(pass: ExamPassGroup): string {
  const kinds = new Set(pass.questions.map((q) => q.kind));
  const allVerbal = [...kinds].every((k) => VERBAL_KINDS.has(k));
  const allKvant = [...kinds].every((k) => !VERBAL_KINDS.has(k));
  if (allVerbal) return "Verbal";
  if (allKvant) return "Kvantitativ";
  return "Blandat";
}

export function ExamMockExam({
  examId,
  title,
  onExit,
}: {
  examId: string;
  title: string;
  onExit: () => void;
}) {
  const { ready: questionsReady } = useQuestions();
  const [phase, setPhase] = useState<Phase>("intro");
  const [passIndex, setPassIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [deadline, setDeadline] = useState<number>(0);

  const passes = useMemo<ExamPassGroup[]>(() => {
    if (!questionsReady) return [];
    return groupExamQuestionsByPass(examId);
  }, [questionsReady, examId]);

  const allQuestions = useMemo(
    () => passes.flatMap((p) => p.questions),
    [passes],
  );

  const perPassScores = useMemo(
    () =>
      passes.map((p) => {
        const { correct, total } = tally(p.questions, answers);
        return { passNumber: p.passNumber, correct, total };
      }),
    [passes, answers],
  );

  const totalScore = useMemo(
    () => tally(allQuestions, answers),
    [allQuestions, answers],
  );

  function start() {
    setAnswers({});
    setPassIndex(0);
    setDeadline(Date.now() + PASS_SECONDS * 1000);
    setPhase("quiz");
  }

  function handlePassFinish(locked: Record<string, number>) {
    setAnswers((prev) => ({ ...prev, ...locked }));
    if (passIndex + 1 < passes.length) {
      setPassIndex((i) => i + 1);
      setDeadline(Date.now() + PASS_SECONDS * 1000);
    } else {
      setPhase("review");
    }
  }

  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Helt prov · importerat
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            Tillbaka
          </button>
        </div>

        {passes.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Inga publicerade frågor hittades för det här provet ännu.
          </p>
        ) : (
          <>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
              {passes.length} provpass · {allQuestions.length} frågor · {PASS_SECONDS / 60} min
              per pass. Endast råpoäng — ingen normering.
            </p>

            <ul className="mt-4 space-y-2">
              {passes.map((pass) => (
                <li
                  key={pass.passNumber}
                  className="rounded-lg border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--ink-soft)]"
                >
                  <span className="font-semibold text-[var(--ink)]">
                    Pass {pass.passNumber}
                  </span>{" "}
                  · {passTypeLabel(pass)} · {pass.questions.length} frågor ·{" "}
                  {[...new Set(pass.questions.map((q) => kindBadge(q.kind)))].join(" · ")}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={start}
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Starta helt prov
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === "quiz") {
    const pass = passes[passIndex];
    if (!pass || pass.questions.length === 0) {
      return (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
          <p className="text-sm text-[var(--ink-muted)]">
            Inget provpass att visa. Gå tillbaka och välj ett annat prov.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]"
          >
            Tillbaka
          </button>
        </div>
      );
    }

    return (
      <ExamPassQuiz
        key={passIndex}
        pass={pass}
        deadline={deadline}
        onFinish={handlePassFinish}
        onAbort={onExit}
      />
    );
  }

  const pct = totalScore.total ? Math.round((totalScore.correct / totalScore.total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Provresultat
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        {totalScore.correct}/{totalScore.total}
        <span className="ml-2 text-xl text-[var(--ink-muted)]">({pct} %)</span>
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Råpoäng — ingen normering tillämpas på importerade prov.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {perPassScores.map((s) => (
          <div
            key={s.passNumber}
            className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm"
          >
            <span className="font-semibold text-[var(--ink)]">Pass {s.passNumber}</span>
            <span className="ml-2 text-[var(--ink-soft)]">
              {s.correct}/{s.total} rätt
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <QuestionReviewList questions={allQuestions} answers={answers} />
      </div>

      <button
        type="button"
        onClick={onExit}
        className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--ink-soft)]"
      >
        Tillbaka till provlistan
      </button>
    </div>
  );
}

function ExamPassQuiz({
  pass,
  deadline,
  onFinish,
  onAbort,
}: {
  pass: ExamPassGroup;
  deadline: number;
  onFinish: (locked: Record<string, number>) => void;
  onAbort: () => void;
}) {
  const questions = useMemo(() => pass.questions, [pass]);
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);

  function logFinish(locked: Record<string, number>) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(locked);
  }

  const quiz = useQuiz({ questions, onFinish: logFinish });

  // Latest finish so the timeout interval never calls a stale closure.
  const finishRef = useRef(quiz.finish);
  useEffect(() => {
    finishRef.current = quiz.finish;
  });

  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    const id = window.setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      if (ts >= deadline) {
        finishRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  const current = quiz.current;
  const sectionLabels = [...new Set(questions.map((q) => kindBadge(q.kind)))].join(" · ");

  if (!current) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Pass {pass.passNumber} · {sectionLabels}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Fråga {quiz.index + 1} av {questions.length}
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

      <div className="mt-4">
        <QuizProgress current={quiz.index + 1} total={questions.length} transition={false} />
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
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white enabled:hover:brightness-110 disabled:opacity-40"
        >
          {quiz.index >= questions.length - 1 ? "Lämna in pass" : "Nästa"}
        </button>
        <button
          type="button"
          onClick={() => quiz.finish()}
          className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          Avsluta pass
        </button>
        <button
          type="button"
          onClick={onAbort}
          className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          Avbryt prov
        </button>
      </div>
    </div>
  );
}

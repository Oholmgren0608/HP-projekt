"use client";

import { useMemo, useRef, useState } from "react";
import { recordEvent } from "@/lib/gamification/engine";
import { QuestionReviewList } from "@/components/question-review";
import { useQuestions } from "@/lib/content/use-questions";
import {
  buildMixedQuiz,
  getReflectPrompt,
  kindBadge,
  practiceLabel,
  tally,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { PaceNotice } from "@/components/pace-notice";
import { paceVerdict, requiredPracticeMinutes } from "@/lib/practice-pace";
import { formatClock } from "@/lib/practice-timer";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import { usePausablePracticeTimer } from "@/lib/use-pausable-practice-timer";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";
import type { StudyTask } from "@/lib/study-plan";

type Props = {
  task: StudyTask;
  week: number;
  onClose: () => void;
  onComplete: (result: { correct: number; total: number }) => void;
  onRestartSame: () => void;
  hasNextTask: boolean;
  onNextTask: () => void;
};

type Phase = "quiz" | "review" | "reflect";

export function PracticeSession({
  task,
  week,
  onClose,
  onComplete,
  onRestartSame,
  hasNextTask,
  onNextTask,
}: Props) {
  const isReflect = task.practiceKinds.length === 1 && task.practiceKinds[0] === "reflect";
  const requiredMinutes = requiredPracticeMinutes(task);

  const timer = usePausablePracticeTimer(week, task.id, requiredMinutes);
  const seed = `w${week}:${task.id}:${timer.attemptId}`;
  // Timern summerar alla omgångar av uppgiften (kravet gäller summan), men
  // tempot ska mätas på den här omgången. Varje omgång monteras på nytt.
  const attemptStartSecondsRef = useRef(timer.elapsedSeconds);

  const kindsKey = task.practiceKinds.join(",");
  const questionCount = task.questionCount ?? 8;
  const { ready: questionsReady } = useQuestions();

  const questions = useMemo(() => {
    if (isReflect || !questionsReady) return [] as ChoiceQuestion[];
    return buildMixedQuiz(task.practiceKinds, seed, questionCount);
    // task.practiceKinds is represented by the stable kindsKey dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReflect, questionsReady, seed, kindsKey, questionCount]);

  const reflect = useMemo(
    () => (isReflect && questionsReady ? getReflectPrompt(seed) : null),
    [isReflect, questionsReady, seed],
  );

  const [phase, setPhase] = useState<Phase>(isReflect ? "reflect" : "quiz");
  const [reflectAnswers, setReflectAnswers] = useState<string[]>([]);
  const loggedRef = useRef(false);
  const [loggedDurationMs, setLoggedDurationMs] = useState<number | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ChoiceQuestion[] | null>(null);

  function logQuizOnce(locked: Record<string, number>, quiz: ChoiceQuestion[]) {
    if (isReflect || loggedRef.current || quiz.length === 0) return;
    loggedRef.current = true;
    const durationMs = (timer.elapsedSeconds - attemptStartSecondsRef.current) * 1000;
    setLoggedDurationMs(durationMs);
    recordQuizOutcome({
      source: "week",
      questions: quiz,
      answers: locked,
      durationMs,
      kinds: task.practiceKinds,
    });
    const result = tally(quiz, locked);
    recordEvent({
      type: "practice_session_complete",
      correct: result.correct,
      total: result.total,
    });
    timer.markQuizComplete();
  }

  function onFinish(locked: Record<string, number>) {
    const qs = questions;
    setReviewQuestions(qs);
    logQuizOnce(locked, qs);
    setPhase("review");
  }

  const quiz = useQuiz({ questions, onFinish });

  // En fråga rapporteras högst en gång per pass (se free-practice-session).
  const reportedRef = useRef<Set<string>>(new Set());

  function handleSubmit() {
    if (quiz.selected !== null && quiz.current && !reportedRef.current.has(quiz.current.id)) {
      reportedRef.current.add(quiz.current.id);
      recordEvent({ type: "question", correct: quiz.selected === quiz.current.correctIndex });
    }
    quiz.submitAnswer();
  }

  const gradedQuestions = reviewQuestions ?? questions;
  const current = quiz.current;
  const answeredCount = quiz.answeredCount;

  const score = useMemo(
    () => tally(gradedQuestions, quiz.finalAnswers ?? {}),
    [quiz.finalAnswers, gradedQuestions],
  );

  const kindLabels = task.practiceKinds.map(practiceLabel).join(" · ");

  function handleClose() {
    timer.pause("leave");
    onClose();
  }

  function handleRestartSame() {
    timer.pause("leave");
    onRestartSame();
  }

  function handleNextTask() {
    timer.pause("leave");
    onNextTask();
  }

  function finish() {
    if (!timer.ready) return;
    timer.clear();
    onComplete({
      correct: isReflect ? reflectAnswers.filter((a) => a.trim()).length : score.correct,
      total: isReflect ? (reflect?.prompts.length ?? 0) : score.total,
    });
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-medium text-[var(--brand)]">
            Vecka {week} · {kindLabels}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{task.detail}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md border border-[var(--line-strong)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          Pausa & stäng
        </button>
      </div>

      <TimeRequirementBanner timer={timer} plannedMinutes={task.minutes} />

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
              Fråga {quiz.index + 1} av {quiz.total}
            </span>
            <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium text-[var(--ink-soft)]">
              {kindBadge(current.kind)}
            </span>
          </div>

          <QuizProgress current={answeredCount} total={quiz.total} />

          {current.passage ? (
            <div className="whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {current.passage}
            </div>
          ) : null}

          <QuestionFigure question={current} position={quiz.index + 1} />

          <p className="text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

          <QuizOptions
            questionId={current.id}
            options={current.options}
            selected={quiz.selected}
            onSelect={quiz.setSelected}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={quiz.selected === null}
              onClick={handleSubmit}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              {quiz.index >= quiz.total - 1 ? "Visa resultat" : "Nästa fråga"}
            </button>
            <button
              type="button"
              onClick={quiz.goPrevious}
              disabled={quiz.index === 0}
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
              Aktiv övningstid {formatClock(timer.elapsedSeconds)} · krav {requiredMinutes} min ·{" "}
              {kindLabels}
            </p>
            <div className="mt-3">
              <PaceNotice
                verdict={
                  loggedDurationMs != null
                    ? paceVerdict(
                        loggedDurationMs,
                        score.total,
                        task.practiceKinds.filter((k) => k !== "reflect"),
                      )
                    : null
                }
                kinds={task.practiceKinds.filter((k) => k !== "reflect")}
              />
            </div>
          </div>

          <QuestionReviewList questions={gradedQuestions} answers={quiz.finalAnswers ?? {}} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestartSame}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Ny övning
            </button>
            {hasNextTask ? (
              <button
                type="button"
                onClick={handleNextTask}
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
              >
                Nästa i veckan
              </button>
            ) : null}
          </div>
          <CompleteButton ready={timer.ready} remainingSeconds={timer.remainingSeconds} onClick={finish} />
        </div>
      ) : null}

      {phase === "reflect" && !questionsReady ? (
        <div className="mt-5 flex items-center justify-center gap-2 py-10 text-sm text-[var(--ink-muted)]">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Laddar frågor…
        </div>
      ) : null}

      {phase === "reflect" && reflect ? (
        <ReflectForm
          title={reflect.title}
          prompts={reflect.prompts}
          values={reflectAnswers}
          onChange={setReflectAnswers}
          onComplete={finish}
          timeReady={timer.ready}
          remainingSeconds={timer.remainingSeconds}
        />
      ) : null}
    </div>
  );
}

function TimeRequirementBanner({
  timer,
  plannedMinutes,
}: {
  timer: ReturnType<typeof usePausablePracticeTimer>;
  plannedMinutes: number;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--ink)]">
          {timer.ready ? (
            <>
              Rekommenderad tid uppnådd ({timer.requiredMinutes} min). Du kan markera som klar.
            </>
          ) : (
            <>
              Krav: <span className="font-medium">{timer.requiredMinutes} min</span> aktiv
              övningstid. Kvar:{" "}
              <span className="font-medium tabular-nums text-[var(--brand)]">
                {formatClock(timer.remainingSeconds)}
              </span>
              {timer.paused ? (
                <span className="ml-2 rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
                  Pausad
                </span>
              ) : null}
            </>
          )}
        </p>
        <p className="text-xs tabular-nums text-[var(--ink-muted)]">
          Aktiv tid: {formatClock(timer.elapsedSeconds)}
        </p>
      </div>
      {plannedMinutes > timer.requiredMinutes ? (
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Passet är planerat till ~{plannedMinutes} min. Har du tid kvar: kör en ny omgång eller
          ett gammalt provpass under Prov.
        </p>
      ) : null}
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        Timern pausas när du stänger övningen eller byter flik — den fortsätter där du slutade.
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
        <div
          className={`h-full rounded-full transition-all ${timer.ready ? "bg-[var(--lagoon-ink)]" : "bg-[var(--brand)]"}`}
          style={{ width: `${timer.progress}%` }}
        />
      </div>
    </div>
  );
}

function CompleteButton({
  ready,
  remainingSeconds,
  onClick,
}: {
  ready: boolean;
  remainingSeconds: number;
  onClick: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={!ready}
        onClick={onClick}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Markera uppgiften som klar
      </button>
      {!ready ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Knappen låses upp efter {formatClock(remainingSeconds)} aktiv övningstid till. Timern
          pausas om du lämnar passet.
        </p>
      ) : null}
    </div>
  );
}

function ReflectForm({
  title,
  prompts,
  values,
  onChange,
  onComplete,
  timeReady,
  remainingSeconds,
}: {
  title: string;
  prompts: string[];
  values: string[];
  onChange: (next: string[]) => void;
  onComplete: () => void;
  timeReady: boolean;
  remainingSeconds: number;
}) {
  const filled = prompts.every((_, i) => (values[i] ?? "").trim().length > 0);
  const canFinish = filled && timeReady;

  return (
    <div className="mt-5 space-y-5">
      <h4 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">{title}</h4>
      {prompts.map((prompt, i) => (
        <label key={prompt} className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">
            {i + 1}. {prompt}
          </span>
          <textarea
            value={values[i] ?? ""}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
            rows={3}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
            placeholder="Skriv kort här…"
          />
        </label>
      ))}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={!canFinish}
          onClick={onComplete}
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Markera som klar
        </button>
        {!timeReady ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Vänta tills aktiv övningstid är klar ({formatClock(remainingSeconds)} kvar).
          </p>
        ) : !filled ? (
          <p className="text-sm text-[var(--ink-muted)]">Fyll i alla fält först.</p>
        ) : null}
      </div>
    </div>
  );
}

export function practiceKindsLabel(kinds: PracticeKind[]): string {
  return kinds.map(practiceLabel).join(" · ");
}

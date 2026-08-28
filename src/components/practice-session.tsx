"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordMissedQuestions } from "@/lib/error-srs";
import { recordMasteredQuestions } from "@/lib/question-mastery";
import { QuestionReviewList } from "@/components/question-review";
import {
  buildMixedQuiz,
  getReflectPrompt,
  kindBadge,
  practiceLabel,
  rememberShownQuestions,
  tally,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { PaceNotice } from "@/components/pace-notice";
import { paceVerdict } from "@/lib/practice-pace";
import { appendQuizResult } from "@/lib/progress-history";
import {
  clearPracticeTimer,
  formatClock,
  loadOrStartPracticeSession,
  loadPracticeTimer,
  savePausedPracticeTimer,
  savePracticeTimer,
  type PracticeTimerState,
} from "@/lib/practice-timer";
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

function usePausablePracticeTimer(week: number, taskId: string, requiredMinutes: number) {
  const requiredMs = requiredMinutes * 60 * 1000;

  const [session, setSession] = useState<PracticeTimerState>(() =>
    loadOrStartPracticeSession(week, taskId),
  );
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);

  const sessionRef = useRef(session);
  const runningSinceRef = useRef(runningSince);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  function persist(next: PracticeTimerState) {
    const stored = loadPracticeTimer(week, taskId);
    if (!stored || stored.attemptId === next.attemptId) {
      savePracticeTimer(week, taskId, next);
    }
    setSession(next);
    sessionRef.current = next;
  }

  function pause(reason: "leave" | "hidden" = "leave") {
    const since = runningSinceRef.current;
    if (since === null) {
      setPaused(true);
      return sessionRef.current;
    }
    const extraMs = Math.max(0, Date.now() - since);
    runningSinceRef.current = null;
    setRunningSince(null);
    setPaused(true);
    const { saved, replacedByNewerAttempt } = savePausedPracticeTimer(
      week,
      taskId,
      sessionRef.current,
      extraMs,
    );
    if (!replacedByNewerAttempt) {
      setSession(saved);
      sessionRef.current = saved;
    }
    void reason;
    return replacedByNewerAttempt ? sessionRef.current : saved;
  }

  function markQuizComplete() {
    const next: PracticeTimerState = { ...sessionRef.current, quizComplete: true };
    persist(next);
  }

  function resume() {
    if (runningSinceRef.current !== null) {
      setPaused(false);
      return;
    }
    const t = Date.now();
    runningSinceRef.current = t;
    setRunningSince(t);
    setPaused(false);
    setNow(t);
  }

  useEffect(() => {
    if (runningSince === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningSince]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause("hidden");
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) resume();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause("leave");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, taskId]);

  const elapsedMs =
    session.accumulatedMs +
    (runningSince !== null ? Math.max(0, now - runningSince) : 0);
  const remainingMs = Math.max(0, requiredMs - elapsedMs);
  const ready = remainingMs <= 0;
  const progress = Math.min(100, Math.round((elapsedMs / requiredMs) * 100));

  return {
    ready,
    paused,
    attemptId: session.attemptId,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progress,
    requiredMinutes,
    pause,
    markQuizComplete,
    clear: () => clearPracticeTimer(week, taskId),
  };
}

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
  const requiredMinutes = task.minutes;

  const timer = usePausablePracticeTimer(week, task.id, requiredMinutes);
  const seed = `w${week}:${task.id}:${timer.attemptId}`;
  const quizSeedRef = useRef("");
  const quizRef = useRef<ChoiceQuestion[]>([]);

  const kindsKey = task.practiceKinds.join(",");
  const questionCount = task.questionCount ?? 8;
  const questions = useMemo(() => {
    if (isReflect) return [] as ChoiceQuestion[];
    if (quizRef.current.length > 0 && quizSeedRef.current === seed) {
      return quizRef.current;
    }
    const built = buildMixedQuiz(task.practiceKinds, seed, questionCount);
    quizSeedRef.current = seed;
    quizRef.current = built;
    return built;
  }, [isReflect, seed, kindsKey, questionCount, task.practiceKinds]);

  const reflect = useMemo(
    () => (isReflect ? getReflectPrompt(seed) : null),
    [isReflect, seed],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number> | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>(isReflect ? "reflect" : "quiz");
  const [reflectAnswers, setReflectAnswers] = useState<string[]>([]);
  const loggedRef = useRef(false);
  const [loggedDurationMs, setLoggedDurationMs] = useState<number | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ChoiceQuestion[] | null>(null);

  const gradedQuestions = reviewQuestions ?? questions;
  const current = questions[index];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(
    () => tally(gradedQuestions, finalAnswers ?? {}),
    [finalAnswers, gradedQuestions],
  );

  const kindLabels = task.practiceKinds.map(practiceLabel).join(" · ");

  function logQuizOnce(locked: Record<string, number>, quiz: ChoiceQuestion[]) {
    if (isReflect || loggedRef.current || quiz.length === 0) return;
    loggedRef.current = true;
    const result = tally(quiz, locked);
    const durationMs = timer.elapsedSeconds * 1000;
    setLoggedDurationMs(durationMs);
    appendQuizResult({
      source: "week",
      kinds: task.practiceKinds,
      correct: result.correct,
      total: result.total,
      durationMs,
    });
    recordMissedQuestions(quiz, locked);
    recordMasteredQuestions(quiz, locked);
    rememberShownQuestions(quiz);
    timer.markQuizComplete();
  }

  function lockAndReview(locked: Record<string, number>) {
    const quiz = quizRef.current.length > 0 ? quizRef.current : questions;
    setReviewQuestions(quiz);
    setFinalAnswers(locked);
    logQuizOnce(locked, quiz);
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
    <div className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Vecka {week} · {kindLabels}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{task.detail}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          Pausa & stäng
        </button>
      </div>

      <TimeRequirementBanner timer={timer} />

      {phase === "quiz" && current ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-muted)]">
            <span>
              Fråga {index + 1} av {total}
            </span>
            <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
              {kindBadge(current.kind)}
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
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
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

          <QuestionReviewList questions={gradedQuestions} answers={finalAnswers ?? {}} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRestartSame}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ny övning
            </button>
            {hasNextTask ? (
              <button
                type="button"
                onClick={handleNextTask}
                className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
              >
                Nästa i veckan
              </button>
            ) : null}
          </div>
          <CompleteButton ready={timer.ready} remainingSeconds={timer.remainingSeconds} onClick={finish} />
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
}: {
  timer: ReturnType<typeof usePausablePracticeTimer>;
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
              Krav: <span className="font-semibold">{timer.requiredMinutes} min</span> aktiv
              övningstid. Kvar:{" "}
              <span className="font-semibold tabular-nums text-[var(--accent)]">
                {formatClock(timer.remainingSeconds)}
              </span>
              {timer.paused ? (
                <span className="ml-2 rounded bg-[var(--mist)] px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
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
      <p className="mt-1 text-xs text-[var(--ink-muted)]">
        Timern pausas när du stänger övningen eller byter flik — den fortsätter där du slutade.
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
        <div
          className={`h-full rounded-full transition-all ${timer.ready ? "bg-[var(--lagoon)]" : "bg-[var(--accent)]"}`}
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
    <div className="space-y-2">
      <button
        type="button"
        disabled={!ready}
        onClick={onClick}
        className="inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
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
      <h4 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">{title}</h4>
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
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
            placeholder="Skriv kort här…"
          />
        </label>
      ))}
      <div className="space-y-2">
        <button
          type="button"
          disabled={!canFinish}
          onClick={onComplete}
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
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

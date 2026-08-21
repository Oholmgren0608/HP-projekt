"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildMixedQuiz,
  getReflectPrompt,
  practiceLabel,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import {
  clearPracticeTimer,
  formatClock,
  loadPracticeTimer,
  savePracticeTimer,
} from "@/lib/practice-timer";
import type { StudyTask } from "@/lib/study-plan";

type Props = {
  task: StudyTask;
  week: number;
  onClose: () => void;
  onComplete: (result: { correct: number; total: number }) => void;
};

type Phase = "quiz" | "review" | "reflect";

const MEK_BLANK = /_{2,}/;

function fillMekPassage(passage: string, word: string): { before: string; word: string; after: string } | null {
  const match = passage.match(MEK_BLANK);
  if (!match || match.index === undefined) return null;
  return {
    before: passage.slice(0, match.index),
    word,
    after: passage.slice(match.index + match[0].length),
  };
}

function usePausablePracticeTimer(week: number, taskId: string, requiredMinutes: number) {
  const requiredMs = requiredMinutes * 60 * 1000;

  const [accumulatedMs, setAccumulatedMs] = useState(() =>
    loadPracticeTimer(week, taskId).accumulatedMs,
  );
  const [runningSince, setRunningSince] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);

  const accumulatedRef = useRef(accumulatedMs);
  const runningSinceRef = useRef(runningSince);

  useEffect(() => {
    accumulatedRef.current = accumulatedMs;
  }, [accumulatedMs]);

  useEffect(() => {
    runningSinceRef.current = runningSince;
  }, [runningSince]);

  function persist(nextAccumulated: number) {
    savePracticeTimer(week, taskId, { accumulatedMs: nextAccumulated });
  }

  function pause(reason: "leave" | "hidden" = "leave") {
    const since = runningSinceRef.current;
    if (since === null) {
      setPaused(true);
      return accumulatedRef.current;
    }
    const next = accumulatedRef.current + Math.max(0, Date.now() - since);
    accumulatedRef.current = next;
    runningSinceRef.current = null;
    setAccumulatedMs(next);
    setRunningSince(null);
    setPaused(true);
    persist(next);
    void reason;
    return next;
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
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause("leave");
    };
    // intentionally once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, taskId]);

  const elapsedMs =
    accumulatedMs + (runningSince !== null ? Math.max(0, now - runningSince) : 0);
  const remainingMs = Math.max(0, requiredMs - elapsedMs);
  const ready = remainingMs <= 0;
  const progress = Math.min(100, Math.round((elapsedMs / requiredMs) * 100));

  return {
    ready,
    paused,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progress,
    requiredMinutes,
    pause,
    clear: () => clearPracticeTimer(week, taskId),
  };
}

export function PracticeSession({ task, week, onClose, onComplete }: Props) {
  const isReflect = task.practiceKinds.length === 1 && task.practiceKinds[0] === "reflect";
  const seed = `w${week}:${task.id}`;
  const requiredMinutes = task.minutes;

  const timer = usePausablePracticeTimer(week, task.id, requiredMinutes);

  const questions = useMemo(() => {
    if (isReflect) return [] as ChoiceQuestion[];
    const count = task.questionCount ?? 8;
    return buildMixedQuiz(task.practiceKinds, seed, count);
  }, [isReflect, task.practiceKinds, task.questionCount, seed]);

  const reflect = useMemo(
    () => (isReflect ? getReflectPrompt(seed) : null),
    [isReflect, seed],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>(isReflect ? "reflect" : "quiz");
  const [reflectAnswers, setReflectAnswers] = useState<string[]>([]);

  const current = questions[index];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct += 1;
    }
    return { correct, total: questions.length };
  }, [answers, questions]);

  const kindLabels = task.practiceKinds.map(practiceLabel).join(" · ");

  function submitAnswer() {
    if (selected === null || !current) return;
    const nextAnswers = { ...answers, [current.id]: selected };
    setAnswers(nextAnswers);

    if (index >= total - 1) {
      setPhase("review");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function handleClose() {
    timer.pause("leave");
    onClose();
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
              {current.kind === "las" ? "LÄS" : current.kind.toUpperCase()}
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
              className="rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {index >= total - 1 ? "Visa resultat" : "Nästa fråga"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (index > 0) {
                  setIndex((i) => i - 1);
                  setSelected(answers[questions[index - 1]?.id] ?? null);
                }
              }}
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
          </div>

          <ul className="space-y-3">
            {questions.map((q, qi) => {
              const chosen = answers[q.id];
              const ok = chosen === q.correctIndex;
              const correctWord = q.options[q.correctIndex];
              const chosenWord = chosen !== undefined ? q.options[chosen] : null;
              const filledCorrect =
                q.kind === "mek" && q.passage
                  ? fillMekPassage(q.passage, correctWord)
                  : null;
              const filledChosen =
                q.kind === "mek" && q.passage && chosenWord && !ok
                  ? fillMekPassage(q.passage, chosenWord)
                  : null;

              return (
                <li
                  key={q.id}
                  className={`rounded-lg border px-4 py-3 ${
                    ok
                      ? "border-[var(--lagoon)]/40 bg-[#eef8f6]"
                      : "border-[#9a3412]/30 bg-[#fff7f3]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                    <span>
                      {qi + 1}. {q.kind === "las" ? "LÄS" : q.kind.toUpperCase()}
                    </span>
                    <span>{ok ? "Rätt" : "Fel"}</span>
                  </div>
                  <p className="mt-1 font-medium text-[var(--ink)]">{q.prompt}</p>

                  {filledCorrect ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                        Rätt mening
                      </p>
                      <p className="rounded-md border border-[var(--lagoon)]/30 bg-white px-3 py-2 text-[15px] leading-relaxed text-[var(--ink)]">
                        {filledCorrect.before}
                        <mark className="rounded bg-[#c8ebe7] px-1 font-semibold text-[var(--ink)]">
                          {filledCorrect.word}
                        </mark>
                        {filledCorrect.after}
                      </p>
                      {filledChosen ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                            Din mening
                          </p>
                          <p className="rounded-md border border-[#9a3412]/25 bg-white px-3 py-2 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                            {filledChosen.before}
                            <mark className="rounded bg-[#fde8e1] px-1 font-semibold text-[#9a3412] line-through decoration-[#9a3412]/70">
                              {filledChosen.word}
                            </mark>
                            {filledChosen.after}
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      {q.passage && q.kind !== "mek" ? (
                        <p className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--line)] bg-white/70 px-3 py-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                          {q.passage}
                        </p>
                      ) : null}
                      {!ok ? (
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          Ditt svar: {chosenWord ?? "—"} · Rätt: {correctWord}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--ink-muted)]">
                          Rätt svar: {correctWord}
                        </p>
                      )}
                    </>
                  )}

                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{q.explain}</p>
                </li>
              );
            })}
          </ul>

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
        className="rounded-md bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded-md bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--paper)] transition enabled:hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
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

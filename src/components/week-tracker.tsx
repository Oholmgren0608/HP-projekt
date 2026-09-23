"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordEvent } from "@/lib/gamification/engine";
import { PracticeSession } from "@/components/practice-session";
import { WeekTaskRow } from "@/components/week-task-row";
import { usePlan } from "@/components/plan-context";
import { Progress } from "@/components/ui/progress";
import { useHydrated } from "@/lib/use-hydrated";
import { storageSet } from "@/lib/sync/storage-sync";
import {
  isPracticeInProgress,
  loadPracticeTimer,
  newPracticeAttempt,
  resetPracticeSession,
} from "@/lib/practice-timer";
import { type StudyTask } from "@/lib/study-plan";
import {
  WEEK_PROGRESS_KEY,
  WEEK_SCORES_KEY,
  clearLockedWeek,
  emitWeekProgressChanged,
  findNextIncompleteAfter,
  loadWeekProgress,
  loadWeekScores,
  saveLockedWeekIfAbsent,
  taskKey,
  type ProgressMap,
  type ScoreMap,
} from "@/lib/week-progress";

export function WeekTracker({
  onSessionChange,
}: {
  onSessionChange?: (open: boolean) => void;
}) {
  const { plan: generated } = usePlan();
  const weeklyPlans = generated.weeklyPlans;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressMap>(() => loadWeekProgress());
  const [scores, setScores] = useState<ScoreMap>(() => loadWeekScores());
  const urlWeek = searchParams.get("week");
  const urlStart = searchParams.get("start");
  const [activeWeek, setActiveWeek] = useState(() => {
    const week = Number(urlWeek);
    return week && weeklyPlans.some((w) => w.week === week) ? week : 1;
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(urlStart);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [timerTick, setTimerTick] = useState(0);
  const ready = useHydrated();

  // Re-apply active week/task when the URL query params change after mount.
  // Tracking the previous URL string and adjusting state during render avoids a
  // setState-in-effect cascade.
  const urlKey = `${urlWeek ?? ""}|${urlStart ?? ""}`;
  const [syncedUrlKey, setSyncedUrlKey] = useState(urlKey);
  if (urlKey !== syncedUrlKey) {
    setSyncedUrlKey(urlKey);
    const week = Number(urlWeek);
    if (week && weeklyPlans.some((w) => w.week === week)) {
      setActiveWeek(week);
    }
    if (urlStart) setActiveTaskId(urlStart);
  }

  useEffect(() => {
    if (!ready) return;
    storageSet(WEEK_PROGRESS_KEY, JSON.stringify(progress));
    emitWeekProgressChanged();
  }, [progress, ready]);

  useEffect(() => {
    if (!ready) return;
    storageSet(WEEK_SCORES_KEY, JSON.stringify(scores));
  }, [scores, ready]);

  // Clamp the active week when the generated plan shrinks below the selection,
  // adjusting state during render instead of in an effect (avoids cascading renders).
  if (activeWeek > weeklyPlans.length && weeklyPlans.length > 0) {
    setActiveWeek(1);
    setActiveTaskId(null);
  }

  const plan = weeklyPlans.find((w) => w.week === activeWeek) ?? weeklyPlans[0];
  const activeTask = plan?.tasks.find((t) => t.id === activeTaskId) ?? null;

  useEffect(() => {
    onSessionChange?.(Boolean(activeTask));
  }, [activeTask, onSessionChange]);

  const { done, total, percent } = useMemo(() => {
    const allTasks = weeklyPlans.flatMap((w) => w.tasks.map((t) => taskKey(w.week, t.id)));
    const doneCount = allTasks.filter((k) => progress[k]).length;
    return {
      done: doneCount,
      total: allTasks.length,
      percent: allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0,
    };
  }, [progress, weeklyPlans]);

  // Timer-tillstånd läses en gång per (plan, timerTick) i stället för per
  // uppgift inne i JSX:en. `timerTick` tvingar en omavläsning efter att ett
  // pass stängts/avslutats så att sparad tid och pågående-status hålls aktuella.
  const timerStates = useMemo(() => {
    const states = new Map<string, { bankedMin: number; inProgressQuiz: boolean }>();
    void timerTick;
    if (!plan) return states;
    for (const task of plan.tasks) {
      const timerState = loadPracticeTimer(plan.week, task.id);
      states.set(task.id, {
        bankedMin: Math.floor((timerState?.accumulatedMs ?? 0) / 60000),
        inProgressQuiz: isPracticeInProgress(timerState),
      });
    }
    return states;
  }, [plan, timerTick]);

  if (!plan) return null;

  const weekDone = plan.tasks.filter((t) => progress[taskKey(plan.week, t.id)]).length;

  function markComplete(task: StudyTask, result: { correct: number; total: number }) {
    saveLockedWeekIfAbsent(plan);
    const key = taskKey(plan.week, task.id);
    const nextProgress = { ...progress, [key]: true };
    setProgress(nextProgress);
    setScores((prev) => ({
      ...prev,
      [key]: { ...result, at: new Date().toISOString() },
    }));
    setActiveTaskId(null);
    // Hela veckan klar? Fira med XP.
    if (plan.tasks.every((t) => nextProgress[taskKey(plan.week, t.id)])) {
      recordEvent({ type: "plan_week_complete" });
    }
  }

  function resetWeek() {
    clearLockedWeek(plan.week);
    setProgress((prev) => {
      const next = { ...prev };
      for (const t of plan.tasks) {
        delete next[taskKey(plan.week, t.id)];
      }
      return next;
    });
    setScores((prev) => {
      const next = { ...prev };
      for (const t of plan.tasks) {
        delete next[taskKey(plan.week, t.id)];
      }
      return next;
    });
    setActiveTaskId(null);
  }

  if (activeTask) {
    const nextIncomplete = findNextIncompleteAfter(
      weeklyPlans,
      progress,
      plan.week,
      activeTask.id,
    );
    return (
      <PracticeSession
        key={`${plan.week}:${activeTask.id}:${sessionNonce}`}
        task={activeTask}
        week={plan.week}
        onClose={() => {
          setActiveTaskId(null);
          setTimerTick((n) => n + 1);
          router.replace("/plan", { scroll: false });
        }}
        onComplete={(result) => {
          markComplete(activeTask, result);
          setTimerTick((n) => n + 1);
          router.replace("/plan", { scroll: false });
        }}
        onRestartSame={() => {
          newPracticeAttempt(plan.week, activeTask.id);
          setSessionNonce((n) => n + 1);
        }}
        hasNextTask={Boolean(nextIncomplete)}
        onNextTask={() => {
          if (!nextIncomplete) return;
          setActiveWeek(nextIncomplete.week);
          setActiveTaskId(nextIncomplete.task.id);
          setSessionNonce((n) => n + 1);
          setTimerTick((n) => n + 1);
          router.replace(
            `/plan?week=${nextIncomplete.week}&start=${encodeURIComponent(nextIncomplete.task.id)}`,
            { scroll: false },
          );
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--ink-muted)]">Totalt genomfört</p>
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
              {done}/{total}{" "}
              <span className="text-lg text-[var(--ink-muted)]">({percent}%)</span>
            </p>
          </div>
          <button
            type="button"
            onClick={resetWeek}
            className="min-h-11 text-sm text-[var(--ink-muted)] underline-offset-4 transition hover:text-[var(--ink)] hover:underline"
          >
            Nollställ vecka {activeWeek}
          </button>
        </div>
        <Progress value={percent} className="h-2 bg-[var(--mist)]" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Välj vecka">
        {weeklyPlans.map((w) => {
          const selected = w.week === activeWeek;
          const wDone = w.tasks.filter((t) => progress[taskKey(w.week, t.id)]).length;
          return (
            <button
              key={w.week}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setActiveWeek(w.week);
                setActiveTaskId(null);
              }}
              className={`min-h-14 shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${
                selected
                  ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line-strong)] bg-card/60 text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
              }`}
            >
              <div className="text-xs uppercase tracking-wide">Vecka {w.week}</div>
              <div className="text-sm font-medium">{w.phase}</div>
              <div className="text-xs opacity-80">
                {wDone}/{w.tasks.length}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 shadow-[0_12px_40px_-28px_rgba(18,42,48,0.45)] backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
              {plan.phase} · Vecka {plan.week}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {plan.theme}
            </h3>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">{plan.focus}</p>
            <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
              Klicka på en uppgift för att öva den här på sidan.
            </p>
          </div>
          <p className="rounded-md bg-[var(--mist)] px-3 py-1.5 text-sm text-[var(--ink)]">
            {weekDone}/{plan.tasks.length} klara
          </p>
        </div>

        <ul className="space-y-3">
          {plan.tasks.map((task) => {
            const key = taskKey(plan.week, task.id);
            const checked = Boolean(progress[key]);
            const score = scores[key];
            const timer = timerStates.get(task.id);
            const bankedMin = timer?.bankedMin ?? 0;
            const inProgressQuiz = timer?.inProgressQuiz ?? false;
            return (
              <WeekTaskRow
                key={task.id}
                task={task}
                checked={checked}
                score={score}
                bankedMin={bankedMin}
                inProgressQuiz={inProgressQuiz}
                onStart={() => {
                  if (checked) {
                    resetPracticeSession(plan.week, task.id);
                  } else if (!inProgressQuiz) {
                    newPracticeAttempt(plan.week, task.id);
                  }
                  setActiveTaskId(task.id);
                }}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PracticeSession, practiceKindsLabel } from "@/components/practice-session";
import { usePlan } from "@/components/plan-context";
import { useHydrated } from "@/lib/use-hydrated";
import { storageSet } from "@/lib/sync/storage-sync";
import { Progress } from "@/components/ui/progress";
import {
  formatClock,
  isPracticeInProgress,
  loadPracticeTimer,
  newPracticeAttempt,
  resetPracticeSession,
} from "@/lib/practice-timer";
import { sectionLabel, type StudyTask } from "@/lib/study-plan";
import {
  WEEK_PROGRESS_KEY,
  WEEK_SCORES_KEY,
  clearLockedWeek,
  emitWeekProgressChanged,
  findNextIncompleteAfter,
  loadJson,
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

  const [progress, setProgress] = useState<ProgressMap>(() =>
    loadJson(WEEK_PROGRESS_KEY, {}),
  );
  const [scores, setScores] = useState<ScoreMap>(() =>
    loadJson(WEEK_SCORES_KEY, {}),
  );
  const urlWeek = searchParams.get("week");
  const urlStart = searchParams.get("start");
  const [activeWeek, setActiveWeek] = useState(() => {
    const week = Number(urlWeek);
    return week && weeklyPlans.some((w) => w.week === week) ? week : 1;
  });
  const [activeTaskId, setActiveTaskId] = useState<string | null>(urlStart);
  const [sessionNonce, setSessionNonce] = useState(0);
  const ready = useHydrated();
  const [timerTick, setTimerTick] = useState(0);

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

  if (!plan) return null;

  const weekDone = plan.tasks.filter((t) => progress[taskKey(plan.week, t.id)]).length;

  function markComplete(task: StudyTask, result: { correct: number; total: number }) {
    saveLockedWeekIfAbsent(plan);
    const key = taskKey(plan.week, task.id);
    setProgress((prev) => ({ ...prev, [key]: true }));
    setScores((prev) => ({
      ...prev,
      [key]: { ...result, at: new Date().toISOString() },
    }));
    setActiveTaskId(null);
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
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-white/60 text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
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

      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 shadow-[0_12px_40px_-28px_rgba(18,42,48,0.45)] backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
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
            const timerState = loadPracticeTimer(plan.week, task.id);
            const bankedMin = Math.floor((timerState?.accumulatedMs ?? 0) / 60000);
            const inProgressQuiz = isPracticeInProgress(timerState);
            void timerTick;
            return (
              <li key={task.id}>
                <div
                  className={`rounded-xl border px-3 py-3 sm:px-4 ${
                    checked
                      ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]/50"
                      : "border-[var(--line)] bg-[var(--paper)]"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                        checked
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-[var(--line)] bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-medium ${checked ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"}`}
                        >
                          {task.title}
                        </span>
                        <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                          {sectionLabel(task.section)}
                        </span>
                        <span className="text-xs text-[var(--ink-muted)]">~{task.minutes} min</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {task.detail}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        Övning: {practiceKindsLabel(task.practiceKinds)}
                        {score ? ` · Senaste resultat ${score.correct}/${score.total}` : null}
                        {!checked && bankedMin > 0
                          ? ` · Sparad tid ${bankedMin}/${task.minutes} min (pausad)`
                          : null}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (checked) {
                              resetPracticeSession(plan.week, task.id);
                            } else if (!inProgressQuiz) {
                              newPracticeAttempt(plan.week, task.id);
                            }
                            setActiveTaskId(task.id);
                          }}
                          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                          {checked
                            ? "Öva igen (nya frågor)"
                            : inProgressQuiz
                              ? "Fortsätt övning"
                              : "Starta övning"}
                        </button>
                        {checked && score ? (
                          <span className="self-center text-xs text-[var(--ink-muted)]">
                            Klar · {score.correct}/{score.total}
                          </span>
                        ) : (
                          <span className="self-center text-xs text-[var(--ink-muted)]">
                            {bankedMin > 0
                              ? `Aktiv tid ${formatClock(bankedMin * 60)} / ${task.minutes} min`
                              : `Markeras klar efter ${task.minutes} min aktiv övning`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

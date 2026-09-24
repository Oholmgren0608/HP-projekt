"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordEvent } from "@/lib/gamification/engine";
import { PracticeSession } from "@/components/practice-session";
import { WeekTaskRow } from "@/components/week-task-row";
import { usePlan } from "@/components/plan-context";
import { Progress } from "@/components/ui/progress";
import { useHydrated } from "@/lib/use-hydrated";
import { storageSet } from "@/lib/sync/storage-sync";
import {
  clearPracticeTimer,
  isPracticeInProgress,
  loadPracticeTimer,
  newPracticeAttempt,
  resetPracticeSession,
} from "@/lib/practice-timer";
import { type StudyTask } from "@/lib/study-plan";
import type { GeneratedPlan } from "@/lib/plan-generator";
import {
  WEEK_PROGRESS_EVENT,
  WEEK_PROGRESS_KEY,
  WEEK_SCORES_KEY,
  clearLockedWeek,
  emitWeekProgressChanged,
  findNextIncompleteAfter,
  loadWeekProgress,
  loadWeekScores,
  saveLockedWeekIfAbsent,
  taskKey,
  weekProgressSummary,
  type ProgressMap,
  type ScoreMap,
} from "@/lib/week-progress";

// Stabil identitet: annars byter useMemo-beroendena referens varje render.
const NO_WEEKS: GeneratedPlan["weeklyPlans"] = [];

export function WeekTracker({
  onSessionChange,
}: {
  onSessionChange?: (open: boolean) => void;
}) {
  const { plan: generated } = usePlan();
  // Stabil tom lista när inget underlag sparats; PlanView visar då ingen WeekTracker.
  const weeklyPlans = generated?.weeklyPlans ?? NO_WEEKS;
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

  // Skriv bara när något faktiskt ändrats: annars stämplas nyckeln som nyare än
  // molnet vid varje besök, och sync-mergen ("nyaste vinner") låter en gammal
  // lokal kopia skriva över en nyare molnredigering.
  const savedProgressRef = useRef(JSON.stringify(progress));
  const savedScoresRef = useRef(JSON.stringify(scores));

  useEffect(() => {
    if (!ready) return;
    const nextProgress = JSON.stringify(progress);
    const nextScores = JSON.stringify(scores);
    const progressChanged = nextProgress !== savedProgressRef.current;
    const scoresChanged = nextScores !== savedScoresRef.current;
    // Båda skrivningarna görs innan eventet: annars hinner prenumerationen nedan
    // läsa den gamla score-kartan och skriva över den i state.
    if (progressChanged) {
      savedProgressRef.current = nextProgress;
      storageSet(WEEK_PROGRESS_KEY, nextProgress);
    }
    if (scoresChanged) {
      savedScoresRef.current = nextScores;
      storageSet(WEEK_SCORES_KEY, nextScores);
    }
    if (progressChanged) emitWeekProgressChanged();
  }, [progress, scores, ready]);

  // Andra flikar (och molnsynken) kan ändra progressen medan sidan är öppen —
  // samma prenumeration som dashboard-home gör, annars skriver den här fliken
  // tillbaka en gammal karta och tappar den andra flikens uppdatering.
  useEffect(() => {
    const refresh = () => {
      const nextProgress = loadWeekProgress();
      setProgress(nextProgress);
      savedProgressRef.current = JSON.stringify(nextProgress);
      const nextScores = loadWeekScores();
      setScores(nextScores);
      savedScoresRef.current = JSON.stringify(nextScores);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === WEEK_PROGRESS_KEY || event.key === WEEK_SCORES_KEY) {
        refresh();
      }
    };
    window.addEventListener(WEEK_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(WEEK_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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

  const { done, total, percent } = useMemo(
    () => weekProgressSummary(weeklyPlans, progress),
    [progress, weeklyPlans],
  );

  // En påbörjad vecka ska inte byta innehåll: lås den när ett pass startas, inte
  // bara när en uppgift blir klar. Annars kunde en pausad uppgift få ett annat
  // delprov medan den sparade tiden låg kvar på samma uppgifts-id.
  useEffect(() => {
    if (!plan || !activeTask) return;
    saveLockedWeekIfAbsent(plan);
  }, [plan, activeTask]);

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
      recordEvent({ type: "plan_week_complete", week: String(plan.week) });
    }
  }

  function resetWeek() {
    clearLockedWeek(plan.week);
    for (const t of plan.tasks) clearPracticeTimer(plan.week, t.id);
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
    <div className="space-y-8 sm:space-y-10">
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
            <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">{plan.focus}</p>
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

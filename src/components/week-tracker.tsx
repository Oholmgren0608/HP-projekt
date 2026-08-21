"use client";

import { useEffect, useMemo, useState } from "react";
import { PracticeSession, practiceKindsLabel } from "@/components/practice-session";
import { Progress } from "@/components/ui/progress";
import { WEEKLY_PLANS, sectionLabel, type StudyTask } from "@/lib/study-plan";

const STORAGE_KEY = "hp-studieplan-progress-v2";
const SCORES_KEY = "hp-studieplan-scores-v1";

type ProgressMap = Record<string, boolean>;
type ScoreMap = Record<string, { correct: number; total: number; at: string }>;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function taskKey(week: number, taskId: string) {
  return `w${week}:${taskId}`;
}

export function WeekTracker() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [scores, setScores] = useState<ScoreMap>({});
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadJson(STORAGE_KEY, {}));
    setScores(loadJson(SCORES_KEY, {}));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  }, [scores, ready]);

  const plan = WEEKLY_PLANS.find((w) => w.week === activeWeek) ?? WEEKLY_PLANS[0];
  const activeTask = plan.tasks.find((t) => t.id === activeTaskId) ?? null;

  const { done, total, percent } = useMemo(() => {
    const allTasks = WEEKLY_PLANS.flatMap((w) =>
      w.tasks.map((t) => taskKey(w.week, t.id)),
    );
    const doneCount = allTasks.filter((k) => progress[k]).length;
    return {
      done: doneCount,
      total: allTasks.length,
      percent: allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0,
    };
  }, [progress]);

  const weekDone = plan.tasks.filter((t) => progress[taskKey(plan.week, t.id)]).length;

  function markComplete(task: StudyTask, result: { correct: number; total: number }) {
    const key = taskKey(plan.week, task.id);
    setProgress((prev) => ({ ...prev, [key]: true }));
    setScores((prev) => ({
      ...prev,
      [key]: { ...result, at: new Date().toISOString() },
    }));
    setActiveTaskId(null);
  }

  function resetWeek() {
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
    return (
      <PracticeSession
        task={activeTask}
        week={plan.week}
        onClose={() => setActiveTaskId(null)}
        onComplete={(result) => markComplete(activeTask, result)}
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
            className="text-sm text-[var(--ink-muted)] underline-offset-4 transition hover:text-[var(--ink)] hover:underline"
          >
            Nollställ vecka {activeWeek}
          </button>
        </div>
        <Progress value={percent} className="h-2 bg-[var(--mist)]" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Välj vecka">
        {WEEKLY_PLANS.map((w) => {
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
              className={`shrink-0 rounded-md border px-3 py-2 text-left transition ${
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

      <div className="rounded-xl border border-[var(--line)] bg-white/70 p-5 shadow-[0_12px_40px_-28px_rgba(18,42,48,0.45)] backdrop-blur-sm sm:p-6">
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
            return (
              <li key={task.id}>
                <div
                  className={`rounded-lg border px-3 py-3 sm:px-4 ${
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
                        {score
                          ? ` · Senaste resultat ${score.correct}/${score.total}`
                          : null}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTaskId(task.id)}
                          className="rounded-md bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                          {checked ? "Öva igen" : "Starta övning"}
                        </button>
                        {checked && score ? (
                          <span className="self-center text-xs text-[var(--ink-muted)]">
                            Klar · {score.correct}/{score.total}
                          </span>
                        ) : (
                          <span className="self-center text-xs text-[var(--ink-muted)]">
                            Markeras klar efter {task.minutes} min i passet
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

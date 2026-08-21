"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { WEEKLY_PLANS, sectionLabel, type StudyTask } from "@/lib/study-plan";

const STORAGE_KEY = "hp-studieplan-progress-v1";

type ProgressMap = Record<string, boolean>;

function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function taskKey(week: number, taskId: string) {
  return `w${week}:${taskId}`;
}

export function WeekTracker() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [activeWeek, setActiveWeek] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, ready]);

  const plan = WEEKLY_PLANS.find((w) => w.week === activeWeek) ?? WEEKLY_PLANS[0];

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

  function toggle(task: StudyTask) {
    const key = taskKey(plan.week, task.id);
    setProgress((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function resetWeek() {
    setProgress((prev) => {
      const next = { ...prev };
      for (const t of plan.tasks) {
        delete next[taskKey(plan.week, t.id)];
      }
      return next;
    });
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {WEEKLY_PLANS.map((w) => {
          const selected = w.week === activeWeek;
          const wDone = w.tasks.filter((t) => progress[taskKey(w.week, t.id)]).length;
          return (
            <button
              key={w.week}
              type="button"
              onClick={() => setActiveWeek(w.week)}
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
          </div>
          <p className="rounded-md bg-[var(--mist)] px-3 py-1.5 text-sm text-[var(--ink)]">
            {weekDone}/{plan.tasks.length} klara
          </p>
        </div>

        <ul className="space-y-3">
          {plan.tasks.map((task) => {
            const key = taskKey(plan.week, task.id);
            const checked = Boolean(progress[key]);
            return (
              <li
                key={task.id}
                className={`flex gap-3 rounded-lg border px-3 py-3 transition sm:px-4 ${
                  checked
                    ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]/50"
                    : "border-[var(--line)] bg-[var(--paper)]"
                }`}
              >
                <Checkbox
                  id={key}
                  checked={checked}
                  onCheckedChange={() => toggle(task)}
                  className="mt-1"
                  aria-label={task.title}
                />
                <label htmlFor={key} className="min-w-0 flex-1 cursor-pointer">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-medium ${checked ? "text-[var(--ink-muted)] line-through" : "text-[var(--ink)]"}`}
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
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DailySrsReview } from "@/components/daily-srs-review";
import { usePlan } from "@/components/plan-context";
import { ProgressPanel } from "@/components/progress-panel";
import { useHydrated } from "@/lib/use-hydrated";
import { formatNorm } from "@/lib/hp-scores";
import {
  WEEK_PROGRESS_EVENT,
  findNextIncomplete,
  loadWeekProgress,
  weekProgressSummary,
  type ProgressMap,
} from "@/lib/week-progress";

export function DashboardHome() {
  const { plan, ready } = usePlan();
  const [progress, setProgress] = useState<ProgressMap>(loadWeekProgress);
  const mounted = useHydrated();

  useEffect(() => {
    const refresh = () => setProgress(loadWeekProgress());
    window.addEventListener(WEEK_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WEEK_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!ready || !mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-white/70" />
      </div>
    );
  }

  const next = findNextIncomplete(plan.weeklyPlans, progress);
  const summary = weekProgressSummary(plan.weeklyPlans, progress);
  const { profile, focusIds } = plan;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Dagens pass
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Vad du ska göra nu
        </h1>
        <p className="mt-2 max-w-xl text-[var(--ink-muted)]">
          Snitt {formatNorm(profile.overall)} · {summary.done}/{summary.total} uppgifter klara (
          {summary.percent} %).
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] sm:p-6">
        {next ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Vecka {next.week} · ~{next.task.minutes} min
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {next.task.title}
            </h2>
            <p className="mt-2 text-[var(--ink-muted)]">{next.task.detail}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/plan?week=${next.week}&start=${encodeURIComponent(next.task.id)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Starta övning
              </Link>
              <Link
                href="/plan"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-white px-5 text-sm font-medium text-[var(--ink)] hover:border-[var(--ink-soft)]"
              >
                Hela veckoplanen
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Alla uppgifter är klara
            </h2>
            <p className="mt-2 text-[var(--ink-muted)]">
              Bra jobbat. Repetera med flashcards, mini-prov eller öva en uppgift igen.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/ova"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:brightness-110"
              >
                Öva flashcards
              </Link>
              <Link
                href="/prov"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-white px-5 text-sm font-medium text-[var(--ink)]"
              >
                Mini-prov
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-4">
          <p className="text-sm text-[var(--ink-muted)]">Kvant / verbal</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {formatNorm(profile.previousQuant)} · {formatNorm(profile.previousVerbal)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-4 sm:col-span-2">
          <p className="text-sm text-[var(--ink-muted)]">Fokus just nu</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {focusIds.slice(0, 3).map((id) => (
              <span
                key={id}
                className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--ink)]"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      </section>

      <DailySrsReview />

      <ProgressPanel compact />
    </div>
  );
}

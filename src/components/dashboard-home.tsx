"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Timer } from "lucide-react";
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
import { XpBar } from "@/components/gamification/xp-bar";
import { StreakCard } from "@/components/gamification/streak-card";
import { DailyQuests } from "@/components/gamification/daily-quests";
import { AchievementsPanel } from "@/components/gamification/achievements-panel";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "God natt";
  if (h < 10) return "God morgon";
  if (h < 17) return "God dag";
  return "God kväll";
}

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
      <div className="space-y-8 sm:space-y-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-40 animate-pulse rounded-[10px] bg-[var(--mist)]" />
        <div className="h-28 animate-pulse rounded-[10px] bg-[var(--mist)]" />
      </div>
    );
  }

  const next = plan ? findNextIncomplete(plan.weeklyPlans, progress) : null;
  const summary = plan ? weekProgressSummary(plan.weeklyPlans, progress) : null;
  const profile = plan?.profile ?? null;
  const focusIds = plan?.focusIds ?? [];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ---- Hjältesektion -------------------------------------------------- */}
      <section>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[13px] font-medium text-[var(--ink-muted)]">
              {greeting()} · {plan ? "Dagens pass" : "Ditt HP-läge"}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              {plan ? "Vad du ska göra nu" : "Kom igång med din HP-plan"}
            </h1>
            {profile && summary ? (
              <p className="mt-2 max-w-xl font-medium text-[var(--ink-muted)]">
                Snitt {formatNorm(profile.overall)} · {summary.done}/{summary.total} uppgifter klara (
                {summary.percent} %).
              </p>
            ) : (
              <p className="mt-2 max-w-xl font-medium text-[var(--ink-muted)]">
                Gör nivåtestet eller mata in dina senaste resultat — då byggs en personlig
                veckoplan från din nivå.
              </p>
            )}
          </div>
          <XpBar />
        </div>
      </section>

      {/* ---- Onboarding för nya användare ------------------------------------ */}
      {!plan && (
        <section className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-lg">
              <h2 className="font-[family-name:var(--font-display)] font-semibold text-lg">
                Ny här? Kom igång på 2 minuter
              </h2>
              <p className="mt-1 text-[var(--ink-muted)]">
                Gör nivåtestet eller mata in tidigare resultat — så byggs din veckoplan.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/nivatest"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
                >
                  <Play className="size-4" fill="currentColor" />
                  Gör nivåtestet
                </Link>
                <Link
                  href="/resultat"
                  className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
                >
                  Mata in resultat
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---- Uppdrag + dagens pass (utan plan: streak-kortet i ledig ruta) --- */}
      <section className="grid items-stretch gap-5 lg:gap-6 lg:grid-cols-2">
        <DailyQuests />

        {plan ? <NextTaskCard next={next} /> : <StreakCard />}
      </section>

      {/* ---- Streak + statistik ---------------------------------------------- */}
      {plan && profile ? (
        <section className="grid items-stretch gap-5 lg:gap-6 lg:grid-cols-[auto_1fr]">
          <div className="lg:w-72">
            <StreakCard />
          </div>
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
              <p className="text-sm font-semibold text-[var(--ink-muted)]">Kvant / verbal</p>
              <p className="mt-1 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
                {formatNorm(profile.previousQuant)} · {formatNorm(profile.previousVerbal)}
              </p>
            </div>
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
              <p className="text-sm font-semibold text-[var(--ink-muted)]">Fokus just nu</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {focusIds.slice(0, 3).map((id) => (
                  <span
                    key={id}
                    className="rounded-md bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-foreground)]"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <DailySrsReview />

      <AchievementsPanel />

      <ProgressPanel compact />
    </div>
  );
}


/** Dagens pass-kortet. `next === null` betyder att alla uppgifter är klara. */
function NextTaskCard({ next }: { next: ReturnType<typeof findNextIncomplete> }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft sm:p-6">
      {next ? (
        <>
          <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink-muted)]">
            Vecka {next.week}
            <span className="flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold tracking-normal text-[var(--accent-foreground)]">
              <Timer className="size-3" />~{next.task.minutes} min
            </span>
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
            {next.task.title}
          </h2>
          <p className="mt-2 font-medium text-[var(--ink-muted)]">{next.task.detail}</p>
          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <Link
              href={`/plan?week=${next.week}&start=${encodeURIComponent(next.task.id)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-pop "
            >
              Starta övning
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/plan"
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-transparent px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] "
            >
              Hela veckoplanen
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
            Alla uppgifter är klara
          </h2>
          <p className="mt-2 font-medium text-[var(--ink-muted)]">
            Bra jobbat! Repetera med flashcards, kör ett mini-prov eller utmana någon i en duell.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <Link
              href="/ova"
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-primary-foreground shadow-soft transition "
            >
              Öva flashcards
            </Link>
            <Link
              href="/duell"
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] "
            >
              Spela en duell ⚔️
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

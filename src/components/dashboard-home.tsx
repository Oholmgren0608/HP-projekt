"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
  const { plan, ready, hasSavedScores } = usePlan();
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
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--mist)]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[var(--mist)]" />
      </div>
    );
  }

  const next = findNextIncomplete(plan.weeklyPlans, progress);
  const summary = weekProgressSummary(plan.weeklyPlans, progress);
  const { profile, focusIds } = plan;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ---- Hjältesektion -------------------------------------------------- */}
      <section>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--brand)] uppercase">
              {greeting()} · Dagens pass
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              Vad du ska göra nu
            </h1>
            <p className="mt-2 max-w-xl font-semibold text-[var(--ink-muted)]">
              Snitt {formatNorm(profile.overall)} · {summary.done}/{summary.total} uppgifter klara (
              {summary.percent} %).
            </p>
          </div>
          <XpBar />
        </div>
      </section>

      {/* ---- Onboarding för nya användare ------------------------------------ */}
      {!hasSavedScores && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,var(--brand),var(--brand-deep))] p-6 text-primary-foreground shadow-pop sm:p-8"
        >
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-lg">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
                Ny här? Kom igång på 2 minuter
              </h2>
              <p className="mt-2 font-semibold text-primary-foreground/85">
                Gör nivåtestet eller mata in dina tidigare resultat — så bygger jag din personliga
                veckoplan direkt.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/nivatest"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-5 text-sm font-extrabold text-[var(--brand)] shadow-soft transition hover:scale-[1.03] active:scale-95"
                >
                  <Play className="size-4" fill="currentColor" />
                  Gör nivåtestet
                </Link>
                <Link
                  href="/resultat"
                  className="inline-flex min-h-11 items-center rounded-full border border-primary-foreground/40 px-5 text-sm font-extrabold text-primary-foreground transition hover:bg-primary-foreground/10 active:scale-95"
                >
                  Mata in resultat
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ---- Uppdrag + dagens pass ------------------------------------------- */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        <DailyQuests />

        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft sm:p-6">
          {next ? (
            <>
              <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-[var(--brand)] uppercase">
                Vecka {next.week}
                <span className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-extrabold tracking-normal text-[var(--accent-foreground)]">
                  <Timer className="size-3" />~{next.task.minutes} min
                </span>
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {next.task.title}
              </h2>
              <p className="mt-2 font-semibold text-[var(--ink-muted)]">{next.task.detail}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <Link
                  href={`/plan?week=${next.week}&start=${encodeURIComponent(next.task.id)}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--brand),var(--brand-deep))] px-6 text-sm font-extrabold text-primary-foreground shadow-soft transition hover:scale-[1.03] hover:shadow-pop active:scale-95"
                >
                  Starta övning
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/plan"
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] bg-transparent px-5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--mist)] active:scale-95"
                >
                  Hela veckoplanen
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Alla uppgifter är klara 🎉
              </h2>
              <p className="mt-2 font-semibold text-[var(--ink-muted)]">
                Bra jobbat! Repetera med flashcards, kör ett mini-prov eller utmana någon i en duell.
              </p>
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <Link
                  href="/ova"
                  className="inline-flex min-h-11 items-center rounded-full bg-[linear-gradient(120deg,var(--brand),var(--brand-deep))] px-6 text-sm font-extrabold text-primary-foreground shadow-soft transition hover:scale-[1.03] active:scale-95"
                >
                  Öva flashcards
                </Link>
                <Link
                  href="/duell"
                  className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--mist)] active:scale-95"
                >
                  Spela en duell ⚔️
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---- Streak + statistik ---------------------------------------------- */}
      <section className="grid items-stretch gap-5 lg:gap-6 lg:grid-cols-[auto_1fr]">
        <div className="lg:w-72">
          <StreakCard />
        </div>
        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
            <p className="text-sm font-bold text-[var(--ink-muted)]">Kvant / verbal</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {formatNorm(profile.previousQuant)} · {formatNorm(profile.previousVerbal)}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
            <p className="text-sm font-bold text-[var(--ink-muted)]">Fokus just nu</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {focusIds.slice(0, 3).map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-bold text-[var(--accent-foreground)]"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DailySrsReview />

      <AchievementsPanel />

      <ProgressPanel compact />
    </div>
  );
}

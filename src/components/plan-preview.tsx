"use client";

import { Lock, Timer } from "lucide-react";
import { LoginPanel } from "@/components/auth/login-panel";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { buildPlanPreview, hasStoredSession, planAccess, type PlanAccess } from "@/lib/plan-access";
import { sectionLabel, type WeekPlan } from "@/lib/study-plan";
import { useHydrated } from "@/lib/use-hydrated";
import { loadWeekProgress } from "@/lib/week-progress";

/** Får användaren se hela veckoplanen, bara förhandsvisningen, eller vet vi inte än? */
export function usePlanAccess(): PlanAccess {
  const { user, loading } = useAuth();
  const hydrated = useHydrated();
  if (!hydrated) return "loading";
  return planAccess({
    supabaseConfigured: isSupabaseConfigured(),
    authLoading: loading,
    signedIn: user !== null,
    storedSession: hasStoredSession(),
  });
}

/**
 * Förhandsvisningen för gäster: vecka 1 att läsa (inte bocka av), resten av
 * veckorna som låsta rubriker och vägen in.
 */
export function PlanPreview({ weeklyPlans }: { weeklyPlans: readonly WeekPlan[] }) {
  const preview = buildPlanPreview(weeklyPlans);
  // Framsteg från innan spärren fanns ligger kvar i webbläsaren och följer
  // med till kontot vid inloggning.
  const hasLocalProgress = Object.values(loadWeekProgress()).some(Boolean);
  if (!preview) return null;
  const { firstWeek, lockedWeeks, lockedTaskCount } = preview;

  return (
    <section className="space-y-6" aria-labelledby="plan-preview-heading">
      <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-5 sm:p-6">
        <p className="text-[13px] font-medium text-[var(--ink-muted)]">
          Förhandsvisning · {firstWeek.phase} · Vecka {firstWeek.week}
        </p>
        <h2
          id="plan-preview-heading"
          className="mt-1 font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]"
        >
          {firstWeek.theme}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{firstWeek.focus}</p>
        <ul className="mt-5 space-y-3">
          {firstWeek.tasks.map((task) => (
            <li key={task.id} className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
                <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent-foreground)]">
                  {sectionLabel(task.section)}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="size-3" aria-hidden />~{task.minutes} min
                </span>
              </div>
              <p className="mt-2 font-medium text-[var(--ink)]">{task.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{task.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      {lockedWeeks.length > 0 ? (
        <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-5 sm:p-6">
          <h3 className="text-sm font-medium text-[var(--ink)]">
            {lockedWeeks.length} veckor till · {lockedTaskCount} uppgifter
          </h3>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {lockedWeeks.map((w) => (
              <li key={w.week} className="flex items-center gap-3 py-2.5 text-sm">
                <Lock className="size-4 shrink-0 text-[var(--ink-muted)]" aria-hidden />
                <span className="font-medium text-[var(--ink)]">Vecka {w.week}</span>
                <span className="text-[var(--ink-muted)]">
                  {w.phase} · {w.theme}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
        <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg text-[var(--ink)]">
          Logga in för hela veckoplanen
        </h3>
        <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">
          Med ett konto följer du planen vecka för vecka och bockar av uppgifterna. Dina
          framsteg sparas på kontot och följer med mellan dator och mobil. Övningarna,
          nivåtestet och resultaten fungerar som vanligt utan konto.
        </p>
        <div className="mt-5 max-w-md">
          <LoginPanel
            note={
              hasLocalProgress
                ? "Logga in för att behålla dina framsteg i veckoplanen."
                : undefined
            }
          />
        </div>
      </div>
    </section>
  );
}

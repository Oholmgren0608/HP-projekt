"use client";

import Link from "next/link";
import { useState } from "react";
import { Disclosure } from "@/components/disclosure";
import { PriorityBadge } from "@/components/plan-badges";
import { usePlan } from "@/components/plan-context";
import { PlanPreview, usePlanAccess } from "@/components/plan-preview";
import { StudyDaysPicker, useStudyDays } from "@/components/study-days";
import { StudyTimeNotice } from "@/components/study-time-notice";
import { WeekTracker } from "@/components/week-tracker";
import { currentPlanWeek, formatDateLong, formatWeekRange, planWeekRange, todayKey, weeksLeft } from "@/lib/exam-date";

export function PlanView() {
  const { plan, scores, ready } = usePlan();
  const access = usePlanAccess();
  const [studyDays, setStudyDays] = useStudyDays();
  const [sessionOpen, setSessionOpen] = useState(false);

  if (!ready || access === "loading") {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-48 animate-pulse rounded-[10px] bg-card" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            Ingen veckoplan än
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
            Veckoplanen byggs från dina resultat. Gör nivåtestet på några minuter,
            eller fyll i dina senaste HP-poäng för hand.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/nivatest"
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-primary-foreground shadow-soft transition "
            >
              Gör nivåtestet
            </Link>
            <Link
              href="/resultat"
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--mist)] "
            >
              Mata in resultat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { profile, sections, strategy, dailyTemplate } = plan;
  const preview = access === "preview";
  const today = todayKey();
  const examDate = scores?.examDate;
  const left = examDate ? weeksLeft(examDate, today) : null;
  const nowWeek = examDate && scores?.planStart ? currentPlanWeek(scores.planStart, examDate, today) : null;

  // Planen lägger upp ca 80 % av den angivna veckotiden (resten är repetition
  // och oförutsett) — visa summan så att den inte behöver gissas.
  const plannedMinutes = plan.weeklyPlans.reduce(
    (sum, week) => sum + week.tasks.reduce((weekSum, task) => weekSum + task.minutes, 0),
    0,
  );
  const plannedHoursPerWeek = plan.weeklyPlans.length
    ? (plannedMinutes / plan.weeklyPlans.length / 60).toFixed(1).replace(".", ",")
    : "0";

  return (
    <div className="space-y-10">
      {!sessionOpen ? (
        <div>
          <p className="text-[13px] text-[var(--ink-muted)]">
            {examDate && left !== null
              ? `Provet ${formatDateLong(examDate)} · ${left === 0 ? "provet har varit" : `${left} ${left === 1 ? "vecka" : "veckor"} kvar`} · ${profile.hoursPerWeek} h/vecka`
              : `${profile.weeksUntilExam} veckor · ${profile.hoursPerWeek} h/vecka`}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            Veckoplan
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
            {preview
              ? `Byggd från dina resultat · ca ${plannedHoursPerWeek} h planerad träning per vecka. Här ser du vecka 1 — logga in för hela planen.`
              : `Byggs om från dina resultat · ca ${plannedHoursPerWeek} h planerad träning per vecka · framstegen sparas på ditt konto.`}
          </p>
          {!examDate ? (
            <p className="mt-3 max-w-xl text-sm text-[var(--ink)]">
              <Link href="/resultat" className="font-medium text-[var(--brand)] underline-offset-4 hover:underline">
                Välj ditt provdatum
              </Link>{" "}
              så följer veckorna kalendern och planen visar vilken vecka det är nu.
            </p>
          ) : nowWeek === 0 && scores?.planStart ? (
            <p className="mt-3 max-w-xl text-sm text-[var(--ink)]">
              Planen täcker de sista 16 veckorna före provet och börjar{" "}
              {formatWeekRange(planWeekRange(scores.planStart, 1))}. Du kan börja på vecka 1 redan nu.
            </p>
          ) : null}
          {!preview ? (
            <StudyDaysPicker
              days={studyDays}
              onChange={setStudyDays}
              minutesPerDay={
                plan.weeklyPlans.length
                  ? Math.round(plannedMinutes / plan.weeklyPlans.length / studyDays.length)
                  : null
              }
            />
          ) : null}
        </div>
      ) : null}

      {!sessionOpen ? <StudyTimeNotice /> : null}

      {preview ? (
        <PlanPreview weeklyPlans={plan.weeklyPlans} />
      ) : (
        <WeekTracker onSessionChange={setSessionOpen} />
      )}

      {!sessionOpen ? (
        <>
          <Disclosure title="Strategin i korthet">
            <div className="grid gap-5 sm:grid-cols-2">
              {strategy.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[10px] border border-[var(--line)] bg-card p-5"
                >
                  <h3 className="text-lg font-medium text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-[var(--ink-muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </Disclosure>

          <Disclosure
            title="En vanlig studiedag"
            subtitle="Justeras när du sparar nya resultat."
          >
            <ol className="space-y-4">
              {dailyTemplate.map((row, i) => (
                <li
                  key={row.slot}
                  className="grid gap-1 border-b border-background/15 pb-4 last:border-0 last:pb-0 sm:grid-cols-[14rem_1fr] sm:gap-6"
                >
                  <span className="text-sm font-medium text-background/70">
                    {i + 1}. {row.slot}
                  </span>
                  <span className="text-background/90">{row.item}</span>
                </li>
              ))}
            </ol>
          </Disclosure>

          <section>
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
              Delprov — vad du gör med varje
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
              Prioritet och veckomål följer dina resultat. Läs mer under{" "}
              <Link
                href="/tips"
                className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
              >
                Tips
              </Link>
              .
            </p>
            <div className="mt-6 space-y-4">
              {sections.map((section) => {
                const score = /(\d+\/\d+)/.exec(section.scoreLabel)?.[0];
                return (
                  <Disclosure
                    key={`${section.id}-${section.name}`}
                    title={section.name}
                    hint={
                      <span className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={section.priority} />
                        {score ? (
                          <span className="text-sm text-[var(--ink-muted)]">{score}</span>
                        ) : null}
                      </span>
                    }
                  >
                    <p className="text-sm font-medium text-[var(--ink)]">{section.scoreLabel}</p>
                    <p className="mt-2 text-[var(--ink-muted)]">{section.why}</p>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {section.methods.map((m) => (
                        <li
                          key={m}
                          className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ink-muted)]" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm font-medium text-[var(--ink)]">
                      Veckans mål:{" "}
                      <span className="font-normal text-[var(--ink-muted)]">
                        {section.weeklyGoal}
                      </span>
                    </p>
                  </Disclosure>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

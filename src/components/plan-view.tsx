"use client";

import Link from "next/link";
import { useState } from "react";
import { PriorityBadge } from "@/components/plan-badges";
import { usePlan } from "@/components/plan-context";
import { StudyTimeNotice } from "@/components/study-time-notice";
import { WeekTracker } from "@/components/week-tracker";

export function PlanView() {
  const { plan, ready, adaptEnabled, setAdaptEnabled } = usePlan();
  const [sessionOpen, setSessionOpen] = useState(false);

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-48 animate-pulse rounded-2xl bg-card/70" />
      </div>
    );
  }

  const { profile, sections, strategy, dailyTemplate } = plan;

  return (
    <div className="space-y-10">
      {!sessionOpen ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            {profile.weeksUntilExam} veckor · {profile.hoursPerWeek} h/vecka
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            Veckoplan
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
            Byggs om från dina resultat. Starta varje uppgift direkt — progress
            sparas i webbläsaren.
          </p>
          <label className="mt-4 flex max-w-xl cursor-pointer items-start gap-3 rounded-xl border border-[var(--line-strong)] bg-card/70 px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--brand)]"
              checked={adaptEnabled}
              onChange={(e) => setAdaptEnabled(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-[var(--ink)]">
                Anpassa kommande veckor efter övningstrend
              </span>
              <span className="mt-0.5 block text-sm text-[var(--ink-muted)]">
                Av som standard. Slås på först när minst tre pass på samma
                delprov pekar åt samma håll — ett enstaka pass flyttar inte
                planen.
              </span>
            </span>
          </label>
          {adaptEnabled && plan.adaptedFromPractice ? (
            <p className="mt-3 max-w-xl text-sm text-[var(--ink)]">
              Kommande veckor är justerade efter en konsekvent övningstrend.
              Påbörjade veckor är oförändrade.
            </p>
          ) : null}
        </div>
      ) : null}

      {!sessionOpen ? <StudyTimeNotice /> : null}

      <WeekTracker onSessionChange={setSessionOpen} />

      {!sessionOpen ? (
        <>
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Strategin i korthet
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {strategy.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[var(--line)] bg-card/70 p-5"
                >
                  <h3 className="text-lg font-semibold text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-[var(--ink-muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-foreground p-5 text-background sm:p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              En vanlig studiedag
            </h2>
            <p className="mt-3 max-w-2xl text-background/70">
              Mall efter dina flaskhalsar — justeras när du sparar nya resultat.
            </p>
            <ol className="mt-6 space-y-4">
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
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Delprov — vad du gör med varje
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
              Prioritet och veckomål följer dina senaste resultat. Mer om hur du
              tar dig upp finns under{" "}
              <Link
                href="/tips"
                className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
              >
                Tips
              </Link>
              .
            </p>
            <div className="mt-6 space-y-4">
              {sections.map((section) => (
                <article
                  key={`${section.id}-${section.name}`}
                  className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                      {section.name}
                    </h3>
                    <PriorityBadge priority={section.priority} />
                    <span className="text-sm text-[var(--ink-muted)]">
                      {section.scoreLabel}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl text-[var(--ink-muted)]">
                    {section.why}
                  </p>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {section.methods.map((m) => (
                      <li
                        key={m}
                        className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lagoon-ink)]" />
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
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

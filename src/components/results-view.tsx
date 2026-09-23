"use client";

import Link from "next/link";
import { ScoreBar } from "@/components/plan-badges";
import { usePlan } from "@/components/plan-context";
import { ProgressPanel } from "@/components/progress-panel";
import { ScoreForm } from "@/components/score-form";
import { StudyTimeNotice } from "@/components/study-time-notice";
import { pct } from "@/lib/format";

export function ResultsView() {
  const { plan, ready } = usePlan();

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-56 animate-pulse rounded-2xl bg-card/70" />
      </div>
    );
  }

  const { profile, delprovScores, timeSplit } = plan;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Resultat
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Poäng och prognos
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Fyll i norm och råpoäng per delprov. När du sparar byggs prioritering,
          tidsfördelning och {profile.weeksUntilExam}-veckorsplan om.
        </p>
        <p className="mt-3 rounded-lg border border-[var(--line)] bg-card/70 px-4 py-3 text-sm text-[var(--ink-muted)]">
          Ny på HP eller osäker på dina poäng?{" "}
          <Link
            href="/nivatest"
            className="font-medium text-[var(--brand)] hover:underline"
          >
            Gör ett nivåtest
          </Link>{" "}
          så fyller vi i poängen åt dig utifrån resultatet.
        </p>
      </div>

      <StudyTimeNotice />

      <section className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Mata in dina HP-resultat
        </h2>
        <div className="mt-6">
          <ScoreForm />
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Delprov — prioritering
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Sorterat efter var tiden ger mest utifrån dina inmatade poäng.
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {(
            [
              { title: "Verbala", block: "verbal" as const },
              { title: "Kvantitativa", block: "kvant" as const },
            ] as const
          ).map((group) => (
            <div key={group.block}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {delprovScores
                  .filter((s) => s.block === group.block)
                  .slice()
                  .sort((a, b) => a.correct / a.total - b.correct / b.total)
                  .map((s) => {
                    const p = pct(s.correct, s.total);
                    return (
                      <li
                        key={s.id}
                        className="rounded-2xl border border-[var(--line)] bg-card/70 px-4 py-3"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            <span className="font-semibold text-[var(--ink)]">
                              {s.id}
                            </span>
                            <span className="ml-2 text-sm text-[var(--ink-muted)]">
                              {s.name}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                            {s.correct}/{s.total} · {p}%
                          </span>
                        </div>
                        <ScoreBar correct={s.correct} total={s.total} />
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Tidfördelning (~{profile.hoursPerWeek} h/vecka)
        </h2>
        {timeSplit.length === 0 ? (
          <p className="mt-4 rounded-xl border border-[var(--line)] bg-card/70 px-4 py-3 text-sm text-[var(--ink-muted)]">
            Alla delprov ligger på samma nivå — ingen enskild del behöver extra
            tid. Fördela tiden jämnt över delarna.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {timeSplit.map((t) => (
              <li
                key={t.label}
                className="rounded-2xl border border-[var(--line)] bg-card/70 px-3 py-4 text-center"
              >
                <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {t.pct}%
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--ink)]">
                  {t.label}
                </div>
                <div className="text-xs text-[var(--ink-muted)]">{t.note}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProgressPanel />
    </div>
  );
}

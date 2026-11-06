"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatNorm } from "@/lib/hp-scores";
import type { WeekSummary } from "@/lib/week-summary";

/** Söndagens veckoavstämning på översikten. */
export function WeekSummaryCard({ summary }: { summary: WeekSummary }) {
  const { week, tasksDone, tasksTotal, questions, correctPercent, normBefore, normNow, next } = summary;
  const moved =
    normBefore !== null && normNow !== null && normNow !== normBefore
      ? `${formatNorm(normBefore)} → ${formatNorm(normNow)}`
      : normNow !== null
        ? formatNorm(normNow)
        : null;

  return (
    <section
      aria-labelledby="week-summary-heading"
      className="rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft sm:p-6"
    >
      <p className="text-[13px] font-medium text-[var(--ink-muted)]">Veckoavstämning · vecka {week}</p>
      <h2
        id="week-summary-heading"
        className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]"
      >
        Så gick veckan
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-[var(--ink-muted)]">Pass klara</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">
            {tasksDone}/{tasksTotal}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-[var(--ink-muted)]">Frågor</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">
            {questions}
            {correctPercent !== null ? (
              <span className="ml-1 text-sm font-normal text-[var(--ink-muted)]">· {correctPercent} % rätt</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-[var(--ink-muted)]">Prognos</dt>
          <dd className="mt-1 font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">
            {moved ?? "–"}
          </dd>
        </div>
      </dl>
      {moved === null ? (
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          Prognosen visas när du har svarat på minst 10 frågor i ett delprov.
        </p>
      ) : null}
      {next ? (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <p className="text-sm font-medium text-[var(--ink)]">
            Nästa vecka: {next.theme}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{next.focus}</p>
          <Link
            href={`/plan?week=${next.week}`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Se vecka {next.week}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
          Det här var planens sista vecka. Lycka till på provet!
        </p>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Disclosure } from "@/components/disclosure";
import { ProgressChart } from "@/components/progress-chart";
import { usePlan } from "@/components/plan-context";
import { useHydrated } from "@/lib/use-hydrated";
import { formatNorm } from "@/lib/hp-scores";
import { kindBadge } from "@/lib/practice";
import {
  HISTORY_EVENT,
  PROGNOSIS_MIN_KIND_QUESTIONS,
  chartPoints,
  estimateNormFromPercent,
  loadHistory,
  prognosisFromExercises,
  rollingPace,
  rollingQuizPercent,
  shouldSuggestNewPlan,
  type ExercisePrognosis,
  type HistoryEvent,
} from "@/lib/progress-history";
import {
  MIXED_SEC_PER_QUESTION_CAP,
  formatSecondsPerQuestion,
} from "@/lib/practice-pace";

function load(): HistoryEvent[] {
  return loadHistory();
}

export function ProgressPanel({ compact = false }: { compact?: boolean }) {
  const { plan } = usePlan();
  const [events, setEvents] = useState<HistoryEvent[]>(load);
  const mounted = useHydrated();

  useEffect(() => {
    const refresh = () => setEvents(load());
    window.addEventListener(HISTORY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(HISTORY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
        <p className="text-sm text-[var(--ink-muted)]">Laddar historik…</p>
      </div>
    );
  }

  const savedOverall = plan.profile.overall;
  const points = chartPoints(events);
  const prognosis = prognosisFromExercises(events);
  const verbal = rollingQuizPercent(events, "verbal");
  const quant = rollingQuizPercent(events, "quant");
  const estimated = prognosis ? estimateNormFromPercent(prognosis.percent) : null;
  const suggest = shouldSuggestNewPlan(savedOverall, events);
  const quizCount = events.filter((e) => e.type === "quiz").length;
  const pace = rollingPace(events);
  const paceOver = pace ? pace.secPerQ > MIXED_SEC_PER_QUESTION_CAP : false;
  const paceLine = pace ? (
    <p className={`mt-3 text-sm ${paceOver ? "font-medium text-[var(--destructive)]" : "text-[var(--ink-muted)]"}`}>
      Tempo {formatSecondsPerQuestion(pace.secPerQ)}/fråga
      {paceOver
        ? ` — över taket ${formatSecondsPerQuestion(MIXED_SEC_PER_QUESTION_CAP)} (HP 55 min / 40 frågor).`
        : ` (tak ${formatSecondsPerQuestion(MIXED_SEC_PER_QUESTION_CAP)}).`}{" "}
      {pace.n} tidsatta frågor.
      {paceOver ? (
        <>
          {" "}
          <Link href="/tips" className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline">
            Se tips →
          </Link>
        </>
      ) : null}
    </p>
  ) : null;

  const numbers = (
    <div className="flex flex-wrap items-end gap-8">
      <div>
        <p className="text-sm text-[var(--ink-muted)]">Inmatad norm</p>
        <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {formatNorm(savedOverall)}
        </p>
      </div>
      <div>
        <p className="text-sm text-[var(--ink-muted)]">Uppskattning från övningar</p>
        <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {estimated !== null ? formatNorm(estimated) : "—"}
        </p>
      </div>
    </div>
  );

  const suggestBanner = suggest ? (
    <div className="mt-4 rounded-lg border border-[var(--brand)]/40 bg-[var(--accent-soft)] px-4 py-3">
      <p className="text-sm font-medium text-[var(--ink)]">
        Övningsnivån skiljer sig från din inmatade norm. Skapa en ny plan från uppdaterade resultat.
      </p>
      <Link
        href="/resultat"
        className="mt-2 inline-block text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
      >
        Uppdatera resultat →
      </Link>
    </div>
  ) : null;

  const card = (
    <div className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
        Poängprognos
      </p>
      <div className="mt-4">{numbers}</div>
      {prognosis === null && quizCount > 0 ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Prognos visas när du svarat på minst {PROGNOSIS_MIN_KIND_QUESTIONS} frågor i ett
          delprov.
        </p>
      ) : null}
      {suggestBanner}
      <ProgressChart points={points} compact />
      <p className="mt-3 text-sm text-[var(--ink-muted)]">
        {quizCount === 0
          ? "Inga övningar loggade än."
          : `${quizCount} övningspass · verbal ${verbal ? `${verbal.percent} %` : "—"} · kvant ${quant ? `${quant.percent} %` : "—"}`}
      </p>
      {paceLine}
    </div>
  );

  if (compact) {
    return (
      <Disclosure
        title="Poängprognos"
        subtitle={`Inmatad norm ${formatNorm(savedOverall)} · uppskattning ${
          estimated !== null ? formatNorm(estimated) : "—"
        }`}
        bodyClassName="px-3 pb-3 pt-3"
      >
        {card}
      </Disclosure>
    );
  }

  return (
    <Disclosure
      title="Poängprognos"
      subtitle="Inmatad norm, uppskattning från övningar och dina senaste pass."
      bodyClassName="px-3 pb-3 pt-3"
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Uppskattad poängprognos
          </p>
          <div className="mt-4">{numbers}</div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            Prognosen är en grov omräkning från råprocent i appens övningar — inte UHR:s officiella
            normeringstabell. Den uppdateras bara när du svarat på minst{" "}
            {PROGNOSIS_MIN_KIND_QUESTIONS} frågor i ett delprov — fler svar ger stabilare siffror.
          </p>
          <PrognosisThresholdChips prognosis={prognosis} />
          {suggestBanner}
          <ProgressChart points={points} />
        </div>

        <aside className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Senaste övningar
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-5">
            <div>
              <dt className="text-sm text-[var(--ink-muted)]">Verbalt</dt>
              <dd className="text-xl font-semibold text-[var(--ink)]">
                {verbal ? `${verbal.percent} %` : "—"}
              </dd>
              {verbal ? (
                <p className="text-xs text-[var(--ink-muted)]">{verbal.n} frågor</p>
              ) : null}
            </div>
            <div>
              <dt className="text-sm text-[var(--ink-muted)]">Kvant</dt>
              <dd className="text-xl font-semibold text-[var(--ink)]">
                {quant ? `${quant.percent} %` : "—"}
              </dd>
              {quant ? (
                <p className="text-xs text-[var(--ink-muted)]">{quant.n} frågor</p>
              ) : null}
            </div>
          </dl>
          <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-muted)]">
            {quizCount === 0
              ? "Inga övningar loggade än."
              : `${quizCount} övningspass sparade i webbläsaren.`}
          </p>
          {paceLine ?? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Tid per fråga kräver ett tidsatt pass.
            </p>
          )}
        </aside>
      </div>

    </Disclosure>
  );
}

const PROGNOSIS_KIND_ORDER = [
  "ord",
  "mek",
  "las",
  "elf",
  "dtk",
  "xyz",
  "kva",
  "nog",
] as const;

/** Visar hur många frågor som besvarats per delprov — grönt = räknas in i prognosen. */
function PrognosisThresholdChips({ prognosis }: { prognosis: ExercisePrognosis | null }) {
  const byKind = prognosis?.byKind ?? {};
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {PROGNOSIS_KIND_ORDER.map((kind) => {
        const n = Math.floor(byKind[kind]?.total ?? 0);
        const reached = n >= PROGNOSIS_MIN_KIND_QUESTIONS;
        return (
          <span
            key={kind}
            title={
              reached
                ? `${kindBadge(kind)} räknas in i prognosen`
                : `${PROGNOSIS_MIN_KIND_QUESTIONS - n} frågor kvar innan ${kindBadge(kind)} räknas in`
            }
            className={`rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums ${
              reached
                ? "border-[var(--lagoon-ink)]/50 bg-[var(--lagoon-ink)]/10 text-[var(--ink)]"
                : "border-[var(--line)] bg-card/60 text-[var(--ink-muted)]"
            }`}
          >
            {kindBadge(kind)} {n}/{PROGNOSIS_MIN_KIND_QUESTIONS}
          </span>
        );
      })}
    </div>
  );
}


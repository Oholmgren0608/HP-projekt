"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
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
    <p className={`mt-3 text-sm ${paceOver ? "font-medium text-[#9a3412]" : "text-[var(--ink-muted)]"}`}>
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

  if (compact) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
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
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] sm:p-6">
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

      <aside className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Senaste övningar
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4">
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
            ? "Inga övningar loggade än. Starta ett pass i veckoplanen så syns historiken här."
            : `${quizCount} övningspass sparade i webbläsaren.`}
        </p>
        {paceLine ?? (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Tid per fråga visas när du avslutat ett tidsatt pass.
          </p>
        )}
      </aside>
    </div>
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
                ? "border-[var(--lagoon)]/50 bg-[var(--lagoon)]/10 text-[var(--ink)]"
                : "border-[var(--line)] bg-white/60 text-[var(--ink-muted)]"
            }`}
          >
            {kindBadge(kind)} {n}/{PROGNOSIS_MIN_KIND_QUESTIONS}
          </span>
        );
      })}
    </div>
  );
}

function ProgressChart({
  points,
  compact = false,
}: {
  points: { at: string; value: number; label: string }[];
  compact?: boolean;
}) {
  if (points.length < 2) {
    return (
      <p className="mt-5 text-sm text-[var(--ink-muted)]">
        Grafen visas när du har minst två mätpunkter (sparade resultat eller avslutade övningar).
      </p>
    );
  }

  const w = 560;
  const h = compact ? 100 : 140;
  const pad = 22;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map((p) => pad + (1 - p.value / 2) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${w} ${h}`} className={`${compact ? "h-24" : "h-36"} w-full`} role="img" aria-label="Norm över tid">
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <text x={4} y={pad + 4} className="fill-[var(--ink-muted)] text-[10px]">
          2,0
        </text>
        <text x={4} y={h - pad} className="fill-[var(--ink-muted)] text-[10px]">
          0
        </text>
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
        {xs.map((x, i) => (
          <circle
            key={`${points[i].at}-${i}`}
            cx={x}
            cy={ys[i]}
            r={4}
            fill={points[i].label === "inmatad" ? "var(--ink)" : "var(--lagoon)"}
          />
        ))}
      </svg>
      <p className="text-xs text-[var(--ink-muted)]">
        Svart = inmatad norm · grön = uppskattning från övning
      </p>
    </div>
  );
}

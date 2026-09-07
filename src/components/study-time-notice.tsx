"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan-context";
import { recommendStudyTime } from "@/lib/study-time-recommendation";
import type { StudyTimeVerdict } from "@/lib/study-time-recommendation";
import { sectionShort } from "@/lib/subtests";

export function StudyTimeNotice() {
  const { scores, ready, hasSavedScores } = usePlan();
  if (!ready || !hasSavedScores) return null;
  const verdict = recommendStudyTime(scores);
  return <NoticeBody verdict={verdict} />;
}

function NoticeBody({ verdict }: { verdict: StudyTimeVerdict }) {
  const {
    status,
    recommendedMin,
    recommendedMax,
    currentHours,
    bottlenecks,
    summary,
  } = verdict;

  const tone =
    status === "insufficient"
      ? {
          border: "border-[#9a3412]/30",
          bg: "bg-[#fff7f3]",
          title: "text-[#9a3412]",
          icon: "⚠️",
        }
      : status === "tight"
        ? {
            border: "border-[var(--accent)]/30",
            bg: "bg-[var(--accent-soft)]/60",
            title: "text-[var(--ink)]",
            icon: "⏳",
          }
        : {
            border: "border-[var(--lagoon)]/40",
            bg: "bg-[var(--accent-soft)]/60",
            title: "text-[var(--ink)]",
            icon: "✓",
          };

  return (
    <section
      className={`rounded-2xl border ${tone.border} ${tone.bg} px-4 py-4 sm:px-5`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${tone.title}`}>
            {tone.icon} Hinner du med din studietid?
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {summary}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Rekommenderad tid
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {recommendedMin}–{recommendedMax}{" "}
            <span className="text-base text-[var(--ink-muted)]">h/vecka</span>
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            du anger {Math.round(currentHours)} h/vecka
          </p>
        </div>
      </div>

      {bottlenecks.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Flaskhalsar
          </span>
          {bottlenecks.map((b) => (
            <Link
              key={b.id}
              href={`/tips?section=${b.id}`}
              className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[var(--ink)] ring-1 ring-[var(--line)] hover:ring-[var(--ink-soft)]"
            >
              {sectionShort(b.id)} {b.percent} %
            </Link>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Detta är en rekommendation utifrån dina resultat och din tidsram — du
        bestämmer själv hur mycket tid du lägger.
      </p>
    </section>
  );
}

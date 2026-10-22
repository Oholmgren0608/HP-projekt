"use client";

import { formatClock } from "@/lib/practice-timer";
import { sectionLabel, type StudyTask } from "@/lib/study-plan";

type Props = {
  task: StudyTask;
  /** Aktiv övningstid som krävs för att markera klar (task.minutes är planerad tid). */
  requiredMinutes: number;
  checked: boolean;
  score?: { correct: number; total: number };
  bankedMin: number;
  inProgressQuiz: boolean;
  onStart: () => void;
};

/**
 * Ren presentational rad för en veckouppgift. Ingen storage-/timer-I/O här —
 * all data beräknas av WeekTracker och skickas in som props.
 */
export function WeekTaskRow({
  task,
  requiredMinutes,
  checked,
  score,
  bankedMin,
  inProgressQuiz,
  onStart,
}: Props) {
  return (
    <li>
      <div
        className={`rounded-xl border px-3 py-3 sm:px-4 ${
          checked
            ? "border-[var(--brand)]/30 bg-[var(--accent-soft)]/50"
            : "border-[var(--line)] bg-[var(--paper)]"
        }`}
      >
        <div className="flex flex-wrap items-start gap-3">
          <span
            aria-hidden
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
              checked
                ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                : "border-[var(--line)] bg-card text-transparent"
            }`}
          >
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-medium ${checked ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"}`}
              >
                {task.title}
              </span>
              <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                {sectionLabel(task.section)}
              </span>
              <span className="text-xs text-[var(--ink-muted)]">~{task.minutes} min</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
              {task.detail}
            </p>
            {(score || (!checked && bankedMin > 0)) && (
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {[
                  score ? `Senaste resultat ${score.correct}/${score.total}` : null,
                  !checked && bankedMin > 0 ? `Sparad tid ${bankedMin}/${requiredMinutes} min (pausad)` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                {checked
                  ? "Öva igen (nya frågor)"
                  : inProgressQuiz
                    ? "Fortsätt övning"
                    : "Starta övning"}
              </button>
              {checked && score ? (
                <span className="self-center text-xs text-[var(--ink-muted)]">
                  Klar · {score.correct}/{score.total}
                </span>
              ) : (
                <span className="self-center text-xs text-[var(--ink-muted)]">
                  {bankedMin > 0
                    ? `Aktiv tid ${formatClock(bankedMin * 60)} / ${requiredMinutes} min`
                    : `Markeras klar efter ${requiredMinutes} min aktiv övning`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

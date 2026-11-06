"use client";

import { formatDateLong, upcomingExamDates, weeksLeft } from "@/lib/exam-date";

/**
 * Provdatum: snabbval för kommande högskoleprov och ett datumfält för andra
 * datum. `today` skickas in så att komponenten renderar samma sak på servern
 * och klienten.
 */
export function ExamDateField({
  value,
  today,
  onChange,
  invalid = false,
  className = "",
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  const upcoming = upcomingExamDates(today);
  const left = today && value && value >= today ? weeksLeft(value, today) : null;

  return (
    <fieldset className={`space-y-2 ${className}`}>
      <legend className="text-sm font-medium text-[var(--ink)]">Provdatum</legend>
      {upcoming.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {upcoming.map((exam) => (
            <button
              key={exam.date}
              type="button"
              aria-pressed={value === exam.date}
              onClick={() => onChange(exam.date)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition ${
                value === exam.date
                  ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                  : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
              }`}
            >
              <span className="block font-medium">{exam.label}</span>
              <span className="block text-xs">{formatDateLong(exam.date)}</span>
            </button>
          ))}
        </div>
      ) : null}
      <input
        type="date"
        min={today}
        value={value}
        aria-label="Annat provdatum"
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 dark:[color-scheme:dark] ${
          invalid ? "border-[var(--destructive)]" : ""
        }`}
      />
      <p className="text-xs text-[var(--ink-muted)]">
        {left !== null
          ? `${left} ${left === 1 ? "vecka" : "veckor"} kvar. Planen täcker högst de sista 16 veckorna.`
          : "Välj ett kommande prov eller ett eget datum."}
      </p>
    </fieldset>
  );
}

"use client";

export type QuizProgressProps = {
  /** Täljare i förloppet (t.ex. antal besvarade eller aktuell fråga). */
  current: number;
  total: number;
  /** Animera breddövergången. Default true (matchar referensen). */
  transition?: boolean;
};

/** Presentational förloppsindikator för ett quiz. */
export function QuizProgress({ current, total, transition = true }: QuizProgressProps) {
  const width = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
      <div
        className={`h-full rounded-full bg-[var(--accent)] ${transition ? "transition-all" : ""}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

"use client";

export type QuizOptionsProps = {
  /** Stabil nyckelprefix, t.ex. frågans id. */
  questionId: string;
  options: string[];
  /** Index för det valda/klickade alternativet. */
  selected: number | null;
  /** Anropas med alternativets index när användaren väljer (quiz-läge). */
  onSelect?: (index: number) => void;
  /** Inaktiverar alternativknapparna (quiz-läge). */
  disabled?: boolean;
  /**
   * När detta anges renderas listan i genomgångsläge: rätt alternativ markeras
   * grönt och ett felaktigt valt alternativ rött. `selected` tolkas då som
   * användarens valda svar.
   */
  correctIndex?: number;
  ariaLabel?: string;
};

/**
 * Presentational optionslista för ett quiz. I quiz-läge är alternativen
 * klickbara radio-knappar; i genomgångsläge (när `correctIndex` anges) visas
 * rätt/fel-markering utan interaktion.
 */
export function QuizOptions({
  questionId,
  options,
  selected,
  onSelect,
  disabled,
  correctIndex,
  ariaLabel = "Svarsalternativ",
}: QuizOptionsProps) {
  const isReview = correctIndex !== undefined;

  return (
    <div
      className="space-y-2"
      role={isReview ? "list" : "radiogroup"}
      aria-label={isReview ? undefined : ariaLabel}
    >
      {options.map((opt, i) => {
        if (isReview) {
          const isCorrect = i === correctIndex;
          const isChosen = selected === i;
          return (
            <div
              key={`${questionId}-${i}`}
              role="listitem"
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 sm:px-4 ${
                isCorrect
                  ? "border-[var(--lagoon)]/40 bg-white"
                  : isChosen
                    ? "border-[#9a3412]/30 bg-white"
                    : "border-[var(--line)] bg-white/70"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCorrect
                    ? "border-[var(--lagoon)] bg-[var(--lagoon)] text-white"
                    : isChosen
                      ? "border-[#9a3412] bg-[#9a3412] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink-muted)]"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-[var(--ink)]">{opt}</span>
            </div>
          );
        }

        const active = selected === i;
        return (
          <button
            key={`${questionId}-${i}`}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect?.(i)}
            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-muted)]"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-[var(--ink)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

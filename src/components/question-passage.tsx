import { DtkFigure } from "@/components/dtk-figure";
import { dtkFigureFor } from "@/lib/content/dtk-figures";
import { cn } from "@/lib/utils";

/**
 * Frågans underlag. Har texten en DTK-figur (tabell, diagram eller karta)
 * visas figuren i stället för texten; annars visas texten som tidigare.
 */
export function QuestionPassage({
  passage,
  className,
  textClassName,
  showSource = false,
}: {
  passage?: string | null;
  /** Avstånd runt underlaget, gäller både figur och text. */
  className?: string;
  /** Rutan runt texten när underlaget saknar figur. */
  textClassName?: string;
  /** Visa även källtexten under figuren (för granskning på /review). */
  showSource?: boolean;
}) {
  if (!passage) return null;
  const figure = dtkFigureFor(passage);

  if (!figure) {
    return <div className={cn("whitespace-pre-wrap", className, textClassName)}>{passage}</div>;
  }

  return (
    <div className={className}>
      <DtkFigure figure={figure} />
      {showSource ? (
        <details className="mt-2 text-xs text-[var(--ink-muted)]">
          <summary className="cursor-pointer">Källtext i frågebanken</summary>
          <p className={cn("mt-1 whitespace-pre-wrap", textClassName)}>{passage}</p>
        </details>
      ) : null}
    </div>
  );
}

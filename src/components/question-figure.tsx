"use client";

/**
 * Renderar `question.figureUrl` som en bild när den finns (DTK-diagram,
 * formler m.m.). Vanlig <img> i stället för next/image: figure_url är en
 * godtycklig URL-sträng (Supabase Storage, men i teorin vilken host som
 * helst) och vi vill inte riskera att en host som inte står i remotePatterns
 * kraschar bygget/sidan. Därför stängs next/no-img-element av lokalt.
 *
 * Figurerna ur UHR:s prov (`/uhr/…`, utklippta ur provhäftet) visas i full
 * bredd – en DTK-sida har små tal som inte går att läsa i en liten ruta – och
 * kan öppnas i full storlek för att zooma på mobilen.
 */
export function QuestionFigure({
  question,
  position,
}: {
  /** Allt som behövs är bilden; spelpoolens frågor har inget facit på klienten. */
  question: { figureUrl?: string | null };
  /** 1-baserad position i frågesetet, används i alt-texten om frågenummer saknas. */
  position?: number;
}) {
  if (!question.figureUrl) return null;

  const alt = position !== undefined ? `Figur till fråga ${position}` : "Figur till fråga";

  if (question.figureUrl.startsWith("/uhr/")) {
    return (
      <figure className="my-3">
        {/* Ett tryck på bilden öppnar den i full storlek, där den går att zooma på mobilen. */}
        <a href={question.figureUrl} target="_blank" rel="noopener" aria-label={`${alt}, öppna i full storlek`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.figureUrl}
            alt={alt}
            loading="lazy"
            className="h-auto w-auto max-w-full rounded-lg border border-[var(--line)] bg-white dark:brightness-[0.92]"
          />
        </a>
        <figcaption className="mt-1 text-xs">
          <a
            href={question.figureUrl}
            target="_blank"
            rel="noopener"
            className="text-[var(--brand)] underline-offset-2 hover:underline"
          >
            Öppna figuren i full storlek
          </a>
        </figcaption>
      </figure>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={question.figureUrl}
      alt={alt}
      loading="lazy"
      className="my-3 max-h-96 w-auto max-w-full rounded-lg border border-[var(--line)] bg-card object-contain"
    />
  );
}

"use client";

import type { ChoiceQuestion } from "@/lib/practice-types";

/**
 * Renderar `question.figureUrl` som en bild när den finns (DTK-diagram,
 * formler m.m.). Vanlig <img> i stället för next/image: figure_url är en
 * godtycklig URL-sträng (Supabase Storage, men i teorin vilken host som
 * helst) och vi vill inte riskera att en host som inte står i remotePatterns
 * kraschar bygget/sidan. Därför stängs next/no-img-element av lokalt.
 */
export function QuestionFigure({
  question,
  position,
}: {
  question: ChoiceQuestion;
  /** 1-baserad position i frågesetet, används i alt-texten om frågenummer saknas. */
  position?: number;
}) {
  if (!question.figureUrl) return null;

  const alt = position !== undefined ? `Figur till fråga ${position}` : "Figur till fråga";

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

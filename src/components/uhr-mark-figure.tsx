"use client";

import { useEffect, useState } from "react";
import { loadUhrMarks, marksToSvg, type UhrMarks } from "@/lib/content/uhr-marks";

/**
 * Bildförklaring till en UHR-frågas facit: frågans bild ur provhäftet med markeringar
 * ovanpå och en kort bildtext. Visar ingenting förrän markeringarna har hämtats, eller
 * om frågan saknar dem.
 */
export function UhrMarkFigure({ questionId }: { questionId: string }) {
  const [marks, setMarks] = useState<{ id: string; data: UhrMarks | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadUhrMarks(questionId).then((data) => {
      if (!cancelled) setMarks({ id: questionId, data });
    });
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const m = marks?.id === questionId ? marks.data : null;
  if (!m) return null;

  return (
    <figure className="mt-3">
      {/* Samma storlek som frågans bild (QuestionFigure): naturlig storlek, högst full bredd. */}
      <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-[var(--line)] bg-white align-top dark:brightness-[0.92]">
        {/* eslint-disable-next-line @next/next/no-img-element -- samma statiska UHR-bild som i frågan */}
        <img src={m.image} alt="" width={m.width} height={m.height} loading="lazy" className="block h-auto max-w-full" />
        <svg
          viewBox={`0 0 ${m.width} ${m.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 size-full"
          // Markeringarna kommer ur appens egna, kontrollerade filer och texten är XML-escapad.
          dangerouslySetInnerHTML={{ __html: marksToSvg(m) }}
        />
      </div>
      <figcaption className="mt-1 text-xs text-[var(--ink-muted)]">Bildförklaring · {m.caption}</figcaption>
    </figure>
  );
}

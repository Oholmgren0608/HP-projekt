"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronsRight } from "lucide-react";

/**
 * Rullbar ruta för en DTK-tabell. Den går att fokusera, så piltangenterna
 * scrollar den, och när tabellen är bredare än rutan (oftast på mobil) visas
 * en kort hint under den. Annars ser en avklippt kolumn ut som ett kortare tal.
 */
export function DtkTableScroll({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={ref} className="overflow-x-auto" tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      {overflows ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--ink-muted)]">
          <ChevronsRight className="size-3.5" strokeWidth={1.5} aria-hidden />
          Svep i sidled för att se alla kolumner
        </p>
      ) : null}
    </>
  );
}

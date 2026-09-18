"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SECTION_TIPS } from "@/lib/section-tips";
import { sectionShort } from "@/lib/subtests";

export function TipsView() {
  const params = useSearchParams();
  const highlight = params.get("section")?.toUpperCase() ?? "";

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(highlight);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlight]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Metoder
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Tips per delprov
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Vad varje del testar, vanliga fel, tempo och konkreta övningsråd. Prioritet i veckoplanen
          kommer från dina poäng — här är hur du tar dig upp.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Hoppa till delprov">
        {SECTION_TIPS.map((tip) => (
          <a
            key={tip.id}
            href={`#${tip.id}`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              highlight === tip.id
                ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                : "border-[var(--line)] bg-white/70 text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {sectionShort(tip.id)}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {SECTION_TIPS.map((tip) => (
          <article
            key={tip.id}
            id={tip.id}
            className={`scroll-mt-24 rounded-2xl border bg-white/75 p-5 sm:p-6 ${
              highlight === tip.id
                ? "border-[var(--brand)]"
                : "border-[var(--line)]"
            }`}
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {tip.title}
            </h2>
            <p className="mt-3 leading-relaxed text-[var(--ink-muted)]">{tip.tests}</p>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Vanliga fel
            </h3>
            <ul className="mt-2 space-y-2">
              {tip.mistakes.map((m) => (
                <li key={m} className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a3412]" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 rounded-lg bg-[var(--mist)] px-3 py-2 text-sm text-[var(--ink)]">
              <span className="font-semibold">Tempo: </span>
              {tip.tempo}
            </p>

            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Öva så här
            </h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--ink-soft)]">
              {tip.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}

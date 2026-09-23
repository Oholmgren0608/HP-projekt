"use client";

import { useMemo, useState } from "react";
import { Disclosure } from "@/components/disclosure";
import { usePersistentState } from "@/lib/use-persistent-state";
import { recordEvent } from "@/lib/gamification/engine";
import {
  LIBRARY_TEXTS,
  READING_PROGRESS_KEY,
  type LibraryText,
  type ReadMap,
} from "@/lib/reading-library";

export function ReadingLibrary() {
  const [activeId, setActiveId] = useState(LIBRARY_TEXTS[0]?.id ?? "");
  const [read, setRead, ready] = usePersistentState<ReadMap>(
    READING_PROGRESS_KEY,
    {},
  );
  const [summary, setSummary] = useState("");

  const text = useMemo(
    () => LIBRARY_TEXTS.find((t) => t.id === activeId) ?? LIBRARY_TEXTS[0],
    [activeId],
  );

  const doneCount = LIBRARY_TEXTS.filter((t) => read[t.id]).length;

  function selectText(next: LibraryText) {
    setActiveId(next.id);
    setSummary("");
  }

  // "Läst"-markeringar och räknare kommer från localStorage — rendera inget
  // förrän hydrering är klar, annars mismatchar SSR- och klient-HTML.
  if (!ready) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
        <p className="text-sm text-[var(--ink-muted)]">Laddar läsbibliotek…</p>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-[var(--ink-muted)]">
          {doneCount}/{LIBRARY_TEXTS.length} texter lästa
        </p>
      </div>

      <div className="grid gap-5 lg:gap-6 lg:grid-cols-[17rem_1fr]">
        <Disclosure
          title="Välj text"
          subtitle={`${LIBRARY_TEXTS.length} texter`}
          hint={
            <span className="max-w-[12rem] truncate rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
              {text.title}
            </span>
          }
          className="lg:self-start"
        >
          <div className="space-y-2.5">
            {LIBRARY_TEXTS.map((item) => {
              const selected = item.id === text.id;
              const done = Boolean(read[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectText(item)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                      : "border-[var(--line-strong)] bg-card/70 hover:border-[var(--ink-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[var(--ink)]">{item.title}</span>
                    {done ? (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--lagoon-ink)]">
                        Läst
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-[var(--ink-muted)]">
                    {item.kind} · ~{item.minutes} min
                  </div>
                </button>
              );
            })}
          </div>
        </Disclosure>

        <article className="rounded-2xl border border-[var(--line)] bg-card/80 p-5 shadow-[0_16px_40px_-28px_rgba(18,42,48,0.4)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            {text.kind} · ~{text.minutes} min
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            {text.title}
          </h3>
          <p className="mt-2 text-[var(--ink-muted)]">{text.teaser}</p>

          <div className="mt-6 space-y-4">
            {text.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-[17px] leading-relaxed text-[var(--ink-soft)]">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 grid gap-5 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)]">ORD att plocka</h4>
              <ul className="mt-3 space-y-2.5">
                {text.focusWords.map((w) => (
                  <li key={w.word} className="text-sm leading-relaxed">
                    <span className="font-semibold text-[var(--ink)]">{w.word}</span>
                    <span className="text-[var(--ink-muted)]"> — {w.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--ink)]">Konnektorer i texten</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {text.connectors.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-[var(--mist)] px-2 py-1 text-xs font-medium text-[var(--ink-soft)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <h4 className="mt-5 text-sm font-semibold text-[var(--ink)]">Efter läsning</h4>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{text.summaryPrompt}</p>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                aria-label="Din sammanfattning"
                className="mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
                placeholder="Skriv din sammanfattning här…"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (!read[text.id]) recordEvent({ type: "reading_done" });
                setRead((prev) => ({ ...prev, [text.id]: true }));
              }}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Markera som läst
            </button>
            {read[text.id] ? (
              <button
                type="button"
                onClick={() =>
                  setRead((prev) => {
                    const next = { ...prev };
                    delete next[text.id];
                    return next;
                  })
                }
                className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-muted)]"
              >
                Avmarkera
              </button>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

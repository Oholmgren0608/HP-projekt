"use client";

import { useEffect, useState } from "react";
import { kindBadge, type PracticeKind } from "@/lib/practice";
import {
  SRS_EVENT,
  dueCards,
  reviewSrsCard,
  type SrsCard,
} from "@/lib/error-srs";

export function DailySrsReview() {
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  function refresh() {
    setCards(dueCards());
  }

  useEffect(() => {
    refresh();
    setMounted(true);
    const onChange = () => refresh();
    window.addEventListener(SRS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SRS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!mounted) return null;

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Dagens repetition
        </p>
        <p className="mt-3 text-[var(--ink-muted)]">
          Inga felkort förfaller idag. Missade quizfrågor blir kort med ett datum för nästa
          repetition — de dyker upp här när de är due.
        </p>
        {done > 0 ? (
          <p className="mt-2 text-sm font-medium text-[var(--ink)]">
            Bra — {done} kort repetade den här sessionen.
          </p>
        ) : null}
      </div>
    );
  }

  const card = cards[0];

  function grade(remembered: boolean) {
    reviewSrsCard(card.id, remembered);
    setDone((n) => n + 1);
    setRevealed(false);
    setCards(dueCards());
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.4)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Dagens repetition
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {cards.length} felkort att repetera
          </h3>
        </div>
        <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
          {kindBadge(card.kind as PracticeKind)}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Enkel spaced repetition (SM-2-liknande). Kommer ihåg → längre intervall; glömt → i morgon.
      </p>

      {card.passage ? (
        <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {card.passage}
        </div>
      ) : null}

      <p className={`text-lg font-medium text-[var(--ink)] ${card.passage ? "mt-4" : "mt-5"}`}>
        {card.front}
      </p>

      {revealed ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg border border-[var(--lagoon)]/30 bg-[#eef8f6] px-4 py-3 text-[var(--ink)]">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Rätt svar
            </span>
            {card.back}
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{card.explain}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => grade(false)}
              className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--ink-soft)]"
            >
              Glömt — igen i morgon
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:brightness-110"
            >
              Kommer ihåg
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--ink-soft)]"
        >
          Visa svar
        </button>
      )}
    </div>
  );
}

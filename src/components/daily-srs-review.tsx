"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { recordEvent } from "@/lib/gamification/engine";
import { kindBadge, type PracticeKind } from "@/lib/practice";
import {
  SRS_EVENT,
  dueCards,
  reviewSrsCard,
  type SrsCard,
} from "@/lib/error-srs";

export function DailySrsReview() {
  const [cards, setCards] = useState<SrsCard[]>(dueCards);
  const mounted = useHydrated();
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(0);

  function refresh() {
    setCards(dueCards());
  }

  useEffect(() => {
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
      <div className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
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
  const options = card.options ?? [];
  const hasOptions = options.length > 0;
  const chosenText = selected !== null ? options[selected] : null;
  const pickedCorrect = chosenText !== null && chosenText === card.back;

  function grade(remembered: boolean) {
    recordEvent({ type: "srs_review", count: 1 });
    reviewSrsCard(card.id, remembered);
    setDone((n) => n + 1);
    setRevealed(false);
    setSelected(null);
    setCards(dueCards());
  }

  function pickOption(index: number) {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.4)] sm:p-6">
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
        {hasOptions
          ? "Välj det alternativ du tror är rätt. Sedan: kommer du ihåg, eller behöver du se kortet igen i morgon."
          : "Visa svaret, sedan om du kommer ihåg eller behöver se kortet igen i morgon."}
      </p>

      {card.passage ? (
        <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {card.passage}
        </div>
      ) : null}

      <p className={`text-lg font-medium text-[var(--ink)] ${card.passage ? "mt-4" : "mt-5"}`}>
        {card.front}
      </p>

      {hasOptions ? (
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Svarsalternativ">
          {options.map((opt, i) => {
            const isCorrect = opt === card.back;
            const isChosen = selected === i;
            const showResult = revealed;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isChosen && !isCorrect;

            return (
              <button
                key={`${card.id}-${i}`}
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={revealed}
                onClick={() => pickOption(i)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition disabled:opacity-100 sm:px-4 ${
                  showCorrect
                    ? "border-[var(--lagoon-ink)]/40 bg-[var(--accent-soft)]"
                    : showWrong
                      ? "border-[var(--destructive)]/30 bg-[var(--coral-soft)]"
                      : revealed
                        ? "cursor-default border-[var(--line-strong)] bg-[var(--paper)]"
                        : "border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    showCorrect
                      ? "border-[var(--lagoon-ink)] bg-[var(--lagoon-ink)] text-primary-foreground"
                      : showWrong
                        ? "border-[var(--destructive)] bg-[var(--destructive)] text-primary-foreground"
                        : "border-[var(--line)] bg-card text-[var(--ink-muted)]"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-[var(--ink)]">{opt}</span>
                {showCorrect ? (
                  <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--lagoon-ink)]">
                    Rätt
                  </span>
                ) : null}
                {showWrong ? (
                  <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--destructive)]">
                    Fel
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {revealed ? (
        <div className="mt-4 space-y-3">
          {hasOptions && selected !== null ? (
            <p className="text-sm font-medium text-[var(--ink)]">
              {pickedCorrect ? "Rätt — du valde rätt alternativ." : "Fel — du valde fel alternativ."}
            </p>
          ) : null}
          <p className="rounded-lg border border-[var(--lagoon-ink)]/30 bg-[var(--accent-soft)] px-4 py-3 text-[var(--ink)]">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Rätt svar
            </span>
            {card.back}
          </p>
          <div className="text-sm leading-relaxed text-[var(--ink-soft)]">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              Förklaring
            </span>
            <p className="mt-1 whitespace-pre-wrap">{card.explain}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => grade(false)}
              className="rounded-md border border-[var(--line-strong)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--ink-soft)]"
            >
              Glömt — igen i morgon
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground hover:brightness-110"
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

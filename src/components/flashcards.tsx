"use client";

import { useMemo, useState } from "react";
import { usePersistentState } from "@/lib/use-persistent-state";
import { getQuestionBankSync } from "@/lib/content/questions-provider";
import { useQuestions } from "@/lib/content/use-questions";
import { recordEvent } from "@/lib/gamification/engine";
import {
  FLASHCARD_PROGRESS_KEY,
  buildAllFlashcards,
  filterDeck,
  type CardProgress,
  type DeckFilter,
  type Flashcard,
  type ProgressMap,
} from "@/lib/flashcards";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Prioritera kort du missat och outforskade kort. */
function buildQueue(deck: Flashcard[], progress: ProgressMap): Flashcard[] {
  const scored = deck.map((card) => {
    const p = progress[card.id];
    let weight = 1;
    if (!p) weight = 3;
    else if (p.last === "wrong") weight = 5;
    else if ((p.wrong ?? 0) > (p.correct ?? 0)) weight = 4;
    else if (p.last === "correct") weight = 1;
    return { card, weight };
  });
  const bag: Flashcard[] = [];
  for (const row of scored) {
    for (let i = 0; i < row.weight; i++) bag.push(row.card);
  }
  return shuffle(bag);
}

export function Flashcards() {
  const [filter, setFilter] = useState<DeckFilter>("alla");
  const [progress, setProgress, progressReady] = usePersistentState<ProgressMap>(
    FLASHCARD_PROGRESS_KEY,
    {},
  );
  const { ready: questionsReady } = useQuestions();

  // Kortleken byggs från runtime-frågebanken när den laddats (Supabase/fallback).
  const allCards = useMemo(
    () => (questionsReady ? buildAllFlashcards(getQuestionBankSync()) : []),
    [questionsReady],
  );
  const deck = useMemo(() => filterDeck(filter, allCards), [filter, allCards]);

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  // Restart the session when the deck (or filter) changes — including the
  // first time the question bank becomes ready. Adjusting state during render
  // (tracking the previous deck) avoids a setState-in-effect cascade. Progress
  // is intentionally read from the current value without reshuffling
  // mid-answer.
  const [sessionDeck, setSessionDeck] = useState<Flashcard[] | null>(null);
  if (deck !== sessionDeck) {
    setSessionDeck(deck);
    setQueue(buildQueue(deck, progress));
    setIndex(0);
    setFlipped(false);
    setSessionCorrect(0);
    setSessionWrong(0);
  }

  const hydrated = progressReady && questionsReady;

  // Kortleken blandas med slump på klienten — rendera inget förrän hydrering
  // och frågebanken är klara, annars mismatchar SSR- och klient-HTML.
  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
        <p className="text-sm text-[var(--ink-muted)]">Laddar flashcards…</p>
      </div>
    );
  }

  const card = queue[index] ?? null;
  const knownCount = Object.values(progress).filter(
    (p) => (p.correct ?? 0) > 0 && p.last === "correct",
  ).length;

  function rate(result: "correct" | "wrong") {
    if (!card) return;
    recordEvent({ type: "flashcards", count: 1 });
    const cur: CardProgress = progress[card.id] ?? { correct: 0, wrong: 0 };
    const updated: CardProgress = {
      correct: cur.correct + (result === "correct" ? 1 : 0),
      wrong: cur.wrong + (result === "wrong" ? 1 : 0),
      last: result,
    };
    const nextProgress = { ...progress, [card.id]: updated };
    setProgress(nextProgress);

    if (result === "correct") setSessionCorrect((n) => n + 1);
    else setSessionWrong((n) => n + 1);

    setFlipped(false);
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setQueue(buildQueue(deck, nextProgress));
      setIndex(0);
    } else {
      setIndex(nextIndex);
    }
  }

  function reshuffle() {
    setQueue(buildQueue(deck, progress));
    setIndex(0);
    setFlipped(false);
  }

  const filters: { id: DeckFilter; label: string }[] = [
    { id: "alla", label: `Alla (${allCards.length})` },
    { id: "ord", label: "ORD" },
    { id: "lasning", label: "Läsbibliotek" },
    { id: "konnektorer", label: "Konnektorer" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              filter === f.id
                ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--ink-muted)]">
        <p>
          Session: {sessionCorrect} rätt · {sessionWrong} fel · Deck {deck.length} kort ·{" "}
          {knownCount} senast rätt i sparad progress
        </p>
        <button
          type="button"
          onClick={reshuffle}
          className="text-[var(--brand)] underline-offset-4 hover:underline"
        >
          Blanda om
        </button>
      </div>

      {card ? (
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            className="group relative w-full rounded-2xl border border-[var(--line)] bg-white px-6 py-16 text-center shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] transition hover:border-[var(--ink-soft)]"
            aria-label={flipped ? "Visa frågesida" : "Visa svar"}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              {flipped ? "Betydelse" : "Ord"} · {card.source}
            </p>
            <p
              className={`mt-4 font-[family-name:var(--font-display)] leading-tight text-[var(--ink)] ${
                flipped ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
              }`}
            >
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-6 text-sm text-[var(--ink-muted)]">
              {flipped ? "Tryck för att dölja svaret" : "Tryck för att vända kortet"}
            </p>
          </button>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {!flipped ? (
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="inline-flex min-h-11 items-center rounded-lg bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--ink-soft)]"
              >
                Visa svar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => rate("wrong")}
                  className="inline-flex min-h-11 items-center rounded-lg border border-[#9a3412]/40 bg-[#fff7f3] px-5 text-sm font-semibold text-[#9a3412] transition hover:brightness-95"
                >
                  Fel — visa igen
                </button>
                <button
                  type="button"
                  onClick={() => rate("correct")}
                  className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Rätt — nästa
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">Inga kort i den här kategorin.</p>
      )}
    </div>
  );
}

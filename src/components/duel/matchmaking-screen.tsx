"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import {
  DUEL_MATCHMAKING_TIMEOUT_MS,
  duelModeLabel,
  type DuelMatch,
  type DuelMode,
} from "@/lib/duel/types";
import { cancelQueue, joinQueue, startBotMatch } from "@/lib/duel/matchmaking";
import { errorMessage } from "./duel-utils";

type Supabase = NonNullable<ReturnType<typeof getSupabase>>;

const COUNTDOWN_SECONDS = Math.round(DUEL_MATCHMAKING_TIMEOUT_MS / 1000);

type Props = {
  mode: DuelMode;
  onMatched: (matchId: string) => void;
  onCancel: () => void;
};

export function MatchmakingScreen({ mode, onMatched, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [startingBot, setStartingBot] = useState(false);

  const onMatchedRef = useRef(onMatched);
  const doneRef = useRef(false);

  useEffect(() => {
    onMatchedRef.current = onMatched;
  });

  // Nedräkningen har nått noll = tiden är ute. Ingen automatisk bot-match:
  // spelaren får i stället välja att möta en bot eller fortsätta söka.
  const timedOut = secondsLeft === 0;

  // Sök efter motståndare + realtid på nya matcher.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<Supabase["channel"]> | null = null;

    function finish(matchId: string) {
      if (doneRef.current) return;
      doneRef.current = true;
      onMatchedRef.current(matchId);
    }

    async function run() {
      const supabase = getSupabase();
      if (!supabase) {
        setError("Supabase är inte konfigurerat.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Du måste vara inloggad för att duellera.");
        return;
      }
      const userId = user.id;

      channel = supabase
        .channel(`duel-matching-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "duel_matches" },
          (payload) => {
            const row = payload.new as DuelMatch;
            if (
              row.status === "active" &&
              (row.player_a === userId || row.player_b === userId)
            ) {
              finish(row.id);
            }
          },
        )
        .subscribe();

      try {
        const matchId = await joinQueue(mode);
        if (cancelled) return;
        if (matchId) finish(matchId);
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "Kunde inte hitta match."));
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (channel) {
        channel.unsubscribe();
        void getSupabase()?.removeChannel(channel);
      }
    };
  }, [mode]);

  // Synlig nedräkning som tickar ner medan man söker.
  useEffect(() => {
    if (doneRef.current || timedOut) return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [timedOut]);

  function handleCancel() {
    if (!doneRef.current) {
      doneRef.current = true;
      void cancelQueue().catch(() => {});
    }
    onCancel();
  }

  async function handleStartBot() {
    if (doneRef.current || startingBot) return;
    setStartingBot(true);
    setError(null);
    try {
      const matchId = await startBotMatch(mode);
      if (!doneRef.current) {
        doneRef.current = true;
        onMatchedRef.current(matchId);
      }
    } catch (e) {
      setStartingBot(false);
      setError(errorMessage(e, "Kunde inte starta match mot bot."));
    }
  }

  function handleKeepSearching() {
    setSecondsLeft(COUNTDOWN_SECONDS);
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
        {duelModeLabel(mode)}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        {timedOut ? "Ingen motståndare hittades ännu" : "Söker motståndare…"}
      </h2>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
        <p className="text-center text-sm text-[var(--ink-muted)]">
          {timedOut
            ? "Du står kvar i kön. Vill du möta en bot istället?"
            : "Matchar dig mot en spelare på ungefär samma nivå."}
        </p>
        {timedOut ? (
          <p className="text-sm font-semibold text-[var(--ink)]">
            Sökt i över {COUNTDOWN_SECONDS} sekunder
          </p>
        ) : (
          <p className="font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--ink)]">
            {secondsLeft}
            <span className="text-base font-normal text-[var(--ink-muted)]"> s</span>
          </p>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#9a3412]/30 bg-[#fff7f3] px-4 py-3 text-sm text-[#9a3412]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={startingBot}
          onClick={() => void handleStartBot()}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            timedOut
              ? "bg-[var(--brand)] text-white hover:brightness-110"
              : "border border-[var(--line)] font-medium text-[var(--ink-muted)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          {startingBot ? "Startar…" : "Möt en bot istället"}
        </button>
        {timedOut ? (
          <button
            type="button"
            onClick={handleKeepSearching}
            className="rounded-lg border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
          >
            Fortsätt söka
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[#9a3412]/40 hover:text-[#9a3412]"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

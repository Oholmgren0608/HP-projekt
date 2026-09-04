"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import {
  DUEL_MATCHMAKING_TIMEOUT_MS,
  duelModeLabel,
  type DuelMatch,
  type DuelMode,
} from "@/lib/duel/types";
import {
  cancelQueue,
  joinQueue,
  startBotMatch,
} from "@/lib/duel/matchmaking";

type Supabase = NonNullable<ReturnType<typeof getSupabase>>;

type Props = {
  mode: DuelMode;
  onMatched: (matchId: string) => void;
  onCancel: () => void;
};

export function MatchmakingScreen({ mode, onMatched, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.round(DUEL_MATCHMAKING_TIMEOUT_MS / 1000),
  );
  const [error, setError] = useState<string | null>(null);

  const onMatchedRef = useRef(onMatched);
  const doneRef = useRef(false);

  useEffect(() => {
    onMatchedRef.current = onMatched;
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<Supabase["channel"]> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

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
        if (matchId) {
          finish(matchId);
          return;
        }

        intervalId = setInterval(
          () => setSecondsLeft((s) => Math.max(0, s - 1)),
          1000,
        );
        timeoutId = setTimeout(async () => {
          if (cancelled || doneRef.current) return;
          try {
            const botMatchId = await startBotMatch(mode);
            if (!cancelled) finish(botMatchId);
          } catch (e) {
            if (!cancelled) {
              setError(
                e instanceof Error ? e.message : "Kunde inte starta match mot bot.",
              );
            }
          }
        }, DUEL_MATCHMAKING_TIMEOUT_MS);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Kunde inte hitta match.");
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
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode]);

  function handleCancel() {
    if (!doneRef.current) {
      doneRef.current = true;
      void cancelQueue().catch(() => {});
    }
    onCancel();
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        {duelModeLabel(mode)}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Söker motståndare…
      </h2>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
        <p className="text-sm text-[var(--ink-muted)]">
          Matchar dig mot en spelare på ungefär samma nivå.
        </p>
        <p className="tabular-nums text-sm text-[var(--ink-soft)]">
          Bot om ingen hittas inom{" "}
          <span className="font-semibold text-[var(--ink)]">{secondsLeft}s</span>
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#9a3412]/30 bg-[#fff7f3] px-4 py-3 text-sm text-[#9a3412]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[var(--line)] px-5 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

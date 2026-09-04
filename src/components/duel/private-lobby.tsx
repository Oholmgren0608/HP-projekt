"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { DuelMatch } from "@/lib/duel/types";
import { cancelPrivate } from "@/lib/duel/matchmaking";

type Props = {
  code: string;
  matchId: string;
  onMatched: (matchId: string) => void;
  onCancel: () => void;
};

export function PrivateLobby({ code, matchId, onMatched, onCancel }: Props) {
  const [copied, setCopied] = useState(false);
  const doneRef = useRef(false);
  const onMatchedRef = useRef(onMatched);

  useEffect(() => {
    onMatchedRef.current = onMatched;
  });

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/duell?kod=${code}`
      : `/duell?kod=${code}`;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`duel-private-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as DuelMatch;
          if (row.status === "active" && !doneRef.current) {
            doneRef.current = true;
            onMatchedRef.current(matchId);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* klippbord ej tillgängligt */
    }
  }

  function handleCancel() {
    if (!doneRef.current) {
      doneRef.current = true;
      void cancelPrivate(matchId).catch(() => {});
    }
    onCancel();
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Privat duell
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Väntar på motståndare…
      </h2>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Matchkod</p>
          <p className="font-[family-name:var(--font-display)] text-4xl tracking-[0.2em] text-[var(--ink)]">
            {code}
          </p>
        </div>

        <div>
          <p className="text-sm text-[var(--ink-muted)]">Dela den här länken</p>
          <div className="mt-1 flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink-soft)] outline-none"
            />
            <button
              type="button"
              onClick={() => void copy()}
              className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {copied ? "Kopierad!" : "Kopiera"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
        <p className="text-sm text-[var(--ink-muted)]">
          Matchen startar när din motståndare ansluter.
        </p>
      </div>

      <div className="mt-6">
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

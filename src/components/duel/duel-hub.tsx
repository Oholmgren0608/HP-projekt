"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import {
  duelModeLabel,
  type DuelMatch,
  type DuelMode,
  type DuelProfile,
} from "@/lib/duel/types";
import {
  ensureProfile,
  getLeaderboard,
  getMatchHistory,
  getProfile,
} from "@/lib/duel/profile";
import { createPrivate, joinPrivate, startBotMatch } from "@/lib/duel/matchmaking";
import { MatchmakingScreen } from "./matchmaking-screen";
import { PrivateLobby } from "./private-lobby";
import { displayNameFromUser, errorMessage, winRate } from "./duel-utils";

type View =
  | { kind: "hub" }
  | { kind: "matchmaking"; mode: DuelMode }
  | { kind: "private"; code: string; matchId: string };

export function DuelHub({ initialCode }: { initialCode: string }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>({ kind: "hub" });
  const [profile, setProfile] = useState<DuelProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<DuelProfile[]>([]);
  const [history, setHistory] = useState<DuelMatch[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoJoinRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const displayName = displayNameFromUser(user);
    let cancelled = false;
    async function run() {
      try {
        await ensureProfile(userId, displayName);
        if (cancelled) return;
        setProfile(null);
        setLeaderboard([]);
        setHistory([]);
        setOpponentNames({});
        setError(null);
        const [p, lb, h] = await Promise.all([
          getProfile(userId),
          getLeaderboard(50),
          getMatchHistory(userId, 30),
        ]);
        if (cancelled) return;
        setProfile(p);
        setLeaderboard(lb);
        setHistory(h);
        setOpponentNames(await resolveOpponentNames(h, userId));
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, "Kunde inte ladda duell-data."));
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function joinByCode(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const matchId = await joinPrivate(code.trim());
      if (matchId) router.push(`/duell/${matchId}`);
      else setError("Ogiltig eller redan startad kod.");
    } catch (e) {
      setError(errorMessage(e, "Kunde inte gå med i duellen."));
    } finally {
      setBusy(false);
    }
  }

  // Automatisk inloggning via inbjudningslänk /duell?kod=XXXXXX.
  useEffect(() => {
    if (!initialCode || !user || autoJoinRef.current) return;
    autoJoinRef.current = true;
    void joinByCode(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, user]);

  async function handleCreatePrivate() {
    setBusy(true);
    setError(null);
    try {
      const { code, match_id } = await createPrivate();
      setView({ kind: "private", code, matchId: match_id });
    } catch (e) {
      setError(errorMessage(e, "Kunde inte skapa privat match."));
    } finally {
      setBusy(false);
    }
  }

  async function handleStartBot() {
    setBusy(true);
    setError(null);
    try {
      // Rankad bot-match: ELO påverkas med reducerad vikt (K=16).
      const matchId = await startBotMatch("ranked");
      router.push(`/duell/${matchId}`);
    } catch (e) {
      setError(errorMessage(e, "Kunde inte starta match mot bot."));
      setBusy(false);
    }
  }

  function goToMatch(matchId: string) {
    router.push(`/duell/${matchId}`);
  }

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--line)] bg-white/80 p-8 text-center shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Duellera i realtid
        </p>
        <p className="mt-2 text-[var(--ink-muted)]">
          Logga in med Google för att tävla mot andra, klättra i ranking och spara
          din matchhistorik.
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Logga in med Google
        </button>
      </div>
    );
  }

  if (view.kind === "matchmaking") {
    return (
      <MatchmakingScreen
        mode={view.mode}
        onMatched={goToMatch}
        onCancel={() => setView({ kind: "hub" })}
      />
    );
  }

  if (view.kind === "private") {
    return (
      <PrivateLobby
        code={view.code}
        matchId={view.matchId}
        onMatched={goToMatch}
        onCancel={() => setView({ kind: "hub" })}
      />
    );
  }

  const myWinRate = profile ? winRate(profile.wins, profile.losses, profile.draws) : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          PvP
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Frågedueller
        </h1>
        <p className="mt-2 max-w-xl text-[var(--ink-muted)]">
          Möt spelare på din nivå i direkta dueller — samma frågor, svara rätt och
          snabbt. {displayNameFromUser(user)}, du har{" "}
          <span className="font-semibold text-[var(--ink)]">{profile?.elo ?? 1200}</span>{" "}
          i ranking.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-[#9a3412]/30 bg-[#fff7f3] px-4 py-3 text-sm text-[#9a3412]">
          {error}
        </div>
      ) : null}

      {profile?.flagged ? (
        <div className="rounded-lg border border-[#9a3412]/30 bg-[#fff7f3] px-4 py-3 text-sm text-[#9a3412]">
          Ditt konto är under granskning på grund av upprepade negativa omdömen
          eller rapporter. Ranked-matchmaking är avstängt tills dina omdömen
          förbättrats. Casual, bot och privata dueller fungerar som vanligt.
        </div>
      ) : null}

      {/* Mina stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Ranking (ELO)" value={String(profile?.elo ?? 1200)} />
        <StatCard label="Vinster" value={String(profile?.wins ?? 0)} />
        <StatCard label="Förluster" value={String(profile?.losses ?? 0)} />
        <StatCard label="Win rate" value={`${myWinRate} %`} />
      </section>

      {/* Spellägen */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModeCard
          title="Ranked"
          description={
            profile?.flagged
              ? "Avstängt medan ditt konto är under granskning."
              : "Tävla om ELO. Vinst ger poäng, förlust drar av."
          }
          cta="Hitta match"
          disabled={busy || profile?.flagged}
          onClick={() => setView({ kind: "matchmaking", mode: "ranked" })}
        />
        <ModeCard
          title="Casual"
          description="Orankat — öva utan att din ELO påverkas."
          cta="Spela avslappnat"
          disabled={busy}
          onClick={() => setView({ kind: "matchmaking", mode: "casual" })}
        />
        <ModeCard
          title="Möt en bot"
          description="Tävla mot en AI-bot som anpassar sig efter din ELO. Påverkar ELO."
          cta="Spela mot bot"
          disabled={busy}
          onClick={() => void handleStartBot()}
        />
        <div className="flex flex-col rounded-2xl border border-[var(--line)] bg-white/75 p-5">
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Privat duell
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Utmana en vän via en matchkod eller länk.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreatePrivate()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            Skapa privat match
          </button>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="MATCHKOD"
              maxLength={6}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm uppercase tracking-widest text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || joinCode.trim().length < 6}
              onClick={() => void joinByCode(joinCode)}
              className="shrink-0 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)] disabled:opacity-50"
            >
              Gå med
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Topplista */}
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Topplista
          </h2>
          {profile === null && !error ? (
            <div className="mt-4 h-40 animate-pulse rounded-lg bg-[var(--mist)]" />
          ) : leaderboard.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">Inga spelare ännu.</p>
          ) : (
            <ol className="mt-3 divide-y divide-[var(--line)]">
              {leaderboard.map((p, i) => (
                <li key={p.user_id} className="flex items-center gap-3 py-2">
                  <span
                    className={`w-6 text-center font-semibold tabular-nums ${
                      i < 3 ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-[var(--ink)]">
                    {p.display_name}
                    {p.user_id === user.id ? " (du)" : ""}
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    {p.wins}V / {p.losses}F
                  </span>
                  <span className="w-12 text-right font-semibold tabular-nums text-[var(--ink)]">
                    {p.elo}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Historik */}
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Matchhistorik
          </h2>
          {profile === null && !error ? (
            <div className="mt-4 h-40 animate-pulse rounded-lg bg-[var(--mist)]" />
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Inga matcher ännu — dags att duellera!
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {history.map((m) => (
                <HistoryItem
                  key={m.id}
                  match={m}
                  meId={user.id}
                  opponentName={opponentNames[m.player_a === user.id ? (m.player_b ?? "") : m.player_a] ?? "Borttagen spelare"}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-4">
      <p className="text-sm text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

function ModeCard({
  title,
  description,
  cta,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--line)] bg-white/75 p-5">
      <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-1 flex-1 text-sm text-[var(--ink-muted)]">{description}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {cta}
      </button>
    </div>
  );
}

function HistoryItem({
  match,
  meId,
  opponentName,
}: {
  match: DuelMatch;
  meId: string;
  opponentName: string;
}) {
  const iAmA = match.player_a === meId;
  const myCorrect = iAmA ? match.a_correct : match.b_correct;
  const oppCorrect = iAmA ? match.b_correct : match.a_correct;
  const myDelta = iAmA ? match.elo_a_delta : match.elo_b_delta;

  const won = match.winner === meId;
  const draw = match.winner === null && match.status === "finished";

  const resultLabel = match.status === "forfeit" ? (won ? "Vinst (motståndare gav upp)" : "Förlust (gav upp)") : draw ? "Oavgjort" : won ? "Vinst" : "Förlust";
  const resultColor = won || draw ? (draw ? "text-[var(--ink-muted)]" : "text-[var(--lagoon)]") : "text-[#9a3412]";

  const date = match.finished_at
    ? new Date(match.finished_at).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })
    : "";

  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-[var(--ink-muted)]">
        {duelModeLabel(match.mode)}
      </span>
      <span className={`flex-1 truncate font-medium ${resultColor}`}>
        {resultLabel}
        <span className="ml-1 text-[var(--ink-muted)]">vs {opponentName}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[var(--ink-soft)]">
        {myCorrect ?? "–"}–{oppCorrect ?? "–"}
      </span>
      <span
        className={`w-14 shrink-0 text-right tabular-nums ${
          (myDelta ?? 0) > 0
            ? "text-[var(--lagoon)]"
            : (myDelta ?? 0) < 0
              ? "text-[#9a3412]"
              : "text-[var(--ink-muted)]"
        }`}
      >
        {myDelta != null && myDelta !== 0
          ? `${myDelta > 0 ? "+" : ""}${myDelta}`
          : "—"}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-[var(--ink-muted)]">
        {date}
      </span>
    </li>
  );
}

async function resolveOpponentNames(
  matches: DuelMatch[],
  meId: string,
): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const ids = new Set<string>();
  for (const m of matches) {
    const opp = m.player_a === meId ? m.player_b : m.player_a;
    if (opp) ids.add(opp);
  }
  if (ids.size === 0) return {};
  const { data } = await supabase
    .from("player_profiles")
    .select("user_id, display_name")
    .in("user_id", [...ids]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.user_id] = row.display_name;
  return map;
}

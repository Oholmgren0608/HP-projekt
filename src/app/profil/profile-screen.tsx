"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { AuthForms } from "@/components/auth/auth-forms";
import { getMatchHistory, getMyProfile } from "@/lib/duel/profile";
import type { DuelMatch, DuelProfile } from "@/lib/duel/types";
import { deleteAccount } from "./actions";

// ---------------------------------------------------------------------------
// Typer & hjälpare för träningsstatistik
// ---------------------------------------------------------------------------

type TrainingStats = {
  answered: number;
  accuracy: number | null; // 0-100, eller null utan data
  srsCount: number;
  srsDue: number;
  mastered: number;
  flashcardCards: number;
  quantNorm: number | null;
  verbalNorm: number | null;
};

const EMPTY_STATS: TrainingStats = {
  answered: 0,
  accuracy: null,
  srsCount: 0,
  srsDue: 0,
  mastered: 0,
  flashcardCards: 0,
  quantNorm: null,
  verbalNorm: null,
};

/** Tolkar rå lagringssträng (som själv är JSON) — {"v": "<raw>"} → objekt. */
function parseJson<T = unknown>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Normaliserar ett SRS-due-värde (YYYY-MM-DD eller ISO-tid) till en dag-nyckel. */
function toDayKey(due: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return due;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatNorm(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function initialsOf(username: string | null, email: string | null): string {
  const raw = (username ?? email ?? "").split("@")[0].trim();
  if (!raw) return "?";
  return raw.slice(0, 2).toUpperCase();
}

/** Hämtar synkad statistik från user_state, med localStorage som fallback. */
async function loadTrainingStats(userId: string): Promise<TrainingStats> {
  const keys = [
    "hp-lift-history-v1",
    "hp-lift-srs-v1",
    "hp-lift-mastered-v1",
    "hp-flashcards-progress-v1",
    "hp-lift-scores-v1",
  ];
  const values: Record<string, string> = {};

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("user_state")
        .select("storage_key, value")
        .eq("user_id", userId);
      for (const row of data ?? []) {
        if (row.value && typeof row.value.v === "string") {
          values[row.storage_key] = row.value.v;
        }
      }
    } catch {
      // fortsätt med localStorage nedan
    }
  }
  // Fallback: nycklar som saknas i molnet (t.ex. bara lokala) läses från
  // localStorage, så att anonym data räknas med även innan första synken.
  for (const key of keys) {
    if (!(key in values)) {
      const local = localStorage.getItem(key);
      if (local) values[key] = local;
    }
  }

  let answered = 0;
  let correct = 0;
  const history = parseJson<unknown[]>(values["hp-lift-history-v1"]);
  if (Array.isArray(history)) {
    for (const e of history) {
      const ev = e as { type?: string; total?: number; correct?: number };
      if (ev && ev.type === "quiz" && typeof ev.total === "number") {
        answered += ev.total;
        correct += typeof ev.correct === "number" ? ev.correct : 0;
      }
    }
  }

  let srsCount = 0;
  let srsDue = 0;
  const srs = parseJson<Record<string, unknown>>(values["hp-lift-srs-v1"]);
  if (srs && typeof srs === "object" && !Array.isArray(srs)) {
    const today = todayKey();
    for (const card of Object.values(srs)) {
      const c = card as { due?: string };
      if (c && typeof c === "object") {
        srsCount += 1;
        if (typeof c.due === "string" && toDayKey(c.due) <= today) srsDue += 1;
      }
    }
  }

  const mastered = parseJson<unknown>(values["hp-lift-mastered-v1"]);
  const masteredCount = Array.isArray(mastered) ? mastered.length : 0;

  const flashcards = parseJson<Record<string, unknown>>(
    values["hp-flashcards-progress-v1"],
  );
  const flashcardCards =
    flashcards && typeof flashcards === "object" && !Array.isArray(flashcards)
      ? Object.keys(flashcards).length
      : 0;

  const scores = parseJson<{
    quantNorm?: number;
    verbalNorm?: number;
  }>(values["hp-lift-scores-v1"]);
  const quantNorm =
    scores && typeof scores.quantNorm === "number" ? scores.quantNorm : null;
  const verbalNorm =
    scores && typeof scores.verbalNorm === "number" ? scores.verbalNorm : null;

  return {
    answered,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
    srsCount,
    srsDue,
    mastered: masteredCount,
    flashcardCards,
    quantNorm,
    verbalNorm,
  };
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

// ---------------------------------------------------------------------------
// Delkomponenter
// ---------------------------------------------------------------------------

function Avatar({
  username,
  email,
  size = "lg",
}: {
  username: string | null;
  email: string | null;
  size?: "lg" | "sm";
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[var(--accent)] font-semibold text-white ${
        size === "lg" ? "size-14 text-xl" : "size-8 text-xs"
      }`}
      aria-hidden
    >
      {initialsOf(username, email)}
    </div>
  );
}

/** Användarnamn med "Ändra"-knapp samt inline-formulär (även vid saknat namn). */
function UsernameEditor() {
  const { username, setUsername } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showForm = editing || username === null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await setUsername(value.trim());
    if (error) {
      setError(error);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setEditing(false);
    setValue("");
  }

  if (!showForm) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
          {username}
        </span>
        <button
          type="button"
          onClick={() => {
            setValue(username ?? "");
            setError(null);
            setEditing(true);
          }}
          className="text-sm font-medium text-[var(--accent)] transition hover:underline"
        >
          Ändra
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          autoFocus
          placeholder="Användarnamn"
          autoComplete="off"
          spellCheck={false}
          aria-label="Användarnamn"
          className="w-full max-w-56 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--ink-muted)] focus:ring-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Sparar…" : "Spara"}
        </button>
        {username !== null ? (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
          >
            Avbryt
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-[#9a3412]" aria-live="polite">
          {error}
        </p>
      ) : null}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Huvudskärm
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const { user, username, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [profile, setProfile] = useState<DuelProfile | null>(null);
  const [history, setHistory] = useState<DuelMatch[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<TrainingStats>(EMPTY_STATS);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;
    async function run() {
      try {
        const [p, h] = await Promise.all([
          getMyProfile(userId),
          getMatchHistory(userId, 5),
        ]);
        if (cancelled) return;
        setProfile(p);
        setHistory(h);
        setOpponentNames(await resolveOpponentNames(h, userId));
      } catch {
        // Icke-fatalt: duellstatistiken lämnas tom.
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void loadTrainingStats(user.id).then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--ink-muted)]">
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        Laddar…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Din profil
        </h1>
        <p className="text-[var(--ink-muted)]">
          Logga in för att se din profil, din träningsstatistik och dina
          duellresultat.
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Logga in med Google
        </button>
        <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
          <span className="h-px flex-1 bg-[var(--line)]" />
          eller
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <AuthForms />
      </div>
    );
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Är du säker på att du vill radera ditt konto? All statistik och all matchhistorik raderas permanent. Det går inte att ångra.",
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setDeleteError("Supabase är inte konfigurerat");
      setDeleting(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    const res = await deleteAccount(token);
    if (res.ok) {
      // Sign-out laddar om sidan via onAuthChanged och rensar lokal session.
      await signOut();
    } else {
      setDeleteError(
        res.error === "NOT_AUTHENTICATED"
          ? "Du måste logga in igen innan du kan radera kontot."
          : "Kunde inte radera kontot. Försök igen.",
      );
      setDeleting(false);
    }
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Konto
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Din profil
        </h1>
      </div>

      {/* 1. Kontouppgifter */}
      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar username={username} email={user.email ?? null} />
          <div className="min-w-0 space-y-1.5">
            <UsernameEditor />
            <p className="truncate text-sm text-[var(--ink-muted)]">
              {user.email ?? "Ingen e-post"}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Medlem sedan {memberSince}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Träningsstatistik */}
      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Träningsstatistik
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Besvarade frågor" value={String(stats.answered)} />
          <StatCard
            label="Träffsäkerhet"
            value={stats.accuracy === null ? "–" : `${stats.accuracy} %`}
          />
          <StatCard
            label="SRS-kort"
            value={`${stats.srsCount} (${stats.srsDue} förfallna)`}
          />
          <StatCard label="Masterade frågor" value={String(stats.mastered)} />
          <StatCard label="Flashcard-kort" value={String(stats.flashcardCards)} />
          <StatCard
            label="Senaste norm (Kvant/Verbal)"
            value={
              stats.quantNorm === null && stats.verbalNorm === null
                ? "–"
                : `${stats.quantNorm === null ? "–" : formatNorm(stats.quantNorm)} / ${stats.verbalNorm === null ? "–" : formatNorm(stats.verbalNorm)}`
            }
          />
        </div>
      </section>

      {/* 3. Duel-statistik */}
      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Duell-statistik
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <StatCard label="Ranking (ELO)" value={String(profile?.elo ?? 1200)} />
          <StatCard label="Vinster" value={String(profile?.wins ?? 0)} />
          <StatCard label="Förluster" value={String(profile?.losses ?? 0)} />
          <StatCard label="Oavgjorda" value={String(profile?.draws ?? 0)} />
        </div>

        <h3 className="mt-6 text-sm font-semibold text-[var(--ink-muted)]">
          Senaste matcher
        </h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Inga matcher ännu — dags att duellera!
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--line)]">
            {history.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                meId={user.id}
                opponentName={
                  m.player_a === user.id
                    ? m.player_b
                      ? (opponentNames[m.player_b] ?? "Spelare")
                      : "Bot"
                    : (opponentNames[m.player_a] ?? "Spelare")
                }
              />
            ))}
          </ul>
        )}
      </section>

      {/* 4. Kontoåtgärder */}
      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Kontoåtgärder
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] px-5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
          >
            Logga ut
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDeleteAccount()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#9a3412]/40 px-5 text-sm font-medium text-[#9a3412] transition hover:bg-[#fff7f3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Raderar…" : "Ta bort konto"}
          </button>
        </div>
        {deleteError ? (
          <p className="mt-3 text-sm text-[#9a3412]" aria-live="polite">
            {deleteError}
          </p>
        ) : null}
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

function MatchRow({
  match,
  meId,
  opponentName,
}: {
  match: DuelMatch;
  meId: string;
  opponentName: string;
}) {
  const iAmA = match.player_a === meId;
  const myDelta = iAmA ? match.elo_a_delta : match.elo_b_delta;
  const won = match.winner === meId;
  const draw = match.winner === null && match.status === "finished";

  const resultLabel = draw ? "Oavgjort" : won ? "Vinst" : "Förlust";
  const resultColor = won
    ? "text-[var(--lagoon)]"
    : draw
      ? "text-[var(--ink-muted)]"
      : "text-[#9a3412]";

  const date = match.finished_at
    ? new Date(match.finished_at).toLocaleDateString("sv-SE", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <span className={`w-16 shrink-0 font-medium ${resultColor}`}>
        {resultLabel}
      </span>
      <span className="flex-1 truncate text-[var(--ink-muted)]">
        vs {opponentName}
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

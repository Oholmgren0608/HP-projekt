"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { getSupabase, type AmaPlayer, type AmaState } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { LoginPanel } from "@/components/auth/login-panel";
import { recordEvent } from "@/lib/gamification/engine";
import { kindBadge } from "@/lib/practice";
import {
  fetchAvatars,
  fetchState,
  findMatch,
  leaveGame,
  startGame,
  submitAnswer,
  updateSettings,
} from "@/lib/alla-mot-alla/api";
import { distributionPercent, formatPoints, kindsText, placement, topWithMe } from "@/lib/alla-mot-alla/format";
import { errorMessage } from "@/components/duel/duel-utils";
import { QuestionFigure } from "@/components/question-figure";
import { QuestionSource } from "@/components/question-source";
import { QuestionPassage } from "@/components/question-passage";
import { cn } from "@/lib/utils";
import { KindPicker } from "./kind-picker";
import { Avatar } from "@/components/avatar";
import { avatarUrl } from "@/lib/avatar/store";

/** player_id → bild-URL för spelarnas godkända profilbilder. */
type AvatarMap = Record<string, string>;
const AvatarsContext = createContext<AvatarMap>({});

const badge = (kind: string) => kindBadge(kind as Parameters<typeof kindBadge>[0]);
const letter = (i: number | null | undefined) =>
  i === null || i === undefined || i < 0 ? "–" : String.fromCharCode(65 + i);

const H1 = "font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)] sm:text-3xl";
const CARD = "rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6";
const PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line-strong)] bg-card px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:opacity-50";

/**
 * Ett spel i Alla mot alla. Servern äger takten och poängen (migration 0038):
 * läget hämtas med ama_state när spelets rad ändras (Realtime), när fasens
 * tid går ut och som reserv var tredje sekund.
 */
export function AmaGame({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AmaState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  // Fasens och lobbyns sluttider i klientens klocka (från serverns återstående tid).
  const [timing, setTiming] = useState<{ deadline: number; lobbyStart: number | null; lobbyBots: number | null }>({
    deadline: 0,
    lobbyStart: null,
    lobbyBots: null,
  });
  const questionKeyRef = useRef("");
  const [avatars, setAvatars] = useState<AvatarMap>({});
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const sendRef = useRef<(chosen: number | null) => Promise<void>>(async () => {});

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState(gameId);
      const t = Date.now();
      setTiming({
        deadline: s.game.remaining_ms === null ? 0 : t + s.game.remaining_ms,
        lobbyStart: s.game.lobby_starts_in_ms === null ? null : t + s.game.lobby_starts_in_ms,
        lobbyBots: s.game.bots_in_ms === null ? null : t + s.game.bots_in_ms,
      });
      const key = `${s.game.status}:${s.game.current_idx}`;
      if (key !== questionKeyRef.current) {
        questionKeyRef.current = key;
        setSelected(null);
      }
      setState(s);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Det gick inte att hämta spelet."));
    }
  }, [gameId]);

  useEffect(() => {
    refreshRef.current = refresh;
    sendRef.current = send;
  });

  // Första hämtningen, Realtime och reservhämtning.
  useEffect(() => {
    if (!user) return;
    void refreshRef.current();
    const supabase = getSupabase();
    const channel = supabase
      ?.channel(`ama-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ama_games", filter: `id=eq.${gameId}` },
        () => void refreshRef.current(),
      )
      .subscribe();
    const poll = window.setInterval(() => void refreshRef.current(), 3000);
    return () => {
      window.clearInterval(poll);
      if (channel) {
        channel.unsubscribe();
        void supabase?.removeChannel(channel);
      }
    };
  }, [user, gameId]);

  // Profilbilder: hämtas igen när spelarlistan ändras (någon går med i lobbyn).
  const playerKey = state ? state.players.map((p) => p.player_id).join(",") : "";
  useEffect(() => {
    if (!playerKey) return;
    let cancelled = false;
    fetchAvatars(gameId).then((m) => {
      if (!cancelled) setAvatars(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, avatarUrl(v)])));
    });
    return () => {
      cancelled = true;
    };
  }, [gameId, playerKey]);

  // Klocka för nedräkningar, och en hämtning precis när fasen tar slut.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!state || state.game.status === "finished" || state.game.status === "cancelled") return;
    const targets = [timing.deadline, timing.lobbyStart, timing.lobbyBots].filter(
      (t): t is number => typeof t === "number" && t > 0,
    );
    if (targets.length === 0) return;
    const wait = Math.max(150, Math.min(...targets) - Date.now() + 1700);
    const id = window.setTimeout(() => void refreshRef.current(), wait);
    return () => window.clearTimeout(id);
  }, [state, timing]);

  // XP när spelet är slut: samma händelse som en duell, vinst för förstaplats.
  useEffect(() => {
    if (!state || state.game.status !== "finished" || !state.final) return;
    const me = state.players.find((p) => p.is_me);
    recordEvent({
      type: "duel_end",
      result: me?.rank === 1 ? "win" : "loss",
      matchId: `ama:${gameId}`,
      forfeit: false,
      answers: state.final.review.filter((r) => r.my_chosen !== null && r.my_chosen >= 0).length,
    });
  }, [state, gameId]);

  async function act(fn: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function send(chosen: number | null) {
    if (!state?.question || sending || state.my_answer) return;
    setSending(true);
    try {
      await submitAnswer(gameId, state.question.index, chosen);
      await refresh();
    } catch (e) {
      setError(errorMessage(e, "Svaret kunde inte skickas."));
    } finally {
      setSending(false);
    }
  }

  // Tiden ute utan svar: skicka ett tomt svar (servern godtar det bara inom tiden).
  const wrap = (node: React.ReactNode) => <AvatarsContext.Provider value={avatars}>{node}</AvatarsContext.Provider>;
  const secondsLeft = Math.max(0, Math.ceil((timing.deadline - now) / 1000));
  const timeUp = state?.game.phase === "question" && !state.my_answer && secondsLeft === 0 && selected !== null;
  useEffect(() => {
    if (timeUp) void sendRef.current(selected);
  }, [timeUp, selected]);

  if (authLoading || (user && !state && !error)) {
    return wrap(
      <div className="space-y-8 sm:space-y-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-64 animate-pulse rounded-[10px] bg-card" />
      </div>
    );
  }
  if (!user) {
    return wrap(
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className={H1}>Alla mot alla</h1>
        <p className="text-[var(--ink-muted)]">Logga in för att spela.</p>
        <LoginPanel />
      </div>
    );
  }
  if (!state) {
    return wrap(
      <div className={cn(CARD, "mx-auto max-w-lg text-center")}>
        <h1 className={H1}>Spelet hittades inte</h1>
        <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
        <Link href="/alla-mot-alla" className={cn(PRIMARY, "mt-6")}>
          Tillbaka
        </Link>
      </div>
    );
  }

  const g = state.game;
  const errorBox = error ? (
    <p className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--destructive)]" role="alert">
      {error}
    </p>
  ) : null;

  if (g.status === "cancelled") {
    return wrap(
      <div className={cn(CARD, "mx-auto max-w-lg text-center")}>
        <h1 className={H1}>Rummet är stängt</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Den som skapade rummet lämnade innan spelet startade.</p>
        <Link href="/alla-mot-alla" className={cn(PRIMARY, "mt-6")}>
          Tillbaka till Alla mot alla
        </Link>
      </div>
    );
  }

  if (g.status === "waiting") {
    return wrap(
      <div className="space-y-8 sm:space-y-10">
        {errorBox}
        {g.mode === "private" ? (
          <PrivateLobby
            state={state}
            busy={busy}
            onSettings={(kinds, extended) => void act(() => updateSettings(gameId, kinds, extended), "Kunde inte spara inställningarna.")}
            onStart={() => void act(() => startGame(gameId), "Kunde inte starta spelet.")}
            onLeave={() => void act(async () => { await leaveGame(gameId); router.push("/alla-mot-alla"); }, "Kunde inte lämna rummet.")}
          />
        ) : (
          <RandomLobby
            state={state}
            startsIn={timing.lobbyStart === null ? null : Math.max(0, Math.ceil((timing.lobbyStart - now) / 1000))}
            botsIn={timing.lobbyBots === null ? null : Math.max(0, Math.ceil((timing.lobbyBots - now) / 1000))}
            onLeave={() => void act(async () => { await leaveGame(gameId); router.push("/alla-mot-alla"); }, "Kunde inte lämna lobbyn.")}
          />
        )}
      </div>
    );
  }

  if (g.status === "finished") {
    return wrap(
      <Finished
        state={state}
        busy={busy}
        onAgain={() =>
          g.mode === "lobby"
            ? void act(async () => router.push(`/alla-mot-alla/${await findMatch()}`), "Kunde inte söka match.")
            : router.push("/alla-mot-alla")
        }
      />
    );
  }

  // Aktivt spel.
  if (g.phase === "starting" || !state.question) {
    return wrap(
      <div className={cn(CARD, "text-center")}>
        <p className="text-sm text-[var(--ink-muted)]">{state.players.length} spelare · {g.question_count} frågor</p>
        <h1 className={cn(H1, "mt-2")}>Spelet börjar om {secondsLeft} s</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Läs noga – rätt svar är värt mer än snabbt svar.</p>
      </div>
    );
  }

  const q = state.question;
  const reveal = state.reveal;
  const percents = reveal ? distributionPercent(reveal.distribution) : null;
  const answered = state.my_answer !== null;

  return wrap(
    <div className="space-y-6 sm:space-y-8">
      {errorBox}
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-sm font-normal tracking-normal text-[var(--ink-muted)]">
            Fråga {q.index + 1} av {g.question_count}
          </h1>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--mist)] px-2 py-0.5 text-xs font-medium text-[var(--ink-soft)]">{badge(q.kind)}</span>
            {g.phase === "question" ? (
              <span
                className={cn(
                  "rounded-md px-2.5 py-0.5 text-sm font-medium tabular-nums",
                  secondsLeft <= 5 ? "bg-[var(--energy-soft)] text-[var(--energy-ink)]" : "bg-[var(--accent-soft)] text-[var(--brand)]",
                )}
                aria-label={`${secondsLeft} sekunder kvar`}
              >
                {secondsLeft}s
              </span>
            ) : null}
          </div>
        </div>

        <QuestionPassage
          passage={q.passage}
          className="mt-4"
          textClassName="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]"
        />
        <QuestionFigure question={{ figureUrl: q.figure_url }} position={q.index + 1} />
        <p className="mt-4 text-lg font-medium text-[var(--ink)]">{q.prompt}</p>
        <QuestionSource id={q.id} />

        <div className="mt-4 space-y-2.5 sm:space-y-3" role="radiogroup" aria-label="Svarsalternativ">
          {q.options.map((opt, i) => {
            const mine = state.my_answer?.chosen === i;
            const active = reveal ? mine : answered ? mine : selected === i;
            const isRight = reveal !== null && reveal.correct_index === i;
            const isWrongChoice = reveal !== null && mine && !isRight;
            return (
              <button
                key={`${q.id}-${i}`}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={answered || reveal !== null || g.phase !== "question"}
                onClick={() => setSelected(i)}
                className={cn(
                  "relative flex w-full items-start gap-3 overflow-hidden rounded-lg border px-3 py-3 text-left transition sm:px-4",
                  isRight
                    ? "border-[var(--success-ink)]/40 bg-card"
                    : isWrongChoice
                      ? "border-[var(--destructive)]/30 bg-card"
                      : active
                        ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                        : "border-[var(--line-strong)] bg-[var(--paper)] enabled:hover:border-[var(--ink-soft)]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    isRight
                      ? "border-[var(--success-ink)] bg-[var(--success-ink)] text-primary-foreground"
                      : isWrongChoice
                        ? "border-[var(--destructive)] bg-[var(--destructive)] text-primary-foreground"
                        : active
                          ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                          : "border-[var(--line)] bg-card text-[var(--ink-muted)]",
                  )}
                >
                  {letter(i)}
                </span>
                <span className="flex-1 text-[var(--ink)]">{opt}</span>
                {percents ? (
                  <span className="shrink-0 text-sm tabular-nums text-[var(--ink-muted)]">
                    {reveal!.distribution[i]} st · {percents[i]} %
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {g.phase === "question" ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-muted)]" role="status">
              {answered ? "Svar skickat. " : ""}
              {state.answered_count} av {state.active_count} har svarat
            </p>
            {!answered ? (
              <button type="button" disabled={selected === null || sending} onClick={() => void send(selected)} className={PRIMARY}>
                Svara
              </button>
            ) : null}
          </div>
        ) : reveal ? (
          <p className="mt-5 text-sm font-medium" role="status">
            {reveal.my_correct ? (
              <span className="text-[var(--success-ink)]">Rätt svar · +{formatPoints(reveal.my_points)} poäng</span>
            ) : state.my_answer && state.my_answer.chosen >= 0 ? (
              <span className="text-[var(--destructive)]">Fel svar · 0 poäng</span>
            ) : (
              <span className="text-[var(--ink-soft)]">Inget svar · 0 poäng</span>
            )}
            <span className="ml-2 font-normal text-[var(--ink-muted)]">Nästa fråga om {secondsLeft} s</span>
          </p>
        ) : null}
      </div>

      <Scoreboard players={state.players} title={reveal ? "Ställning" : "Ställning efter förra frågan"} />
    </div>
  );
}

function PlayerList({ players }: { players: AmaPlayer[] }) {
  const avatars = useContext(AvatarsContext);
  return (
    <ul className="divide-y divide-[var(--line)]">
      {players.map((p) => (
        <li key={p.player_id} className="flex min-h-11 items-center gap-2 py-2 text-sm text-[var(--ink)]">
          <Avatar src={avatars[p.player_id] ?? null} name={p.is_bot ? "Bot" : p.name} size="xs" />
          <span className="truncate">{p.name}</span>
          {p.is_me ? <Tag>du</Tag> : null}
          {p.is_host ? <Tag>skapare</Tag> : null}
          {p.is_bot ? <Tag>bot</Tag> : null}
        </li>
      ))}
    </ul>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[var(--mist)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">{children}</span>
  );
}

function PrivateLobby({
  state,
  busy,
  onSettings,
  onStart,
  onLeave,
}: {
  state: AmaState;
  busy: boolean;
  onSettings: (kinds: string[], extended: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
}) {
  const g = state.game;
  const [copied, setCopied] = useState(false);
  const active = state.players.filter((p) => !p.left);
  const host = state.players.find((p) => p.is_host);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/alla-mot-alla?kod=${g.invite_code ?? ""}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className={cn(H1, "sm:text-4xl")}>Rummet väntar</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          {kindsText(g.kinds)} · 10 frågor{g.extended ? " · Längre tid" : ""}
        </p>
      </div>
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        <section className={CARD}>
          <h2 className="text-sm font-medium text-[var(--ink-muted)]">Kod</h2>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tabular-nums tracking-normal text-[var(--ink)]">
            {g.invite_code}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              });
            }}
            className={cn(SECONDARY, "mt-4 gap-2")}
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Länken är kopierad" : "Kopiera inbjudningslänk"}
          </button>
          {g.is_host ? (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h2 className="text-sm font-medium text-[var(--ink-muted)]">Inställningar</h2>
              <KindPicker value={g.kinds} onChange={(k) => onSettings(k, g.extended)} disabled={busy} className="mt-3" />
              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={g.extended}
                  disabled={busy}
                  onChange={(e) => onSettings(g.kinds, e.target.checked)}
                  className="size-4 accent-[var(--brand)]"
                />
                Längre tid (×1,5)
              </label>
            </div>
          ) : null}
        </section>
        <section className={CARD}>
          <h2 className="text-sm font-medium text-[var(--ink-muted)]">Spelare ({active.length} av 30)</h2>
          <PlayerList players={active} />
        </section>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {g.is_host ? (
          <button type="button" disabled={busy || active.length < 2} onClick={onStart} className={PRIMARY}>
            {active.length < 2 ? "Väntar på minst en spelare till" : "Starta"}
          </button>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Väntar på att {host?.name ?? "skaparen"} startar spelet …</p>
        )}
        <button type="button" disabled={busy} onClick={onLeave} className={SECONDARY}>
          {g.is_host ? "Stäng rummet" : "Lämna"}
        </button>
      </div>
    </div>
  );
}

function RandomLobby({
  state,
  startsIn,
  botsIn,
  onLeave,
}: {
  state: AmaState;
  startsIn: number | null;
  botsIn: number | null;
  onLeave: () => void;
}) {
  const active = state.players.filter((p) => !p.left);
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className={cn(H1, "sm:text-4xl")}>Söker spelare</h1>
        <p className="mt-2 text-[var(--ink-muted)]" role="status">
          {active.length} av 8 spelare.{" "}
          {startsIn !== null
            ? `Spelet startar om ${startsIn} s.`
            : botsIn !== null
              ? `Hittas inte fyra spelare fyller botar platserna om ${botsIn} s.`
              : ""}
        </p>
      </div>
      <section className={CARD}>
        <h2 className="text-sm font-medium text-[var(--ink-muted)]">Spelare</h2>
        <PlayerList players={active} />
      </section>
      <button type="button" onClick={onLeave} className={SECONDARY}>
        Lämna lobbyn
      </button>
    </div>
  );
}

function Scoreboard({ players, title }: { players: AmaPlayer[]; title: string }) {
  const avatars = useContext(AvatarsContext);
  const { rows, meOutside } = topWithMe(players);
  const row = (p: AmaPlayer) => (
    <li
      key={p.player_id}
      className={cn("flex min-h-10 items-center gap-3 px-3 py-2 text-sm", p.is_me && "bg-[var(--accent-soft)]")}
    >
      <span className="w-8 shrink-0 tabular-nums text-[var(--ink-muted)]">{placement(p.rank)}</span>
      <Avatar src={avatars[p.player_id] ?? null} name={p.is_bot ? "Bot" : p.name} size="xs" />
      <span className={cn("flex-1 truncate text-[var(--ink)]", p.is_me && "font-medium")}>
        {p.name}
        {p.is_bot ? <span className="ml-2 text-xs text-[var(--ink-muted)]">bot</span> : null}
        {p.left ? <span className="ml-2 text-xs text-[var(--ink-muted)]">borta</span> : null}
      </span>
      <span className="tabular-nums font-medium text-[var(--ink)]">{formatPoints(p.score)}</span>
    </li>
  );
  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-card">
      <h2 className="border-b border-[var(--line)] px-3 py-2.5 text-sm font-medium text-[var(--ink-muted)]">{title}</h2>
      <ol className="divide-y divide-[var(--line)]">{rows.map(row)}</ol>
      {meOutside ? <ol className="border-t border-[var(--line-strong)]">{row(meOutside)}</ol> : null}
    </section>
  );
}

function Finished({ state, busy, onAgain }: { state: AmaState; busy: boolean; onAgain: () => void }) {
  const me = state.players.find((p) => p.is_me);
  const total = state.players.length;
  const final = state.final;
  const weakest = final?.weakest_kind;
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className={cn(CARD, "text-center")}>
        <p className="text-sm text-[var(--ink-muted)]">Spelet är slut</p>
        <h1 className={cn(H1, "mt-2 sm:text-4xl")}>
          {me ? `Du kom ${placement(me.rank)} av ${total}` : "Resultat"}
        </h1>
        {me ? (
          <p className="mt-2 text-[var(--ink-muted)]">
            {formatPoints(me.score)} poäng · {me.correct} rätt av {state.game.question_count}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={busy} onClick={onAgain} className={PRIMARY}>
            {state.game.mode === "lobby" ? "Sök ny match" : "Tillbaka till Alla mot alla"}
          </button>
          {weakest ? (
            <Link href={`/ova/${weakest}`} className={SECONDARY}>
              Öva mer på {badge(weakest)}
            </Link>
          ) : null}
        </div>
      </div>

      <Scoreboard players={state.players} title="Slutställning" />

      {final && final.review.length > 0 ? (
        <section className={CARD}>
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">Genomgång</h2>
          <ol className="mt-4 divide-y divide-[var(--line)]">
            {final.review.map((item) => (
              <li key={item.index} className="py-4 first:pt-0 last:pb-0">
                <p className="text-xs text-[var(--ink-muted)]">
                  Fråga {item.index + 1} · {badge(item.question.kind)} · {formatPoints(item.my_points)} poäng
                </p>
                <p className="mt-1 font-medium text-[var(--ink)]">{item.question.prompt}</p>
                <QuestionSource id={item.question.id} className="mt-1" />
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Rätt svar:{" "}
                  <span className="font-medium text-[var(--success-ink)]">
                    {letter(item.correct_index)} {item.question.options[item.correct_index]}
                  </span>
                  {" · "}Du: <span className="font-medium tabular-nums">{letter(item.my_chosen)}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{item.explain}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

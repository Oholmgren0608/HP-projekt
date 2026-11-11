"use client";

import { Avatar } from "@/components/avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordEvent } from "@/lib/gamification/engine";
import { getSupabase } from "@/lib/supabase/client";
import type { DuelAnswerResult, DuelReviewItem } from "@/lib/supabase/client";
import { kindBadge } from "@/lib/practice";
import {
  DUEL_QUESTION_COUNT,
  DUEL_STALL_GRACE_MS,
  duelModeLabel,
  type DuelAnswer,
  type DuelMatch,
} from "@/lib/duel/types";
import {
  fetchDuelReview,
  fetchNextDuelQuestion,
  submitDuelAnswer,
  type DuelQuestion,
} from "@/lib/duel/questions";
import { getMyProfile, getPublicProfile } from "@/lib/duel/profile";
import { claimStallWin, finishBot, forfeit, markFinished } from "@/lib/duel/matchmaking";
import {
  classifyDuelResult,
  displayNameFromUser,
  errorMessage,
  formatMs,
  stallClaimDelayMs,
  type DuelResult,
} from "./duel-utils";
import { ReviewForm } from "./review-form";
import { QuestionFigure } from "@/components/question-figure";
import { QuestionSource } from "@/components/question-source";
import { QuestionPassage } from "@/components/question-passage";

type Phase = "loading" | "error" | "playing" | "waiting" | "finished";

type Current = {
  index: number;
  total: number;
  timeLimitMs: number;
  question: DuelQuestion;
};

/** Hur länge rätt svar visas innan nästa fråga hämtas. Tiden räknas inte. */
const FEEDBACK_MS = 1400;

/**
 * En duell. Servern väljer frågorna, skickar en i taget utan facit, mäter
 * svarstiden och rättar (migration 0037). Botens svar räknas också ut på
 * servern. Klienten visar bara det servern skickar.
 */
export function DuelMatchView({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  const [match, setMatch] = useState<DuelMatch | null>(null);
  const [meId, setMeId] = useState("");
  const [meName, setMeName] = useState("Du");
  const [meElo, setMeElo] = useState(1200);
  const [oppName, setOppName] = useState("Motståndare");
  const [oppElo, setOppElo] = useState<number | null>(null);
  const [oppUserId, setOppUserId] = useState<string | null>(null);
  const [isBot, setIsBot] = useState(false);

  const [current, setCurrent] = useState<Current | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<DuelAnswerResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);
  const [myAnswered, setMyAnswered] = useState(0);
  const [myTimeMs, setMyTimeMs] = useState(0);
  const [botCorrect, setBotCorrect] = useState<number | null>(null);
  const [stallElapsed, setStallElapsed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [review, setReview] = useState<DuelReviewItem[] | null>(null);

  const matchRef = useRef(match);
  const phaseRef = useRef(phase);
  const currentRef = useRef(current);
  const isBotRef = useRef(isBot);
  const busyRef = useRef(false);
  const deadlineRef = useRef(0);
  const loadMatchRef = useRef<() => Promise<void>>(async () => {});
  const advanceRef = useRef<() => Promise<void>>(async () => {});
  const submitRef = useRef<(chosen: number | null) => void>(() => {});

  // Gamification: rapportera duellens utfall. Motorn dedupar på matchId.
  useEffect(() => {
    if (phase !== "finished" || !match || !meId) return;
    if (match.status === "cancelled") return;
    recordEvent({
      type: "duel_end",
      result: classifyDuelResult(match, meId),
      matchId,
      forfeit: match.status === "forfeit",
      answers: myAnswered,
    });
  }, [phase, match, meId, matchId, myAnswered]);

  // Genomgången (facit och förklaringar) hämtas när matchen är slut.
  useEffect(() => {
    if (phase !== "finished" || !match || match.status === "cancelled") return;
    let cancelled = false;
    fetchDuelReview(matchId)
      .then((items) => {
        if (!cancelled) setReview(items);
      })
      .catch(() => {
        if (!cancelled) setReview([]);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, match, matchId]);

  const loadMatch = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from("duel_matches").select("*").eq("id", matchId).maybeSingle();
    if (!data) {
      setPhase("error");
      setError("Matchen hittades inte.");
      return;
    }
    const m = data as DuelMatch;
    setMatch(m);
    if (m.status === "finished" || m.status === "forfeit" || m.status === "cancelled") {
      setPhase("finished");
    }
  }, [matchId]);

  /** Alla frågor besvarade: avgör botmatchen eller markera klar och vänta. */
  const finishMatch = useCallback(async () => {
    if (isBotRef.current) {
      try {
        const res = await finishBot(matchId);
        if (res) setBotCorrect(res.bot_correct);
      } catch {
        /* matchen läses om nedan */
      }
      await loadMatchRef.current();
      return;
    }
    try {
      const finalized = await markFinished(matchId);
      if (finalized) {
        await loadMatchRef.current();
        return;
      }
    } catch {
      /* hamnar i waiting */
    }
    setPhase("waiting");
    const m = matchRef.current;
    window.setTimeout(
      () => setStallElapsed(true),
      m ? stallClaimDelayMs(m, Date.now()) : DUEL_STALL_GRACE_MS,
    );
  }, [matchId]);

  /** Hämtar nästa fråga från servern, eller avslutar när alla är besvarade. */
  const advance = useCallback(async () => {
    try {
      const next = await fetchNextDuelQuestion(matchId);
      setFeedback(null);
      setSelected(null);
      if (next.done) {
        setCurrent(null);
        if (phaseRef.current === "playing" || phaseRef.current === "loading") {
          await finishMatch();
        }
        return;
      }
      deadlineRef.current = Date.now() + next.remainingMs;
      setSecondsLeft(Math.ceil(next.remainingMs / 1000));
      setCurrent({
        index: next.index,
        total: next.total,
        timeLimitMs: next.timeLimitMs,
        question: next.question,
      });
      busyRef.current = false;
      setPhase("playing");
    } catch (e) {
      setPhase("error");
      setError(errorMessage(e, "Det gick inte att hämta nästa fråga. Ladda om sidan."));
    }
  }, [matchId, finishMatch]);

  const submit = useCallback(
    async (chosen: number | null) => {
      const cur = currentRef.current;
      if (phaseRef.current !== "playing" || !cur || busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await submitDuelAnswer(matchId, cur.index, chosen);
        setFeedback(res);
        setMyAnswered((n) => n + 1);
        setMyCorrect((n) => n + (res.correct ? 1 : 0));
        setMyTimeMs((t) => t + res.time_ms);
        if (res.bot) setBotCorrect(res.bot.total_correct);
        window.setTimeout(() => void advanceRef.current(), FEEDBACK_MS);
      } catch (e) {
        // Kunde inte skicka: läs om läget från servern (som avgör om tiden gått ut).
        busyRef.current = false;
        setError(errorMessage(e, "Svaret kunde inte skickas."));
        void advanceRef.current();
      }
    },
    [matchId],
  );

  useEffect(() => {
    matchRef.current = match;
    phaseRef.current = phase;
    currentRef.current = current;
    isBotRef.current = isBot;
    submitRef.current = submit;
    advanceRef.current = advance;
    loadMatchRef.current = loadMatch;
  });

  // Initiera: match, profiler, egna svar (resume), realtid och första frågan.
  useEffect(() => {
    let cancelled = false;
    let matchChannel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null =
      null;

    async function init() {
      const supabase = getSupabase();
      if (!supabase) {
        setPhase("error");
        setError("Supabase är inte konfigurerat.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhase("error");
        setError("Du måste vara inloggad.");
        return;
      }
      setMeId(user.id);
      setMeName(displayNameFromUser(user));

      const { data: mData } = await supabase
        .from("duel_matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();
      if (cancelled) return;
      if (!mData) {
        setPhase("error");
        setError("Matchen hittades inte.");
        return;
      }
      const m = mData as DuelMatch;
      setMatch(m);
      matchRef.current = m;

      const isBotMatch = m.player_b === null && m.bot_elo != null;
      const iAmA = m.player_a === user.id;
      if (!iAmA && m.player_b !== user.id) {
        setPhase("error");
        setError("Du är inte deltagare i den här matchen.");
        return;
      }
      setIsBot(isBotMatch);
      isBotRef.current = isBotMatch;

      const oppId = isBotMatch ? null : iAmA ? m.player_b : m.player_a;
      setOppUserId(oppId);
      const myProfile = await getMyProfile(user.id).catch(() => null);
      if (myProfile) setMeElo(myProfile.elo);
      if (oppId) {
        const oppProfile = await getPublicProfile(oppId).catch(() => null);
        if (oppProfile) {
          setOppName(oppProfile.display_name);
          setOppElo(oppProfile.elo);
        }
      } else {
        setOppName("AI-bot");
        setOppElo(m.bot_elo ?? null);
      }

      // Egna svar som redan finns på servern (resume).
      const { data: answersData } = await supabase
        .from("duel_answers")
        .select("*")
        .eq("match_id", matchId)
        .eq("user_id", user.id);
      if (cancelled) return;
      const mine = (answersData ?? []) as DuelAnswer[];
      setMyAnswered(mine.length);
      setMyCorrect(mine.filter((a) => a.correct).length);
      setMyTimeMs(mine.reduce((t, a) => t + a.time_ms, 0));

      if (m.status === "finished" || m.status === "forfeit" || m.status === "cancelled") {
        setPhase("finished");
        return;
      }
      if (m.status !== "active") {
        setPhase("error");
        setError("Matchen är inte aktiv.");
        return;
      }

      matchChannel = supabase
        .channel(`duel-match-${matchId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "duel_matches", filter: `id=eq.${matchId}` },
          (payload) => {
            const row = payload.new as DuelMatch;
            if (row.status === "finished" || row.status === "forfeit" || row.status === "cancelled") {
              void loadMatchRef.current();
            }
          },
        )
        .subscribe();

      const myFinishedAt = iAmA ? m.a_finished_at : m.b_finished_at;
      if (!isBotMatch && myFinishedAt) {
        setPhase("waiting");
        window.setTimeout(
          () => setStallElapsed(true),
          stallClaimDelayMs(m, new Date(myFinishedAt).getTime()),
        );
        return;
      }
      await advanceRef.current();
    }

    void init();
    return () => {
      cancelled = true;
      if (matchChannel) {
        matchChannel.unsubscribe();
        void getSupabase()?.removeChannel(matchChannel);
      }
    };
  }, [matchId]);

  // Nedräkning mot serverns tidsgräns; när tiden är ute skickas ett tomt svar.
  useEffect(() => {
    if (phase !== "playing" || !current || feedback) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) submitRef.current(null);
    }, 250);
    return () => clearInterval(id);
  }, [phase, current, feedback]);

  async function handleForfeit() {
    if (phase !== "playing" && phase !== "waiting") return;
    try {
      await forfeit(matchId);
    } catch {
      /* ignorera */
    }
    await loadMatch();
  }

  async function handleClaim() {
    setClaimError(null);
    try {
      await claimStallWin(matchId);
    } catch (e) {
      setClaimError(errorMessage(e, "Det gick inte att ta vinsten just nu."));
    }
    await loadMatch();
  }

  if (phase === "loading") {
    return (
      <div className="space-y-8 sm:space-y-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-64 animate-pulse rounded-[10px] bg-card" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-[10px] border border-[var(--line)] bg-card p-8 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
          Något gick fel
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/duell")}
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
        >
          Tillbaka till Duell
        </button>
      </div>
    );
  }

  const total = current?.total ?? DUEL_QUESTION_COUNT;
  const q = current?.question;

  return (
    <div className="space-y-8 sm:space-y-10">
      <MatchHeader
        mode={match?.mode ?? "ranked"}
        meId={meId}
        oppId={oppUserId}
        meName={meName}
        meElo={meElo}
        oppName={oppName}
        oppElo={oppElo}
        isBot={isBot}
        myCorrect={myCorrect}
        oppCorrect={isBot ? botCorrect : null}
        total={total}
      />

      {phase === "playing" && current && q ? (
        <div className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-sm font-normal tracking-normal text-[var(--ink-muted)]">
              Fråga {current.index + 1} av {total}
            </h1>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[var(--mist)] px-2 py-0.5 text-xs font-medium text-[var(--ink-soft)]">
                {kindBadge(q.kind as Parameters<typeof kindBadge>[0])}
              </span>
              <span
                className={`rounded-md px-2.5 py-0.5 text-sm font-medium tabular-nums ${
                  secondsLeft <= 5 && !feedback
                    ? "bg-[var(--energy-soft)] text-[var(--energy-ink)]"
                    : "bg-[var(--accent-soft)] text-[var(--brand)]"
                }`}
                aria-label={`${secondsLeft} sekunder kvar`}
              >
                {feedback ? "–" : `${secondsLeft}s`}
              </span>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${((current.index + 1) / total) * 100}%` }}
            />
          </div>

          <QuestionPassage
            passage={q.passage}
            className="mt-4"
            textClassName="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]"
          />
          <QuestionFigure question={q} position={current.index + 1} />

          <p className="mt-4 text-lg font-medium text-[var(--ink)]">{q.prompt}</p>
          <QuestionSource id={q.id} />

          <AnswerOptions
            question={q}
            selected={selected}
            feedback={feedback}
            onSelect={(i) => !feedback && setSelected(i)}
          />

          {feedback ? (
            <p className="mt-4 text-sm font-medium" role="status">
              {feedback.correct ? (
                <span className="text-[var(--success-ink)]">Rätt svar</span>
              ) : feedback.chosen < 0 ? (
                <span className="text-[var(--ink-soft)]">Tiden tog slut</span>
              ) : (
                <span className="text-[var(--destructive)]">Fel svar</span>
              )}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleForfeit()}
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] px-4 text-sm text-[var(--ink-muted)] transition hover:border-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              Ge upp
            </button>
            <button
              type="button"
              disabled={selected === null || feedback !== null}
              onClick={() => submitRef.current(selected)}
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Svara
            </button>
          </div>
        </div>
      ) : null}

      {phase === "waiting" ? (
        <div className="rounded-[10px] border border-[var(--line)] bg-card p-6 text-center">
          <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
            Väntar på motståndaren…
          </h1>
          <p className="mt-2 text-[var(--ink-muted)]">
            Du har {myCorrect} rätt av {total} på {formatMs(myTimeMs)}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
            <span className="text-sm text-[var(--ink-muted)]">Motståndaren spelar fortfarande</span>
          </div>
          {stallElapsed ? (
            <button
              type="button"
              onClick={() => void handleClaim()}
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
            >
              Gör anspråk på vinst (motståndaren verkar ha lämnat)
            </button>
          ) : (
            <p className="mt-6 text-xs text-[var(--ink-muted)]">
              Blir motståndaren inte klar kan du ta vinsten när speltiden har gått ut.
            </p>
          )}
          {claimError ? (
            <p className="mt-3 text-sm text-[var(--destructive)]" role="alert">
              {claimError}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "finished" && match ? (
        <>
          <ResultView
            match={match}
            meId={meId}
            isBot={isBot}
            oppName={oppName}
            onBack={() => router.push("/duell")}
            onAgain={() => router.push("/duell")}
          />
          {review && review.length > 0 ? <DuelReviewList items={review} oppName={oppName} /> : null}
        </>
      ) : null}
    </div>
  );
}

function AnswerOptions({
  question,
  selected,
  feedback,
  onSelect,
}: {
  question: DuelQuestion;
  selected: number | null;
  feedback: DuelAnswerResult | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="mt-4 space-y-2.5 sm:space-y-3" role="radiogroup" aria-label="Svarsalternativ">
      {question.options.map((opt, i) => {
        const active = selected === i;
        const isRight = feedback !== null && feedback.correct_index === i;
        const isWrongChoice = feedback !== null && feedback.chosen === i && !feedback.correct;
        return (
          <button
            key={`${question.id}-${i}`}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={feedback !== null}
            onClick={() => onSelect(i)}
            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 ${
              isRight
                ? "border-[var(--success-ink)]/40 bg-card"
                : isWrongChoice
                  ? "border-[var(--destructive)]/30 bg-card"
                  : active
                    ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                isRight
                  ? "border-[var(--success-ink)] bg-[var(--success-ink)] text-primary-foreground"
                  : isWrongChoice
                    ? "border-[var(--destructive)] bg-[var(--destructive)] text-primary-foreground"
                    : active
                      ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                      : "border-[var(--line)] bg-card text-[var(--ink-muted)]"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-[var(--ink)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Genomgång efter matchen: rätt svar, båda spelarnas val och förklaringen. */
function DuelReviewList({ items, oppName }: { items: DuelReviewItem[]; oppName: string }) {
  const letter = (i: number | null) => (i === null || i < 0 ? "–" : String.fromCharCode(65 + i));
  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">Genomgång</h2>
      <ol className="mt-4 divide-y divide-[var(--line)]">
        {items.map((item) => (
          <li key={item.index} className="py-4 first:pt-0 last:pb-0">
            <p className="text-xs text-[var(--ink-muted)]">
              Fråga {item.index + 1} · {kindBadge(item.question.kind as Parameters<typeof kindBadge>[0])}
            </p>
            <p className="mt-1 font-medium text-[var(--ink)]">{item.question.prompt}</p>
            <QuestionSource id={item.question.id} className="mt-1" />
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Rätt svar:{" "}
              <span className="font-medium text-[var(--success-ink)]">
                {letter(item.correct_index)} {item.question.options[item.correct_index]}
              </span>
              {" · "}Du: <span className="font-medium tabular-nums">{letter(item.my_chosen)}</span>
              {item.opp_chosen !== null ? (
                <>
                  {" · "}
                  {oppName}: <span className="font-medium tabular-nums">{letter(item.opp_chosen)}</span>
                </>
              ) : null}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{item.explain}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MatchHeader({
  mode,
  meId,
  oppId,
  meName,
  meElo,
  oppName,
  oppElo,
  isBot,
  myCorrect,
  oppCorrect,
  total,
}: {
  mode: DuelMatch["mode"];
  meId: string;
  oppId: string | null;
  meName: string;
  meElo: number;
  oppName: string;
  oppElo: number | null;
  isBot: boolean;
  myCorrect: number;
  oppCorrect: number | null;
  total: number;
}) {
  const known = oppCorrect !== null;
  const meAhead = known && myCorrect > oppCorrect;
  const tie = known && myCorrect === oppCorrect;
  const opponentAhead = known && myCorrect < oppCorrect;

  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--brand)]">
          {duelModeLabel(mode)}
        </p>
        <p className="text-xs text-[var(--ink-muted)]">
          {total} frågor
          {known
            ? ` · ${meAhead ? "Du leder" : tie ? "Lika" : "Motståndaren leder"}`
            : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PlayerCard userId={meId} name={meName} elo={meElo} correct={myCorrect} highlight={meAhead} isYou />
        <PlayerCard
          userId={oppId}
          name={oppName}
          elo={oppElo}
          correct={oppCorrect}
          highlight={opponentAhead}
          isBot={isBot}
        />
      </div>
    </div>
  );
}

function PlayerCard({
  userId,
  name,
  elo,
  correct,
  highlight,
  isYou,
  isBot,
}: {
  userId: string | null;
  name: string;
  elo: number | null;
  correct: number | null;
  highlight: boolean;
  isYou?: boolean;
  isBot?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "border-[var(--brand)]/40 bg-[var(--accent-soft)]"
          : "border-[var(--line)] bg-[var(--paper)]"
      }`}
    >
      <p className="flex items-center gap-2 truncate text-sm font-medium text-[var(--ink)]">
        <Avatar userId={isBot ? null : userId} name={isBot ? "AI" : name} size="xs" reportable={!isYou && !isBot} />
        <span className="truncate">{name}</span>
        {isYou ? (
          <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]">
            du
          </span>
        ) : null}
        {isBot ? (
          <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-muted)]">
            bot
          </span>
        ) : null}
      </p>
      <p className="text-xs text-[var(--ink-muted)]">
        {elo != null ? `ELO ${elo}` : "—"}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] font-semibold text-2xl tabular-nums text-[var(--ink)]">
        {correct === null ? "—" : correct}
        {correct !== null ? (
          <span className="text-sm text-[var(--ink-muted)]"> rätt</span>
        ) : null}
      </p>
    </div>
  );
}

function ResultView({
  match,
  meId,
  isBot,
  oppName,
  onBack,
  onAgain,
}: {
  match: DuelMatch;
  meId: string;
  isBot: boolean;
  oppName: string;
  onBack: () => void;
  onAgain: () => void;
}) {
  const iAmA = match.player_a === meId;
  const myScore = iAmA ? match.a_correct : match.b_correct;
  const oppScore = iAmA ? match.b_correct : match.a_correct;
  const myDelta = iAmA ? match.elo_a_delta : match.elo_b_delta;

  const isForfeit = match.status === "forfeit";
  // Avbrutna matcher har inget utfall; behåll vy:ns tidigare beteende (förlust)
  // medan XP-rapporteringen hoppar över dem helt.
  const result: DuelResult =
    match.status === "cancelled" ? "loss" : classifyDuelResult(match, meId);

  const title = isForfeit
    ? result === "win"
      ? "Du vann — motståndaren gav upp"
      : "Du gav upp"
    : result === "draw"
      ? "Oavgjort"
      : result === "win"
        ? "Du vann!"
        : isBot
          ? "Boten vann"
          : "Du förlorade";

  const tone =
    result === "draw"
      ? "text-[var(--ink)]"
      : result === "win"
        ? "text-[var(--success-ink)]"
        : "text-[var(--destructive)]";

  return (
    <div className="rounded-[10px] border border-[var(--line)] bg-card p-6 text-center">
      <h2 className={`mt-2 font-[family-name:var(--font-display)] text-3xl ${tone}`}>
        {title}
      </h2>

      <div className="mt-5 flex items-center justify-center gap-4">
        <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <p className="truncate text-xs text-[var(--ink-muted)]">Du</p>
          <p className="font-[family-name:var(--font-display)] font-semibold text-2xl tabular-nums text-[var(--ink)]">
            {myScore ?? "–"}
          </p>
        </div>
        <span className="text-lg font-medium text-[var(--ink-muted)]">–</span>
        <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <p className="truncate text-xs text-[var(--ink-muted)]">{oppName}</p>
          <p className="font-[family-name:var(--font-display)] font-semibold text-2xl tabular-nums text-[var(--ink)]">
            {oppScore ?? "–"}
          </p>
        </div>
      </div>

      {myDelta != null && myDelta !== 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Rankingförändring:{" "}
          <span className={`font-medium ${myDelta > 0 ? "text-[var(--success-ink)]" : "text-[var(--destructive)]"}`}>
            {myDelta > 0 ? `+${myDelta}` : myDelta} ELO
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">Ingen rankingpåverkan.</p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
        >
          Ny match
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-6 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
        >
          Tillbaka till Duell
        </button>
      </div>

      <ReviewForm matchId={match.id} isBot={isBot} />
    </div>
  );
}

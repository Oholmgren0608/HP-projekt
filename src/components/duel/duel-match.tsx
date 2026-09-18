"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordEvent } from "@/lib/gamification/engine";
import { getSupabase } from "@/lib/supabase/client";
import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import {
  DUEL_QUESTION_COUNT,
  DUEL_SECONDS_PER_QUESTION,
  DUEL_STALL_GRACE_MS,
  duelModeLabel,
  type DuelAnswer,
  type DuelMatch,
} from "@/lib/duel/types";
import { buildDuelQuiz } from "@/lib/duel/questions";
import { simulateBotAnswer, type BotDecision } from "@/lib/duel/bot";
import { getProfile } from "@/lib/duel/profile";
import {
  claimStallWin,
  finishBot,
  forfeit,
  markFinished,
  submitAnswer,
} from "@/lib/duel/matchmaking";
import { displayNameFromUser, formatMs } from "./duel-utils";
import { ReviewForm } from "./review-form";

type Phase = "loading" | "error" | "playing" | "waiting" | "finished";

type MyAnswer = { chosen: number | null; correct: boolean; timeMs: number };

type DuelResult = "win" | "loss" | "draw";

/**
 * Klassificerar en avslutad duells utfall för spelaren `meId`. Delas av
 * XP-rapporteringen (engine) och resultatvyn så att de aldrig kan divergera.
 *
 * Botmatcher: servern (duel_finish_bot) sätter winner = null både vid förlust
 * (boten vann, b_correct > a_correct) och vid oavgjort; skillnaden syns bara i
 * a_correct/b_correct. Uppgivande registrerar alltid en förlust. (G21)
 */
function classifyDuelResult(match: DuelMatch, meId: string): DuelResult {
  if (match.winner === meId) return "win";
  if (match.status === "forfeit") return "loss";

  const isBotMatch = match.player_b === null && match.bot_elo != null;
  if (isBotMatch && match.status === "finished" && match.winner === null) {
    return match.b_correct != null &&
      match.a_correct != null &&
      match.b_correct === match.a_correct
      ? "draw"
      : "loss";
  }

  return match.winner === null ? "draw" : "loss";
}

/**
 * Lokal lagring av botsvar per match. Botmatcher skickar aldrig svar till
 * servern, så utan den här nyckeln börjar quizet om vid reload. Nyckeln är
 * medvetet inte med i storage-sync:ns SYNCED_KEYS (per-match-data ska inte
 * synkas till molnet).
 */
const BOT_ANSWERS_KEY = "hp-lift-duel-bot-answers-v1";

type StoredBotAnswers = Record<string, Record<string, MyAnswer>>;

function readBotAnswers(): StoredBotAnswers {
  try {
    const raw = localStorage.getItem(BOT_ANSWERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: StoredBotAnswers = {};
    for (const [matchKey, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const answers: Record<string, MyAnswer> = {};
      for (const [qid, a] of Object.entries(value as Record<string, unknown>)) {
        if (!a || typeof a !== "object") continue;
        const entry = a as Partial<MyAnswer>;
        if (
          (typeof entry.chosen === "number" || entry.chosen === null) &&
          typeof entry.correct === "boolean" &&
          typeof entry.timeMs === "number"
        ) {
          answers[qid] = {
            chosen: entry.chosen,
            correct: entry.correct,
            timeMs: entry.timeMs,
          };
        }
      }
      if (Object.keys(answers).length > 0) out[matchKey] = answers;
    }
    return out;
  } catch {
    return {};
  }
}

function writeBotAnswers(matchId: string, answers: Record<string, MyAnswer>): void {
  try {
    const all = readBotAnswers();
    all[matchId] = answers;
    localStorage.setItem(BOT_ANSWERS_KEY, JSON.stringify(all));
  } catch {
    /* ignorera — quizet får aldrig krascha p.g.a. lagring */
  }
}

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
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [isBot, setIsBot] = useState(false);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(DUEL_SECONDS_PER_QUESTION);
  const [myCorrect, setMyCorrect] = useState(0);
  const [oppCorrect, setOppCorrect] = useState(0);
  const [myTimeMs, setMyTimeMs] = useState(0);
  const [botCorrect, setBotCorrect] = useState(0);
  const [stallElapsed, setStallElapsed] = useState(false);

  // Refs — skrivs aldrig under render (se synk-effekten nedan).
  const phaseRef = useRef(phase);
  const indexRef = useRef(index);
  const questionsRef = useRef(questions);
  const isBotRef = useRef(isBot);
  const botEloRef = useRef<number | null>(null);
  const botDecisionsRef = useRef<(BotDecision | null)[]>([]);
  const myAnswersRef = useRef<Record<string, MyAnswer>>({});
  const countedOppRef = useRef(new Set<string>());
  const questionDoneRef = useRef(false);
  const startRef = useRef(0);
  const loadMatchRef = useRef<() => Promise<void>>(async () => {});
  const finishMatchRef = useRef<() => Promise<void>>(async () => {});
  const submitRef = useRef<(chosen: number | null) => void>(() => {});

  const oppDisplayCorrect = isBot ? botCorrect : oppCorrect;

  // Gamification: rapportera duellens utfall. Motorn dedupar på matchId
  // (persisterat), så samma match belönas aldrig två gånger (reload/remount).
  useEffect(() => {
    if (phase !== "finished" || !match || !meId) return;
    if (match.status === "cancelled") return;

    // Klassificeringen delas med resultatvyn (se classifyDuelResult) så att
    // XP och UI aldrig kan divergera. (G21)
    const result = classifyDuelResult(match, meId);

    recordEvent({
      type: "duel_end",
      result,
      matchId,
      forfeit: match.status === "forfeit",
      answers: Object.keys(myAnswersRef.current).length,
    });
  }, [phase, match, meId, matchId]);

  const loadMatch = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("duel_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();
    if (!data) {
      setPhase("error");
      setError("Matchen hittades inte.");
      return;
    }
    const m = data as DuelMatch;
    setMatch(m);
    if (
      m.status === "finished" ||
      m.status === "forfeit" ||
      m.status === "cancelled"
    ) {
      setPhase("finished");
    }
  }, [matchId]);

  const finishMatch = useCallback(async () => {
    if (phaseRef.current !== "playing") return;
    const entries = Object.values(myAnswersRef.current);
    const myC = entries.filter((a) => a.correct).length;
    const myT = entries.reduce((s, a) => s + a.timeMs, 0);

    if (isBotRef.current) {
      const botFinal = botDecisionsRef.current.filter((d) => d?.correct).length;
      try {
        await finishBot({
          matchId,
          playerCorrect: myC,
          playerTimeMs: myT,
          botCorrect: botFinal,
        });
      } catch {
        /* ignorera — vi laddar om matchen ändå */
      } finally {
        // Återställ skyddet så att ett misslyckat avslut kan göras om.
        questionDoneRef.current = false;
      }
      await loadMatchRef.current();
    } else {
      try {
        const finalized = await markFinished(matchId, myC, myT);
        if (finalized) {
          await loadMatchRef.current();
        } else {
          setPhase("waiting");
          window.setTimeout(() => setStallElapsed(true), DUEL_STALL_GRACE_MS);
        }
      } catch {
        // Återställ skyddet så att avslutet kan göras om.
        questionDoneRef.current = false;
        await loadMatchRef.current();
      }
    }
  }, [matchId]);

  const submit = useCallback(
    (chosen: number | null) => {
      if (phaseRef.current !== "playing" || questionDoneRef.current) return;
      const i = indexRef.current;
      const qs = questionsRef.current;
      if (i >= qs.length) return;

      const q = qs[i];
      // Redan besvarat (t.ex. efter ett misslyckat avslut) — försök bara
      // avsluta igen utan att räkna om svaret.
      if (myAnswersRef.current[q.id] !== undefined) {
        questionDoneRef.current = true;
        void finishMatchRef.current();
        return;
      }

      questionDoneRef.current = true;

      const elapsed = Math.min(
        DUEL_SECONDS_PER_QUESTION * 1000,
        Date.now() - startRef.current,
      );
      const correct = chosen !== null && chosen === q.correctIndex;
      const timeMs =
        chosen === null ? DUEL_SECONDS_PER_QUESTION * 1000 : Math.max(1, elapsed);

      myAnswersRef.current[q.id] = { chosen, correct, timeMs };
      if (isBotRef.current) {
        writeBotAnswers(matchId, myAnswersRef.current);
      }
      setMyCorrect((c) => c + (correct ? 1 : 0));
      setMyTimeMs((t) => t + timeMs);

      if (!isBotRef.current) {
        void submitAnswer({
          matchId,
          questionId: q.id,
          chosen: chosen ?? -1,
          correct,
          timeMs,
        }).catch(() => {});
      } else {
        const decision = simulateBotAnswer(q, botEloRef.current ?? 1200);
        botDecisionsRef.current[i] = decision;
        window.setTimeout(() => {
          if (decision.correct) setBotCorrect((c) => c + 1);
        }, decision.delayMs);
      }

      if (i + 1 >= qs.length) {
        void finishMatchRef.current();
      } else {
        questionDoneRef.current = false;
        startRef.current = Date.now();
        setSecondsLeft(DUEL_SECONDS_PER_QUESTION);
        setIndex(i + 1);
        setSelected(null);
      }
    },
    [matchId],
  );

  // Synka refs i en effekt (React rekommenderar att refs uppdateras i
  // effekter, inte under render).
  useEffect(() => {
    phaseRef.current = phase;
    indexRef.current = index;
    questionsRef.current = questions;
    isBotRef.current = isBot;
    submitRef.current = submit;
    finishMatchRef.current = finishMatch;
    loadMatchRef.current = loadMatch;
  });

  // Initiera: hämta match, frågor, profiler, befintliga svar + prenumerera.
  useEffect(() => {
    let cancelled = false;
    let answersChannel: ReturnType<
      NonNullable<ReturnType<typeof getSupabase>>["channel"]
    > | null = null;
    let matchChannel: ReturnType<
      NonNullable<ReturnType<typeof getSupabase>>["channel"]
    > | null = null;

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

      if (m.status === "finished" || m.status === "forfeit" || m.status === "cancelled") {
        setPhase("finished");
        return;
      }
      if (m.status !== "active") {
        setPhase("error");
        setError("Matchen är inte aktiv.");
        return;
      }

      const isBotMatch = m.player_b === null && m.bot_elo != null;
      const iAmA = m.player_a === user.id;
      if (!iAmA && m.player_b !== user.id) {
        setPhase("error");
        setError("Du är inte deltagare i den här matchen.");
        return;
      }
      const oppId = isBotMatch ? null : iAmA ? m.player_b : m.player_a;

      setIsBot(isBotMatch);
      const qs = buildDuelQuiz(m.question_seed, DUEL_QUESTION_COUNT);
      setQuestions(qs);

      const myProfile = await getProfile(user.id).catch(() => null);
      if (myProfile) {
        setMeElo(myProfile.elo);
        if (isBotMatch) {
          // Boten blir svårare/lättare utifrån tidigare svårighetsröster.
          botEloRef.current =
            (m.bot_elo ?? 1200) + (myProfile.bot_skill_offset ?? 0);
        }
      }
      if (oppId) {
        const oppProfile = await getProfile(oppId).catch(() => null);
        if (oppProfile) {
          setOppName(oppProfile.display_name);
          setOppElo(oppProfile.elo);
        }
      } else {
        setOppName("AI-bot");
        setOppElo(m.bot_elo ?? null);
      }

      // Befintliga svar (resume).
      const { data: answersData } = await supabase
        .from("duel_answers")
        .select("*")
        .eq("match_id", matchId);
      if (cancelled) return;
      const myAnswers: Record<string, MyAnswer> = {};
      let myC = 0;
      let myT = 0;
      let oppC = 0;
      const countedOpp = new Set<string>();
      for (const a of (answersData ?? []) as DuelAnswer[]) {
        if (a.user_id === user.id) {
          myAnswers[a.question_id] = {
            chosen: a.chosen,
            correct: a.correct,
            timeMs: a.time_ms,
          };
          if (a.correct) myC += 1;
          myT += a.time_ms;
        } else {
          countedOpp.add(a.question_id);
          if (a.correct) oppC += 1;
        }
      }
      // Bot-matcher sparar sina svar lokalt — återställ dem så att en reload
      // återupptar quizet i stället för att börja om. Tolerant mot gammal
      // eller främmande state: bara fråge-id som finns i den aktuella
      // omgången används.
      if (isBotMatch) {
        const qIds = new Set(qs.map((q) => q.id));
        const stored = readBotAnswers()[matchId];
        for (const [qid, a] of Object.entries(stored ?? {})) {
          if (!qIds.has(qid) || qid in myAnswers) continue;
          myAnswers[qid] = a;
          if (a.correct) myC += 1;
          myT += a.timeMs;
        }
      }
      myAnswersRef.current = myAnswers;
      countedOppRef.current = countedOpp;
      setMyCorrect(myC);
      setMyTimeMs(myT);
      setOppCorrect(oppC);

      // Realtime: matchstatus (+ motståndarens svar för människa-matcher).
      matchChannel = supabase
        .channel(`duel-match-${matchId}`)
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
            if (
              row.status === "finished" ||
              row.status === "forfeit" ||
              row.status === "cancelled"
            ) {
              void loadMatchRef.current();
            }
          },
        )
        .subscribe();

      if (!isBotMatch) {
        answersChannel = supabase
          .channel(`duel-answers-${matchId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "duel_answers",
              filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
              const row = payload.new as DuelAnswer;
              if (row.user_id === user.id) return;
              if (countedOppRef.current.has(row.question_id)) return;
              countedOppRef.current.add(row.question_id);
              if (row.correct) setOppCorrect((c) => c + 1);
            },
          )
          .subscribe();
      }

      // Bestäm var vi ska återuppta.
      const myCount = Object.keys(myAnswers).length;
      if (myCount >= qs.length) {
        if (isBotMatch) {
          botDecisionsRef.current = qs.map((q) =>
            simulateBotAnswer(q, botEloRef.current ?? 1200),
          );
          setBotCorrect(
            botDecisionsRef.current.filter((d) => d?.correct).length,
          );
          void finishMatchRef.current();
        } else {
          const myFinishedAt = iAmA ? m.a_finished_at : m.b_finished_at;
          if (!myFinishedAt) {
            // Förra avslutet misslyckades — försök markera klar igen.
            try {
              const finalized = await markFinished(matchId, myC, myT);
              if (cancelled) return;
              if (finalized) {
                await loadMatchRef.current();
                return;
              }
            } catch {
              /* ignorera — vi hamnar i waiting nedan */
            }
          }
          setPhase("waiting");
          const elapsed = myFinishedAt
            ? Date.now() - new Date(myFinishedAt).getTime()
            : 0;
          const remaining = Math.max(0, DUEL_STALL_GRACE_MS - elapsed);
          window.setTimeout(() => setStallElapsed(true), remaining);
        }
      } else {
        questionDoneRef.current = false;
        startRef.current = Date.now();
        setSecondsLeft(DUEL_SECONDS_PER_QUESTION);
        setIndex(myCount);
        setPhase("playing");
      }
    }

    void init();

    return () => {
      cancelled = true;
      if (answersChannel) {
        answersChannel.unsubscribe();
        void getSupabase()?.removeChannel(answersChannel);
      }
      if (matchChannel) {
        matchChannel.unsubscribe();
        void getSupabase()?.removeChannel(matchChannel);
      }
    };
  }, [matchId]);

  // Per-fråga-timer.
  useEffect(() => {
    if (phase !== "playing" || index >= questions.length) return;
    const id = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [index, phase, questions.length]);

  useEffect(() => {
    if (phase === "playing" && secondsLeft === 0) {
      submitRef.current(null);
    }
  }, [secondsLeft, phase]);

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
    try {
      await claimStallWin(matchId);
    } catch {
      /* ignorera */
    }
    await loadMatch();
  }

  if (phase === "loading") {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/70" />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--line)] bg-white/80 p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Något gick fel
        </p>
        <p className="mt-2 text-[var(--ink-muted)]">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/duell")}
          className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Tillbaka till Duell
        </button>
      </div>
    );
  }

  const current = questions[index];
  const total = questions.length;

  return (
    <div className="space-y-6">
      <MatchHeader
        mode={match?.mode ?? "ranked"}
        meName={meName}
        meElo={meElo}
        oppName={oppName}
        oppElo={oppElo}
        isBot={isBot}
        myCorrect={myCorrect}
        oppCorrect={oppDisplayCorrect}
        total={total}
      />

      {phase === "playing" && current ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--ink-muted)]">
              Fråga {index + 1} av {total}
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--mist)] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                {kindBadge(current.kind)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ${
                  secondsLeft <= 5
                    ? "bg-[#9a3412]/10 text-[#9a3412]"
                    : "bg-[var(--accent-soft)] text-[var(--brand)]"
                }`}
              >
                {secondsLeft}s
              </span>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>

          {current.passage ? (
            <div className="mt-4 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {current.passage}
            </div>
          ) : null}

          <p className="mt-4 text-lg font-medium text-[var(--ink)]">
            {current.prompt}
          </p>

          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Svarsalternativ">
            {current.options.map((opt, i) => {
              const active = selected === i;
              return (
                <button
                  key={`${current.id}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(i)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 ${
                    active
                      ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink-muted)]"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[var(--ink)]">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleForfeit()}
              className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-muted)] transition hover:border-[#9a3412]/40 hover:text-[#9a3412]"
            >
              Ge upp
            </button>
            <button
              type="button"
              disabled={selected === null}
              onClick={() => submitRef.current(selected)}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Svara
            </button>
          </div>
        </div>
      ) : null}

      {phase === "waiting" ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 text-center shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
            Klar!
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Väntar på motståndaren…
          </h2>
          <p className="mt-2 text-[var(--ink-muted)]">
            Du har {myCorrect} rätt av {total} på {formatMs(myTimeMs)}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
            <span className="text-sm text-[var(--ink-muted)]">
              Motståndaren spelar fortfarande
            </span>
          </div>

          {stallElapsed ? (
            <button
              type="button"
              onClick={() => void handleClaim()}
              className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Gör anspråk på vinst (motståndaren verkar ha lämnat)
            </button>
          ) : (
            <p className="mt-6 text-xs text-[var(--ink-muted)]">
              Du kan göra anspråk på vinsten efter 60 sekunder.
            </p>
          )}
        </div>
      ) : null}

      {phase === "finished" && match ? (
        <ResultView
          match={match}
          meId={meId}
          isBot={isBot}
          oppName={oppName}
          onBack={() => router.push("/duell")}
          onAgain={() => router.push("/duell")}
        />
      ) : null}
    </div>
  );
}

function MatchHeader({
  mode,
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
  meName: string;
  meElo: number;
  oppName: string;
  oppElo: number | null;
  isBot: boolean;
  myCorrect: number;
  oppCorrect: number;
  total: number;
}) {
  const meAhead = myCorrect > oppCorrect;
  const tie = myCorrect === oppCorrect;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-4 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)] sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          {duelModeLabel(mode)}
        </p>
        <p className="text-xs text-[var(--ink-muted)]">
          {total} frågor · {meAhead ? "Du leder" : tie ? "Lika" : "Motståndaren leder"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PlayerCard name={meName} elo={meElo} correct={myCorrect} highlight={meAhead} isYou />
        <PlayerCard
          name={oppName}
          elo={oppElo}
          correct={oppCorrect}
          highlight={!meAhead && !tie}
          isBot={isBot}
        />
      </div>
    </div>
  );
}

function PlayerCard({
  name,
  elo,
  correct,
  highlight,
  isYou,
  isBot,
}: {
  name: string;
  elo: number | null;
  correct: number;
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
        {name}
        {isYou ? (
          <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            du
          </span>
        ) : null}
        {isBot ? (
          <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            bot
          </span>
        ) : null}
      </p>
      <p className="text-xs text-[var(--ink-muted)]">
        {elo != null ? `ELO ${elo}` : "—"}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--ink)]">
        {correct}
        <span className="text-sm text-[var(--ink-muted)]"> rätt</span>
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
        ? "text-[var(--lagoon)]"
        : "text-[#9a3412]";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 text-center shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
        {duelModeLabel(match.mode)}
      </p>
      <h2 className={`mt-2 font-[family-name:var(--font-display)] text-3xl ${tone}`}>
        {title}
      </h2>

      <div className="mt-5 flex items-center justify-center gap-4">
        <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <p className="truncate text-xs text-[var(--ink-muted)]">Du</p>
          <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--ink)]">
            {myScore ?? "–"}
          </p>
        </div>
        <span className="text-lg font-semibold text-[var(--ink-muted)]">–</span>
        <div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <p className="truncate text-xs text-[var(--ink-muted)]">{oppName}</p>
          <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--ink)]">
            {oppScore ?? "–"}
          </p>
        </div>
      </div>

      {myDelta != null && myDelta !== 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Rankingförändring:{" "}
          <span className={`font-semibold ${myDelta > 0 ? "text-[var(--lagoon)]" : "text-[#9a3412]"}`}>
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
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ny match
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-6 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]"
        >
          Tillbaka till Duell
        </button>
      </div>

      <ReviewForm matchId={match.id} isBot={isBot} />
    </div>
  );
}

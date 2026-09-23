"use client";

import { useEffect, useState } from "react";
import {
  getMyReview,
  submitReview,
  REPORT_REASON_LABELS,
  type BotDifficulty,
  type ReportReason,
} from "@/lib/duel/reviews";
import { errorMessage } from "./duel-utils";

type Phase = "loading" | "review" | "done";

const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  too_easy: "För lätt",
  just_right: "Lagom",
  too_hard: "För svår",
};

/**
 * Recension efter avslutad match. Mot människor: 1-5 stjärnor + valfri
 * rapportorsak vid lågt betyg + kommentar. Mot bot: svårighetsröst +
 * kommentar. En recension per match och spelare.
 */
export function ReviewForm({
  matchId,
  isBot,
}: {
  matchId: string;
  isBot: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<BotDifficulty | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const existing = await getMyReview(matchId).catch(() => null);
      if (!cancelled) setPhase(existing ? "done" : "review");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  async function handleSubmit() {
    if (isBot ? !difficulty : rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        matchId,
        rating: isBot ? null : rating,
        difficulty: isBot ? difficulty : null,
                // Rapportorsaken nollställs när betyget höjs över 2 — skicka den inte med ändå.
        reportReason: isBot || rating > 2 ? null : reportReason,
        comment,
      });
      setPhase("done");
    } catch (e) {
      setError(errorMessage(e, "Kunde inte skicka recensionen."));
      setSubmitting(false);
    }
  }

  const canSubmit = isBot ? difficulty !== null : rating >= 1;
  const showReport = !isBot && rating >= 1 && rating <= 2;

  if (phase === "loading") {
    return (
      <div className="mt-6 h-28 animate-pulse rounded-xl bg-[var(--mist)]" />
    );
  }

  if (phase === "done") {
    return (
      <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">
          Tack för din feedback!
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Ditt omdöme hjälper till att hålla duellerna schyssta.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 text-left sm:p-6">
      {isBot ? (
        <>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Hur var botens svårighetsgrad?
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Din röst justerar boten inför dina kommande matcher.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Svårighetsgrad">
            {(Object.keys(BOT_DIFFICULTY_LABELS) as BotDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={difficulty === d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  difficulty === d
                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
                    : "border-[var(--line-strong)] bg-card text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
                }`}
              >
                {BOT_DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Betygsätt din motståndare
          </p>
          <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Betyg">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} stjärnor`}
                onClick={() => setRating(n)}
                className={`text-3xl leading-none transition ${
                  n <= rating ? "text-[var(--brand)]" : "text-[var(--line)]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            {rating > 0 ? `${rating} av 5` : "Välj betyg"}
          </p>

          {showReport ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Rapportera (valfritt)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setReportReason(reportReason === r ? null : r)
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      reportReason === r
                        ? "border-[var(--destructive)] bg-[var(--coral-soft)] text-[var(--destructive)]"
                        : "border-[var(--line-strong)] bg-card text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
                    }`}
                  >
                    {REPORT_REASON_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder={
          isBot
            ? "Övrig feedback (valfritt)…"
            : "Kommentar om matchen (valfritt)…"
        }
        className="mt-4 w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
      />

      {error ? (
        <p className="mt-2 text-xs text-[var(--destructive)]">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={() => void handleSubmit()}
        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Skickar…" : "Skicka recension"}
      </button>
    </div>
  );
}

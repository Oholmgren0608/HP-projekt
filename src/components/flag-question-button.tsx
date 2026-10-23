"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  FLAG_REASON_MAX,
  FLAG_REASON_MIN,
  flagQuestion,
  reasonLength,
  type FlagError,
} from "@/lib/question-flags";

const ERROR_TEXT: Record<FlagError, string> = {
  NOT_CONFIGURED: "Rapportering är inte tillgänglig just nu.",
  NOT_AUTHENTICATED: "Logga in för att rapportera fel i en fråga.",
  INVALID_REASON: `Beskriv felet med ${FLAG_REASON_MIN}–${FLAG_REASON_MAX} tecken.`,
  QUESTION_NOT_FOUND: "Frågan finns inte längre i frågebanken – den kan redan granskas.",
  RATE_LIMITED: "Du har rapporterat många frågor i dag. Försök igen i morgon.",
  ALREADY_REVIEWED:
    "Frågan har granskats efter din förra rapport. Hör av dig via Feedback om felet finns kvar.",
  UNKNOWN: "Kunde inte skicka rapporten. Försök igen.",
};

type Phase = "idle" | "open" | "sending" | "done";

/**
 * "Rapportera fel" på en rättad fråga. Kräver inloggning så att tre
 * felrapporter verkligen kommer från tre olika användare. Renderar knappen och
 * panelen som syskon: i en flex-wrap-rad hamnar panelen på en egen rad.
 */
export function FlagQuestionButton({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  // Flytta fokus till kvittot så att det läses upp och fokus inte tappas.
  useEffect(() => {
    if (phase === "done") doneRef.current?.focus();
  }, [phase]);

  if (!isSupabaseConfigured()) return null;

  if (phase === "done") {
    return (
      <p
        ref={doneRef}
        tabIndex={-1}
        className="text-xs font-medium text-[var(--ink-muted)] outline-none"
      >
        {message}
      </p>
    );
  }

  function close() {
    setPhase("idle");
    setMessage(null);
    buttonRef.current?.focus();
  }

  async function submit() {
    setPhase("sending");
    const result = await flagQuestion(questionId, reason);
    if (result.ok) {
      setMessage(
        result.withdrawn
          ? "Tack! Frågan har dragits tillbaka för granskning."
          : "Tack! Vi granskar frågan när fler har rapporterat samma sak.",
      );
      setPhase("done");
      return;
    }
    setMessage(ERROR_TEXT[result.error]);
    setPhase("open");
  }

  const fieldId = `flag-${questionId}`;
  const panelId = `flag-panel-${questionId}`;
  const length = reasonLength(reason);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={phase !== "idle"}
        aria-controls={panelId}
        onClick={() => (phase === "idle" ? setPhase("open") : close())}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] sm:text-sm"
      >
        <Flag size={14} aria-hidden />
        Rapportera fel
      </button>

      {phase !== "idle" ? (
        <div
          id={panelId}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="basis-full space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
        >
          {user ? (
            <>
              <label htmlFor={fieldId} className="text-xs font-semibold text-[var(--ink)]">
                Vad är fel i frågan?
              </label>
              <textarea
                id={fieldId}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={FLAG_REASON_MAX}
                className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
                placeholder="T.ex. fel facit, två rätta svar, otydlig fråga eller fel i förklaringen."
              />
              {message ? (
                <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
                  {message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  disabled={
                    phase === "sending" || length < FLAG_REASON_MIN || length > FLAG_REASON_MAX
                  }
                  onClick={() => void submit()}
                  className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {phase === "sending" ? "Skickar…" : "Skicka rapport"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--ink-muted)]">{ERROR_TEXT.NOT_AUTHENTICATED}</p>
          )}
        </div>
      ) : null}
    </>
  );
}

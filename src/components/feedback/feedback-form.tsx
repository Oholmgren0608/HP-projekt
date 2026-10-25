"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  REQUEST_CATEGORIES,
  REQUEST_CHANNELS,
  REQUEST_LIMITS,
  validateFeatureRequest,
  type FeatureRequestCategory,
  type FeatureRequestKind,
} from "@/lib/feedback/feature-request";
import { submitFeatureRequest } from "@/lib/feedback/submit";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent";

const KINDS: FeatureRequestKind[] = ["idea", "problem"];

const INPUT_CLASS =
  "w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2";

const BUTTON_PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line-strong)] px-5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink-soft)]";

/**
 * Hjälp & feedback: två kanaler (önskemål och problem) över samma fält.
 * Kanalen styrs av ?typ=problem så att både profilen och sidfoten kan länka
 * direkt till rätt kanal. Inskicket går via submitFeatureRequest() — formuläret
 * känner inte till vart ärendet tar vägen.
 */
export function FeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kindParam: FeatureRequestKind =
    searchParams.get("typ") === "problem" ? "problem" : "idea";

  const [kind, setKind] = useState<FeatureRequestKind>(kindParam);
  const [category, setCategory] = useState<FeatureRequestCategory>(
    REQUEST_CATEGORIES[kindParam][0].value,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  // Speglar "sending" synkront: knappen hinner inte bli inaktiverad förrän
  // nästa omritning, och ett dubbelklick/Enter i samma task läser annars det
  // gamla status-värdet och skickar två ärenden.
  const sendingRef = useRef(false);

  // Följ URL:en även vid bakåt/framåt i historiken (justering under render,
  // samma mönster som WeekTracker/ScoreForm använder i stället för effekt).
  const [syncedKindParam, setSyncedKindParam] = useState(kindParam);
  if (kindParam !== syncedKindParam) {
    setSyncedKindParam(kindParam);
    setKind(kindParam);
    setCategory(REQUEST_CATEGORIES[kindParam][0].value);
  }

  const channel = REQUEST_CHANNELS[kind];
  const categories = REQUEST_CATEGORIES[kind];

  function selectChannel(next: FeatureRequestKind) {
    if (next === kind) return;
    setKind(next);
    setCategory(REQUEST_CATEGORIES[next][0].value);
    setError(null);
    setStatus("idle");
    router.replace(next === "problem" ? "/feedback?typ=problem" : "/feedback", {
      scroll: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Knappen är inaktiverad medan förfrågan behandlas; refen stoppar även
    // Enter-tryck och dubbelklick som hinner före en omritning.
    if (sendingRef.current) return;

    const invalid = validateFeatureRequest({ title, description, reason });
    if (invalid) {
      setError(invalid);
      return;
    }

    sendingRef.current = true;
    setStatus("sending");
    setError(null);
    const result = await submitFeatureRequest({
      kind,
      category,
      title,
      description,
      reason,
    });
    sendingRef.current = false;

    if (result.ok) {
      setStatus("sent");
      return;
    }
    setError(result.error);
    setStatus("idle");
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setReason("");
    setError(null);
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="mx-auto max-w-2xl">
        <div
          role="status"
          aria-live="polite"
          className="rounded-[10px] border border-[var(--line)] bg-card/75 p-6 shadow-soft sm:p-8"
        >
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            ✓ {channel.successTitle}
          </p>
          <p className="mt-2 text-[var(--ink-muted)]">{channel.successBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={resetForm} className={BUTTON_PRIMARY}>
              Skicka ett till
            </button>
            <Link href="/" className={BUTTON_OUTLINE}>
              Till startsidan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-medium text-[var(--brand)]">
          Hjälp & feedback
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Berätta vad du tycker
        </h1>
        <p className="mt-3 text-[var(--ink-muted)]">
          Idéer och förbättringar i den ena kanalen, fel och buggar i den andra. Det
          tar under en minut att skicka.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {KINDS.map((k) => {
          const c = REQUEST_CHANNELS[k];
          const active = kind === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => selectChannel(k)}
              className={cn(
                "rounded-[10px] border p-4 text-left transition ",
                active
                  ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                  : "border-[var(--line-strong)] bg-card/70 hover:border-[var(--brand)] hover:bg-card",
              )}
            >
              <p className="text-sm font-semibold text-[var(--ink)]">
                {c.label}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{c.description}</p>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[10px] border border-[var(--line)] bg-card/75 p-5 sm:p-6"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          {channel.heading}
        </h2>

        <fieldset>
          <legend className="text-sm font-medium text-[var(--ink)]">Välj kategori</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-9 items-center rounded-md border border-[var(--line-strong)] px-3.5 text-sm font-medium text-[var(--ink-muted)] transition peer-checked:border-[var(--brand)] peer-checked:bg-[var(--accent-soft)] peer-checked:text-[var(--ink)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand)]">
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Rubrik</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={REQUEST_LIMITS.titleMax}
            placeholder={channel.titlePlaceholder}
            className={INPUT_CLASS}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">
            {channel.descriptionLabel}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={REQUEST_LIMITS.descriptionMax}
            rows={5}
            placeholder={channel.descriptionPlaceholder}
            className={cn(INPUT_CLASS, "resize-y")}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">{channel.reasonLabel}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REQUEST_LIMITS.reasonMax}
            rows={3}
            placeholder={channel.reasonPlaceholder}
            className={cn(INPUT_CLASS, "resize-y")}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={status === "sending"} className={BUTTON_PRIMARY}>
            {status === "sending" ? "Skickar…" : channel.submitLabel}
          </button>
          {error ? (
            <p className="text-sm text-[var(--destructive)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

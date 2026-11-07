"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useAvatarUrl } from "@/lib/avatar/store";
import { reportAvatar } from "@/lib/avatar/api";
import { errorMessage } from "@/components/duel/duel-utils";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-20 text-2xl",
} as const;

export function initialsOf(name: string): string {
  const clean = name.trim();
  return (clean ? clean.slice(0, 2) : "?").toUpperCase();
}

/**
 * Profilbild med initialer som reserv. Visar bara godkända bilder
 * (docs/profilbild/plan.md). Med `reportable` kan inloggade klicka på någon
 * annans bild, se den större och rapportera den.
 */
export function Avatar({
  userId,
  name,
  size = "sm",
  src,
  reportable = false,
  className,
}: {
  userId?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  /** Känd bild-URL (t.ex. från Alla mot alla); annars hämtas den via userId. */
  src?: string | null;
  reportable?: boolean;
  className?: string;
}) {
  const fetched = useAvatarUrl(src === undefined ? userId : null);
  const url = src === undefined ? fetched : src;
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const canReport = reportable && Boolean(url) && Boolean(user) && Boolean(userId) && user?.id !== userId;

  const face = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={256}
      height={256}
      loading="lazy"
      className={cn("shrink-0 rounded-full border border-[var(--line)] object-cover", SIZES[size], className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-semibold text-[var(--brand)]",
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );

  if (!canReport) return face;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Visa ${name}s profilbild`}
        className="shrink-0 rounded-full focus-visible:outline-offset-2"
      >
        {face}
      </button>
      {open ? <AvatarDialog name={name} url={url!} userId={userId!} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

const REASONS = ["Olämplig eller sexuell bild", "Kränkande eller hatisk", "Visar personuppgifter", "Utger sig för att vara någon annan"];

function AvatarDialog({
  name,
  url,
  userId,
  onClose,
}: {
  name: string;
  url: string;
  userId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const r = await reportAvatar(userId, reason);
      setDone(r.accepted ? "Tack. Teamet tittar på bilden om fler reagerar på den." : "Bilden granskas redan.");
    } catch (e) {
      setError(errorMessage(e, "Rapporten kunde inte skickas."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={`${name}s profilbild`}
      className="m-auto w-[min(92vw,22rem)] rounded-xl border border-[var(--line)] bg-card p-5 text-[var(--ink)] shadow-pop backdrop:bg-black/40 dark:backdrop:bg-black/60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`${name}s profilbild`} width={256} height={256} className="mx-auto size-40 rounded-full border border-[var(--line)] object-cover" />
      <p className="mt-3 text-center font-medium">{name}</p>
      {done ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]" role="status">{done}</p>
      ) : reporting ? (
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-medium">Vad är fel med bilden?</legend>
          {REASONS.map((r) => (
            <label key={r} className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink-soft)]">
              <input type="radio" name="avatar-reason" checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-[var(--brand)]" />
              {r}
            </label>
          ))}
          {error ? <p className="text-sm text-[var(--destructive)]" role="alert">{error}</p> : null}
        </fieldset>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {!done && !reporting ? (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--line-strong)] px-3 text-sm text-[var(--ink-muted)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--ink)]"
          >
            <Flag className="size-4" strokeWidth={1.5} aria-hidden />
            Rapportera bilden
          </button>
        ) : null}
        {reporting && !done ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="inline-flex min-h-10 items-center rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:opacity-50"
          >
            Skicka rapport
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="inline-flex min-h-10 items-center rounded-md border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
        >
          Stäng
        </button>
      </div>
    </dialog>
  );
}

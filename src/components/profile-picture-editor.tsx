"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { avatarUrl } from "@/lib/avatar/store";
import { fetchMyAvatar, removeAvatar, uploadAvatar } from "@/lib/avatar/api";
import { validateUpload } from "@/lib/avatar/upload";
import { errorMessage } from "@/components/duel/duel-utils";
import { initialsOf } from "@/components/avatar";

type Mine = { path: string; status: "pending" | "approved" | "hidden" | "rejected"; reason: string | null } | null;

const STATUS_TEXT: Record<Exclude<NonNullable<Mine>["status"], "approved">, string> = {
  pending: "Granskas av teamet. Bara du ser bilden tills den är godkänd.",
  hidden: "Dold efter rapporter från andra. Teamet granskar den.",
  rejected: "Teamet godkände inte bilden. Välj en annan.",
};

/** Profilbild på /profil: ladda upp, byt och ta bort (docs/profilbild/plan.md). */
export function ProfilePictureEditor({ userId, name }: { userId: string; name: string }) {
  const [mine, setMine] = useState<Mine>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setMine((await fetchMyAvatar(userId)) as Mine);
    } catch {
      /* ingen bild visas */
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    fetchMyAvatar(userId)
      .then((m) => !cancelled && setMine(m as Mine))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const invalid = validateUpload(file);
    if (invalid) {
      setMessage({ tone: "error", text: invalid });
      return;
    }
    setBusy(true);
    setMessage({ tone: "info", text: "Kontrollerar bilden …" });
    try {
      const r = await uploadAvatar(file, userId);
      if (r.status === "rejected") setMessage({ tone: "error", text: r.error });
      else if (r.status === "pending") setMessage({ tone: "info", text: "Bilden är sparad och granskas av teamet innan andra ser den." });
      else setMessage({ tone: "info", text: "Klart! Din nya profilbild syns nu." });
      await load();
    } catch (e) {
      setMessage({ tone: "error", text: errorMessage(e, "Bilden kunde inte laddas upp.") });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function onRemove() {
    setBusy(true);
    try {
      await removeAvatar(userId);
      setMine(null);
      setMessage({ tone: "info", text: "Profilbilden är borttagen." });
    } catch (e) {
      setMessage({ tone: "error", text: errorMessage(e, "Bilden kunde inte tas bort.") });
    } finally {
      setBusy(false);
    }
  }

  const showImage = mine && mine.status !== "rejected";
  return (
    <div className="flex flex-col items-start gap-3">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl(mine.path)}
          alt="Din profilbild"
          width={256}
          height={256}
          className="size-20 rounded-full border border-[var(--line)] object-cover"
        />
      ) : (
        <span aria-hidden className="flex size-20 items-center justify-center rounded-full bg-[var(--accent-soft)] text-2xl font-semibold text-[var(--brand)]">
          {initialsOf(name)}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          id="profilbild"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <label
          htmlFor="profilbild"
          className={`inline-flex min-h-10 cursor-pointer items-center rounded-md border border-[var(--line-strong)] bg-card px-3 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--ring)] ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          {mine ? "Byt bild" : "Ladda upp bild"}
        </label>
        {mine ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRemove()}
            className="inline-flex min-h-10 items-center rounded-md px-3 text-sm text-[var(--ink-muted)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            Ta bort
          </button>
        ) : null}
      </div>
      {mine && mine.status !== "approved" ? (
        <p className="max-w-xs text-xs text-[var(--ink-muted)]">{STATUS_TEXT[mine.status]}</p>
      ) : null}
      {message ? (
        <p
          className={`max-w-xs text-sm ${message.tone === "error" ? "text-[var(--destructive)]" : "text-[var(--ink-soft)]"}`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ) : null}
      <p className="max-w-xs text-xs text-[var(--ink-muted)]">
        JPEG, PNG eller WebP. Bilden kontrolleras automatiskt innan andra ser den. Använd inte en bild på någon annan
        – du behöver inte visa ansiktet.
      </p>
    </div>
  );
}

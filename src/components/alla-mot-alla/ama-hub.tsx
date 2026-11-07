"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { LoginPanel } from "@/components/auth/login-panel";
import { POOL_KINDS } from "@/lib/pool-time";
import { createRoom, findMatch, joinRoom } from "@/lib/alla-mot-alla/api";
import { errorMessage } from "@/components/duel/duel-utils";
import { KindPicker } from "./kind-picker";

/** Startsidan för Alla mot alla: sök match, skapa rum eller gå med med kod. */
export function AmaHub({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [kinds, setKinds] = useState<string[]>([...POOL_KINDS]);
  const [extended, setExtended] = useState(false);
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoJoined = useRef(false);

  async function run(fn: () => Promise<string>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      const id = await fn();
      router.push(`/alla-mot-alla/${id}`);
    } catch (e) {
      setError(errorMessage(e, fallback));
      setBusy(false);
    }
  }

  // En inbjudningslänk (?kod=ABC123) går med direkt när man är inloggad.
  useEffect(() => {
    if (!user || !initialCode || autoJoined.current) return;
    autoJoined.current = true;
    void run(() => joinRoom(initialCode), "Kunde inte gå med i rummet.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialCode]);

  if (loading) {
    return (
      <div className="space-y-8 sm:space-y-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--mist)]" />
        <div className="h-40 animate-pulse rounded-[10px] bg-card/70" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
          Alla mot alla
        </h1>
        <p className="text-[var(--ink-muted)]">
          Tävla med HP-frågor mot vänner eller andra spelare, alla på samma fråga samtidigt. Logga in
          för att spela.
        </p>
        <LoginPanel />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Alla mot alla
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Alla får samma fråga samtidigt. Rätt svar ger 600 poäng och upp till 400 till för snabbhet.
          Tio frågor ur ORD, MEK, XYZ, KVA och NOG.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-4 py-3 text-sm text-[var(--destructive)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
        <section className="flex flex-col rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">Sök match</h2>
          <p className="mt-1 flex-1 text-sm text-[var(--ink-muted)]">
            Spela mot 3–7 andra. Hittas inga spelare inom en minut fyller botar de tomma platserna.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(findMatch, "Kunde inte söka match.")}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:opacity-50"
          >
            Sök match
          </button>
        </section>

        <section className="flex flex-col rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">Skapa rum</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">För 2–30 spelare. Du väljer delprov och startar.</p>
          <KindPicker value={kinds} onChange={setKinds} className="mt-4" />
          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={extended}
              onChange={(e) => setExtended(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Längre tid (×1,5)
          </label>
          <button
            type="button"
            disabled={busy || kinds.length === 0}
            onClick={() => void run(async () => (await createRoom(kinds, extended)).game_id, "Kunde inte skapa rummet.")}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line-strong)] bg-card px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:opacity-50"
          >
            Skapa rum
          </button>
        </section>

        <section className="flex flex-col rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]">Gå med i ett rum</h2>
          <p className="mt-1 flex-1 text-sm text-[var(--ink-muted)]">Skriv koden du fått av den som skapade rummet.</p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().length >= 4) void run(() => joinRoom(code), "Kunde inte gå med i rummet.");
            }}
          >
            <label htmlFor="ama-code" className="sr-only">Rumskod</label>
            <input
              id="ama-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm uppercase tracking-normal text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-card px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)] disabled:opacity-50"
            >
              Gå med
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

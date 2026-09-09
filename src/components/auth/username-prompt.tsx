"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

/**
 * Engångsprompt som visas direkt efter inloggning när användaren saknar
 * användarnamn. Stänger sig själv när användarnamnet satts (username blir
 * icke-null i AuthContext). "Senare" stänger den bara för den här sessionen
 * (lokal state) — vid nästa inloggning visas den igen.
 */
export function UsernamePrompt() {
  const { user, username, loading, setUsername } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || username || loading || dismissed) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await setUsername(value.trim());
    if (error) {
      setError(error);
      setSubmitting(false);
    }
    // Vid lyckat resultat uppdateras username i AuthContext och prompten stängs.
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        onClick={() => setDismissed(true)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Välj ett användarnamn"
        className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Välj ett användarnamn
        </h2>
        <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
          Ditt användarnamn är unikt och visas i dueller och på din profil.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={20}
            autoFocus
            placeholder="t.ex. pluggproffset"
            autoComplete="off"
            spellCheck={false}
            aria-label="Användarnamn"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--ink-muted)] focus:ring-2"
          />
          {error ? (
            <p className="text-xs text-[#9a3412]" aria-live="polite">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                </svg>
                Sparar…
              </>
            ) : (
              "Spara"
            )}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--accent)]"
          >
            Senare
          </button>
        </div>
      </div>
    </div>
  );
}

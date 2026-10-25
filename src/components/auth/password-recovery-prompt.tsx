"use client";

import { useId, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { friendlyAuthError } from "@/components/auth/auth-forms";

/**
 * Visas när användaren kommit tillbaka via länken i "Glömt lösenord?"-mejlet
 * (Supabase loggar in med en återställningssession). Användaren väljer ett nytt
 * lösenord här; "Inte nu" stänger utan att byta.
 */
export function PasswordRecoveryPrompt() {
  const { user, passwordRecovery, updatePassword, dismissPasswordRecovery } = useAuth();
  const uid = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!user || !passwordRecovery) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(friendlyAuthError(error));
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  function close() {
    setDone(false);
    dismissPasswordRecovery();
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        onClick={done ? close : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="relative w-full max-w-sm rounded-[10px] border border-[var(--line)] bg-card p-6"
      >
        <h2
          id={`${uid}-title`}
          className="font-[family-name:var(--font-display)] font-semibold text-xl text-[var(--ink)]"
        >
          {done ? "Lösenordet är bytt" : "Välj ett nytt lösenord"}
        </h2>

        {done ? (
          <>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]" aria-live="polite">
              Du är inloggad. Nästa gång loggar du in med ditt nya lösenord.
            </p>
            <button
              type="button"
              onClick={close}
              autoFocus
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Klart
            </button>
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Du kom hit via återställningslänken. Välj lösenordet du vill logga in med.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
              <label htmlFor={`${uid}-password`} className="block space-y-2">
                <span className="block text-sm font-medium text-[var(--ink)]">
                  Nytt lösenord (minst 8 tecken)
                </span>
                <input
                  id={`${uid}-password`}
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label htmlFor={`${uid}-confirm`} className="block space-y-2">
                <span className="block text-sm font-medium text-[var(--ink)]">
                  Bekräfta lösenord
                </span>
                <input
                  id={`${uid}-confirm`}
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </label>
              {error ? (
                <p className="text-xs text-[var(--destructive)]" aria-live="polite">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sparar…" : "Spara nytt lösenord"}
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={close}
                className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--brand)]"
              >
                Inte nu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

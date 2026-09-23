"use client";

import { useId, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "reset";

/** Mappar vanliga Supabase-felmeddelanden till vänlig svensk text. */
function friendlyAuthError(message: string): string {
  if (message === "Invalid login credentials") return "Fel e-post eller lösenord.";
  if (message === "User already registered") {
    return "Det finns redan ett konto med denna e-post. Logga in i stället.";
  }
  if (message.startsWith("Password should be at least")) {
    return "Lösenordet måste vara minst 8 tecken.";
  }
  return message;
}

/**
 * Delad inloggnings-/registrerings-/återställningskomponent för e-post + lösenord.
 * Används i headerns dropdown (compact) samt i duell- och gransknings-gates
 * (fullstor). Renderar sitt eget kort när `compact` är false och är därmed
 * oberoende av omgivande layout.
 */
export function AuthForms({ compact = false }: { compact?: boolean }) {
  const { signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const uid = useId();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // E-postadress att visa i framgångspanelen (bekräftelse / återställning).
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setSubmitting(false);
    setPassword("");
    setConfirm("");
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim().includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }
    if (!password) {
      setError("Ange ditt lösenord.");
      return;
    }
    setSubmitting(true);
    const { error } = await signInWithEmail(email.trim(), password);
    if (error) {
      setError(friendlyAuthError(error));
      setSubmitting(false);
    }
    // Vid lyckad inloggning laddas sidan om via onAuthChanged — gör inget här.
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim().includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setSubmitting(true);
    const { error, needsConfirmation } = await signUpWithEmail(
      email.trim(),
      password,
    );
    if (error) {
      setError(friendlyAuthError(error));
      setSubmitting(false);
      return;
    }
    if (needsConfirmation) {
      setSuccess(email.trim());
      setSubmitting(false);
    }
    // Annars är sessionen etablerad och sidan laddas om via onAuthChanged.
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim().includes("@")) {
      setError("Ange en giltig e-postadress.");
      return;
    }
    setSubmitting(true);
    const { error } = await sendPasswordReset(email.trim());
    if (error) {
      setError(error);
      setSubmitting(false);
      return;
    }
    setSuccess(email.trim());
    setSubmitting(false);
  }

  const inputClass = cn(
    "w-full rounded-lg border border-[var(--line-strong)] bg-card text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2",
    compact ? "px-3 py-1.5 text-sm" : "px-3 py-2 text-sm",
  );
  const labelClass = cn(
    "block font-medium text-[var(--ink)]",
    compact ? "text-xs" : "text-sm",
  );
  const submitClass = cn(
    "inline-flex w-full items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
    compact ? "min-h-9 px-3 py-2" : "min-h-11 px-4 py-2.5",
  );

  if (success) {
    const isReset = mode === "reset";
    return (
      <div
        className={cn(
          "space-y-3 text-left",
          !compact &&
            "rounded-2xl border border-[var(--line)] bg-card/80 p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]",
        )}
        aria-live="polite"
      >
        <p className="text-base font-semibold text-[var(--ink)]">
          {isReset ? "Kolla din inkorg" : "Bekräfta din e-post"}
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          {isReset
            ? `Vi har skickat en återställningslänk till ${success}. Klicka på länken i mejlet för att välja ett nytt lösenord.`
            : `Vi har skickat en bekräftelselänk till ${success}. Klicka på länken i mejlet för att aktivera ditt konto.`}
        </p>
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={
            isReset
              ? "text-sm font-medium text-[var(--brand)] transition hover:underline"
              : "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          }
        >
          {isReset ? "Tillbaka till inloggning" : "Logga in"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 text-left",
        !compact &&
          "rounded-2xl border border-[var(--line)] bg-card/80 p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]",
      )}
    >
      {mode === "signin" ? (
        <form onSubmit={handleSignIn} noValidate className="space-y-3">
          <label htmlFor={`${uid}-email`} className="block space-y-1.5">
            <span className={labelClass}>E-post</span>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@exempel.se"
              className={inputClass}
            />
          </label>
          <label htmlFor={`${uid}-password`} className="block space-y-1.5">
            <span className={labelClass}>Lösenord</span>
            <input
              id={`${uid}-password`}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {error ? (
            <p className="text-xs text-[var(--destructive)]" aria-live="polite">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting} className={submitClass}>
            {submitting ? "Loggar in…" : "Logga in"}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="font-medium text-[var(--ink-muted)] transition hover:text-[var(--brand)]"
            >
              Glömt lösenord?
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-medium text-[var(--brand)] transition hover:underline"
            >
              Skapa konto
            </button>
          </div>
        </form>
      ) : mode === "signup" ? (
        <form onSubmit={handleSignUp} noValidate className="space-y-3">
          <label htmlFor={`${uid}-signup-email`} className="block space-y-1.5">
            <span className={labelClass}>E-post</span>
            <input
              id={`${uid}-signup-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@exempel.se"
              className={inputClass}
            />
          </label>
          <label htmlFor={`${uid}-new-password`} className="block space-y-1.5">
            <span className={labelClass}>Lösenord (minst 8 tecken)</span>
            <input
              id={`${uid}-new-password`}
              name="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <label htmlFor={`${uid}-confirm-password`} className="block space-y-1.5">
            <span className={labelClass}>Bekräfta lösenord</span>
            <input
              id={`${uid}-confirm-password`}
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
          <button type="submit" disabled={submitting} className={submitClass}>
            {submitting ? "Skapar konto…" : "Skapa konto"}
          </button>
          <p className="text-center text-xs text-[var(--ink-muted)]">
            Har redan konto?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-medium text-[var(--brand)] transition hover:underline"
            >
              Logga in
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleReset} noValidate className="space-y-3">
          <p className="text-sm text-[var(--ink-muted)]">
            Skriv in din e-post så skickar vi en länk för att återställa
            lösenordet.
          </p>
          <label htmlFor={`${uid}-reset-email`} className="block space-y-1.5">
            <span className={labelClass}>E-post</span>
            <input
              id={`${uid}-reset-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@exempel.se"
              className={inputClass}
            />
          </label>
          {error ? (
            <p className="text-xs text-[var(--destructive)]" aria-live="polite">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting} className={submitClass}>
            {submitting ? "Skickar…" : "Skicka återställningslänk"}
          </button>
          <p className="text-center text-xs text-[var(--ink-muted)]">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-medium text-[var(--brand)] transition hover:underline"
            >
              Tillbaka till inloggning
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

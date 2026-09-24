"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { AuthForms } from "@/components/auth/auth-forms";
import { cn } from "@/lib/utils";

function GoogleG() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17.2C3.2 21.2 7.3 24 12 24Z" />
      <path fill="#FBBC05" d="M5.1 14.3c-.3-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.2 0 12s.4 3.6 1.2 5.2l3.9-2.9Z" />
      <path fill="#EA4335" d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.2 2.8 1.2 6.8l3.9 2.9C6 6.8 8.8 4.7 12 4.7Z" />
    </svg>
  );
}

/** Google-inloggning som sekundärt alternativ, med samma utseende överallt. */
export function GoogleButton({ className }: { className?: string }) {
  const { signInWithGoogle } = useAuth();
  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className={cn(
        "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]",
        className,
      )}
    >
      <GoogleG />
      Fortsätt med Google
    </button>
  );
}

/**
 * Inloggningsyta: e-post + lösenord är förstahandsvalet (skapa konto går att
 * göra direkt i formuläret), Google är ett alternativ. Används i headern och i
 * alla inloggningsgrindar så att vägen in ser likadan ut överallt.
 */
export function LoginPanel({
  compact = false,
  note,
}: {
  compact?: boolean;
  note?: string;
}) {
  return (
    <div className={cn("text-left", compact ? "space-y-3" : "space-y-4")}>
      {note ? <p className="text-sm text-[var(--ink-muted)]">{note}</p> : null}
      <AuthForms compact={compact} />
      <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        eller
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <GoogleButton />
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useStudiehjalpAccess } from "@/lib/studiehjalp/access";
import { useAuth } from "@/lib/supabase/auth-context";
import { LoginPanel } from "@/components/auth/login-panel";
import { Notice, Panel } from "./ui";

export function Spinner({ label = "Laddar…" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      {label}
    </p>
  );
}

/**
 * Visar innehållet bara när flaggan är påslagen för användaren (och, om
 * `requireLogin`, när någon är inloggad). Det är bara gränssnittet: databasen
 * kontrollerar flaggan och behörigheten själv.
 */
export function StudiehjalpGate({
  flag,
  requireLogin = false,
  loginNote,
  children,
}: {
  flag: string;
  requireLogin?: boolean;
  loginNote?: string;
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const access = useStudiehjalpAccess();

  if (authLoading || access.loading) return <Spinner />;

  if (!access.hasFlag(flag)) {
    return (
      <Notice>
        Den här delen av Studiehjälp är inte öppen än.{" "}
        <Link href="/" className="font-medium text-[var(--brand)] hover:underline">
          Till översikten
        </Link>
      </Notice>
    );
  }

  if (requireLogin && !user) {
    return (
      <Panel className="max-w-md">
        <LoginPanel note={loginNote ?? "Logga in för att fortsätta."} />
      </Panel>
    );
  }

  return <>{children}</>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function IconHome() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5v-15Z" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function IconLight() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
    </svg>
  );
}

function IconGauge() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4.5-4.5" />
      <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

function AuthCluster() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (!isSupabaseConfigured() || loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-40 truncate text-xs text-[var(--ink-muted)] sm:inline">
          {user.email ?? "Inloggad"}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
        >
          Logga ut
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
    >
      <GoogleG />
      <span className="hidden sm:inline">Logga in med Google</span>
      <span className="sm:hidden">Logga in</span>
    </button>
  );
}

const NAV = [
  { href: "/", label: "Hem", icon: IconHome },
  { href: "/nivatest", label: "Nivåtest", icon: IconGauge },
  { href: "/plan", label: "Plan", icon: IconCalendar },
  { href: "/ova", label: "Öva", icon: IconBook },
  { href: "/prov", label: "Prov", icon: IconFile },
  { href: "/resultat", label: "Poäng", icon: IconChart },
  { href: "/tips", label: "Tips", icon: IconLight },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 5%, color-mix(in oklab, var(--lagoon) 22%, transparent), transparent 50%), linear-gradient(180deg, var(--fog) 0%, var(--paper) 38%, var(--fog) 100%)",
        }}
      />

      <header
        className="sticky top-0 z-30 border-b border-[var(--line)]/80 bg-[color-mix(in_oklab,var(--paper)_82%,white)]/90 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl">
              HP Lift
            </span>
            <span className="hidden text-sm text-[var(--ink-muted)] sm:inline">
              studieplan från dina resultat
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Huvudmeny">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AuthCluster />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-6 sm:px-8 sm:pt-8 md:pb-12">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_90%,white)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Huvudmeny"
      >
        <ul className="grid grid-cols-7">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                  }`}
                >
                  <Icon />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

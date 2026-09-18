"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Home,
  LogOut,
  Moon,
  Swords,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { usePreferences } from "@/lib/preferences";
import { useHydrated } from "@/lib/use-hydrated";
import { play } from "@/lib/sound";
import { Mascot } from "@/components/mascot";
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

function AuthCluster() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (!isSupabaseConfigured() || loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="flex size-8 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-extrabold text-white shadow-soft"
          title={user.email ?? "Inloggad"}
        >
          {(user.email ?? "H")[0]?.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          title="Logga ut"
          aria-label="Logga ut"
          className="flex size-8 items-center justify-center rounded-full text-[var(--ink-muted)] transition hover:bg-[var(--mist)] hover:text-[var(--ink)] active:scale-90"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-sm font-bold text-[var(--ink)] shadow-soft transition hover:bg-[var(--accent-soft)] hover:shadow-card active:scale-95"
    >
      <GoogleG />
      <span className="hidden sm:inline">Logga in med Google</span>
      <span className="sm:hidden">Logga in</span>
    </button>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-[var(--ink-soft)] transition hover:bg-[var(--mist)] hover:text-[var(--ink)] active:scale-90"
    >
      {children}
    </button>
  );
}

const NAV = [
  { href: "/", label: "Hem", icon: Home },
  { href: "/ova", label: "Öva", icon: BookOpen },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/prov", label: "Prov", icon: FileText },
  { href: "/duell", label: "Duell", icon: Swords },
  { href: "/resultat", label: "Statistik", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme, sound, setSound } = usePreferences();
  const mounted = useHydrated();

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      {/* Bakgrund — mjuka färgfläckar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 5%, color-mix(in oklab, var(--lagoon) 18%, transparent), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 110%, color-mix(in oklab, var(--energy) 7%, transparent), transparent 55%), linear-gradient(180deg, var(--fog) 0%, var(--paper) 38%, var(--fog) 100%)",
        }}
      />

      {/* Flytande header */}
      <header
        className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-6xl sm:w-[calc(100%-2rem)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--line)]/80 bg-[color-mix(in_oklab,var(--paper)_86%,white)]/90 px-3 py-2 shadow-soft backdrop-blur-md dark:bg-[color-mix(in_oklab,var(--paper)_86%,black)]/90">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-1 transition active:scale-95">
            <Mascot mood="idle" float={false} className="size-9" />
            <span className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl">
                HP Lift
              </span>
              <span className="hidden text-xs font-semibold text-[var(--ink-muted)] lg:inline">
                plugga smartare till högskoleprovet
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Huvudmeny">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-bold transition active:scale-95",
                    active ? "text-[var(--ink)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[var(--accent-soft)] shadow-soft"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => {
                setSound(!sound);
              }}
              label={!mounted ? "Ljud" : sound ? "Stäng av ljud" : "Sätt på ljud"}
            >
              {mounted && sound ? <Volume2 className="size-4.5" /> : <VolumeX className="size-4.5" />}
            </IconButton>
            <IconButton
              onClick={toggleTheme}
              label={!mounted ? "Tema" : resolvedTheme === "dark" ? "Ljust läge" : "Mörkt läge"}
            >
              <motion.span
                key={mounted ? resolvedTheme : "pending"}
                initial={mounted ? { rotate: -90, opacity: 0, scale: 0.6 } : false}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                className="flex"
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
              </motion.span>
            </IconButton>
            <div className="mx-1 hidden h-5 w-px bg-[var(--line)] sm:block" />
            <AuthCluster />
          </div>
        </div>
      </header>

      {/* Sidinnehåll med mjuk övergång */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-32 pt-6 sm:px-8 sm:pt-8 md:pb-16"
      >
        {children}
      </motion.main>

      {/* Flytande mobilmeny */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        aria-label="Huvudmeny"
      >
        <ul className="mx-auto grid max-w-md grid-cols-6 rounded-2xl border border-[var(--line)]/80 bg-[color-mix(in_oklab,var(--paper)_88%,white)]/95 p-1.5 shadow-card backdrop-blur-md dark:bg-[color-mix(in_oklab,var(--paper)_88%,black)]/95">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => active && play("click")}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10.5px] font-bold transition active:scale-90",
                    active ? "text-[var(--ink)]" : "text-[var(--ink-muted)]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="mob-pill"
                      className="absolute inset-0 rounded-xl bg-[var(--accent-soft)]"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.45 }}
                    />
                  )}
                  <Icon className="relative size-5" />
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  Lightbulb,
  LogOut,
  Moon,
  Sun,
  Swords,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthForms } from "@/components/auth/auth-forms";
import { UsernamePrompt } from "@/components/auth/username-prompt";
import { usePreferences } from "@/lib/preferences";
import { useHydrated } from "@/lib/use-hydrated";
import { play } from "@/lib/sound";
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
  const { user, loading, username, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stänger dropdownen vid klick utanför eller Escape.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!isSupabaseConfigured() || loading) return null;

  if (user) {
    const displayName = username ?? user.email ?? "Inloggad";
    const initials = displayName.slice(0, 2).toUpperCase();
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-foreground)]">
            {initials}
          </span>
          <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
          <ChevronDown size={14} className="text-[var(--ink-muted)]" aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            aria-label="Konto"
            className="absolute right-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--line)] bg-white p-1.5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
          >
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              <User size={16} className="text-[var(--ink-muted)]" aria-hidden />
              Profil
            </Link>
            <Link
              href="/review"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              <ClipboardCheck size={16} className="text-[var(--ink-muted)]" aria-hidden />
              Granska
            </Link>
            <div className="my-1.5 h-px bg-[var(--line)]" />
            <button
              type="button"
              onClick={() => void signOut()}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              <LogOut size={16} className="text-[var(--ink-muted)]" aria-hidden />
              Logga ut
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--brand)] transition hover:bg-[var(--accent-soft)]"
      >
        Logga in
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Logga in"
          className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
        >
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
          >
            <GoogleG />
            Fortsätt med Google
          </button>
          <div className="my-3 flex items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="h-px flex-1 bg-[var(--line)]" />
            eller
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
          <AuthForms compact />
        </div>
      ) : null}
    </div>
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
  { href: "/nivatest", label: "Nivåtest", icon: Gauge },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/ova", label: "Öva", icon: BookOpen },
  { href: "/prov", label: "Prov", icon: FileText },
  { href: "/duell", label: "Duell", icon: Swords },
  { href: "/resultat", label: "Poäng", icon: BarChart3 },
  { href: "/tips", label: "Tips", icon: Lightbulb },
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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl">
              HP Lift
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Huvudmeny">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const hideOnMd = item.href === "/tips";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-bold transition active:scale-95",
                    active ? "text-[var(--ink)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                    hideOnMd && "hidden lg:inline",
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

      {/* Engångsprompt för användarnamn (rendreras efter inloggning, oavsett sida). */}
      <UsernamePrompt />

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
        <ul className="mx-auto grid max-w-md grid-cols-7 rounded-2xl border border-[var(--line)]/80 bg-[color-mix(in_oklab,var(--paper)_88%,white)]/95 p-1.5 shadow-card backdrop-blur-md dark:bg-[color-mix(in_oklab,var(--paper)_88%,black)]/95">
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

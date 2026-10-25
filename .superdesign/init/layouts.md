# Layouts

There is a single root layout. No nested `layout.tsx` files exist; every route renders inside the same shell.

Provider stack (in `src/app/layout.tsx`): `PreferencesProvider` (theme + sound) > `AuthProvider` (Supabase) > `GamificationProvider` (XP/streak) > `PlanProvider` (study plan) > `AppShell` + `CelebrationLayer`.

## Root layout
- Path: `src/app/layout.tsx`
- Renders `<html lang="sv">` with Fraunces (`--font-display`) + Nunito (`--font-sans`) from `next/font/google`, an inline pre-paint script that adds `.dark` from `localStorage["hp-lift-theme"]` / `prefers-color-scheme`, a Dark Reader attribute stripper, and `<body class="flex min-h-full flex-col font-sans">`. themeColor: light `#f7f5ef`, dark `#0d1417`.

```tsx
import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlanProvider } from "@/components/plan-context";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { PreferencesProvider } from "@/lib/preferences";
import { GamificationProvider } from "@/lib/gamification/provider";
import { CelebrationLayer } from "@/components/gamification/celebration-layer";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const sans = Nunito({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "HP Lift — Studieplan för Högskoleprovet",
    template: "%s · HP Lift",
  },
  description:
    "Mata in dina HP-resultat och få en personlig studieplan med prioritering, tidsfördelning och veckoplan.",
  other: {
    // Be Dark Reader att hoppa över sidan — tillägget lägger annars till
    // data-darkreader-*-attribut som ger hydreringsvarningar (se scriptet).
    "darkreader-lock": "",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1417" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <head>
        {/* Sätt tema-klassen innan första målningen — undviker ljust flimmer
            i mörkt läge. Körs i <head> direkt, inte via beforeInteractive. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("hp-lift-theme");
                  var dark = stored === "dark"
                    || ((stored !== "light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  if (dark) document.documentElement.classList.add("dark");
                } catch (e) {}
              })();
            `,
          }}
        />
        {/*
          Dark Reader och liknande webbläsartillägg lägger till data-*-attribut
          på elementen innan React hydrerar. Server-HTML:en har inte dessa, så
          React varnar om mismatch. Ta bort attributen — tillägget återskapar
          dem vid behov efteråt, utan nya kontroller. Körs inline i <head>
          direkt, precis som tema-scriptet ovan, i stället för via
          <Script strategy="beforeInteractive"> som kastade React-felet
          "Encountered a script tag" på 404-rutter. Kör även om vid
          DOMContentLoaded så att attribut på body-element hinns med.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function strip() {
                  try {
                    var all = document.querySelectorAll("*");
                    for (var i = 0; i < all.length; i++) {
                      var attrs = all[i].attributes;
                      for (var j = attrs.length - 1; j >= 0; j--) {
                        var name = attrs[j].name;
                        if (name.indexOf("data-darkreader") === 0) {
                          all[i].removeAttribute(name);
                        }
                      }
                    }
                  } catch (e) {}
                }
                strip();
                if (document.readyState === "loading") {
                  document.addEventListener("DOMContentLoaded", strip);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <PreferencesProvider>
          <AuthProvider>
            <GamificationProvider>
              <PlanProvider>
                <AppShell>{children}</AppShell>
                <CelebrationLayer />
              </PlanProvider>
            </GamificationProvider>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
```

## AppShell (header, desktop nav, footer, mobile bottom nav)
- Path: `src/components/app-shell.tsx`
- Renders:
  - Background: absolute layer of soft radial gradients (brand top-left, lagoon top-right, energy bottom) over a fog -> paper -> fog vertical gradient.
  - **Floating sticky header** (`sticky top-3`, max-w-6xl, no background/border of its own): "HP Lift" wordmark in Fraunces, desktop nav (`md:flex`) with grouped dropdown menus (Plan: Veckoplan/Nivåtest/Poäng; Öva: Öva delprov/ORD-Flashcards/Läsbibliotek/Gamla prov/Duell) and flat links (Forum, Tips). Active item gets an animated `motion` pill (`layoutId="nav-pill"`, `bg-[var(--accent-soft)] shadow-soft`). Right side: sound toggle, theme toggle (rotating icon), divider, AuthCluster (avatar initials + account menu: Profil, Granska, Logga ut; or "Logga in" popover with LoginPanel).
  - One-off prompts: PasswordRecoveryPrompt, UsernamePrompt.
  - `<motion.main key={pathname}>` fade/slide-in, `mx-auto max-w-6xl px-5 sm:px-8 pt-7 sm:pt-10 pb-10 md:pb-16`.
  - Footer: top border, tagline "HP Lift · byggs vidare med dina forslag" + links to `/feedback` and `/feedback?typ=problem`.
  - **Floating mobile bottom nav** (`md:hidden`, fixed bottom, 4-column grid in a rounded-2xl frosted card with `shadow-card backdrop-blur-md`), icon + label, group items open an upward menu panel.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers,
  Library,
  Lightbulb,
  LogOut,
  MessagesSquare,
  Moon,
  Sun,
  Swords,
  User,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { LoginPanel } from "@/components/auth/login-panel";
import { PasswordRecoveryPrompt } from "@/components/auth/password-recovery-prompt";
import { UsernamePrompt } from "@/components/auth/username-prompt";
import { usePreferences } from "@/lib/preferences";
import { useHydrated } from "@/lib/use-hydrated";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";

function AuthCluster() {
  const { user, loading, username, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useDismiss(open, setOpen, containerRef);

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
            className="absolute right-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--line)] bg-card p-1.5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
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
          className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--line)] bg-card p-4 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
        >
          <LoginPanel
            compact
            note="Logga in eller skapa konto med e-post – du behöver inget Google-konto."
          />
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

type NavLeaf = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; icon: LucideIcon; children: readonly NavLeaf[] };

const NAV: readonly (NavLeaf | NavGroup)[] = [
  {
    label: "Plan",
    icon: CalendarDays,
    children: [
      { href: "/plan", label: "Veckoplan", icon: CalendarDays },
      { href: "/nivatest", label: "Nivåtest", icon: Gauge },
      { href: "/resultat", label: "Poäng", icon: BarChart3 },
    ],
  },
  {
    label: "Öva",
    icon: BookOpen,
    children: [
      { href: "/ova", label: "Öva delprov", icon: BookOpen },
      { href: "/ova/flashcards", label: "ORD-Flashcards", icon: Layers },
      { href: "/bibliotek", label: "Läsbibliotek", icon: Library },
      { href: "/prov", label: "Gamla prov", icon: FileText },
      { href: "/duell", label: "Duell", icon: Swords },
    ],
  },
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/tips", label: "Tips", icon: Lightbulb },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Stänger en öppen meny vid klick utanför containern eller Escape. Delas av
 * kontomenyn och nav-menyerna så att beteendet aldrig kan divergera. */
function useDismiss(
  open: boolean,
  setOpen: (open: boolean) => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
  }, [open, ref, setOpen]);
}

const NAV_PANEL =
  "absolute z-50 w-56 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[var(--line)] bg-card p-1.5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]";

/** Menypost i navigationen: en grupp vars trigger är en knapp som fäller ut
 * barnen. Menyn stängs vid val av post, klick utanför och Escape. `variant`
 * styr markup och position — toppmenyn respektive bottenmenyn (ovanför baren). */
function NavMenu({
  item,
  pathname,
  variant,
}: {
  item: NavGroup;
  pathname: string;
  variant: "desktop" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useDismiss(open, setOpen, containerRef);

  const Icon = item.icon;
  const active = item.children.some((child) => isActive(pathname, child.href));
  const desktop = variant === "desktop";

  const panel = open ? (
    <div
      role="menu"
      aria-label={item.label}
      className={cn(
        NAV_PANEL,
        desktop ? "right-0 top-full mt-2" : "bottom-full left-0 right-0 mx-auto mb-2",
      )}
    >
      {item.children.map((child) => {
        const ChildIcon = child.icon;
        return (
          <Link
            key={child.href}
            href={child.href}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
          >
            <ChildIcon size={16} className="text-[var(--ink-muted)]" aria-hidden />
            {child.label}
          </Link>
        );
      })}
    </div>
  ) : null;

  if (desktop) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "relative flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 lg:px-3.5",
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
          <ChevronDown
            size={14}
            className={cn("relative text-[var(--ink-muted)] transition", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {panel}
      </div>
    );
  }

  return (
    <li>
      <div ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-bold transition active:scale-90 sm:text-[11px]",
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
        </button>
        {panel}
      </div>
    </li>
  );
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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl">
              HP Lift
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Huvudmeny">
            {NAV.map((item) => {
              if ("children" in item) {
                return (
                  <NavMenu key={item.label} item={item} pathname={pathname} variant="desktop" />
                );
              }
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 lg:px-3.5",
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

      {/* Engångsprompter efter inloggning, oavsett sida: nytt lösenord efter
          återställningslänken, sedan användarnamn. */}
      <PasswordRecoveryPrompt />
      <UsernamePrompt />

      {/* Sidinnehåll med mjuk övergång */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-7 sm:px-8 sm:pt-10 md:pb-16"
      >
        {children}
      </motion.main>

      {/* Sidfot: samma två kanaler som i profilen (Hjälp & feedback). */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-28 pt-8 sm:px-8 md:pb-10">
        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-muted)]">
            HP Lift · byggs vidare med dina förslag
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/feedback"
              className="text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              💡 Skicka önskemål
            </Link>
            <Link
              href="/feedback?typ=problem"
              className="text-sm font-semibold text-[var(--ink-muted)] hover:underline"
            >
              ⚠ Rapportera ett problem
            </Link>
          </div>
        </div>
      </footer>

      {/* Flytande mobilmeny */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-2 pb-4 sm:px-4 md:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        aria-label="Huvudmeny"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 rounded-2xl border border-[var(--line)]/80 bg-[color-mix(in_oklab,var(--paper)_88%,white)]/95 p-1.5 sm:p-2 shadow-card backdrop-blur-md dark:bg-[color-mix(in_oklab,var(--paper)_88%,black)]/95">
          {NAV.map((item) => {
            if ("children" in item) {
              return (
                <NavMenu key={item.label} item={item} pathname={pathname} variant="mobile" />
              );
            }
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => active && play("click")}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] sm:text-[11px] font-bold transition active:scale-90",
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
```

## Disclosure (section wrapper used on many pages)
- Path: `src/components/disclosure.tsx` — full source in `components.md`. Collapsible card sections used on plan, tips, results, library, dashboard.

## CelebrationLayer (global overlay)
- Path: `src/components/gamification/celebration-layer.tsx` — level-up/achievement toasts + confetti, mounted once in root layout.

```tsx
"use client";

/**
 * Firarlager — konsumerar motorns notiser och visar:
 *  - Konfetti (canvas-confetti) vid level-up, achievements och streak
 *  - Level-up-modal när användaren når en ny nivå
 *  - Toasts för achievements, uppdrag och streak
 * Allt respekterar prefers-reduced-motion och spelar ljud om det är på.
 */

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { ACHIEVEMENTS, QUEST_POOL } from "@/lib/gamification/config";
import {
  consumeNotifications,
  subscribeGamification,
  type GameNotification,
} from "@/lib/gamification/engine";
import { play } from "@/lib/sound";

const PALETTE = ["#0d7c6f", "#2ba89a", "#f59e0b", "#f2604f", "#ffffff"];

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function burst(big: boolean) {
  if (reducedMotion()) return;
  confetti({
    particleCount: big ? 160 : 70,
    spread: big ? 100 : 70,
    startVelocity: big ? 42 : 30,
    gravity: 0.9,
    scalar: big ? 1.1 : 0.85,
    ticks: big ? 260 : 180,
    origin: { x: 0.5, y: 0.35 },
    colors: PALETTE,
    disableForReducedMotion: true,
    zIndex: 200,
  });
}

type Toast = {
  id: number;
  emoji: string;
  title: string;
  desc: string;
};

let toastId = 0;

export function CelebrationLayer() {
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tick, setTick] = useState(0);
  const queueRef = useRef<GameNotification[]>([]);
  const busyRef = useRef(false);

  useEffect(() => {
    return subscribeGamification(() => {
      const incoming = consumeNotifications();
      if (incoming.length === 0) return;
      queueRef.current.push(...incoming);
      // Trigger en render så att kön faktiskt processas.
      setTick((t) => t + 1);
    });
  }, []);

  // Processa kön sekventiellt — level-up-modalen väntar på sin tur.
  useEffect(() => {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;

    busyRef.current = true;
    const showToast = (t: Omit<Toast, "id">) => {
      setToasts((prev) => [...prev.slice(-2), { ...t, id: ++toastId }]);
    };

    const finish = () => {
      busyRef.current = false;
    };

    switch (next.kind) {
      case "levelup": {
        burst(true);
        play("levelup");
        setLevelUp({ level: next.level, title: next.title });
        // Modal stänger sig själv; kön fortsätter när den stängs.
        break;
      }
      case "achievement": {
        const def = ACHIEVEMENTS.find((a) => a.id === next.id);
        if (def) {
          burst(false);
          play("achievement");
          showToast({ emoji: def.emoji, title: `Achievement: ${def.title}`, desc: def.desc });
        }
        finish();
        break;
      }
      case "questdone": {
        const def = QUEST_POOL.find((q) => q.id === next.questId);
        if (def) {
          play("questdone");
          showToast({
            emoji: def.emoji,
            title: "Uppdrag klart!",
            desc: `${def.label} · +${def.xp} XP`,
          });
        }
        finish();
        break;
      }
      case "streak": {
        play("streak");
        showToast({
          emoji: "🔥",
          title: `${next.count} dagar i rad!`,
          desc: "Din streak växer — fortsätt så!",
        });
        finish();
        break;
      }
      default:
        finish();
    }
  }, [tick, toasts, levelUp]);

  const closeLevelUp = () => {
    setLevelUp(null);
    busyRef.current = false;
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Level-up-modal */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            key="levelup"
            className="fixed inset-0 z-[150] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm"
              onClick={closeLevelUp}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Nivå upp: ${levelUp.title}`}
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="relative w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 text-center shadow-pop"
            >
              <p className="text-sm font-extrabold tracking-widest text-[var(--energy-ink)] uppercase">
                Nivå upp!
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">
                Nivå {levelUp.level}
              </h2>
              <p className="mt-1 text-lg font-bold text-[var(--brand)]">{levelUp.title}</p>
              <button
                type="button"
                onClick={closeLevelUp}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2.5 text-base font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Fortsätt plugga 🎉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[140] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
              onAnimationComplete={() => {
                window.setTimeout(() => dismissToast(t.id), 4000);
              }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--card)] p-3.5 text-left shadow-pop"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
                {t.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-[var(--ink)]">{t.title}</span>
                <span className="block truncate text-xs font-semibold text-[var(--ink-muted)]">{t.desc}</span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
```

## Auth prompts rendered by the shell
### `src/components/auth/password-recovery-prompt.tsx`

```tsx
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
        className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-card p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
      >
        <h2
          id={`${uid}-title`}
          className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]"
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
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
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
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
```

### `src/components/auth/username-prompt.tsx`

```tsx
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
  const { user, username, loading, passwordRecovery, setUsername } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Nytt lösenord först (PasswordRecoveryPrompt), användarnamnet sedan.
  if (!user || username || loading || dismissed || passwordRecovery) return null;

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
        className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-card p-6 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]"
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
            className="w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
          />
          {error ? (
            <p className="text-xs text-[var(--destructive)]" aria-live="polite">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--brand)]"
          >
            Senare
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Preferences provider (theme + sound state used by the header)

```tsx
"use client";

/**
 * Användarpreferenser: tema (ljus/mörkt/system) och ljud (opt-in).
 *
 * Tema-klassen sätts i ett inline-script i layout.tsx innan hydrering
 * (för att undvika flimmer); den här providen håller tillståndet i sync
 * och följer systeminställningen när temat är "system".
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isSoundEnabled, play, setSoundEnabled } from "@/lib/sound";

export type Theme = "light" | "dark" | "system";

type PreferencesState = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  sound: boolean;
  setSound: (on: boolean) => void;
};

const THEME_KEY = "hp-lift-theme";

const PreferencesContext = createContext<PreferencesState | null>(null);

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? (systemDark() ? "dark" : "light") : theme;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  // Inline-scriptet i layout.tsx har redan satt klassen — läs därifrån så
  // att initialvärdet matchar DOM:en exakt (inga hydreringsvarningar).
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  const [sound, setSoundState] = useState<boolean>(() => isSoundEnabled());

  const apply = useCallback((t: Theme) => {
    const r = resolve(t);
    setResolvedTheme(r);
    document.documentElement.classList.toggle("dark", r === "dark");
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      try {
        if (t === "system") localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, t);
      } catch {
        /* ignorera */
      }
      apply(t);
    },
    [apply],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    play("toggle");
  }, [resolvedTheme, setTheme]);

  // Följ systemets tema när inställningen är "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  const setSound = useCallback((on: boolean) => {
    setSoundState(on);
    setSoundEnabled(on);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme, sound, setSound }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences måste användas inuti <PreferencesProvider>");
  return ctx;
}
```


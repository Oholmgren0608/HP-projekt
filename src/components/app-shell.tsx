"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
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

function AuthCluster({ placement }: { placement: "sidebar" | "bar" }) {
  const { user, loading, username, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useDismiss(open, setOpen, containerRef);

  if (!isSupabaseConfigured() || loading) return null;

  const sidebar = placement === "sidebar";
  const panelPosition = sidebar ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2";
  const itemClass =
    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]";

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
          className={cn(
            "flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]",
            sidebar && "w-full",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--brand)]">
            {initials}
          </span>
          <span className={cn("max-w-32 truncate", !sidebar && "hidden sm:inline", sidebar && "flex-1 text-left")}>
            {displayName}
          </span>
          <ChevronDown size={14} className="shrink-0 text-[var(--ink-muted)]" aria-hidden />
        </button>
        {open ? (
          <div
            role="menu"
            aria-label="Konto"
            className={cn(
              "absolute z-40 w-56 max-w-[calc(100vw-2.5rem)] rounded-[10px] border border-[var(--line)] bg-card p-1.5 shadow-pop",
              panelPosition,
            )}
          >
            <Link href="/profil" onClick={() => setOpen(false)} role="menuitem" className={itemClass}>
              <User size={16} className="text-[var(--ink-muted)]" aria-hidden />
              Profil
            </Link>
            <Link href="/review" onClick={() => setOpen(false)} role="menuitem" className={itemClass}>
              <ClipboardCheck size={16} className="text-[var(--ink-muted)]" aria-hidden />
              Granska
            </Link>
            <div className="my-1.5 h-px bg-[var(--line)]" />
            <button type="button" onClick={() => void signOut()} role="menuitem" className={itemClass}>
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
        className={cn(
          "rounded-md px-3 py-2 text-sm font-medium text-[var(--brand)] transition-colors hover:bg-[var(--accent-soft)]",
          sidebar && "w-full text-left",
        )}
      >
        Logga in
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Logga in"
          className={cn(
            "absolute z-40 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--line)] bg-card p-4 shadow-pop",
            panelPosition,
          )}
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
      className="flex size-9 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--ink)]"
    >
      {children}
    </button>
  );
}

type NavLeaf = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; icon: LucideIcon; children: readonly NavLeaf[] };

const HOME: NavLeaf = { href: "/", label: "Översikt", icon: LayoutDashboard };

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
      { href: "/prov", label: "Prov", icon: FileText },
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

/** Stänger en öppen meny vid klick utanför containern eller Escape. */
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

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md text-base font-semibold text-[var(--ink)]"
    >
      <span aria-hidden className="size-5 rounded-[4px] bg-[var(--brand)]" />
      HP Lift
    </Link>
  );
}

const NAV_ITEM =
  "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors";

function SidebarNav({ pathname }: { pathname: string }) {
  const link = (item: NavLeaf) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          NAV_ITEM,
          active
            ? "bg-[var(--accent-soft)] text-[var(--brand)]"
            : "text-[var(--ink-soft)] hover:bg-[var(--mist)] hover:text-[var(--ink)]",
        )}
      >
        <Icon
          className={cn("size-[18px]", active ? "text-[var(--brand)]" : "text-[var(--ink-muted)]")}
          strokeWidth={1.5}
          aria-hidden
        />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Huvudmeny">
      {link(HOME)}
      {NAV.map((item) =>
        "children" in item ? (
          <div key={item.label} className="mt-5 flex flex-col gap-0.5">
            <p className="px-2.5 pb-1 text-[13px] text-[var(--ink-muted)]">{item.label}</p>
            {item.children.map(link)}
          </div>
        ) : (
          <div key={item.href} className="first-of-type:mt-5">
            {link(item)}
          </div>
        ),
      )}
    </nav>
  );
}

/** Gruppflik i mobilens bottenmeny: öppnar barnen i en meny ovanför baren. */
function MobileGroup({ item, pathname }: { item: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);
  useDismiss(open, setOpen, containerRef);

  const Icon = item.icon;
  const active = item.children.some((child) => isActive(pathname, child.href));

  return (
    <li className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium",
          active ? "text-[var(--brand)]" : "text-[var(--ink-muted)]",
        )}
      >
        <Icon className="size-5" strokeWidth={1.5} aria-hidden />
        {item.label}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={item.label}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-[10px] border border-[var(--line)] bg-card p-1.5 shadow-pop"
        >
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--mist)]",
                  isActive(pathname, child.href) ? "text-[var(--brand)]" : "text-[var(--ink)]",
                )}
              >
                <ChildIcon size={16} className="text-[var(--ink-muted)]" aria-hidden />
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </li>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme, sound, setSound } = usePreferences();
  const mounted = useHydrated();

  const soundLabel = !mounted ? "Ljud" : sound ? "Stäng av ljud" : "Sätt på ljud";
  const themeLabel = !mounted ? "Tema" : resolvedTheme === "dark" ? "Ljust läge" : "Mörkt läge";
  const SoundIcon = mounted && sound ? Volume2 : VolumeX;
  const ThemeIcon = mounted && resolvedTheme === "dark" ? Sun : Moon;

  return (
    <div className="flex min-h-full flex-col md:pl-60">
      {/* Sidomeny (dator) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--line)] bg-[var(--sidebar)] md:flex">
        <div className="flex h-14 shrink-0 items-center px-5">
          <Wordmark />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav pathname={pathname} />
        </div>
        <div className="flex flex-col gap-1 border-t border-[var(--line)] p-3">
          <div className="flex items-center gap-1">
            <IconButton onClick={() => setSound(!sound)} label={soundLabel}>
              <SoundIcon className="size-[18px]" strokeWidth={1.5} />
            </IconButton>
            <IconButton onClick={toggleTheme} label={themeLabel}>
              <ThemeIcon className="size-[18px]" strokeWidth={1.5} />
            </IconButton>
          </div>
          <AuthCluster placement="sidebar" />
        </div>
      </aside>

      {/* Toppfält (mobil) */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--sidebar)] md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Wordmark />
          <div className="flex items-center gap-1">
            <IconButton onClick={() => setSound(!sound)} label={soundLabel}>
              <SoundIcon className="size-[18px]" strokeWidth={1.5} />
            </IconButton>
            <IconButton onClick={toggleTheme} label={themeLabel}>
              <ThemeIcon className="size-[18px]" strokeWidth={1.5} />
            </IconButton>
            <AuthCluster placement="bar" />
          </div>
        </div>
      </header>

      {/* Engångsprompter efter inloggning, oavsett sida: nytt lösenord efter
          återställningslänken, sedan användarnamn. */}
      <PasswordRecoveryPrompt />
      <UsernamePrompt />

      <main
        key={pathname}
        className="animate-fade-in mx-auto w-full min-w-0 max-w-[1080px] flex-1 px-4 pb-10 pt-6 sm:px-8 sm:pt-10 md:pb-16"
      >
        {children}
      </main>

      {/* Sidfot: samma två kanaler som i profilen (Hjälp & feedback). */}
      <footer className="mx-auto w-full max-w-[1080px] px-4 pb-28 pt-6 sm:px-8 md:pb-10">
        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--ink-muted)]">HP Lift byggs vidare med dina förslag</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/feedback" className="text-sm font-medium text-[var(--brand)] hover:underline">
              Skicka önskemål
            </Link>
            <Link
              href="/feedback?typ=problem"
              className="text-sm font-medium text-[var(--ink-muted)] hover:underline"
            >
              Rapportera ett problem
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottenmeny (mobil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--sidebar)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Huvudmeny"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((item) => {
            if ("children" in item) {
              return <MobileGroup key={item.label} item={item} pathname={pathname} />;
            }
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => active && play("click")}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-[var(--brand)]" : "text-[var(--ink-muted)]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
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

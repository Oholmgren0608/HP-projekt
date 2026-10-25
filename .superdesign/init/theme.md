# Theme

## Part 1 — Compact token summary

Tailwind v4 CSS-first config: all tokens live in `src/app/globals.css` (`@theme inline`, `:root`, `.dark`). No `tailwind.config.*`. shadcn base color `neutral`, but every shadcn token is remapped to the app's own "paper & ink" palette. Components mostly reference raw app vars (`text-[var(--ink)]`) rather than shadcn names. Dark mode = `.dark` class on `<html>` (`@custom-variant dark (&:is(.dark *))`), toggled from the header, stored in `localStorage["hp-lift-theme"]`.

Character: warm "paper & ink" light theme with deep teal brand, playful game energy (amber XP, coral, green success); dark theme is deep blue-green "Spotify/Discord" focus mode.

### Core app palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` | `#14302c` | `#e8efeb` | Primary text, foreground |
| `--ink-soft` | `#334b48` | `#c4d2cd` | Body secondary text |
| `--ink-muted` | `#5b6b66` | `#8ca09a` | Muted text, icons |
| `--paper` | `#f7f5ef` | `#0d1417` | Page background |
| `--fog` | `#ecf1eb` | `#121c20` | Background gradient stops |
| `--mist` | `#e1e9e2` | `#1e2a2f` | Muted surfaces, tracks, skeletons, hover |
| `--line` | `#d9dfd5` | `#243239` | Borders |
| `--line-strong` | `#7a7f7d` | `#68797f` | Outline buttons, option borders |
| `--brand` | `#0c6f62` | `#35c4b2` | Primary (teal) |
| `--brand-deep` | `#0a5c52` | `#7ce3d4` | Gradient end, accent fg |
| `--accent-soft` | `#d6eee8` | `#12332e` | Active nav pill, chips, hover |
| `--lagoon` | `#2ba89a` | `#45cfbe` | Secondary teal, bg blob |
| `--lagoon-ink` | `#0c6f7c` | `#45cfbe` | Correct answer, ring, "styrka" |
| `--energy` / `-soft` / `-ink` | `#f59e0b` / `#fdf0d5` / `#9a5b00` | `#f6b93b` / `#3a2f14` / `#f6b93b` | XP, streak |
| `--coral` / `-soft` / `-ink` | `#f2604f` / `#fde3df` / `#b0301f` | `#ff7a6b` / `#3f201c` / `#ff7a6b` | Warnings, pace notice |
| `--success` / `-soft` / `-ink` | `#22965a` / `#dcf2e4` / `#0e6b3c` | `#4cc38a` / `#14301f` / `#4cc38a` | Success |

### shadcn semantic mapping
| Token | Light | Dark |
|---|---|---|
| `--background` / `--foreground` | `var(--paper)` / `var(--ink)` | same vars |
| `--card` / `--popover` | `#ffffff` / `#ffffff` | `#131d22` / `#152026` |
| `--primary` / `--primary-foreground` | `var(--brand)` / `#ffffff` | `var(--brand)` / `#05201c` |
| `--secondary`, `--muted` | `var(--mist)` | `var(--mist)` |
| `--muted-foreground` | `var(--ink-muted)` | `var(--ink-muted)` |
| `--accent` / `--accent-foreground` | `var(--accent-soft)` / `#0a5c52` | `var(--accent-soft)` / `#7ce3d4` |
| `--destructive` | `#b3302a` | `#f26d5e` |
| `--border`, `--input` | `var(--line)` | `var(--line)` |
| `--ring` | `var(--lagoon-ink)` | `var(--lagoon-ink)` |
| `--chart-1..5` | brand, lagoon-ink, energy-ink, coral-ink, ink-soft | ..., `#6b8f98` |

### Typography
- Sans / body: **Nunito** (`--font-sans`, via `next/font/google`, latin + latin-ext). Weights used heavily: `font-semibold`, `font-bold`, `font-extrabold`.
- Display / headings: **Fraunces** serif (`--font-display`; Tailwind `--font-heading`). Applied as `font-[family-name:var(--font-display)]`, usually with `tracking-tight`, regular weight.
- Mono: `ui-monospace`.
- Scale in use: eyebrow `text-xs uppercase tracking-[0.18em] font-semibold/extrabold text-[var(--brand)]`; h1 `text-3xl sm:text-4xl`; h2/card titles `text-xl`-`text-2xl` display; body `text-sm`/`text-base`; nav labels `text-sm font-bold`; mobile nav `text-[10.5px]`. `tabular-nums` for stats.

### Radius (`--radius: 1rem`)
sm `0.6rem` · md `0.8rem` · lg `1rem` · xl `1.4rem` · 2xl `1.8rem` · 3xl `2.2rem` · 4xl `2.6rem`. Note: Tailwind `rounded-2xl` resolves to 1.8rem here (very round). Buttons are `rounded-full` pills; cards `rounded-2xl`; hero `rounded-3xl`; options/menu items `rounded-lg`.

### Shadows (teal-tinted in light, black in dark)
- `shadow-soft`: `0 1px 2px rgb(20 48 44/.05), 0 6px 20px -4px rgb(20 48 44/.08)`
- `shadow-card`: `0 2px 4px rgb(20 48 44/.04), 0 12px 32px -8px rgb(20 48 44/.12)`
- `shadow-pop`: `0 8px 24px -6px rgb(20 48 44/.18), 0 2px 6px rgb(20 48 44/.08)`
- Menu panels: `shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]`

### Spacing, layout, breakpoints
- Tailwind default spacing scale. Content container `max-w-6xl`, `px-5 sm:px-8`; page sections `space-y-8 sm:space-y-10`; card padding `p-5 sm:p-6`; grids `gap-5 lg:gap-6`.
- Default Tailwind breakpoints (sm 640, md 768, lg 1024, xl 1280). `md` switches bottom nav -> top nav.
- Touch targets `min-h-11` (buttons), `min-h-14` (mobile nav).

### Motion
Custom keyframes: `animate-pop`, `animate-rise`, `animate-rise-delay`, `animate-wiggle(-infinite)`, `animate-flicker` (streak flame), `animate-shimmer` (XP bar), `animate-fade-in`; all disabled under `prefers-reduced-motion`. `motion/react` springs for nav pill and page enter (opacity 0->1, y 10->0, 0.3s). Buttons `hover:scale-[1.03] active:scale-95`.

### Background
AppShell paints radial gradient blobs: brand 16% top-left, lagoon 18% top-right, energy 7% bottom, over `linear-gradient(180deg, var(--fog), var(--paper) 38%, var(--fog))`.

---

## Part 2 — Raw source

### `src/app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans), "Nunito", ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --font-heading: var(--font-display), Georgia, serif;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --shadow-soft: var(--shadow-soft);
  --shadow-card: var(--shadow-card);
  --shadow-pop: var(--shadow-pop);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

/* ------------------------------------------------------------------ */
/*  Ljust tema — varmt, vänligt "paper & ink" med spelkänsla           */
/* ------------------------------------------------------------------ */
:root {
  --ink: #14302c;
  --ink-soft: #334b48;
  --ink-muted: #5b6b66;
  --paper: #f7f5ef;
  --fog: #ecf1eb;
  --mist: #e1e9e2;
  --line: #d9dfd5;
  --line-strong: #7a7f7d;
  --brand: #0c6f62;
  --brand-deep: #0a5c52;
  --accent-soft: #d6eee8;
  --lagoon: #2ba89a;
  --lagoon-ink: #0c6f7c;

  /* Spelenergi: XP, streak, firande */
  --energy: #f59e0b;
  --energy-soft: #fdf0d5;
  --energy-ink: #9a5b00;
  --coral: #f2604f;
  --coral-soft: #fde3df;
  --coral-ink: #b0301f;
  --success: #22965a;
  --success-soft: #dcf2e4;
  --success-ink: #0e6b3c;

  --background: var(--paper);
  --foreground: var(--ink);
  --card: #ffffff;
  --card-foreground: var(--ink);
  --popover: #ffffff;
  --popover-foreground: var(--ink);
  --primary: var(--brand);
  --primary-foreground: #ffffff;
  --secondary: var(--mist);
  --secondary-foreground: var(--ink);
  --muted: var(--mist);
  --muted-foreground: var(--ink-muted);
  --accent: var(--accent-soft);
  --accent-foreground: #0a5c52;
  --destructive: #b3302a;
  --border: var(--line);
  --input: var(--line);
  --ring: var(--lagoon-ink);
  --chart-1: var(--brand);
  --chart-2: var(--lagoon-ink);
  --chart-3: var(--energy-ink);
  --chart-4: var(--coral-ink);
  --chart-5: var(--ink-soft);
  --radius: 1rem;
  --shadow-soft: 0 1px 2px rgb(20 48 44 / 0.05), 0 6px 20px -4px rgb(20 48 44 / 0.08);
  --shadow-card: 0 2px 4px rgb(20 48 44 / 0.04), 0 12px 32px -8px rgb(20 48 44 / 0.12);
  --shadow-pop: 0 8px 24px -6px rgb(20 48 44 / 0.18), 0 2px 6px rgb(20 48 44 / 0.08);
  --sidebar: var(--paper);
  --sidebar-foreground: var(--ink);
  --sidebar-primary: var(--brand);
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: var(--mist);
  --sidebar-accent-foreground: var(--ink);
  --sidebar-border: var(--line);
  --sidebar-ring: var(--lagoon);
}

/* ------------------------------------------------------------------ */
/*  Mörkt tema — djupt, fokuserat (Spotify/Discord-känsla)             */
/* ------------------------------------------------------------------ */
.dark {
  --ink: #e8efeb;
  --ink-soft: #c4d2cd;
  --ink-muted: #8ca09a;
  --paper: #0d1417;
  --fog: #121c20;
  --mist: #1e2a2f;
  --line: #243239;
  --line-strong: #68797f;
  --brand: #35c4b2;
  --brand-deep: #7ce3d4;
  --accent-soft: #12332e;
  --lagoon: #45cfbe;
  --lagoon-ink: #45cfbe;

  --energy: #f6b93b;
  --energy-soft: #3a2f14;
  --energy-ink: #f6b93b;
  --coral: #ff7a6b;
  --coral-soft: #3f201c;
  --coral-ink: #ff7a6b;
  --success: #4cc38a;
  --success-soft: #14301f;
  --success-ink: #4cc38a;

  --background: var(--paper);
  --foreground: var(--ink);
  --card: #131d22;
  --card-foreground: var(--ink);
  --popover: #152026;
  --popover-foreground: var(--ink);
  --primary: var(--brand);
  --primary-foreground: #05201c;
  --secondary: var(--mist);
  --secondary-foreground: var(--ink);
  --muted: var(--mist);
  --muted-foreground: var(--ink-muted);
  --accent: var(--accent-soft);
  --accent-foreground: #7ce3d4;
  --destructive: #f26d5e;
  --border: var(--line);
  --input: var(--line);
  --ring: var(--lagoon-ink);
  --chart-1: var(--brand);
  --chart-2: var(--lagoon-ink);
  --chart-3: var(--energy-ink);
  --chart-4: var(--coral-ink);
  --chart-5: #6b8f98;
  --shadow-soft: 0 1px 2px rgb(0 0 0 / 0.25), 0 6px 20px -4px rgb(0 0 0 / 0.35);
  --shadow-card: 0 2px 4px rgb(0 0 0 / 0.25), 0 12px 32px -8px rgb(0 0 0 / 0.5);
  --shadow-pop: 0 8px 24px -6px rgb(0 0 0 / 0.55), 0 2px 6px rgb(0 0 0 / 0.35);
  --sidebar: var(--paper);
  --sidebar-foreground: var(--ink);
  --sidebar-primary: var(--brand);
  --sidebar-primary-foreground: #05201c;
  --sidebar-accent: var(--mist);
  --sidebar-accent-foreground: var(--ink);
  --sidebar-border: var(--line);
  --sidebar-ring: var(--lagoon);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
  ::selection {
    background: color-mix(in oklab, var(--brand) 30%, transparent);
  }
}

/* ---- Mjuk scrollbar ---------------------------------------------------- */
@supports (scrollbar-width: auto) {
  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklab, var(--ink) 22%, transparent) transparent;
  }
}
*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
*::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--ink) 18%, transparent);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
*::-webkit-scrollbar-track {
  background: transparent;
}

/* ------------------------------------------------------------------ */
/*  Rörelsebibliotek (utöver tw-animate-css)                            */
/* ------------------------------------------------------------------ */

/* Pop in — för badges, poäng, upplåsningar */
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.72);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-pop {
  animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-rise {
  animation: rise 0.7s ease-out both;
}
.animate-rise-delay {
  animation: rise 0.8s ease-out 0.15s both;
}

/* Vicka — flame-ikon, etc. */
@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-5deg);
  }
  40% {
    transform: rotate(5deg);
  }
  60% {
    transform: rotate(-3deg);
  }
  80% {
    transform: rotate(3deg);
  }
}
.animate-wiggle {
  animation: wiggle 0.9s ease-in-out both;
}
.animate-wiggle-infinite {
  animation: wiggle 2.4s ease-in-out infinite;
}

/* Flamma — streak-ikon */
@keyframes flicker {
  0%,
  100% {
    transform: scale(1) rotate(-1.5deg);
    opacity: 1;
  }
  25% {
    transform: scale(1.06) rotate(1.5deg);
    opacity: 0.92;
  }
  60% {
    transform: scale(0.96) rotate(-0.5deg);
    opacity: 1;
  }
}
.animate-flicker {
  animation: flicker 1.6s ease-in-out infinite;
  transform-origin: 50% 80%;
}

/* Skimmer — progress bars, skeletons */
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
.animate-shimmer {
  background-size: 200% 100%;
  animation: shimmer 2.2s linear infinite;
}

/* Mjuk in-fade för sidinnehåll */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fade-in {
  animation: fade-in 0.35s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-rise,
  .animate-rise-delay,
  .animate-pop,
  .animate-wiggle,
  .animate-wiggle-infinite,
  .animate-flicker,
  .animate-shimmer,
  .animate-fade-in {
    animation: none;
  }
}
```

### `components.json` (shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### `postcss.config.mjs`

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Font setup (excerpt of `src/app/layout.tsx`)

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
```

### Theme provider: `src/lib/preferences.tsx`

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


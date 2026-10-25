# HP Lift — Design System ("Lugn")

## Product context
HP Lift is a Swedish study-plan web app for Högskoleprovet (HP). Users take a nivåtest or enter earlier results, get a personal veckoplan, and practise the eight delprov (ORD, LÄS, MEK, ELF — verbal; XYZ, KVA, NOG, DTK — kvantitativ). Other features: timed provpass/mock exams (`/prov`), flashcards and spaced repetition ("Dagens repetition"), a reading library, 1v1 duels, a question forum, tips, a profile with progress history.

Key pages: Översikt (dashboard `/`), Plan (`/plan`, `/nivatest`, `/resultat`), Öva (`/ova`, `/ova/[delprov]`, flashcards, `/bibliotek`, `/prov`, `/duell`), Forum, Tips, Profil.

Jobs to be done: "Tell me exactly what to study today", "Let me practise without distraction", "Show me honestly whether I'm improving".

All user-facing copy is Swedish and must stay Swedish (delprov, veckoplan, nivåtest, prov, Övningsfrågor, normerad poäng 0,0–2,0 with a decimal comma).

## Design direction
Calm, focused, trustworthy — a quiet study desk, not a game or an AI landing page. Think a well-made textbook or a tool like Linear/Things: generous whitespace, clear hierarchy, few colours, content first.

Explicitly AVOID (these made the old site feel "AI-generated"):
- gradients of any kind (buttons, heroes, backgrounds, text)
- background colour blobs, glows, glassmorphism, frosted panels
- emoji in UI copy, sparkles, confetti, bouncing/wiggling animation
- pill-shaped primary buttons, oversized radii, coloured drop shadows
- eyebrow labels in tracked-out uppercase above every heading
- decorative serif display headings mixed with a rounded sans
- many accent colours competing on one screen

## Colour
One neutral scale + one accent. Colour carries meaning, not decoration.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F5` | `#121212` | Page background (flat, no gradient) |
| `--surface` | `#FFFFFF` | `#1B1B1B` | Cards, panels, inputs |
| `--surface-muted` | `#F0EFEC` | `#222222` | Hover rows, tracks, subtle fills |
| `--border` | `#E4E2DD` | `#2E2E2E` | Hairline borders (1px) |
| `--border-strong` | `#CFCCC5` | `#3D3D3D` | Inputs, secondary buttons |
| `--text` | `#1C1C1A` | `#ECECEA` | Primary text |
| `--text-secondary` | `#55544F` | `#B3B2AD` | Body secondary |
| `--text-muted` | `#86847D` | `#7E7D78` | Meta, captions, icons |
| `--accent` | `#2B4C7E` | `#8DA9D6` | Primary actions, links, active nav, focus ring |
| `--accent-hover` | `#223D66` | `#A7BEE2` | Primary hover |
| `--accent-subtle` | `#E9EEF6` | `#1E2633` | Selected states, active nav background |
| `--correct` | `#2E7044` | `#7DC596` | Correct answers, positive delta (text/icons; bg `#EAF3EC`) |
| `--incorrect` | `#A23A2A` | `#E58C7C` | Wrong answers, errors (bg `#F7EBE8`) |
| `--caution` | `#8A6212` | `#D8B266` | Pace warnings (bg `#F6F0E1`) |

Rules: the accent is used for at most one primary action per view plus active/selected states. Status colours appear only where they carry meaning. Charts use the accent plus neutral greys; verbal vs kvantitativ may use accent (#2B4C7E) and a neutral slate (#8A8F98).

## Typography
- Family: **IBM Plex Sans** for everything (UI and headings), **IBM Plex Mono** only for tabular numbers/timers if needed (otherwise Plex Sans with `tabular-nums`).
- Weights: 400 body, 500 labels/nav/buttons, 600 headings. Never 800.
- Scale: page title 28px/34px 600 (`text-[28px]`), section title 18px/26px 600, card title 16px/24px 600, body 15px/24px 400, small/meta 13px/20px 400–500, stat numbers 28–32px 500 tabular-nums.
- Sentence case everywhere. Letter-spacing normal (headings −0.01em). No uppercase eyebrows; use a plain muted 13px label if context is needed.
- Max line length ~68ch for reading text (LÄS/ELF passages: 17px/28px).

## Spacing & layout
- 4px base grid. Card padding 20–24px. Gap between cards 16px; between page sections 40px.
- Content max width 1080px; reading/practice views 720px centred.
- Desktop: persistent left sidebar navigation (240px, flat `--surface` with right border) OR a slim solid top bar (56px, `--surface`, bottom border) — never floating/transparent.
- Mobile: solid bottom tab bar (4 items, icon + 12px label), `--surface` with top border, no blur.
- Grids align to a 12-column structure; prefer lists and tables over decorative card mosaics.

## Shape & elevation
- Radius: 6px buttons/inputs/chips, 10px cards/panels, 12px modals. No `rounded-full` except avatars and tiny status dots.
- Elevation by border, not shadow. Cards: 1px `--border`, no shadow. Popovers/menus/modals only: `0 4px 16px rgba(0,0,0,0.08)`.

## Components
- **Primary button**: solid `--accent` bg, white text, 500 weight, 14px, height 40px, px 16px, radius 6px; hover `--accent-hover`. No scale on hover/press.
- **Secondary button**: `--surface` bg, 1px `--border-strong`, `--text`; hover `--surface-muted`.
- **Ghost/text button**: no border, `--text-secondary`, hover `--surface-muted`.
- **Card**: `--surface`, 1px `--border`, radius 10px, padding 20–24px. Header row = title (16px 600) + optional muted meta right-aligned.
- **List row**: 48–56px tall, divider lines between rows, hover `--surface-muted`, chevron at right.
- **Stat**: muted 13px label above a 28px tabular number; delta in `--correct`/`--incorrect` 13px.
- **Progress bar**: 6px tall, `--surface-muted` track, `--accent` fill, square-ish (radius 3px). No shimmer.
- **Tag/chip**: 24px tall, radius 6px, `--surface-muted` bg, 13px 500 `--text-secondary`. Delprov codes (ORD, KVA…) shown as these chips.
- **Answer option** (practice): full-width row, 1px `--border-strong`, radius 8px, letter (A–E) in a 28px square; selected = `--accent` border + `--accent-subtle` bg; correct/incorrect use status colours after submit.
- **Nav item**: 36px tall, 14px 500, icon 18px `--text-muted`; active = `--accent-subtle` bg + `--accent` text/icon, radius 6px.
- Icons: lucide-react, 1.5px stroke, 16–18px, muted by default.
- Gamification (XP, streak, achievements, daily quests) is kept but quiet: plain numbers and small line icons in a compact stats row, never celebratory banners.

## Motion
Minimal and functional: 120–160ms ease-out opacity/colour transitions; page content fades in (no slide/scale). No springs, bounces, wiggles, flicker, confetti. Respect `prefers-reduced-motion`.

## Brand
Name: **HP Lift** — wordmark set in IBM Plex Sans 600, 16px, `--text`, optionally preceded by a simple 20px square mark in `--accent` (solid square, radius 4px). No logo file exists in the repo.
Tone of voice: calm, direct, encouraging without hype. Swedish.

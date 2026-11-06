---
name: HP Lift
description: A calm study plan and practice tool for Högskoleprovet, design system "Lugn".
colors:
  skymningsbla: "#2b4c7e"
  skymningsbla-deep: "#223d66"
  skymningsbla-tint: "#e9eef6"
  skymningsbla-dark: "#8da9d6"
  ink: "#1c1c1a"
  ink-soft: "#55544f"
  ink-muted: "#6f6d67"
  paper: "#f7f7f5"
  mist: "#f0efec"
  surface: "#ffffff"
  line: "#e4e2dd"
  line-strong: "#cfccc5"
  night-paper: "#121212"
  night-surface: "#1b1b1b"
  night-ink: "#ecece8"
  correct: "#2e7044"
  correct-soft: "#eaf3ec"
  incorrect: "#a23a2a"
  incorrect-soft: "#f7ebe8"
  caution: "#8a6212"
  caution-soft: "#f6f0e1"
typography:
  display:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  reading:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.54
  caption:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "10px"
  2xl: "12px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  10: "40px"
components:
  button-primary:
    backgroundColor: "{colors.skymningsbla}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.skymningsbla-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.mist}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  nav-item:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.skymningsbla-tint}"
    textColor: "{colors.skymningsbla}"
  chip:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
    height: "20px"
  answer-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: HP Lift

## Overview

**Creative North Star: "Lugn kompass"**

HP Lift points the way without raising its voice. A user opening the app during a stressful test period should see, within a glance, what to do today and nothing that competes with it. The compass is the veckoplan and "Dagens pass"; everything else (practice, repetition, results) sits around it on flat paper surfaces, in ink tones, with one quiet blue to mark the direction.

The interface is friendly and clear rather than severe: gently rounded corners, generous touch targets (44px buttons), sentence-case Swedish copy, and soft tinted fills for selected states. Density is moderate. Cards hold one idea each, lists are preferred over mosaics, and practice and reading views narrow to a single column so the question has the stage.

The system grew out of a deliberate rejection of the earlier "AI-generated" look: no gradients, glows, glassmorphism, emoji, confetti, bouncing motion, pill-shaped primary buttons, tracked-out uppercase eyebrows or competing accent colours. Gamification (XP, streaks, achievements) stays, but quiet: plain numbers and small line icons, never celebratory banners.

**Key Characteristics:**
- One accent colour, Skymningsblå, for direction: the primary action, links, active navigation, focus.
- Green and red exist only to say right or wrong.
- Flat surfaces separated by 1px hairlines; shadows only on things that float.
- IBM Plex Sans for everything, weights 400/500/600.
- Sidebar on desktop, tab bar on mobile; every screen in light and dark mode.
- Motion is a 160ms fade, nothing more.

## Colors

A warm paper-and-ink neutral scale with a single dusky blue; colour carries meaning, never decoration. All tokens live as CSS custom properties in `src/app/globals.css` (`:root` and `.dark`), and Tailwind's `primary`, `ring` and `chart-1` point at the blue.

### Primary
- **Skymningsblå** (`--brand`): the direction colour. The one primary action per view, links, the active nav item, focus rings, progress fills and selected states. In dark mode it lightens to **Skymningsblå, natt** so it stays readable on near-black.
- **Djup skymningsblå** (`--brand-deep`): hover state for primary buttons (lighter in dark mode).
- **Skymningsblå ton** (`--accent-soft`): pale tint behind the active nav item, selected answer options and soft brand badges. Note: the shadcn `accent` token is this tint, not the accent colour.

### Neutral
- **Bläck** (`--ink`): primary text and headings.
- **Mjukt bläck** (`--ink-soft`): secondary body text and inactive nav labels.
- **Dämpat bläck** (`--ink-muted`): meta text, captions, icons at rest.
- **Papper** (`--paper`): the page background, flat.
- **Yta** (`--card`): cards, panels, inputs, popovers, sidebar and tab bar.
- **Dimma** (`--mist`): hover rows, progress tracks, chips, subtle fills.
- **Linje** (`--line`): 1px hairline borders and dividers.
- **Stark linje** (`--line-strong`): input borders and secondary buttons.
- **Nattpapper / Nattyta / Nattbläck**: the dark theme's page, surface and text; every neutral above has a `.dark` counterpart.

### Status (meaning only)
- **Rätt** (`--success-ink`, soft fill `--success-soft`): correct answers and positive score deltas.
- **Fel** (`--coral-ink` / `--destructive`, soft fill `--coral-soft`): wrong answers, errors and destructive confirmation.
- **Varning** (`--energy-ink`, soft fill `--energy-soft`): pace and time warnings, for example the study-time notice.

### Data figures
DTK tables, charts and maps use their own colour-blind-checked categorical set (`--viz-1`…`--viz-4`) and a single-hue sequential ramp (`--viz-seq-1`…`--viz-seq-5`). These belong only inside figures, which reproduce test material; they never leak into UI chrome. Progress charts use the blue plus a neutral slate (`--chart-2`).

### Named Rules
**The One Direction Rule.** Skymningsblå marks where to go next: at most one solid blue button per view, plus active and selected states. If two things on a screen are solid blue, one of them is wrong.

**The Right-or-Wrong Rule.** Green and red mean correct and incorrect answers (and errors). They are never used for buttons, badges, streaks or decoration.

## Typography

**Display Font:** IBM Plex Sans (with ui-sans-serif, system-ui)
**Body Font:** IBM Plex Sans
**Numbers:** IBM Plex Sans with `tabular-nums` for timers, scores and stats.

**Character:** One humanist sans in three weights reads like a well-set textbook: precise, unfussy, quietly technical. Loaded through `next/font` as `--font-sans`; `--font-display` aliases it.

### Hierarchy
- **Display** (600, 30px mobile → 36px from `sm`, tight tracking −0.01em): the page title, one per page.
- **Headline** (600, 20–24px): section titles inside a page.
- **Title** (600, 16–18px): card and dialog titles.
- **Body** (400, 14px, line-height 20px): the default UI text; most of the interface is set at this size.
- **Reading** (400, 17px, line-height 28px, max ~68ch): LÄS and ELF passages and long explanations.
- **Label** (500, 13–14px): buttons, nav items, field labels and group headings in the sidebar.
- **Caption** (400–500, 12px): chips, meta lines, tab-bar labels.

### Named Rules
**The Sentence Case Rule.** Every heading, button and label is in Swedish sentence case with normal letter-spacing. No uppercase eyebrows above headings; if context is needed, use a plain muted 13px label.

**The Three Weights Rule.** 400, 500, 600. Nothing heavier.

## Layout

- **Shell:** on desktop (`md`, 768px and up) a fixed 240px sidebar on Yta with a right hairline, holding the wordmark, grouped navigation and theme/sound controls. On mobile a 56px sticky top bar and a solid bottom tab bar (4–5 items, icon + small label) with a top hairline; both respect the safe-area insets. Neither is ever transparent or blurred.
- **Content:** centred, max 1080px wide, padding 16px on mobile and 32px from `sm`; 24px top on mobile, 40px from `sm`. Practice and reading views narrow to about 720px.
- **Rhythm:** a 4px grid. Cards pad 20px (24px from `sm`); gaps between cards are 12–16px; page sections sit about 40px apart. Inside components 8–12px gaps dominate.
- **Responsive:** single column on phones, two columns for card groups from `sm`/`md`. Group menus in the tab bar open towards the screen's centre so they stay on screen.
- Prefer lists and tables to decorative card mosaics.

## Elevation & Depth

Lugn is flat. Depth comes from tone (Papper behind, Yta in front) and 1px hairlines, not shadows. `--shadow-soft` and `--shadow-card` are deliberately `none`, so components that ask for them stay flat.

### Shadow Vocabulary
- **Pop** (`box-shadow: 0 4px 16px rgb(0 0 0 / 0.08)`, `0.4` in dark mode): only for things that float over the page, such as menus, popovers and dialogs.

### Named Rules
**The Hairline Rule.** A resting surface is separated by a 1px line, never by a shadow. If it does not float, it does not cast.

## Shapes

Gently rounded, never pill-shaped. Small controls (chips, nav items, icon buttons) use 6–8px; buttons and inputs 8–10px; cards and panels 10px; menus and popovers 10px; dialogs 12px. `rounded-full` is reserved for avatars, status dots, progress bars, switches and the A–E answer letters. The wordmark's mark is a solid 20px Skymningsblå square with a 4px radius.

## Components

### Buttons
Friendly, clear and solid; they never scale or glow.
- **Shape:** gently rounded (8px).
- **Primary:** solid Skymningsblå, white text (near-black `#10161f` on the light blue in dark mode), 14px weight 500, at least 44px tall, 20px side padding.
- **Hover / Focus:** colour shifts to Djup skymningsblå, never a brightness filter, opacity change or shadow; focus shows a 2px Skymningsblå outline offset 2px. Disabled drops to 50% opacity.
- **Secondary:** Yta background, 1px Stark linje border, muted ink text; hover fills with Dimma.
- **Ghost / icon:** no border, muted ink; hover fills with Dimma and darkens the text. Icon buttons are 36px squares.
- **Text link:** Skymningsblå, weight 500, underline on hover.

### Chips
- **Style:** 20px tall, 8px radius, 12px weight 500. Neutral chips use Dimma with Mjukt bläck; delprov codes (ORD, KVA…) are shown this way.
- **Brand chip:** a 10% Skymningsblå fill with blue text, for soft highlights such as "Rekommenderad".

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Yta (white / `#1b1b1b`); nested panels may drop to Papper.
- **Shadow Strategy:** none (see The Hairline Rule).
- **Border:** 1px Linje. Lists inside a card use Linje dividers instead of separate cards.
- **Internal Padding:** 20px, 24px from `sm`.

### Inputs / Fields
- **Style:** Yta background, 1px Stark linje border, 10px radius, 8px × 12px padding, 14px text, muted placeholder.
- **Focus:** the border turns Skymningsblå or a 2px Skymningsblå ring appears; no glow.
- **Toggles:** a 44×24px track in Dimma that fills with Skymningsblå when on.

### Navigation
- **Sidebar item:** 36px tall, 8px radius, 14px weight 500, 18px line icon (1.5 stroke). At rest Mjukt bläck with a Dämpat bläck icon; hover fills Dimma; active gets the Skymningsblå ton background with blue text and icon, and `aria-current="page"`.
- **Groups:** a plain muted 13px label above grouped items, no uppercase.
- **Tab bar:** icon above a small label; the active tab is Skymningsblå. Group tabs open a popover menu with the Pop shadow.

### Answer options (signature)
The heart of practice. Each option is a full-width row on Papper with a 1px Stark linje border and 10px radius, with its letter (A–E) in a 24px circle on the left; hover darkens the border. Selecting tints the row with Skymningsblå ton, turns the border blue and fills the letter circle with Skymningsblå. After answering, the correct row gets a Rätt border and a filled green letter, a wrongly chosen row gets the Fel treatment, and the others fade slightly. This is the one place where green and red appear at full strength.

### Today card (signature)
"Dagens pass" on the dashboard is the compass needle: one card with today's tasks, a single primary action, and calm secondary text such as "Veckan har krympt så att dagarna inte blir för tunga". Missed or skipped work is described, never scolded.

## Do's and Don'ts

### Do:
- **Do** take every colour from the CSS custom properties in `src/app/globals.css` (`var(--brand)`, `var(--ink-muted)`, `bg-primary`…) so dark mode follows automatically.
- **Do** check every new screen in light and dark mode and at mobile width.
- **Do** keep one solid Skymningsblå action per view (The One Direction Rule).
- **Do** separate resting surfaces with 1px Linje borders and keep the Pop shadow for floating layers.
- **Do** use lucide-react line icons at 16–18px with a 1.5 stroke, muted at rest.
- **Do** use `tabular-nums` for timers, scores and the normerad poäng (0,0–2,0, decimal comma).
- **Do** keep motion to the 160ms fade (`animate-fade-in`) and respect `prefers-reduced-motion`.

### Don't:
- **Don't** use green or red for buttons, badges, streaks or decoration (The Right-or-Wrong Rule).
- **Don't** use gradients, glows, glassmorphism, frosted bars or background blobs.
- **Don't** use pill-shaped primary buttons or radii above 12px on containers.
- **Don't** add emoji, sparkles, confetti, or bouncing, wiggling or flickering animation.
- **Don't** put tracked-out uppercase eyebrows above headings or use weights above 600.
- **Don't** introduce a second accent colour; the DTK `--viz-*` colours stay inside figures.
- **Don't** celebrate gamification with banners; XP and streaks are plain numbers with small icons.

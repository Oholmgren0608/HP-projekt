# Extractable Components

Candidates for Superdesign `DraftComponent` extraction. Full source lives in `components.md` / `layouts.md`. Note: the app has almost no shadcn primitives — Button, Card, PageHeader and Chip are inline Tailwind recipes repeated across pages (documented in `components.md`), so they are listed here as patterns with representative sources.

## Layout Components

## AppHeader
- Source: `src/components/app-shell.tsx` (header block inside `AppShell`)
- Category: layout
- Description: Floating sticky header with "HP Lift" Fraunces wordmark, desktop nav with dropdown groups and animated active pill, sound/theme icon buttons and account cluster
- Extractable props: activeItem (string, default: "/"), isLoggedIn (boolean, default: false), userInitials (string, default: "OH"), displayName (string, default: "oscar"), theme ("light" | "dark", default: "light"), soundOn (boolean, default: true)
- Hardcoded: wordmark text, NAV items (Plan > Veckoplan/Nivåtest/Poäng; Öva > Öva delprov/ORD-Flashcards/Läsbibliotek/Gamla prov/Duell; Forum; Tips), lucide icons, all CSS

## MobileBottomNav
- Source: `src/components/app-shell.tsx` (fixed `<nav>` at bottom, `md:hidden`)
- Category: layout
- Description: Floating frosted 4-column bottom tab bar (Plan, Öva, Forum, Tips) with icon + label; groups open an upward menu
- Extractable props: activeItem (string, default: "plan"), openGroup (string | null, default: null)
- Hardcoded: tab labels, icons (CalendarDays, BookOpen, MessagesSquare, Lightbulb), all CSS

## AppFooter
- Source: `src/components/app-shell.tsx` (`<footer>`)
- Category: layout
- Description: Bordered footer with tagline and links to feedback / problem report
- Extractable props: feedbackHref (string, default: "/feedback"), problemHref (string, default: "/feedback?typ=problem")
- Hardcoded: tagline text, link labels with emoji, all CSS

## AppShell
- Source: `src/components/app-shell.tsx`
- Category: layout
- Description: Page wrapper: soft radial-gradient background, AppHeader, max-w-6xl main container with page-enter animation, AppFooter, MobileBottomNav
- Extractable props: activeItem (string, default: "/")
- Hardcoded: gradient background, container widths/paddings

## AccountMenu
- Source: `src/components/app-shell.tsx` (`AuthCluster`)
- Category: layout
- Description: Avatar-initials button opening a popover menu (Profil, Granska, Logga ut) or a "Logga in" popover with LoginPanel
- Extractable props: isLoggedIn (boolean, default: true), isOpen (boolean, default: false), userInitials (string), displayName (string)
- Hardcoded: menu items, icons, popover CSS

## PageHeader
- Source: pattern in `src/app/bibliotek/page.tsx`, `src/app/ova/flashcards/page.tsx`, `src/components/dashboard-home.tsx`
- Category: layout
- Description: Brand-colored uppercase eyebrow, Fraunces display h1, muted lede paragraph
- Extractable props: eyebrow (string), title (string), lede (string)
- Hardcoded: typography classes and spacing

## Disclosure
- Source: `src/components/disclosure.tsx`
- Category: layout
- Description: Collapsible rounded-2xl section card (native details/summary) with display-font title, subtitle and chevron; "inverted" dark variant
- Extractable props: isOpen (boolean, default: false), variant ("card" | "inverted", default: "card"), title (string), subtitle (string)
- Hardcoded: chevron icon, all CSS

## Basic Components

## PrimaryButton
- Source: pattern in `src/components/dashboard-home.tsx` (`NextTaskCard` "Starta övning")
- Category: basic
- Description: Pill CTA with brand -> brand-deep gradient, extrabold label, optional trailing ArrowRight, scale on hover/press
- Extractable props: label (string), href (string)
- Hardcoded: gradient, shadow-soft/pop, min-h-11, icon

## SecondaryButton
- Source: pattern in `src/components/dashboard-home.tsx` ("Hela veckoplanen")
- Category: basic
- Description: Transparent pill with line-strong border, mist hover
- Extractable props: label (string), href (string)
- Hardcoded: all CSS

## IconButton
- Source: `src/components/app-shell.tsx` (`IconButton`)
- Category: basic
- Description: 36px round ghost icon button used for sound/theme toggles
- Extractable props: label (string)
- Hardcoded: icon, CSS

## Card / StatCard
- Source: pattern in `src/components/dashboard-home.tsx` ("Kvant / verbal", "Fokus just nu")
- Category: basic
- Description: White rounded-2xl card with line border and shadow-soft; stat variant has bold muted label + display-font value
- Extractable props: label (string), value (string)
- Hardcoded: CSS

## HeroCard
- Source: `src/components/dashboard-home.tsx` (onboarding `motion.section`)
- Category: basic
- Description: rounded-3xl brand-gradient banner with white display title and two pill CTAs (white solid + outline)
- Extractable props: title (string), body (string)
- Hardcoded: CTA labels/links (/nivatest, /resultat), gradient, shadow-pop

## NextTaskCard
- Source: `src/components/dashboard-home.tsx` (`NextTaskCard`)
- Category: basic
- Description: "Dagens pass" card: week eyebrow with minutes chip, task title/detail, primary + secondary CTA; completed state
- Extractable props: week (number, default: 1), minutes (number, default: 25), isAllDone (boolean, default: false)
- Hardcoded: labels, icons, CSS

## XpBar
- Source: `src/components/gamification/xp-bar.tsx`
- Category: basic
- Description: Level square chip + level title, amber "+N XP idag" chip, animated brand->lagoon gradient progress bar with shimmer
- Extractable props: level (number, default: 4), xp (number), xpCeiling (number), xpToday (number), compact (boolean, default: false)
- Hardcoded: Sparkles icon, CSS

## StreakCard
- Source: `src/components/gamification/streak-card.tsx`
- Category: basic
- Description: Daily streak card with flickering flame and day count
- Extractable props: streakDays (number, default: 3), isActiveToday (boolean, default: false)
- Hardcoded: flame icon, copy, CSS

## DailyQuests
- Source: `src/components/gamification/daily-quests.tsx`
- Category: basic
- Description: Card listing daily quests with per-quest progress and XP reward
- Extractable props: completedCount (number, default: 0)
- Hardcoded: quest list rendering, CSS

## Badge / PriorityBadge
- Source: `src/components/ui/badge.tsx`, `src/components/plan-badges.tsx`
- Category: basic
- Description: Small pill badge; PriorityBadge colors by priority (kritiskt = destructive, huvudfokus = brand, styrka = lagoon-ink, else outline)
- Extractable props: variant (string, default: "default"), priority ("kritiskt" | "huvudfokus" | "styrka" | "underhall" (label Underhåll))
- Hardcoded: label text mapping, CSS

## Chip
- Source: pattern in `src/components/dashboard-home.tsx` (focus ids), `src/components/gamification/xp-bar.tsx`
- Category: basic
- Description: Rounded-full tinted chip (accent-soft/teal or energy-soft/amber)
- Extractable props: label (string), tone ("accent" | "energy", default: "accent")
- Hardcoded: CSS

## QuizOptions
- Source: `src/components/quiz/quiz-options.tsx`
- Category: basic
- Description: Vertical list of A–D lettered answer buttons; selected state in brand; review mode marks correct (lagoon) / wrong (destructive)
- Extractable props: selected (number | null, default: null), correctIndex (number | undefined, default: undefined), disabled (boolean, default: false)
- Hardcoded: letter circles, CSS

## QuizProgress / ScoreBar
- Source: `src/components/quiz/quiz-progress.tsx`, `src/components/plan-badges.tsx`
- Category: basic
- Description: Thin rounded mist track with brand fill
- Extractable props: current (number), total (number)
- Hardcoded: CSS

## PaceNotice
- Source: `src/components/pace-notice.tsx`
- Category: basic
- Description: Seconds-per-question line; coral warning box with tips link when over pace
- Extractable props: isOverPace (boolean, default: false)
- Hardcoded: copy, CSS

## WeekTaskRow
- Source: `src/components/week-task-row.tsx`
- Category: basic
- Description: One task row in the weekly plan with done state, minutes and start action
- Extractable props: isDone (boolean, default: false), isActive (boolean, default: false)
- Hardcoded: icons, CSS

## Skeleton
- Source: pattern in `src/app/plan/page.tsx`, `src/components/dashboard-home.tsx`
- Category: basic
- Description: `animate-pulse` mist rounded blocks used as loading placeholders
- Extractable props: none
- Hardcoded: sizes, CSS

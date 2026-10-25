# Components

## Stack detection
- Framework: React 19.2 (functional components only)
- Meta-framework: Next.js 16.4 (App Router, `src/app`, Turbopack, typed `PageProps`/`LayoutProps`)
- Component library: shadcn/ui, style `base-nova` on `@base-ui/react` (NOT Radix). Only two shadcn primitives are installed (`badge`, `progress`) in `src/components/ui/`.
- CSS: Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config.*`), `tw-animate-css`, `shadcn/tailwind.css`, `cva` + `clsx` + `tailwind-merge` via `cn()`.
- Icons: `lucide-react`. Motion: `motion/react` (Framer Motion successor) for nav pill, page transitions, progress bars. `canvas-confetti` for celebrations.
- Path alias: `@/*` -> `./src/*`.

## Important styling convention
There is NO Button, Card, Input, Dialog, Tabs or Select primitive. Those patterns are written inline with Tailwind utilities and the app's own CSS variables accessed as `text-[var(--ink)]`, `bg-[var(--accent-soft)]`, `border-[var(--line)]`, etc. Recurring inline recipes:

- **Primary CTA (pill, gradient):** `inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--brand),var(--brand-deep))] px-6 text-sm font-extrabold text-primary-foreground shadow-soft transition hover:scale-[1.03] hover:shadow-pop active:scale-95`
- **Secondary / outline pill:** `inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] bg-transparent px-5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--mist)] active:scale-95`
- **Card:** `rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft sm:p-6` (softer variant: `bg-card/70`, no shadow)
- **Hero / inverted card:** `rounded-3xl bg-[linear-gradient(120deg,var(--brand),var(--brand-deep))] p-6 text-primary-foreground shadow-pop sm:p-8`
- **Page header (eyebrow + display title + lede):**
  `<p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Eyebrow</p>`
  `<h1 class="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">Title</h1>`
  `<p class="mt-3 max-w-2xl text-[var(--ink-muted)]">Lede</p>`
- **Chip / tag:** `rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-bold text-[var(--accent-foreground)]` (energy variant: `bg-[var(--energy-soft)] text-[var(--energy-ink)]`)
- **Popover menu panel:** `rounded-2xl border border-[var(--line)] bg-card p-1.5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.45)]`, items `rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--accent-soft)]`
- **Skeleton:** `animate-pulse rounded-2xl bg-[var(--mist)]`
- **Thin progress track:** `h-1.5 overflow-hidden rounded-full bg-[var(--mist)]` + `bg-[var(--brand)]` fill

---

## cn / clamp (utility)
- Path: `src/lib/utils.ts`
- Description: Tailwind class merger used by every component.

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

```

## Badge (shadcn base-nova)
- Path: `src/components/ui/badge.tsx`
- Description: Pill badge with cva variants on base-ui useRender.
- Key props: variant: default|secondary|destructive|outline|ghost|link, render, className

```tsx
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
```

## Progress (shadcn base-nova)
- Path: `src/components/ui/progress.tsx`
- Description: base-ui Progress root/track/indicator/label/value.
- Key props: value, className, children

```tsx
"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
```

## Disclosure
- Path: `src/components/disclosure.tsx`
- Description: Collapsible section card built on native details/summary; display-font title.
- Key props: title, subtitle, hint, defaultOpen, variant: card|inverted, onOpenChange, id

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DisclosureProps = {
  /** Rubrik i den klickbara sammanfattningsraden. */
  title: ReactNode;
  /** Kort metarad under rubriken, t.ex. "8 delprov · 24 råd". */
  subtitle?: ReactNode;
  /** Liten etikett till höger om rubriken, t.ex. en badge. */
  hint?: ReactNode;
  /** Startar öppen (används när sektionen är mål för en ankarlänk, t.ex. /tips?section=MEK). */
  defaultOpen?: boolean;
  /** "inverted" = mörk panel (bg-foreground/text-background) i stället för kort. */
  variant?: "card" | "inverted";
  /** Får veta när sektionen öppnas/stängs (t.ex. för att kvittera "NY"-markeringar). */
  onOpenChange?: (open: boolean) => void;
  /** Sätts på <details> så att t.ex. #ankare och scroll-margin fungerar. */
  id?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/**
 * Vikbar sektion, alltid stängd när sidan laddas (även desktop) så att långa
 * sidor blir korta att skanna. Använder native <details>/<summary> för
 * tangentbord, skärmläsare och sökindexering; användarens egen växling vinner.
 */
export function Disclosure({
  title,
  subtitle,
  hint,
  defaultOpen = false,
  variant = "card",
  onOpenChange,
  id,
  className,
  bodyClassName,
  children,
}: DisclosureProps) {
  const [manual, setManual] = useState<boolean | null>(null);

  const open = manual ?? defaultOpen;
  const inverted = variant === "inverted";

  return (
    <details
      id={id}
      open={open}
      onToggle={(event) => {
        setManual(event.currentTarget.open);
        onOpenChange?.(event.currentTarget.open);
      }}
      className={cn(
        "group scroll-mt-24 overflow-hidden rounded-2xl border",
        inverted
          ? "border-transparent bg-foreground text-background"
          : "border-[var(--line)] bg-card/75",
        className,
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 p-5 transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)] sm:p-6 [&::-webkit-details-marker]:hidden",
          inverted ? "hover:bg-background/10" : "hover:bg-[var(--accent-soft)]/40",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "font-[family-name:var(--font-display)] text-xl sm:text-2xl",
                !inverted && "text-[var(--ink)]",
              )}
            >
              {title}
            </span>
            {hint}
          </span>
          {subtitle ? (
            <span
              className={cn(
                "mt-1 block text-sm",
                inverted ? "text-background/70" : "text-[var(--ink-muted)]",
              )}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 transition-transform group-open:rotate-180",
            inverted ? "text-background/70" : "text-[var(--ink-muted)]",
          )}
          aria-hidden
        />
      </summary>
      <div
        className={cn(
          "border-t px-5 pb-5 pt-4 sm:px-6 sm:pb-6",
          inverted ? "border-background/15" : "border-[var(--line)]",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </details>
  );
}
```

## PriorityBadge / ScoreBar
- Path: `src/components/plan-badges.tsx`
- Description: Priority badge colored by study priority + thin score bar.
- Key props: priority; correct, total

```tsx
import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/format";
import { priorityLabel, type Priority } from "@/lib/study-plan";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priorityLabel(priority);
  if (priority === "kritiskt") {
    return (
      <Badge className="border-transparent bg-[var(--destructive)] text-primary-foreground hover:bg-[var(--destructive)]">
        {label}
      </Badge>
    );
  }
  if (priority === "huvudfokus") {
    return (
      <Badge className="border-transparent bg-[var(--brand)] text-primary-foreground hover:bg-[var(--brand)]">
        {label}
      </Badge>
    );
  }
  if (priority === "styrka") {
    return (
      <Badge className="border-transparent bg-[var(--lagoon-ink)] text-primary-foreground hover:bg-[var(--lagoon-ink)]">
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-[var(--line)] text-[var(--ink-soft)]">
      {label}
    </Badge>
  );
}

export function ScoreBar({ correct, total }: { correct: number; total: number }) {
  const p = pct(correct, total);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
      <div
        className="h-full rounded-full bg-[var(--brand)]"
        style={{ width: `${p}%` }}
        aria-hidden
      />
    </div>
  );
}
```

## QuizOptions
- Path: `src/components/quiz/quiz-options.tsx`
- Description: A-D lettered answer options; quiz mode (radio buttons) or review mode (correct/wrong marking).
- Key props: questionId, options, selected, onSelect, disabled, correctIndex

```tsx
"use client";

export type QuizOptionsProps = {
  /** Stabil nyckelprefix, t.ex. frågans id. */
  questionId: string;
  options: string[];
  /** Index för det valda/klickade alternativet. */
  selected: number | null;
  /** Anropas med alternativets index när användaren väljer (quiz-läge). */
  onSelect?: (index: number) => void;
  /** Inaktiverar alternativknapparna (quiz-läge). */
  disabled?: boolean;
  /**
   * När detta anges renderas listan i genomgångsläge: rätt alternativ markeras
   * grönt och ett felaktigt valt alternativ rött. `selected` tolkas då som
   * användarens valda svar.
   */
  correctIndex?: number;
  ariaLabel?: string;
};

/**
 * Presentational optionslista för ett quiz. I quiz-läge är alternativen
 * klickbara radio-knappar; i genomgångsläge (när `correctIndex` anges) visas
 * rätt/fel-markering utan interaktion.
 */
export function QuizOptions({
  questionId,
  options,
  selected,
  onSelect,
  disabled,
  correctIndex,
  ariaLabel = "Svarsalternativ",
}: QuizOptionsProps) {
  const isReview = correctIndex !== undefined;

  return (
    <div
      className="space-y-2.5 sm:space-y-3"
      role={isReview ? "list" : "radiogroup"}
      aria-label={isReview ? undefined : ariaLabel}
    >
      {options.map((opt, i) => {
        if (isReview) {
          const isCorrect = i === correctIndex;
          const isChosen = selected === i;
          return (
            <div
              key={`${questionId}-${i}`}
              role="listitem"
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 sm:px-4 ${
                isCorrect
                  ? "border-[var(--lagoon-ink)]/40 bg-card"
                  : isChosen
                    ? "border-[var(--destructive)]/30 bg-card"
                    : "border-[var(--line)] bg-card/70"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCorrect
                    ? "border-[var(--lagoon-ink)] bg-[var(--lagoon-ink)] text-primary-foreground"
                    : isChosen
                      ? "border-[var(--destructive)] bg-[var(--destructive)] text-primary-foreground"
                      : "border-[var(--line)] bg-card text-[var(--ink-muted)]"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-[var(--ink)]">{opt}</span>
            </div>
          );
        }

        const active = selected === i;
        return (
          <button
            key={`${questionId}-${i}`}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect?.(i)}
            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition sm:px-4 ${
              active
                ? "border-[var(--brand)] bg-[var(--accent-soft)]"
                : "border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink-soft)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                  : "border-[var(--line)] bg-card text-[var(--ink-muted)]"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-[var(--ink)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
```

## QuizProgress
- Path: `src/components/quiz/quiz-progress.tsx`
- Description: Thin brand progress bar for quizzes.
- Key props: current, total, transition

```tsx
"use client";

export type QuizProgressProps = {
  /** Täljare i förloppet (t.ex. antal besvarade eller aktuell fråga). */
  current: number;
  total: number;
  /** Animera breddövergången. Default true (matchar referensen). */
  transition?: boolean;
};

/** Presentational förloppsindikator för ett quiz. */
export function QuizProgress({ current, total, transition = true }: QuizProgressProps) {
  const width = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mist)]">
      <div
        className={`h-full rounded-full bg-[var(--brand)] ${transition ? "transition-all" : ""}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
```

## QuestionFigure
- Path: `src/components/question-figure.tsx`
- Description: Bordered image for question figures (DTK diagrams).
- Key props: question, position

```tsx
"use client";

import type { ChoiceQuestion } from "@/lib/practice-types";

/**
 * Renderar `question.figureUrl` som en bild när den finns (DTK-diagram,
 * formler m.m.). Vanlig <img> i stället för next/image: figure_url är en
 * godtycklig URL-sträng (Supabase Storage, men i teorin vilken host som
 * helst) och vi vill inte riskera att en host som inte står i remotePatterns
 * kraschar bygget/sidan. Därför stängs next/no-img-element av lokalt.
 */
export function QuestionFigure({
  question,
  position,
}: {
  question: ChoiceQuestion;
  /** 1-baserad position i frågesetet, används i alt-texten om frågenummer saknas. */
  position?: number;
}) {
  if (!question.figureUrl) return null;

  const alt = position !== undefined ? `Figur till fråga ${position}` : "Figur till fråga";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={question.figureUrl}
      alt={alt}
      loading="lazy"
      className="my-3 max-h-96 w-auto max-w-full rounded-lg border border-[var(--line)] bg-card object-contain"
    />
  );
}
```

## PaceNotice
- Path: `src/components/pace-notice.tsx`
- Description: Seconds-per-question line, coral warning box when over pace cap.
- Key props: verdict, kinds

```tsx
import Link from "next/link";
import {
  formatSecondsPerQuestion,
  kindToSection,
  type PaceVerdict,
} from "@/lib/practice-pace";
import { sectionShort } from "@/lib/subtests";

export function PaceNotice({
  verdict,
  kinds,
}: {
  verdict: PaceVerdict | null;
  kinds?: string[];
}) {
  if (!verdict) return null;
  const you = formatSecondsPerQuestion(verdict.secPerQ);
  const cap = formatSecondsPerQuestion(verdict.cap);
  const paceLine = `${you}/fråga (tak ${cap})`;

  if (!verdict.over) {
    return <p className="text-sm tabular-nums text-[var(--ink-muted)]">{paceLine}</p>;
  }

  const section = kinds && kinds.length === 1 ? kindToSection(kinds[0]) : null;
  const sectionLabel = section ? sectionShort(section) : null;
  const tipsHref = section ? `/tips?section=${section}` : "/tips";

  return (
    <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-4 py-3">
      <p className="text-sm font-medium tabular-nums text-[var(--destructive)]">{paceLine}</p>
      <Link
        href={tipsHref}
        className="mt-1 inline-block text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
      >
        Tips för att korta tiden{sectionLabel ? ` på ${sectionLabel}` : ""} →
      </Link>
    </div>
  );
}
```

## QuestionReview
- Path: `src/components/question-review.tsx`
- Description: Post-quiz review list of questions with explanation, discuss and flag actions.
- Key props: see source

```tsx
"use client";

import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import { ExplainFigure } from "@/lib/content/explain-figures";
import { QuestionFigure } from "@/components/question-figure";
import { DiscussQuestionButton } from "@/components/forum/discuss-button";
import { FlagQuestionButton } from "@/components/flag-question-button";

export function QuestionReviewList({
  questions,
  answers,
}: {
  questions: ChoiceQuestion[];
  answers: Record<string, number>;
}) {
  return (
    <ul className="space-y-3">
      {questions.map((q, qi) => (
        <QuestionReviewItem key={q.id} question={q} index={qi} chosen={answers[q.id]} />
      ))}
    </ul>
  );
}

function QuestionReviewItem({
  question: q,
  index,
  chosen,
}: {
  question: ChoiceQuestion;
  index: number;
  chosen: number | undefined;
}) {
  const ok = chosen === q.correctIndex;
  const unanswered = chosen === undefined;

  return (
    <li
      className={`rounded-lg border px-4 py-3 ${
        ok
          ? "border-[var(--lagoon-ink)]/40 bg-[var(--accent-soft)]"
          : "border-[var(--destructive)]/30 bg-[var(--coral-soft)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        <span>
          {index + 1}. {kindBadge(q.kind)}
        </span>
        <span>{ok ? "Rätt" : unanswered ? "Obesvarad" : "Fel"}</span>
      </div>
      <p className="mt-1 font-medium text-[var(--ink)]">{q.prompt}</p>

      {q.passage ? (
        <p className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--line)] bg-card/70 px-3 py-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {q.passage}
        </p>
      ) : null}

      <QuestionFigure question={q} position={index + 1} />

      <div className="mt-3 space-y-2.5 sm:space-y-3" role="list" aria-label="Svarsalternativ">
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = i === q.correctIndex;
          return (
            <div
              key={`${q.id}-${i}`}
              role="listitem"
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 sm:px-4 ${
                isCorrect
                  ? "border-[var(--lagoon-ink)]/40 bg-card"
                  : isChosen
                    ? "border-[var(--destructive)]/30 bg-card"
                    : "border-[var(--line)] bg-card/70"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCorrect
                    ? "border-[var(--lagoon-ink)] bg-[var(--lagoon-ink)] text-primary-foreground"
                    : isChosen
                      ? "border-[var(--destructive)] bg-[var(--destructive)] text-primary-foreground"
                      : "border-[var(--line)] bg-card text-[var(--ink-muted)]"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-[var(--ink)]">{opt}</span>
              <span className="mt-0.5 flex shrink-0 flex-wrap justify-end gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide">
                {isChosen ? <span className="text-[var(--ink-muted)]">Ditt svar</span> : null}
                {isCorrect ? <span className="text-[var(--lagoon-ink)]">Rätt</span> : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          Förklaring
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
          {q.explain}
        </p>
        <ExplainFigure questionId={q.id} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DiscussQuestionButton questionId={q.id} />
        <span className="text-xs text-[var(--ink-muted)]">
          Fråga andra om uppgiften – svaren sparas i forumet så att fler kan läsa dem.
        </span>
        <FlagQuestionButton questionId={q.id} />
      </div>
    </li>
  );
}
```

## DiscussButton
- Path: `src/components/forum/discuss-button.tsx`
- Description: Link to forum thread for a question.
- Key props: questionId

```tsx
"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Behöver du hjälp?" - genväg från en rättad fråga till frågans diskussion.
 * Tråden skapas först när någon skriver, så knappen är alltid säker att trycka
 * på även om ingen har diskuterat frågan än.
 */
export function DiscussQuestionButton({
  questionId,
  className,
  label = "Behöver du hjälp?",
  compact = false,
}: {
  questionId: string;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/forum/fraga/${encodeURIComponent(questionId)}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] font-semibold text-[var(--brand)] transition hover:bg-[var(--accent-soft)]",
        compact ? "min-h-8 px-2.5 py-1 text-xs" : "min-h-9 px-3 py-1.5 text-xs sm:text-sm",
        className,
      )}
    >
      <MessagesSquare size={14} aria-hidden />
      {label}
    </Link>
  );
}
```

## FlagQuestionButton
- Path: `src/components/flag-question-button.tsx`
- Description: Report-a-problem button for a question.
- Key props: questionId

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  FLAG_REASON_MAX,
  FLAG_REASON_MIN,
  flagQuestion,
  reasonLength,
  type FlagError,
} from "@/lib/question-flags";

const ERROR_TEXT: Record<FlagError, string> = {
  NOT_CONFIGURED: "Rapportering är inte tillgänglig just nu.",
  NOT_AUTHENTICATED: "Logga in för att rapportera fel i en fråga.",
  INVALID_REASON: `Beskriv felet med ${FLAG_REASON_MIN}–${FLAG_REASON_MAX} tecken.`,
  QUESTION_NOT_FOUND: "Frågan finns inte längre i frågebanken – den kan redan granskas.",
  RATE_LIMITED: "Du har rapporterat många frågor i dag. Försök igen i morgon.",
  ALREADY_REVIEWED:
    "Frågan har granskats efter din förra rapport. Hör av dig via Feedback om felet finns kvar.",
  UNKNOWN: "Kunde inte skicka rapporten. Försök igen.",
};

type Phase = "idle" | "open" | "sending" | "done";

/**
 * "Rapportera fel" på en rättad fråga. Kräver inloggning så att tre
 * felrapporter verkligen kommer från tre olika användare. Renderar knappen och
 * panelen som syskon: i en flex-wrap-rad hamnar panelen på en egen rad.
 */
export function FlagQuestionButton({ questionId }: { questionId: string }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  // Flytta fokus till kvittot så att det läses upp och fokus inte tappas.
  useEffect(() => {
    if (phase === "done") doneRef.current?.focus();
  }, [phase]);

  if (!isSupabaseConfigured()) return null;

  if (phase === "done") {
    return (
      <p
        ref={doneRef}
        tabIndex={-1}
        className="text-xs font-medium text-[var(--ink-muted)] outline-none"
      >
        {message}
      </p>
    );
  }

  function close() {
    setPhase("idle");
    setMessage(null);
    buttonRef.current?.focus();
  }

  async function submit() {
    setPhase("sending");
    const result = await flagQuestion(questionId, reason);
    if (result.ok) {
      setMessage(
        result.withdrawn
          ? "Tack! Frågan har dragits tillbaka för granskning."
          : "Tack! Vi granskar frågan när fler har rapporterat samma sak.",
      );
      setPhase("done");
      return;
    }
    setMessage(ERROR_TEXT[result.error]);
    setPhase("open");
  }

  const fieldId = `flag-${questionId}`;
  const panelId = `flag-panel-${questionId}`;
  const length = reasonLength(reason);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={phase !== "idle"}
        aria-controls={panelId}
        onClick={() => (phase === "idle" ? setPhase("open") : close())}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)] sm:text-sm"
      >
        <Flag size={14} aria-hidden />
        Rapportera fel
      </button>

      {phase !== "idle" ? (
        <div
          id={panelId}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="basis-full space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3"
        >
          {user ? (
            <>
              <label htmlFor={fieldId} className="text-xs font-semibold text-[var(--ink)]">
                Vad är fel i frågan?
              </label>
              <textarea
                id={fieldId}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={FLAG_REASON_MAX}
                className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
                placeholder="T.ex. fel facit, två rätta svar, otydlig fråga eller fel i förklaringen."
              />
              {message ? (
                <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
                  {message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  disabled={
                    phase === "sending" || length < FLAG_REASON_MIN || length > FLAG_REASON_MAX
                  }
                  onClick={() => void submit()}
                  className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {phase === "sending" ? "Skickar…" : "Skicka rapport"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--ink-muted)]">{ERROR_TEXT.NOT_AUTHENTICATED}</p>
          )}
        </div>
      ) : null}
    </>
  );
}
```

## XpBar
- Path: `src/components/gamification/xp-bar.tsx`
- Description: Level chip + animated gradient XP bar with shimmer and 'XP idag' energy chip.
- Key props: compact

```tsx
"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";

/**
 * XP-bar med nivå-chip: "Nivå 4 · Strateg" + animerad förloppsindikator
 * mot nästa nivå och dagens XP.
 */
export function XpBar({ compact = false }: { compact?: boolean }) {
  const { state, level } = useGamification();
  const toNext = level.ceiling === null ? 0 : level.ceiling - level.floor;
  const have = level.ceiling === null ? 0 : state.xp - level.floor;
  const pct = Math.max(0, Math.min(100, Math.round((have / Math.max(1, toNext)) * 100)));

  return (
    <div className={compact ? "" : "rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-extrabold text-primary-foreground shadow-soft">
            {level.level}
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-[var(--ink-muted)] uppercase">
              Nivå {level.level}
            </p>
            <p className="text-sm font-extrabold text-[var(--ink)]">{level.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--energy-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--energy-ink)]">
          <Sparkles className="size-3.5" />
          +{state.today.xp} XP idag
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--lagoon-ink))]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.8 }}
          />
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.35)_50%,transparent_70%)]" />
        </div>
        <span className="w-24 shrink-0 text-right text-xs font-bold text-[var(--ink-muted)] tabular-nums">
          {state.xp} XP
          {level.ceiling !== null && (
            <span className="font-semibold"> / {level.ceiling}</span>
          )}
        </span>
      </div>
    </div>
  );
}
```

## StreakCard
- Path: `src/components/gamification/streak-card.tsx`
- Description: Daily streak card with flame animation.

```tsx
"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { dateKey } from "@/lib/gamification/engine";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

/**
 * Streak-kort: flammikon + antal dagar i rad + senaste 7 dagarnas aktivitet.
 * Dagens ruta fylls med en studs när man pluggar.
 */
export function StreakCard() {
  const { state } = useGamification();
  const { current, best } = state.streak;

  const days: { key: string; label: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    days.push({
      key,
      label: WEEKDAY_LABELS[(d.getDay() + 6) % 7], // måndag först
      active: Boolean(state.activeDays[key]),
      isToday: i === 0,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            key={current}
            initial={{ scale: 1.4, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              current > 0 ? "bg-[var(--energy-soft)] text-[var(--energy-ink)]" : "bg-[var(--mist)] text-[var(--ink-muted)]",
            )}
          >
            <Flame className={cn("size-6", current > 0 && "animate-flicker")} />
          </motion.span>
          <div>
            <p className="text-2xl leading-none font-extrabold text-[var(--ink)] tabular-nums">
              {current}
              <span className="ml-1 text-sm font-bold text-[var(--ink-muted)]">
                {current === 1 ? "dag i rad" : "dagar i rad"}
              </span>
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--ink-muted)]">Bästa: {best} dagar</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <motion.span
              animate={d.active ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.35 }}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold",
                d.active
                  ? "bg-[linear-gradient(135deg,var(--energy-ink),var(--coral-ink))] text-primary-foreground shadow-soft"
                  : "bg-[var(--mist)] text-[var(--ink-muted)]",
                d.isToday && !d.active && "border-2 border-dashed border-[var(--energy-ink)]",
              )}
            >
              {d.active ? "✓" : ""}
            </motion.span>
            <span className={cn("text-[9px] font-bold", d.isToday ? "text-[var(--energy-ink)]" : "text-[var(--ink-muted)]")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {current === 0 && (
        <p className="mt-3 text-center text-xs font-bold text-[var(--ink-muted)]">
          Gör en uppgift idag och tänd din streak 🔥
        </p>
      )}
    </div>
  );
}
```

## DailyQuests
- Path: `src/components/gamification/daily-quests.tsx`
- Description: Daily quest list card with progress.

```tsx
"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Dagens tre uppdrag med framstegsindikatorer. Klara uppdrag får en
 * studsig bock och mjukt genomskinlig stil.
 */
export function DailyQuests({ className }: { className?: string }) {
  const { state } = useGamification();
  const { items, allDone } = state.quests;

  return (
    <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
          Dagens uppdrag
        </h2>
        {allDone && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--success-ink)]"
          >
            Alla klara! 🎉
          </motion.span>
        )}
      </div>

      <ul className="mt-3 space-y-2.5">
        {items.map((q) => {
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
          return (
            <li
              key={q.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-[var(--line)] p-2.5 transition-opacity",
                q.done && "border-[var(--success-soft)] bg-[var(--success-soft)]/40 opacity-80",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-lg">
                {q.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-bold text-[var(--ink)]", q.done && "line-through opacity-70")}>
                  {q.label}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        q.done ? "bg-[var(--success-ink)]" : "bg-[linear-gradient(90deg,var(--brand),var(--lagoon-ink))]",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] font-bold text-[var(--ink-muted)] tabular-nums">
                    {q.progress}/{q.target}
                  </span>
                </div>
              </div>
              <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
                {q.done ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                    className="flex size-7 items-center justify-center rounded-full bg-[var(--success-ink)] text-primary-foreground"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span className="text-xs font-extrabold text-[var(--energy-ink)]">+{q.xp}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

## AchievementsPanel
- Path: `src/components/gamification/achievements-panel.tsx`
- Description: Achievements grid in a Disclosure.

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { Disclosure } from "@/components/disclosure";
import { ACHIEVEMENTS } from "@/lib/gamification/config";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Achievement-galleri: upplåsta i färg, låsta nedtonade med hänglås.
 */
export function AchievementsPanel({ className }: { className?: string }) {
  const { state, markAchievementsSeen } = useGamification();
  const [expanded, setExpanded] = useState(false);

  // Stängd panel animerar klart utan att någon ser markeringen; kvittera därför
  // "NY" först när panelen faktiskt är öppen och användaren hunnit se den.
  useEffect(() => {
    if (!expanded) return;
    const unseen = ACHIEVEMENTS.filter((a) => {
      const entry = state.achievements[a.id];
      return entry && !entry.seen;
    }).map((a) => a.id);
    if (unseen.length === 0) return;
    const timer = window.setTimeout(() => markAchievementsSeen(unseen), 1000);
    return () => window.clearTimeout(timer);
  }, [expanded, state.achievements, markAchievementsSeen]);

  return (
    <Disclosure
      title="Achievements"
      onOpenChange={setExpanded}
      className={cn("shadow-soft", className)}
      hint={
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--accent-foreground)]">
          {Object.keys(state.achievements).length} / {ACHIEVEMENTS.length}
        </span>
      }
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = state.achievements[a.id];
          const isNew = unlocked && !unlocked.seen;
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              onAnimationComplete={() => {
                if (expanded && isNew) markAchievementsSeen([a.id]);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                unlocked
                  ? "border-[var(--energy-soft)] bg-[var(--energy-soft)]/50"
                  : "border-[var(--line)] bg-[var(--mist)]/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xl",
                  unlocked ? "bg-[var(--card)] shadow-soft" : "bg-[var(--mist)] grayscale",
                )}
              >
                {unlocked ? a.emoji : <Lock className="size-4 text-[var(--ink-muted)]" />}
              </span>
              <span className={cn("text-xs font-extrabold", unlocked ? "text-[var(--ink)]" : "text-[var(--ink-muted)]")}>
                {unlocked ? a.title : "Låst"}
              </span>
              {unlocked && (
                <span className="line-clamp-2 text-[10px] leading-tight font-semibold text-[var(--ink-muted)]">
                  {a.desc}
                </span>
              )}
              {isNew && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.6, delay: 0.15 }}
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--coral-ink)] text-[9px] font-extrabold text-primary-foreground shadow-pop"
                >
                  NY
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </Disclosure>
  );
}
```

## WeekTaskRow
- Path: `src/components/week-task-row.tsx`
- Description: One task row in the weekly plan (checkbox-like state, minutes, start).
- Key props: see source

```tsx
"use client";

import { formatClock } from "@/lib/practice-timer";
import { sectionLabel, type StudyTask } from "@/lib/study-plan";

type Props = {
  task: StudyTask;
  /** Aktiv övningstid som krävs för att markera klar (task.minutes är planerad tid). */
  requiredMinutes: number;
  checked: boolean;
  score?: { correct: number; total: number };
  bankedMin: number;
  inProgressQuiz: boolean;
  onStart: () => void;
};

/**
 * Ren presentational rad för en veckouppgift. Ingen storage-/timer-I/O här —
 * all data beräknas av WeekTracker och skickas in som props.
 */
export function WeekTaskRow({
  task,
  requiredMinutes,
  checked,
  score,
  bankedMin,
  inProgressQuiz,
  onStart,
}: Props) {
  return (
    <li>
      <div
        className={`rounded-xl border px-3 py-3 sm:px-4 ${
          checked
            ? "border-[var(--brand)]/30 bg-[var(--accent-soft)]/50"
            : "border-[var(--line)] bg-[var(--paper)]"
        }`}
      >
        <div className="flex flex-wrap items-start gap-3">
          <span
            aria-hidden
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
              checked
                ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                : "border-[var(--line)] bg-card text-transparent"
            }`}
          >
            ✓
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-medium ${checked ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"}`}
              >
                {task.title}
              </span>
              <span className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-soft)]">
                {sectionLabel(task.section)}
              </span>
              <span className="text-xs text-[var(--ink-muted)]">~{task.minutes} min</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
              {task.detail}
            </p>
            {(score || (!checked && bankedMin > 0)) && (
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {[
                  score ? `Senaste resultat ${score.correct}/${score.total}` : null,
                  !checked && bankedMin > 0 ? `Sparad tid ${bankedMin}/${requiredMinutes} min (pausad)` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                {checked
                  ? "Öva igen (nya frågor)"
                  : inProgressQuiz
                    ? "Fortsätt övning"
                    : "Starta övning"}
              </button>
              {checked && score ? (
                <span className="self-center text-xs text-[var(--ink-muted)]">
                  Klar · {score.correct}/{score.total}
                </span>
              ) : (
                <span className="self-center text-xs text-[var(--ink-muted)]">
                  {bankedMin > 0
                    ? `Aktiv tid ${formatClock(bankedMin * 60)} / ${requiredMinutes} min`
                    : `Markeras klar efter ${requiredMinutes} min aktiv övning`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
```

## ProgressChart
- Path: `src/components/progress-chart.tsx`
- Description: Small SVG line chart of score history.
- Key props: see source

```tsx
export type ProgressPoint = {
  at: string;
  value: number;
  label: string;
};

/**
 * Ren presentational SVG-graf för poängprognosen — en ren funktion av `points`
 * och `compact` (ingen storage, ingen context, inga side effects).
 */
export function ProgressChart({
  points,
  compact = false,
}: {
  points: ProgressPoint[];
  compact?: boolean;
}) {
  if (points.length < 2) {
    return (
      <p className="mt-5 text-sm text-[var(--ink-muted)]">
        Grafen kräver minst två mätpunkter.
      </p>
    );
  }

  const w = 560;
  const h = compact ? 100 : 140;
  const pad = 22;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map((p) => pad + (1 - p.value / 2) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${w} ${h}`} className={`${compact ? "h-24" : "h-36"} w-full`} role="img" aria-label="Norm över tid">
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <text x={4} y={pad + 4} className="fill-[var(--ink-muted)] text-[10px]">
          2,0
        </text>
        <text x={4} y={h - pad} className="fill-[var(--ink-muted)] text-[10px]">
          0
        </text>
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
        {xs.map((x, i) => (
          <circle
            key={`${points[i].at}-${i}`}
            cx={x}
            cy={ys[i]}
            r={4}
            fill={points[i].label === "inmatad" ? "var(--ink)" : "var(--lagoon-ink)"}
          />
        ))}
      </svg>
      <p className="text-xs text-[var(--ink-muted)]">
        Svart = inmatad norm · grön = uppskattning från övning
      </p>
    </div>
  );
}
```

## StudyTimeNotice
- Path: `src/components/study-time-notice.tsx`
- Description: Notice card recommending study time.
- Key props: see source

```tsx
"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan-context";
import { recommendStudyTime } from "@/lib/study-time-recommendation";
import type { StudyTimeVerdict } from "@/lib/study-time-recommendation";
import { sectionShort } from "@/lib/subtests";

export function StudyTimeNotice() {
  const { scores, ready } = usePlan();
  if (!ready || !scores) return null;
  const verdict = recommendStudyTime(scores);
  return <NoticeBody verdict={verdict} />;
}

function NoticeBody({ verdict }: { verdict: StudyTimeVerdict }) {
  const {
    status,
    recommendedMin,
    recommendedMax,
    currentHours,
    bottlenecks,
    summary,
  } = verdict;

  const tone =
    status === "insufficient"
      ? {
          border: "border-[var(--destructive)]/30",
          bg: "bg-[var(--coral-soft)]",
          title: "text-[var(--destructive)]",
          icon: "⚠️",
        }
      : status === "tight"
        ? {
            border: "border-[var(--brand)]/30",
            bg: "bg-[var(--accent-soft)]/60",
            title: "text-[var(--ink)]",
            icon: "⏳",
          }
        : {
            border: "border-[var(--lagoon-ink)]/40",
            bg: "bg-[var(--accent-soft)]/60",
            title: "text-[var(--ink)]",
            icon: "✓",
          };

  return (
    <section
      className={`rounded-2xl border ${tone.border} ${tone.bg} px-4 py-4 sm:px-5`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${tone.title}`}>
            {tone.icon} Hinner du med din studietid?
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            {summary}
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-[var(--line)] bg-card/80 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Rekommenderad tid
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {recommendedMin}–{recommendedMax}{" "}
            <span className="text-base text-[var(--ink-muted)]">h/vecka</span>
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            du anger {Math.round(currentHours)} h/vecka
          </p>
        </div>
      </div>

      {bottlenecks.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Flaskhalsar
          </span>
          {bottlenecks.map((b) => (
            <Link
              key={b.id}
              href={`/tips?section=${b.id}`}
              className="rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-[var(--ink)] ring-1 ring-[var(--line)] hover:ring-[var(--ink-soft)]"
            >
              {sectionShort(b.id)} {b.percent} %
            </Link>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Rekommendation utifrån dina resultat och din tidsram — du bestämmer själv.
      </p>
    </section>
  );
}
```

## LoginPanel
- Path: `src/components/auth/login-panel.tsx`
- Description: Login/sign-up panel wrapper around AuthForms (used in header popover and pages).
- Key props: compact, note

```tsx
"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { AuthForms } from "@/components/auth/auth-forms";
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

/** Google-inloggning som sekundärt alternativ, med samma utseende överallt. */
export function GoogleButton({ className }: { className?: string }) {
  const { signInWithGoogle } = useAuth();
  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className={cn(
        "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]",
        className,
      )}
    >
      <GoogleG />
      Fortsätt med Google
    </button>
  );
}

/**
 * Inloggningsyta: e-post + lösenord är förstahandsvalet (skapa konto går att
 * göra direkt i formuläret), Google är ett alternativ. Används i headern och i
 * alla inloggningsgrindar så att vägen in ser likadan ut överallt.
 */
export function LoginPanel({
  compact = false,
  note,
}: {
  compact?: boolean;
  note?: string;
}) {
  return (
    <div className={cn("text-left", compact ? "space-y-3" : "space-y-4")}>
      {note ? <p className="text-sm text-[var(--ink-muted)]">{note}</p> : null}
      <AuthForms compact={compact} />
      <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        eller
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <GoogleButton />
    </div>
  );
}
```


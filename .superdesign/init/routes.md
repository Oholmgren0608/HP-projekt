# Routes

Next.js 16 App Router, file-based routing under `src/app`. All routes use the single root layout `src/app/layout.tsx` (AppShell). No route groups, no nested layouts, no `loading.tsx`/`error.tsx`/`not-found.tsx`. Most `page.tsx` files are thin server components that export `metadata` and render one client "screen" component from `src/components`. Dynamic params use `await props.params` (`PageProps<"/route">`).

| URL | Page file | Screen component | Nav location | Summary |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `src/components/dashboard-home.tsx` (`DashboardHome`) | Wordmark | Overview: greeting eyebrow, "Vad du ska göra nu", XpBar, onboarding gradient hero (no plan), DailyQuests + NextTaskCard/StreakCard, stats cards, DailySrsReview, AchievementsPanel, ProgressPanel |
| `/plan` | `src/app/plan/page.tsx` | `src/components/plan-view.tsx` (`PlanView`, in Suspense) | Plan > Veckoplan | Weekly study plan: week tracker with tasks (WeekTaskRow), inline PracticeSession, per-subtest Disclosures with PriorityBadge |
| `/nivatest` | `src/app/nivatest/page.tsx` | `src/components/mini-level-test.tsx` | Plan > Nivåtest | "Var står du idag?" level test: setup, timed quiz, per-subtest results, builds plan |
| `/resultat` | `src/app/resultat/page.tsx` | `src/components/results-view.tsx` | Plan > Poäng | "Poäng och prognos": ScoreForm for HP results, ProgressPanel, priorities |
| `/ova` | `src/app/ova/page.tsx` | `src/components/practice-hub.tsx` | Öva > Öva delprov | "Välj delprov att öva på": grid of 8 subtests (ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK) + flashcards link |
| `/ova/[subtest]` | `src/app/ova/[subtest]/page.tsx` | `src/components/practice-subtest-selector.tsx` | (from /ova) | Subtest practice: choose mode/count, FreePracticeSession quiz with QuizOptions, review. 404 for unknown subtest |
| `/ova/flashcards` | `src/app/ova/flashcards/page.tsx` | `src/components/flashcards.tsx` | Öva > ORD-Flashcards | Page header + flip-card trainer in a card section |
| `/bibliotek` | `src/app/bibliotek/page.tsx` | `src/components/reading-library.tsx` | Öva > Läsbibliotek | Reading texts library + "Läsmetoden" Disclosure |
| `/prov` | `src/app/prov/page.tsx` | `src/components/exams-view.tsx` | Öva > Gamla prov | "Prov — gamla prov och övning": official UHR exams browser, timed mock exam, provpass session |
| `/duell` | `src/app/duell/page.tsx` | `src/components/duel/duel-hub.tsx` | Öva > Duell | "Frågedueller": ELO profile, matchmaking, private lobby (`?kod=`), leaderboard, match history |
| `/duell/[matchId]` | `src/app/duell/[matchId]/page.tsx` | `src/components/duel/duel-match.tsx` | — | Live duel match (UUID-validated, else 404) |
| `/forum` | `src/app/forum/page.tsx` | `src/components/forum/forum-hub.tsx` | Forum | "Förstå varför svaret är rätt": discussion list, reputation, helpful members, reports (mods) |
| `/forum/fraga/[questionId]` | `src/app/forum/fraga/[questionId]/page.tsx` | `src/components/forum/forum-thread.tsx` | — | Discussion thread for one question |
| `/tips` | `src/app/tips/page.tsx` | `src/components/tips-view.tsx` (Suspense) | Tips | "Tips per delprov": Disclosures per subtest, `?section=` deep link |
| `/profil` | `src/app/profil/page.tsx` | `src/app/profil/profile-screen.tsx` (+ `actions.ts`) | Account menu | "Din profil": username, training statistics, help & feedback |
| `/review` | `src/app/review/page.tsx` | `src/app/review/review-screen.tsx` (+ `actions.ts`, `types.ts`) | Account menu > Granska | Admin/reviewer tool: "Granska utkast" for draft questions; "Ingen behörighet" otherwise |
| `/feedback` | `src/app/feedback/page.tsx` | `src/components/feedback/feedback-form.tsx` (Suspense) | Footer | Feature requests / problem reports (`?typ=problem`) |

## Navigation config (from `src/components/app-shell.tsx`)
```tsx
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
```

## Page files (full source)
### `src/app/bibliotek/page.tsx`

```tsx
import type { Metadata } from "next";
import { Disclosure } from "@/components/disclosure";
import { ReadingLibrary } from "@/components/reading-library";
import { READING_METHOD } from "@/lib/reading-library";

export const metadata: Metadata = {
  title: "Läsbibliotek",
  description:
    "Sakprosatexter för HP-träning med ORD-ord, konnektorer och sammanfattning.",
};

export default function ReadingLibraryPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Resurser
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Läsbibliotek
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Egna sakprosatexter för HP-träning — inte kopior av tidnings- eller UHR-texter.
        </p>
      </div>

      <section>
        <div className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
          <ReadingLibrary />
        </div>
      </section>

      <Disclosure title="Läsmetoden" subtitle={`${READING_METHOD.length} råd`}>
        <ul className="space-y-2.5">
          {READING_METHOD.map((m) => (
            <li
              key={m}
              className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}
```

### `src/app/duell/[matchId]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { DuelMatchView } from "@/components/duel/duel-match";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DuelMatchPage(
  props: PageProps<"/duell/[matchId]">,
) {
  const { matchId } = await props.params;
  // Malformerade id:n ger en riktig 404; ett välformat UUID som bara inte
  // finns behåller sin nuvarande in-page/Database-miss i DuelMatchView.
  if (!UUID_RE.test(matchId)) {
    notFound();
  }
  return <DuelMatchView matchId={matchId} />;
}
```

### `src/app/duell/page.tsx`

```tsx
import type { Metadata } from "next";
import { DuelHub } from "@/components/duel/duel-hub";

export const metadata: Metadata = {
  title: "Duell",
  description:
    "Frågedueller mot andra spelare eller botar med ELO-ranking, matchmaking och privata matcher.",
};

export default async function DuelPage(props: PageProps<"/duell">) {
  const searchParams = await props.searchParams;
  const kod =
    typeof searchParams.kod === "string" ? searchParams.kod : "";

  return <DuelHub initialCode={kod} />;
}
```

### `src/app/feedback/page.tsx`

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "Hjälp & feedback",
  description:
    "Skicka önskemål, idéer och förbättringsförslag — eller rapportera ett problem med frågor, prov eller tekniken.",
};

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--mist)]" />
        </div>
      }
    >
      <FeedbackForm />
    </Suspense>
  );
}
```

### `src/app/forum/fraga/[questionId]/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForumThreadScreen } from "@/components/forum/forum-thread";

// Fråge-id:n kommer från frågebankerna (t.ex. `ord-12`) och importerade prov;
// därför en tillåtande kontroll i stället för ett strikt mönster.
const QUESTION_ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

export const metadata: Metadata = {
  title: "Diskussion",
};

export default async function ForumQuestionPage(
  props: PageProps<"/forum/fraga/[questionId]">,
) {
  const { questionId } = await props.params;
  if (!QUESTION_ID_RE.test(questionId)) {
    notFound();
  }
  return <ForumThreadScreen questionId={questionId} />;
}
```

### `src/app/forum/page.tsx`

```tsx
import type { Metadata } from "next";
import { ForumHub } from "@/components/forum/forum-hub";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "Ställ frågor om uppgifter du tycker är svåra och få förklaringar av andra användare.",
};

export default function ForumPage() {
  return <ForumHub />;
}
```

### `src/app/nivatest/page.tsx`

```tsx
import type { Metadata } from "next";
import { MiniLevelTest } from "@/components/mini-level-test";

export const metadata: Metadata = {
  title: "Nivåtest",
  description:
    "Kort minitest med frågor från alla delprov — uppskattar din nivå och bygger veckoplanen.",
};

export default function NivatestPage() {
  return <MiniLevelTest />;
}
```

### `src/app/ova/[subtest]/page.tsx`

```tsx
import { PracticeSubtestSelector } from "@/components/practice-subtest-selector";
import type { PracticeKind } from "@/lib/practice";
import { SUBTESTS } from "@/lib/subtests";
import { notFound } from "next/navigation";

const VALID_SUBTESTS: readonly PracticeKind[] = SUBTESTS.map((s) => s.kind);

export default async function SubtestPage(props: PageProps<"/ova/[subtest]">) {
  const { subtest: rawSubtest } = await props.params;
  const subtest = rawSubtest.toLowerCase();

  if (!VALID_SUBTESTS.includes(subtest as PracticeKind)) {
    notFound();
  }

  return <PracticeSubtestSelector subtest={subtest as PracticeKind} />;
}
```

### `src/app/ova/flashcards/page.tsx`

```tsx
import type { Metadata } from "next";
import { Flashcards } from "@/components/flashcards";

export const metadata: Metadata = {
  title: "Flashcards",
  description:
    "Träna ORD-ord och konnektorer med flashcards — fel kort kommer oftare tillbaka.",
};

export default function FlashcardsPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Verktyg
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          ORD-Flashcards
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Se ordet, säg betydelsen, vänd kortet. Fel kort kommer oftare tillbaka.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
        <Flashcards />
      </section>
    </div>
  );
}
```

### `src/app/ova/page.tsx`

```tsx
import type { Metadata } from "next";
import { PracticeHub } from "@/components/practice-hub";

export const metadata: Metadata = {
  title: "Öva",
  description:
    "Öva på HP-delprov (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG) — välj delprov och antal frågor.",
};

export default function PracticePage() {
  return <PracticeHub />;
}
```

### `src/app/page.tsx`

```tsx
import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard-home";

export const metadata: Metadata = {
  title: "Översikt",
  description:
    "Din personliga översikt: planstatus, poängprognos och nästa uppgift i veckoplanen.",
};

export default function Home() {
  return <DashboardHome />;
}
```

### `src/app/plan/page.tsx`

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { PlanView } from "@/components/plan-view";

export const metadata: Metadata = {
  title: "Veckoplan",
  description:
    "Din personliga veckoplan med prioriterade delprov, tidsfördelning och interaktiva övningar.",
};

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-48 animate-pulse rounded-2xl bg-card/70" />
        </div>
      }
    >
      <PlanView />
    </Suspense>
  );
}
```

### `src/app/profil/page.tsx`

```tsx
import type { Metadata } from "next";
import { ProfileScreen } from "./profile-screen";

export const metadata: Metadata = {
  title: "Profil — HP Lift",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
```

### `src/app/prov/page.tsx`

```tsx
import type { Metadata } from "next";
import { ExamsView } from "@/components/exams-view";

export const metadata: Metadata = {
  title: "Gamla prov",
  description:
    "Officiella gamla högskoleprov (PDF från UHR) för realistisk provträning.",
};

export default function ExamsPage() {
  return <ExamsView />;
}
```

### `src/app/resultat/page.tsx`

```tsx
import type { Metadata } from "next";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = {
  title: "Resultat",
  description:
    "Mata in dina HP-resultat och delprovspoäng för att generera en ny personlig plan.",
};

export default function ResultsPage() {
  return <ResultsView />;
}
```

### `src/app/review/page.tsx`

```tsx
import type { Metadata } from "next";
import { ReviewScreen } from "./review-screen";

export const metadata: Metadata = {
  title: "Granska utkast — HP Lift",
};

export default function ReviewPage() {
  return <ReviewScreen />;
}
```

### `src/app/tips/page.tsx`

```tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { TipsView } from "@/components/tips-view";

export const metadata: Metadata = {
  title: "Tips",
  description: "Strategier och tips för att höja ditt HP-resultat.",
};

export default function TipsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--mist)]" />
          <div className="h-48 animate-pulse rounded-2xl bg-card/70" />
        </div>
      }
    >
      <TipsView />
    </Suspense>
  );
}
```


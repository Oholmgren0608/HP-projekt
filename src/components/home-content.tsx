"use client";

import { Flashcards } from "@/components/flashcards";
import { OfficialExamsBrowser } from "@/components/official-exams-browser";
import { ReadingLibrary } from "@/components/reading-library";
import { ScoreForm } from "@/components/score-form";
import { usePlan } from "@/components/plan-context";
import { Badge } from "@/components/ui/badge";
import { WeekTracker } from "@/components/week-tracker";
import { formatNorm } from "@/lib/hp-scores";
import { READING_METHOD, RESOURCES, pct, priorityLabel } from "@/lib/study-plan";
import type { Priority } from "@/lib/study-plan";

function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priorityLabel(priority);
  if (priority === "kritiskt") {
    return (
      <Badge className="border-transparent bg-[#9a3412] text-white hover:bg-[#9a3412]">
        {label}
      </Badge>
    );
  }
  if (priority === "huvudfokus") {
    return (
      <Badge className="border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent)]">
        {label}
      </Badge>
    );
  }
  if (priority === "styrka") {
    return (
      <Badge className="border-transparent bg-[var(--lagoon)] text-white hover:bg-[var(--lagoon)]">
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

function ScoreBar({ correct, total }: { correct: number; total: number }) {
  const p = pct(correct, total);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
      <div
        className="h-full rounded-full bg-[var(--accent)]"
        style={{ width: `${p}%` }}
        aria-hidden
      />
    </div>
  );
}

export function HomeContent() {
  const { plan, ready } = usePlan();
  const {
    profile,
    delprovScores,
    sections,
    strategy,
    timeSplit,
    dailyTemplate,
    heroSummary,
    focusIds,
  } = plan;

  const weekLabel =
    profile.weeksUntilExam === 8
      ? "8-veckorsplanen"
      : `${profile.weeksUntilExam}-veckorsplanen`;

  return (
    <div className="relative min-h-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 10% -10%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 5%, color-mix(in oklab, var(--lagoon) 22%, transparent), transparent 50%), linear-gradient(180deg, var(--fog) 0%, var(--paper) 38%, var(--fog) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%12121a2a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
            HP Lift
          </span>
          <span className="hidden text-sm text-[var(--ink-muted)] sm:inline">
            studieplan från dina resultat
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#mata-in"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)] sm:inline"
          >
            Resultat
          </a>
          <a
            href="#flashcards"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)] md:inline"
          >
            Flashcards
          </a>
          <a
            href="#gamla-prov"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)] md:inline"
          >
            Gamla prov
          </a>
          <a
            href="#plan"
            className="rounded-md bg-[var(--ink)] px-3.5 py-2 text-sm font-medium text-[var(--paper)] transition hover:bg-[var(--ink-soft)]"
          >
            Till {weekLabel}
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-10">
          <div className="animate-rise">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Personlig HP-strategi
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.05] tracking-tight text-[var(--ink)]">
              HP Lift
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--ink-muted)] sm:text-xl">
              {ready
                ? heroSummary
                : "Laddar din plan…"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#mata-in"
                className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Uppdatera resultat
              </a>
              <a
                href="#plan"
                className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-white/50 px-5 py-2.5 text-sm font-medium text-[var(--ink)] backdrop-blur-sm transition hover:border-[var(--ink-soft)]"
              >
                Se {profile.weeksUntilExam} veckor
              </a>
            </div>
          </div>

          <aside className="animate-rise-delay rounded-2xl border border-[var(--line)] bg-white/75 p-5 shadow-[0_20px_50px_-30px_rgba(18,42,48,0.5)] backdrop-blur-md sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Utgångsläge
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Kvantitativt</dt>
                <dd className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
                  {formatNorm(profile.previousQuant)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Verbalt</dt>
                <dd className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
                  {formatNorm(profile.previousVerbal)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Snitt / mål</dt>
                <dd className="text-xl font-semibold text-[var(--ink)]">
                  {formatNorm(profile.overall)} → {profile.targetOverall}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--ink-muted)]">Rätt totalt</dt>
                <dd className="text-xl font-semibold text-[var(--ink)]">
                  {profile.totalCorrect}/{profile.totalQuestions}
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              Fokus just nu: {focusIds.slice(0, 3).join(", ")}. Mata in nya resultat så byggs
              strategin och veckoplanen om.
            </p>
          </aside>
        </section>

        <section id="mata-in" className="border-y border-[var(--line)] bg-white/70 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              Mata in dina HP-resultat
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              Fyll i normpoäng och råpoäng per delprov. När du sparar skapas en ny prioritering,
              tidsfördelning och {profile.weeksUntilExam}-veckorsplan.
            </p>
            <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
              <ScoreForm />
            </div>
          </div>
        </section>

        <section id="resultat" className="border-b border-[var(--line)] bg-white/55 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              Delprov — prioritering
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              Sorterat efter var tiden ger mest utifrån dina inmatade poäng.
            </p>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {(
                [
                  { title: "Verbala", block: "verbal" as const },
                  { title: "Kvantitativa", block: "kvant" as const },
                ] as const
              ).map((group) => (
                <div key={group.block}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    {group.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {delprovScores
                      .filter((s) => s.block === group.block)
                      .slice()
                      .sort((a, b) => a.correct / a.total - b.correct / b.total)
                      .map((s) => {
                        const p = pct(s.correct, s.total);
                        return (
                          <li
                            key={s.id}
                            className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <div>
                                <span className="font-semibold text-[var(--ink)]">{s.id}</span>
                                <span className="ml-2 text-sm text-[var(--ink-muted)]">
                                  {s.name}
                                </span>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                                {s.correct}/{s.total} · {p}%
                              </span>
                            </div>
                            <ScoreBar correct={s.correct} total={s.total} />
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Tidfördelning (~{profile.hoursPerWeek} h/vecka)
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-5">
                {timeSplit.map((t) => (
                  <li
                    key={t.label}
                    className="rounded-lg border border-[var(--line)] bg-white/70 px-3 py-3 text-center"
                  >
                    <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                      {t.pct}%
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{t.label}</div>
                    <div className="text-xs text-[var(--ink-muted)]">{t.note}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="strategi" className="border-b border-[var(--line)] bg-white/40 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              Strategin i fyra punkter
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              Omkalibrerad efter dina råpoäng — inte bara efter kvant/verbal-snittet.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {strategy.map((item, i) => (
                <article
                  key={item.title}
                  className="animate-rise border-l-2 border-[var(--accent)] pl-4"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-[var(--ink-muted)] leading-relaxed">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Delprov — vad du gör med varje
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Prioritet och veckomål följer dina senaste resultat.
          </p>
          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <article
                key={`${section.id}-${section.name}`}
                className="rounded-xl border border-[var(--line)] bg-white/65 p-5 backdrop-blur-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {section.name}
                  </h3>
                  <PriorityBadge priority={section.priority} />
                  <span className="text-sm text-[var(--ink-muted)]">{section.scoreLabel}</span>
                </div>
                <p className="mt-3 max-w-3xl text-[var(--ink-muted)]">{section.why}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {section.methods.map((m) => (
                    <li
                      key={m}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lagoon)]" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-medium text-[var(--ink)]">
                  Veckans mål:{" "}
                  <span className="font-normal text-[var(--ink-muted)]">{section.weeklyGoal}</span>
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--ink)] py-14 text-[var(--paper)]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
              En vanlig studiedag
            </h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Mall anpassad efter dina flaskhalsar — justeras när du sparar nya resultat.
            </p>
            <ol className="mt-8 space-y-4">
              {dailyTemplate.map((row, i) => (
                <li
                  key={row.slot}
                  className="grid gap-1 border-b border-white/15 pb-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
                >
                  <span className="text-sm font-medium text-[var(--lagoon)]">
                    {i + 1}. {row.slot}
                  </span>
                  <span className="text-white/90">{row.item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="laslista" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Läsbibliotek i appen
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Sakprosatexter att läsa här — med ORD-ord, konnektorer och sammanfattning. Vi kan inte
            kopiera in DN/SvD/UHR-texter (upphovsrätt), så biblioteket är skrivet för HP-träning.
          </p>

          <div className="mt-8">
            <ReadingLibrary />
          </div>

          <div className="mt-10">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Läsmetoden
            </h3>
            <ul className="mt-4 space-y-2">
              {READING_METHOD.map((m) => (
                <li
                  key={m}
                  className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="plan" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {profile.weeksUntilExam}-veckorsplan med checklista
          </h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
            Byggs om från dina resultat. Starta varje uppgift direkt — ORD, MEK, LÄS, ELF, DTK och
            reflektion. Resultat sparas i webbläsaren.
          </p>
          <div className="mt-8">
            <WeekTracker />
          </div>
        </section>

        <section id="flashcards" className="border-y border-[var(--line)] bg-white/40 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              ORD-flashcards
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              Aktiv recall: se ordet, säg betydelsen, vänd kortet. Fel kort kommer oftare tillbaka.
              Progress sparas i webbläsaren.
            </p>
            <div className="mt-8">
              <Flashcards />
            </div>
          </div>
        </section>

        <section id="gamla-prov" className="border-b border-[var(--line)] bg-white/55 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
              Gamla högskoleprov
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
              Läs officiella provhäften och facit här på sidan. Prioritera dina flaskhalsar i de
              verbala häftena.
            </p>
            <div className="mt-8">
              <OfficialExamsBrowser />
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-white/50 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Material
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {RESOURCES.map((r) => (
                <div
                  key={r.title}
                  className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <h3 className="font-semibold text-[var(--ink)]">{r.title}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">{r.body}</p>
                  {r.href ? (
                    <a
                      href={r.href}
                      {...(r.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    >
                      {r.href.startsWith("http")
                        ? "Öppna →"
                        : r.href === "#gamla-prov"
                          ? "Öppna gamla prov →"
                          : r.href === "#flashcards"
                            ? "Öppna flashcards →"
                            : "Se läsbibliotek →"}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-[var(--ink-muted)] sm:px-8">
        <p>
          HP Lift bygger om din träningsplan när du uppdaterar resultat. Justera veckotiden efter
          ditt schema — behåll fördelningen mot flaskhalsarna.
        </p>
      </footer>
    </div>
  );
}

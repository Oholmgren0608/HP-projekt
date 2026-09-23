"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recordEvent } from "@/lib/gamification/engine";
import { usePlan } from "@/components/plan-context";
import { useQuestions } from "@/lib/content/use-questions";
import { ScoreBar } from "@/components/plan-badges";
import { QuestionReviewList } from "@/components/question-review";
import { formatNorm } from "@/lib/hp-scores";
import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import { recordQuizOutcome } from "@/lib/quiz-outcome";
import type { SectionId } from "@/lib/study-plan";
import {
  MINI_TEST_MAX_COUNTS,
  SECTION_KINDS,
  buildMiniTest,
  defaultNivatestCounts,
  loadNivatestCounts,
  miniTestToScoreInput,
  saveNivatestCounts,
  type NivatestCounts,
} from "@/lib/mini-level-test";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";

type Phase = "intro" | "quiz" | "result";

const EMPTY_ANSWERS: Record<string, number> = {};

export function MiniLevelTest() {
  const router = useRouter();
  const { scores, updateScores, ready } = usePlan();

  const [phase, setPhase] = useState<Phase>("intro");
  const [seed, setSeed] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [weeksUntilExam, setWeeksUntilExam] = useState(8);
  const [applied, setApplied] = useState(false);

  // Antal frågor per delprov — standard 3, sedan användarens sparade val.
  // Läses från localStorage först efter hydrering (samma mönster som PlanProvider)
  // för att undvika SSR-mismatch. Justering under render undviker setState i effekt.
  const [counts, setCounts] = useState<NivatestCounts>(defaultNivatestCounts);
  const [countsLoaded, setCountsLoaded] = useState(false);
  if (ready && !countsLoaded) {
    setCountsLoaded(true);
    setCounts(loadNivatestCounts());
  }

  // Förifyll tid/veckor från ev. sparad plan när den hydrerats. Justering under
  // render (spårar föregående värde) undviker setState i en effekt.
  const [syncedScores, setSyncedScores] = useState(scores);
  if (ready && scores !== syncedScores) {
    setSyncedScores(scores);
    setHoursPerWeek(scores.hoursPerWeek);
    setWeeksUntilExam(scores.weeksUntilExam);
  }

  const { ready: questionsReady } = useQuestions();

  const questions = useMemo(
    () =>
      seed && questionsReady
        ? buildMiniTest(seed, counts)
        : ([] as ChoiceQuestion[]),
    [seed, counts, questionsReady],
  );

  function onFinish(locked: Record<string, number>) {
    // Logga nivåtestet till övningshistoriken så att frågorna räknas mot
    // prognos-tröskeln (10 besvarade frågor per delprov). Missade frågor
    // sparas som felkort; vi markerar inte mastery och sparar inte visade
    // frågor för nivåtestet.
    recordQuizOutcome({
      source: "nivatest",
      questions,
      answers: locked,
      trackSrs: true,
      trackMastery: false,
      rememberShown: false,
    });
    recordEvent({ type: "level_test_complete" });
    setPhase("result");
  }

  const quiz = useQuiz({ questions, onFinish });

  const totalQuestions = SECTION_KINDS.reduce((sum, { id }) => sum + counts[id], 0);

  const finalAnswers = quiz.finalAnswers ?? EMPTY_ANSWERS;
  const outcome = useMemo(
    () => miniTestToScoreInput(questions, finalAnswers, { hoursPerWeek, weeksUntilExam }),
    [questions, finalAnswers, hoursPerWeek, weeksUntilExam],
  );

  function updateCount(id: SectionId, count: number) {
    const next = { ...counts, [id]: count };
    setCounts(next);
    saveNivatestCounts(next);
  }

  function start() {
    setSeed(`nivatest:${Date.now()}`);
    quiz.reset();
    setApplied(false);
    setPhase("quiz");
  }

  function applyPlan() {
    updateScores(outcome.input);
    setApplied(true);
    router.push("/plan");
  }

  const heading = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
        Nivåtest
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
        Var står du idag?
      </h1>
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="space-y-8 sm:space-y-10">
        {heading}
        <section className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Ny på HP — eller rostig?
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
            <p>
              Testet har {totalQuestions} frågor från alla delprov och är <strong>inte tidtaget</strong>.
              Gissa hellre än att hoppa över — obesvarade räknas som fel. När du är klar{" "}
              <strong>byggs din veckoplan</strong> utifrån resultatet, och poängen kan du justera
              senare under <strong>Poäng</strong>.
            </p>
          </div>
          <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            Appens egna frågor i HP-stil — de officiella häftena finns under <strong>Prov</strong>.
          </p>
          <div className="mt-6">
            <p className="text-sm font-semibold text-[var(--ink)]">Antal frågor per delprov</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Fler frågor ger säkrare uppskattning.
            </p>
            <div className="mt-3 space-y-2.5">
              {SECTION_KINDS.map(({ id, kind }) => {
                const max = MINI_TEST_MAX_COUNTS[id];
                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5"
                  >
                    <span className="w-12 shrink-0 text-sm font-semibold text-[var(--ink)]">
                      {kindBadge(kind)}
                    </span>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={`Antal ${kindBadge(kind)}-frågor`}
                    >
                      {Array.from({ length: max }, (_, i) => i + 1).map((count) => {
                        const active = counts[id] === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            aria-pressed={active}
                            onClick={() => updateCount(id, count)}
                            className={`min-w-12 rounded-lg border px-4 py-2 font-semibold transition ${
                              active
                                ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                                : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={start}
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Starta nivåtest
          </button>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Vet du redan dina poäng?{" "}
            <Link href="/resultat" className="font-medium text-[var(--brand)] hover:underline">
              Mata in dem för hand i stället
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  if (phase === "quiz") {
    if (!questionsReady || questions.length === 0) {
      return (
        <div className="space-y-6">
          {heading}
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-card/75 py-10 text-sm text-[var(--ink-muted)]">
            <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
            Laddar frågor…
          </div>
        </div>
      );
    }
    const current = quiz.current;
    if (!current) return null;
    return (
      <div className="space-y-6">
        {heading}
        <div className="rounded-2xl border border-[var(--line)] bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                Nivåtest · {kindBadge(current.kind)}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Fråga {quiz.index + 1} av {questions.length}
              </p>
            </div>
            <p className="rounded-md bg-[var(--mist)] px-3 py-1.5 text-sm font-medium tabular-nums text-[var(--ink)]">
              {quiz.answeredCount}/{questions.length} besvarade
            </p>
          </div>

          <div className="mt-4">
            <QuizProgress current={quiz.index + 1} total={questions.length} />
          </div>

          {current.passage ? (
            <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {current.passage}
            </div>
          ) : null}

          <QuestionFigure question={current} position={quiz.index + 1} />

          <p className="mt-5 text-lg font-medium text-[var(--ink)]">{current.prompt}</p>

          <div className="mt-4">
            <QuizOptions
              questionId={current.id}
              options={current.options}
              selected={quiz.selected}
              onSelect={quiz.setSelected}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={quiz.goPrevious}
              disabled={quiz.index === 0}
              className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-4 text-sm text-[var(--ink-muted)] enabled:hover:text-[var(--ink)] disabled:opacity-40"
            >
              Föregående
            </button>
            <button
              type="button"
              disabled={quiz.selected === null}
              onClick={quiz.submitAnswer}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground enabled:hover:brightness-110 disabled:opacity-40"
            >
              {quiz.index >= questions.length - 1 ? "Se resultat" : "Nästa"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === "result"
  const { sections, verbalPercent, quantPercent, overallNorm, input } = outcome;
  return (
    <div className="space-y-8 sm:space-y-10">
      {heading}

      <section className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          Din uppskattade nivå
        </p>
        <div className="mt-3 grid gap-5 sm:gap-6 sm:grid-cols-3">
          {[
            { label: "Snitt (norm)", value: formatNorm(overallNorm), note: "verbal + kvant" },
            { label: "Verbalt", value: formatNorm(input.verbalNorm), note: `${verbalPercent} % rätt` },
            { label: "Kvantitativt", value: formatNorm(input.quantNorm), note: `${quantPercent} % rätt` },
          ].map((box) => (
            <div
              key={box.label}
              className="rounded-2xl border border-[var(--line)] bg-card/70 px-4 py-4 text-center"
            >
              <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                {box.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{box.label}</div>
              <div className="text-xs text-[var(--ink-muted)]">{box.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Uppskattad norm utifrån andel rätt — inte UHR:s officiella tabell. Nivåtest på få frågor
          ger en grov bild; se det som en startpunkt, inte ett facit.
        </p>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Så här gick delproven
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Andelen rätt skalas upp till varje delprovs fulla antal frågor och blir din startpoäng i
          planen.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...sections]
            .sort((a, b) => a.percent - b.percent)
            .map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-[var(--line)] bg-card/70 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--ink)]">{s.id}</span>
                    <span className="ml-2 text-sm text-[var(--ink-muted)]">{s.name}</span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                    {s.correct}/{s.asked} · {s.percent}%
                  </span>
                </div>
                <ScoreBar correct={s.correct} total={s.asked} />
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Startpoäng i planen: ~{s.estCorrect}/{s.total}
                </p>
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-card/75 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Skapa din veckoplan
        </h2>
        <p className="mt-2 text-[var(--ink-muted)]">
          Sista steget: hur mycket tid har du? Sedan bygger vi planen från ditt resultat.
        </p>
        <div className="mt-4 grid gap-5 sm:gap-6 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Timmar / vecka</span>
            <input
              type="number"
              min={3}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Veckor till prov</span>
            <input
              type="number"
              min={4}
              max={16}
              value={weeksUntilExam}
              onChange={(e) => setWeeksUntilExam(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={applyPlan}
            disabled={applied}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition enabled:hover:brightness-110 disabled:opacity-60"
          >
            {applied ? "Skapar plan…" : "Använd resultatet & skapa plan"}
          </button>
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-4 text-sm text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
          >
            Gör om testet
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Genomgång
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Titta igenom facit — förklaringarna hjälper dig förstå mönstren inför träningen.
        </p>
        <div className="mt-4">
          <QuestionReviewList questions={questions} answers={finalAnswers} />
        </div>
      </section>
    </div>
  );
}

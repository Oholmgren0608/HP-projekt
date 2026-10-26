"use client";

import { useMemo, useState } from "react";
import { useQuestions } from "@/lib/content/use-questions";
import { useHydrated } from "@/lib/use-hydrated";
import {
  BLOCK_LABELS,
  EXTENDED_PASS_SECONDS,
  PASS_DISTRIBUTION,
  PASS_QUESTIONS,
  PASS_SECONDS,
  buildProvpass,
  loadProvpassSettings,
  provpassQuestionCount,
  saveProvpassSettings,
  type ProvpassBlock,
  type ProvpassSettings,
} from "@/lib/practice-modes";
import { kindBadge, tally, type ChoiceQuestion, type PracticeKind } from "@/lib/practice";
import { QuestionReviewList } from "@/components/question-review";
import { PaceNotice } from "@/components/pace-notice";
import { formatCountdown } from "@/lib/countdown";
import { paceVerdict } from "@/lib/practice-pace";
import { useQuizCountdown } from "@/lib/use-quiz-countdown";
import { useQuiz } from "@/lib/use-quiz";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { QuestionFigure } from "@/components/question-figure";
import { QuestionPassage } from "@/components/question-passage";

/**
 * Simulera provpass: ett helt pass i provets tempo (55 minuter, eller 80 med
 * förlängd provtid). Provet är tidtaget och rättningen visas först när passet
 * är avslutat — under passet ser man varken rätt eller fel.
 */

type Phase = "intro" | "quiz" | "review";

const BLOCKS: ProvpassBlock[] = ["verbal", "kvant"];

export function ProvpassSession() {
  const { ready: questionsReady, questions: bank } = useQuestions();
  const hydrated = useHydrated();

  const [settings, setSettings] = useState<ProvpassSettings>({
    block: "verbal",
    extendedTime: false,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  if (hydrated && !settingsLoaded) {
    setSettingsLoaded(true);
    setSettings(loadProvpassSettings());
  }

  const [phase, setPhase] = useState<Phase>("intro");
  const [seed, setSeed] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const available = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of bank) counts[q.kind] = (counts[q.kind] ?? 0) + 1;
    return counts;
  }, [bank]);

  const plannedCount = provpassQuestionCount(settings.block, available);
  const limitSeconds = settings.extendedTime ? EXTENDED_PASS_SECONDS : PASS_SECONDS;

  const questions = useMemo<ChoiceQuestion[]>(
    () => (seed && questionsReady ? buildProvpass(settings.block, seed, available) : []),
    [seed, questionsReady, settings.block, available],
  );

  function updateSettings(next: ProvpassSettings) {
    setSettings(next);
    saveProvpassSettings(next);
  }

  // Quizet skapas efter start; frågorna byggs om när seedet sätts.
  const quiz = useQuiz({
    questions,
    onFinish: () => {
      setFinishedAt(Date.now());
      setPhase("review");
    },
  });

  const { remainingSeconds, warning } = useQuizCountdown({
    deadline,
    active: phase === "quiz",
    onExpire: () => {
      setTimedOut(true);
      quiz.finish();
    },
  });

  function start() {
    if (!questionsReady || plannedCount === 0) return;
    const now = Date.now();
    setSeed(`provpass:${now}`);
    quiz.reset();
    setTimedOut(false);
    setFinishedAt(null);
    setStartedAt(now);
    setDeadline(now + limitSeconds * 1000);
    setPhase("quiz");
  }

  const score = useMemo(
    () => tally(questions, quiz.finalAnswers ?? {}),
    [quiz.finalAnswers, questions],
  );

  const durationMs = startedAt !== null && finishedAt !== null ? finishedAt - startedAt : null;

  if (phase === "intro") {
    return (
      <section className="rounded-[10px] border border-[var(--line)] bg-card/75 p-5 sm:p-6">
        <h2 className="mt-1 font-[family-name:var(--font-display)] font-semibold text-2xl text-[var(--ink)]">
          Provpass i provets tempo
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Ett helt provpass med {Math.round(limitSeconds / 60)} minuters timer. Rättningen visas
          först när hela passet är avslutat — under passet ser du varken rätt eller fel.
        </p>

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <p className="text-sm font-medium text-[var(--ink)]">Vilket pass vill du simulera?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BLOCKS.map((block) => (
              <button
                key={block}
                type="button"
                aria-pressed={settings.block === block}
                onClick={() => updateSettings({ ...settings, block })}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                  settings.block === block
                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
                }`}
              >
                {BLOCK_LABELS[block]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {Object.entries(PASS_DISTRIBUTION[settings.block])
              .map(([kind, count]) => `${kindBadge(kind as PracticeKind)} ${count}`)
              .join(" · ")}
          </p>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={settings.extendedTime}
              onChange={(e) => updateSettings({ ...settings, extendedTime: e.target.checked })}
              className="size-4 accent-[var(--brand)]"
            />
            Förlängd provtid (dyslexi) — 80 minuter
          </label>

          <p className="mt-4 font-[family-name:var(--font-display)] font-semibold text-lg tabular-nums text-[var(--ink)]">
            {plannedCount} av {PASS_QUESTIONS} frågor · {Math.round(limitSeconds / 60)} minuter
          </p>
          {plannedCount < PASS_QUESTIONS ? (
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Frågebanken har inte fler frågor i det här passet ännu — passet får ändå full pass-tid.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={start}
          disabled={!questionsReady || plannedCount === 0}
          className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-[var(--brand)] px-6 font-medium text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questionsReady ? "Starta provpass" : "Laddar frågor…"}
        </button>
      </section>
    );
  }

  if (phase === "quiz") {
    if (!questionsReady || questions.length === 0) {
      return (
        <section className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-card/75 py-10 text-sm text-[var(--ink-muted)]">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Laddar frågor…
        </section>
      );
    }

    const current = quiz.current;
    if (!current) return null;

    return (
      <section className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-xs font-medium text-[var(--brand)]">
              Provpass · {BLOCK_LABELS[settings.block]} · {kindBadge(current.kind)}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Fråga {quiz.index + 1} av {questions.length}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {remainingSeconds !== null ? (
              <p
                className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums ${
                  warning
                    ? "bg-[var(--coral-soft)] text-[var(--destructive)]"
                    : "bg-[var(--mist)] text-[var(--ink)]"
                }`}
              >
                Tid kvar: {formatCountdown(remainingSeconds)}
              </p>
            ) : null}
            <p className="rounded-md bg-[var(--mist)] px-3 py-1.5 text-sm font-medium tabular-nums text-[var(--ink)]">
              {quiz.answeredCount}/{questions.length} besvarade
            </p>
          </div>
        </div>

        {warning ? (
          <p
            role="status"
            className={`mt-3 text-sm font-medium ${
              warning === "final" ? "text-[var(--destructive)]" : "text-[var(--energy-ink)]"
            }`}
          >
            {warning === "final"
              ? "1 minut kvar — passet avslutas automatiskt."
              : "5 minuter kvar."}
          </p>
        ) : null}

        <div className="mt-4">
          <QuizProgress current={quiz.index + 1} total={questions.length} />
        </div>

        <QuestionPassage
          passage={current.passage}
          className="mt-5"
          textClassName="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 text-[15px] leading-relaxed text-[var(--ink-soft)]"
        />

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
            disabled={quiz.selected === null}
            onClick={quiz.submitAnswer}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground enabled:hover:brightness-110 disabled:opacity-40"
          >
            {quiz.index >= questions.length - 1 ? "Lämna in passet" : "Nästa"}
          </button>
          <button
            type="button"
            onClick={quiz.goPrevious}
            disabled={quiz.index === 0}
            className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-muted)] disabled:opacity-40"
          >
            Föregående
          </button>
          <button
            type="button"
            onClick={() => quiz.finish()}
            className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Avsluta passet
          </button>
        </div>
      </section>
    );
  }

  const kinds = [...new Set(questions.map((q) => q.kind))];

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
      <p className="text-xs font-medium text-[var(--brand)]">
        Provpass · {BLOCK_LABELS[settings.block]} · genomgång
      </p>
      <p className="font-[family-name:var(--font-display)] font-semibold text-4xl text-[var(--ink)]">
        {score.correct}/{score.total}
        <span className="ml-2 text-xl text-[var(--ink-muted)]">
          ({score.total ? Math.round((score.correct / score.total) * 100) : 0} %)
        </span>
      </p>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        {Math.round(limitSeconds / 60)} minuters pass · råpoäng, ingen normering.
      </p>
      {timedOut ? (
        <p className="mt-2 text-sm text-[var(--ink)]">
          Tiden tog slut — passet avslutades automatiskt. Besvarade frågor rättades och obesvarade
          räknades som fel.
        </p>
      ) : null}

      <div className="mt-3">
        <PaceNotice
          verdict={
            durationMs !== null && durationMs > 0
              ? paceVerdict(durationMs, score.total, kinds)
              : null
          }
          kinds={kinds}
        />
      </div>

      <div className="mt-5">
        <QuestionReviewList questions={questions} answers={quiz.finalAnswers ?? {}} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setPhase("intro")}
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
        >
          Nytt provpass
        </button>
      </div>
    </section>
  );
}

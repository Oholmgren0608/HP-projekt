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
import { ExamQuiz } from "@/components/quiz/exam-quiz";

/**
 * Simulera provpass: ett helt pass i provets tempo (55 minuter, eller 80 med
 * förlängd provtid). Provet är tidtaget och rättningen visas först när passet
 * är avslutat — under passet ser man varken rätt eller fel.
 */

export type ExamPhase = "intro" | "quiz" | "review";

const BLOCKS: ProvpassBlock[] = ["verbal", "kvant"];

export function ProvpassSession({
  onPhaseChange,
}: {
  /** Sidan döljer allt annat medan ett prov pågår eller gås igenom. */
  onPhaseChange?: (phase: ExamPhase) => void;
}) {
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

  const [phase, setPhaseState] = useState<ExamPhase>("intro");
  function setPhase(next: ExamPhase) {
    setPhaseState(next);
    onPhaseChange?.(next);
  }
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
      <section className="flex h-full flex-col rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Helt provpass</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
          Ett pass som på provdagen. Du får hoppa över frågor och gå tillbaka, och ser rätt och fel
          först när du lämnat in.
        </p>

        <div className="mt-4 inline-flex w-fit rounded-md border border-[var(--line-strong)] p-0.5" role="group" aria-label="Pass">
          {BLOCKS.map((block) => (
            <button
              key={block}
              type="button"
              aria-pressed={settings.block === block}
              onClick={() => updateSettings({ ...settings, block })}
              className={`rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors ${
                settings.block === block
                  ? "bg-[var(--accent-soft)] text-[var(--brand)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {BLOCK_LABELS[block]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
          {Object.entries(PASS_DISTRIBUTION[settings.block])
            .map(([kind, count]) => `${kindBadge(kind as PracticeKind)} ${count}`)
            .join(", ")}
        </p>

        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={settings.extendedTime}
            onChange={(e) => updateSettings({ ...settings, extendedTime: e.target.checked })}
            className="size-4 accent-[var(--brand)]"
          />
          Förlängd provtid (80 minuter)
        </label>

        <div className="mt-auto pt-5">
          <p className="text-sm font-medium tabular-nums text-[var(--ink)]">
            {plannedCount} frågor, {Math.round(limitSeconds / 60)} minuter
          </p>
          {plannedCount < PASS_QUESTIONS ? (
            <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">
              Frågebanken räcker till {plannedCount} av {PASS_QUESTIONS} frågor. Passet får ändå full tid.
            </p>
          ) : null}
          <button
            type="button"
            onClick={start}
            disabled={!questionsReady || plannedCount === 0}
            className="mt-3 inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {questionsReady ? "Starta provpass" : "Laddar frågor…"}
          </button>
        </div>
      </section>
    );
  }

  if (phase === "quiz") {
    if (!questionsReady || questions.length === 0) {
      return (
        <section className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-card py-10 text-sm text-[var(--ink-muted)]">
          <span className="size-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
          Laddar frågor…
        </section>
      );
    }

    return (
      <ExamQuiz
        label={`Helt provpass, ${BLOCK_LABELS[settings.block].toLowerCase()}`}
        quiz={quiz}
        questions={questions}
        clock={
          remainingSeconds !== null ? (
            <p
              className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums ${
                warning
                  ? "bg-[var(--coral-soft)] text-[var(--destructive)]"
                  : "bg-[var(--mist)] text-[var(--ink)]"
              }`}
            >
              Tid kvar: {formatCountdown(remainingSeconds)}
            </p>
          ) : null
        }
        notice={
          warning ? (
            <p
              role="status"
              className={`mt-3 text-sm font-medium ${
                warning === "final" ? "text-[var(--destructive)]" : "text-[var(--energy-ink)]"
              }`}
            >
              {warning === "final"
                ? "1 minut kvar. Passet lämnas in automatiskt."
                : "5 minuter kvar."}
            </p>
          ) : null
        }
      />
    );
  }

  const kinds = [...new Set(questions.map((q) => q.kind))];

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-card p-5 sm:p-6">
      <p className="text-[13px] text-[var(--ink-muted)]">
        Helt provpass, {BLOCK_LABELS[settings.block].toLowerCase()}: genomgång
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
          Tiden tog slut och passet lämnades in automatiskt. Obesvarade frågor räknades som fel.
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
          onClick={start}
          className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--brand-deep)]"
        >
          Nytt provpass
        </button>
        <button
          type="button"
          onClick={() => setPhase("intro")}
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] bg-card px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--mist)]"
        >
          Tillbaka till Prov
        </button>
      </div>
    </section>
  );
}

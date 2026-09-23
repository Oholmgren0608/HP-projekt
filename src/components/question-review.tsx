"use client";

import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import { QuestionFigure } from "@/components/question-figure";

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
        {q.passNumber !== undefined ? <span>Pass {q.passNumber}</span> : null}
        <span>{ok ? "Rätt" : unanswered ? "Obesvarad" : "Fel"}</span>
      </div>
      <p className="mt-1 font-medium text-[var(--ink)]">{q.prompt}</p>

      {q.passage ? (
        <p className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--line)] bg-card/70 px-3 py-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {q.passage}
        </p>
      ) : null}

      <QuestionFigure question={q} position={index + 1} />

      <div className="mt-3 space-y-2" role="list" aria-label="Svarsalternativ">
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
      </div>
    </li>
  );
}

import { useState } from "react";
import type { ChoiceQuestion } from "@/lib/practice-types";

/** Quiz-fas som hooken äger. Yttre skärmtillstånd (intro/result) bor i komponenten. */
export type QuizPhase = "quiz" | "review";

export type QuizProgress = {
  /** Antal besvarade frågor (har ett svar i `answers`). */
  answered: number;
  total: number;
};

export type UseQuizOptions = {
  questions: ChoiceQuestion[];
  /**
   * Anropas när quizzen låses (går till review). Får den låsta svarsmappen.
   * Använd den för komponentspecifika sidoeffekter (loggning, timers, gating)
   * utan att hooken behöver känna till dem.
   */
  onFinish?: (locked: Record<string, number>) => void;
};

/**
 * Delad, ren quiz-tillståndsmaskin: index, svar, låsta slut-svar, valt
 * alternativ och quiz-fas. Ingen loggning, inga timers, ingen storage.
 * Baserad på free-practice-session (den enklaste varianten).
 */
export function useQuiz({ questions, onFinish }: UseQuizOptions) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number> | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("quiz");

  const total = questions.length;
  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const progress: QuizProgress = { answered: answeredCount, total };

  /** Lås svaren (explicit given mapp, annars det nu valda alternativet) och gå till review. */
  function finish(locked?: Record<string, number>) {
    const committed =
      locked ??
      (selected !== null && current
        ? { ...answers, [current.id]: selected }
        : answers);
    setAnswers(committed);
    setFinalAnswers(committed);
    setPhase("review");
    onFinish?.(committed);
  }

  function submitAnswer() {
    if (selected === null || !current) return;
    const nextAnswers = { ...answers, [current.id]: selected };

    if (index >= total - 1) {
      finish(nextAnswers);
      return;
    }

    setAnswers(nextAnswers);
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setSelected(nextAnswers[questions[nextIndex]?.id] ?? null);
  }

  /**
   * Registrerar svaret på aktuell fråga utan att gå vidare. Används av lägen
   * med direkt rättning, där frågan först visas med rätt/fel innan nästa.
   */
  function commitAnswer() {
    if (selected === null || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selected }));
  }

  const goNext = submitAnswer;

  function goPrevious() {
    if (index <= 0 || !current) return;
    const nextAnswers =
      selected !== null ? { ...answers, [current.id]: selected } : answers;
    if (nextAnswers !== answers) setAnswers(nextAnswers);
    const prevIndex = index - 1;
    setIndex(prevIndex);
    setSelected(nextAnswers[questions[prevIndex]?.id] ?? null);
  }

  function reset() {
    setIndex(0);
    setAnswers({});
    setFinalAnswers(null);
    setSelected(null);
    setPhase("quiz");
  }

  const restart = reset;

  return {
    index,
    total,
    answers,
    finalAnswers,
    selected,
    setSelected,
    phase,
    current,
    answeredCount,
    progress,
    submitAnswer,
    commitAnswer,
    goNext,
    goPrevious,
    finish,
    reset,
    restart,
  };
}

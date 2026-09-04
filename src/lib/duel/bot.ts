import type { ChoiceQuestion } from "@/lib/practice";

/**
 * AI-bot vars svårighetsgrad automatiskt anpassas efter spelarens ELO.
 * Högre ELO => boten svarar oftare rätt och snabbare. Simuleras helt på
 * klienten (boten har ingen riktig närvaro i databasen).
 */

export type BotDecision = {
  chosen: number;
  correct: boolean;
  /** Millisekunder innan botens svar "dyker upp" i ställningen. */
  delayMs: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Träffsäkerhet 0.35–0.85, skalad mot spelarens ELO. */
export function botAccuracy(playerElo: number): number {
  return clamp(0.35 + (playerElo - 800) / 3000, 0.35, 0.85);
}

/** Genererar botens svar på en enskild fråga. */
export function simulateBotAnswer(
  question: ChoiceQuestion,
  playerElo: number,
): BotDecision {
  const accuracy = botAccuracy(playerElo);
  const correct = Math.random() < accuracy;

  let chosen: number;
  if (correct) {
    chosen = question.correctIndex;
  } else {
    const wrongIndexes = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correctIndex);
    chosen = wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];
  }

  // Rätt svar snabbare, fel svar långsammare — människoliknande spann.
  const delayMs = correct
    ? 1200 + Math.random() * 2500
    : 2600 + Math.random() * 3800;

  return { chosen, correct, delayMs: Math.round(delayMs) };
}

import { requireSupabase } from "@/lib/supabase/client";
import type {
  DuelAnswerResult,
  DuelNextQuestionResult,
  DuelReviewItem,
  PoolQuestion,
} from "@/lib/supabase/client";

/**
 * Duellens frågor kommer från servern (migration 0037): matchens tio frågor
 * väljs ur den stängda spelpoolen, en fråga i taget skickas utan facit och
 * svaret rättas och tidmäts på servern. Ingenting från poolen sparas i
 * webbläsarens lagring (ADR 0001).
 */

/** En fråga som den visas i duellen. */
export type DuelQuestion = {
  id: string;
  kind: string;
  prompt: string;
  passage?: string;
  options: string[];
  figureUrl?: string;
};

export function toDuelQuestion(q: PoolQuestion): DuelQuestion {
  return {
    id: q.id,
    kind: q.kind,
    prompt: q.prompt,
    passage: q.passage ?? undefined,
    options: Array.isArray(q.options) ? q.options : [],
    figureUrl: q.figure_url ?? undefined,
  };
}

export type NextDuelQuestion =
  | { done: true }
  | {
      done: false;
      index: number;
      total: number;
      timeLimitMs: number;
      remainingMs: number;
      question: DuelQuestion;
    };

export function parseNextQuestion(data: DuelNextQuestionResult | null): NextDuelQuestion {
  if (!data || data.done) return { done: true };
  return {
    done: false,
    index: data.index,
    total: data.total,
    timeLimitMs: data.time_limit_ms,
    remainingMs: data.remaining_ms,
    question: toDuelQuestion(data.question),
  };
}

export async function fetchNextDuelQuestion(matchId: string): Promise<NextDuelQuestion> {
  const { data, error } = await requireSupabase().rpc("duel_next_question", {
    p_match_id: matchId,
  });
  if (error) throw error;
  return parseNextQuestion(data);
}

/** `chosen` null = tiden tog slut. Servern bestämmer rätt/fel och svarstid. */
export async function submitDuelAnswer(
  matchId: string,
  index: number,
  chosen: number | null,
): Promise<DuelAnswerResult> {
  const { data, error } = await requireSupabase().rpc("duel_submit_answer", {
    p_match_id: matchId,
    p_idx: index,
    p_chosen: chosen ?? -1,
  });
  if (error) throw error;
  return data;
}

export async function fetchDuelReview(matchId: string): Promise<DuelReviewItem[]> {
  const { data, error } = await requireSupabase().rpc("duel_review", { p_match_id: matchId });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

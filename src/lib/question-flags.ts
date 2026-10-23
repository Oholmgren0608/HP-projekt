/**
 * Felrapporter: "den här frågan är fel". Rapporten skrivs via RPC:n
 * `question_flag` (se `supabase/migrations/0017_fragebank_skydd_och_flaggor.sql`):
 * en per användare och fråga, och när tre olika användare har öppna rapporter
 * dras frågan tillbaka till utkast för granskning. Har en granskare hanterat
 * användarens förra rapport på frågan går den inte att rapportera igen på 30
 * dagar (ALREADY_REVIEWED). Klienten kan aldrig skriva rapporter eller
 * frågestatus direkt.
 */

import { getSupabase } from "@/lib/supabase/client";

export const FLAG_REASON_MIN = 3;
export const FLAG_REASON_MAX = 500;

/**
 * Motiveringens längd så som databasen räknar den: tecken (kodpunkter) efter
 * trim, inte UTF-16-enheter – en emoji är ett tecken.
 */
export function reasonLength(reason: string): number {
  return [...reason.trim()].length;
}

export type FlagError =
  | "NOT_CONFIGURED"
  | "NOT_AUTHENTICATED"
  | "INVALID_REASON"
  | "QUESTION_NOT_FOUND"
  | "RATE_LIMITED"
  | "ALREADY_REVIEWED"
  | "UNKNOWN";

export type FlagResult = { ok: true; withdrawn: boolean } | { ok: false; error: FlagError };

const KNOWN_ERRORS: FlagError[] = [
  "NOT_AUTHENTICATED",
  "INVALID_REASON",
  "QUESTION_NOT_FOUND",
  "RATE_LIMITED",
  "ALREADY_REVIEWED",
];

export async function flagQuestion(questionId: string, reason: string): Promise<FlagResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "NOT_CONFIGURED" };
  const trimmed = reason.trim();
  const length = reasonLength(trimmed);
  if (length < FLAG_REASON_MIN || length > FLAG_REASON_MAX) {
    return { ok: false, error: "INVALID_REASON" };
  }
  try {
    const { data, error } = await supabase.rpc("question_flag", {
      p_question_id: questionId,
      p_reason: trimmed,
    });
    if (error) {
      const known = KNOWN_ERRORS.find((code) => error.message.includes(code));
      if (!known) console.warn("[flagga] kunde inte rapportera frågan:", error.message);
      return { ok: false, error: known ?? "UNKNOWN" };
    }
    return { ok: true, withdrawn: Boolean(data?.withdrawn) };
  } catch (e) {
    console.warn("[flagga] nätverksfel vid rapportering:", e);
    return { ok: false, error: "UNKNOWN" };
  }
}

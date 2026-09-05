import { createClient } from "@supabase/supabase-js";

/**
 * Typad vy över public-schemat (user_state). Den här supabase-js-versionen
 * kräver schema-nyckel ("public") och att varje tabell har Relationships.
 * Värden lagras som {"v": "<raw localStorage-sträng>"} i jsonb.
 */
export type Database = {
  public: {
    Tables: {
      user_state: {
        Row: {
          user_id: string;
          storage_key: string;
          value: { v?: string } | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          storage_key: string;
          value: { v?: string } | null;
          updated_at?: string;
        };
        Update: {
          value?: { v?: string } | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      player_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          elo: number;
          wins: number;
          losses: number;
          draws: number;
          created_at: string;
          updated_at: string;
          flagged: boolean;
          flagged_at: string | null;
          received_rating_sum: number;
          received_rating_count: number;
          report_count: number;
          bot_skill_offset: number;
        };
        Insert: {
          user_id: string;
          display_name: string;
          elo?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          created_at?: string;
          updated_at?: string;
          flagged?: boolean;
          flagged_at?: string | null;
          received_rating_sum?: number;
          received_rating_count?: number;
          report_count?: number;
          bot_skill_offset?: number;
        };
        Update: {
          display_name?: string;
          elo?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          updated_at?: string;
          flagged?: boolean;
          flagged_at?: string | null;
          received_rating_sum?: number;
          received_rating_count?: number;
          report_count?: number;
          bot_skill_offset?: number;
        };
        Relationships: [];
      };
      duel_matches: {
        Row: {
          id: string;
          mode: "ranked" | "casual" | "private";
          status: "waiting" | "active" | "finished" | "forfeit" | "cancelled";
          player_a: string;
          player_b: string | null;
          bot_elo: number | null;
          question_seed: string;
          winner: string | null;
          a_correct: number | null;
          b_correct: number | null;
          a_time_ms: number | null;
          b_time_ms: number | null;
          elo_a_delta: number | null;
          elo_b_delta: number | null;
          invite_code: string | null;
          a_finished_at: string | null;
          b_finished_at: string | null;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          mode: "ranked" | "casual" | "private";
          status?: "waiting" | "active" | "finished" | "forfeit" | "cancelled";
          player_a: string;
          player_b?: string | null;
          bot_elo?: number | null;
          question_seed?: string;
          winner?: string | null;
          a_correct?: number | null;
          b_correct?: number | null;
          a_time_ms?: number | null;
          b_time_ms?: number | null;
          elo_a_delta?: number | null;
          elo_b_delta?: number | null;
          invite_code?: string | null;
          a_finished_at?: string | null;
          b_finished_at?: string | null;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          status?: "waiting" | "active" | "finished" | "forfeit" | "cancelled";
          winner?: string | null;
          a_correct?: number | null;
          b_correct?: number | null;
          a_time_ms?: number | null;
          b_time_ms?: number | null;
          elo_a_delta?: number | null;
          elo_b_delta?: number | null;
          a_finished_at?: string | null;
          b_finished_at?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      duel_answers: {
        Row: {
          match_id: string;
          user_id: string;
          question_id: string;
          chosen: number;
          correct: boolean;
          time_ms: number;
          answered_at: string;
        };
        Insert: {
          match_id: string;
          user_id: string;
          question_id: string;
          chosen: number;
          correct: boolean;
          time_ms: number;
          answered_at?: string;
        };
        Update: {
          chosen?: number;
          correct?: boolean;
          time_ms?: number;
        };
        Relationships: [];
      };
      duel_queue: {
        Row: {
          id: string;
          user_id: string;
          mode: "ranked" | "casual";
          elo: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: "ranked" | "casual";
          elo: number;
          created_at?: string;
        };
        Update: {
          mode?: "ranked" | "casual";
          elo?: number;
        };
        Relationships: [];
      };
      duel_reviews: {
        Row: {
          id: string;
          match_id: string;
          reviewer_id: string;
          target_user: string | null;
          target_is_bot: boolean;
          rating: number | null;
          difficulty: "too_easy" | "just_right" | "too_hard" | null;
          report_reason: "cheating" | "unsportsmanlike" | "abuse" | "other" | null;
          comment: string | null;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          reviewer_id: string;
          target_user?: string | null;
          target_is_bot?: boolean;
          rating?: number | null;
          difficulty?: "too_easy" | "just_right" | "too_hard" | null;
          report_reason?: "cheating" | "unsportsmanlike" | "abuse" | "other" | null;
          comment?: string | null;
          weight?: number;
          created_at?: string;
        };
        Update: {
          rating?: number | null;
          difficulty?: "too_easy" | "just_right" | "too_hard" | null;
          report_reason?: "cheating" | "unsportsmanlike" | "abuse" | "other" | null;
          comment?: string | null;
        };
        Relationships: [];
      };
      leaderboard_entries: {
        Row: {
          user_id: string;
          week: string;
          xp: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          week: string;
          xp?: number;
          updated_at?: string;
        };
        Update: {
          xp?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      duel_ensure_profile: {
        Args: { p_display_name: string };
        Returns: null;
      };
      duel_join_queue: {
        Args: { p_mode: string };
        Returns: string | null;
      };
      duel_cancel_queue: {
        Args: Record<string, never>;
        Returns: null;
      };
      duel_start_bot_match: {
        Args: { p_mode: string };
        Returns: string;
      };
      duel_submit_answer: {
        Args: {
          p_match_id: string;
          p_question_id: string;
          p_chosen: number;
          p_correct: boolean;
          p_time_ms: number;
        };
        Returns: null;
      };
      duel_mark_finished: {
        Args: { p_match_id: string; p_correct: number; p_time_ms: number };
        Returns: string | null;
      };
      duel_finish_bot: {
        Args: {
          p_match_id: string;
          p_player_correct: number;
          p_player_time_ms: number;
          p_bot_correct: number;
        };
        Returns: { delta: number; winner_is_me: boolean } | null;
      };
      duel_forfeit: {
        Args: { p_match_id: string };
        Returns: null;
      };
      duel_claim_stall_win: {
        Args: { p_match_id: string };
        Returns: null;
      };
      duel_create_private: {
        Args: Record<string, never>;
        Returns: { code: string; match_id: string };
      };
      duel_join_private: {
        Args: { p_code: string };
        Returns: string | null;
      };
      duel_cancel_private: {
        Args: { p_match_id: string };
        Returns: null;
      };
      duel_submit_review: {
        Args: {
          p_match_id: string;
          p_rating: number | null;
          p_difficulty: string | null;
          p_report_reason: string | null;
          p_comment: string | null;
        };
        Returns: { status: string };
      };
      leaderboard_submit: {
        Args: { p_week: string; p_xp: number };
        Returns: null;
      };
      leaderboard_get: {
        Args: { p_week: string; p_limit?: number };
        Returns: {
          rank: number;
          user_id: string;
          display_name: string;
          xp: number;
          is_me: boolean;
        }[];
      };
      leaderboard_set_name: {
        Args: { p_display_name: string };
        Returns: null;
      };
    };
  };
};

/**
 * Supabase browser client, created lazily on first use.
 *
 * The app must keep working 100% anonymously without Supabase configured
 * (optional login), so nothing here throws: callers check
 * `isSupabaseConfigured()` before using `getSupabase()`.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Returns a singleton Supabase browser client, or `null` if env vars are
 * missing (auth/sync UI should then be hidden or disabled).
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Separate from app data keys in localStorage (the sync adapter
        // enumerates app storage keys and must not touch the session).
        storageKey: "hp-lift-auth",
      },
    });
  }
  return browserClient;
}

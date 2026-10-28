import { createClient } from "@supabase/supabase-js";
import type {
  AdminApplication,
  AuditEntry,
  ExpertDirectoryEntry,
  ExpertProfileRow,
  ExpertSearchRow,
  MyApplication,
  QueueRow,
  StaffMember,
} from "@/lib/studiehjalp/types";

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
      questions: {
        Row: {
          id: string;
          kind: string;
          prompt: string;
          passage: string | null;
          options: string[];
          correct_index: number;
          explain: string;
          exam_id: string | null;
          exam_date: string | null;
          pass_number: number | null;
          question_number: number | null;
          figure_url: string | null;
          source_url: string | null;
          status: string;
          /** Andra kontrollen av en övningsfråga; null för äldre frågor. */
          verification: "agreed" | "disagreed" | null;
          verification_note: string | null;
        };
        Insert: {
          id: string;
          kind: string;
          prompt: string;
          passage?: string | null;
          options: string[];
          correct_index: number;
          explain: string;
          exam_id?: string | null;
          exam_date?: string | null;
          pass_number?: number | null;
          question_number?: number | null;
          figure_url?: string | null;
          source_url?: string | null;
          status?: string;
          verification?: "agreed" | "disagreed" | null;
          verification_note?: string | null;
        };
        Update: {
          kind?: string;
          prompt?: string;
          passage?: string | null;
          options?: string[];
          correct_index?: number;
          explain?: string;
          exam_id?: string | null;
          exam_date?: string | null;
          pass_number?: number | null;
          question_number?: number | null;
          figure_url?: string | null;
          source_url?: string | null;
          status?: string;
          verification?: "agreed" | "disagreed" | null;
          verification_note?: string | null;
        };
        Relationships: [];
      };
      question_flags: {
        Row: {
          question_id: string;
          user_id: string;
          reason: string;
          created_at: string;
          /** null = öppen flagga; sätts när frågan publiceras igen. */
          resolved_at: string | null;
        };
        Insert: never;
        /** Bara service role (/review) får stänga rapporter. */
        Update: { resolved_at?: string | null };
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          exam_date: string;
          title: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id: string;
          exam_date: string;
          title: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          exam_date?: string;
          title?: string;
          status?: string;
        };
        Relationships: [];
      };
      reflect_prompts: {
        Row: {
          id: string;
          title: string;
          prompts: string[];
        };
        Insert: {
          id: string;
          title: string;
          prompts: string[];
        };
        Update: {
          title?: string;
          prompts?: string[];
        };
        Relationships: [];
      };
      player_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          username: string | null;
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
          username?: string | null;
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
          username?: string | null;
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
      duel_questions: {
        Row: {
          question_id: string;
          correct_index: number;
        };
        Insert: {
          question_id: string;
          correct_index: number;
        };
        Update: Record<string, never>;
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
        Update: Record<string, never>;
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
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: "ranked" | "casual";
          elo: number;
          created_at?: string;
          expires_at?: string;
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
      forum_threads: {
        Row: {
          id: string;
          question_id: string;
          kind: string;
          title: string;
          created_by: string | null;
          created_at: string;
          last_activity_at: string;
          post_count: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          kind: string;
          title: string;
          created_by?: string | null;
          created_at?: string;
          last_activity_at?: string;
          post_count?: number;
        };
        Update: {
          last_activity_at?: string;
          post_count?: number;
        };
        Relationships: [];
      };
      forum_posts: {
        Row: {
          id: string;
          thread_id: string;
          parent_id: string | null;
          author_id: string;
          body: string;
          created_at: string;
          is_best: boolean;
          is_deleted: boolean;
          deleted_by: string | null;
          up_votes: number;
          down_votes: number;
        };
        Insert: {
          id?: string;
          thread_id: string;
          parent_id?: string | null;
          author_id: string;
          body: string;
          created_at?: string;
          is_best?: boolean;
          is_deleted?: boolean;
        };
        Update: {
          body?: string;
          is_best?: boolean;
          is_deleted?: boolean;
        };
        Relationships: [];
      };
      forum_votes: {
        Row: {
          post_id: string;
          user_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          value?: number;
        };
        Relationships: [];
      };
      forum_reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          status: "open" | "handled" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          status?: "open" | "handled" | "dismissed";
          created_at?: string;
        };
        Update: {
          reason?: string;
          status?: "open" | "handled" | "dismissed";
        };
        Relationships: [];
      };
      forum_moderators: {
        Row: {
          user_id: string;
          added_at: string;
        };
        Insert: {
          user_id: string;
          added_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      forum_reputation: {
        Row: {
          user_id: string;
          points: number;
          upvotes_received: number;
          downvotes_received: number;
          best_answers: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          points?: number;
          upvotes_received?: number;
          downvotes_received?: number;
          best_answers?: number;
          updated_at?: string;
        };
        Update: {
          points?: number;
          upvotes_received?: number;
          downvotes_received?: number;
          best_answers?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_requests: {
        Row: {
          id: string;
          kind: string;
          user_id: string | null;
          category: string;
          title: string;
          description: string;
          reason: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind?: string;
          user_id?: string | null;
          category: string;
          title: string;
          description: string;
          reason?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      staff_roles: {
        Row: { user_id: string; role: string; granted_by: string | null; granted_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      feature_flags: {
        Row: { key: string; mode: "off" | "staff" | "on"; note: string; updated_by: string | null; updated_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      expert_applications: {
        Row: {
          id: string;
          user_id: string;
          track: "hp" | "teacher";
          status: "draft" | "submitted" | "needs_completion" | "approved" | "rejected" | "blocked";
          legal_name: string;
          claimed_total: number | null;
          claimed_test: string;
          teacher_subjects: string;
          message: string;
          adult_confirmed: boolean;
          consent_at: string | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
          decided_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      expert_documents: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          kind: "hp_result" | "teacher_license" | "identity" | "other";
          storage_path: string;
          file_name: string;
          mime: string;
          size_bytes: number;
          status: "pending" | "uploaded";
          created_at: string;
          delete_after: string | null;
          deleted_at: string | null;
        };
        Insert: never;
        Update: { status?: "pending" | "uploaded"; deleted_at?: string | null };
        Relationships: [];
      };
      expert_profiles: {
        Row: ExpertProfileRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      duel_public_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          elo: number;
          wins: number;
          losses: number;
          draws: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      duel_ensure_profile: {
        Args: { p_display_name: string };
        Returns: null;
      };
      profile_set_username: {
        Args: { p_username: string };
        Returns: {
          user_id: string;
          display_name: string;
          username: string;
        } | null;
      };
      profile_ensure: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          display_name: string;
          username: string | null;
        } | null;
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
          p_time_ms: number;
        };
        Returns: null;
      };
      duel_mark_finished: {
        Args: { p_match_id: string };
        Returns: string | null;
      };
      duel_finish_bot: {
        Args: {
          p_match_id: string;
          p_bot_correct: number;
        };
        Returns: { delta: number; winner_is_me: boolean | null } | null;
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
      forum_thread_list: {
        Args: {
          p_sort?: string;
          p_kind?: string | null;
          p_search?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          question_id: string;
          kind: string;
          title: string;
          created_at: string;
          last_activity_at: string;
          post_count: number;
          score: number;
          solved: boolean;
          author_name: string;
          preview: string;
        }[];
      };
      forum_thread_by_question: {
        Args: { p_question_id: string };
        Returns: {
          id: string;
          question_id: string;
          kind: string;
          title: string;
          created_by: string | null;
          created_at: string;
          last_activity_at: string;
          post_count: number;
          best_post_id: string | null;
          is_moderator: boolean;
        }[];
      };
      forum_thread_posts: {
        Args: { p_thread_id: string };
        Returns: {
          id: string;
          parent_id: string | null;
          author_id: string;
          author_name: string;
          body: string;
          created_at: string;
          up_votes: number;
          down_votes: number;
          is_best: boolean;
          is_deleted: boolean;
          my_vote: number | null;
          is_mine: boolean;
          is_op: boolean;
        }[];
      };
      forum_post_to_question: {
        Args: { p_question_id: string; p_kind: string; p_title: string; p_body: string };
        Returns: string;
      };
      forum_create_post: {
        Args: { p_thread_id: string; p_parent_id: string | null; p_body: string };
        Returns: string;
      };
      forum_vote: {
        Args: { p_post_id: string; p_value: number };
        Returns: null;
      };
      forum_mark_best: {
        Args: { p_post_id: string; p_best?: boolean };
        Returns: null;
      };
      forum_report: {
        Args: { p_post_id: string; p_reason: string };
        Returns: null;
      };
      question_flag: {
        Args: { p_question_id: string; p_reason: string };
        Returns: { flags: number; withdrawn: boolean };
      };
      forum_moderate_delete: {
        Args: { p_post_id: string };
        Returns: null;
      };
      forum_reputation_top: {
        Args: { p_limit?: number };
        Returns: {
          user_id: string;
          display_name: string;
          points: number;
          upvotes_received: number;
          best_answers: number;
        }[];
      };
      forum_moderator_reports: {
        Args: { p_limit?: number };
        Returns: {
          report_id: string;
          post_id: string;
          thread_id: string;
          question_id: string;
          reason: string;
          status: string;
          created_at: string;
          author_name: string;
          reporter_name: string;
          body: string;
        }[];
      };
      forum_resolve_report: {
        Args: { p_report_id: string; p_status?: string };
        Returns: null;
      };
      feature_request_submit: {
        Args: {
          p_kind: string;
          p_category: string;
          p_title: string;
          p_description: string;
          p_reason?: string | null;
        };
        Returns: string;
      };
      has_role: { Args: { p_role: string }; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      flag_enabled: { Args: { p_key: string }; Returns: boolean };
      studiehjalp_access: {
        Args: Record<string, never>;
        Returns: { flags: Record<string, boolean>; roles: string[] }[];
      };
      expert_application_start: { Args: { p_track: string }; Returns: string };
      expert_application_save: {
        Args: {
          p_application_id: string;
          p_legal_name: string;
          p_claimed_total: number | null;
          p_claimed_test: string;
          p_teacher_subjects: string;
          p_message: string;
          p_adult_confirmed: boolean;
        };
        Returns: null;
      };
      expert_application_submit: {
        Args: { p_application_id: string; p_consent: boolean };
        Returns: null;
      };
      expert_application_mine: { Args: Record<string, never>; Returns: MyApplication[] };
      expert_document_begin: {
        Args: {
          p_application_id: string;
          p_kind: string;
          p_file_name: string;
          p_mime: string;
          p_size: number;
        };
        Returns: { id: string; storage_path: string }[];
      };
      expert_document_remove: { Args: { p_document_id: string }; Returns: string };
      expert_document_confirmable: {
        Args: { p_document_id: string };
        Returns: { storage_path: string; mime: string; size_bytes: number }[];
      };
      expert_application_withdraw: { Args: { p_application_id: string }; Returns: string[] };
      expert_storage_orphans: { Args: { p_limit?: number }; Returns: { name: string }[] };
      admin_flags: {
        Args: Record<string, never>;
        Returns: { key: string; mode: "off" | "staff" | "on"; note: string; updated_at: string }[];
      };
      expert_queue: { Args: { p_status?: string }; Returns: QueueRow[] };
      expert_application_admin: { Args: { p_application_id: string }; Returns: AdminApplication };
      expert_application_decide: {
        Args: {
          p_application_id: string;
          p_decision: string;
          p_check_type: string | null;
          p_verified_total: number | null;
          p_verified_test: string;
          p_verified_subjects: string;
          p_identity_checked: boolean;
          p_source_ref: string;
          p_reason: string;
        };
        Returns: null;
      };
      expert_document_open: { Args: { p_document_id: string }; Returns: string };
      expert_documents_due: {
        Args: { p_limit?: number };
        Returns: { id: string; storage_path: string }[];
      };
      expert_documents_mark_deleted: { Args: { p_ids: string[] }; Returns: number };
      expert_profile_mine: {
        Args: Record<string, never>;
        Returns: { profile: ExpertProfileRow | null; approved: boolean };
      };
      expert_profile_save: {
        Args: {
          p_display_name: string;
          p_headline: string;
          p_bio: string;
          p_method: string;
          p_experience: string;
          p_subtests: string[];
          p_languages: string[];
          p_formats: string[];
          p_city: string;
          p_price_30: number | null;
          p_price_60: number | null;
          p_price_90: number | null;
          p_free_consultation: boolean;
          p_show_hp_score: boolean;
        };
        Returns: null;
      };
      expert_profile_publish: { Args: { p_published: boolean }; Returns: null };
      expert_directory: { Args: { p_public_id?: string | null }; Returns: ExpertDirectoryEntry[] };
      expert_search: {
        Args: {
          p_subtest?: string | null;
          p_format?: string | null;
          p_language?: string | null;
          p_max_price?: number | null;
          p_min_hp?: number | null;
          p_query?: string | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: ExpertSearchRow[];
      };
      admin_staff_list: { Args: Record<string, never>; Returns: StaffMember[] };
      admin_grant_role: { Args: { p_email: string; p_role: string }; Returns: string };
      admin_revoke_role: { Args: { p_user_id: string; p_role: string }; Returns: null };
      admin_set_flag: { Args: { p_key: string; p_mode: string }; Returns: null };
      admin_audit_recent: { Args: { p_limit?: number }; Returns: AuditEntry[] };
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

export function requireSupabase() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase är inte konfigurerat");
  return client;
}

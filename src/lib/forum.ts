/**
 * Frågeforum: diskussionstrådar kopplade till quizfrågor.
 *
 * Allt skrivande går via RPC:er (se `supabase/migrations/0012_forum.sql`) -
 * röster, bästa svar och rykte räknas atomiskt i databasen och kan aldrig
 * sättas direkt av klienten. Läsning är publik och no-opar tyst när Supabase
 * saknas, precis som topplistan.
 */

import { getSupabase } from "@/lib/supabase/client";
import { SUBTESTS } from "@/lib/subtests";

/** Sortering av diskussionslistan. */
export type ForumSort = "new" | "popular" | "unanswered" | "active";

export type ForumThreadSummary = {
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
};

export type ForumThreadMeta = {
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
};

export type ForumPost = {
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
};

export type ForumReputationRow = {
  user_id: string;
  display_name: string;
  points: number;
  upvotes_received: number;
  best_answers: number;
};

export type ForumKindInfo = {
  kind: string;
  short: string;
  name: string;
  block: "kvant" | "verbal" | null;
  blockLabel: string;
};

/** Delprovsetikett för en frågas `kind` (t.ex. `ord` → ORD / Verbal del). */
export function forumKindInfo(kind: string): ForumKindInfo {
  const subtest = SUBTESTS.find((s) => s.kind === kind);
  if (!subtest) {
    const upper = kind.toUpperCase();
    return { kind, short: upper, name: upper, block: null, blockLabel: "Blandat" };
  }
  return {
    kind,
    short: subtest.short,
    name: subtest.name,
    block: subtest.block,
    blockLabel: subtest.block === "kvant" ? "Kvantitativ del" : "Verbal del",
  };
}

/** Listan över diskussioner, med sök, delprovsfilter och sortering. */
export async function fetchThreads(options: {
  sort?: ForumSort;
  kind?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
} = {}): Promise<ForumThreadSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("forum_thread_list", {
      p_sort: options.sort ?? "new",
      p_kind: options.kind ?? null,
      p_search: options.search?.trim() ? options.search.trim() : null,
      p_limit: options.limit ?? 30,
      p_offset: options.offset ?? 0,
    });
    if (error) {
      console.warn("[forum] kunde inte hämta diskussioner:", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn("[forum] nätverksfel vid hämtning av diskussioner:", e);
    return [];
  }
}

/** Tråden för en fråga, eller null om ingen diskussion startats än. */
export async function fetchThreadForQuestion(questionId: string): Promise<ForumThreadMeta | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("forum_thread_by_question", {
      p_question_id: questionId,
    });
    if (error) {
      console.warn("[forum] kunde inte hämta tråden:", error.message);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.warn("[forum] nätverksfel vid hämtning av tråd:", e);
    return null;
  }
}

/** Alla inlägg i en tråd (bästa svar först, sedan kronologiskt). */
export async function fetchPosts(threadId: string): Promise<ForumPost[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("forum_thread_posts", { p_thread_id: threadId });
    if (error) {
      console.warn("[forum] kunde inte hämta inlägg:", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn("[forum] nätverksfel vid hämtning av inlägg:", e);
    return [];
  }
}

/**
 * Startar en diskussion för en fråga (skapar tråden vid behov) och lägger
 * inlägget i samma transaktion. Returnerar inläggets id.
 */
export async function postQuestion(args: {
  questionId: string;
  kind: string;
  title: string;
  body: string;
}): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("forum_post_to_question", {
      p_question_id: args.questionId,
      p_kind: args.kind,
      p_title: args.title,
      p_body: args.body,
    });
    if (error) {
      console.warn("[forum] kunde inte skapa inlägget:", error.message);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.warn("[forum] nätverksfel vid skapande av inlägg:", e);
    return null;
  }
}

/** Svarar på ett inlägg (p_parentId = null för ett toppinlägg). */
export async function createPost(args: {
  threadId: string;
  parentId: string | null;
  body: string;
}): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("forum_create_post", {
      p_thread_id: args.threadId,
      p_parent_id: args.parentId,
      p_body: args.body,
    });
    if (error) {
      console.warn("[forum] kunde inte svara:", error.message);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.warn("[forum] nätverksfel vid svar:", e);
    return null;
  }
}

/** Röstar på ett inlägg: 1 = upp, -1 = ned, 0 = tar bort rösten. */
export async function votePost(postId: string, value: -1 | 0 | 1): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("forum_vote", { p_post_id: postId, p_value: value });
    if (error) {
      console.warn("[forum] kunde inte rösta:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[forum] nätverksfel vid röstning:", e);
    return false;
  }
}

/** Markerar (eller avmarkerar) ett inlägg som bästa svar. */
export async function markBestAnswer(postId: string, best = true): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("forum_mark_best", { p_post_id: postId, p_best: best });
    if (error) {
      console.warn("[forum] kunde inte markera bästa svar:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[forum] nätverksfel vid markering:", e);
    return false;
  }
}

/** Anmäler ett inlägg som olämpligt. */
export async function reportPost(postId: string, reason: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("forum_report", { p_post_id: postId, p_reason: reason });
    if (error) {
      console.warn("[forum] kunde inte anmäla inlägget:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[forum] nätverksfel vid anmälan:", e);
    return false;
  }
}

/** Tar bort ett eget inlägg (moderatorer kan ta bort allas). */
export async function deletePost(postId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("forum_moderate_delete", { p_post_id: postId });
    if (error) {
      console.warn("[forum] kunde inte ta bort inlägget:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[forum] nätverksfel vid borttagning:", e);
    return false;
  }
}

/** Topplista över hjälpsamma medlemmar (rykte). */
export async function fetchReputationTop(limit = 8): Promise<ForumReputationRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("forum_reputation_top", { p_limit: limit });
    if (error) {
      console.warn("[forum] kunde inte hämta ryktet:", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn("[forum] nätverksfel vid hämtning av rykte:", e);
    return [];
  }
}

/** Sant om den inloggade användaren är moderator. */
export async function fetchIsModerator(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("forum_moderators")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[forum] kunde inte läsa moderatorstatus:", error.message);
      return false;
    }
    return Boolean(data);
  } catch (e) {
    console.warn("[forum] nätverksfel vid moderatorstatus:", e);
    return false;
  }
}

export type ForumReportRow = {
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
};

/** Anmälningar i moderatorernas kö (tom för alla andra). */
export async function fetchModeratorReports(limit = 50): Promise<ForumReportRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("forum_moderator_reports", { p_limit: limit });
    if (error) {
      console.warn("[forum] kunde inte hämta anmälningar:", error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn("[forum] nätverksfel vid hämtning av anmälningar:", e);
    return [];
  }
}

/** Kvitterar en anmälan ('handled' eller 'dismissed'). */
export async function resolveReport(
  reportId: string,
  status: "handled" | "dismissed" = "handled",
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("forum_resolve_report", {
      p_report_id: reportId,
      p_status: status,
    });
    if (error) {
      console.warn("[forum] kunde inte kvittera anmälan:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[forum] nätverksfel vid kvittering:", e);
    return false;
  }
}

/** Den inloggade användarens eget rykte (null om inget finns än). */
export type MyReputation = {
  points: number;
  upvotes_received: number;
  downvotes_received: number;
  best_answers: number;
};

export async function fetchMyReputation(userId: string): Promise<MyReputation | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("forum_reputation")
      .select("points, upvotes_received, downvotes_received, best_answers")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[forum] kunde inte läsa ryktet:", error.message);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.warn("[forum] nätverksfel vid läsning av rykte:", e);
    return null;
  }
}

/** Ryktenivåer - används för märken i forumet och på profilen. */
export const REPUTATION_LEVELS = [
  { min: 0, label: "Ny i forumet", emoji: "🌱" },
  { min: 15, label: "Hjälpsam", emoji: "💡" },
  { min: 50, label: "Förklarare", emoji: "📘" },
  { min: 150, label: "Guide", emoji: "🧭" },
  { min: 400, label: "Mästare", emoji: "🏆" },
] as const;

export function reputationLevel(points: number): (typeof REPUTATION_LEVELS)[number] {
  let current: (typeof REPUTATION_LEVELS)[number] = REPUTATION_LEVELS[0];
  for (const level of REPUTATION_LEVELS) if (points >= level.min) current = level;
  return current;
}

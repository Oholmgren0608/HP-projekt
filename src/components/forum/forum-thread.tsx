"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  BadgeCheck,
  CornerDownRight,
  Flag,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { loadQuestions } from "@/lib/content/questions-provider";
import { kindBadge, type ChoiceQuestion } from "@/lib/practice";
import { QuizOptions } from "@/components/quiz/quiz-options";
import { QuestionFigure } from "@/components/question-figure";
import { useAuth } from "@/lib/supabase/auth-context";
import {
  createPost,
  deletePost,
  fetchPosts,
  fetchThreadForQuestion,
  forumKindInfo,
  markBestAnswer,
  postQuestion,
  reportPost,
  votePost,
  type ForumPost,
  type ForumThreadMeta,
} from "@/lib/forum";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_INDENT = 3;

type PostNode = ForumPost & { children: PostNode[] };

/** Bygger en trädstruktur av platta inlägg (föräldralösa hamnar på toppnivå). */
function buildTree(posts: ForumPost[]): PostNode[] {
  const nodes: Record<string, PostNode> = {};
  for (const post of posts) nodes[post.id] = { ...post, children: [] };
  const roots: PostNode[] = [];
  for (const node of Object.values(nodes)) {
    const parent = node.parent_id ? nodes[node.parent_id] : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // Bästa svar först, därefter röststarka svar, sedan kronologiskt.
  const sortera = (list: PostNode[]) => {
    list.sort((a, b) => {
      if (a.is_best !== b.is_best) return a.is_best ? -1 : 1;
      const score = (p: PostNode) => p.up_votes - p.down_votes;
      if (score(a) !== score(b)) return score(b) - score(a);
      return a.created_at.localeCompare(b.created_at);
    });
    for (const node of list) sortera(node.children);
  };
  sortera(roots);
  return roots;
}

/** Hämtar frågan, tråden och alla inlägg i ett svep (rör inget state). */
async function readThread(questionId: string): Promise<{
  question: ChoiceQuestion | null;
  meta: ForumThreadMeta | null;
  posts: ForumPost[];
}> {
  const bank = await loadQuestions();
  const question = bank.questions.find((q) => q.id === questionId) ?? null;
  const meta = await fetchThreadForQuestion(questionId);
  const posts = meta ? await fetchPosts(meta.id) : [];
  return { question, meta, posts };
}

/** Trådsidan: frågan, diskussionen och alla svar. */
export function ForumThreadScreen({ questionId }: { questionId: string }) {
  const { user, signInWithGoogle } = useAuth();
  const [question, setQuestion] = useState<ChoiceQuestion | null>(null);
  const [thread, setThread] = useState<ForumThreadMeta | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const next = await readThread(questionId);
    setQuestion(next.question);
    setThread(next.meta);
    setPosts(next.posts);
  }, [questionId]);

  useEffect(() => {
    let cancelled = false;
    void readThread(questionId).then((next) => {
      if (cancelled) return;
      setQuestion(next.question);
      setThread(next.meta);
      setPosts(next.posts);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const info = forumKindInfo(thread?.kind ?? question?.kind ?? "");
  const tree = useMemo(() => buildTree(posts), [posts]);
  const titel = thread?.title ?? question?.prompt ?? questionId;
  const ärTrådstartare = Boolean(user && thread && user.id === thread.created_by);
  const ärModerator = Boolean(thread?.is_moderator);

  async function handlePost(parentId: string | null) {
    if (!user) return;
    const text = body.trim();
    if (!text) {
      setError("Skriv något först.");
      return;
    }
    setBusy(true);
    setError(null);
    const ok = thread
      ? await createPost({ threadId: thread.id, parentId, body: text })
      : await postQuestion({
          questionId,
          kind: question?.kind ?? "okand",
          title: question?.prompt?.slice(0, 200) ?? questionId,
          body: text,
        });
    setBusy(false);
    if (!ok) {
      setError("Kunde inte spara inlägget. Försök igen om en stund.");
      return;
    }
    setBody("");
    setReplyTo(null);
    await reload();
  }

  async function handleVote(post: ForumPost, value: -1 | 1) {
    if (!user) return;
    const next = post.my_vote === value ? 0 : value;
    await votePost(post.id, next);
    await reload();
  }

  async function handleBest(post: ForumPost) {
    await markBestAnswer(post.id, !post.is_best);
    await reload();
  }

  async function handleDelete(post: ForumPost) {
    const säker = window.confirm(
      post.is_mine ? "Ta bort ditt inlägg?" : "Ta bort inlägget som moderator?",
    );
    if (!säker) return;
    await deletePost(post.id);
    await reload();
  }

  async function handleReport(post: ForumPost) {
    if (!reportReason.trim()) {
      setError("Beskriv kort varför inlägget är olämpligt.");
      return;
    }
    setBusy(true);
    const ok = await reportPost(post.id, reportReason.trim());
    setBusy(false);
    setReportingId(null);
    setReportReason("");
    setError(ok ? null : "Kunde inte skicka anmälan.");
    if (ok) window.alert("Tack! Anmälan är skickad till moderatorerna.");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-card/70 p-6 text-sm text-[var(--ink-muted)]">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Hämtar diskussionen…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
      >
        <ArrowLeft size={15} aria-hidden />
        Alla diskussioner
      </Link>

      {/* Frågan */}
      <section className="rounded-2xl border border-[var(--line)] bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent-foreground)]">
            {info.short}
          </span>
          <span className="text-[var(--ink-muted)]">{info.blockLabel}</span>
          <span className="text-[var(--ink-muted)]">·</span>
          <span className="text-[var(--ink-muted)]">{questionId}</span>
        </div>

        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
          {titel}
        </h1>

        {question?.passage ? (
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)]">
            {question.passage}
          </p>
        ) : null}

        {question ? (
          <>
            <QuestionFigure question={question} position={1} />
            <div className="mt-4">
              <QuizOptions
                questionId={question.id}
                options={question.options}
                selected={null}
                correctIndex={question.correctIndex}
              />
            </div>
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Förklaring
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">{question.explain}</p>
            </div>
            <p className="mt-3 text-sm">
              <Link
                href={`/ova/${question.kind}`}
                className="font-semibold text-[var(--brand)] underline-offset-2 hover:underline"
              >
                Öva mer på {kindBadge(question.kind)} →
              </Link>
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Frågan finns inte i den lokala frågebanken (den kan komma från ett importerat prov), men
            diskussionen fungerar precis som vanligt.
          </p>
        )}
      </section>

      {/* Diskussionen */}
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
            <MessageSquare size={18} aria-hidden />
            Diskussion
            <span className="text-sm font-normal text-[var(--ink-muted)]">
              {posts.filter((p) => !p.is_deleted).length} inlägg
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {thread?.best_post_id ? (
              <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[var(--success-ink)]">
                Löst
              </span>
            ) : (
              <span className="rounded-full bg-[var(--energy-soft)] px-2.5 py-1 text-[var(--energy-ink)]">
                Obesvarad
              </span>
            )}
            {ärModerator ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] px-2.5 py-1 text-[var(--ink-muted)]">
                <ShieldCheck size={13} aria-hidden />
                Moderator
              </span>
            ) : null}
          </div>
        </header>

        {posts.length === 0 ? (
          <p className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 text-sm text-[var(--ink-muted)]">
            Ingen har skrivit här än. Beskriv vad du tycker är svårt med uppgiften – någon annan
            undrar oftast samma sak.
          </p>
        ) : (
          <ul className="space-y-3">
            {tree.map((node) => (
              <PostItem
                key={node.id}
                node={node}
                depth={0}
                user={user?.id ?? null}
                kanMarkera={ärTrådstartare || ärModerator}
                ärModerator={ärModerator}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                body={body}
                setBody={setBody}
                busy={busy}
                reportingId={reportingId}
                setReportingId={setReportingId}
                reportReason={reportReason}
                setReportReason={setReportReason}
                onVote={handleVote}
                onBest={handleBest}
                onDelete={handleDelete}
                onReport={handleReport}
                onReply={handlePost}
              />
            ))}
          </ul>
        )}

        {/* Skriv ett inlägg */}
        {user ? (
          <div className="rounded-2xl border border-[var(--line)] bg-card p-4 sm:p-5">
            <label htmlFor="forum-body" className="text-sm font-semibold text-[var(--ink)]">
              {thread ? "Skriv ett inlägg" : "Ställ din fråga"}
            </label>
            <textarea
              id="forum-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder={
                thread
                  ? "Dela med dig av en förklaring eller ställ en följdfråga…"
                  : "Vad är det du inte förstår? Beskriv hur du tänker så blir det lättare att hjälpa dig."
              }
              className="mt-2 w-full resize-y rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[var(--ink-muted)]">{body.trim().length}/4000</span>
              <button
                type="button"
                disabled={busy || body.trim().length === 0}
                onClick={() => void handlePost(null)}
                className="inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "Skickar…" : thread ? "Publicera" : "Starta diskussionen"}
              </button>
            </div>
            {error ? <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-card p-5">
            <p className="text-sm text-[var(--ink-muted)]">
              Logga in för att ställa frågor, svara och rösta på hjälpsamma förklaringar.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Logga in med Google
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function PostItem({
  node,
  depth,
  user,
  kanMarkera,
  ärModerator,
  replyTo,
  setReplyTo,
  body,
  setBody,
  busy,
  reportingId,
  setReportingId,
  reportReason,
  setReportReason,
  onVote,
  onBest,
  onDelete,
  onReport,
  onReply,
}: {
  node: PostNode;
  depth: number;
  user: string | null;
  kanMarkera: boolean;
  ärModerator: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  body: string;
  setBody: (v: string) => void;
  busy: boolean;
  reportingId: string | null;
  setReportingId: (id: string | null) => void;
  reportReason: string;
  setReportReason: (v: string) => void;
  onVote: (post: ForumPost, value: -1 | 1) => Promise<void>;
  onBest: (post: ForumPost) => Promise<void>;
  onDelete: (post: ForumPost) => Promise<void>;
  onReport: (post: ForumPost) => Promise<void>;
  onReply: (parentId: string) => Promise<void>;
}) {
  const score = node.up_votes - node.down_votes;
  const svarar = replyTo === node.id;
  const anmäler = reportingId === node.id;

  return (
    <li>
      <article
        className={cn(
          "rounded-2xl border p-4 sm:p-5",
          node.is_best
            ? "border-[var(--lagoon-ink)]/40 bg-[var(--accent-soft)]/40"
            : node.is_deleted
              ? "border-[var(--line)] bg-[var(--paper)]"
              : "border-[var(--line)] bg-card/70",
        )}
      >
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink)]">{node.author_name}</span>
          {node.is_op ? (
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 font-semibold text-[var(--accent-foreground)]">
              Frågeställare
            </span>
          ) : null}
          {node.is_best ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-0.5 font-semibold text-[var(--success-ink)]">
              <BadgeCheck size={12} aria-hidden />
              Bästa svar
            </span>
          ) : null}
          <span>{formatRelativeTime(node.created_at)}</span>
          {node.is_deleted ? <span>· borttaget</span> : null}
        </header>

        <p
          className={cn(
            "mt-2 whitespace-pre-wrap text-sm leading-relaxed",
            node.is_deleted ? "italic text-[var(--ink-muted)]" : "text-[var(--ink-soft)]",
          )}
        >
          {node.body}
        </p>

        {!node.is_deleted ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded-full border border-[var(--line-strong)] px-1">
              <button
                type="button"
                disabled={!user || node.is_mine}
                onClick={() => void onVote(node, 1)}
                aria-label="Rösta upp"
                aria-pressed={node.my_vote === 1}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition disabled:opacity-40",
                  node.my_vote === 1 ? "text-[var(--success-ink)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                <ArrowBigUp size={17} aria-hidden />
              </button>
              <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-[var(--ink)]">
                {score}
              </span>
              <button
                type="button"
                disabled={!user || node.is_mine}
                onClick={() => void onVote(node, -1)}
                aria-label="Rösta ned"
                aria-pressed={node.my_vote === -1}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition disabled:opacity-40",
                  node.my_vote === -1
                    ? "text-[var(--destructive)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                <ArrowBigDown size={17} aria-hidden />
              </button>
            </div>

            {user && depth < MAX_INDENT + 1 ? (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(svarar ? null : node.id);
                  setBody("");
                }}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-2.5 text-xs font-semibold text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
              >
                <CornerDownRight size={13} aria-hidden />
                Svara
              </button>
            ) : null}

            {kanMarkera && !node.is_mine ? (
              <button
                type="button"
                onClick={() => void onBest(node)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition",
                  node.is_best
                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line-strong)] text-[var(--ink-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]",
                )}
              >
                <BadgeCheck size={13} aria-hidden />
                {node.is_best ? "Bästa svar" : "Markera bästa svar"}
              </button>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setReportingId(anmäler ? null : node.id);
                  setReportReason("");
                }}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-2.5 text-xs font-semibold text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
              >
                <Flag size={13} aria-hidden />
                Anmäl
              </button>
            ) : null}

            {node.is_mine || ärModerator ? (
              <button
                type="button"
                onClick={() => void onDelete(node)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-2.5 text-xs font-semibold text-[var(--destructive)] transition hover:bg-[var(--coral-soft)]"
              >
                <Trash2 size={13} aria-hidden />
                Ta bort
              </button>
            ) : null}
          </div>
        ) : null}

        {anmäler ? (
          <div className="mt-3 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3">
            <label htmlFor={`report-${node.id}`} className="text-xs font-semibold text-[var(--ink)]">
              Varför anmäler du inlägget?
            </label>
            <textarea
              id={`report-${node.id}`}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
              placeholder="T.ex. stötande språk, spam eller helt felaktig förklaring."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportingId(null)}
                className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onReport(node)}
                className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Skicka anmälan
              </button>
            </div>
          </div>
        ) : null}

        {svarar ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={4000}
              autoFocus
              className="w-full resize-y rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
              placeholder={`Svara ${node.author_name}…`}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)]"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={busy || body.trim().length === 0}
                onClick={() => void onReply(node.id)}
                className="rounded-lg bg-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Svara
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {node.children.length > 0 ? (
        <ul
          className={cn(
            "mt-3 space-y-3 border-l border-[var(--line)] pl-3 sm:pl-4",
            depth >= MAX_INDENT ? "" : "ml-4 sm:ml-6",
          )}
        >
          {node.children.map((child) => (
            <PostItem
              key={child.id}
              node={child}
              depth={depth + 1}
              user={user}
              kanMarkera={kanMarkera}
              ärModerator={ärModerator}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              body={body}
              setBody={setBody}
              busy={busy}
              reportingId={reportingId}
              setReportingId={setReportingId}
              reportReason={reportReason}
              setReportReason={setReportReason}
              onVote={onVote}
              onBest={onBest}
              onDelete={onDelete}
              onReport={onReport}
              onReply={onReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

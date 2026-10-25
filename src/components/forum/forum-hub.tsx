"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  BadgeCheck,
  CircleHelp,
  Flame,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  fetchIsModerator,
  fetchModeratorReports,
  fetchMyReputation,
  fetchReputationTop,
  fetchThreads,
  forumKindInfo,
  reputationLevel,
  resolveReport,
  type ForumReportRow,
  type ForumReputationRow,
  type ForumSort,
  type ForumThreadSummary,
  type MyReputation,
} from "@/lib/forum";
import { SUBTESTS } from "@/lib/subtests";
import { formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";

const SORTS: { id: ForumSort; label: string; icon: typeof Flame }[] = [
  { id: "new", label: "Nyast", icon: Sparkles },
  { id: "popular", label: "Mest populära", icon: Flame },
  { id: "unanswered", label: "Obesvarade", icon: CircleHelp },
];

/** Blogg / frågeforum: lista över diskussioner kopplade till quizfrågor. */
export function ForumHub() {
  const { user } = useAuth();
  const [sort, setSort] = useState<ForumSort>("new");
  const [kind, setKind] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ForumThreadSummary[]>([]);
  const [reputation, setReputation] = useState<ForumReputationRow[]>([]);
  const [myReputation, setMyReputation] = useState<MyReputation | null>(null);
  const [reports, setReports] = useState<ForumReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Enkel sökfördröjning så att varje tangenttryck inte blir ett anrop.
  // OBS: sätt bara loading när sökordet faktiskt ändras - annars släcker
  // timern spinnern efter att hämtningen redan hunnit bli klar.
  useEffect(() => {
    const nästa = search.trim();
    if (nästa === query) return;
    const id = setTimeout(() => {
      setQuery(nästa);
      setLoading(true);
    }, 300);
    return () => clearTimeout(id);
  }, [search, query]);

  useEffect(() => {
    let cancelled = false;
    void fetchThreads({ sort, kind, search: query, limit: 50 }).then((rows) => {
      if (cancelled) return;
      setThreads(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sort, kind, query]);

  useEffect(() => {
    let cancelled = false;
    void fetchReputationTop(8).then((rows) => {
      if (!cancelled) setReputation(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Eget rykte + moderatorernas anmälningskö (bara för moderatorer).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const eget = await fetchMyReputation(user.id);
      if (cancelled) return;
      setMyReputation(eget);
      if (await fetchIsModerator(user.id)) {
        const kö = await fetchModeratorReports();
        if (!cancelled) setReports(kö);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const antalPerDelprov = useMemo(() => SUBTESTS, []);

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Förstå varför svaret är rätt
        </h1>
        <p className="max-w-2xl text-[var(--ink-muted)]">
          Varje quizfråga har sin egen diskussion. Ställ en fråga om en uppgift du tycker är svår,
          svara andra och rösta upp de förklaringar som hjälpte dig.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          {/* Sök + sortering */}
          <div className="space-y-3">
            <label className="relative block">
              <span className="sr-only">Sök bland diskussioner</span>
              <Search
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök på fråga, ord eller förklaring…"
                className="w-full rounded-lg border border-[var(--line-strong)] bg-card py-2 pl-9 pr-3 text-sm text-[var(--ink)] outline-none ring-[var(--brand)] placeholder:text-[var(--ink-muted)] focus:ring-2"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {SORTS.map((option) => {
                const Icon = option.icon;
                const active = sort === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSort(option.id);
                      setLoading(true);
                    }}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                      active
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]",
                    )}
                  >
                    <Icon size={14} aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-pressed={kind === null}
                onClick={() => {
                  setKind(null);
                  setLoading(true);
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                  kind === null
                    ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]",
                )}
              >
                Alla delprov
              </button>
              {antalPerDelprov.map((subtest) => {
                const active = kind === subtest.kind;
                return (
                  <button
                    key={subtest.kind}
                    type="button"
                    aria-pressed={active}
                    title={subtest.name}
                    onClick={() => {
                      setKind(active ? null : subtest.kind);
                      setLoading(true);
                    }}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                      active
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]",
                    )}
                  >
                    {subtest.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diskussioner */}
          {loading ? (
            <div className="flex items-center gap-2 rounded-[10px] border border-[var(--line)] bg-card/70 p-6 text-sm text-[var(--ink-muted)]">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Hämtar diskussioner…
            </div>
          ) : threads.length === 0 ? (
            <div className="space-y-2 rounded-[10px] border border-[var(--line)] bg-card/70 p-6">
              <p className="font-medium text-[var(--ink)]">Inga diskussioner här än</p>
              <p className="text-sm text-[var(--ink-muted)]">
                {query
                  ? "Inget matchade sökningen. Prova ett annat ord eller välj ett annat delprov."
                  : "Öppna en fråga efter att du rättat den och tryck på ”Behöver du hjälp?” för att starta den första diskussionen."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </ul>
          )}
        </div>

        {/* Sidopanelen: rykte, anmälningar och så funkar det */}
        <aside className="space-y-4">
          {user && myReputation ? (
            <section className="rounded-[10px] border border-[var(--line)] bg-card p-5">
              <h2 className="text-sm font-medium text-[var(--ink)]">Ditt rykte</h2>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] font-semibold text-3xl text-[var(--ink)]">
                  {myReputation.points}
                </span>
                <span className="text-sm text-[var(--ink-muted)]">poäng</span>
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {reputationLevel(myReputation.points).label} · {myReputation.upvotes_received} uppröster ·{" "}
                {myReputation.best_answers} bästa svar
              </p>
            </section>
          ) : null}

          {reports.length > 0 ? (
            <section className="rounded-[10px] border border-[var(--destructive)]/40 bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                <ShieldCheck size={16} className="text-[var(--destructive)]" aria-hidden />
                Anmälningar ({reports.length})
              </h2>
              <ul className="mt-3 space-y-3">
                {reports.map((report) => (
                  <li key={report.report_id} className="space-y-1.5 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs text-[var(--ink-muted)]">
                      {report.question_id} · anmäld av {report.reporter_name}
                    </p>
                    <p className="text-sm font-medium text-[var(--ink)]">{report.reason}</p>
                    <p className="line-clamp-2 text-xs text-[var(--ink-muted)]">{report.body}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/forum/fraga/${encodeURIComponent(report.question_id)}`}
                        className="text-xs font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                      >
                        Öppna tråden
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void resolveReport(report.report_id, "handled").then(() =>
                            setReports((rows) => rows.filter((r) => r.report_id !== report.report_id)),
                          );
                        }}
                        className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                      >
                        Hanterad
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void resolveReport(report.report_id, "dismissed").then(() =>
                            setReports((rows) => rows.filter((r) => r.report_id !== report.report_id)),
                          );
                        }}
                        className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                      >
                        Avvisa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-[10px] border border-[var(--line)] bg-card/70 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <BadgeCheck size={16} className="text-[var(--success-ink)]" aria-hidden />
              Hjälpsamma medlemmar
            </h2>
            {reputation.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Ingen har fått rykte än. Rösta upp ett bra svar så syns det här.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {reputation.map((row, index) => {
                  const level = reputationLevel(row.points);
                  return (
                    <li key={row.user_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="w-4 text-xs font-medium text-[var(--ink-muted)]">
                          {index + 1}
                        </span>
                        <span className="truncate text-[var(--ink)]">{row.display_name}</span>
                        <span className="shrink-0 text-xs text-[var(--ink-muted)]">{level.label}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-[var(--ink-soft)]">
                        {row.points}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="rounded-[10px] border border-[var(--line)] bg-[var(--paper)] p-5 text-sm text-[var(--ink-soft)]">
            <h2 className="text-sm font-medium text-[var(--ink)]">Så funkar forumet</h2>
            <ul className="mt-2 space-y-1.5">
              <li>• Varje fråga har sin egen tråd – hittas via ”Behöver du hjälp?”.</li>
              <li>• Rösta upp svar som förklarade något bra (+2 rykte till skribenten).</li>
              <li>• Frågans skapare kan markera ett svar som bästa svar (+15 rykte).</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ThreadCard({ thread }: { thread: ForumThreadSummary }) {
  const info = forumKindInfo(thread.kind);
  const obesvarad = thread.post_count <= 1 && !thread.solved;

  return (
    <li>
      <Link
        href={`/forum/fraga/${encodeURIComponent(thread.question_id)}`}
        className="block rounded-[10px] border border-[var(--line)] bg-card/70 p-4 transition hover:border-[var(--brand)] hover:bg-card sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent-foreground)]">
            {info.short}
          </span>
          <span className="text-[var(--ink-muted)]">{info.blockLabel}</span>
          {thread.solved ? (
            <span className="rounded-md bg-[var(--success-soft)] px-2 py-0.5 text-[var(--success-ink)]">
              Löst
            </span>
          ) : obesvarad ? (
            <span className="rounded-md bg-[var(--energy-soft)] px-2 py-0.5 text-[var(--energy-ink)]">
              Obesvarad
            </span>
          ) : null}
        </div>

        <h2 className="mt-2 font-medium text-[var(--ink)]">{thread.title}</h2>
        {thread.preview ? (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">{thread.preview}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={13} aria-hidden />
            {thread.post_count} {thread.post_count === 1 ? "inlägg" : "inlägg"}
          </span>
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={13} aria-hidden />
            {thread.score} röster
          </span>
          <span>{thread.author_name}</span>
          <span>{formatRelativeTime(thread.last_activity_at)}</span>
        </div>
      </Link>
    </li>
  );
}

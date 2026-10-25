"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { LoginPanel } from "@/components/auth/login-panel";
import { ExplainFigure } from "@/lib/content/explain-figures";
import { SUBTESTS } from "@/lib/subtests";
import {
  listAll,
  resolveReports,
  saveQuestion,
  setStatus,
  type MutateResult,
  type ReviewError,
  type ListResult,
} from "./actions";
import {
  isProvfraga,
  PRACTICE_GROUP_ID,
  type ReviewExamGroup,
  type ReviewQuestion,
} from "./types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Utkast",
  published: "Publicerad",
  rejected: "Avvisad",
};

type Phase = "boot" | "signin" | "forbidden" | "notconfigured" | "error" | "ready";

type View = "drafts" | "published" | "all";

const VIEW_OPTIONS: { id: View; label: string }[] = [
  { id: "drafts", label: "Att granska" },
  { id: "published", label: "Publicerade (historik)" },
  { id: "all", label: "Alla" },
];

/**
 * Får frågan publiceras med "Publicera alla"? Bara övningsfrågor där andra
 * kontrollen var ense och som inte har öppna felrapporter – resten granskas en
 * och en.
 */
function canBulkPublish(q: ReviewQuestion): boolean {
  return (
    q.status === "draft" &&
    !isProvfraga(q) &&
    q.verification === "agreed" &&
    q.openReports.length === 0 &&
    parseFlags(q.explain).flags.length === 0
  );
}

/** Rapportens datum i svensk tid, t.ex. "2026-10-22". */
function reportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

/** "1 fråga" / "3 frågor". */
function questionCount(n: number): string {
  return n === 1 ? "1 fråga" : `${n} frågor`;
}

/** "1 publicerad" / "3 publicerade" – samma mönster för avvisad och flaggad. */
function countWithAdjective(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Hur många frågor per delgrupp som visas innan "Visa fler". */
const PAGE = 25;

function errorText(error: ReviewError): string {
  if (error === "PROVFRAGA_LOCKED") {
    return "Provfrågor är upphovsrättsskyddade och kan aldrig publiceras.";
  }
  return "Åtgärden misslyckades. Försök igen.";
}

// ---- Importflaggor ---------------------------------------------------------

/**
 * Konvention: importskriptet lägger sina självflaggor som en prefix-rad i
 * `explain`: "FLAGGOR: a, b". Här plockas de ut så att de kan visas som
 * varningsbadges, och resten av förklaringen redigeras separat.
 */
function parseFlags(explain: string): { flags: string[]; body: string } {
  const lines = (explain ?? "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^FLAGGOR\s*:\s*(.*)$/i);
    if (m) {
      const flags = (m[1] ?? "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { flags, body: lines.slice(i + 1).join("\n") };
    }
  }
  return { flags: [], body: explain ?? "" };
}

function buildExplain(flags: string[], body: string): string {
  const trimmed = body.replace(/^\n+/, "");
  if (flags.length === 0) return trimmed;
  return `FLAGGOR: ${flags.join(", ")}\n${trimmed}`;
}

// ---- Småhjälpare -----------------------------------------------------------

function Figure({ q }: { q: ReviewQuestion }) {
  // Signerade länkar går ut efter några timmar; då visas en hint i stället.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (q.figureUnavailable || (q.figureUrl && failedUrl === q.figureUrl)) {
    return (
      <p className="my-3 text-sm text-[var(--destructive)]">
        Figuren kunde inte visas. Tryck på Uppdatera och försök igen.
      </p>
    );
  }
  if (!q.figureUrl) return null;
  const alt = q.questionNumber != null ? `Figur till fråga ${q.questionNumber}` : "Figur till fråga";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={q.figureUrl}
      alt={alt}
      loading="lazy"
      onError={() => setFailedUrl(q.figureUrl)}
      className="my-3 max-h-96 w-auto max-w-full rounded-lg border border-[var(--line)] bg-card object-contain"
    />
  );
}

function statusBadgeClass(status: string): string {
  if (status === "published") return "border-[var(--lagoon-ink)]/50 bg-[var(--accent-soft)] text-[var(--brand)]";
  if (status === "rejected") return "border-[var(--destructive)]/30 bg-[var(--coral-soft)] text-[var(--destructive)]";
  return "border-[var(--line)] bg-card/70 text-[var(--ink-muted)]";
}

function kindLabel(kind: string): string {
  return SUBTESTS.find((s) => s.kind === kind)?.short ?? (kind ? kind.toUpperCase() : "?");
}

// ---- Huvudskärm ------------------------------------------------------------

export function ReviewScreen() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<ReviewExamGroup[] | null>(null);
  const [loadError, setLoadError] = useState<ReviewError | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>("drafts");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const supabaseConfigured = isSupabaseConfigured();

  // Hämtar och returnerar resultatet utan att röra React-state (anropas i
  // effektens .then — samma mönster som useQuestions).
  const fetchAll = useCallback(async (): Promise<ListResult> => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: "NOT_CONFIGURED" };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    return listAll(token);
  }, []);

  const applyResult = useCallback((res: ListResult) => {
    if (res.ok) {
      setGroups(res.groups);
      setLoadError(null);
    } else {
      setGroups(null);
      setLoadError(res.error);
    }
  }, []);

  async function refresh() {
    applyResult(await fetchAll());
  }

  useEffect(() => {
    if (authLoading || !supabaseConfigured || !user) return;
    let cancelled = false;
    void fetchAll().then((res) => {
      if (!cancelled) applyResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user, fetchAll, applyResult]);

  function toggleExam(examId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  }

  async function runMutation(
    fn: () => Promise<MutateResult>,
    successText: string,
  ): Promise<void> {
    const res = await fn();
    if (res.ok) {
      setLoadError(null);
      setNotice({ kind: "ok", text: successText });
      await refresh();
    } else if (res.error === "NOT_AUTHORIZED" || res.error === "NOT_AUTHENTICATED") {
      setLoadError(res.error);
    } else {
      setNotice({ kind: "err", text: errorText(res.error) });
    }
  }

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const counts = useMemo(() => {
    const qs = (groups ?? []).flatMap((g) => g.questions);
    return {
      draft: qs.filter((q) => q.status === "draft").length,
      rejected: qs.filter((q) => q.status === "rejected").length,
      published: qs.filter((q) => q.status === "published").length,
      reportedPublished: qs.filter((q) => q.status === "published" && q.openReports.length > 0)
        .length,
    };
  }, [groups]);

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    const matches = (q: ReviewQuestion): boolean =>
      view === "published"
        ? q.status === "published"
        : view === "drafts"
          ? q.status === "draft" ||
            q.status === "rejected" ||
            q.openReports.length > 0 ||
            q.verification === "disagreed"
          : true;
    return groups
      .map((g) => ({ ...g, questions: g.questions.filter(matches) }))
      .filter((g) => g.questions.length > 0);
  }, [groups, view]);

  // Fas härleds vid render — ingen setState i effekten (lint-säkert).
  let phase: Phase;
  if (authLoading) phase = "boot";
  else if (!supabaseConfigured) phase = "notconfigured";
  else if (!user) phase = "signin";
  else if (loadError === "NOT_AUTHORIZED") phase = "forbidden";
  else if (loadError === "NOT_CONFIGURED") phase = "notconfigured";
  else if (loadError === "NOT_AUTHENTICATED") phase = "signin";
  else if (loadError !== null) phase = "error";
  else if (groups === null) phase = "boot";
  else phase = "ready";

  const forbiddenEmail = loadError === "NOT_AUTHORIZED" ? (user?.email ?? null) : null;

  if (phase === "boot") {
    return (
      <div className="py-16 text-center text-[var(--ink-muted)]">Laddar…</div>
    );
  }

  if (phase === "notconfigured") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl text-[var(--ink)]">
          Granska utkast
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Review inte konfigurerat. Servern saknar de miljövariabler som krävs
          (servernyckel och godkända granskar-e-postadresser) — kontakta den
          som driver appen.
        </p>
      </div>
    );
  }

  if (phase === "signin") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl text-[var(--ink)]">
          Granska utkast
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          Du måste logga in för att granska utkast.
        </p>
        <div className="mt-6">
          <LoginPanel />
        </div>
      </div>
    );
  }

  if (phase === "forbidden") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl text-[var(--ink)]">
          Ingen behörighet
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">
          {forbiddenEmail ? (
            <>
              Kontot <span className="font-medium text-[var(--ink)]">{forbiddenEmail}</span> har
              inte behörighet att granska utkast.
            </>
          ) : (
            "Ditt konto har inte behörighet att granska utkast."
          )}
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] font-semibold text-3xl text-[var(--ink)]">
          Granska utkast
        </h1>
        <p className="mt-4 text-[var(--ink-muted)]">Kunde inte läsa utkast just nu. Försök igen.</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-6 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (groups === null) {
    return <div className="py-16 text-center text-[var(--ink-muted)]">Laddar…</div>;
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            Granska frågor
          </h1>
          <p className="mt-2 text-[var(--ink-muted)]">
            {visibleGroups.length > 0
              ? `${visibleGroups.length === 1 ? "1 grupp" : `${visibleGroups.length} grupper`} · ${
                  view === "published"
                    ? countWithAdjective(counts.published, "publicerad", "publicerade")
                    : view === "drafts"
                      ? `${counts.draft} utkast · ${countWithAdjective(counts.rejected, "avvisad", "avvisade")}${
                          counts.reportedPublished > 0
                            ? ` · ${countWithAdjective(counts.reportedPublished, "publicerad", "publicerade")} med felrapporter`
                            : ""
                        }`
                      : `${counts.draft} utkast · ${countWithAdjective(counts.rejected, "avvisad", "avvisade")} · ${countWithAdjective(counts.published, "publicerad", "publicerade")}`
                }`
              : "Inga frågor att visa."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
        >
          Uppdatera
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setView(opt.id)}
            aria-pressed={view === opt.id}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              view === opt.id
                ? "border-[var(--brand)] bg-[var(--brand)] text-primary-foreground"
                : "border-[var(--line-strong)] bg-card/70 text-[var(--ink)] hover:bg-[var(--accent-soft)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {notice ? (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            notice.kind === "ok"
              ? "border-[var(--lagoon-ink)]/40 bg-[var(--accent-soft)] text-[var(--brand)]"
              : "border-[var(--destructive)]/30 bg-[var(--coral-soft)] text-[var(--destructive)]"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {visibleGroups.length === 0 ? (
        <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-10 text-center text-[var(--ink-muted)]">
          Inga frågor att visa i den här vyn.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <ExamGroup
              key={group.examId}
              group={group}
              view={view}
              expanded={expanded.has(group.examId)}
              onToggle={() => toggleExam(group.examId)}
              onStatusChange={runMutation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Provgrupp -------------------------------------------------------------

function ExamGroup({
  group,
  view,
  expanded,
  onToggle,
  onStatusChange,
}: {
  group: ReviewExamGroup;
  view: View;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (fn: () => Promise<MutateResult>, successText: string) => Promise<void>;
}) {
  const draftCount = group.questions.filter((q) => q.status === "draft").length;
  const rejectedCount = group.questions.filter((q) => q.status === "rejected").length;
  const publishedCount = group.questions.filter((q) => q.status === "published").length;
  const flaggedCount = group.questions.filter((q) => parseFlags(q.explain).flags.length > 0).length;
  const reportedCount = group.questions.filter((q) => q.openReports.length > 0).length;
  const isPractice = group.examId === PRACTICE_GROUP_ID;
  const bulkIds = group.questions.filter(canBulkPublish).map((q) => q.id);
  const manualCount = group.questions.filter(
    (q) => q.status !== "published" && !canBulkPublish(q),
  ).length;

  // Övningsfrågor delas upp per delprov (för stickprov per delprov), förlagor per provpass.
  const subGroups = useMemo(() => {
    const byKey = new Map<string, ReviewQuestion[]>();
    for (const q of group.questions) {
      const key = isPractice ? q.kind : q.passNumber != null ? String(q.passNumber) : "__none__";
      const arr = byKey.get(key) ?? [];
      arr.push(q);
      byKey.set(key, arr);
    }
    const order = (key: string) => {
      const i = SUBTESTS.findIndex((s) => s.kind === key);
      return i >= 0 ? i : SUBTESTS.length;
    };
    return [...byKey.entries()]
      .map(([key, qs]) => ({
        key,
        label: isPractice ? kindLabel(key) : key === "__none__" ? "Okänt pass" : `Pass ${key}`,
        questions: qs,
      }))
      .sort((a, b) => (isPractice ? order(a.key) - order(b.key) : 0));
  }, [group.questions, isPractice]);
  const [shown, setShown] = useState<Record<string, number>>({});

  async function bulk(status: "published" | "rejected") {
    const ids =
      status === "published"
        ? bulkIds
        : group.questions.filter((q) => q.status !== "published").map((q) => q.id);
    if (ids.length === 0) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    await onStatusChange(
      () => setStatus({ accessToken: token, ids, status }),
      status === "published"
        ? `${questionCount(ids.length)} ${ids.length === 1 ? "publicerad" : "publicerade"}.`
        : "Alla frågor avvisade.",
    );
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-card/70">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <span className="text-sm text-[var(--ink-muted)]">{expanded ? "▾" : "▸"}</span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--ink)]">{group.title}</span>
            <span className="block text-xs text-[var(--ink-muted)]">
              {group.examDate ?? "Inget datum"}
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-[var(--line)] bg-card/70 px-2 py-0.5 text-xs text-[var(--ink-muted)]">
            {draftCount} utkast
          </span>
          {rejectedCount > 0 ? (
            <span className="rounded-md border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-2 py-0.5 text-xs text-[var(--destructive)]">
              {countWithAdjective(rejectedCount, "avvisad", "avvisade")}
            </span>
          ) : null}
          {publishedCount > 0 ? (
            <span className="rounded-md border border-[var(--lagoon-ink)]/50 bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--brand)]">
              {countWithAdjective(publishedCount, "publicerad", "publicerade")}
            </span>
          ) : null}
          {flaggedCount > 0 ? (
            <span className="rounded-md border border-[var(--energy-ink)]/30 bg-[var(--energy-soft)] px-2 py-0.5 text-xs text-[var(--energy-ink)]">
              {countWithAdjective(flaggedCount, "flaggad", "flaggade")}
            </span>
          ) : null}
          {reportedCount > 0 ? (
            <span className="rounded-md border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-2 py-0.5 text-xs text-[var(--destructive)]">
              {reportedCount} med felrapporter
            </span>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[var(--line)] px-4 py-4 sm:px-5">
          {!isPractice ? (
            <p className="mb-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink-muted)]">
              Förlagor ur UHR:s prov. De är upphovsrättsskyddade och kan aldrig publiceras – använd
              dem bara som mönster när ni skriver egna övningsfrågor.
            </p>
          ) : null}
          {view !== "published" ? (
            <div className="mb-4 space-y-2">
              {isPractice ? (
                <p className="text-sm text-[var(--ink-muted)]">
                  Läs ett stickprov innan du publicerar. &quot;Publicera&quot; tar bara med frågor där
                  andra kontrollen var ense och som saknar felrapporter och varningar
                  {manualCount > 0 ? ` – ${questionCount(manualCount)} måste granskas en och en` : ""}.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {isPractice ? (
                  <button
                    type="button"
                    onClick={() => void bulk("published")}
                    disabled={bulkIds.length === 0}
                    className="rounded-lg bg-[var(--lagoon-ink)] px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    Publicera {bulkIds.length} ense
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void bulk("rejected")}
                  className="rounded-lg border border-[var(--destructive)]/40 bg-card px-3 py-1.5 text-xs font-medium text-[var(--destructive)] transition hover:bg-[var(--coral-soft)]"
                >
                  Avvisa alla
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-5">
            {subGroups.map((sg) => {
              const limit = shown[sg.key] ?? PAGE;
              const rest = sg.questions.length - limit;
              return (
                <div key={sg.key}>
                  <h3 className="mb-2 text-xs font-medium text-[var(--ink-muted)]">
                    {sg.label} · {questionCount(sg.questions.length)}
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    {sg.questions.slice(0, limit).map((q) => (
                      <QuestionCard key={q.id} q={q} onStatusChange={onStatusChange} />
                    ))}
                  </div>
                  {rest > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShown((prev) => ({ ...prev, [sg.key]: limit + PAGE }))}
                      className="mt-3 rounded-lg border border-[var(--line-strong)] bg-card px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
                    >
                      Visa {Math.min(PAGE, rest)} till ({rest} kvar)
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---- Frågekort -------------------------------------------------------------

function QuestionCard({
  q,
  onStatusChange,
}: {
  q: ReviewQuestion;
  onStatusChange: (fn: () => Promise<MutateResult>, successText: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const { flags, body } = useMemo(() => parseFlags(q.explain), [q.explain]);

  async function closeReports() {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    await onStatusChange(
      () => resolveReports({ accessToken: token, questionId: q.id }),
      "Rapporterna är markerade som hanterade.",
    );
  }

  async function changeStatus(status: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    await onStatusChange(
      () => setStatus({ accessToken: token, ids: [q.id], status }),
      status === "published"
        ? "Fråga publicerad."
        : status === "rejected"
          ? "Fråga avvisad."
          : "Fråga återställd till utkast.",
    );
  }

  if (editing) {
    return (
      <EditForm
        q={q}
        flags={flags}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
        onStatusChange={onStatusChange}
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
        <span>{kindLabel(q.kind)}</span>
        {q.passNumber != null ? <span>Pass {q.passNumber}</span> : null}
        {q.questionNumber != null ? <span># {q.questionNumber}</span> : null}
        <span className={`rounded-md border px-2 py-0.5 normal-case tracking-normal ${statusBadgeClass(q.status)}`}>
          {STATUS_LABEL[q.status] ?? q.status}
        </span>
        {isProvfraga(q) ? (
          <span className="rounded-md border border-[var(--line)] bg-card/70 px-2 py-0.5 normal-case tracking-normal">
            Förlaga – publiceras aldrig
          </span>
        ) : null}
        {q.verification === "agreed" ? (
          <span className="rounded-md border border-[var(--lagoon-ink)]/50 bg-[var(--accent-soft)] px-2 py-0.5 normal-case tracking-normal text-[var(--brand)]">
            Andra kontrollen: ense
          </span>
        ) : q.verification === "disagreed" ? (
          <span className="rounded-md border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-2 py-0.5 normal-case tracking-normal text-[var(--destructive)]">
            Andra kontrollen: oense
          </span>
        ) : null}
        {flags.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {flags.map((f, i) => (
              <span
                key={i}
                className="rounded-md border border-[var(--energy-ink)]/30 bg-[var(--energy-soft)] px-2 py-0.5 normal-case tracking-normal text-[var(--energy-ink)]"
              >
                {f}
              </span>
            ))}
          </span>
        ) : null}
      </div>

      {q.verification === "disagreed" && q.verificationNote ? (
        <p className="mt-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-3 py-2 text-sm text-[var(--ink)]">
          {q.verificationNote}
        </p>
      ) : null}

      {q.openReports.length > 0 ? (
        <div className="mt-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-3 py-2 text-sm text-[var(--ink)]">
          <p className="font-medium">
            {q.openReports.length === 1
              ? "1 öppen felrapport"
              : `${q.openReports.length} öppna felrapporter från ${q.openReports.length} olika användare`}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {q.openReports.map((r, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {r.reason}{" "}
                <span className="text-xs text-[var(--ink-muted)]">({reportDate(r.createdAt)})</span>
              </li>
            ))}
          </ul>
          {q.status === "published" ? (
            <button
              type="button"
              onClick={() => void closeReports()}
              className="mt-2 rounded-lg border border-[var(--line-strong)] bg-card px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              Markera rapporterna som hanterade
            </button>
          ) : (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Rapporterna stängs när frågan publiceras igen.
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-2 whitespace-pre-wrap font-medium text-[var(--ink)]">{q.prompt}</p>

      <Figure q={q} />

      {q.passage ? (
        <p className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--line)] bg-[var(--fog)]/60 px-3 py-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          {q.passage}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 sm:space-y-2.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          return (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                isCorrect
                  ? "border-[var(--lagoon-ink)]/50 bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-card/70"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isCorrect
                    ? "bg-[var(--lagoon-ink)] text-primary-foreground"
                    : "border border-[var(--line)] text-[var(--ink-muted)]"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 whitespace-pre-wrap text-[var(--ink)]">{opt}</span>
              {isCorrect ? (
                <span className="mt-0.5 shrink-0 text-xs font-medium uppercase text-[var(--lagoon-ink)]">
                  Rätt
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {body.trim() ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--ink-muted)]">
            Förklaring
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
            {body}
          </p>
          <ExplainFigure questionId={q.id} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-[var(--line-strong)] bg-card px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
        >
          Redigera
        </button>
        {q.status !== "published" && !isProvfraga(q) ? (
          <button
            type="button"
            onClick={() => void changeStatus("published")}
            className="rounded-lg bg-[var(--lagoon-ink)] px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
          >
            Godkänn
          </button>
        ) : null}
        {q.status === "published" ? (
          <button
            type="button"
            onClick={() => void changeStatus("rejected")}
            className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:brightness-110"
          >
            Markera som fel
          </button>
        ) : q.status !== "rejected" ? (
          <button
            type="button"
            onClick={() => void changeStatus("rejected")}
            className="rounded-lg border border-[var(--destructive)]/40 bg-card px-3 py-1.5 text-xs font-medium text-[var(--destructive)] transition hover:bg-[var(--coral-soft)]"
          >
            Avvisa
          </button>
        ) : null}
        {q.status !== "draft" ? (
          <button
            type="button"
            onClick={() => void changeStatus("draft")}
            className="rounded-lg border border-[var(--line-strong)] bg-card px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)]"
          >
            Ångra
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ---- Redigeringsformulär ----------------------------------------------------

type EditFormState = {
  prompt: string;
  passage: string;
  options: string[];
  correctIndex: number;
  body: string;
};

function EditForm({
  q,
  flags,
  onCancel,
  onSaved,
  onStatusChange,
}: {
  q: ReviewQuestion;
  flags: string[];
  onCancel: () => void;
  onSaved: () => void;
  onStatusChange: (fn: () => Promise<MutateResult>, successText: string) => Promise<void>;
}) {
  const [form, setForm] = useState<EditFormState>(() => ({
    prompt: q.prompt,
    passage: q.passage ?? "",
    options: q.options.length ? [...q.options] : [""],
    correctIndex: q.correctIndex,
    body: parseFlags(q.explain).body,
  }));
  const [validation, setValidation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setOption(i: number, value: string) {
    setForm((f) => {
      const options = f.options.slice();
      options[i] = value;
      return { ...f, options };
    });
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  }

  function removeOption(i: number) {
    setForm((f) => {
      const options = f.options.filter((_, idx) => idx !== i);
      const correctIndex = f.correctIndex === i ? 0 : f.correctIndex > i ? f.correctIndex - 1 : f.correctIndex;
      return { ...f, options, correctIndex: Math.min(correctIndex, Math.max(options.length - 1, 0)) };
    });
  }

  async function handleSave() {
    const trimmedPrompt = form.prompt.trim();
    if (!trimmedPrompt) {
      setValidation("Skriv en frågetext.");
      return;
    }
    if (form.options.length < 2 || form.options.some((o) => !o.trim())) {
      setValidation("Minst två ifyllda svarsalternativ krävs.");
      return;
    }
    if (form.correctIndex < 0 || form.correctIndex >= form.options.length) {
      setValidation("Välj rätt svarsalternativ.");
      return;
    }

    setValidation(null);
    setSaving(true);
    const supabase = getSupabase();
    if (!supabase) {
      setSaving(false);
      setValidation("Supabase är inte konfigurerat.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    const explain = buildExplain(flags, form.body);

    await onStatusChange(
      () =>
        saveQuestion({
          accessToken: token,
          id: q.id,
          prompt: trimmedPrompt,
          passage: form.passage.trim() ? form.passage : null,
          options: form.options,
          correctIndex: form.correctIndex,
          explain,
        }),
      "Frågan sparad.",
    );
    setSaving(false);
    onSaved();
  }

  return (
    <div className="rounded-xl border border-[var(--brand)]/40 bg-card px-4 py-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--brand)]">
          Redigerar · {kindLabel(q.kind)}
          {q.questionNumber != null ? ` #${q.questionNumber}` : ""}
        </span>
        <span className="text-xs text-[var(--ink-muted)]">Flaggor bevaras vid sparning</span>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Frågetext
        </span>
        <textarea
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--lagoon-ink)] focus:outline-none"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Text/passage (valfri)
        </span>
        <textarea
          value={form.passage}
          onChange={(e) => setForm({ ...form, passage: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--lagoon-ink)] focus:outline-none"
        />
      </label>

      <div className="mt-3">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Svarsalternativ
        </span>
        <div className="mt-1 space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  i === form.correctIndex
                    ? "bg-[var(--lagoon-ink)] text-primary-foreground"
                    : "border border-[var(--line)] text-[var(--ink-muted)]"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-card px-3 py-1.5 text-sm text-[var(--ink)] focus:border-[var(--lagoon-ink)] focus:outline-none"
                placeholder={`Alternativ ${String.fromCharCode(65 + i)}`}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                disabled={form.options.length <= 2}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-[var(--destructive)] transition hover:bg-[var(--coral-soft)] disabled:opacity-40"
                aria-label={`Ta bort alternativ ${String.fromCharCode(65 + i)}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 rounded-lg border border-dashed border-[var(--line-strong)] px-3 py-1.5 text-xs font-medium text-[var(--ink-muted)] transition hover:bg-[var(--accent-soft)]"
        >
          + Lägg till alternativ
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Rätt svar
        </span>
        <select
          value={form.correctIndex}
          onChange={(e) => setForm({ ...form, correctIndex: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--lagoon-ink)] focus:outline-none"
        >
          {form.options.map((opt, i) => (
            <option key={i} value={i}>
              {String.fromCharCode(65 + i)} — {opt.slice(0, 60) || "(tom)"}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--ink-muted)]">
          Förklaring
        </span>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--lagoon-ink)] focus:outline-none"
        />
      </label>

      {validation ? (
        <p className="mt-2 text-sm text-[var(--destructive)]">{validation}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[var(--line-strong)] bg-card px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-soft)] disabled:opacity-50"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

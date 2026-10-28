"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useStudiehjalpAccess } from "@/lib/studiehjalp/access";
import {
  decideApplication,
  fetchApplicationAdmin,
  fetchAudit,
  fetchFlags,
  fetchQueue,
  fetchStaff,
  grantRole,
  openDocumentUrl,
  purgeDocuments,
  revokeRole,
  setFlag,
} from "@/lib/studiehjalp/api";
import {
  CHECK_LABEL,
  DECISION_LABEL,
  DOCUMENT_LABEL,
  FLAG_MODE_LABEL,
  HP_THRESHOLD,
  ROLE_LABEL,
  STATUS_LABEL,
  TRACK_LABEL,
  formatDate,
  formatHp,
  type AdminApplication,
  type AuditEntry,
  type CheckType,
  type Decision,
  type FlagMode,
  type QueueRow,
  type StaffMember,
  type StaffRole,
} from "@/lib/studiehjalp/types";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/utils";
import { Spinner } from "./gate";
import { buttonClass, Field, inputClass, Notice, PageHeader, Panel, PanelTitle } from "./ui";

type Tab = "applications" | "roles" | "flags" | "log";

export function StudiehjalpAdmin() {
  const { user, loading } = useAuth();
  const access = useStudiehjalpAccess();
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "applications", label: "Ansökningar", show: access.hasRole("verify_expert") },
    { id: "roles", label: "Roller", show: access.hasRole("admin") },
    { id: "flags", label: "Flaggor", show: access.hasRole("admin") },
    { id: "log", label: "Logg", show: access.hasRole("admin") },
  ];
  const visible = tabs.filter((t) => t.show);
  const [tab, setTab] = useState<Tab | null>(null);
  const active = tab && visible.some((t) => t.id === tab) ? tab : (visible[0]?.id ?? null);

  if (loading || access.loading) return <Spinner />;
  if (!user || visible.length === 0) {
    return <Notice>Den här sidan är bara för HP Lifts granskare och administratörer.</Notice>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studiehjälp – admin"
        back={{ href: "/studiehjalp", label: "Studiehjälp" }}
        intro="Varje beslut, rolländring, flaggändring och dokumentvisning sparas i loggen."
      />
      <div role="tablist" aria-label="Adminvyer" className="flex flex-wrap gap-1 border-b border-[var(--line)]">
        {visible.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === t.id
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active === "applications" ? <Applications canOpenDocuments={access.hasRole("view_sensitive_document")} /> : null}
      {active === "roles" ? <Roles /> : null}
      {active === "flags" ? <Flags onChanged={access.refresh} /> : null}
      {active === "log" ? <Log /> : null}
    </div>
  );
}

// ------------------------------------------------------------------ Ansökningar

const STATUS_FILTERS = ["submitted", "needs_completion", "approved", "rejected", "blocked", "all"] as const;

function Applications({ canOpenDocuments }: { canOpenDocuments: boolean }) {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("submitted");
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purged, setPurged] = useState<number | null>(null);

  const load = useCallback(async (s: string) => {
    const res = await fetchQueue(s);
    if (res.ok) {
      setRows(res.data ?? []);
      setError(null);
    } else {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchQueue(status).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setRows(res.data ?? []);
        setError(null);
      } else {
        setError(res.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Gallra utgångna underlag när kön öppnas (de raderas 30 dagar efter beslut).
  useEffect(() => {
    let cancelled = false;
    void purgeDocuments().then((res) => {
      if (!cancelled && res.ok && res.data > 0) setPurged(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (selected) {
    return (
      <ApplicationDetail
        id={selected}
        canOpenDocuments={canOpenDocuments}
        onBack={() => setSelected(null)}
        onDecided={async () => {
          setSelected(null);
          await load(status);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {purged ? <Notice tone="ok">{purged} utgångna underlag har raderats.</Notice> : null}
      <Field label="Visa" htmlFor="sh-status">
        <select
          id="sh-status"
          value={status}
          onChange={(e) => {
            setRows(null);
            setStatus(e.target.value as (typeof STATUS_FILTERS)[number]);
          }}
          className={`${inputClass} max-w-xs`}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Alla utom utkast" : STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Notice>Inga ansökningar med den statusen.</Notice>
      ) : (
        <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-card">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r.id)}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--mist)]"
              >
                <span>
                  <span className="block text-sm font-medium text-[var(--ink)]">
                    {r.legal_name || r.display_name} · {TRACK_LABEL[r.track]}
                  </span>
                  <span className="block text-xs text-[var(--ink-muted)]">
                    {r.track === "hp"
                      ? `Uppgivet ${formatHp(r.claimed_total)}${r.claimed_test ? `, ${r.claimed_test}` : ""}`
                      : r.teacher_subjects}
                    {" · "}
                    {r.document_count} underlag
                  </span>
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {STATUS_LABEL[r.status]} · {formatDate(r.submitted_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationDetail({
  id,
  canOpenDocuments,
  onBack,
  onDecided,
}: {
  id: string;
  canOpenDocuments: boolean;
  onBack: () => void;
  onDecided: () => Promise<void>;
}) {
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchApplicationAdmin(id).then((res) => {
      if (cancelled) return;
      if (res.ok) setApp(res.data);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function open(documentId: string) {
    // Fönstret öppnas direkt (inom klicket) så att popup-spärrar inte stoppar det;
    // opener nollställs så att dokumentfliken inte kan styra den här sidan.
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    setOpening(documentId);
    const res = await openDocumentUrl(documentId);
    setOpening(null);
    if (!res.ok) {
      win?.close();
      setError(res.error);
      return;
    }
    if (win) win.location.href = res.data;
    else window.location.assign(res.data);
  }

  if (!app) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  return (
    <div className="space-y-5">
      <button type="button" className={buttonClass.ghost} onClick={onBack}>
        ← Tillbaka till listan
      </button>
      {error ? <Notice tone="error">{error}</Notice> : null}

      <Panel>
        <PanelTitle>
          {app.legal_name || app.display_name} · {TRACK_LABEL[app.track]}
        </PanelTitle>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Status" value={STATUS_LABEL[app.status]} />
          <Row label="Användarnamn" value={app.display_name} />
          <Row label="E-post" value={app.email ?? ""} />
          <Row label="Inskickad" value={formatDate(app.submitted_at)} />
          {app.track === "hp" ? (
            <>
              <Row label="Uppgivet resultat" value={formatHp(app.claimed_total)} />
              <Row label="Provtillfälle" value={app.claimed_test} />
            </>
          ) : (
            <Row label="Legitimation och behörigheter" value={app.teacher_subjects} />
          )}
          <Row label="Minst 18 år (intygat)" value={app.adult_confirmed ? "Ja" : "Nej"} />
          <Row label="Samtycke" value={formatDate(app.consent_at)} />
        </dl>
        {app.message ? (
          <p className="mt-3 whitespace-pre-line rounded-lg bg-[var(--mist)] p-3 text-sm text-[var(--ink-soft)]">
            {app.message}
          </p>
        ) : null}
      </Panel>

      <Panel>
        <PanelTitle>Underlag</PanelTitle>
        {!canOpenDocuments ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Du saknar rollen för att öppna känsliga dokument (view_sensitive_document).
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {app.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-[var(--ink-soft)]">
                <span className="font-medium text-[var(--ink)]">{DOCUMENT_LABEL[d.kind]}</span>: {d.file_name}
                {d.deleted_at ? (
                  <span className="text-xs text-[var(--ink-muted)]"> · raderad {formatDate(d.deleted_at)}</span>
                ) : d.delete_after ? (
                  <span className="text-xs text-[var(--ink-muted)]"> · raderas {formatDate(d.delete_after)}</span>
                ) : null}
              </span>
              {canOpenDocuments && !d.deleted_at ? (
                <button type="button" className={buttonClass.ghost} onClick={() => void open(d.id)} disabled={opening !== null}>
                  {opening === d.id ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <ExternalLink size={14} aria-hidden />}
                  Öppna
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Länkarna gäller i fem minuter och varje visning loggas. Spara inte filerna lokalt.
        </p>
      </Panel>

      {app.reviews.length > 0 ? (
        <Panel>
          <PanelTitle>Tidigare beslut</PanelTitle>
          <ul className="mt-3 space-y-3 text-sm">
            {app.reviews.map((r) => (
              <li key={r.created_at} className="rounded-lg bg-[var(--mist)] p-3">
                <p className="font-medium text-[var(--ink)]">
                  {DECISION_LABEL[r.decision]} · {formatDate(r.created_at)} · {r.reviewer_name}
                </p>
                {r.check_type ? <p className="text-[var(--ink-soft)]">{CHECK_LABEL[r.check_type]}</p> : null}
                {r.verified_total !== null ? (
                  <p className="text-[var(--ink-soft)]">
                    Verifierat {formatHp(r.verified_total)} {r.verified_test}
                  </p>
                ) : null}
                {r.verified_subjects ? <p className="text-[var(--ink-soft)]">Behörighet: {r.verified_subjects}</p> : null}
                {r.source_ref ? <p className="text-[var(--ink-soft)]">Källa: {r.source_ref}</p> : null}
                <p className="text-[var(--ink-soft)]">Identitet kontrollerad: {r.identity_checked ? "ja" : "nej"}</p>
                <p className="mt-1 text-[var(--ink-muted)]">{r.reason}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {app.is_own ? (
        <Notice tone="warn">Du kan inte granska din egen ansökan. Be en annan granskare.</Notice>
      ) : app.status === "submitted" || app.status === "approved" ? (
        <DecisionForm app={app} onDecided={onDecided} />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
      <dd className="text-[var(--ink)]">{value || "–"}</dd>
    </div>
  );
}

function DecisionForm({ app, onDecided }: { app: AdminApplication; onDecided: () => Promise<void> }) {
  const options: Decision[] =
    app.status === "approved" ? ["rejected", "blocked"] : ["approved", "needs_completion", "rejected", "blocked"];
  const [decision, setDecision] = useState<Decision>(options[0]);
  const [checkType, setCheckType] = useState<CheckType>(app.track === "hp" ? "document" : "official_register");
  const [total, setTotal] = useState(app.claimed_total !== null ? formatHp(app.claimed_total) : "");
  const [test, setTest] = useState(app.claimed_test);
  const [subjects, setSubjects] = useState(app.teacher_subjects);
  const [source, setSource] = useState("");
  const [identity, setIdentity] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approving = decision === "approved";
  const parsedTotal = Number(total.replace(",", "."));

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await decideApplication({
      id: app.id,
      decision,
      checkType: approving ? checkType : null,
      verifiedTotal: approving && app.track === "hp" && total.trim() ? parsedTotal : null,
      verifiedTest: test,
      verifiedSubjects: subjects,
      identityChecked: approving && identity,
      sourceRef: source,
      reason,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await onDecided();
  }

  return (
    <Panel>
      <PanelTitle>Beslut</PanelTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Beslut" htmlFor="sh-decision">
          <select id="sh-decision" value={decision} onChange={(e) => setDecision(e.target.value as Decision)} className={inputClass}>
            {options.map((d) => (
              <option key={d} value={d}>
                {DECISION_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        {approving && app.track === "hp" ? (
          <Field label="Hur kontrollerades resultatet?" htmlFor="sh-check">
            <select id="sh-check" value={checkType} onChange={(e) => setCheckType(e.target.value as CheckType)} className={inputClass}>
              <option value="document">{CHECK_LABEL.document}</option>
              <option value="live_portal">{CHECK_LABEL.live_portal}</option>
            </select>
          </Field>
        ) : null}
        {approving && app.track === "teacher" ? (
          <Notice className="sm:col-span-1">
            Godkännande kräver att legitimationen har kontrollerats i Skolverkets lärarregister.
          </Notice>
        ) : null}
        {approving && app.track === "hp" ? (
          <>
            <Field
              label="Verifierat totalresultat"
              htmlFor="sh-vtotal"
              hint={Number.isFinite(parsedTotal) && parsedTotal < HP_THRESHOLD ? "Under 1,20 – kan inte godkännas." : undefined}
            >
              <input id="sh-vtotal" value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" className={inputClass} />
            </Field>
            <Field label="Provtillfälle" htmlFor="sh-vtest">
              <input id="sh-vtest" value={test} onChange={(e) => setTest(e.target.value)} maxLength={60} className={inputClass} />
            </Field>
          </>
        ) : null}
        {approving && app.track === "teacher" ? (
          <>
            <Field label="Verifierad behörighet" htmlFor="sh-vsubjects">
              <input id="sh-vsubjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} maxLength={300} className={inputClass} />
            </Field>
            <Field label="Källa" htmlFor="sh-source" hint="t.ex. ”Registerutdrag Skolverket 2026-10-28, ärende …”">
              <input id="sh-source" value={source} onChange={(e) => setSource(e.target.value)} maxLength={200} className={inputClass} />
            </Field>
          </>
        ) : null}
      </div>
      {approving ? (
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          För att godkänna måste du själv ha öppnat det obligatoriska underlaget och ID-handlingen ovan.
        </p>
      ) : null}
      {approving ? (
        <label className="mt-4 flex items-start gap-2.5 text-sm text-[var(--ink)]">
          <input type="checkbox" checked={identity} onChange={(e) => setIdentity(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
          Jag har kontrollerat att namnet på ID-handlingen stämmer med underlaget och att personen är minst 18 år.
        </label>
      ) : null}
      <div className="mt-4">
        <Field
          label="Motivering"
          htmlFor="sh-reason"
          hint={decision === "needs_completion" ? "Sökanden ser motiveringen – skriv vad som saknas." : "Sökanden ser motiveringen vid avslag."}
        >
          <textarea id="sh-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} rows={3} className={inputClass} />
        </Field>
      </div>
      {error ? (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      ) : null}
      <button type="button" className={`${buttonClass.primary} mt-4`} onClick={() => void submit()} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
        Spara beslut
      </button>
    </Panel>
  );
}

// ------------------------------------------------------------------ Roller

const ROLES = Object.keys(ROLE_LABEL) as StaffRole[];

function Roles() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("verify_expert");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchStaff();
    if (res.ok) setStaff(res.data ?? []);
    else setError(res.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchStaff().then((res) => {
      if (cancelled) return;
      if (res.ok) setStaff(res.data ?? []);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function grant() {
    setBusy(true);
    setError(null);
    const res = await grantRole(email.trim(), role);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEmail("");
    await load();
  }

  async function revoke(userId: string, r: StaffRole) {
    setError(null);
    const res = await revokeRole(userId, r);
    if (!res.ok) setError(res.error);
    await load();
  }

  return (
    <div className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Panel>
        <PanelTitle>Ge en roll</PanelTitle>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Personen behöver ett HP Lift-konto med e-postadressen.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_16rem_auto] sm:items-end">
          <Field label="E-post" htmlFor="sh-role-email">
            <input id="sh-role-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Roll" htmlFor="sh-role">
            <select id="sh-role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <button type="button" className={buttonClass.primary} onClick={() => void grant()} disabled={busy || !email.trim()}>
            Ge roll
          </button>
        </div>
      </Panel>
      {staff === null ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-card">
          {staff.map((s) => (
            <li key={s.user_id} className="px-4 py-3">
              <p className="text-sm font-medium text-[var(--ink)]">
                {s.display_name} <span className="font-normal text-[var(--ink-muted)]">{s.email}</span>
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {s.roles.map((r) => (
                  <li key={r} className="inline-flex items-center gap-1 rounded-full bg-[var(--mist)] py-0.5 pl-2.5 pr-1 text-xs text-[var(--ink-soft)]">
                    {ROLE_LABEL[r] ?? r}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-[var(--ink-muted)] hover:bg-[var(--coral-soft)] hover:text-[var(--coral-ink)]"
                      onClick={() => void revoke(s.user_id, r)}
                      aria-label={`Ta bort rollen ${ROLE_LABEL[r] ?? r} från ${s.email}`}
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Flaggor

function Flags({ onChanged }: { onChanged: () => Promise<void> }) {
  const [flags, setFlags] = useState<{ key: string; mode: FlagMode; note: string; updated_at: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchFlags().then((res) => {
      if (cancelled) return;
      if (res.ok) setFlags(res.data ?? []);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function change(key: string, mode: FlagMode) {
    setError(null);
    const res = await setFlag(key, mode);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const next = await fetchFlags();
    if (next.ok) setFlags(next.data ?? []);
    await onChanged();
  }

  return (
    <div className="space-y-4">
      <Notice tone="warn">
        Slå inte på expertansökan för alla förrän integritetspolicy och villkor finns. ”Bara teamet” betyder
        personer som har en roll här i adminvyn.
      </Notice>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {flags === null ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-card">
          {flags.map((f) => (
            <li key={f.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block font-mono text-sm text-[var(--ink)]">{f.key}</span>
                <span className="block text-xs text-[var(--ink-muted)]">{f.note}</span>
              </span>
              <select
                value={f.mode}
                onChange={(e) => void change(f.key, e.target.value as FlagMode)}
                className={`${inputClass} w-40`}
                aria-label={`Läge för ${f.key}`}
              >
                {(Object.keys(FLAG_MODE_LABEL) as FlagMode[]).map((m) => (
                  <option key={m} value={m}>
                    {FLAG_MODE_LABEL[m]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Logg

const ACTION_LABEL: Record<string, string> = {
  expert_decision: "Beslut om expertansökan",
  document_viewed: "Dokument öppnat",
  documents_purged: "Underlag gallrade",
  role_granted: "Roll given",
  role_revoked: "Roll borttagen",
  flag_changed: "Flagga ändrad",
};

function Log() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAudit(200).then((res) => {
      if (cancelled) return;
      if (res.ok) setEntries(res.data ?? []);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (entries === null) return <Spinner />;
  if (entries.length === 0) return <Notice>Loggen är tom.</Notice>;

  return (
    <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-card">
      {entries.map((e) => (
        <li key={e.id} className="px-4 py-2.5 text-sm">
          <p className="text-[var(--ink)]">
            <span className="font-medium">{ACTION_LABEL[e.action] ?? e.action}</span>{" "}
            <span className="text-[var(--ink-muted)]">
              · {e.actor_name} · {new Date(e.created_at).toLocaleString("sv-SE")}
            </span>
          </p>
          <p className="truncate font-mono text-xs text-[var(--ink-muted)]">
            {e.target_type}
            {e.target_id ? ` ${e.target_id}` : ""} {JSON.stringify(e.details)}
          </p>
        </li>
      ))}
    </ul>
  );
}

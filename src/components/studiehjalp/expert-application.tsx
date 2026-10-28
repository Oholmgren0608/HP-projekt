"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, GraduationCap, Loader2, Trash2, Trophy, Upload } from "lucide-react";
import {
  deleteDocument,
  fetchMyApplications,
  saveApplication,
  startApplication,
  submitApplication,
  uploadDocument,
  withdrawApplication,
} from "@/lib/studiehjalp/api";
import {
  DOCUMENT_LABEL,
  DOCUMENT_MIME_TYPES,
  STATUS_LABEL,
  TRACK_LABEL,
  formatDate,
  formatHp,
  type DocumentKind,
  type ExpertTrack,
  type MyApplication,
} from "@/lib/studiehjalp/types";
import { Spinner, StudiehjalpGate } from "./gate";
import { buttonClass, Field, inputClass, Notice, PageHeader, Panel, PanelTitle } from "./ui";

export function ExpertApplication() {
  return (
    <StudiehjalpGate flag="experts_apply" requireLogin loginNote="Logga in för att ansöka om att bli expert.">
      <ApplicationContent />
    </StudiehjalpGate>
  );
}

const OPEN = new Set(["draft", "submitted", "needs_completion"]);
const WITHDRAWABLE = new Set(["draft", "submitted", "needs_completion", "approved"]);

function ApplicationContent() {
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<ExpertTrack | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchMyApplications();
    if (res.ok) {
      setApps(res.data ?? []);
      setError(null);
    } else {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchMyApplications().then((res) => {
      if (cancelled) return;
      if (res.ok) setApps(res.data ?? []);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function start(track: ExpertTrack) {
    setStarting(track);
    const res = await startApplication(track);
    setStarting(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
  }

  async function withdraw(app: MyApplication) {
    const question =
      app.status === "approved"
        ? "Dra tillbaka godkännandet? Profilen avpubliceras och underlagen raderas."
        : "Dra tillbaka ansökan? Underlagen raderas direkt.";
    if (!window.confirm(question)) return;
    setWithdrawing(app.id);
    const res = await withdrawApplication(app.id);
    setWithdrawing(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
  }

  if (apps === null) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  const blocked = apps.some((a) => a.status === "blocked");
  const open = apps.find((a) => OPEN.has(a.status));
  const approvedTracks = new Set(apps.filter((a) => a.status === "approved").map((a) => a.track));
  const startable = (["hp", "teacher"] as const).filter(
    (t) => !approvedTracks.has(t) && !apps.some((a) => a.track === t && OPEN.has(a.status)),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Bli expert"
        back={{ href: "/studiehjalp", label: "Studiehjälp" }}
        intro="Som expert syns du för elever som söker hjälp med högskoleprovet. Alla experter granskas manuellt av HP Lift innan profilen kan publiceras."
      />

      {error ? <Notice tone="error">{error}</Notice> : null}

      {blocked ? (
        <Notice tone="error">
          Ditt konto kan inte skicka in fler expertansökningar. Kontakta oss via feedbacksidan om du
          tror att det är fel.
        </Notice>
      ) : null}

      {approvedTracks.size > 0 ? (
        <Notice tone="ok">
          Du är godkänd som {[...approvedTracks].map((t) => TRACK_LABEL[t].toLowerCase()).join(" och ")}.{" "}
          <Link href="/studiehjalp/creator-studio" className="font-medium underline">
            Gå till Creator Studio
          </Link>{" "}
          för att fylla i och publicera din profil.
        </Notice>
      ) : null}

      {open ? <ApplicationEditor key={open.id} app={open} onChange={load} /> : null}

      {!open && !blocked && startable.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {startable.includes("hp") ? (
            <TrackCard
              icon={Trophy}
              title="HP-expert"
              busy={starting === "hp"}
              onStart={() => void start("hp")}
              requirements={[
                "Minst 1,20 i totalresultat på högskoleprovet.",
                "Officiellt resultatbesked (PDF) från hogskoleprov.nu.",
                "En ID-handling.",
                "Du är minst 18 år.",
              ]}
            />
          ) : null}
          {startable.includes("teacher") ? (
            <TrackCard
              icon={GraduationCap}
              title="Legitimerad lärare"
              busy={starting === "teacher"}
              onStart={() => void start("teacher")}
              requirements={[
                "Svensk lärarlegitimation.",
                "Legitimationsbevis eller registerutdrag; vi kontrollerar uppgifterna i Skolverkets lärarregister.",
                "En ID-handling.",
                "Du är minst 18 år.",
              ]}
            />
          ) : null}
        </div>
      ) : null}

      {apps.length > 0 ? (
        <Panel>
          <PanelTitle>Dina ansökningar</PanelTitle>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {apps.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium text-[var(--ink)]">{TRACK_LABEL[a.track]}</span>
                <span className="text-[var(--ink-muted)]">
                  {STATUS_LABEL[a.status]}
                  {a.submitted_at ? ` · inskickad ${formatDate(a.submitted_at)}` : ""}
                </span>
                {a.last_decision && (a.status === "rejected" || a.status === "blocked") ? (
                  <p className="w-full text-xs text-[var(--ink-muted)]">Motivering: {a.last_decision.reason}</p>
                ) : null}
                {WITHDRAWABLE.has(a.status) ? (
                  <button
                    type="button"
                    className={buttonClass.danger}
                    onClick={() => void withdraw(a)}
                    disabled={withdrawing !== null}
                  >
                    {withdrawing === a.id ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                    Dra tillbaka
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Drar du tillbaka en ansökan återkallar du samtycket: underlagen raderas direkt och en
            publicerad profil tas bort från sökningen.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}

function TrackCard({
  icon: Icon,
  title,
  requirements,
  busy,
  onStart,
}: {
  icon: typeof Trophy;
  title: string;
  requirements: string[];
  busy: boolean;
  onStart: () => void;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--brand)]">
          <Icon size={18} aria-hidden />
        </span>
        <PanelTitle>{title}</PanelTitle>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
        {requirements.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <button type="button" className={`${buttonClass.primary} mt-4`} onClick={onStart} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
        Starta ansökan
      </button>
    </Panel>
  );
}

function parseHp(text: string): number | null {
  const value = Number(text.replace(",", ".").trim());
  return text.trim() === "" || !Number.isFinite(value) ? null : Math.round(value * 100) / 100;
}

function ApplicationEditor({ app, onChange }: { app: MyApplication; onChange: () => Promise<void> }) {
  const editable = app.status === "draft" || app.status === "needs_completion";
  const [legalName, setLegalName] = useState(app.legal_name);
  const [total, setTotal] = useState(app.claimed_total !== null ? formatHp(app.claimed_total) : "");
  const [test, setTest] = useState(app.claimed_test);
  const [subjects, setSubjects] = useState(app.teacher_subjects);
  const [message, setMessage] = useState(app.message);
  const [adult, setAdult] = useState(app.adult_confirmed);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const required: DocumentKind[] = app.track === "hp" ? ["hp_result", "identity"] : ["teacher_license", "identity"];
  const kinds: DocumentKind[] = [...required, "other"];
  const docs = app.documents.filter((d) => !d.deleted);

  async function save(): Promise<boolean> {
    const res = await saveApplication({
      id: app.id,
      legalName,
      claimedTotal: app.track === "hp" ? parseHp(total) : null,
      claimedTest: test,
      teacherSubjects: subjects,
      message,
      adultConfirmed: adult,
    });
    if (!res.ok) setNotice({ tone: "error", text: res.error });
    return res.ok;
  }

  async function handleSave() {
    setBusy("save");
    setNotice(null);
    if (await save()) {
      setNotice({ tone: "ok", text: "Utkastet är sparat." });
      await onChange();
    }
    setBusy(null);
  }

  async function handleSubmit() {
    setBusy("submit");
    setNotice(null);
    if (await save()) {
      const res = await submitApplication(app.id, consent);
      if (res.ok) await onChange();
      else setNotice({ tone: "error", text: res.error });
    }
    setBusy(null);
  }

  if (!editable) {
    return (
      <Panel>
        <PanelTitle>{TRACK_LABEL[app.track]}: inskickad</PanelTitle>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Tack! Ansökan skickades in {formatDate(app.submitted_at)} och granskas manuellt. Du får se
          beslutet här. Om vi behöver något mer ber vi om en komplettering.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <FileText size={14} aria-hidden />
              {DOCUMENT_LABEL[d.kind]}: {d.file_name}
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {app.status === "needs_completion" && app.last_decision ? (
        <Notice tone="warn">
          <span className="font-medium">Komplettering behövs:</span> {app.last_decision.reason}
        </Notice>
      ) : null}

      <Panel>
        <PanelTitle>{TRACK_LABEL[app.track]}: uppgifter</PanelTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Namn som på dina handlingar" htmlFor="sh-name">
            <input
              id="sh-name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              maxLength={120}
              autoComplete="name"
              className={inputClass}
            />
          </Field>
          {app.track === "hp" ? (
            <>
              <Field label="Totalresultat (normerad poäng)" htmlFor="sh-total" hint="Minst 1,20 krävs.">
                <input
                  id="sh-total"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  inputMode="decimal"
                  placeholder="t.ex. 1,45"
                  className={inputClass}
                />
              </Field>
              <Field label="Provtillfälle" htmlFor="sh-test">
                <input
                  id="sh-test"
                  value={test}
                  onChange={(e) => setTest(e.target.value)}
                  maxLength={60}
                  placeholder="t.ex. hösten 2025"
                  className={inputClass}
                />
              </Field>
            </>
          ) : (
            <div className="sm:col-span-2">
              <Field
                label="Legitimation och behörigheter"
                htmlFor="sh-subjects"
                hint="Som de står i lärarregistret, t.ex. ”Matematik åk 7–9, gymnasieskolan”."
              >
                <textarea
                  id="sh-subjects"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  maxLength={300}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
          <div className="sm:col-span-2">
            <Field label="Meddelande till granskaren (valfritt)" htmlFor="sh-message">
              <textarea
                id="sh-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--brand)]"
          />
          Jag är minst 18 år.
        </label>
        <div className="mt-4">
          <button type="button" className={buttonClass.secondary} onClick={() => void handleSave()} disabled={busy !== null}>
            {busy === "save" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
            Spara utkast
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Underlag</PanelTitle>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          PDF, JPEG eller PNG, högst 10 MB per fil. Underlagen sparas i ett privat arkiv som bara
          granskare med särskild behörighet kan öppna, och raderas 30 dagar efter beslutet. Dölj gärna
          de fyra sista siffrorna i personnumret. Vi ber aldrig om ditt lösenord eller din inloggning.
        </p>
        {app.track === "hp" ? (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Resultatbeskedet laddar du ner som PDF på hogskoleprov.nu. Vi kan också be dig visa resultatet
            live i den officiella tjänsten under ett kort videosamtal; då märks profilen ”Verifierat
            HP-resultat”.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Vi kontrollerar legitimationen och behörigheterna i Skolverkets lärarregister. Märket
            ”Legitimerad lärare” visas först när den kontrollen är gjord.
          </p>
        )}
        <ul className="mt-4 space-y-4">
          {kinds.map((kind) => (
            <DocumentSlot
              key={kind}
              applicationId={app.id}
              kind={kind}
              required={required.includes(kind)}
              docs={docs.filter((d) => d.kind === kind)}
              onChange={onChange}
            />
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelTitle>Skicka in</PanelTitle>
        <label className="mt-3 flex items-start gap-2.5 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--brand)]"
          />
          Jag samtycker till att HP Lift behandlar mina uppgifter och underlag för att granska ansökan.
          Underlagen raderas 30 dagar efter beslutet, och jag kan dra tillbaka samtycket genom att radera
          mitt konto.
        </label>
        {notice ? (
          <Notice tone={notice.tone} className="mt-4">
            {notice.text}
          </Notice>
        ) : null}
        <button
          type="button"
          className={`${buttonClass.primary} mt-4`}
          onClick={() => void handleSubmit()}
          disabled={busy !== null || !consent}
        >
          {busy === "submit" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          Skicka in ansökan
        </button>
      </Panel>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} kB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function DocumentSlot({
  applicationId,
  kind,
  required,
  docs,
  onChange,
}: {
  applicationId: string;
  kind: DocumentKind;
  required: boolean;
  docs: MyApplication["documents"];
  onChange: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const res = await uploadDocument({ applicationId, kind, file });
    if (!res.ok) setError(res.error);
    await onChange();
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(id: string) {
    setBusy(true);
    setError(null);
    const res = await deleteDocument(id);
    if (!res.ok) setError(res.error);
    await onChange();
    setBusy(false);
  }

  return (
    <li className="rounded-lg border border-[var(--line)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--ink)]">
          {DOCUMENT_LABEL[kind]}
          <span className="ml-1.5 text-xs font-normal text-[var(--ink-muted)]">{required ? "krävs" : "valfritt"}</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={DOCUMENT_MIME_TYPES.join(",")}
          className="sr-only"
          id={`sh-file-${kind}`}
          onChange={(e) => void handleFile(e.target.files?.[0])}
          disabled={busy}
        />
        <label
          htmlFor={`sh-file-${kind}`}
          className={`${buttonClass.ghost} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Upload size={15} aria-hidden />}
          Ladda upp
        </label>
      </div>
      {docs.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} className="shrink-0 text-[var(--ink-muted)]" aria-hidden />
                <span className="truncate">{d.file_name}</span>
                <span className="shrink-0 text-xs text-[var(--ink-muted)]">{formatBytes(d.size_bytes)}</span>
              </span>
              <button
                type="button"
                className={buttonClass.danger}
                onClick={() => void handleRemove(d.id)}
                disabled={busy}
                aria-label={`Ta bort ${d.file_name}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="mt-2 text-sm text-[var(--coral-ink)]">{error}</p> : null}
    </li>
  );
}

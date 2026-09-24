"use client";

import { useState } from "react";
import { usePlan } from "@/components/plan-context";
import { generatePlan } from "@/lib/plan-generator";
import {
  DELPROV_META,
  clampDelprov,
  clampHoursPerWeek,
  clampNorm,
  clampWeeksUntilExam,
  type ScoreInput,
} from "@/lib/hp-scores";
import type { SectionId } from "@/lib/study-plan";

/** Formuläret håller strängar: tomt fält är ett giltigt läge (inget sparat). */
type Draft = {
  quantNorm: string;
  verbalNorm: string;
  hoursPerWeek: string;
  weeksUntilExam: string;
  delprov: Record<SectionId, string>;
};

const emptyDelprov = (): Record<SectionId, string> =>
  Object.fromEntries(DELPROV_META.map((m) => [m.id, ""])) as Record<SectionId, string>;

function toDraft(scores: ScoreInput | null): Draft {
  if (!scores) {
    return {
      quantNorm: "",
      verbalNorm: "",
      hoursPerWeek: "",
      weeksUntilExam: "",
      delprov: emptyDelprov(),
    };
  }
  return {
    quantNorm: String(scores.quantNorm),
    verbalNorm: String(scores.verbalNorm),
    hoursPerWeek: String(scores.hoursPerWeek),
    weeksUntilExam: String(scores.weeksUntilExam),
    delprov: Object.fromEntries(
      DELPROV_META.map((m) => [m.id, String(scores.delprov[m.id])]),
    ) as Record<SectionId, string>,
  };
}

/** Tomt eller ogiltigt fält → null, så att tomt aldrig tyst blir en nolla. */
function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function ScoreForm() {
  const { scores, updateScores, clearScores, ready } = usePlan();
  const [draft, setDraft] = useState<Draft>(() => toDraft(scores));
  const [missing, setMissing] = useState<ReadonlySet<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Resync the editable draft whenever the persisted scores change (e.g. after
  // async hydration, a reset or a save in another tab). Adjusting state during
  // render is the recommended pattern over a setState-in-effect.
  const [syncedScores, setSyncedScores] = useState(scores);
  if (ready && scores !== syncedScores) {
    setSyncedScores(scores);
    setDraft(toDraft(scores));
    setMissing(new Set());
  }

  /** Tar bort markerade fält i takt med att de fylls i. */
  function clearMissing(key: string) {
    setConfirmClear(false);
    setMissing((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function setDelprov(id: SectionId, value: string) {
    clearMissing(id);
    setDraft((d) => ({ ...d, delprov: { ...d.delprov, [id]: value } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quant = parseNumber(draft.quantNorm);
    const verbal = parseNumber(draft.verbalNorm);
    const hours = parseNumber(draft.hoursPerWeek);
    const weeks = parseNumber(draft.weeksUntilExam);

    const missingKeys = new Set<string>();
    if (quant === null) missingKeys.add("quantNorm");
    if (verbal === null) missingKeys.add("verbalNorm");
    if (hours === null) missingKeys.add("hoursPerWeek");
    if (weeks === null) missingKeys.add("weeksUntilExam");

    const delprov = {} as Record<SectionId, number>;
    for (const m of DELPROV_META) {
      const value = parseNumber(draft.delprov[m.id]);
      if (value === null) {
        missingKeys.add(m.id);
        continue;
      }
      delprov[m.id] = clampDelprov(m.id, value);
    }

    if (
      missingKeys.size > 0 ||
      quant === null ||
      verbal === null ||
      hours === null ||
      weeks === null
    ) {
      setMissing(missingKeys);
      setMessage(
        "Fyll i alla fält — eller kör nivåtestet, då fylls de i åt dig. Inget sparas förrän allt är ifyllt.",
      );
      return;
    }

    const next: ScoreInput = {
      quantNorm: clampNorm(quant),
      verbalNorm: clampNorm(verbal),
      hoursPerWeek: clampHoursPerWeek(hours),
      weeksUntilExam: clampWeeksUntilExam(weeks),
      delprov,
    };
    updateScores(next);
    setMissing(new Set());
    setConfirmClear(false);
    setDraft(toDraft(next));
    const generated = generatePlan(next);
    setMessage(
      `Planen uppdaterad. Fokus: ${generated.focusIds.slice(0, 2).join(" · ")} — se veckoplanen under Plan.`,
    );
  }

  function handleClear() {
    clearScores();
    setDraft(toDraft(null));
    setMissing(new Set());
    setConfirmClear(false);
    setMessage("Sparade resultat raderade. Appen är tillbaka i utgångsläget.");
  }

  const invalidClass = "border-[var(--destructive)] ring-2 ring-[var(--destructive)]/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!scores ? (
        <p className="rounded-lg border border-[var(--line)] bg-card/70 px-4 py-3 text-sm text-[var(--ink-muted)]">
          Inget underlag sparat än. Fyll i dina senaste resultat — eller kör ett
          nivåtest — först då byggs veckoplanen och prognosen.
        </p>
      ) : null}

      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Kvantitativ norm (0–2,0)</span>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={draft.quantNorm}
            aria-invalid={missing.has("quantNorm")}
            onChange={(e) => {
              clearMissing("quantNorm");
              setDraft((d) => ({ ...d, quantNorm: e.target.value }));
            }}
            className={`w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 ${missing.has("quantNorm") ? invalidClass : ""}`}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Verbal norm (0–2,0)</span>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={draft.verbalNorm}
            aria-invalid={missing.has("verbalNorm")}
            onChange={(e) => {
              clearMissing("verbalNorm");
              setDraft((d) => ({ ...d, verbalNorm: e.target.value }));
            }}
            className={`w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 ${missing.has("verbalNorm") ? invalidClass : ""}`}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Timmar / vecka</span>
          <input
            type="number"
            min={3}
            max={40}
            value={draft.hoursPerWeek}
            aria-invalid={missing.has("hoursPerWeek")}
            onChange={(e) => {
              clearMissing("hoursPerWeek");
              setDraft((d) => ({ ...d, hoursPerWeek: e.target.value }));
            }}
            className={`w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 ${missing.has("hoursPerWeek") ? invalidClass : ""}`}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Veckor till prov</span>
          <input
            type="number"
            min={4}
            max={16}
            value={draft.weeksUntilExam}
            aria-invalid={missing.has("weeksUntilExam")}
            onChange={(e) => {
              clearMissing("weeksUntilExam");
              setDraft((d) => ({ ...d, weeksUntilExam: e.target.value }));
            }}
            className={`w-full rounded-lg border border-[var(--line-strong)] bg-card px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 ${missing.has("weeksUntilExam") ? invalidClass : ""}`}
          />
        </label>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Råpoäng per delprov
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Planen rangordnar flaskhalsar automatiskt.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DELPROV_META.map((m) => (
            <label
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2"
            >
              <span className="min-w-0">
                <span className="font-semibold text-[var(--ink)]">{m.id}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">
                  {m.name}
                </span>
              </span>
              <span className="flex items-center gap-1 text-sm text-[var(--ink-muted)]">
                <input
                  type="number"
                  min={0}
                  max={m.total}
                  value={draft.delprov[m.id]}
                  aria-invalid={missing.has(m.id)}
                  onChange={(e) => setDelprov(m.id, e.target.value)}
                  className={`w-16 rounded-md border border-[var(--line-strong)] bg-card px-2 py-1.5 text-center text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2 ${missing.has(m.id) ? invalidClass : ""}`}
                />
                / {m.total}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Skapa ny plan
        </button>
        {confirmClear ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--destructive)] px-4 text-sm font-semibold text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
          >
            Bekräfta: radera sparade resultat
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setConfirmClear(true);
              setMessage(
                "Radera dina sparade resultat? Planen försvinner då — klicka en gång till för att bekräfta.",
              );
            }}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line-strong)] px-4 text-sm text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
          >
            Rensa sparade resultat
          </button>
        )}
        {message ? <p className="text-sm text-[var(--lagoon-ink)]">{message}</p> : null}
      </div>
    </form>
  );
}

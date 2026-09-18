"use client";

import { useState } from "react";
import { usePlan } from "@/components/plan-context";
import { generatePlan } from "@/lib/plan-generator";
import {
  DELPROV_META,
  clampDelprov,
  clampNorm,
  type ScoreInput,
} from "@/lib/hp-scores";

export function ScoreForm() {
  const { scores, updateScores, resetScores, ready } = usePlan();
  const [draft, setDraft] = useState<ScoreInput>(scores);
  const [message, setMessage] = useState<string | null>(null);

  // Resync the editable draft whenever the persisted scores change (e.g. after
  // async hydration or a reset). Adjusting state during render is the
  // recommended pattern over a setState-in-effect.
  const [syncedScores, setSyncedScores] = useState(scores);
  if (ready && scores !== syncedScores) {
    setSyncedScores(scores);
    setDraft(scores);
  }

  function setDelprov(id: (typeof DELPROV_META)[number]["id"], value: string) {
    const n = clampDelprov(id, Number(value));
    setDraft((d) => ({ ...d, delprov: { ...d.delprov, [id]: n } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: ScoreInput = {
      quantNorm: clampNorm(Number(draft.quantNorm)),
      verbalNorm: clampNorm(Number(draft.verbalNorm)),
      hoursPerWeek: Math.round(Math.max(3, Math.min(40, Number(draft.hoursPerWeek) || 10))),
      weeksUntilExam: Math.round(Math.max(4, Math.min(16, Number(draft.weeksUntilExam) || 8))),
      delprov: { ...draft.delprov },
    };
    for (const m of DELPROV_META) {
      next.delprov[m.id] = clampDelprov(m.id, next.delprov[m.id]);
    }
    updateScores(next);
    setDraft(next);
    const generated = generatePlan(next);
    setMessage(
      `Planen uppdaterad. Fokus: ${generated.focusIds.slice(0, 2).join(" · ")} — se veckoplanen under Plan.`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">Kvantitativ norm (0–2,0)</span>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={draft.quantNorm}
            onChange={(e) =>
              setDraft((d) => ({ ...d, quantNorm: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">Verbal norm (0–2,0)</span>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={draft.verbalNorm}
            onChange={(e) =>
              setDraft((d) => ({ ...d, verbalNorm: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">Timmar / vecka</span>
          <input
            type="number"
            min={3}
            max={40}
            value={draft.hoursPerWeek}
            onChange={(e) =>
              setDraft((d) => ({ ...d, hoursPerWeek: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--ink)]">Veckor till prov</span>
          <input
            type="number"
            min={4}
            max={16}
            value={draft.weeksUntilExam}
            onChange={(e) =>
              setDraft((d) => ({ ...d, weeksUntilExam: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
          />
        </label>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Råpoäng per delprov
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Fyll i antal rätt. Planen rangordnar flaskhalsar automatiskt.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DELPROV_META.map((m) => (
            <label
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
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
                  onChange={(e) => setDelprov(m.id, e.target.value)}
                  className="w-16 rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-center text-[var(--ink)] outline-none ring-[var(--brand)] focus:ring-2"
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
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Skapa ny plan
        </button>
        <button
          type="button"
          onClick={() => {
            resetScores();
            setMessage("Återställde till standardvärden.");
          }}
          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-4 text-sm text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
        >
          Återställ
        </button>
        {message ? <p className="text-sm text-[var(--lagoon)]">{message}</p> : null}
      </div>
    </form>
  );
}

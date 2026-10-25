"use client";

import { useState } from "react";
import { useQuestions } from "@/lib/content/use-questions";
import type { PracticeKind } from "@/lib/practice";
import { useHydrated } from "@/lib/use-hydrated";
import {
  DEFAULT_PRACTICE_MODE,
  loadPracticeModeSettings,
  savePracticeModeSettings,
  timeLimitSeconds,
  type PracticeModeSettings,
  type RevealMode,
} from "@/lib/practice-modes";
import { PRACTICE_OPTIONS, type SubTestInfo } from "./practice-hub";
import { FreePracticeSession } from "./free-practice-session";

/** Rättningen kan visas direkt per fråga eller först efter hela passet. */
const REVEAL_OPTIONS: { value: RevealMode; label: string }[] = [
  { value: "immediate", label: "Direkt efter varje fråga" },
  { value: "after", label: "Efter provpasset" },
];

type Props = {
  subtest: PracticeKind;
};

function getSubtestInfo(subtest: PracticeKind): SubTestInfo | null {
  return PRACTICE_OPTIONS.find((s) => s.id === subtest) ?? null;
}

/** Valbart antal frågor — taket får aldrig överstiga delprovsbanken. */
function getQuestionCountRange(subtest: PracticeKind, poolSize: number): { min: number; max: number } {
  const info = getSubtestInfo(subtest);
  if (!info) return { min: 1, max: 1 };
  const cap = info.isReading ? 5 : 20;
  const max = Math.max(1, Math.min(cap, poolSize));
  return { min: Math.min(info.isReading ? 1 : 5, max), max };
}

export function PracticeSubtestSelector({ subtest }: Props) {
    const info = getSubtestInfo(subtest);
    const { questions } = useQuestions();
  const poolSize = questions.filter((q) => q.kind === subtest).length;
  const range = getQuestionCountRange(subtest, poolSize);
  const [questionCount, setQuestionCount] = useState(10);
  const effectiveCount = Math.min(Math.max(questionCount, range.min), range.max);
  const [sessionActive, setSessionActive] = useState(false);

  // Inställningarna (tid och rättning) läses efter hydrering och sparas lokalt,
  // precis som antalet frågor i nivåtestet.
  const hydrated = useHydrated();
  const [settings, setSettings] = useState<PracticeModeSettings>(DEFAULT_PRACTICE_MODE);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  if (hydrated && !settingsLoaded) {
    setSettingsLoaded(true);
    setSettings(loadPracticeModeSettings());
  }

  function updateSettings(next: PracticeModeSettings) {
    setSettings(next);
    savePracticeModeSettings(next);
  }

  const limitText =
    settings.timeLimit === "extended"
      ? "80 minuter (förlängd tid)"
      : settings.timeLimit === "normal"
        ? "55 minuter"
        : "ingen tidsgräns";

  if (!info) {
    return (
      <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-6">
        <p className="text-[var(--ink-muted)]">Delprovet hittades inte.</p>
      </div>
    );
  }

  if (sessionActive) {
    return (
      <FreePracticeSession
        subtest={subtest}
        questionCount={effectiveCount}
        timeLimitSeconds={timeLimitSeconds(settings.timeLimit)}
        reveal={settings.reveal}
        onClose={() => setSessionActive(false)}
      />
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-[var(--brand)]">
          Välj antal frågor
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          {info.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">{info.description}</p>
      </div>

      {/* Question Count Selector */}
      <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-6 sm:p-8">
        <div className="space-y-6">
          <div role="group" aria-labelledby="question-count-heading">
            <span
              id="question-count-heading"
              className="block text-sm font-medium text-[var(--ink)] mb-4"
            >
              Hur många frågor vill du öva på?
            </span>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i).map(
                (count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                                        aria-pressed={effectiveCount === count}
                    className={`min-w-12 rounded-lg border px-4 py-2 font-medium transition ${
                                            effectiveCount === count
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
                    }`}
                  >
                    {count}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="text-sm text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">Tip:</span> Börja med färre
              frågor om du är ny på delprovet. Du kan öva hur många gånger du vill och ditt
              resultat sparas för analys.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--ink)]">Tid</p>
              <label className="flex cursor-pointer items-center gap-2.5">
                <span className="text-sm font-medium text-[var(--ink-muted)]">
                  {settings.timeLimit === "off" ? "Av" : "På"}
                </span>
                <input
                  type="checkbox"
                  checked={settings.timeLimit !== "off"}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      timeLimit: e.target.checked ? "normal" : "off",
                    })
                  }
                  aria-label="Tidsgräns för övningen"
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-11 rounded-full bg-[var(--mist)] transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-card after:shadow-soft after:transition peer-checked:bg-[var(--brand)] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand)]"
                />
              </label>
            </div>

            {settings.timeLimit !== "off" ? (
              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={settings.timeLimit === "extended"}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      timeLimit: e.target.checked ? "extended" : "normal",
                    })
                  }
                  className="size-4 accent-[var(--brand)]"
                />
                Förlängd provtid (dyslexi) — 80 minuter
              </label>
            ) : null}

            <div className="mt-4">
              <p className="text-sm font-medium text-[var(--ink)]">Rättning</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REVEAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={settings.reveal === opt.value}
                    onClick={() => updateSettings({ ...settings, reveal: opt.value })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      settings.reveal === opt.value
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--line-strong)] bg-card text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 font-[family-name:var(--font-display)] text-lg tabular-nums text-[var(--ink)]">
              {effectiveCount} {effectiveCount === 1 ? "fråga" : "frågor"} · {limitText}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSessionActive(true)}
            className="inline-flex min-h-12 items-center rounded-lg bg-[var(--brand)] px-6 font-medium text-primary-foreground transition hover:brightness-110"
          >
            Starta övning
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          Om {info.label}
        </h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)] leading-relaxed">
          {info.description} Din progress sparas automatiskt och du kan se detaljerade förklaringar
          på varje svar för att fördjupa din förståelse.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ELF_BANK, LAS_BANK, type PracticeKind } from "@/lib/practice";
import { PRACTICE_OPTIONS, type SubTestInfo } from "./practice-hub";
import { FreePracticeSession } from "./free-practice-session";

type Props = {
  subtest: PracticeKind;
};

function getSubtestInfo(subtest: PracticeKind): SubTestInfo | null {
  return PRACTICE_OPTIONS.find((s) => s.id === subtest) ?? null;
}

/** Antal frågor i respektive läsbank — läsomfånget får aldrig överstiga banken. */
const READING_BANK_SIZE: Partial<Record<PracticeKind, number>> = {
  las: LAS_BANK.length,
  elf: ELF_BANK.length,
};

function getQuestionCountRange(subtest: PracticeKind): { min: number; max: number } {
  const info = getSubtestInfo(subtest);
  if (!info) return { min: 5, max: 20 };
  if (info.isReading) {
    const bankSize = READING_BANK_SIZE[subtest] ?? 5;
    return { min: 1, max: Math.min(5, bankSize) };
  }
  return { min: 5, max: 20 };
}

export function PracticeSubtestSelector({ subtest }: Props) {
  const info = getSubtestInfo(subtest);
  const range = getQuestionCountRange(subtest);
  const [questionCount, setQuestionCount] = useState(Math.min(10, range.max));
  const [sessionActive, setSessionActive] = useState(false);

  if (!info) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-6">
        <p className="text-[var(--ink-muted)]">Delprovet hittades inte.</p>
      </div>
    );
  }

  if (sessionActive) {
    return (
      <FreePracticeSession
        subtest={subtest}
        questionCount={questionCount}
        onClose={() => setSessionActive(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Välj antal frågor
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          {info.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">{info.description}</p>
      </div>

      {/* Question Count Selector */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-6 sm:p-8">
        <div className="space-y-6">
          <div role="group" aria-labelledby="question-count-heading">
            <span
              id="question-count-heading"
              className="block text-sm font-semibold text-[var(--ink)] mb-4"
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
                    aria-pressed={questionCount === count}
                    className={`min-w-12 rounded-lg border px-4 py-2 font-semibold transition ${
                      questionCount === count
                        ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-[var(--ink-soft)]"
                    }`}
                  >
                    {count}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-sm text-[var(--ink-soft)]">
              <span className="font-semibold text-[var(--ink)]">Tip:</span> Börja med färre
              frågor om du är ny på delprovet. Du kan öva hur många gånger du vill och ditt
              resultat sparas för analys.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSessionActive(true)}
            className="inline-flex min-h-12 items-center rounded-lg bg-[var(--brand)] px-6 font-semibold text-white transition hover:brightness-110"
          >
            Starta övning med {questionCount} {questionCount === 1 ? "fråga" : "frågor"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-6">
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

"use client";

import Link from "next/link";
import type { PracticeKind } from "@/lib/practice";
import { SUBTESTS as CATALOG } from "@/lib/subtests";

export type SubTestInfo = {
  id: PracticeKind;
  label: string;
  title: string;
  description: string;
  isReading: boolean; // true for LÄS and ELF only
  icon: string;
};

// Names/labels come from src/lib/subtests.ts (single source of truth), keyed
// by the lowercase practice `kind` (e.g. "xyz" -> "Matematisk problemlösning").
const CATALOG_BY_KIND = CATALOG.reduce<Record<string, (typeof CATALOG)[number]>>(
  (acc, subtest) => {
    acc[subtest.kind] = subtest;
    return acc;
  },
  {},
);

function nameFor(kind: PracticeKind): string {
  return CATALOG_BY_KIND[kind]?.name ?? kind;
}

function shortFor(kind: PracticeKind): string {
  return CATALOG_BY_KIND[kind]?.short ?? kind.toUpperCase();
}

export const PRACTICE_OPTIONS: SubTestInfo[] = [
  {
    id: "ord",
    label: shortFor("ord"),
    title: nameFor("ord"),
    description: "Synonymer och betydelser.",
    isReading: false,
    icon: "📚",
  },
  {
    id: "mek",
    label: shortFor("mek"),
    title: nameFor("mek"),
    description: "Konnektorer och ordval i meningar.",
    isReading: false,
    icon: "✏️",
  },
  {
    id: "las",
    label: shortFor("las"),
    title: nameFor("las"),
    description: "Svenska texter med frågor.",
    isReading: true,
    icon: "📖",
  },
  {
    id: "elf",
    label: shortFor("elf"),
    title: nameFor("elf"),
    description: "Engelska texter med frågor.",
    isReading: true,
    icon: "🌍",
  },
  {
    id: "xyz",
    label: shortFor("xyz"),
    title: nameFor("xyz"),
    description: "Räkning, algebra och geometri.",
    isReading: false,
    icon: "🧮",
  },
  {
    id: "kva",
    label: shortFor("kva"),
    title: nameFor("kva"),
    description: "A, B eller lika stora?",
    isReading: false,
    icon: "🔢",
  },
  {
    id: "nog",
    label: shortFor("nog"),
    title: nameFor("nog"),
    description: "Räcker informationen för att lösa uppgiften?",
    isReading: false,
    icon: "🧩",
  },
  {
    id: "dtk",
    label: shortFor("dtk"),
    title: nameFor("dtk"),
    description: "Diagram, tabeller och kartor.",
    isReading: false,
    icon: "📈",
  },
];

export function PracticeHub() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-[var(--brand)]">
          Övning
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Välj delprov att öva på
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Välj delprov och antal frågor. Resultatet sparas.
        </p>
      </div>

      {/* Sub-tests Grid */}
      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_OPTIONS.map((subtest) => (
          <Link
            key={subtest.id}
            href={`/ova/${subtest.id}`}
            className="group rounded-[10px] border border-[var(--line-strong)] bg-card/70 p-5 transition hover:border-[var(--brand)] hover:bg-[var(--accent-soft)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-[var(--brand)]">
                  {subtest.label}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg text-[var(--ink)] group-hover:text-[var(--brand)]">
                  {subtest.title}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{subtest.description}</p>
            <div className="mt-4 inline-block rounded-md bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
              Börja öva →
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2">
        {/* Flashcards */}
        <Link
          href="/ova/flashcards"
          className="rounded-[10px] border border-[var(--line-strong)] bg-card/70 p-5 transition hover:border-[var(--brand)] hover:bg-card sm:p-6"
        >
          <p className="text-xs font-medium text-[var(--brand)]">
            Verktyg
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            ORD-Flashcards
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Se ordet, säg betydelsen, vänd kortet.
          </p>
          <div className="mt-4 inline-block rounded-md bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
            Öppna →
          </div>
        </Link>

        {/* Reading Library */}
        <Link
          href="/bibliotek"
          className="rounded-[10px] border border-[var(--line-strong)] bg-card/70 p-5 transition hover:border-[var(--brand)] hover:bg-card sm:p-6"
        >
          <p className="text-xs font-medium text-[var(--brand)]">
            Resurser
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Läsbibliotek
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Läsetexter med ord och sammanfattning.
          </p>
          <div className="mt-4 inline-block rounded-md bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
            Öppna →
          </div>
        </Link>
      </div>
    </div>
  );
}

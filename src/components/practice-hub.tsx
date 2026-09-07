"use client";

import Link from "next/link";
import type { PracticeKind } from "@/lib/practice";
import { SUBTESTS as CATALOG } from "@/lib/subtests";

export type SubTestInfo = {
  id: PracticeKind;
  label: string;
  title: string;
  description: string;
  isReading: boolean; // true for LÄS, MEK, etc.
  icon: string;
};

// Names/labels come from src/lib/subtests.ts (single source of truth), keyed
// by the lowercase practice `kind` (e.g. "xyz" -> "Matematik problemlösning").
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

export const SUBTESTS: SubTestInfo[] = [
  {
    id: "ord",
    label: shortFor("ord"),
    title: nameFor("ord"),
    description: "Öva på ord- och begreppsförståelse med fokus på synonymer och betydelser.",
    isReading: false,
    icon: "📚",
  },
  {
    id: "mek",
    label: shortFor("mek"),
    title: nameFor("mek"),
    description: "Fyll i meningar med rätt ord och konnektorer.",
    isReading: true,
    icon: "✏️",
  },
  {
    id: "las",
    label: shortFor("las"),
    title: nameFor("las"),
    description: "Läs texter och svara på förståelsefrågor.",
    isReading: true,
    icon: "📖",
  },
  {
    id: "elf",
    label: shortFor("elf"),
    title: nameFor("elf"),
    description: "Läs engelska texter och svara på förståelsefrågor.",
    isReading: false,
    icon: "🌍",
  },
  {
    id: "xyz",
    label: shortFor("xyz"),
    title: nameFor("xyz"),
    description: "Öva på logiska slutledningar och mönsteranalys.",
    isReading: false,
    icon: "🧩",
  },
  {
    id: "kva",
    label: shortFor("kva"),
    title: nameFor("kva"),
    description: "Jämför storheter och tal. Är A större, B större eller lika stora?",
    isReading: false,
    icon: "🔢",
  },
  {
    id: "nog",
    label: shortFor("nog"),
    title: nameFor("nog"),
    description: "Lösa problem med hjälp av givna siffror och information.",
    isReading: false,
    icon: "📊",
  },
  {
    id: "dtk",
    label: shortFor("dtk"),
    title: nameFor("dtk"),
    description: "Tolka och analysera data från diagram, tabeller och kartor.",
    isReading: false,
    icon: "📈",
  },
];

export function PracticeHub() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Övning
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Välj deltest att öva på
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Välj ett deltest och bestäm hur många frågor du vill öva på. Du kan öva hur många gånger
          du vill, och ditt resultat sparas.
        </p>
      </div>

      {/* Sub-tests Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUBTESTS.map((subtest) => (
          <Link
            key={subtest.id}
            href={`/ova/${subtest.id}`}
            className="group rounded-2xl border border-[var(--line)] bg-white/70 p-5 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6"
          >
            <div className="mb-4 text-4xl">{subtest.icon}</div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  {subtest.label}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-lg text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {subtest.title}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{subtest.description}</p>
            <div className="mt-4 inline-block rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              Börja öva →
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* Flashcards */}
        <Link
          href="/ova/flashcards"
          className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 transition hover:border-[var(--accent)] hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Verktyg
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            ORD-Flashcards
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Öva på ord och begrepp med flashcards. Se ordet, säg betydelsen, vänd kortet.
          </p>
          <div className="mt-4 inline-block rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            Öppna →
          </div>
        </Link>

        {/* Reading Library */}
        <Link
          href="/bibliotek"
          className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 transition hover:border-[var(--accent)] hover:bg-white hover:shadow-[0_16px_40px_-28px_rgba(18,42,48,0.55)] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Resurser
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Läsbibliotek
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Sakprosatexter att läsa med ord, konnektorer och sammanfattning.
          </p>
          <div className="mt-4 inline-block rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            Öppna →
          </div>
        </Link>
      </div>
    </div>
  );
}

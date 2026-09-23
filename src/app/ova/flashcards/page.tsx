import type { Metadata } from "next";
import { Flashcards } from "@/components/flashcards";

export const metadata: Metadata = {
  title: "Flashcards",
  description:
    "Träna ORD-ord och konnektorer med flashcards — fel kort kommer oftare tillbaka.",
};

export default function FlashcardsPage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Verktyg
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          ORD-Flashcards
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Se ordet, säg betydelsen, vänd kortet. Fel kort kommer oftare tillbaka. Din progress
          sparas i webbläsaren.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-card/70 p-5 sm:p-6">
        <Flashcards />
      </section>
    </div>
  );
}

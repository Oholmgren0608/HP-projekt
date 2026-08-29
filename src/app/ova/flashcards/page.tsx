import { Flashcards } from "@/components/flashcards";

export default function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Verktyg
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          ORD-Flashcards
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Se ordet, säg betydelsen, vänd kortet. Fel kort kommer oftare tillbaka. Din progress
          sparas i webbläsaren.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
        <Flashcards />
      </section>
    </div>
  );
}

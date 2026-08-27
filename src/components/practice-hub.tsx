import { Flashcards } from "@/components/flashcards";
import { ReadingLibrary } from "@/components/reading-library";
import { READING_METHOD } from "@/lib/study-plan";

export function PracticeHub() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Övning
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Flashcards och läsning
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Aktiv recall för ORD och MEK, plus sakprosa med ord och konnektorer att plocka.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          ORD-flashcards
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Se ordet, säg betydelsen, vänd kortet. Fel kort kommer oftare tillbaka. Progress sparas
          i webbläsaren.
        </p>
        <div className="mt-6">
          <Flashcards />
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Läsbibliotek
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Sakprosatexter att läsa här — med ORD-ord, konnektorer och sammanfattning. Vi kan inte
          kopiera in DN/SvD/UHR-texter (upphovsrätt), så biblioteket är skrivet för HP-träning.
        </p>
        <div className="mt-6">
          <ReadingLibrary />
        </div>
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white/70 p-5 sm:p-6">
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Läsmetoden
          </h3>
          <ul className="mt-4 space-y-2">
            {READING_METHOD.map((m) => (
              <li
                key={m}
                className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

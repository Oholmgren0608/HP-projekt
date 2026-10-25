import type { Metadata } from "next";
import { Disclosure } from "@/components/disclosure";
import { ReadingLibrary } from "@/components/reading-library";
import { READING_METHOD } from "@/lib/reading-library";

export const metadata: Metadata = {
  title: "Läsbibliotek",
  description:
    "Sakprosatexter för HP-träning med ORD-ord, konnektorer och sammanfattning.",
};

export default function ReadingLibraryPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium text-[var(--brand)]">
          Resurser
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Läsbibliotek
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Egna sakprosatexter för HP-träning — inte kopior av tidnings- eller UHR-texter.
        </p>
      </div>

      <section>
        <div className="rounded-[10px] border border-[var(--line)] bg-card/70 p-5 sm:p-6">
          <ReadingLibrary />
        </div>
      </section>

      <Disclosure title="Läsmetoden" subtitle={`${READING_METHOD.length} råd`}>
        <ul className="space-y-2.5">
          {READING_METHOD.map((m) => (
            <li
              key={m}
              className="flex gap-2 text-sm leading-relaxed text-[var(--ink-soft)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}

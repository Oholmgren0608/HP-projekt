import { OfficialExamsBrowser } from "@/components/official-exams-browser";

export function ExamsView() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Prov
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Prov — gamla prov och övning
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Träna på importerade gamla prov i appen, kör ett tidsatt mini-prov med appens egna
          frågor, eller läs officiella UHR-häften som PDF.
        </p>
      </div>
      <OfficialExamsBrowser />
    </div>
  );
}

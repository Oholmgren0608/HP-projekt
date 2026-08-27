import { OfficialExamsBrowser } from "@/components/official-exams-browser";

export function ExamsView() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Prov
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Mini-prov och gamla häften
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
          Kör ett tidsatt mini-prov med appens frågor, eller läs officiella UHR-häften som PDF.
        </p>
      </div>
      <OfficialExamsBrowser />
    </div>
  );
}

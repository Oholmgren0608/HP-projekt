import { OfficialExamsBrowser } from "@/components/official-exams-browser";

export function ExamsView() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] font-semibold text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
          Prov — gamla prov och övning
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
          Simulerade provpass, tidsatt mini-prov och officiella UHR-häften.
        </p>
      </div>
      <OfficialExamsBrowser />
    </div>
  );
}

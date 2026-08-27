import Link from "next/link";
import {
  formatSecondsPerQuestion,
  kindToSection,
  type PaceVerdict,
} from "@/lib/practice-pace";

export function PaceNotice({
  verdict,
  kinds,
}: {
  verdict: PaceVerdict | null;
  kinds?: string[];
}) {
  if (!verdict?.over) return null;
  const section =
    kinds && kinds.length === 1 ? kindToSection(kinds[0]) : null;
  const sectionLabel = section === "LAS" ? "LÄS" : section;
  const tipsHref = section ? `/tips?section=${section}` : "/tips";
  const you = formatSecondsPerQuestion(verdict.secPerQ);
  const cap = formatSecondsPerQuestion(verdict.cap);

  return (
    <div className="rounded-xl border border-[#9a3412]/30 bg-[#fff7f3] px-4 py-3">
      <p className="text-sm font-medium text-[#9a3412]">
        Du låg på {you}/fråga — taket är {cap} (HP-tempo, 40 frågor på 55 min som bas).
      </p>
      <Link
        href={tipsHref}
        className="mt-1 inline-block text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
      >
        Tips för att korta tiden{sectionLabel ? ` på ${sectionLabel}` : ""} →
      </Link>
    </div>
  );
}

import Link from "next/link";
import {
  formatSecondsPerQuestion,
  kindToSection,
  type PaceVerdict,
} from "@/lib/practice-pace";
import { sectionShort } from "@/lib/subtests";

export function PaceNotice({
  verdict,
  kinds,
}: {
  verdict: PaceVerdict | null;
  kinds?: string[];
}) {
  if (!verdict) return null;
  const you = formatSecondsPerQuestion(verdict.secPerQ);
  const cap = formatSecondsPerQuestion(verdict.cap);
  const paceLine = `${you}/fråga (tak ${cap})`;

  if (!verdict.over) {
    return <p className="text-sm tabular-nums text-[var(--ink-muted)]">{paceLine}</p>;
  }

  const section = kinds && kinds.length === 1 ? kindToSection(kinds[0]) : null;
  const sectionLabel = section ? sectionShort(section) : null;
  const tipsHref = section ? `/tips?section=${section}` : "/tips";

  return (
    <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--coral-soft)] px-4 py-3">
      <p className="text-sm font-medium tabular-nums text-[var(--destructive)]">{paceLine}</p>
      <Link
        href={tipsHref}
        className="mt-1 inline-block text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
      >
        Tips för att korta tiden{sectionLabel ? ` på ${sectionLabel}` : ""} →
      </Link>
    </div>
  );
}

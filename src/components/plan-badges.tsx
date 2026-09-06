import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/format";
import { priorityLabel, type Priority } from "@/lib/study-plan";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priorityLabel(priority);
  if (priority === "kritiskt") {
    return (
      <Badge className="border-transparent bg-[#9a3412] text-white hover:bg-[#9a3412]">
        {label}
      </Badge>
    );
  }
  if (priority === "huvudfokus") {
    return (
      <Badge className="border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent)]">
        {label}
      </Badge>
    );
  }
  if (priority === "styrka") {
    return (
      <Badge className="border-transparent bg-[var(--lagoon)] text-white hover:bg-[var(--lagoon)]">
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-[var(--line)] text-[var(--ink-soft)]">
      {label}
    </Badge>
  );
}

export function ScoreBar({ correct, total }: { correct: number; total: number }) {
  const p = pct(correct, total);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--mist)]">
      <div
        className="h-full rounded-full bg-[var(--accent)]"
        style={{ width: `${p}%` }}
        aria-hidden
      />
    </div>
  );
}

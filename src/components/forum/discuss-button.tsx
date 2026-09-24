"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Behöver du hjälp?" - genväg från en rättad fråga till frågans diskussion.
 * Tråden skapas först när någon skriver, så knappen är alltid säker att trycka
 * på även om ingen har diskuterat frågan än.
 */
export function DiscussQuestionButton({
  questionId,
  className,
  label = "Behöver du hjälp?",
  compact = false,
}: {
  questionId: string;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/forum/fraga/${encodeURIComponent(questionId)}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] font-semibold text-[var(--brand)] transition hover:bg-[var(--accent-soft)]",
        compact ? "min-h-8 px-2.5 py-1 text-xs" : "min-h-9 px-3 py-1.5 text-xs sm:text-sm",
        className,
      )}
    >
      <MessagesSquare size={14} aria-hidden />
      {label}
    </Link>
  );
}

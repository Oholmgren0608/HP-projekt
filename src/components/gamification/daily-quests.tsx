"use client";

import { Check } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Dagens tre uppdrag med framstegsindikatorer. Klara uppdrag får en
 * bock och tonas ned.
 */
export function DailyQuests({ className }: { className?: string }) {
  const { state } = useGamification();
  const { items, allDone } = state.quests;

  return (
    <div className={cn("rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
          Dagens uppdrag
        </h2>
        {allDone && (
          <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
            Alla klara
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2.5">
        {items.map((q) => {
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
          return (
            <li
              key={q.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-[var(--line)] px-3 py-2.5 transition-opacity",
                q.done && "opacity-80",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold text-[var(--ink)]", q.done && "line-through opacity-70")}>
                  {q.label}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] font-semibold text-[var(--ink-muted)] tabular-nums">
                    {q.progress}/{q.target}
                  </span>
                </div>
              </div>
              <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
                {q.done ? (
                  <span
                    aria-label="Klart"
                    className="flex size-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--brand)]"
                  >
                    <Check className="size-4" strokeWidth={2} aria-hidden />
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[var(--ink-muted)] tabular-nums">+{q.xp}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

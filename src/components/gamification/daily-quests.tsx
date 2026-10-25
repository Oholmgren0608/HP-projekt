"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Dagens tre uppdrag med framstegsindikatorer. Klara uppdrag får en
 * studsig bock och mjukt genomskinlig stil.
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
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="rounded-md bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--success-ink)]"
          >
            Alla klara!
          </motion.span>
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
                q.done && "border-[var(--success-soft)] bg-[var(--success-soft)]/40 opacity-80",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold text-[var(--ink)]", q.done && "line-through opacity-70")}>
                  {q.label}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        q.done ? "bg-[var(--success-ink)]" : "bg-[var(--brand)]",
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[11px] font-semibold text-[var(--ink-muted)] tabular-nums">
                    {q.progress}/{q.target}
                  </span>
                </div>
              </div>
              <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
                {q.done ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                    className="flex size-7 items-center justify-center rounded-full bg-[var(--success-ink)] text-primary-foreground"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span className="text-xs font-semibold text-[var(--energy-ink)]">+{q.xp}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

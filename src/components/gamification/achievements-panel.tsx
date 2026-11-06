"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Lock } from "lucide-react";
import { Disclosure } from "@/components/disclosure";
import { ACHIEVEMENTS } from "@/lib/gamification/config";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Achievement-galleri: upplåsta i färg, låsta nedtonade med hänglås.
 */
export function AchievementsPanel({ className }: { className?: string }) {
  const { state, markAchievementsSeen } = useGamification();
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  // Stängd panel animerar klart utan att någon ser markeringen; kvittera därför
  // "NY" först när panelen faktiskt är öppen och användaren hunnit se den.
  useEffect(() => {
    if (!expanded) return;
    const unseen = ACHIEVEMENTS.filter((a) => {
      const entry = state.achievements[a.id];
      return entry && !entry.seen;
    }).map((a) => a.id);
    if (unseen.length === 0) return;
    const timer = window.setTimeout(() => markAchievementsSeen(unseen), 1000);
    return () => window.clearTimeout(timer);
  }, [expanded, state.achievements, markAchievementsSeen]);

  return (
    <Disclosure
      title="Prestationer"
      onOpenChange={setExpanded}
      className={cn("shadow-soft", className)}
      hint={
        <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-foreground)]">
          {Object.keys(state.achievements).length} / {ACHIEVEMENTS.length}
        </span>
      }
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = state.achievements[a.id];
          const isNew = unlocked && !unlocked.seen;
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: Math.min(i * 0.03, 0.3) }}
              onAnimationComplete={() => {
                if (expanded && isNew) markAchievementsSeen([a.id]);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                unlocked
                  ? "border-[var(--line)] bg-[var(--card)]"
                  : "border-[var(--line)] bg-[var(--mist)]/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xl",
                  unlocked ? "bg-[var(--accent-soft)]" : "bg-[var(--mist)]",
                )}
              >
                {unlocked ? <Check className="size-4 text-[var(--brand)]" /> : <Lock className="size-4 text-[var(--ink-muted)]" />}
              </span>
              <span className={cn("text-xs font-semibold", unlocked ? "text-[var(--ink)]" : "text-[var(--ink-muted)]")}>
                {unlocked ? a.title : "Låst"}
              </span>
              {unlocked && (
                <span className="line-clamp-2 text-[10px] leading-tight font-medium text-[var(--ink-muted)]">
                  {a.desc}
                </span>
              )}
              {isNew && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 items-center justify-center rounded-md bg-[var(--brand)] px-1.5 text-[10px] font-semibold text-primary-foreground">
                  NY
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </Disclosure>
  );
}

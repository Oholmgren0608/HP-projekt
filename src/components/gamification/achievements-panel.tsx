"use client";

import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/gamification/config";
import { useGamification } from "@/lib/gamification/provider";
import { cn } from "@/lib/utils";

/**
 * Achievement-galleri: upplåsta i färg, låsta nedtonade med hänglås.
 */
export function AchievementsPanel({ className }: { className?: string }) {
  const { state, markAchievementsSeen } = useGamification();

  return (
    <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
          Achievements
        </h2>
        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--accent-foreground)]">
          {Object.keys(state.achievements).length} / {ACHIEVEMENTS.length}
        </span>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = state.achievements[a.id];
          const isNew = unlocked && !unlocked.seen;
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              onAnimationComplete={() => {
                if (isNew) markAchievementsSeen([a.id]);
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition",
                unlocked
                  ? "border-[var(--energy-soft)] bg-[var(--energy-soft)]/50"
                  : "border-[var(--line)] bg-[var(--mist)]/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xl",
                  unlocked ? "bg-[var(--card)] shadow-soft" : "bg-[var(--mist)] grayscale",
                )}
              >
                {unlocked ? a.emoji : <Lock className="size-4 text-[var(--ink-muted)]" />}
              </span>
              <span className={cn("text-xs font-extrabold", unlocked ? "text-[var(--ink)]" : "text-[var(--ink-muted)]")}>
                {unlocked ? a.title : "Låst"}
              </span>
              {unlocked && (
                <span className="line-clamp-2 text-[10px] leading-tight font-semibold text-[var(--ink-muted)]">
                  {a.desc}
                </span>
              )}
              {isNew && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.6, delay: 0.15 }}
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--coral-ink)] text-[9px] font-extrabold text-primary-foreground shadow-pop"
                >
                  NY
                </motion.span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

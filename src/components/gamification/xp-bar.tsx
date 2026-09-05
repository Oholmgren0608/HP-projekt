"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";

/**
 * XP-bar med nivå-chip: "Nivå 4 · Strateg" + animerad förloppsindikator
 * mot nästa nivå och dagens XP.
 */
export function XpBar({ compact = false }: { compact?: boolean }) {
  const { state, level } = useGamification();
  const toNext = level.ceiling === null ? 0 : level.ceiling - level.floor;
  const have = level.ceiling === null ? 0 : state.xp - level.floor;
  const pct = Math.max(0, Math.min(100, Math.round((have / Math.max(1, toNext)) * 100)));

  return (
    <div className={compact ? "" : "rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-soft"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-extrabold text-white shadow-soft">
            {level.level}
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-[var(--ink-muted)] uppercase">
              Nivå {level.level}
            </p>
            <p className="text-sm font-extrabold text-[var(--ink)]">{level.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--energy-soft)] px-2.5 py-1 text-xs font-extrabold text-[color-mix(in_oklab,var(--energy)_70%,var(--ink))]">
          <Sparkles className="size-3.5" />
          +{state.today.xp} XP idag
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--lagoon))]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.8 }}
          />
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.35)_50%,transparent_70%)]" />
        </div>
        <span className="w-24 shrink-0 text-right text-xs font-bold text-[var(--ink-muted)] tabular-nums">
          {state.xp} XP
          {level.ceiling !== null && (
            <span className="font-semibold"> / {level.ceiling}</span>
          )}
        </span>
      </div>
    </div>
  );
}

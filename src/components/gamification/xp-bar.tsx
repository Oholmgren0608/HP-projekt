"use client";

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
    <div className={compact ? "" : "rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-semibold text-primary-foreground shadow-soft">
            {level.level}
          </span>
          <div>
            <p className="text-[13px] font-medium text-[var(--ink-muted)]">
              Nivå {level.level}
            </p>
            <p className="text-sm font-semibold text-[var(--ink)]">{level.title}</p>
          </div>
        </div>
        <div className="rounded-md bg-[var(--mist)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)] tabular-nums">
          +{state.today.xp} XP idag
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--mist)]">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-24 shrink-0 text-right text-xs font-semibold text-[var(--ink-muted)] tabular-nums">
          {state.xp} XP
          {level.ceiling !== null && (
            <span className="font-medium"> / {level.ceiling}</span>
          )}
        </span>
      </div>
    </div>
  );
}

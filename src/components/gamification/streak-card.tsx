"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { dateKey } from "@/lib/gamification/engine";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

/**
 * Streak-kort: flammikon + antal dagar i rad + senaste 7 dagarnas aktivitet.
 * Dagens ruta fylls med en studs när man pluggar.
 */
export function StreakCard() {
  const { state } = useGamification();
  const { current, best } = state.streak;

  const days: { key: string; label: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    days.push({
      key,
      label: WEEKDAY_LABELS[(d.getDay() + 6) % 7], // måndag först
      active: Boolean(state.activeDays[key]),
      isToday: i === 0,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            key={current}
            initial={{ scale: 1.4, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              current > 0 ? "bg-[var(--energy-soft)] text-[var(--energy-ink)]" : "bg-[var(--mist)] text-[var(--ink-muted)]",
            )}
          >
            <Flame className={cn("size-6", current > 0 && "animate-flicker")} />
          </motion.span>
          <div>
            <p className="text-2xl leading-none font-extrabold text-[var(--ink)] tabular-nums">
              {current}
              <span className="ml-1 text-sm font-bold text-[var(--ink-muted)]">
                {current === 1 ? "dag i rad" : "dagar i rad"}
              </span>
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--ink-muted)]">Bästa: {best} dagar</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <motion.span
              animate={d.active ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.35 }}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold",
                d.active
                  ? "bg-[linear-gradient(135deg,var(--energy-ink),var(--coral-ink))] text-primary-foreground shadow-soft"
                  : "bg-[var(--mist)] text-[var(--ink-muted)]",
                d.isToday && !d.active && "border-2 border-dashed border-[var(--energy-ink)]",
              )}
            >
              {d.active ? "✓" : ""}
            </motion.span>
            <span className={cn("text-[9px] font-bold", d.isToday ? "text-[var(--energy-ink)]" : "text-[var(--ink-muted)]")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {current === 0 && (
        <p className="mt-3 text-center text-xs font-bold text-[var(--ink-muted)]">
          Gör en uppgift idag och tänd din streak 🔥
        </p>
      )}
    </div>
  );
}

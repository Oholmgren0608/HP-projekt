"use client";

import { Check, Flame } from "lucide-react";
import { useGamification } from "@/lib/gamification/provider";
import { dateKey } from "@/lib/gamification/engine";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

/**
 * Streak-kort: flammikon + antal dagar i rad + senaste 7 dagarnas aktivitet.
 * Dagens ruta fylls när man pluggar.
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
    <div className="rounded-[10px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              current > 0 ? "bg-[var(--accent-soft)] text-[var(--brand)]" : "bg-[var(--mist)] text-[var(--ink-muted)]",
            )}
          >
            <Flame className="size-6" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <p className="text-2xl leading-none font-semibold text-[var(--ink)] tabular-nums">
              {current}
              <span className="ml-1 text-sm font-semibold text-[var(--ink-muted)]">
                {current === 1 ? "dag i rad" : "dagar i rad"}
              </span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--ink-muted)]">Bästa: {best} dagar</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-[10px] font-semibold",
                d.active
                  ? "bg-[var(--brand)] text-primary-foreground"
                  : "bg-[var(--mist)] text-[var(--ink-muted)]",
                d.isToday && !d.active && "border border-dashed border-[var(--brand)]",
              )}
            >
              {d.active ? <Check className="size-3.5" strokeWidth={2} aria-label="Aktiv" /> : null}
            </span>
            <span className={cn("text-[9px] font-semibold", d.isToday ? "text-[var(--brand)]" : "text-[var(--ink-muted)]")}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {current === 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-[var(--ink-muted)]">
          Gör en uppgift idag och tänd din streak
        </p>
      )}
    </div>
  );
}

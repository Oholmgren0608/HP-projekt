"use client";

import { POOL_KINDS } from "@/lib/pool-time";
import { cn } from "@/lib/utils";

/** Val av delprov för Alla mot alla (minst ett). */
export function KindPicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string[];
  onChange: (kinds: string[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Delprov">
      {POOL_KINDS.map((kind) => {
        const on = value.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={on}
            disabled={disabled || (on && value.length === 1)}
            onClick={() => onChange(on ? value.filter((k) => k !== kind) : [...value, kind])}
            className={cn(
              "inline-flex min-h-9 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed",
              on
                ? "border-[var(--brand)] bg-[var(--accent-soft)] text-[var(--brand)]"
                : "border-[var(--line-strong)] bg-card text-[var(--ink-soft)] hover:bg-[var(--mist)]",
              disabled && !on && "opacity-50",
            )}
          >
            {kind.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

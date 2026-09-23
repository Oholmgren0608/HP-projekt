export type ProgressPoint = {
  at: string;
  value: number;
  label: string;
};

/**
 * Ren presentational SVG-graf för poängprognosen — en ren funktion av `points`
 * och `compact` (ingen storage, ingen context, inga side effects).
 */
export function ProgressChart({
  points,
  compact = false,
}: {
  points: ProgressPoint[];
  compact?: boolean;
}) {
  if (points.length < 2) {
    return (
      <p className="mt-5 text-sm text-[var(--ink-muted)]">
        Grafen kräver minst två mätpunkter.
      </p>
    );
  }

  const w = 560;
  const h = compact ? 100 : 140;
  const pad = 22;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map((p) => pad + (1 - p.value / 2) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${w} ${h}`} className={`${compact ? "h-24" : "h-36"} w-full`} role="img" aria-label="Norm över tid">
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="currentColor"
          className="text-[var(--line)]"
        />
        <text x={4} y={pad + 4} className="fill-[var(--ink-muted)] text-[10px]">
          2,0
        </text>
        <text x={4} y={h - pad} className="fill-[var(--ink-muted)] text-[10px]">
          0
        </text>
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2.5" />
        {xs.map((x, i) => (
          <circle
            key={`${points[i].at}-${i}`}
            cx={x}
            cy={ys[i]}
            r={4}
            fill={points[i].label === "inmatad" ? "var(--ink)" : "var(--lagoon-ink)"}
          />
        ))}
      </svg>
      <p className="text-xs text-[var(--ink-muted)]">
        Svart = inmatad norm · grön = uppskattning från övning
      </p>
    </div>
  );
}

import type { ReactNode } from "react";
import type { DtkFigureData, FigurePart, RegionShape, SeriesData } from "@/lib/content/dtk-figures";

/**
 * Ritar en DTK-figur (tabell, stapel-, linje- och cirkeldiagram, karta) från
 * datan i `@/lib/content/dtk-figures`. Diagrammen är inline-SVG med
 * värdeetiketter, så att varje värde i underlaget går att läsa exakt, och
 * varje diagram har en dold datatabell för skärmläsare.
 */

const W = 520;
const SERIES_COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
// Samma färger som Tailwind-klasser, för förklaringarnas rutor i HTML.
const SERIES_BG = ["bg-[var(--viz-1)]", "bg-[var(--viz-2)]", "bg-[var(--viz-3)]", "bg-[var(--viz-4)]"];
const CLASS_BG = [
  "bg-[var(--viz-seq-1)]",
  "bg-[var(--viz-seq-2)]",
  "bg-[var(--viz-seq-3)]",
  "bg-[var(--viz-seq-4)]",
  "bg-[var(--viz-seq-5)]",
];
const CLASS_COLORS = [
  "var(--viz-seq-1)",
  "var(--viz-seq-2)",
  "var(--viz-seq-3)",
  "var(--viz-seq-4)",
  "var(--viz-seq-5)",
];

/** Svensk talformatering: decimalkomma, mellanslag som tusentalsavgränsare, riktigt minustecken. */
function fmt(value: number, decimals = 0) {
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${value < 0 ? "−" : ""}${grouped}${fraction ? `,${fraction}` : ""}`;
}

function ticks(min: number, max: number, step: number) {
  const out: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export function DtkFigure({ figure }: { figure: DtkFigureData }) {
  return (
    <figure className="rounded-lg border border-[var(--line)] bg-card p-4 text-[var(--ink)] sm:p-5">
      <figcaption className="text-[15px] font-semibold leading-snug">{figure.title}</figcaption>
      {figure.intro ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">{figure.intro}</p>
      ) : null}
      <div className="mt-4 space-y-6">
        {figure.parts.map((part, i) => (
          <Part key={i} part={part} />
        ))}
      </div>
    </figure>
  );
}

function Part({ part }: { part: FigurePart }) {
  switch (part.kind) {
    case "table":
      return (
        <Section title={part.title}>
          <Table head={part.head} rows={part.rows} totalRow={part.totalRow} />
        </Section>
      );
    case "columns":
    case "line":
      return (
        <Section title={part.title}>
          <Legend series={part.series} />
          <VerticalChart {...part} kind={part.kind} />
          <SeriesTable categories={part.categories} series={part.series} decimals={part.decimals} />
        </Section>
      );
    case "bars":
      return (
        <Section title={part.title}>
          <Legend series={part.series} />
          <HorizontalBars {...part} />
          <SeriesTable categories={part.categories} series={part.series} decimals={part.decimals} />
        </Section>
      );
    case "pie":
      return (
        <Section title={part.title}>
          <Pie slices={part.slices} unit={part.unit} />
          <SrTable
            head={["", part.unit]}
            rows={part.slices.map((slice) => [slice.name, fmt(slice.value)])}
          />
        </Section>
      );
    case "map":
      return (
        <Section title={part.title}>
          <ChoroplethMap regions={part.regions} />
          <ul className="mt-2 grid gap-x-5 gap-y-1 text-xs text-[var(--ink-soft)] sm:grid-cols-2">
            {part.classes.map((text, i) => (
              <li key={text} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`inline-block h-3 w-5 shrink-0 rounded-sm ${CLASS_BG[i]}`}
                />
                Klass {i + 1}: {text}
              </li>
            ))}
          </ul>
          <SrTable
            head={["Kommun", "Landareal", "Klass"]}
            rows={part.regions.map((r) => [r.name, r.detail ?? "", String(r.cls)])}
          />
        </Section>
      );
    case "note":
      return <p className="text-xs leading-relaxed text-[var(--ink-soft)]">{part.text}</p>;
  }
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title ? <h3 className="mb-2 text-sm font-medium text-[var(--ink)]">{title}</h3> : null}
      {children}
    </section>
  );
}

function Table({ head, rows, totalRow }: { head: string[]; rows: string[][]; totalRow?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b-2 border-[var(--line-strong)]">
            {head.map((cell, i) => (
              <th
                key={i}
                scope="col"
                className={`px-2 py-1.5 align-bottom font-medium text-[var(--ink-soft)] first:pl-0 last:pr-0 ${i === 0 ? "text-left" : "text-right"}`}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => {
            const isTotal = totalRow && r === rows.length - 1;
            return (
              <tr
                key={r}
                className={isTotal ? "border-t-2 border-[var(--line-strong)] font-semibold" : "border-b border-[var(--line)]"}
              >
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className={`py-1.5 pr-2 text-left ${isTotal ? "font-semibold" : "font-normal"}`}>
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="whitespace-nowrap px-2 py-1.5 text-right last:pr-0">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SrTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <thead>
        <tr>
          {head.map((cell, i) => (
            <th key={i} scope="col">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SeriesTable({
  categories,
  series,
  decimals,
}: {
  categories: string[];
  series: SeriesData[];
  decimals?: number;
}) {
  return (
    <SrTable
      head={["", ...series.map((s) => s.name)]}
      rows={categories.map((c, i) => [c, ...series.map((s) => fmt(s.values[i], decimals))])}
    />
  );
}

/** Förklaring ovanför diagrammet när det finns mer än en serie. */
function Legend({ series }: { series: SeriesData[] }) {
  if (series.length < 2) return null;
  return (
    <div aria-hidden className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
      {series.map((s, i) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span className={`inline-block size-2.5 rounded-sm ${SERIES_BG[i]}`} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

const axisText = { fontSize: 11, fill: "var(--ink-muted)" } as const;
const valueText = { fontSize: 10.5, fill: "var(--ink-soft)" } as const;

/** Stapeldiagram med lodräta staplar och linjediagram – samma axlar. */
function VerticalChart({
  kind,
  title,
  categories,
  series,
  axis,
  decimals,
}: {
  kind: "columns" | "line";
  title: string;
  categories: string[];
  series: SeriesData[];
  axis: { min?: number; max: number; step: number };
  decimals?: number;
}) {
  const H = 230;
  const pad = { top: 18, right: 8, bottom: 26, left: 40 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const min = axis.min ?? 0;
  const y = (v: number) => pad.top + ((axis.max - v) / (axis.max - min)) * plotH;
  const slot = plotW / categories.length;
  const center = (i: number) => pad.left + (i + 0.5) * slot;
  const base = y(Math.max(min, 0));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
      {ticks(min, axis.max, axis.step).map((t) => (
        <g key={t}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(t)}
            y2={y(t)}
            stroke={t === 0 ? "var(--line-strong)" : "var(--line)"}
          />
          <text x={pad.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" {...axisText}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {categories.map((c, i) => (
        <text key={c} x={center(i)} y={H - 8} textAnchor="middle" {...axisText}>
          {c}
        </text>
      ))}

      {kind === "columns"
        ? series.map((s, si) => {
            const gap = 2;
            const barW = Math.min(26, (slot * 0.72 - gap * (series.length - 1)) / series.length);
            const groupW = barW * series.length + gap * (series.length - 1);
            return s.values.map((v, i) => {
              const x = center(i) - groupW / 2 + si * (barW + gap);
              const top = y(v);
              return (
                <g key={`${si}-${i}`}>
                  <path d={roundedColumn(x, base, barW, top)} fill={SERIES_COLORS[si]}>
                    <title>{`${categories[i]}${series.length > 1 ? `, ${s.name}` : ""}: ${fmt(v, decimals)}`}</title>
                  </path>
                  <text x={x + barW / 2} y={top - 4} textAnchor="middle" {...valueText}>
                    {fmt(v, decimals)}
                  </text>
                </g>
              );
            });
          })
        : series.map((s, si) => (
            <g key={s.name}>
              <polyline
                points={s.values.map((v, i) => `${center(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={SERIES_COLORS[si]}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {s.values.map((v, i) => {
                // Etiketten hamnar ovanför toppar och under dalar, så att den inte ligger på linjen.
                const prev = s.values[i - 1] ?? v;
                const next = s.values[i + 1] ?? v;
                const below = v < (prev + next) / 2;
                return (
                  <g key={i}>
                    <circle cx={center(i)} cy={y(v)} r={4} fill={SERIES_COLORS[si]} stroke="var(--card)" strokeWidth={2}>
                      <title>{`${categories[i]}: ${fmt(v, decimals)}`}</title>
                    </circle>
                    <text
                      x={center(i)}
                      y={below ? y(v) + 16 : y(v) - 9}
                      textAnchor="middle"
                      {...valueText}
                    >
                      {fmt(v, decimals)}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
    </svg>
  );
}

/** Lodrät stapel med rundade hörn bara i den fria änden. */
function roundedColumn(x: number, base: number, w: number, top: number) {
  const r = Math.min(3, Math.abs(base - top), w / 2);
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
}

/** Liggande stapeldiagram: en rad per kategori, en stapel per serie. */
function HorizontalBars({
  title,
  categories,
  series,
  axis,
  decimals,
}: {
  title: string;
  categories: string[];
  series: SeriesData[];
  axis: { max: number; step: number };
  decimals?: number;
}) {
  const barH = 14;
  const gap = 2;
  const groupGap = 12;
  const rowH = series.length * barH + (series.length - 1) * gap + groupGap;
  const pad = { top: 6, right: 44, bottom: 22, left: 112 };
  const H = pad.top + categories.length * rowH - groupGap + 8 + pad.bottom;
  const plotW = W - pad.left - pad.right;
  const x = (v: number) => pad.left + (v / axis.max) * plotW;
  const axisY = H - pad.bottom;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
      {ticks(0, axis.max, axis.step).map((t) => (
        <g key={t}>
          <line
            x1={x(t)}
            x2={x(t)}
            y1={pad.top - 2}
            y2={axisY}
            stroke={t === 0 ? "var(--line-strong)" : "var(--line)"}
          />
          <text x={x(t)} y={axisY + 15} textAnchor="middle" {...axisText}>
            {fmt(t)}
          </text>
        </g>
      ))}
      {categories.map((c, i) => {
        const rowTop = pad.top + i * rowH;
        const groupH = rowH - groupGap;
        return (
          <g key={c}>
            <text
              x={pad.left - 8}
              y={rowTop + groupH / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--ink)"
            >
              {c}
            </text>
            {series.map((s, si) => {
              const v = s.values[i];
              const top = rowTop + si * (barH + gap);
              const end = x(v);
              const r = Math.min(3, end - pad.left);
              return (
                <g key={s.name}>
                  <path
                    d={`M${pad.left},${top} H${end - r} Q${end},${top} ${end},${top + r} V${top + barH - r} Q${end},${top + barH} ${end - r},${top + barH} H${pad.left} Z`}
                    fill={SERIES_COLORS[si]}
                  >
                    <title>{`${c}${series.length > 1 ? `, ${s.name}` : ""}: ${fmt(v, decimals)}`}</title>
                  </path>
                  <text x={end + 4} y={top + barH / 2} dominantBaseline="middle" {...valueText}>
                    {fmt(v, decimals)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Cirkeldiagram med namn och värde utanför varje sektor (ingen färgnyckel behövs). */
function Pie({ slices, unit }: { slices: { name: string; value: number }[]; unit: string }) {
  const H = 240;
  const cx = W / 2;
  const cy = H / 2;
  const r = 86;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  // Varje sektor börjar där summan av de föregående slutar (klockan 12, medurs).
  const starts = slices.map((_, i) =>
    slices.slice(0, i).reduce((sum, s) => sum + (s.value / total) * Math.PI * 2, 0),
  );
  const point = (angle: number, radius: number) => [
    cx + radius * Math.sin(angle),
    cy - radius * Math.cos(angle),
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cirkeldiagram, ${unit}`} className="h-auto w-full max-w-md">
      {slices.map((slice, i) => {
        const start = starts[i];
        const angle = (slice.value / total) * Math.PI * 2;
        const end = start + angle;
        const mid = start + angle / 2;
        const [x1, y1] = point(start, r);
        const [x2, y2] = point(end, r);
        const [lx, ly] = point(mid, r + 14);
        const right = Math.sin(mid) >= 0;
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2},${y2} Z`;
        return (
          <g key={slice.name}>
            <path d={d} fill={SERIES_COLORS[i % SERIES_COLORS.length]} stroke="var(--card)" strokeWidth={2}>
              <title>{`${slice.name}: ${fmt(slice.value)} ${unit}`}</title>
            </path>
            <text
              x={lx}
              y={ly}
              textAnchor={right ? "start" : "end"}
              dominantBaseline="middle"
              fontSize={12}
              fill="var(--ink)"
            >
              {slice.name}: {fmt(slice.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Kartans sex kommuner. Formerna delar hörn så att gränserna går ihop till
 * ett län; kartan är schematisk, inte skalenlig – arealen står i varje kommun.
 */
const MAP_SHAPES: Record<RegionShape, { points: string; label: [number, number] }> = {
  nv: { points: "30,40 95,16 170,22 185,85 190,145 100,138 20,160 36,100", label: [102, 88] },
  n: { points: "170,22 250,42 322,34 305,95 310,165 250,172 190,145 185,85", label: [248, 100] },
  no: { points: "322,34 400,12 482,26 508,90 498,150 400,146 310,165 305,95", label: [408, 88] },
  sv: { points: "20,160 100,138 190,145 196,215 176,288 110,296 42,280 12,222", label: [104, 214] },
  s: { points: "190,145 250,172 310,165 318,220 334,276 255,268 176,288 196,215", label: [256, 222] },
  so: { points: "310,165 400,146 498,150 486,215 490,284 410,296 334,276 318,220", label: [410, 218] },
};

function ChoroplethMap({
  regions,
}: {
  regions: { name: string; detail?: string; cls: number; shape: RegionShape }[];
}) {
  const halo = { stroke: "var(--card)", strokeWidth: 3, paintOrder: "stroke" } as const;
  return (
    <svg viewBox={`0 0 ${W} 310`} role="img" aria-label="Karta över länets kommuner" className="h-auto w-full">
      {regions.map((region) => {
        const shape = MAP_SHAPES[region.shape];
        return (
          <polygon
            key={region.name}
            points={shape.points}
            fill={CLASS_COLORS[region.cls - 1]}
            stroke="var(--card)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          >
            <title>{`${region.name}: klass ${region.cls}${region.detail ? `, ${region.detail}` : ""}`}</title>
          </polygon>
        );
      })}
      {regions.map((region) => {
        const [lx, ly] = MAP_SHAPES[region.shape].label;
        return (
          <g key={region.name} textAnchor="middle" fill="var(--ink)">
            <text x={lx} y={ly - 2} fontSize={13} fontWeight={600} {...halo}>
              {region.name}
            </text>
            {region.detail ? (
              <text x={lx} y={ly + 14} fontSize={11.5} {...halo}>
                {region.detail}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

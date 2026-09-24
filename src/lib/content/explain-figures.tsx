import type { ReactNode } from "react";

/**
 * Bildförklaringar till facit — en inline-SVG per fråga där en bild faktiskt
 * förklarar svaret (diagram för DTK, tallinjer och skisser för KVA/XYZ/NOG).
 *
 * Lagras i koden i stället för i en bucket: de följer med i versionshanteringen,
 * kräver ingen uppladdning, fungerar offline och är skarpa i alla storlekar.
 * Nyckeln är frågans id, och eftersom importerade kopior i databasen använder
 * samma id (xyz-1, dtk-3, …) gäller bilden även dem.
 *
 * Frågor utan bild (ORD, MEK, LÄS, ELF och ren algebra) saknas medvetet i
 * tabellen — `ExplainFigure` renderar då ingenting.
 */

const CHART_W = 480;
const CHART_H = 220;
const PAD = { top: 18, right: 12, bottom: 34, left: 34 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function Figure({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="mt-3">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          role="img"
          aria-label={label}
          className="h-auto w-full max-w-lg"
        >
          {children}
        </svg>
      </div>
      <figcaption className="mt-1 text-xs text-[var(--ink-muted)]">
        Bildförklaring · {label}
      </figcaption>
    </figure>
  );
}

type Mark = { category: number; series: number };

/** Grupperade stapel: kategorier på x-axeln, en serie per stapel i gruppen. */
function GroupedBars({
  label,
  categories,
  series,
  yMax,
  marks = [],
  note,
  reference,
  suffix = "",
}: {
  label: string;
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  yMax: number;
  marks?: Mark[];
  /** Svarskommentar — ritas i övre högra hörnet så att den aldrig krockar med värdelabels. */
  note?: string;
  /** Streckad referenslinje, t.ex. ett medelvärde att jämföra staplarna mot. */
  reference?: { value: number; text: string };
  suffix?: string;
}) {
  const groupW = PLOT_W / categories.length;
  const barW = Math.min(20, (groupW - 16) / series.length);
  const barsW = barW * series.length;
  const baseY = PAD.top + PLOT_H;
  const y = (value: number) => baseY - (value / yMax) * PLOT_H;

  return (
    <Figure label={label}>
      <line x1={PAD.left} y1={baseY} x2={PAD.left + PLOT_W} y2={baseY} stroke="var(--line-strong)" />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseY} stroke="var(--line-strong)" />
      <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
        {yMax}
        {suffix}
      </text>
      <text x={PAD.left - 6} y={baseY} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
        0
      </text>

      {note ? (
        <text
          x={PAD.left + PLOT_W - 4}
          y={PAD.top - 6}
          textAnchor="end"
          fontSize="11"
          fontWeight={700}
          fill="var(--brand)"
        >
          {note}
        </text>
      ) : null}

      {categories.map((category, ci) => {
        const groupX = PAD.left + groupW * ci + (groupW - barsW) / 2;
        return (
          <g key={category}>
            <text
              x={PAD.left + groupW * ci + groupW / 2}
              y={CHART_H - 16}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink-muted)"
            >
              {category}
            </text>
            {series.map((s, si) => {
              const value = s.values[ci] ?? 0;
              const marked = marks.some((m) => m.category === ci && m.series === si);
              const x = groupX + si * barW;
              return (
                <g key={s.name}>
                  <rect
                    x={x}
                    y={y(value)}
                    width={Math.max(6, barW - 3)}
                    height={baseY - y(value)}
                    rx="2"
                    fill={marked ? "var(--brand)" : s.color}
                    opacity={marked || marks.length === 0 ? 1 : 0.45}
                  />
                  <text
                    x={x + Math.max(6, barW - 3) / 2}
                    y={y(value) - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={marked ? 700 : 400}
                    fill={marked ? "var(--ink)" : "var(--ink-muted)"}
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {reference ? (
        <g>
          <line
            x1={PAD.left}
            y1={y(reference.value)}
            x2={PAD.left + PLOT_W}
            y2={y(reference.value)}
            stroke="var(--brand)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={PAD.left + PLOT_W - 4}
            y={y(reference.value) - 5}
            textAnchor="end"
            fontSize="10"
            fontWeight={700}
            fill="var(--brand)"
          >
            {reference.text}
          </text>
        </g>
      ) : null}
    </Figure>
  );
}

/** Serieöversikt under diagrammet (år, produkt, avdelning …). */
function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)]">
      {items.map((item) => (
        <span key={item.name} className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: item.color }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

const YEAR_COLORS = ["var(--lagoon-ink)", "var(--brand)", "var(--energy-ink)"];

function CyclingChart({ marks, note }: { marks: Mark[]; note: string }) {
  return (
    <>
      <GroupedBars
        label="Andel cykelresor per kommun och år, med svaret markerat"
        categories={["Kommun A", "Kommun B", "Kommun C", "Kommun D"]}
        series={[
          { name: "2022", values: [12, 18, 9, 16], color: YEAR_COLORS[0] },
          { name: "2023", values: [14, 17, 11, 16], color: YEAR_COLORS[1] },
          { name: "2024", values: [15, 19, 13, 18], color: YEAR_COLORS[2] },
        ]}
        yMax={20}
        marks={marks}
        note={note}
        suffix=" %"
      />
      <Legend
        items={[
          { name: "2022", color: YEAR_COLORS[0] },
          { name: "2023", color: YEAR_COLORS[1] },
          { name: "2024", color: YEAR_COLORS[2] },
        ]}
      />
    </>
  );
}

function SalesChart({ marks, note }: { marks: Mark[]; note: string }) {
  return (
    <>
      <GroupedBars
        label="Försäljning per produkt i miljoner kronor, med svaret markerat"
        categories={["Produkt X", "Produkt Y", "Produkt Z"]}
        series={[{ name: "Miljoner kr", values: [40, 25, 35], color: "var(--lagoon-ink)" }]}
        yMax={45}
        marks={marks}
        note={note}
      />
      <Legend items={[{ name: "Miljoner kr (totalt 100)", color: "var(--lagoon-ink)" }]} />
    </>
  );
}

/** Tallinje med markerade punkter och ett markerat intervall. */
function NumberLine({
  label,
  min,
  max,
  ticks,
  interval,
  points,
  format,
}: {
  label: string;
  min: number;
  max: number;
  ticks: number[];
  interval?: { from: number; to: number; text: string };
  points: { value: number; text: string; color?: string }[];
  format: (value: number) => string;
}) {
  const x = (value: number) => PAD.left + ((value - min) / (max - min)) * PLOT_W;
  const axisY = PAD.top + PLOT_H / 2;

  return (
    <Figure label={label}>
      <line x1={PAD.left} y1={axisY} x2={PAD.left + PLOT_W} y2={axisY} stroke="var(--line-strong)" />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={x(tick)} y1={axisY - 5} x2={x(tick)} y2={axisY + 5} stroke="var(--line-strong)" />
          <text x={x(tick)} y={axisY + 20} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">
            {format(tick)}
          </text>
        </g>
      ))}
      {interval ? (
        <g>
          <rect
            x={x(interval.from)}
            y={axisY - 26}
            width={Math.max(2, x(interval.to) - x(interval.from))}
            height={16}
            rx="3"
            fill="var(--accent-soft)"
          />
          <text
            x={(x(interval.from) + x(interval.to)) / 2}
            y={axisY - 32}
            textAnchor="middle"
            fontSize="10"
            fontWeight={600}
            fill="var(--ink)"
          >
            {interval.text}
          </text>
        </g>
      ) : null}
      {points.map((point) => (
        <g key={point.text}>
          <circle cx={x(point.value)} cy={axisY} r="4" fill={point.color ?? "var(--brand)"} />
          <text
            x={x(point.value)}
            y={axisY - 34}
            textAnchor="middle"
            fontSize="11"
            fontWeight={600}
            fill={point.color ?? "var(--brand)"}
          >
            {point.text}
          </text>
        </g>
      ))}
    </Figure>
  );
}

/** Två räta linjer i samma koordinatsystem (KVA där skärningspunkten avgör). */
function LinePlot({
  label,
  xMax,
  yMax,
  lines,
  point,
}: {
  label: string;
  xMax: number;
  yMax: number;
  lines: { name: string; color: string; points: [number, number][] }[];
  point?: { x: number; y: number; text: string };
}) {
  const baseY = PAD.top + PLOT_H;
  const x = (value: number) => PAD.left + (value / xMax) * PLOT_W;
  const y = (value: number) => baseY - (value / yMax) * PLOT_H;

  return (
    <Figure label={label}>
      <line x1={PAD.left} y1={baseY} x2={PAD.left + PLOT_W} y2={baseY} stroke="var(--line-strong)" />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={baseY} stroke="var(--line-strong)" />
      <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
        {yMax}
      </text>
      <text x={PAD.left - 6} y={baseY} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
        0
      </text>
      <text x={PAD.left + PLOT_W} y={baseY + 20} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
        x = {xMax}
      </text>
      {lines.map((line) => (
        <polyline
          key={line.name}
          points={line.points.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")}
          fill="none"
          stroke={line.color}
          strokeWidth="2.5"
        />
      ))}
      {point ? (
        <g>
          <circle cx={x(point.x)} cy={y(point.y)} r="4" fill="var(--ink)" />
          <text x={x(point.x) + 8} y={y(point.y) - 6} fontSize="11" fontWeight={600} fill="var(--ink)">
            {point.text}
          </text>
        </g>
      ) : null}
    </Figure>
  );
}

/** Enkel stapelrad (andelsjämförelser). */
function ShareBars({ label, bars }: { label: string; bars: { text: string; value: number; note: string }[] }) {
  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  return (
    <Figure label={label}>
      {bars.map((bar, i) => {
        const barW = (bar.value / maxValue) * (PLOT_W - 150);
        return (
          <g key={bar.text}>
            <text x={PAD.left} y={PAD.top + 30 + i * 52 + 4} fontSize="12" fill="var(--ink)">
              {bar.text}
            </text>
            <rect
              x={PAD.left + 130}
              y={PAD.top + 30 + i * 52 - 10}
              width={Math.max(4, barW)}
              height={20}
              rx="3"
              fill="var(--brand)"
            />
            <text
              x={PAD.left + 134 + Math.max(4, barW)}
              y={PAD.top + 30 + i * 52 + 5}
              fontSize="11"
              fontWeight={600}
              fill="var(--ink)"
            >
              {bar.note}
            </text>
          </g>
        );
      })}
    </Figure>
  );
}

/** Rektangel med mått och area (XYZ/NOG-geometri). `box` styr proportionerna. */
function RectangleSketch({
  label,
  widthText,
  heightText,
  areaText,
  box = { w: 260, h: 110 },
}: {
  label: string;
  widthText: string;
  heightText: string;
  areaText: string;
  box?: { w: number; h: number };
}) {
  const x = 240 - box.w / 2;
  const y = 44;
  return (
    <Figure label={label}>
      <rect
        x={x}
        y={y}
        width={box.w}
        height={box.h}
        rx="3"
        fill="var(--accent-soft)"
        stroke="var(--brand)"
        strokeWidth="2"
      />
      <text x="240" y={y + box.h / 2 + 6} textAnchor="middle" fontSize="14" fontWeight={600} fill="var(--ink)">
        {areaText}
      </text>
      <text x="240" y={y + box.h + 34} textAnchor="middle" fontSize="12" fill="var(--ink-muted)">
        {widthText}
      </text>
      <text
        x={x - 14}
        y={y + box.h / 2 + 4}
        textAnchor="middle"
        fontSize="12"
        fill="var(--ink-muted)"
        transform={`rotate(-90 ${x - 14} ${y + box.h / 2 + 4})`}
      >
        {heightText}
      </text>
    </Figure>
  );
}

/** Bråkstapel: en helhet delad i lika stora delar, med de markerade delarna ifyllda. */
function FractionBar({
  label,
  rows,
  note,
}: {
  label: string;
  rows: { text: string; parts: number; filled: number }[];
  note: string;
}) {
  const x0 = 132;
  const barW = 296;
  const rowH = 42;
  return (
    <Figure label={label}>
      {rows.map((row, i) => {
        const y = 40 + i * rowH;
        const segW = barW / row.parts;
        return (
          <g key={row.text}>
            <text x={x0 - 12} y={y + 18} textAnchor="end" fontSize="12" fontWeight={600} fill="var(--ink)">
              {row.text}
            </text>
            {Array.from({ length: row.parts }, (_, s) => (
              <rect
                key={s}
                x={x0 + s * segW}
                y={y}
                width={Math.max(2, segW - 2)}
                height="26"
                rx="2"
                fill={s < row.filled ? "var(--brand)" : "var(--accent-soft)"}
                stroke="var(--line-strong)"
                strokeWidth="0.5"
              />
            ))}
          </g>
        );
      })}
      <text x={x0 - 12} y={40 + rows.length * rowH + 18} textAnchor="end" fontSize="12" fontWeight={700} fill="var(--brand)">
        =
      </text>
      <text x={x0} y={40 + rows.length * rowH + 18} fontSize="13" fontWeight={700} fill="var(--brand)">
        {note}
      </text>
    </Figure>
  );
}

/** Procentstapel: helheten som en stapel där en andel är markerad. */
function PercentBar({
  label,
  totalText,
  percent,
  partText,
  restText,
  note,
}: {
  label: string;
  totalText: string;
  percent: number;
  partText: string;
  restText: string;
  note: string;
}) {
  const x0 = 60;
  const barW = 360;
  const barY = 78;
  const partW = (barW * percent) / 100;
  return (
    <Figure label={label}>
      <text x={x0} y={46} fontSize="12" fontWeight={600} fill="var(--ink)">
        {totalText}
      </text>
      <rect x={x0} y={barY} width={barW} height="36" rx="4" fill="var(--accent-soft)" stroke="var(--line-strong)" strokeWidth="0.5" />
      <rect x={x0} y={barY} width={Math.max(4, partW)} height="36" rx="4" fill="var(--brand)" />
      <text x={x0 + Math.max(4, partW) / 2} y={barY - 8} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--brand)">
        {partText}
      </text>
      <text
        x={x0 + partW + (barW - partW) / 2}
        y={barY - 8}
        textAnchor="middle"
        fontSize="11"
        fill="var(--ink-muted)"
      >
        {restText}
      </text>
      <text x={x0} y={barY + 66} fontSize="14" fontWeight={700} fill="var(--brand)">
        {note}
      </text>
    </Figure>
  );
}

const FIGURES: Record<string, () => ReactNode> = {
  // DTK — cykelstatistiken (samma underlag i tre frågor, olika svar markerade)
  "dtk-1": () => (
    <CyclingChart marks={[{ category: 1, series: 2 }]} note="B 2024: 19 % – högst" />
  ),
  "dtk-2": () => (
    <CyclingChart
      marks={[{ category: 0, series: 0 }, { category: 0, series: 2 }]}
      note="A: 12 → 15 = +3 procentenheter"
    />
  ),
  "dtk-3": () => (
    <CyclingChart marks={[{ category: 1, series: 1 }]} note="B: 18 → 17 mellan 2022 och 2023" />
  ),

  // DTK — försäljning per produkt
  "dtk-4": () => (
    <SalesChart marks={[{ category: 1, series: 0 }]} note="Y: 25 av 100 = 25 %" />
  ),
  "dtk-5": () => <SalesChart marks={[{ category: 0, series: 0 }]} note="X: 40 – störst" />,
  "dtk-6": () => (
    <SalesChart
      marks={[{ category: 0, series: 0 }, { category: 2, series: 0 }]}
      note="X − Z: 40 − 35 = 5 miljoner"
    />
  ),

  // DTK — sjukfrånvaro per avdelning
  "dtk-7": () => (
    <>
      <GroupedBars
        label="Sjukfrånvaro i procent av arbetad tid, med mars-svaret markerat"
        categories={["Avd. A", "Avd. B", "Avd. C", "Avd. D"]}
        series={[
          { name: "feb", values: [6.2, 4.9, 7.3, 5.6], color: YEAR_COLORS[0] },
          { name: "mars", values: [5.4, 5.1, 6.8, 4.9], color: YEAR_COLORS[1] },
          { name: "april", values: [5.8, 4.7, 7.0, 5.3], color: YEAR_COLORS[2] },
        ]}
        yMax={8}
        marks={[{ category: 3, series: 1 }]}
        note="Avd. D i mars: 4,9 % – lägst"
        suffix=" %"
      />
      <Legend
        items={[
          { name: "feb", color: YEAR_COLORS[0] },
          { name: "mars", color: YEAR_COLORS[1] },
          { name: "april", color: YEAR_COLORS[2] },
        ]}
      />
    </>
  ),

  // DTK — kostnadsfördelning
  "dtk-8": () => (
    <GroupedBars
      label="Kostnader 2023 i miljoner kronor, med materials andel markerad"
      categories={["Personal", "Material", "Lokaler", "Övrigt"]}
      series={[{ name: "Miljoner kr", values: [12, 8, 4, 6], color: "var(--lagoon-ink)" }]}
      yMax={14}
      marks={[{ category: 1, series: 0 }]}
      note="Material: 8 av 30 ≈ 27 %"
    />
  ),

  // KVA — jämförelser där bilden visar varför svaret blir vad det blir
  "kva-1": () => (
    <FractionBar
      label="3/4 av en helhet är 0,75 – exakt samma tal som kvantitet II"
      rows={[{ text: "3/4", parts: 4, filled: 3 }]}
      note="3 av 4 delar = 0,75 = 75 %"
    />
  ),
  "kva-5": () => (
    <RectangleSketch
      label="Kvadrat med sidan 5, area 25 m²"
      widthText="5"
      heightText="5"
      areaText="5 × 5 = 25"
      box={{ w: 130, h: 130 }}
    />
  ),
  "kva-3": () => (
    <LinePlot
      label="Kvantitet I (2x) och kvantitet II (x + 3) korsar varandra vid x = 3"
      xMax={8}
      yMax={12}
      lines={[
        { name: "2x", color: "var(--brand)", points: [[0, 0], [6, 12]] },
        { name: "x + 3", color: "var(--lagoon-ink)", points: [[0, 3], [8, 11]] },
      ]}
      point={{ x: 3, y: 6, text: "x = 3 ger lika" }}
    />
  ),
  "kva-4": () => (
    <ShareBars
      label="15 % av 80 och 20 % av 60 ger båda värdet 12"
      bars={[
        { text: "15 % av 80", value: 12, note: "= 12" },
        { text: "20 % av 60", value: 12, note: "= 12" },
      ]}
    />
  ),
  "kva-6": () => (
    <NumberLine
      label="( −3 )² blir +9, medan kvantitet II är −9"
      min={-10}
      max={10}
      ticks={[-10, -5, 0, 5, 10]}
      points={[
        { value: -9, text: "II: −9", color: "var(--destructive)" },
        { value: 9, text: "I: (−3)² = 9", color: "var(--brand)" },
      ]}
      format={(value) => String(value)}
    />
  ),
  "kva-7": () => (
    <NumberLine
      label="Tal som avrundas till 7,4 ligger i intervallet 7,35 till strax under 7,45"
      min={7.3}
      max={7.5}
      ticks={[7.3, 7.35, 7.4, 7.45, 7.5]}
      interval={{ from: 7.35, to: 7.45, text: "avrundas till 7,4" }}
      points={[{ value: 7.35, text: "II: 7,35", color: "var(--destructive)" }]}
      format={(value) => value.toFixed(2).replace(".", ",")}
    />
  ),

  "kva-8": () => (
    <FractionBar
      label="1/2 + 1/3 skrivs om i sjättedelar: 3/6 + 2/6 = 5/6"
      rows={[
        { text: "1/2 = 3/6", parts: 6, filled: 3 },
        { text: "1/3 = 2/6", parts: 6, filled: 2 },
        { text: "summa = 5/6", parts: 6, filled: 5 },
      ]}
      note="5/6 – lika stort som kvantitet II"
    />
  ),

  // XYZ — geometri och skalor
  "xyz-1": () => (
    <RectangleSketch label="Rektangel 6 m × 4 m, area 24 m²" widthText="6 m" heightText="4 m" areaText="6 × 4 = 24 m²" />
  ),
  "xyz-5": () => (
    <Figure label="Triangel med basen 10 cm och höjden 6 cm, area 30 cm²">
      <polygon points="120,180 400,180 260,72" fill="var(--accent-soft)" stroke="var(--brand)" strokeWidth="2" />
      <line x1="260" y1="72" x2="260" y2="180" stroke="var(--ink-muted)" strokeDasharray="4 3" />
      <text x="260" y="200" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">
        bas 10 cm
      </text>
      <text x="272" y="130" fontSize="12" fill="var(--ink-muted)">
        höjd 6 cm
      </text>
      <text x="260" y="150" textAnchor="middle" fontSize="13" fontWeight={600} fill="var(--ink)">
        (10 × 6) / 2 = 30 cm²
      </text>
    </Figure>
  ),
  "xyz-8": () => (
    <Figure label="4 cm på kartan motsvarar 2 km i verkligheten vid skalan 1:50 000">
      <rect x="80" y="70" width="90" height="24" rx="3" fill="var(--accent-soft)" stroke="var(--brand)" />
      <text x="125" y="87" textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--ink)">
        4 cm
      </text>
      <text x="190" y="87" fontSize="12" fill="var(--ink-muted)">
        på kartan
      </text>
      <text x="80" y="130" fontSize="12" fill="var(--ink)">
        4 × 50 000 = 200 000 cm
      </text>
      <text x="80" y="152" fontSize="12" fill="var(--ink)">
        200 000 cm = 2 000 m =
      </text>
      <text x="80" y="174" fontSize="14" fontWeight={700} fill="var(--brand)">
        2 km
      </text>
    </Figure>
  ),

  "xyz-2": () => (
    <PercentBar
      label="Sänkningen 20 % av 250 kr är 50 kr, varan kostar då 200 kr"
      totalText="250 kr = 100 %"
      percent={20}
      partText="20 % = 50 kr"
      restText="kvar: 200 kr"
      note="250 − 50 = 200 kr"
    />
  ),
  "xyz-6": () => (
    <PercentBar
      label="Räntan 5 % av 8 000 kr är 400 kr, skulden blir 8 400 kr"
      totalText="8 000 kr = 100 %"
      percent={5}
      partText="5 % = 400 kr"
      restText="8 000 kr"
      note="8 000 + 400 = 8 400 kr"
    />
  ),
  "xyz-7": () => (
    <GroupedBars
      label="Medelvärdet 10 kräver summan 40: 4 + 8 + 12 = 24, så det fjärde talet är 16"
      categories={["4", "8", "12", "16"]}
      series={[{ name: "Tal", values: [4, 8, 12, 16], color: "var(--lagoon-ink)" }]}
      yMax={20}
      marks={[{ category: 3, series: 0 }]}
      note="4 × 10 − 24 = 16"
      reference={{ value: 10, text: "medelvärde 10" }}
    />
  ),

  // NOG — grafen visar varför båda påståendena behövs
  "nog-3": () => (
    <RectangleSketch
      label="Omkretsen 24 cm ger bredden 4 cm när längden är 8 cm, area 32 cm²"
      widthText="längd 8 cm"
      heightText="bredd 4 cm"
      areaText="8 × 4 = 32 cm²"
      box={{ w: 240, h: 120 }}
    />
  ),
  "nog-4": () => (
    <NumberLine
      label="k² = 16 ger både k = 4 och k = −4, så tecknet avgörs först av påstående (2)"
      min={-6}
      max={6}
      ticks={[-6, -4, -2, 0, 2, 4, 6]}
      points={[
        { value: -4, text: "k = −4, inte positivt", color: "var(--destructive)" },
        { value: 4, text: "k = 4, positivt", color: "var(--brand)" },
      ]}
      format={(value) => String(value)}
    />
  ),
  "nog-6": () => (
    <PercentBar
      label="40 % av klassen är 12 flickor, alltså är hela klassen 30 elever"
      totalText="hela klassen = 100 %"
      percent={40}
      partText="40 % = 12 flickor"
      restText="60 % = 18 pojkar"
      note="12 / 0,4 = 30 elever"
    />
  ),
  "nog-8": () => (
    <LinePlot
      label="Linjen y = 2x + 1 med punkten (3, 7) markerad"
      xMax={5}
      yMax={12}
      lines={[{ name: "y = 2x + 1", color: "var(--brand)", points: [[0, 1], [5, 11]] }]}
      point={{ x: 3, y: 7, text: "(3, 7): 2 · 3 + 1 = 7" }}
    />
  ),
};

/** Bildförklaring till facit, eller null när frågan inte har någon. */
export function ExplainFigure({ questionId }: { questionId: string }) {
  const figure = FIGURES[questionId];
  if (!figure) return null;
  return <>{figure()}</>;
}

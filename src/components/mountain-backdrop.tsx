/**
 * Sidans bakgrund (Oscar, 2026-11-09): en vandrare snett bakifrån på en stig
 * uppför loggans berg, med kabinbanan ovanför. Ligger stilla längst ner bakom
 * innehållet, i dämpade toner av temats färger, så den följer ljust och mörkt
 * läge. Dekorativ och utan klick.
 */

/** Loggans berg (hörnen i 64-rutnätet, se LogoMark) skalat till scenen 1600×900. */
export const LOGO_MOUNTAIN_POINTS: ReadonlyArray<readonly [number, number]> = [
  [-6, 50], [1, 46], [7, 51], [13, 43], [18, 47], [43, 21], [47, 27], [50, 24], [66, 42],
];
const SCALE = 22;
const OFFSET: readonly [number, number] = [104, -262];
const toScene = ([x, y]: readonly [number, number]) => `${x * SCALE + OFFSET[0]} ${y * SCALE + OFFSET[1]}`;
export const MOUNTAIN_PATH = `M-40 900L${LOGO_MOUNTAIN_POINTS.map(toScene).join("L")}L1640 900Z`;

// Stigen nedifrån och upp; varje del smalnar av så att den försvinner mot toppen.
const TRAIL = [
  [830, 900], [748, 838], [706, 770], [752, 716], [830, 668], [808, 606],
  [868, 548], [930, 486], [904, 430], [958, 366], [1004, 300], [1040, 236],
] as const;
const trailSegments = TRAIL.slice(0, -1).map((p1, i) => {
  const p0 = TRAIL[Math.max(i - 1, 0)];
  const p2 = TRAIL[i + 1];
  const p3 = TRAIL[Math.min(i + 2, TRAIL.length - 1)];
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
  const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
  return { d: `M${p1} C${c1} ${c2} ${p2}`, width: Math.round(34 * 0.78 ** i * 10) / 10 };
});

const tint = (percent: number) => `color-mix(in oklab, var(--brand) ${percent}%, var(--paper))`;

export function MountainBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] -z-10 h-[min(60vh,56.25vw)] opacity-55 md:bottom-0 md:left-60 dark:opacity-45 print:hidden"
    >
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" focusable="false" className="size-full">
        <path
          d="M0 650 L120 570 L210 618 L330 520 L430 590 L520 556 L620 620 L1300 600 L1390 450 L1470 512 L1540 466 L1600 520 L1600 900 L0 900Z"
          style={{ fill: tint(10) }}
        />
        <path d={MOUNTAIN_PATH} style={{ fill: tint(22) }} />
        <path
          d="M0 812 C 300 772, 560 780, 760 806 C 1000 838, 1300 826, 1600 786 L1600 900 L0 900Z"
          style={{ fill: tint(34) }}
        />
        <g fill="none" strokeLinecap="round" style={{ stroke: "var(--paper)" }}>
          {trailSegments.map((s) => (
            <path key={s.d} d={s.d} strokeWidth={s.width} />
          ))}
        </g>
        {/* Linan upp till toppstationen, med en mast på vägen. */}
        <path d="M-40 575 L1052 196" strokeWidth={3} style={{ stroke: tint(70) }} />
        <g strokeWidth={4} strokeLinecap="round" style={{ stroke: tint(55) }}>
          <path d="M820 452 L828 262" />
          <path d="M806 282 L846 268" />
          <path d="M810 452 L842 452" />
        </g>
        <path d="M1034 214 h36 v-22 h-36z" style={{ fill: tint(55) }} />
        {/* Kabinen, ovanför vandraren. */}
        <g transform="translate(600 316)">
          <path d="M12 0 v18" strokeWidth={4} strokeLinecap="round" className="stroke-primary" />
          <rect x="-22" y="16" width="68" height="60" rx="14" className="fill-primary" />
          <rect x="-13" y="26" width="50" height="20" rx="6" style={{ fill: "var(--paper)" }} />
        </g>
        {/* Vandraren snett bakifrån: stav, ben i steg, kropp, ryggsäck och mössa. */}
        <g transform="translate(712 606)">
          <g fill="none" strokeLinecap="round" style={{ stroke: "var(--ink)" }}>
            <path d="M70 120 L102 232" strokeWidth={5} />
            <path d="M18 150 C 14 185, 8 205, 4 232" strokeWidth={20} />
            <path d="M44 150 C 50 172, 56 186, 60 206" strokeWidth={20} />
            <path d="M58 86 C 70 100, 72 112, 70 122" strokeWidth={12} />
          </g>
          <path d="M8 70 C 6 110, 10 140, 18 160 L54 160 C 62 140, 64 110, 60 70 Z" style={{ fill: "var(--ink)" }} />
          <rect x="0" y="62" width="56" height="78" rx="16" className="fill-primary" />
          <rect x="8" y="102" width="40" height="26" rx="8" style={{ fill: "var(--paper)", opacity: 0.25 }} />
          <circle cx="36" cy="46" r="20" style={{ fill: "var(--ink)" }} />
          <path d="M16 42 C 18 22, 54 20, 56 40 Z" className="fill-primary" />
        </g>
      </svg>
    </div>
  );
}

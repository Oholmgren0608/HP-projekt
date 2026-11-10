/**
 * Sidans bakgrund (Oscar, 2026-11-09): en vandrare snett bakifrån på en stig
 * uppför loggans berg, med kabinbanan ovanför. Ligger stilla längst ner bakom
 * innehållet, i dämpade toner av temats färger, så den följer ljust och mörkt
 * läge. Dekorativ och utan klick.
 */

/** Loggans berg (hörnen i 64-rutnätet, se LogoMark) skalat till scenens mitt (0–1600 × 0–900). */
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
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] -z-10 h-[max(min(60vh,56.25vw),29vw)] opacity-55 md:bottom-0 md:left-60 dark:opacity-45 print:hidden"
    >
      {/* Scenen är bredare än den syns, så att den bara beskärs i sidled: bergstoppen ryms alltid. */}
      <svg viewBox="-800 0 3200 900" preserveAspectRatio="xMidYMax slice" focusable="false" className="size-full">
        <path
          d="M-800 640 L-690 580 L-600 610 L-470 520 L-360 600 L-250 560 L-130 610 L0 650 L120 570 L210 618 L330 520 L430 590 L520 556 L620 620 L1300 600 L1390 450 L1470 512 L1540 466 L1600 520 L1700 480 L1800 560 L1930 470 L2040 548 L2160 500 L2280 580 L2400 540 V900 H-800 Z"
          style={{ fill: tint(10) }}
        />
        <path d={MOUNTAIN_PATH} style={{ fill: tint(22) }} />
        <path
          d="M-800 800 C -500 780, -200 790, 0 812 C 300 772, 560 780, 760 806 C 1000 838, 1300 826, 1600 786 C 1900 760, 2200 790, 2400 800 V900 H-800 Z"
          style={{ fill: tint(34) }}
        />
        <g fill="none" strokeLinecap="round" style={{ stroke: "var(--paper)" }}>
          {trailSegments.map((s) => (
            <path key={s.d} d={s.d} strokeWidth={s.width} />
          ))}
        </g>
        {/* Linan från dalstationen upp till toppstationen strax under toppen, med en mast på vägen. */}
        <path d="M-600 760 L1003 238" strokeWidth={3} style={{ stroke: tint(70) }} />
        <rect x="-622" y="752" width="44" height="30" rx="3" style={{ fill: tint(55) }} />
        <g strokeWidth={4} strokeLinecap="round" style={{ stroke: tint(55) }}>
          <path d="M820 452 L824 300" />
          <path d="M804 306 L844 293" />
          <path d="M810 452 L838 452" />
        </g>
        <rect x="986" y="236" width="34" height="24" rx="3" style={{ fill: tint(55) }} />
        {/* Kabinen, ovanför vandraren. */}
        <g transform="translate(600 365)">
          <path d="M12 0 v18" strokeWidth={4} strokeLinecap="round" className="stroke-primary" />
          <rect x="-22" y="16" width="68" height="60" rx="14" className="fill-primary" />
          <rect x="-13" y="26" width="50" height="20" rx="6" style={{ fill: "var(--paper)" }} />
        </g>
        <Hiker />
      </svg>
    </div>
  );
}

const shade = (percent: number) => `color-mix(in oklab, var(--brand) ${percent}%, var(--ink))`;

/**
 * Vandraren snett bakifrån, på väg uppför stigen: ungefär 7,5 huvuden lång,
 * med jacka, ryggsäck (lock, ficka, höftbälte), byxor, vandringskängor och två stavar.
 * Ritad med fötterna i origo.
 */
function Hiker() {
  const ink = { fill: "var(--ink)" };
  const jacket = shade(45);
  return (
    <g transform="translate(744 842)">
      <g strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--ink)" }}>
        <path d="M-30 -116 L-42 -4" />
        <path d="M38 -128 L54 -2" />
      </g>
      {/* Byxor: vänster ben bakåt, höger ben ett steg uppför. */}
      <path
        d="M-22 -106 C -24 -88, -22 -70, -21 -60 C -20 -48, -21 -36, -17 -16 L -7 -16 C -7 -32, -6 -46, -5 -60 C -4 -74, -2 -88, 0 -96 C 2 -88, 6 -76, 9 -66 C 10 -54, 11 -44, 11 -34 L 21 -34 C 24 -48, 26 -58, 26 -68 C 26 -84, 24 -96, 22 -106 Z"
        style={ink}
      />
      <Boot transform="translate(-12 0) scale(1.15)" />
      <Boot transform="translate(16 -22) scale(1.05)" />
      <path
        d="M-27 -191 C -18 -201, -9 -203, 0 -203 C 9 -203, 18 -201, 27 -191 C 27 -168, 25 -148, 21 -122 L 23 -100 L -23 -100 L -21 -122 C -25 -148, -27 -168, -27 -191 Z"
        style={{ fill: jacket }}
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: jacket }}>
        <path d="M-23 -184 L-31 -150" strokeWidth={12} />
        <path d="M-31 -150 L-30 -119" strokeWidth={10} />
        <path d="M23 -184 L33 -154" strokeWidth={12} />
        <path d="M33 -154 L38 -131" strokeWidth={10} />
      </g>
      <circle cx="-30" cy="-115" r="5.5" style={ink} />
      <circle cx="38" cy="-127" r="5.5" style={ink} />
      {/* Ryggsäck med sidopanel åt höger, eftersom vi ser vandraren snett bakifrån. */}
      <rect x="15" y="-194" width="10" height="76" rx="5" style={{ fill: shade(75) }} />
      <rect x="-23" y="-198" width="43" height="82" rx="12" className="fill-primary" />
      <rect x="-20" y="-209" width="39" height="17" rx="8" style={{ fill: shade(80) }} />
      <rect x="-15" y="-158" width="28" height="30" rx="7" style={{ fill: "var(--paper)", opacity: 0.22 }} />
      <rect x="-27" y="-123" width="53" height="8" rx="4" style={{ fill: shade(70) }} />
      <rect x="-3" y="-210" width="11" height="7" rx="3" style={ink} />
      <ellipse cx="3" cy="-220" rx="12.5" ry="14" style={ink} />
      <path d="M-10.5 -221 C -10.5 -234, -4 -239, 3 -239 C 10 -239, 16.5 -234, 16.5 -221 Z" className="fill-primary" />
      <rect x="-11.5" y="-225" width="29" height="6" rx="3" style={{ fill: shade(80) }} />
    </g>
  );
}

/**
 * En vandringskänga snett bakifrån med tån i gångriktningen: högt skaft med
 * vadderad krage och dragögla, snörning, gummitå och grov sula med klack.
 * Ankelns mitt i origo, sulan mot y = 0.
 */
function Boot({ transform }: { transform: string }) {
  const trim = { fill: shade(85) };
  return (
    <g transform={transform}>
      <rect x="-1.5" y="-38" width="3" height="7" rx="1.5" style={trim} />
      <path
        d="M-8 -31 C -9.5 -24, -10 -16, -10.5 -11 C -10.8 -8.5, -10.5 -7, -10 -6 L 16 -6 C 17 -9, 15 -12, 12 -15 C 9.5 -18, 8.5 -23, 8.5 -31 Z"
        style={{ fill: shade(60) }}
      />
      <g strokeWidth={1.4} strokeLinecap="round" style={{ stroke: shade(85) }}>
        <path d="M6.5 -27 L9.8 -26" />
        <path d="M7.3 -22.5 L10.6 -21.5" />
        <path d="M8.6 -18 L11.9 -17" />
      </g>
      <rect x="-9" y="-34" width="18.5" height="5" rx="2.5" style={trim} />
      <path d="M8 -6 C 9 -11, 12 -13, 14 -12 C 16 -10, 17 -8, 16 -6 Z" style={{ fill: "var(--ink)" }} />
      <path
        d="M-11 -6.5 L 17 -6.5 C 18.5 -6.5, 18.5 -3, 17.5 -1.5 L 16 0 L 13 1.6 L 10 0 L 7 1.6 L 4.5 0 L 3 0 L 2 -1.5 L 0 -1.5 L -1 0 L -3 1.6 L -6 0 L -9 1.6 C -11.5 1, -12 -6.5, -11 -6.5 Z"
        style={{ fill: "var(--ink)" }}
      />
    </g>
  );
}

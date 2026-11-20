/**
 * Sidans bakgrund (Oscar, 2026-11-09; klättraren på K2, 2026-11-20): en
 * bergsklättrare i profil som frontar uppför ett brant isparti med två
 * isyxor, och bakom klättraren ett berg format efter K2 sett från Concordia, med
 * toppfältet, serac-bandet, flaskhalsen och axeln. Berget är ritat som
 * platta ytor i solsken och skugga (ljuset från vänster), utan övertoningar.
 * Ligger stilla längst ner bakom innehållet i dämpade toner av temats färger,
 * så den följer ljust och mörkt läge. Dekorativ och utan klick.
 */

const tint = (percent: number) => `color-mix(in oklab, var(--brand) ${percent}%, var(--paper))`;

// Tonerna sätts per läge i globals.css (.mountain-scene), så att solsidan är ljusast i båda lägena.
const ROCK_LIT = { fill: "var(--rock-lit)" };
const ROCK_SHADE = { fill: "var(--rock-shade)" };
const ROCK_DEEP = { fill: "var(--rock-deep)" };
const SNOW = { fill: "var(--snow)" };
const SNOW_SHADE = { fill: "var(--snow-shade)" };

/** K2:s siluett: topp, vänster egg ner mot väster och den sydöstra eggen (Abruzzi) med axeln till höger. */
export const K2_SUMMIT: readonly [number, number] = [1100, 104];
const K2 =
  "M160 900 L380 760 L560 640 L640 590 L700 536 L752 480 L800 428 L838 392 L872 352 L904 318 L930 282 L948 266 L976 226 L1012 182 L1040 150 L1070 126 L1100 104 L1126 124 L1156 158 L1182 192 L1204 222 L1228 240 L1270 254 L1308 268 L1334 284 L1366 324 L1412 382 L1460 434 L1520 494 L1600 560 L1700 640 L1820 720 V900 H160 Z";

// Solsidan: allt till vänster om den mittre ryggen som går rakt ner från toppen.
const K2_LIT =
  "M160 900 L380 760 L560 640 L640 590 L700 536 L752 480 L800 428 L838 392 L872 352 L904 318 L930 282 L948 266 L976 226 L1012 182 L1040 150 L1070 126 L1100 104 L1094 168 L1084 214 L1088 262 L1070 320 L1076 380 L1054 452 L1060 520 L1034 600 L1040 700 L1000 900 H160 Z";

// Sidoryggar och klippband i djup skugga, som delar upp väggarna.
const K2_RIBS = [
  "M1100 104 L1094 168 L1084 214 L1088 262 L1070 320 L1076 380 L1054 452 L1060 520 L1034 600 L1040 700 L1052 700 L1052 600 L1074 520 L1070 452 L1090 380 L1084 320 L1100 262 L1098 214 L1106 168 Z",
  "M1204 222 L1196 262 L1206 300 L1188 352 L1198 410 L1178 470 L1186 540 L1196 540 L1194 470 L1214 410 L1206 352 L1222 300 L1214 262 Z",
  "M1334 284 L1320 340 L1330 400 L1312 470 L1322 470 L1344 400 L1336 340 L1348 300 Z",
  "M948 266 L964 310 L956 360 L972 420 L962 480 L970 480 L984 420 L970 360 L978 310 Z",
];

// Toppfältet: den breda snöhättan, lite skev, som rinner ner över solsidan.
const K2_SUMMIT_SNOW =
  "M1100 104 L1126 124 L1150 152 L1136 160 L1120 154 L1102 170 L1090 160 L1068 176 L1050 168 L1032 186 L1018 180 L1040 150 L1070 126 Z";
// Serac-bandet under toppfältet på skuggsidan: snö ovanpå, en lodrät isvägg under.
const K2_SERAC_TOP = "M1120 154 L1136 160 L1150 152 L1172 180 L1162 186 L1140 182 L1118 178 Z";
const K2_SERAC_WALL = "M1118 178 L1140 182 L1162 186 L1172 180 L1170 196 L1150 200 L1132 196 L1118 192 Z";
// Flaskhalsen: den smala snörännan från seracen ner mot axeln.
const K2_BOTTLENECK = "M1150 200 L1166 198 L1184 226 L1196 244 L1186 248 L1170 228 Z";
// Axeln: det flackare snöfältet på eggen till höger.
const K2_SHOULDER = "M1196 244 L1228 240 L1270 254 L1308 268 L1334 284 L1316 290 L1284 278 L1252 276 L1224 266 L1204 262 Z";
// Snörännor och snöfält nere på väggarna, i sol till vänster och skugga till höger.
const K2_SNOW_LIT = [
  "M1018 180 L1032 186 L1026 214 L1036 250 L1018 236 L1006 206 Z",
  "M976 226 L990 236 L984 262 L994 292 L978 284 L966 250 Z",
  "M904 318 L924 322 L916 352 L930 384 L910 380 L896 346 Z",
  "M1090 160 L1102 170 L1096 196 L1100 226 L1088 214 L1084 186 Z",
  "M1040 260 L1050 266 L1044 320 L1052 380 L1040 440 L1030 436 L1036 380 L1030 320 Z",
  "M990 330 L1000 336 L994 380 L1004 430 L990 470 L982 466 L986 430 L978 380 Z",
];
const K2_SNOW_SHADE = [
  "M1130 230 L1140 236 L1136 290 L1146 350 L1134 410 L1124 404 L1130 350 L1122 290 Z",
  "M1256 290 L1266 294 L1262 340 L1272 400 L1258 450 L1250 446 L1254 400 L1246 340 Z",
  "M1150 420 L1160 424 L1156 470 L1164 520 L1150 560 L1144 556 L1146 520 L1140 470 Z",
  "M1380 340 L1390 350 L1386 390 L1396 430 L1384 440 L1376 400 Z",
];

// Bergskedjan bakom K2, blekare för att den ligger längre bort: Broad Peak-liknande toppar till höger.
const FAR_RANGE =
  "M-800 640 L-690 560 L-610 600 L-500 500 L-420 552 L-330 520 L-240 590 L-120 560 L0 620 L120 548 L200 584 L300 500 L360 470 L420 520 L500 560 L620 640 L1500 600 L1580 470 L1620 452 L1660 482 L1700 446 L1740 470 L1790 440 L1850 500 L1930 470 L2040 548 L2160 488 L2280 560 L2400 520 V900 H-800 Z";
const FAR_SNOW = [
  "M-526 518 L-500 500 L-470 520 L-480 522 L-490 532 L-500 522 L-512 530 Z",
  "M330 486 L360 470 L392 494 L380 496 L368 508 L356 494 L344 504 Z",
  "M1600 461 L1620 452 L1640 466 L1630 470 L1620 480 L1610 468 Z",
  "M1680 456 L1700 446 L1720 458 L1712 462 L1702 470 L1692 460 Z",
  "M1772 450 L1790 440 L1810 454 L1800 458 L1792 466 L1782 456 Z",
  "M2140 498 L2160 488 L2186 504 L2172 506 L2162 516 L2152 504 Z",
];

/**
 * Isbranten som klättraren är på väg uppför, 62 grader som eggen i loggan, och eggen som
 * fortsätter till höger. Klättrarens bakre fot står på branten.
 */
export const ICE_FACE: ReadonlyArray<readonly [number, number]> = [[619, 900], [848, 470]];
export const CLIMBER_FOOT: readonly [number, number] = [640, 860];
const RIDGE_CREST =
  "M848 470 L872 462 L904 470 L960 486 L1060 510 L1200 540 L1360 566 L1540 604 L1760 650 L2000 690 L2400 740";
const LOW_GROUND = `M-800 872 L-500 856 L-200 874 L100 862 L380 884 L560 890 L${ICE_FACE[0]}`;
const ICE_STEP = `M${ICE_FACE[0]} L${RIDGE_CREST.slice(1)} V900 Z`;
// Eggens solbelysta snöyta ovanpå, och klippor som sticker ut ur skuggsidan.
const RIDGE_SNOW_TOP = `${RIDGE_CREST} L2400 762 L2000 716 L1760 678 L1540 634 L1360 600 L1200 576 L1060 550 L960 530 L904 516 Z`;
const RIDGE_ROCKS = [
  "M920 600 L946 566 L988 556 L1036 572 L1072 612 L1060 640 L1010 628 L968 640 Z",
  "M1180 652 L1214 616 L1262 606 L1316 624 L1352 664 L1300 676 L1244 670 Z",
  "M1540 710 L1580 680 L1640 676 L1700 700 L1722 736 L1650 740 L1590 734 Z",
  "M2020 768 L2060 744 L2120 742 L2170 766 L2110 780 Z",
  "M-430 900 L-404 872 L-360 864 L-318 884 L-306 900 Z",
  "M170 900 L198 874 L240 868 L282 886 L290 900 Z",
];
// Klippornas solsida, ett plan uppe till vänster på varje klippa.
const RIDGE_ROCK_LIT = [
  "M920 600 L946 566 L988 556 L976 590 L950 606 Z",
  "M1180 652 L1214 616 L1262 606 L1246 640 L1214 656 Z",
  "M1540 710 L1580 680 L1640 676 L1620 706 L1584 716 Z",
  "M2020 768 L2060 744 L2120 742 L2094 762 L2058 772 Z",
];
// Rännor i isen längs branten, och istappar under eggens snökant (gesims).
const ICE_STREAKS = ["M668 828 L770 636", "M700 842 L796 662", "M736 856 L816 706", "M698 760 L756 650"];
const CORNICE_ICICLES = "M848 470 L872 462 L904 470 L900 480 L894 476 L888 486 L882 476 L874 484 L866 474 L858 480 Z";

// Ett platt moln med rak undersida (bredd ca 240), och var molnen ligger på himlen.
const CLOUD =
  "M0 0 C-22 0 -30 -32 -6 -40 C-6 -68 30 -82 54 -66 C70 -98 124 -100 140 -64 C160 -80 196 -70 196 -44 C222 -46 236 -20 226 0 Z";
const CLOUDS: ReadonlyArray<readonly [number, number, number]> = [
  [-560, 190, 0.9], [260, 220, 1], [1560, 230, 1.1], [2000, 170, 0.8],
];
// Molnfanan som blåser av K2:s topp åt höger, som den ofta gör i hård vind.
const PLUME = "M1104 110 C1130 92 1180 88 1240 96 C1300 104 1360 100 1420 92 C1380 112 1320 120 1250 118 C1190 116 1150 124 1126 128 Z";

export function MountainBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="mountain-scene pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] -z-10 h-[max(min(60vh,56.25vw),29vw)] opacity-55 md:bottom-0 md:left-60 dark:opacity-45 print:hidden"
    >
      {/* Scenen är bredare än den syns, så att den bara beskärs i sidled: bergstoppen ryms alltid. */}
      <svg viewBox="-800 0 3200 900" preserveAspectRatio="xMidYMax slice" focusable="false" className="size-full">
        <g style={{ fill: tint(12) }}>
          {CLOUDS.map(([x, y, scale]) => (
            <path key={`${x} ${y}`} d={CLOUD} transform={`translate(${x} ${y}) scale(${scale})`} />
          ))}
        </g>
        <path d={FAR_RANGE} style={{ fill: "var(--far)" }} />
        <g style={{ fill: "var(--far-snow)" }}>
          {FAR_SNOW.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {/* K2 är ritat med toppen i (1100, 104) och förstoras här kring toppen. */}
        <g transform={`translate(${K2_SUMMIT[0] + 10} ${K2_SUMMIT[1] - 28}) scale(1.16) translate(${-K2_SUMMIT[0]} ${-K2_SUMMIT[1]})`}>
        <path d={PLUME} style={{ fill: tint(12) }} />
        <path d={K2} style={ROCK_SHADE} />
        <path d={K2_LIT} style={ROCK_LIT} />
        <g style={ROCK_DEEP}>
          {K2_RIBS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g style={SNOW}>
          <path d={K2_SUMMIT_SNOW} />
          {K2_SNOW_LIT.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g style={SNOW_SHADE}>
          <path d={K2_SERAC_TOP} />
          <path d={K2_BOTTLENECK} />
          <path d={K2_SHOULDER} />
          {K2_SNOW_SHADE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={K2_SERAC_WALL} style={ROCK_DEEP} />
        </g>
        {/* Förgrunden: eggen med isbranten, i snö med klippor. */}
        <path d={`${LOW_GROUND} V900 H-800 Z`} style={SNOW_SHADE} />
        <path d={ICE_STEP} style={SNOW_SHADE} />
        <path d={RIDGE_SNOW_TOP} style={SNOW} />
        <g style={{ fill: "var(--rock-near)" }}>
          {RIDGE_ROCKS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g style={ROCK_SHADE}>
          {RIDGE_ROCK_LIT.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={CORNICE_ICICLES} style={SNOW} />
        <g fill="none" strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--ice-line)" }}>
          {ICE_STREAKS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {/* Konturen längs branten och eggen, så att snön syns även mot ljus himmel. */}
        <path
          d={`${LOW_GROUND} L${RIDGE_CREST.slice(1)}`}
          fill="none"
          strokeWidth={4}
          strokeLinejoin="round"
          style={{ stroke: "var(--ice-line)" }}
        />
        <Climber />
      </svg>
    </div>
  );
}

const shade = (percent: number) => `color-mix(in oklab, var(--brand) ${percent}%, var(--ink))`;
// Det som är på klättrarens bortre sida (arm, ben, yxa) dras mot bakgrunden, så att kroppen får djup.
const far = (percent: number) => `color-mix(in oklab, var(--brand) ${percent}%, var(--paper))`;

/**
 * Klättraren i profil, vänd åt höger mot isen, med fötterna i stegjärnen och
 * en yxa i varje hand: hjälm med glasögon, dunoverall, sele med repet till en
 * isskruv nedanför, ryggsäck, vantar och dubbla kängor. Ungefär 7,5 huvuden
 * lång. Ritad med den bakre fotens framtaggar i origo, mot en 62-gradig brant.
 */
function Climber() {
  const ink = { fill: "var(--ink)" };
  const suit = "var(--brand)";
  const suitFar = far(72);
  return (
    <g transform={`translate(${CLIMBER_FOOT}) scale(1.25)`}>
      {/* Bortre armen och den nedre yxan. */}
      <IceAxe transform="translate(66 -142) rotate(28)" color={far(55)} />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: suitFar }}>
        <path d="M30 -174 L34 -126" strokeWidth={15} />
        <path d="M34 -126 L64 -140" strokeWidth={13} />
      </g>
      <circle cx="66" cy="-142" r="7" style={{ fill: far(40) }} />

      {/* Bortre benet, sträckt nedåt mot isen. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: suitFar }}>
        <path d="M-2 -110 L-8 -58" strokeWidth={21} />
        <path d="M-8 -58 L-18 -16" strokeWidth={18} />
      </g>
      <Boot transform="translate(-20 -8) rotate(-8)" color="color-mix(in oklab, var(--ink) 55%, var(--paper))" />

      {/* Repet från selen i en slak båge ner till isskruven och vidare ut ur bilden. */}
      <path
        d="M10 -104 C -18 -72, -34 -24, -30 6 C -28 20, -24 28, -21 32 C -26 60, -38 90, -50 124"
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ stroke: shade(30) }}
      />
      <path d="M-20 30 L-10 28" strokeWidth={4} strokeLinecap="round" style={{ stroke: "var(--ink)" }} />
      <ellipse cx="-22" cy="34" rx="3.5" ry="6" fill="none" strokeWidth={2} style={{ stroke: "var(--ink)" }} />

      {/* Ryggsäck på ryggen, lutad som kroppen. */}
      <g transform="rotate(27 2 -150)">
        <rect x="-26" y="-190" width="30" height="78" rx="10" style={{ fill: shade(55) }} />
        <rect x="-24" y="-200" width="26" height="16" rx="7" style={{ fill: shade(70) }} />
        <rect x="-20" y="-150" width="6" height="30" rx="3" style={{ fill: "var(--paper)", opacity: 0.25 }} />
      </g>

      {/* Bålen i dunoverall, med tvärgående sömmar. */}
      <path
        d="M-16 -100 C -14 -128, 4 -164, 20 -188 C 30 -194, 46 -190, 52 -180 C 46 -152, 30 -124, 18 -100 C 10 -94, -8 -94, -16 -100 Z"
        style={{ fill: suit }}
      />
      <g fill="none" strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--paper)", opacity: 0.3 }}>
        <path d="M-6 -126 L26 -116" />
        <path d="M4 -148 L36 -138" />
        <path d="M14 -170 L46 -160" />
      </g>

      {/* Selen: midjebälte och benslinga, med repets knut framtill. */}
      <path d="M-15 -104 L19 -104" strokeWidth={6} strokeLinecap="round" style={{ stroke: "var(--ink)" }} />
      <circle cx="10" cy="-104" r="4" fill="none" strokeWidth={2.5} style={{ stroke: shade(30) }} />

      {/* Närmre benet, högt steg upp mot isen. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: suit }}>
        <path d="M2 -108 L46 -104" strokeWidth={22} />
        <path d="M46 -104 L14 -64" strokeWidth={18} />
      </g>
      <path d="M-2 -104 L48 -102" strokeWidth={4} strokeLinecap="round" style={{ stroke: "var(--ink)", opacity: 0.8 }} />
      <Boot transform="translate(10 -60) rotate(-6)" color="var(--ink)" />

      {/* Huvudet: balaklava, hjälm med glasögon uppskjutna på pannan. */}
      <ellipse cx="50" cy="-198" rx="12" ry="13.5" style={ink} />
      <path d="M36 -199 C 36 -214, 44 -220, 52 -220 C 62 -220, 68 -212, 67 -199 Z" style={{ fill: shade(88) }} />
      <rect x="35" y="-202" width="33" height="4" rx="2" style={{ fill: shade(88) }} />
      <rect x="56" y="-212" width="12" height="7" rx="3" style={{ fill: "var(--paper)", opacity: 0.85 }} />

      {/* Närmre armen sträckt upp mot den övre yxan. */}
      <IceAxe transform="translate(102 -236) rotate(28)" color="var(--ink)" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: suit }}>
        <path d="M36 -176 L70 -208" strokeWidth={15} />
        <path d="M70 -208 L100 -233" strokeWidth={13} />
      </g>
      <circle cx="102" cy="-236" r="7.5" style={ink} />
    </g>
  );
}

/**
 * En teknisk isyxa: böjt skaft med grepp, hacka med tänder framåt (mot isen)
 * och hammare bakåt. Greppet i origo, skaftet uppåt.
 */
function IceAxe({ transform, color }: { transform: string; color: string }) {
  return (
    <g transform={transform}>
      <path d="M0 6 C 2 -14, -4 -36, 2 -62" fill="none" strokeWidth={4} strokeLinecap="round" style={{ stroke: color }} />
      <path d="M-4 8 L5 8 L4 2 L-3 2 Z" style={{ fill: color }} />
      <path
        d="M-6 -64 L4 -66 C 12 -64, 20 -58, 24 -48 L 21 -48 L 19 -51 L 17 -49 L 15 -53 L 13 -51 C 10 -57, 6 -60, 2 -60 L -6 -59 Z"
        style={{ fill: color }}
      />
    </g>
  );
}

/**
 * En dubbel högfjällskänga med damask och stegjärn: piggar under sulan och två
 * framtaggar som sticker ut framåt. Ankeln i origo, tån åt höger.
 */
function Boot({ transform, color }: { transform: string; color: string }) {
  return (
    <g transform={transform}>
      <path d="M-11 -20 L9 -20 C 10 -12, 12 -8, 20 -6 C 26 -4, 28 2, 26 6 L -14 6 C -15 -2, -13 -12, -11 -20 Z" style={{ fill: color }} />
      <rect x="-13" y="-24" width="24" height="7" rx="3" style={{ fill: color }} />
      <g strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--ink)" }}>
        <path d="M-14 9 L26 9" />
        <path d="M-11 9 L-12 14" />
        <path d="M-3 9 L-3 14" />
        <path d="M7 9 L7 14" />
        <path d="M16 9 L17 14" />
        <path d="M24 8 L33 9" />
        <path d="M24 5 L32 4" />
      </g>
    </g>
  );
}

/**
 * Riktiga tabeller, diagram och kartor till DTK-frågornas underlag.
 *
 * I frågebanken är underlaget ren text (`passage`), t.ex.
 * "Region A – 2014: 412 | 2024: 455". Här ligger samma uppgifter som
 * strukturerad figur, och `QuestionPassage` visar figuren i stället för texten.
 *
 * Nyckeln är ett fingeravtryck av själva texten, inte fråge-id:t. Då får alla
 * frågor som delar underlag samma figur (även kopior i databasen och äldre
 * frågor), och om någon ändrar texten på /review faller frågan automatiskt
 * tillbaka till texten i stället för att visa en figur som inte längre stämmer.
 *
 * Ny DTK-figur: kör `passageKey` på den nya texten och lägg till en post i
 * `FIGURES`. Värdena måste vara exakt desamma som i texten.
 */

export type SeriesData = { name: string; values: number[] };

export type FigurePart =
  | {
      kind: "table";
      title?: string;
      head: string[];
      rows: string[][];
      /** Sista raden är en summarad och skrivs i fetstil. */
      totalRow?: boolean;
    }
  | {
      kind: "columns" | "bars" | "line";
      title: string;
      categories: string[];
      series: SeriesData[];
      /** Axelns min, max och steg mellan stödlinjerna. */
      axis: { min?: number; max: number; step: number };
      decimals?: number;
    }
  | {
      kind: "pie";
      title?: string;
      slices: { name: string; value: number }[];
      unit: string;
    }
  | {
      kind: "map";
      title: string;
      /** Klassernas förklaring, klass 1 först. */
      classes: string[];
      /** Rubrik för `detail` i tabellen till skärmläsare, t.ex. "Landareal". */
      detailLabel?: string;
      regions: { name: string; detail?: string; cls: number; shape: RegionShape }[];
    }
  | { kind: "note"; text: string };

export type DtkFigureData = {
  title: string;
  intro?: string;
  parts: FigurePart[];
};

/** Kartans kommunformer, ritade i en ruta på 520 × 310. */
export type RegionShape = "nv" | "n" | "no" | "sv" | "s" | "so";

/** FNV-1a över texten med blanktecken hopslagna (databasen har ibland \r\n). */
export function passageKey(passage: string): string {
  const text = passage.replace(/\s+/g, " ").trim();
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

const CYKELRESOR: DtkFigureData = {
  title: "Andel cykelresor av alla resor (procent)",
  parts: [
    {
      kind: "columns",
      title: "Diagram. Andel cykelresor per kommun och år (procent)",
      categories: ["Kommun A", "Kommun B", "Kommun C", "Kommun D"],
      series: [
        { name: "2022", values: [12, 18, 9, 16] },
        { name: "2023", values: [14, 17, 11, 16] },
        { name: "2024", values: [15, 19, 13, 18] },
      ],
      axis: { max: 20, step: 5 },
    },
  ],
};

const FIGURES: Record<string, DtkFigureData> = {
  // ovn-dtk-001–003
  tutftv: {
    title: "Befolkning och sysselsättning i fem regioner i ett fiktivt land, 2014 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal invånare 20–64 år (tusental)",
        head: ["Region", "2014", "2024"],
        rows: [
          ["Region A", "412", "455"],
          ["Region B", "268", "251"],
          ["Region C", "535", "610"],
          ["Region D", "190", "176"],
          ["Region E", "327", "340"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Andel sysselsatta bland invånarna 20–64 år (procent)",
        head: ["Region", "2014", "2024"],
        rows: [
          ["Region A", "78,5", "80,1"],
          ["Region B", "74,0", "76,0"],
          ["Region C", "81,2", "79,6"],
          ["Region D", "70,3", "78,4"],
          ["Region E", "76,8", "78,2"],
        ],
      },
    ],
  },

  // ovn-dtk-004–006
  omy5hm: {
    title: "Prisindex för fyra varugrupper i ett fiktivt land (2018 = 100)",
    parts: [
      {
        kind: "table",
        head: ["Varugrupp", "2018", "2020", "2022", "2024"],
        rows: [
          ["Livsmedel", "100", "104", "117", "130"],
          ["Kläder", "100", "96", "102", "108"],
          ["Energi", "100", "92", "150", "126"],
          ["Transporter", "100", "106", "120", "135"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Indexet för varje varugrupp anger prisnivån i förhållande till samma varugrupps prisnivå år 2018. Ett index på 110 betyder alltså att priserna i gruppen var 10 procent högre än år 2018.",
      },
    ],
  },

  // ovn-dtk-007–009
  f1mbda: {
    title: "Försäljning för ett företag efter produktområde, 2022–2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Försäljning (miljoner kronor)",
        head: ["Produktområde", "2022", "2023", "2024"],
        rows: [
          ["Möbler", "46,0", "52,5", "50,4"],
          ["Belysning", "18,4", "21,0", "25,2"],
          ["Textil", "27,5", "26,1", "22,8"],
          ["Inredningsdetaljer", "12,1", "15,4", "21,6"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Exportens andel av försäljningen år 2024 (procent)",
        head: ["Produktområde", "Procent"],
        rows: [
          ["Möbler", "10"],
          ["Belysning", "65"],
          ["Textil", "15"],
          ["Inredningsdetaljer", "60"],
        ],
      },
    ],
  },

  // ovn-dtk-010–012
  "1xvr5f7": {
    title: "Landareal och skogsmark i sex län i ett fiktivt land, 2024",
    intro:
      "Landareal anges i km². Skogsmark anges i procent av länets landareal och skyddad skogsmark i procent av länets skogsmark.",
    parts: [
      {
        kind: "table",
        head: ["Län", "Landareal (km²)", "Skogsmark (%)", "Skyddad skogsmark (%)"],
        rows: [
          ["Län A", "16 600", "76", "4"],
          ["Län B", "5 200", "45", "9"],
          ["Län C", "21 400", "55", "3"],
          ["Län D", "3 800", "30", "11"],
          ["Län E", "9 500", "62", "6"],
          ["Län F", "11 900", "84", "5"],
        ],
      },
    ],
  },

  // ovn-dtk-013–015
  "1gjvv58": {
    title:
      "Befolkningen 25–64 år i en fiktiv kommun efter åldersgrupp och högsta utbildningsnivå, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal invånare",
        head: ["Åldersgrupp", "Antal"],
        rows: [
          ["25–34 år", "11 000"],
          ["35–44 år", "8 000"],
          ["45–54 år", "9 500"],
          ["55–64 år", "5 500"],
        ],
      },
      {
        kind: "table",
        title:
          "Tabell 2. Högsta utbildningsnivå (procent av invånarna i respektive åldersgrupp)",
        head: ["Åldersgrupp", "Förgymnasial", "Gymnasial", "Eftergymnasial"],
        rows: [
          ["25–34 år", "7", "38", "55"],
          ["35–44 år", "10", "44", "46"],
          ["45–54 år", "14", "50", "36"],
          ["55–64 år", "20", "52", "28"],
        ],
      },
    ],
  },

  // ovn-dtk-016–018
  qxraq8: {
    title: "Arbetsresor i en fiktiv kommun, 2014 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal arbetsresor en genomsnittlig vardag",
        head: ["År", "Antal"],
        rows: [
          ["2014", "42 000"],
          ["2024", "51 000"],
        ],
      },
      {
        kind: "bars",
        title: "Diagram. Arbetsresornas fördelning efter huvudsakligt färdsätt (procent)",
        categories: ["Bil", "Kollektivtrafik", "Cykel", "Gång", "Övrigt"],
        series: [
          { name: "2014", values: [56, 24, 12, 6, 2] },
          { name: "2024", values: [47, 27, 17, 7, 2] },
        ],
        axis: { max: 60, step: 10 },
      },
    ],
  },

  // ovn-dtk-019–020
  "1f99r97": {
    title: "Befolkningstäthet i sex kommuner i ett fiktivt län, 2024",
    intro: "Varje kommun är färgad efter sin befolkningstäthet. Kommunens landareal står i kartan.",
    parts: [
      {
        kind: "map",
        title: "Invånare per km²",
        detailLabel: "Landareal",
        classes: [
          "färre än 10",
          "från 10 till färre än 25",
          "från 25 till färre än 50",
          "från 50 till färre än 100",
          "100 eller fler",
        ],
        regions: [
          { name: "Kommun D", detail: "2 400 km²", cls: 1, shape: "nv" },
          { name: "Kommun B", detail: "1 350 km²", cls: 2, shape: "n" },
          { name: "Kommun F", detail: "1 900 km²", cls: 2, shape: "no" },
          { name: "Kommun C", detail: "860 km²", cls: 3, shape: "sv" },
          { name: "Kommun A", detail: "420 km²", cls: 5, shape: "s" },
          { name: "Kommun E", detail: "610 km²", cls: 4, shape: "so" },
        ],
      },
    ],
  },

  // ovn-dtk-021–023
  "57zh6x": {
    title: "Budget för en fiktiv kommun, 2025",
    intro:
      "Kommunen har 40 000 invånare. De totala kostnaderna är budgeterade till 2 000 miljoner kronor.",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Intäkter (miljoner kronor)",
        head: ["Intäkt", "Mkr"],
        rows: [
          ["Skatteintäkter", "1 640"],
          ["Statsbidrag och utjämning", "280"],
          ["Avgifter och övriga intäkter", "130"],
          ["Summa intäkter", "2 050"],
        ],
        totalRow: true,
      },
      {
        kind: "table",
        title: "Tabell 2. Kostnader efter verksamhet (procent av de totala kostnaderna)",
        head: ["Verksamhet", "Procent"],
        rows: [
          ["Förskola och skola", "40"],
          ["Vård och omsorg", "34"],
          ["Individ- och familjeomsorg", "9"],
          ["Teknisk verksamhet", "7"],
          ["Övrig verksamhet", "6"],
          ["Kultur och fritid", "4"],
        ],
      },
      {
        kind: "table",
        title:
          "Tabell 3. Kostnaderna för förskola och skola efter delpost (procent av kostnaderna för förskola och skola)",
        head: ["Delpost", "Procent"],
        rows: [
          ["Förskola", "30"],
          ["Grundskola", "50"],
          ["Gymnasieskola", "15"],
          ["Vuxenutbildning", "5"],
        ],
      },
    ],
  },

  // ovn-dtk-024–026
  "1ntqdwp": {
    title: "Omsättning och vinst för ett fiktivt företag, 2017–2024 (miljoner kronor)",
    parts: [
      {
        kind: "line",
        title: "Diagram 1. Omsättning (miljoner kronor)",
        categories: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [{ name: "Omsättning", values: [200, 220, 250, 240, 280, 320, 300, 360] }],
        axis: { max: 400, step: 100 },
      },
      {
        kind: "columns",
        title: "Diagram 2. Vinst (miljoner kronor)",
        categories: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [{ name: "Vinst", values: [16, 22, 20, 12, 28, 32, 36, 40] }],
        axis: { max: 50, step: 10 },
      },
      {
        kind: "note",
        text: "Anm.: Vinsten är det som återstår av omsättningen när företagets kostnader har dragits av.",
      },
    ],
  },

  // ovn-dtk-027–029
  "10j76um": {
    title: "Antal medlemmar i ett fiktivt idrottsförbund efter region och åldersgrupp, 2024",
    parts: [
      {
        kind: "table",
        head: ["Region", "7–12 år", "13–19 år", "20–39 år", "40 år och äldre", "Totalt"],
        rows: [
          ["Region A", "1 600", "1 200", "800", "400", "4 000"],
          ["Region B", "700", "850", "700", "250", "2 500"],
          ["Region C", "2 400", "1 500", "1 200", "900", "6 000"],
          ["Region D", "300", "450", "300", "450", "1 500"],
          ["Hela förbundet", "5 000", "4 000", "3 000", "2 000", "14 000"],
        ],
        totalRow: true,
      },
    ],
  },

  // ovn-dtk-030–032
  "1ncnflv": {
    title: "De åtta mest besökta besöksmålen i en fiktiv region, 2024",
    intro:
      "Besökare 2024 anges i tusental. Förändring anger den procentuella förändringen av antalet besökare från 2023 till 2024. Samma åtta besöksmål var de mest besökta även 2023.",
    parts: [
      {
        kind: "table",
        head: ["Besöksmål", "Placering 2024", "Placering 2023", "Besökare 2024", "Förändring (%)"],
        rows: [
          ["Nöjesparken", "1", "1", "900", "+20"],
          ["Akvariet", "2", "3", "600", "+25"],
          ["Slottet", "3", "2", "540", "−10"],
          ["Konstmuseet", "4", "5", "420", "+5"],
          ["Djurparken", "5", "4", "360", "−20"],
          ["Äventyrsbadet", "6", "8", "350", "+40"],
          ["Botaniska trädgården", "7", "6", "330", "+10"],
          ["Friluftsmuseet", "8", "7", "210", "−25"],
        ],
      },
    ],
  },

  // ovn-dtk-033–035
  kuttm8: {
    title: "Enkät om studiemiljön vid fyra fakulteter på ett fiktivt universitet, 2024",
    intro:
      "Alla studenter vid de fyra fakulteterna fick frågan om de var nöjda med studiemiljön. Svarsfrekvensen är andelen av studenterna som besvarade enkäten. Andelen nöjda är räknad bland dem som besvarade enkäten.",
    parts: [
      {
        kind: "table",
        head: ["Fakultet", "Antal studenter", "Svarsfrekvens (%)", "Andel nöjda (%)"],
        rows: [
          ["Teknik", "2 000", "10", "40"],
          ["Medicin", "1 000", "80", "90"],
          ["Humaniora", "800", "50", "60"],
          ["Samhällsvetenskap", "1 200", "50", "50"],
        ],
      },
    ],
  },

  // ovn-dtk-036–038
  "7dofbk": {
    title: "Lagret av en vara hos ett fiktivt företag, januari–juni 2024",
    intro:
      "Den 1 januari fanns 1 000 enheter av varan i lager. Diagrammet visar hur många enheter som kom in till lagret (inleverans) och hur många som skickades ut från lagret (utleverans) under varje månad.",
    parts: [
      {
        kind: "bars",
        title: "Inleverans och utleverans per månad (antal enheter)",
        categories: ["Januari", "Februari", "Mars", "April", "Maj", "Juni"],
        series: [
          { name: "Inleverans", values: [900, 800, 1000, 500, 750, 600] },
          { name: "Utleverans", values: [600, 600, 1100, 700, 500, 800] },
        ],
        axis: { max: 1200, step: 200 },
      },
    ],
  },

  // ovn-dtk-039–040
  eq4dqx: {
    title: "Medeltemperatur och nederbörd per månad i en fiktiv ort",
    intro: "Värdena är genomsnitt för många års mätningar.",
    parts: [
      {
        kind: "line",
        title: "Diagram 1. Medeltemperatur (°C)",
        categories: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
        series: [{ name: "Medeltemperatur", values: [-7, -6, -2, 4, 10, 15, 17, 16, 11, 5, -2, -5] }],
        axis: { min: -10, max: 20, step: 5 },
      },
      {
        kind: "columns",
        title: "Diagram 2. Nederbörd (mm)",
        categories: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
        series: [{ name: "Nederbörd", values: [40, 30, 25, 30, 40, 60, 90, 90, 60, 55, 45, 35] }],
        axis: { max: 100, step: 20 },
      },
    ],
  },

  // Äldre frågor: dtk-1–3
  ov22ln: CYKELRESOR,

  // dtk-4–6
  "4s8usd": {
    title: "Försäljning per produkt (miljoner kr)",
    parts: [
      {
        kind: "pie",
        slices: [
          { name: "Produkt X", value: 40 },
          { name: "Produkt Y", value: 25 },
          { name: "Produkt Z", value: 35 },
        ],
        unit: "miljoner kr",
      },
      { kind: "note", text: "Totalt: 100 miljoner kr." },
    ],
  },

  // dtk-7
  "1oc9bxq": {
    title: "Sjukfrånvaro per avdelning (procent av arbetad tid)",
    parts: [
      {
        kind: "table",
        head: ["Avdelning", "Februari", "Mars", "April"],
        rows: [
          ["Avd. A", "6,2", "5,4", "5,8"],
          ["Avd. B", "4,9", "5,1", "4,7"],
          ["Avd. C", "7,3", "6,8", "7,0"],
          ["Avd. D", "5,6", "4,9", "5,3"],
        ],
      },
    ],
  },

  // dtk-8
  "14gbuyy": {
    title: "Kostnader 2023 (miljoner kr)",
    parts: [
      {
        kind: "pie",
        slices: [
          { name: "Personal", value: 12 },
          { name: "Material", value: 8 },
          { name: "Lokaler", value: 4 },
          { name: "Övrigt", value: 6 },
        ],
        unit: "miljoner kr",
      },
      { kind: "note", text: "Totalt: 30 miljoner kr." },
    ],
  },
  // ovn-dtk-041–043
  fh7kyk: {
    title: "Kommunalval i en fiktiv kommun, 2020 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Röstberättigade och valdeltagande",
        head: ["År", "Röstberättigade", "Valdeltagande (procent)"],
        rows: [
          ["2020", "48 000", "80"],
          ["2024", "56 000", "75"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Partiernas andel av rösterna (procent)",
        head: ["Parti", "2020", "2024"],
        rows: [
          ["Parti K", "32", "27"],
          ["Parti L", "24", "26"],
          ["Parti M", "18", "22"],
          ["Parti N", "15", "12"],
          ["Övriga partier", "11", "13"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Valdeltagandet är andelen av de röstberättigade som röstade. Alla röster antas ha varit giltiga.",
      },
    ],
  },
  // ovn-dtk-044–046
  "11cdpvt": {
    title: "Elproduktion i ett fiktivt land efter kraftslag, 2014 och 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram 1. Elproduktionen år 2014 fördelad på kraftslag (procent)",
        slices: [
          { name: "Vattenkraft", value: 45 },
          { name: "Kärnkraft", value: 35 },
          { name: "Vindkraft", value: 8 },
          { name: "Solkraft", value: 1 },
          { name: "Kraftvärme", value: 11 },
        ],
        unit: "procent",
      },
      {
        kind: "pie",
        title: "Diagram 2. Elproduktionen år 2024 fördelad på kraftslag (procent)",
        slices: [
          { name: "Vattenkraft", value: 41 },
          { name: "Kärnkraft", value: 28 },
          { name: "Vindkraft", value: 20 },
          { name: "Solkraft", value: 4 },
          { name: "Kraftvärme", value: 7 },
        ],
        unit: "procent",
      },
      {
        kind: "note",
        text: "Anm.: Den totala elproduktionen var 150 TWh år 2014 och 160 TWh år 2024.",
      },
    ],
  },
  // ovn-dtk-047–049
  "1mj4f1a": {
    title: "Nyregistrerade företag i ett fiktivt land, 2016–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Antal nyregistrerade företag per år (tusental)",
        categories: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "Aktiebolag", values: [22, 24, 25, 28, 31, 40, 36, 33, 38] },
          { name: "Enskilda firmor", values: [30, 31, 29, 27, 34, 32, 26, 21, 27] },
        ],
        axis: { max: 50, step: 10 },
      },
      {
        kind: "note",
        text: "Anm.: Alla nyregistrerade företag var antingen aktiebolag eller enskilda firmor.",
      },
    ],
  },
  // ovn-dtk-050–052
  "18dgr90": {
    title: "Tidsanvändning för personer 20–64 år i ett fiktivt land, 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Genomsnittlig tid per dygn efter aktivitet och kön (minuter)",
        categories: ["Förvärvsarbete", "Hushållsarbete", "Personlig omsorg och sömn", "Fritid", "Övrigt"],
        series: [
          { name: "Kvinnor", values: [270, 210, 630, 270, 60] },
          { name: "Män", values: [330, 150, 615, 300, 45] },
        ],
        axis: { max: 700, step: 100 },
      },
      {
        kind: "note",
        text: "Anm.: Genomsnitten avser alla veckans dagar. Aktiviteterna täcker tillsammans hela dygnet (1 440 minuter).",
      },
    ],
  },
  // ovn-dtk-053–055
  "5esc7g": {
    title: "Andel invånare 65 år och äldre i sex kommuner i ett fiktivt län, 2024",
    intro: "Varje kommun är färgad efter hur stor andel av kommunens invånare som var 65 år eller äldre. Kommunens antal invånare står i kartan.",
    parts: [
      {
        kind: "map",
        title: "Andel invånare 65 år och äldre",
        classes: ["från 14 till lägre än 18 procent", "från 18 till lägre än 22 procent", "från 22 till lägre än 26 procent", "från 26 till lägre än 30 procent", "från 30 till lägre än 34 procent"],
        regions: [
          { name: "Kommun B", detail: "12 000 invånare", cls: 5, shape: "nv" },
          { name: "Kommun D", detail: "8 000 invånare", cls: 4, shape: "n" },
          { name: "Kommun F", detail: "20 000 invånare", cls: 4, shape: "no" },
          { name: "Kommun E", detail: "45 000 invånare", cls: 2, shape: "sv" },
          { name: "Kommun A", detail: "85 000 invånare", cls: 1, shape: "s" },
          { name: "Kommun C", detail: "30 000 invånare", cls: 3, shape: "so" },
        ],
        detailLabel: "Invånare",
      },
      { kind: "note", text: "Anm.: Länet består av de sex kommunerna." },
    ],
  },
  // ovn-dtk-056–058
  f3dsl8: {
    title: "Mjölkproduktion i fyra regioner i ett fiktivt land, 2004 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal mjölkgårdar",
        head: ["Region", "2004", "2024"],
        rows: [
          ["Region Nord", "1 200", "420"],
          ["Region Väst", "2 500", "900"],
          ["Region Öst", "1 800", "700"],
          ["Region Syd", "3 000", "1 250"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Genomsnittligt antal mjölkkor per gård",
        head: ["Region", "2004", "2024"],
        rows: [
          ["Region Nord", "30", "80"],
          ["Region Väst", "40", "95"],
          ["Region Öst", "35", "75"],
          ["Region Syd", "45", "120"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: I alla fyra regionerna gav en mjölkko i genomsnitt 8 ton mjölk per år 2004 och 10 ton mjölk per år 2024.",
      },
    ],
  },
  // ovn-dtk-059–061
  q7euzj: {
    title: "Försäljning av cyklar i ett fiktivt land, 2020–2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Antal sålda cyklar efter typ (tusental)",
        categories: ["2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "Elcyklar", values: [60, 95, 110, 120, 150] },
          { name: "Övriga cyklar", values: [540, 505, 440, 380, 400] },
        ],
        axis: { max: 600, step: 100 },
      },
      {
        kind: "table",
        title: "Tabell. Genomsnittligt pris per såld cykel (kronor)",
        head: ["Typ", "2020", "2024"],
        rows: [
          ["Elcyklar", "22 000", "18 000"],
          ["Övriga cyklar", "4 000", "5 000"],
        ],
      },
    ],
  },
  // ovn-dtk-062–064
  kbibmp: {
    title: "Hushållens utgifter i ett fiktivt land, 2014 och 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram. Utgifterna per hushåll år 2024 fördelade på utgiftsgrupper (procent)",
        slices: [
          { name: "Boende", value: 28 },
          { name: "Livsmedel", value: 14 },
          { name: "Transporter", value: 15 },
          { name: "Fritid och kultur", value: 12 },
          { name: "Kläder", value: 5 },
          { name: "Restauranger", value: 6 },
          { name: "Övrigt", value: 20 },
        ],
        unit: "procent",
      },
      {
        kind: "table",
        title: "Tabell. Genomsnittliga utgifter per hushåll år 2014 (kronor per år)",
        head: ["Utgiftsgrupp", "Kronor"],
        rows: [
          ["Boende", "96 000"],
          ["Livsmedel", "50 000"],
          ["Transporter", "54 000"],
          ["Fritid och kultur", "30 000"],
          ["Kläder", "22 000"],
          ["Restauranger", "14 000"],
          ["Övrigt", "74 000"],
          ["Summa", "340 000"],
        ],
        totalRow: true,
      },
      {
        kind: "note",
        text: "Anm.: År 2024 var de genomsnittliga utgifterna 400 000 kronor per hushåll.",
      },
    ],
  },
  // ovn-dtk-065–067
  "8shb26": {
    title: "Färdigställda bostäder och folkmängd i ett fiktivt land med fyra regioner, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal färdigställda bostäder efter hustyp",
        head: ["Region", "Flerbostadshus", "Småhus", "Totalt"],
        rows: [
          ["Region A", "4 200", "1 800", "6 000"],
          ["Region B", "1 300", "1 200", "2 500"],
          ["Region C", "2 900", "1 100", "4 000"],
          ["Region D", "900", "600", "1 500"],
          ["Hela landet", "9 300", "4 700", "14 000"],
        ],
        totalRow: true,
      },
      {
        kind: "table",
        title: "Tabell 2. Folkmängd (tusental)",
        head: ["Region", "Folkmängd"],
        rows: [
          ["Region A", "900"],
          ["Region B", "270"],
          ["Region C", "480"],
          ["Region D", "150"],
          ["Hela landet", "1 800"],
        ],
        totalRow: true,
      },
    ],
  },
  // ovn-dtk-068–070
  aag593: {
    title: "Resenärer på en fiktiv färjelinje per månad, 2023 och 2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Antal resenärer (tusental)",
        categories: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
        series: [
          { name: "2023", values: [40, 38, 45, 55, 70, 110, 150, 120, 75, 60, 45, 52] },
          { name: "2024", values: [44, 40, 50, 52, 84, 121, 156, 138, 72, 63, 50, 54] },
        ],
        axis: { max: 160, step: 40 },
      },
    ],
  },
  // ovn-dtk-071–073
  a2ff5z: {
    title: "Personbilar i ett fiktivt land efter drivmedel, 2019 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Antal personbilar i trafik vid årets slut (tusental)",
        head: ["Drivmedel", "2019", "2024"],
        rows: [
          ["Bensin", "2 600", "2 300"],
          ["Diesel", "1 500", "1 400"],
          ["El", "40", "360"],
          ["Laddhybrid", "60", "240"],
          ["Övriga", "100", "100"],
          ["Totalt", "4 300", "4 400"],
        ],
        totalRow: true,
      },
      {
        kind: "table",
        title: "Tabell 2. Nyregistrerade personbilar år 2024 efter drivmedel (procent)",
        head: ["Drivmedel", "Procent"],
        rows: [
          ["Bensin", "25"],
          ["Diesel", "10"],
          ["El", "40"],
          ["Laddhybrid", "20"],
          ["Övriga", "5"],
        ],
      },
      { kind: "note", text: "Anm.: År 2024 nyregistrerades totalt 280 000 personbilar." },
    ],
  },
  // ovn-dtk-074–076
  ewfob8: {
    title: "Hushållsavfall i fyra fiktiva kommuner, 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Hushållsavfall per invånare efter behandlingsmetod (kg)",
        categories: ["Kommun A", "Kommun B", "Kommun C", "Kommun D"],
        series: [
          { name: "Materialåtervinning", values: [160, 200, 140, 180] },
          { name: "Biologisk behandling", values: [60, 100, 40, 90] },
          { name: "Energiåtervinning", values: [220, 180, 260, 150] },
        ],
        axis: { max: 300, step: 50 },
      },
      {
        kind: "table",
        title: "Tabell. Antal invånare",
        head: ["Kommun", "Invånare"],
        rows: [
          ["Kommun A", "50 000"],
          ["Kommun B", "20 000"],
          ["Kommun C", "80 000"],
          ["Kommun D", "30 000"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Allt hushållsavfall behandlades med någon av de tre metoderna.",
      },
    ],
  },
  // ovn-dtk-077–078
  "6n7uy9": {
    title: "Befolkningen i en fiktiv kommun efter ålder och kön, 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Antal invånare efter åldersgrupp och kön",
        categories: ["0–19 år", "20–39 år", "40–59 år", "60–79 år", "80 år och äldre"],
        series: [
          { name: "Kvinnor", values: [3400, 3000, 3600, 3200, 800] },
          { name: "Män", values: [3600, 3400, 3700, 2900, 400] },
        ],
        axis: { max: 4000, step: 1000 },
      },
    ],
  },
  // ovn-dtk-079–080
  "4tntlm": {
    title: "Biljettförsäljning på en fiktiv teater, 2023 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Biljettpris (kronor)",
        head: ["Biljett", "2023", "2024"],
        rows: [
          ["Ordinarie", "400", "450"],
          ["Student", "250", "250"],
          ["Pensionär", "300", "320"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Antal sålda biljetter",
        head: ["Biljett", "2023", "2024"],
        rows: [
          ["Ordinarie", "18 000", "16 000"],
          ["Student", "6 000", "9 000"],
          ["Pensionär", "8 000", "7 500"],
        ],
      },
    ],
  },
  // ovn-dtk-081–083
  uk83gn: {
    title: "Befolkningsförändringar i fyra fiktiva kommuner, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell. Folkmängd den 1 januari 2024 samt antal födda, döda, inflyttade och utflyttade under 2024",
        head: ["Kommun", "Folkmängd 1 januari", "Födda", "Döda", "Inflyttade", "Utflyttade"],
        rows: [
          ["Kommun A", "24 500", "260", "310", "1 450", "1 280"],
          ["Kommun B", "61 200", "720", "540", "3 100", "3 380"],
          ["Kommun C", "9 800", "70", "150", "620", "410"],
          ["Kommun D", "38 400", "410", "380", "2 050", "1 760"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Folkmängden förändras bara genom födda, döda, inflyttade och utflyttade. Födelseöverskottet är antalet födda minus antalet döda, och flyttningsnettot är antalet inflyttade minus antalet utflyttade.",
      },
    ],
  },
  // ovn-dtk-084–086
  "1111jwk": {
    title: "Arbetslöshet i två åldersgrupper i ett fiktivt land, 2016–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Andel arbetslösa av arbetskraften efter åldersgrupp (procent)",
        categories: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "15–24 år", values: [18.2, 16.9, 15.8, 16.4, 22.6, 20.1, 17.3, 18, 19.5] },
          { name: "25–64 år", values: [5.8, 5.4, 5.1, 5.3, 7.2, 6.6, 5.5, 5.7, 6.1] },
        ],
        axis: { max: 25, step: 5 },
        decimals: 1,
      },
      {
        kind: "table",
        title: "Tabell. Arbetskraften år 2024 (tusental)",
        head: ["Åldersgrupp", "Tusental"],
        rows: [
          ["15–24 år", "560"],
          ["25–64 år", "4 400"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Arbetskraften består av alla som är sysselsatta eller arbetslösa.",
      },
    ],
  },
  // ovn-dtk-087–089
  "1l8k1q2": {
    title: "Sjukfrånvaro bland anställda i fem sektorer i ett fiktivt land, 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Sjukfrånvaro efter sektor och kön (procent av den ordinarie arbetstiden)",
        categories: ["Offentlig förvaltning", "Vård och omsorg", "Utbildning", "Handel", "Industri"],
        series: [
          { name: "Kvinnor", values: [5.1, 8.4, 6.2, 4.8, 5] },
          { name: "Män", values: [2.1, 5.6, 4.1, 3.2, 3.8] },
        ],
        axis: { max: 10, step: 2 },
        decimals: 1,
      },
      {
        kind: "table",
        title: "Tabell. Antal anställda efter sektor och kön (tusental)",
        head: ["Sektor", "Kvinnor", "Män"],
        rows: [
          ["Offentlig förvaltning", "150", "100"],
          ["Vård och omsorg", "420", "105"],
          ["Utbildning", "280", "120"],
          ["Handel", "180", "200"],
          ["Industri", "110", "330"],
        ],
      },
      { kind: "note", text: "Anm.: Anta att alla anställda har samma ordinarie arbetstid." },
    ],
  },
  // ovn-dtk-090–092
  go9nbe: {
    title: "Elever i gymnasieskolans första årskurs i ett fiktivt land efter programtyp, 2014 och 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram 1. Eleverna år 2014 fördelade efter programtyp (procent)",
        unit: "procent",
        slices: [
          { name: "Ekonomi", value: 18 },
          { name: "Samhällsvetenskap", value: 22 },
          { name: "Naturvetenskap", value: 14 },
          { name: "Teknik", value: 8 },
          { name: "Yrkesprogram", value: 30 },
          { name: "Introduktionsprogram", value: 8 },
        ],
      },
      {
        kind: "pie",
        title: "Diagram 2. Eleverna år 2024 fördelade efter programtyp (procent)",
        unit: "procent",
        slices: [
          { name: "Ekonomi", value: 21 },
          { name: "Samhällsvetenskap", value: 17 },
          { name: "Naturvetenskap", value: 14 },
          { name: "Teknik", value: 12 },
          { name: "Yrkesprogram", value: 29 },
          { name: "Introduktionsprogram", value: 7 },
        ],
      },
      {
        kind: "note",
        text: "Anm.: Antalet elever i första årskursen var 105 000 år 2014 och 120 000 år 2024.",
      },
    ],
  },
  // ovn-dtk-093–095
  "52hqxt": {
    title: "Utpendling från sex kommuner i ett fiktivt län, 2024",
    intro: "Varje kommun är färgad efter hur stor andel av de förvärvsarbetande som bor i kommunen som arbetar i en annan kommun (utpendlare). Antalet förvärvsarbetande som bor i kommunen står i kartan.",
    parts: [
      {
        kind: "map",
        title: "Andel utpendlare bland de förvärvsarbetande som bor i kommunen",
        detailLabel: "Förvärvsarbetande som bor i kommunen",
        classes: ["lägre än 15 procent", "från 15 till lägre än 30 procent", "från 30 till lägre än 45 procent", "från 45 till lägre än 60 procent", "från 60 till lägre än 75 procent"],
        regions: [
          { name: "Kommun B", detail: "6 000", cls: 5, shape: "nv" },
          { name: "Kommun D", detail: "9 000", cls: 4, shape: "n" },
          { name: "Kommun F", detail: "4 000", cls: 5, shape: "no" },
          { name: "Kommun E", detail: "21 000", cls: 2, shape: "sv" },
          { name: "Kommun A", detail: "48 000", cls: 1, shape: "s" },
          { name: "Kommun C", detail: "16 000", cls: 3, shape: "so" },
        ],
      },
    ],
  },
  // ovn-dtk-096–098
  "11532k1": {
    title: "Medellivslängd vid födseln i ett fiktivt land, 1984–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Medellivslängd vid födseln efter kön (år)",
        categories: ["1984", "1989", "1994", "1999", "2004", "2009", "2014", "2019", "2024"],
        series: [
          { name: "Kvinnor", values: [79.2, 79.8, 80.6, 81.4, 82, 82.7, 83.4, 83.6, 84.3] },
          { name: "Män", values: [72.8, 73.7, 74.9, 75.9, 77.1, 78.3, 79.4, 79.8, 80.7] },
        ],
        axis: { min: 70, max: 90, step: 5 },
        decimals: 1,
      },
    ],
  },
  // ovn-dtk-099–101
  rgtg19: {
    title: "Platser, sökande och antagna till fem utbildningsprogram vid ett fiktivt lärosäte, hösten 2024",
    parts: [
      {
        kind: "table",
        head: ["Program", "Platser", "Förstahandssökande", "Antagna", "Kvinnor bland de antagna (%)"],
        rows: [
          ["Sjuksköterska", "120", "640", "140", "85"],
          ["Civilingenjör i datateknik", "90", "315", "100", "25"],
          ["Grundlärare", "150", "270", "160", "80"],
          ["Psykolog", "140", "610", "160", "75"],
          ["Ekonom", "160", "720", "180", "55"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Förstahandssökande är de som har satt programmet som sitt första val. Fler antas än det finns platser, eftersom en del av de antagna inte börjar på programmet.",
      },
    ],
  },
  // ovn-dtk-102–103
  "1sue9bm": {
    title: "Medianlön efter yrke och kön i ett fiktivt land, 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Medianlön per månad för heltidsanställda (kronor)",
        categories: ["Undersköterska", "Elektriker", "Grundskollärare", "Mjukvaruutvecklare", "Läkare"],
        series: [
          { name: "Kvinnor", values: [31200, 36900, 39500, 48600, 68000] },
          { name: "Män", values: [32000, 37800, 40800, 53800, 74500] },
        ],
        axis: { max: 80000, step: 20000 },
      },
    ],
  },
  // ovn-dtk-104–106
  "1evepol": {
    title: "Dagligrökning i ett fiktivt land efter åldersgrupp, 2004, 2014 och 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Andel av befolkningen som röker dagligen (procent)",
        categories: ["16–29 år", "30–44 år", "45–64 år", "65–84 år"],
        series: [
          { name: "2004", values: [14, 18, 21, 12] },
          { name: "2014", values: [8, 12, 15, 10] },
          { name: "2024", values: [4, 7, 10, 8] },
        ],
        axis: { max: 25, step: 5 },
      },
      {
        kind: "table",
        title: "Tabell. Befolkning efter åldersgrupp (tusental)",
        head: ["Åldersgrupp", "2014", "2024"],
        rows: [
          ["16–29 år", "1 500", "1 400"],
          ["30–44 år", "1 600", "1 300"],
          ["45–64 år", "1 900", "2 000"],
          ["65–84 år", "1 200", "1 600"],
        ],
      },
    ],
  },
  // ovn-dtk-107–109
  "1hatllg": {
    title: "Väntan på planerad operation i fyra fiktiva regioner, december 2024",
    parts: [
      {
        kind: "table",
        head: ["Region", "Väntande patienter", "Andel som väntat mer än 90 dagar (%)", "Invånare (tusental)"],
        rows: [
          ["Region A", "4 200", "35", "520"],
          ["Region B", "1 800", "50", "210"],
          ["Region C", "6 300", "20", "900"],
          ["Region D", "2 600", "45", "330"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Tabellen avser patienter som väntade på en planerad operation den 31 december 2024. Andelen som väntat mer än 90 dagar är räknad bland de väntande patienterna i regionen.",
      },
    ],
  },
  // ovn-dtk-110–112
  qm3cap: {
    title: "Sysselsatta i sju näringsgrenar i ett fiktivt land, 2014 och 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Antal sysselsatta efter näringsgren (tusental)",
        categories: ["Jord- och skogsbruk", "Tillverkning", "Byggverksamhet", "Handel", "Information och kommunikation", "Vård och omsorg", "Utbildning"],
        series: [
          { name: "2014", values: [95, 620, 310, 560, 190, 600, 380] },
          { name: "2024", values: [80, 560, 365, 590, 285, 720, 430] },
        ],
        axis: { max: 800, step: 200 },
      },
      { kind: "note", text: "Anm.: Diagrammet visar bara sju av landets näringsgrenar." },
    ],
  },
  // ovn-dtk-113–115
  "1kw0lvy": {
    title: "Examen bland nybörjarna hösten 2018 på fyra utbildningsprogram vid ett fiktivt lärosäte",
    parts: [
      {
        kind: "table",
        title: "Tabell. Antal nybörjare och andel av nybörjarna som hade tagit examen från programmet inom ett visst antal år efter studiestarten (procent)",
        head: ["Program", "Nybörjare", "Inom 3 år", "Inom 4 år", "Inom 5 år", "Inom 6 år"],
        rows: [
          ["Fysioterapeut", "80", "55", "70", "75", "80"],
          ["Biomedicinsk analytiker", "60", "35", "50", "60", "65"],
          ["Tandhygienist", "40", "60", "70", "75", "75"],
          ["Röntgensjuksköterska", "120", "45", "65", "70", "75"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Andelarna är kumulativa. Andelen inom 4 år omfattar alltså även dem som tog examen inom 3 år.",
      },
    ],
  },
  // ovn-dtk-116–118
  "1g9i4tp": {
    title: "Befolkningen i ett fiktivt land efter åldersgrupp, 2004, 2024 och prognos för 2044 (tusental)",
    parts: [
      {
        kind: "table",
        head: ["Åldersgrupp", "2004", "2024", "2044 (prognos)"],
        rows: [
          ["0–19 år", "2 100", "2 300", "2 200"],
          ["20–64 år", "5 200", "5 750", "5 900"],
          ["65 år och äldre", "1 500", "2 050", "2 700"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Försörjningskvoten är antalet personer 0–19 år och 65 år och äldre tillsammans, dividerat med antalet personer 20–64 år.",
      },
    ],
  },
  // ovn-dtk-119–120
  "1bbj1j0": {
    title: "Självskattad hälsa efter utbildningsnivå i ett fiktivt land, 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram 1. Befolkningen 18–84 år efter högsta utbildningsnivå (procent)",
        unit: "procent",
        slices: [
          { name: "Förgymnasial", value: 15 },
          { name: "Gymnasial", value: 43 },
          { name: "Eftergymnasial", value: 42 },
        ],
      },
      {
        kind: "columns",
        title: "Diagram 2. Andel av befolkningen 18–84 år som bedömer sin hälsa som bra eller mycket bra, efter högsta utbildningsnivå (procent)",
        categories: ["Förgymnasial", "Gymnasial", "Eftergymnasial"],
        series: [
          { name: "Bra eller mycket bra hälsa", values: [54, 70, 80] },
        ],
        axis: { max: 100, step: 20 },
      },
    ],
  },
  // ovn-dtk-121–123
  "1lz2dh5": {
    title: "Varuhandel mellan ett fiktivt land och fem handelspartner, 2014 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Export till respektive handelspartner (miljarder kronor)",
        head: ["Handelspartner", "2014", "2024"],
        rows: [
          ["Land P", "84", "112"],
          ["Land Q", "56", "63"],
          ["Land R", "40", "72"],
          ["Land S", "35", "30"],
          ["Land T", "25", "48"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Import från respektive handelspartner (miljarder kronor)",
        head: ["Handelspartner", "2014", "2024"],
        rows: [
          ["Land P", "90", "104"],
          ["Land Q", "48", "70"],
          ["Land R", "22", "40"],
          ["Land S", "41", "52"],
          ["Land T", "30", "36"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Handelsnettot är exporten minus importen. Ett positivt handelsnetto kallas överskott och ett negativt underskott.",
      },
    ],
  },
  // ovn-dtk-124–126
  "1xd14e0": {
    title: "Inrikes godstransporter i ett fiktivt land efter trafikslag, 2000–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Transportarbete (miljarder tonkilometer)",
        categories: ["2000", "2004", "2008", "2012", "2016", "2020", "2024"],
        series: [
          { name: "Väg", values: [32, 36, 41, 38, 42, 44, 48] },
          { name: "Järnväg", values: [20, 22, 23, 21, 22, 24, 23] },
          { name: "Sjöfart", values: [10, 9, 8, 8, 7, 7, 6] },
        ],
        axis: { max: 50, step: 10 },
      },
      {
        kind: "table",
        title: "Tabell. Transporterad godsmängd år 2024 (miljoner ton)",
        head: ["Trafikslag", "Miljoner ton"],
        rows: [
          ["Väg", "400"],
          ["Järnväg", "92"],
          ["Sjöfart", "20"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Transportarbetet är godsets vikt i ton multiplicerad med den sträcka i kilometer som godset transporteras.",
      },
    ],
  },
  // ovn-dtk-127–129
  "1hq6c37": {
    title: "Elanvändning och elpris för ett fiktivt hushåll i en villa, 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Elanvändning per månad (kWh)",
        categories: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
        series: [
          {
            name: "Elanvändning",
            values: [2400, 2200, 1800, 1300, 900, 600, 500, 600, 900, 1400, 1900, 2300],
          },
        ],
        axis: { max: 2500, step: 500 },
      },
      {
        kind: "table",
        title: "Tabell. Hushållets rörliga elpris per kvartal, inklusive skatter och avgifter (öre per kWh)",
        head: ["Kvartal", "Öre per kWh"],
        rows: [
          ["Januari–mars", "200"],
          ["April–juni", "120"],
          ["Juli–september", "100"],
          ["Oktober–december", "160"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Elbolaget erbjöd också ett fast elpris på 150 öre per kWh för hela året. Hushållet har inga andra elkostnader än elpriset gånger elanvändningen.",
      },
    ],
  },
  // ovn-dtk-130–132
  "1iw16ij": {
    title: "Fjärrvärme i sex kommuner i ett fiktivt län, 2024",
    intro: "Varje kommun är färgad efter hur stor andel av kommunens bostäder som värms med fjärrvärme. Kommunens antal bostäder står i kartan.",
    parts: [
      {
        kind: "map",
        title: "Andel av bostäderna som värms med fjärrvärme",
        detailLabel: "Antal bostäder",
        classes: ["färre än 20 procent", "från 20 till färre än 40 procent", "från 40 till färre än 60 procent", "från 60 till färre än 80 procent", "80 procent eller fler"],
        regions: [
          { name: "Kommun E", detail: "30 000 bostäder", cls: 2, shape: "nv" },
          { name: "Kommun B", detail: "8 500 bostäder", cls: 1, shape: "n" },
          { name: "Kommun F", detail: "11 000 bostäder", cls: 4, shape: "no" },
          { name: "Kommun C", detail: "21 000 bostäder", cls: 3, shape: "sv" },
          { name: "Kommun A", detail: "52 000 bostäder", cls: 4, shape: "s" },
          { name: "Kommun D", detail: "14 000 bostäder", cls: 5, shape: "so" },
        ],
      },
    ],
  },
  // ovn-dtk-133–135
  "1c26az5": {
    title: "Passagerare vid fem fiktiva flygplatser, 2019 och 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Antal passagerare (tusental)",
        categories: ["Flygplats Norr", "Flygplats Väst", "Flygplats Syd", "Flygplats Öst", "Flygplats Mitt"],
        series: [
          { name: "2019", values: [2400, 7800, 4200, 1500, 900] },
          { name: "2024", values: [1900, 8600, 4000, 1200, 600] },
        ],
        axis: { max: 9000, step: 1000 },
      },
      {
        kind: "table",
        title: "Tabell. Utrikespassagerarnas andel av alla passagerare år 2024 (procent)",
        head: ["Flygplats", "Procent"],
        rows: [
          ["Flygplats Norr", "20"],
          ["Flygplats Väst", "75"],
          ["Flygplats Syd", "60"],
          ["Flygplats Öst", "25"],
          ["Flygplats Mitt", "10"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Varje passagerare räknas antingen som inrikes- eller som utrikespassagerare.",
      },
    ],
  },
  // ovn-dtk-136–138
  "1qg6t9t": {
    title: "Detaljhandelns försäljning i ett fiktivt land efter bransch, 2019 och 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Försäljning (miljarder kronor)",
        categories: ["Dagligvaror", "Kläder och skor", "Bygg och trädgård", "Hemelektronik", "Möbler och inredning", "Övrigt"],
        series: [
          { name: "2019", values: [280, 95, 60, 55, 45, 100] },
          { name: "2024", values: [320, 90, 70, 60, 50, 110] },
        ],
        axis: { max: 350, step: 50 },
      },
      {
        kind: "table",
        title: "Tabell. E-handelns andel av försäljningen (procent)",
        head: ["Bransch", "2019", "2024"],
        rows: [
          ["Dagligvaror", "2", "5"],
          ["Kläder och skor", "22", "35"],
          ["Bygg och trädgård", "6", "20"],
          ["Hemelektronik", "35", "45"],
          ["Möbler och inredning", "12", "20"],
          ["Övrigt", "15", "25"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Försäljningen i diagrammet omfattar både butikshandel och e-handel. All försäljning som inte sker via e-handel sker i butik.",
      },
    ],
  },
  // ovn-dtk-139–141
  sqhz7t: {
    title: "Kollektivtrafik i fyra fiktiva regioner, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell. Invånare (tusental), resor (miljoner) samt kostnader och biljettintäkter (miljoner kronor)",
        head: ["Region", "Invånare", "Resor", "Kostnader", "Biljettintäkter"],
        rows: [
          ["Region A", "1 200", "150", "6 000", "2 700"],
          ["Region B", "450", "36", "2 160", "756"],
          ["Region C", "300", "15", "1 200", "360"],
          ["Region D", "800", "72", "3 600", "1 800"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Den del av kostnaderna som inte täcks av biljettintäkterna betalas med skattemedel. Kostnadstäckningsgraden är biljettintäkterna i procent av kostnaderna.",
      },
    ],
  },
  // ovn-dtk-142–144
  o75787: {
    title: "Räntor och bolån i ett fiktivt land, 2016–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Räntor vid årets slut (procent)",
        categories: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "Styrränta", values: [0.25, 0.5, 0.75, 0.75, 0.5, 0.5, 2.5, 4, 3] },
          { name: "Bolåneränta", values: [1.75, 1.9, 2.1, 2.2, 1.9, 1.8, 4.1, 5.4, 4.6] },
        ],
        axis: { max: 6, step: 1 },
        decimals: 2,
      },
      {
        kind: "table",
        title: "Tabell. Genomsnittligt bolån per hushåll med bolån vid årets slut (kronor)",
        head: ["År", "Kronor"],
        rows: [
          ["2016", "1 600 000"],
          ["2020", "1 900 000"],
          ["2024", "2 200 000"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Bolåneräntan är den genomsnittliga rörliga räntan på bolån. Räntekostnaden för ett år beräknas här som lånebeloppet gånger räntan.",
      },
    ],
  },
  // ovn-dtk-145–147
  "6k65xw": {
    title: "Växelkurser och maskinpriser i fyra fiktiva valutaområden, 2020 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Växelkurs (kronor per enhet av områdets valuta)",
        head: ["Valuta", "2020", "2024"],
        rows: [
          ["Valuta A", "10,00", "11,50"],
          ["Valuta B", "8,00", "7,20"],
          ["Valuta C", "1,25", "1,50"],
          ["Valuta D", "0,40", "0,38"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Pris för en viss maskintyp hos en tillverkare i varje valutaområde (enheter av områdets egen valuta)",
        head: ["Tillverkare", "2020", "2024"],
        rows: [
          ["Tillverkaren i A-området", "2 000", "2 200"],
          ["Tillverkaren i B-området", "2 600", "3 000"],
          ["Tillverkaren i C-området", "16 000", "16 000"],
          ["Tillverkaren i D-området", "50 000", "56 000"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Priset i kronor är priset i områdets valuta gånger växelkursen. Frakt, tull och andra avgifter bortses från.",
      },
    ],
  },
  // ovn-dtk-148–149
  aanudc: {
    title: "Godshantering i fyra fiktiva hamnar, 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Hanterat gods efter godsslag (miljoner ton)",
        categories: ["Hamn W", "Hamn X", "Hamn Y", "Hamn Z"],
        series: [
          { name: "Containergods", values: [2, 6, 1.5, 3] },
          { name: "Torrbulk", values: [0.5, 2.5, 4, 1] },
          { name: "Flytande bulk", values: [3, 9.5, 0.5, 4.5] },
          { name: "Övrigt", values: [0.5, 2, 1, 1.5] },
        ],
        axis: { max: 10, step: 2 },
        decimals: 1,
      },
      {
        kind: "table",
        title: "Tabell. Antal fartygsanlöp",
        head: ["Hamn", "Anlöp"],
        rows: [
          ["Hamn W", "1 600"],
          ["Hamn X", "5 000"],
          ["Hamn Y", "2 000"],
          ["Hamn Z", "2 000"],
        ],
      },
      { kind: "note", text: "Anm.: Ett fartygsanlöp är ett besök av ett fartyg i hamnen." },
    ],
  },
  // ovn-dtk-150–152
  "1nrr2fl": {
    title: "Elanvändning i två fiktiva småhus, 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram 1. Hus 1 med direktverkande el: elanvändningen fördelad på ändamål (procent)",
        slices: [
          { name: "Uppvärmning", value: 55 },
          { name: "Varmvatten", value: 15 },
          { name: "Hushållsel", value: 25 },
          { name: "Övrigt", value: 5 },
        ],
        unit: "procent",
      },
      {
        kind: "pie",
        title: "Diagram 2. Hus 2 med värmepump: elanvändningen fördelad på ändamål (procent)",
        slices: [
          { name: "Uppvärmning", value: 30 },
          { name: "Varmvatten", value: 15 },
          { name: "Hushållsel", value: 43 },
          { name: "Övrigt", value: 12 },
        ],
        unit: "procent",
      },
      {
        kind: "note",
        text: "Anm.: Hus 1 använde totalt 20 000 kWh el och Hus 2 totalt 10 000 kWh el under 2024.",
      },
    ],
  },
  // ovn-dtk-153–155
  e4r013: {
    title: "BNP och befolkning i fem fiktiva länder, 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. BNP (miljarder kronor)",
        categories: ["Land A", "Land B", "Land C", "Land D", "Land E"],
        series: [
          { name: "BNP", values: [1800, 600, 2400, 450, 900] },
        ],
        axis: { max: 2500, step: 500 },
      },
      {
        kind: "table",
        title: "Tabell. Befolkning (miljoner) och BNP-tillväxt (procent)",
        head: ["Land", "Befolkning", "BNP-tillväxt"],
        rows: [
          ["Land A", "4,5", "1,5"],
          ["Land B", "2,0", "3,0"],
          ["Land C", "10,0", "0,5"],
          ["Land D", "0,9", "2,0"],
          ["Land E", "3,6", "2,5"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: BNP-tillväxten anger med hur många procent landets BNP år 2024 var större än landets BNP år 2023. Alla belopp är räknade i fasta priser.",
      },
    ],
  },
  // ovn-dtk-156–158
  o5zwtu: {
    title: "Punktlighet på två fiktiva tåglinjer, 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Andel avgångar i tid per kvartal (procent)",
        categories: ["Kvartal 1", "Kvartal 2", "Kvartal 3", "Kvartal 4"],
        series: [
          { name: "Linje 1", values: [94, 90, 85, 72] },
          { name: "Linje 2", values: [80, 88, 92, 95] },
        ],
        axis: { max: 100, step: 20 },
      },
      {
        kind: "table",
        title: "Tabell. Antal avgångar per kvartal",
        head: ["Kvartal", "Linje 1", "Linje 2"],
        rows: [
          ["Kvartal 1", "4 000", "1 500"],
          ["Kvartal 2", "4 000", "2 000"],
          ["Kvartal 3", "5 000", "2 000"],
          ["Kvartal 4", "3 000", "1 000"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: En avgång räknas som i tid om tåget avgår högst fem minuter efter tidtabellen. Övriga avgångar räknas som försenade.",
      },
    ],
  },
  // ovn-dtk-159–160
  "12vpn1c": {
    title: "Aktiekurser för fyra fiktiva bolag, 2018–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Aktiekurs vid årets slut (kronor)",
        categories: ["2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "Alfa", values: [120, 135, 150, 110, 140, 165, 180] },
          { name: "Beta", values: [60, 75, 88, 75, 64, 76, 92] },
          { name: "Gamma", values: [200, 230, 240, 260, 210, 230, 250] },
          { name: "Delta", values: [40, 44, 50, 42, 36, 46, 58] },
        ],
        axis: { max: 300, step: 50 },
      },
    ],
  },
  // ovn-dtk-161–163
  m67a2x: {
    title: "Utsläpp av växthusgaser i ett fiktivt land efter sektor, 2005, 2015 och 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Utsläpp per sektor (miljoner ton koldioxidekvivalenter)",
        categories: ["Transporter", "Industri", "Jordbruk", "El och värme", "Övrigt"],
        series: [
          { name: "2005", values: [20, 18, 8, 12, 6] },
          { name: "2015", values: [18, 16, 8, 8, 5] },
          { name: "2024", values: [14, 15, 7, 4, 4] },
        ],
        axis: { max: 25, step: 5 },
      },
      {
        kind: "note",
        text: "Anm.: De fem sektorerna omfattar landets samtliga utsläpp. Landets mål är att de totala utsläppen år 2030 ska vara 50 procent lägre än år 2005.",
      },
    ],
  },
  // ovn-dtk-164–166
  "14woowb": {
    title: "Spannmålsodling i ett fiktivt land, 2014 och 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Odlad areal (tusen hektar)",
        categories: ["Vete", "Korn", "Havre", "Råg"],
        series: [
          { name: "2014", values: [480, 350, 200, 30] },
          { name: "2024", values: [450, 280, 210, 45] },
        ],
        axis: { max: 500, step: 100 },
      },
      {
        kind: "table",
        title: "Tabell. Hektarskörd (ton per hektar)",
        head: ["Gröda", "2014", "2024"],
        rows: [
          ["Vete", "6,5", "8,0"],
          ["Korn", "4,8", "5,0"],
          ["Havre", "4,5", "4,0"],
          ["Råg", "6,0", "4,0"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Hektarskörden är den skördade mängden per hektar odlad areal. En grödas totalskörd är alltså den odlade arealen multiplicerad med hektarskörden. Landet odlade inga andra spannmålsgrödor än de fyra som redovisas.",
      },
    ],
  },
  // ovn-dtk-167–169
  n56d8m: {
    title: "Gästnätter på hotell i en fiktiv region per månad, 2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Antal gästnätter (tusental)",
        categories: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
        series: [
          {
            name: "Gäster bosatta i landet",
            values: [60, 70, 75, 80, 95, 140, 190, 150, 90, 85, 75, 65],
          },
          { name: "Utländska gäster", values: [20, 35, 25, 20, 30, 70, 110, 80, 35, 20, 15, 30] },
        ],
        axis: { max: 200, step: 50 },
      },
      {
        kind: "note",
        text: "Anm.: Alla gäster är antingen bosatta i landet eller utländska. En gäst som övernattar tre nätter räknas som tre gästnätter.",
      },
    ],
  },
  // ovn-dtk-170–172
  "7jw3cs": {
    title: "Utlån på folkbiblioteken i en fiktiv kommun efter medietyp, 2014 och 2024",
    parts: [
      {
        kind: "pie",
        title: "Diagram 1. Utlånen år 2014 fördelade på medietyp (procent)",
        slices: [
          { name: "Skönlitteratur för vuxna", value: 38 },
          { name: "Barn- och ungdomsböcker", value: 30 },
          { name: "Facklitteratur", value: 18 },
          { name: "E-böcker och e-ljudböcker", value: 4 },
          { name: "Övriga medier", value: 10 },
        ],
        unit: "procent",
      },
      {
        kind: "pie",
        title: "Diagram 2. Utlånen år 2024 fördelade på medietyp (procent)",
        slices: [
          { name: "Skönlitteratur för vuxna", value: 32 },
          { name: "Barn- och ungdomsböcker", value: 36 },
          { name: "Facklitteratur", value: 12 },
          { name: "E-böcker och e-ljudböcker", value: 15 },
          { name: "Övriga medier", value: 5 },
        ],
        unit: "procent",
      },
      {
        kind: "note",
        text: "Anm.: Det totala antalet utlån var 500 000 år 2014 och 400 000 år 2024. Övriga medier omfattar bland annat film, musik och tidskrifter.",
      },
    ],
  },
  // ovn-dtk-173–175
  xq217r: {
    title: "Skyddad natur i sex kommuner i ett fiktivt län, 2024",
    intro: "Varje kommun är färgad efter hur stor andel av kommunens landareal som är skyddad natur, till exempel naturreservat. Kommunens landareal står i kartan.",
    parts: [
      {
        kind: "map",
        title: "Andel av landarealen som är skyddad natur",
        detailLabel: "Landareal",
        classes: ["mindre än 2 procent", "från 2 till mindre än 5 procent", "från 5 till mindre än 10 procent", "från 10 till mindre än 20 procent", "20 procent eller mer"],
        regions: [
          { name: "Kommun B", detail: "3 500 km²", cls: 4, shape: "nv" },
          { name: "Kommun D", detail: "2 000 km²", cls: 5, shape: "n" },
          { name: "Kommun F", detail: "600 km²", cls: 3, shape: "no" },
          { name: "Kommun E", detail: "1 500 km²", cls: 3, shape: "sv" },
          { name: "Kommun C", detail: "800 km²", cls: 1, shape: "s" },
          { name: "Kommun A", detail: "1 200 km²", cls: 2, shape: "so" },
        ],
      },
    ],
  },
  // ovn-dtk-176–178
  "12gstyv": {
    title: "Ekologisk odling i fem regioner i ett fiktivt land, 2024",
    parts: [
      {
        kind: "bars",
        title: "Diagram. Andel av åkermarken som odlas ekologiskt (procent)",
        categories: ["Region Nord", "Region Väst", "Region Mitt", "Region Öst", "Region Syd"],
        series: [
          { name: "Andel ekologiskt odlad åkermark", values: [18, 24, 16, 10, 5] },
        ],
        axis: { max: 30, step: 5 },
      },
      {
        kind: "table",
        title: "Tabell. Åkermark (tusen hektar)",
        head: ["Region", "Åkermark"],
        rows: [
          ["Region Nord", "100"],
          ["Region Väst", "250"],
          ["Region Mitt", "400"],
          ["Region Öst", "550"],
          ["Region Syd", "700"],
        ],
      },
    ],
  },
  // ovn-dtk-179–181
  vjjf2y: {
    title: "Besök och statligt bidrag vid fem fiktiva museer, 2019 och 2024",
    parts: [
      {
        kind: "table",
        head: ["Museum", "Besök 2019 (tusental)", "Besök 2024 (tusental)", "Statligt bidrag 2024 (miljoner kronor)"],
        rows: [
          ["Konstmuseet", "180", "210", "63"],
          ["Historiska museet", "240", "252", "57"],
          ["Tekniska museet", "150", "195", "39"],
          ["Naturhistoriska museet", "300", "285", "81"],
          ["Sjöfartsmuseet", "90", "126", "27"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Antalet besök anges i tusental och det statliga bidraget i miljoner kronor.",
      },
    ],
  },
  // ovn-dtk-182–183
  "5lwl41": {
    title: "Dagar med snötäcke i två fiktiva orter, vintrarna 2015/16–2023/24",
    parts: [
      {
        kind: "line",
        title: "Diagram. Antal dagar med snötäcke per vinter",
        categories: ["2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23", "2023/24"],
        series: [
          { name: "Fjällby", values: [160, 148, 175, 152, 130, 165, 150, 140, 170] },
          { name: "Kustby", values: [60, 42, 85, 50, 5, 70, 8, 44, 58] },
        ],
        axis: { max: 200, step: 50 },
      },
      {
        kind: "note",
        text: "Anm.: En dag räknas som en dag med snötäcke om minst hälften av marken runt mätplatsen är täckt av snö.",
      },
    ],
  },
  // ovn-dtk-184–186
  "1wntc6s": {
    title: "Deltagande i fritids- och kulturaktiviteter efter ålder i ett fiktivt land, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell 1. Andel som minst en gång under de senaste tolv månaderna har gjort aktiviteten (procent)",
        head: ["Aktivitet", "16–29 år", "30–49 år", "50–64 år", "65–84 år"],
        rows: [
          ["Gått på teater", "20", "25", "30", "45"],
          ["Gått på konsert", "60", "45", "35", "20"],
          ["Besökt bibliotek", "50", "40", "35", "45"],
          ["Fiskat", "10", "30", "25", "10"],
        ],
      },
      {
        kind: "table",
        title: "Tabell 2. Befolkning (tusental)",
        head: ["Åldersgrupp", "Befolkning"],
        rows: [
          ["16–29 år", "1 200"],
          ["30–49 år", "2 400"],
          ["50–64 år", "1 800"],
          ["65–84 år", "1 600"],
        ],
      },
    ],
  },
  // ovn-dtk-187–189
  "8zyxg2": {
    title: "Jordbruksföretag i ett fiktivt land efter storlek, 2004, 2014 och 2024",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Antal jordbruksföretag efter åkerareal (tusental)",
        categories: ["2 till under 10 hektar", "10 till under 50 hektar", "50 till under 100 hektar", "100 hektar eller mer"],
        series: [
          { name: "2004", values: [30, 35, 10, 5] },
          { name: "2014", values: [24, 28, 9, 7] },
          { name: "2024", values: [18, 20, 8, 10] },
        ],
        axis: { max: 40, step: 10 },
      },
      {
        kind: "note",
        text: "Anm.: Företag med mindre än 2 hektar åkermark ingår inte. De redovisade företagens sammanlagda åkerareal var 2,8 miljoner hektar år 2004 och 2,5 miljoner hektar år 2024.",
      },
    ],
  },
  // ovn-dtk-190–192
  xb5n09: {
    title: "Skidåkning vid en fiktiv skidanläggning, säsongerna 2018/19–2023/24",
    parts: [
      {
        kind: "columns",
        title: "Diagram. Antal åkdagar (tusental)",
        categories: ["2018/19", "2019/20", "2020/21", "2021/22", "2022/23", "2023/24"],
        series: [
          { name: "Åkdagar", values: [420, 310, 380, 450, 400, 470] },
        ],
        axis: { max: 500, step: 100 },
      },
      {
        kind: "table",
        title: "Tabell. Antal öppetdagar och pris för ett dagkort för vuxen (kronor)",
        head: ["Säsong", "Öppetdagar", "Dagkort"],
        rows: [
          ["2018/19", "150", "400"],
          ["2019/20", "100", "440"],
          ["2020/21", "140", "470"],
          ["2021/22", "150", "510"],
          ["2022/23", "125", "555"],
          ["2023/24", "160", "590"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: En åkdag är en dag då en person åker skidor i anläggningen.",
      },
    ],
  },
  // ovn-dtk-193–195
  efe24: {
    title: "Besök på biografer och teatrar i ett fiktivt land, 2016–2024",
    parts: [
      {
        kind: "line",
        title: "Diagram. Antal besök (miljoner)",
        categories: ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        series: [
          { name: "Biograf", values: [16, 17, 16, 15, 5, 7, 11, 12, 13] },
          { name: "Teater", values: [4, 4.2, 3.9, 4.5, 1, 1.5, 3.6, 4.2, 4.6] },
        ],
        axis: { max: 20, step: 5 },
        decimals: 1,
      },
    ],
  },
  // ovn-dtk-196–197
  ie6sq: {
    title: "Förpackningar och insamling för materialåtervinning i ett fiktivt land, 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell. Förpackningar efter material",
        head: ["Material", "På marknaden (tusen ton)", "Insamlat (tusen ton)", "Mål (procent)"],
        rows: [
          ["Glas", "200", "186", "90"],
          ["Papper och kartong", "500", "390", "85"],
          ["Plast", "300", "80", "50"],
          ["Metall", "80", "64", "80"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: På marknaden anger mängden förpackningar som såldes i landet och Insamlat den mängd förpackningar som samlades in för materialåtervinning, båda i tusen ton. Återvinningsgraden är den insamlade mängden i procent av mängden på marknaden. Mål anger den lägsta återvinningsgrad i procent som ska uppnås.",
      },
    ],
  },
  // ovn-dtk-198–200
  imiyek: {
    title: "Yrkesfiske i ett fiktivt land, 2014 och 2024",
    parts: [
      {
        kind: "table",
        title: "Tabell. Fångst och förstahandsvärde efter art",
        head: ["Art", "Fångst 2014 (ton)", "Fångst 2024 (ton)", "Förstahandsvärde 2024 (kronor per kilogram)"],
        rows: [
          ["Sill", "60 000", "45 000", "7"],
          ["Skarpsill", "50 000", "70 000", "3"],
          ["Torsk", "12 000", "3 000", "40"],
          ["Nordhavsräka", "2 000", "1 500", "100"],
          ["Havskräfta", "1 000", "1 200", "150"],
        ],
      },
      {
        kind: "note",
        text: "Anm.: Fångsten anges i ton och förstahandsvärdet, det vill säga det pris som fiskaren får vid den första försäljningen, i kronor per kilogram. Fångstvärdet är fångsten multiplicerad med förstahandsvärdet.",
      },
    ],
  },
};

/** Figuren till ett underlag, eller null om texten inte har någon. */
export function dtkFigureFor(passage: string): DtkFigureData | null {
  return FIGURES[passageKey(passage)] ?? null;
}

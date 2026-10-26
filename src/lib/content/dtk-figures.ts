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
};

/** Figuren till ett underlag, eller null om texten inte har någon. */
export function dtkFigureFor(passage: string): DtkFigureData | null {
  return FIGURES[passageKey(passage)] ?? null;
}

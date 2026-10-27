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
};

/** Figuren till ett underlag, eller null om texten inte har någon. */
export function dtkFigureFor(passage: string): DtkFigureData | null {
  return FIGURES[passageKey(passage)] ?? null;
}

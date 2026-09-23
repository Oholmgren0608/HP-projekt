import type { SectionId } from "@/lib/study-plan";

export type SectionTip = {
  id: SectionId;
  title: string;
  tests: string;
  mistakes: string[];
  tempo: string;
  steps: string[];
};

export const SECTION_TIPS: SectionTip[] = [
  {
    id: "MEK",
    title: "MEK — Meningskomplettering",
    tests: "Register, logik och bindningar i meningen.",
    mistakes: [
      "Ord som låter fint men bryter orsaks- eller kontrastrelationen",
      "Läsa luckan utan meningen före och efter",
      "Stryka logikfel före stilfel",
    ],
    tempo: "~75 sek/lucka. Två genomläsningar slår gissning.",
    steps: [
      "Konnektorer dagligen: emellertid, således, däremot, oaktat, i synnerhet.",
      "Alternativen högt: fel svar knakar i ton eller tempus.",
      "Eliminera: först stil, sedan logik.",
      "Efter varje fel: en rad om varför.",
      "Korta set (8–10 luckor) slår maratonpass.",
    ],
  },
  {
    id: "ORD",
    title: "ORD — Ordförståelse",
    tests: "Stammar, nyanser och vanliga HP-ord.",
    mistakes: [
      "Bara läsa listor utan aktiv recall",
      "Hoppa över fel-decket",
      "Förväxla närliggande synonymer",
    ],
    tempo: "~50 sek/ord. Tvekar du längre: gissa, markera, gå vidare.",
    steps: [
      "15–25 nya ord/dag + repetition av felkort.",
      "Gruppera efter stam så ett ord ger flera.",
      "Flashcards varje morgon, före nya ord.",
      "Fem ORD-ord ur varje text du läser.",
      "Veckocheck: ≥80 % rätt på blandat mini-set.",
    ],
  },
  {
    id: "LAS",
    title: "LÄS — Svensk läsförståelse",
    tests: "Stöd i texten — inte vad som känns rimligt.",
    mistakes: [
      "Svara från allmänkunskap i stället för texten",
      "Läsa för långsamt — tidsbrist på sista texten",
      "Missad negation eller begränsning i frågan",
    ],
    tempo: "~110 sek/fråga inkl. läsning. Läs frågan först.",
    steps: [
      "Läs frågan, sedan texten med den i bakhuvudet.",
      "Markera belägg — en mening som bär svaret.",
      "Daglig sakprosa + en mening sammanfattning.",
      "Tidsatta pass med provklocka.",
      "Felorsak: avläsning, slutsats eller tid?",
    ],
  },
  {
    id: "ELF",
    title: "ELF — Engelsk läsförståelse",
    tests: "Huvudpoäng, attityd och stöd — på engelska.",
    mistakes: [
      "Översätta ord för ord och tappa helheten",
      "Låta tempot dippa när verbala delar tar tiden",
      "Gissa från rubrik utan att kolla stycket",
    ],
    tempo: "~110 sek/fråga. Underhåll räcker om du ligger högt.",
    steps: [
      "Ett underhållspass/vecka så tempot hålls.",
      "Lätt engelsk sakprosa vid behov.",
      "Analysera bara tydliga fel, inte 50/50-känslor.",
      "Som LÄS: fråga först, belägg i texten.",
      "Pekar trenden ner: 2–3 pass med felanalys.",
    ],
  },
  {
    id: "DTK",
    title: "DTK — Diagram, tabeller och kartor",
    tests: "Axlar, enheter och vad frågan faktiskt frågar.",
    mistakes: [
      "Räkna före enheter och tidsperiod",
      "Använda fel rad/kolumn i tabellen",
      "Fastna på en 'omöjlig' figur",
    ],
    tempo: "~100 sek/fråga. Stryk irrelevant data före räkning.",
    steps: [
      "Läs axlar, legend och enheter högt för dig själv.",
      "Stryk det som inte behövs, räkna sedan.",
      "Felanalys: avläsning, räkning eller feltolkning.",
      "Blandade figurer, inte favorittyper.",
      "Hoppa: en svår DTK ska inte äta tre lätta.",
    ],
  },
  {
    id: "XYZ",
    title: "XYZ — Matematisk problemlösning",
    tests: "Modell, ekvation och rimlighetskoll.",
    mistakes: [
      "Räkna klart när alternativet redan syns",
      "Enhetsfel och glömda parenteser",
      "Överplugga när XYZ redan är en styrka",
    ],
    tempo: "~82 sek. Ingen väg inom 20 sek: nästa fråga.",
    steps: [
      "Blandade set, inte bara favoritkapitlet.",
      "Felanalys per typ: ekvation, procent, geometri, ränta.",
      "Korta pass — inte tre timmar matte.",
      "Rita och uppskatta innan du räknar exakt.",
      "Extra tid bara om XYZ är din lucka.",
    ],
  },
  {
    id: "KVA",
    title: "KVA — Kvantitativa jämförelser",
    tests: "Jämför två storheter utan full uträkning.",
    mistakes: [
      "Räkna fullt i onödan",
      "Glömma att 'går inte att avgöra' är ett alternativ",
      "Bara positiva tal trots teckenbyten",
    ],
    tempo: "~70 sek. Jämför, förenkla, avgör.",
    steps: [
      "Se relationen utan full uträkning.",
      "Prova gränsvärden: 0, 1, negativt, stort.",
      "Korta set under tid.",
      "Felanalys per mönster: bråk, exponent, geometri.",
      "Över tempo: färre uträkningar, mer jämförelse.",
    ],
  },
  {
    id: "NOG",
    title: "NOG — Kvantitativa resonemang",
    tests: "Räcker (1), (2), båda eller ingetdera?",
    mistakes: [
      "Räkna svaret i stället för att fråga 'räcker det?'",
      "Blanda 'båda behövs' med 'varje räcker ensam'",
      "Rita inte upp vad varje uppgift ger",
    ],
    tempo: "~82 sek. Målet är beslut, inte uträkning.",
    steps: [
      "Fråga per påstående: räcker detta för storheten?",
      "Rita två kolumner: vad (1) ger, vad (2) ger.",
      "Korta set med direkt felanalys.",
      "Lär dig de fem svarsalternativen utantill.",
      "Tappar du tempo: stanna vid tillräcklighet.",
    ],
  },
];

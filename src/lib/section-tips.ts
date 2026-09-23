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
      "Välja ett ord som 'låter fint' men bryter orsaks- eller kontrastrelationen",
      "Hoppa över att läsa hela meningen före och efter luckan",
      "Inte stryka stilfel först (talspråk i sakprosa)",
    ],
    tempo: "Sikta på cirka 75 sekunder per lucka. Två genomläsningar slår gissning.",
    steps: [
      "Träna konnektorer varje dag: emellertid, således, däremot, oaktat, i synnerhet.",
      "Läs alternativen högt — fel svar knakar ofta i ton eller tempus.",
      "Eliminera: först stil, sedan logik.",
      "Efter varje fel: en rad om varför rätt svar är rätt.",
      "Korta set (8–10 luckor) flera gånger i veckan slår ett maratonpass.",
    ],
  },
  {
    id: "ORD",
    title: "ORD — Ordförståelse",
    tests: "Stammar, nyanser och vanliga HP-ord.",
    mistakes: [
      "Bara läsa listor utan aktiv recall",
      "Hoppa över fel-decket och bara lägga till nya ord",
      "Förväxla närliggande synonymer",
    ],
    tempo: "Sikta på cirka 50 sekunder per ord. Tvekan mer än så: gissa, markera, gå vidare.",
    steps: [
      "15–25 nya ord per dag plus repetition av felkort.",
      "Gruppera efter stam så ett ord ger flera.",
      "Använd appens flashcards varje morgon innan nya ord.",
      "Plocka fem ORD-ord ur varje sakprosatext du läser.",
      "Vecko-check: minst 80 % rätt på ett blandat mini-set.",
    ],
  },
  {
    id: "LAS",
    title: "LÄS — Svensk läsförståelse",
    tests: "Stöd i texten — inte vad som känns rimligt.",
    mistakes: [
      "Svara från allmänkunskap i stället för texten",
      "Läsa för långsamt och få tidsbrist på sista texterna",
      "Missad negation eller begränsning i frågan",
    ],
    tempo: "Sikta på cirka 110 sekunder per fråga inklusive läsning. Skumma frågan först.",
    steps: [
      "Läs frågan, sedan texten med den i bakhuvudet.",
      "Markera belägg — en mening som bär svaret.",
      "Daglig sakprosa i läsbiblioteket, en mening sammanfattning.",
      "Tidsatta LÄS-pass: samma klocka som på provet.",
      "Felanalys: var det avläsning, förhastad slutsats eller tid?",
    ],
  },
  {
    id: "ELF",
    title: "ELF — Engelsk läsförståelse",
    tests: "Huvudpoäng, attityd och stöd — på engelska.",
    mistakes: [
      "Översätta ord för ord och tappa helheten",
      "Låta ELF-tempot dippa för att verbala flaskhalsar tar all tid",
      "Gissa från rubrik utan att kolla stycket",
    ],
    tempo: "Sikta på cirka 110 sekunder per fråga. Lätt underhåll räcker om du redan ligger högt.",
    steps: [
      "Ett underhållspass i veckan så tempot inte dipsar.",
      "Lätt engelsk sakprosa om du känner avstånd till språket.",
      "Analysera bara tydliga fel — slösa inte tid på 50/50-känsla.",
      "Samma metod som LÄS: fråga först, belägg i texten.",
      "Om trenden pekar ner: två–tre pass med felanalys, inte mer volym.",
    ],
  },
  {
    id: "DTK",
    title: "DTK — Diagram, tabeller och kartor",
    tests: "Axlar, enheter och vad frågan faktiskt frågar.",
    mistakes: [
      "Räkna innan du läst enheter och tidsperiod",
      "Använda fel rad/kolumn i tabellen",
      "Bli kvar för länge på en 'omöjlig' figur",
    ],
    tempo: "Sikta på cirka 100 sekunder per fråga. Stryk irrelevant data innan du räknar.",
    steps: [
      "Läs axlar, legend och enheter högt för dig själv.",
      "Stryk det som inte behövs, räkna sedan.",
      "Felanalys i tre fack: avläsning, räkning, feltolkad fråga.",
      "Öva blandade figurer, inte bara den typ du gillar.",
      "Hoppa: en svår DTK ska inte äta tre lätta.",
    ],
  },
  {
    id: "XYZ",
    title: "XYZ — Matematisk problemlösning",
    tests: "Modell, ekvation och rimlighetskoll.",
    mistakes: [
      "Räkna färdigt trots att ett svarsalternativ redan syns",
      "Enhetsfel och glömda parenteser",
      "Överplugga när XYZ redan är en styrka",
    ],
    tempo: "Sikta på cirka 82 sekunder. Om du inte ser en väg på 20 sekunder: nästa fråga.",
    steps: [
      "Blandade set, inte bara favoritkapitlet.",
      "Felanalys per typ: ekvation, procent, geometri, ränta.",
      "Håll handen varm med korta pass, inte tre timmar matte.",
      "Rita och uppskatta innan du räknar exakt.",
      "Extra tid bara om XYZ är din kvantitativa lucka.",
    ],
  },
  {
    id: "KVA",
    title: "KVA — Kvantitativa jämförelser",
    tests: "Jämför två storheter utan full uträkning.",
    mistakes: [
      "Räkna fullt i onödan",
      "Glömma att 'går inte att avgöra' är ett alternativ",
      "Testa bara positiva tal när uttrycket ändrar tecken",
    ],
    tempo: "Sikta på cirka 70 sekunder. Jämför, förenkla, avgör.",
    steps: [
      "Öva att se relationen utan full uträkning.",
      "Prova gränsvärden: 0, 1, negativt, stort.",
      "Korta set under tid — KVA dör av långsamhet.",
      "Felanalys per mönster: bråk, exponent, geometri.",
      "Om du ligger över tempo: färre uträkningar, mer jämförelse.",
    ],
  },
  {
    id: "NOG",
    title: "NOG — Kvantitativa resonemang",
    tests: "Räcker (1), (2), båda eller ingetdera?",
    mistakes: [
      "Börja räkna svaret i stället för att fråga 'räcker det?'",
      "Blanda ihop 'båda behövs' och 'varje räcker ensam'",
      "Rita inte upp vad varje uppgift ger",
    ],
    tempo: "Sikta på cirka 82 sekunder. Målet är beslut, inte ett numeriskt svar.",
    steps: [
      "För varje påstående: 'kan jag avgöra storheten med bara detta?'",
      "Rita två kolumner: vad (1) ger, vad (2) ger.",
      "Korta set med direkt felanalys.",
      "Lär de fem svarsalternativen utantill så du inte tvekar på formen.",
      "Om tempo brister: sluta räkna klart, stanna vid tillräcklighet.",
    ],
  },
];

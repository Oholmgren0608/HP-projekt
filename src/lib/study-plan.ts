export type SectionId = "ORD" | "LAS" | "MEK" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK";

export type Priority = "kritiskt" | "huvudfokus" | "underhall" | "styrka";

export type StudyTask = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  section: SectionId;
};

export type WeekPlan = {
  week: number;
  phase: string;
  theme: string;
  focus: string;
  tasks: StudyTask[];
};

export type SectionGuide = {
  id: SectionId;
  name: string;
  short: string;
  priority: Priority;
  scoreLabel: string;
  why: string;
  methods: string[];
  weeklyGoal: string;
};

export type DelprovScore = {
  id: SectionId;
  name: string;
  correct: number;
  total: number;
  block: "kvant" | "verbal";
};

export const PROFILE = {
  previousQuant: 1.4,
  previousVerbal: 1.0,
  overall: 1.2,
  cohortMean: 0.9,
  totalCorrect: 113,
  totalQuestions: 160,
  targetOverall: "1,6–1,8",
  targetVerbal: "1,4+",
  weeksUntilExam: 8,
  hoursPerWeek: 10,
};

export const DELPROV_SCORES: DelprovScore[] = [
  { id: "KVA", name: "Kvantitativa jämförelser", correct: 15, total: 20, block: "kvant" },
  { id: "DTK", name: "Diagram, tabeller och kartor", correct: 16, total: 24, block: "kvant" },
  { id: "XYZ", name: "Matematik problemlösning", correct: 21, total: 24, block: "kvant" },
  { id: "NOG", name: "Kvantitativa resonemang", correct: 10, total: 12, block: "kvant" },
  { id: "ORD", name: "Ordförståelse", correct: 11, total: 20, block: "verbal" },
  { id: "LAS", name: "Läsförståelse svenska", correct: 15, total: 20, block: "verbal" },
  { id: "MEK", name: "Meningskomplettering", correct: 8, total: 20, block: "verbal" },
  { id: "ELF", name: "Läsförståelse engelska", correct: 17, total: 20, block: "verbal" },
];

export function pct(correct: number, total: number): number {
  return Math.round((correct / total) * 100);
}

export const SECTIONS: SectionGuide[] = [
  {
    id: "MEK",
    name: "MEK — Meningskomplettering",
    short: "MEK",
    priority: "kritiskt",
    scoreLabel: "8/20 (40 %)",
    why: "Din tydligaste flaskhals. Här finns flest ‘billiga’ poäng kvar på verbala — mer än LÄS som redan ligger på 75 %.",
    methods: [
      "Träna konnektorer dagligen: emellertid, således, däremot, respektive, i synnerhet, oaktat, destomer",
      "Läs varje alternativ högt — fel svar bryter ofta ton, tempus eller orsaksrelation",
      "Eliminera först: stryk det som är stilmässigt fel, sedan det som är logiskt fel",
      "Gör korta MEK-set (10–15 frågor) 5–6 dagar i veckan, alltid med felanalys",
      "När du läser sakprosa: markera bindningar mellan satser — det är MEK-träning i smyg",
    ],
    weeklyGoal: "5–6 MEK-set + personlig fel-lista över konnektorer/register",
  },
  {
    id: "ORD",
    name: "ORD — Ordförståelse",
    short: "ORD",
    priority: "huvudfokus",
    scoreLabel: "11/20 (55 %)",
    why: "Näst största luckan. ORD är träningsbart: varje ord du lär dig kan bli en direkt poäng.",
    methods: [
      "15–25 nya ord per dag från gamla HP-prov + ord du möter i läsning",
      "Aktiv recall: se ordet → säg betydelsen innan du tittar",
      "Gruppera efter stammar (geo-, -logi, in-/ut-) så ett ord ger flera",
      "Repetera felord samma kväll och nästa morgon — fel-decket går före nya ord",
    ],
    weeklyGoal: "120+ ord i systemet, ≥80 % rätt på veckans ORD-test",
  },
  {
    id: "LAS",
    name: "LÄS — Svensk läsförståelse",
    short: "LÄS",
    priority: "underhall",
    scoreLabel: "15/20 (75 %)",
    why: "Redan hyfsat. Behåll nivån med daglig sakprosa och 1–2 tidsatta pass/vecka — jaga inte LÄS på bekostnad av MEK/ORD.",
    methods: [
      "Fortsätt daglig sakprosa (Under strecket, DN Ledare, FoF) — det matar också ORD och MEK",
      "1–2 tidsatta LÄS-pass per vecka räcker i basfasen",
      "Efter fel: hitta bevisraden i texten — slarv vs. missförstånd",
      "Öka till 3 pass först om du dippar under ~70 % på övningsprov",
    ],
    weeklyGoal: "Daglig läsning + 1–2 tidsatta LÄS-pass",
  },
  {
    id: "ELF",
    name: "ELF — Engelsk läsförståelse",
    short: "ELF",
    priority: "styrka",
    scoreLabel: "17/20 (85 %)",
    why: "En av dina starkaste delar. Skydda den med lätt underhåll — lägg inte mer tid här än nödvändigt.",
    methods: [
      "Ett ELF-pass varannan vecka i basfasen, ett per vecka sista månaden",
      "Lätt engelsk sakprosa för flyt om du vill, men MEK/ORD går före",
    ],
    weeklyGoal: "Max 1 underhållspass",
  },
  {
    id: "DTK",
    name: "DTK — Diagram, tabeller och kartor",
    short: "DTK",
    priority: "underhall",
    scoreLabel: "16/24 (67 %)",
    why: "Svagaste kvantitativa delen. Här finns mest att hämta på kvant utan att röra XYZ/NOG som redan är starka.",
    methods: [
      "Ett DTK-pass per vecka: tempo + noggrann avläsning av axlar/enheter",
      "Öva att stryka irrelevante data innan du räknar",
      "Felanalys: avläsningsfel vs. räknefel vs. feltolkad fråga",
    ],
    weeklyGoal: "1 fokuserat DTK-pass (~45–60 min)",
  },
  {
    id: "XYZ",
    name: "Övrig kvant (XYZ, KVA, NOG)",
    short: "KVA",
    priority: "styrka",
    scoreLabel: "XYZ 88 % · KVA 75 % · NOG 83 %",
    why: "XYZ och NOG är riktigt starka; KVA är okej. Underhåll blandat — jaga inte tiondelar här först.",
    methods: [
      "1 blandat kvantpass/vecka utöver DTK",
      "Varannan vecka: kort KVA-set om du vill putsa 15/20 → 17/20",
      "Fullt kvantitativt delprov var 2.–3. vecka för att bekräfta 1,4-nivån",
    ],
    weeklyGoal: "1 blandat underhållspass + DTK",
  },
];

export const STRATEGY = [
  {
    title: "MEK först — sedan ORD",
    body: "8/20 på MEK och 11/20 på ORD drar ner hela verbala. LÄS (15/20) och ELF (17/20) är redan okej. Omfördela tiden: ~35 % MEK, ~30 % ORD, resten underhåll.",
  },
  {
    title: "Läsning ska mata MEK och ORD",
    body: "Daglig sakprosa är inte mest för LÄS längre — den är bränsle till ordförråd och konnektorer. Markera bindningar och svåra ord varje gång.",
  },
  {
    title: "På kvant: DTK före mer XYZ",
    body: "XYZ 21/24 och NOG 10/12 är redan toppskikt. DTK 16/24 är den kvantitativa luckan om du vill lyfta 1,4 utan att överplugga matte.",
  },
  {
    title: "Felanalys slår volym",
    body: "Efter varje MEK/ORD-pass: skriv varför rätt svar är rätt. Tre genomtänkta set ger mer än tio slarviga.",
  },
];

export const TIME_SPLIT = [
  { label: "MEK", pct: 35, note: "dagliga korta set" },
  { label: "ORD", pct: 30, note: "morgon + fel-deck" },
  { label: "Läsning / LÄS", pct: 15, note: "sakprosa + 1–2 pass" },
  { label: "DTK + kvant", pct: 12, note: "främst DTK" },
  { label: "ELF", pct: 8, note: "lätt underhåll" },
];

export const WEEKLY_PLANS: WeekPlan[] = [
  {
    week: 1,
    phase: "Bas",
    theme: "MEK-rutin + ORD-system",
    focus: "Sätt daglig MEK och ett ord-system du orkar hålla. LÄS/ELF får vänta.",
    tasks: [
      {
        id: "w1-mek",
        title: "MEK: kort set 5–6 dagar",
        detail: "10–15 frågor/gång. Bygg en lista över konnektorer och registerfel du missar.",
        minutes: 35,
        section: "MEK",
      },
      {
        id: "w1-ord",
        title: "ORD: 20 ord/dag + kvällsrepetition",
        detail: "Anki eller anteckningar. Repetera gårdagens ord varje morgon innan nya.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w1-las",
        title: "Sakprosa dagligen (för ORD/MEK)",
        detail: "En text. Plocka 5 ord + markera 3 konnektorer. Ingen tidsatt LÄS ännu.",
        minutes: 25,
        section: "LAS",
      },
      {
        id: "w1-dtk",
        title: "DTK: ett tempo-pass",
        detail: "Fokus avläsning (axlar, enheter, legend). Notera feltyp.",
        minutes: 50,
        section: "DTK",
      },
    ],
  },
  {
    week: 2,
    phase: "Bas",
    theme: "MEK under tid",
    focus: "Öka MEK-volymen och börja tidsätta. ORD fortsätter oförändrat.",
    tasks: [
      {
        id: "w2-mek",
        title: "MEK: 6 set, varav 3 under tid",
        detail: "Jämför fel: kunskap (konnektor) vs. slarv vs. tempo.",
        minutes: 40,
        section: "MEK",
      },
      {
        id: "w2-ord",
        title: "ORD: 25 ord/dag + helgtest",
        detail: "Helgen: testa dig på 80–100 ord. Felord in i prioritetsdeck.",
        minutes: 40,
        section: "ORD",
      },
      {
        id: "w2-las",
        title: "LÄS: ett tidsatt pass",
        detail: "Bekräfta att 75 %-nivån håller. Mer LÄS bara om det dippar.",
        minutes: 45,
        section: "LAS",
      },
      {
        id: "w2-kva",
        title: "Blandat kvant (lätt) + DTK",
        detail: "Kort DTK + några KVA. Rör inte XYZ i onödan.",
        minutes: 55,
        section: "DTK",
      },
    ],
  },
  {
    week: 3,
    phase: "Bas",
    theme: "Konnektorer på djupet",
    focus: "MEK-fel ska bli mönster du känner igen, inte engångshändelser.",
    tasks: [
      {
        id: "w3-mek",
        title: "MEK: tematiska set (orsak, kontrast, tillägg)",
        detail: "Öva en konnektor-familj per pass. Skriv egna exempelmeningar.",
        minutes: 40,
        section: "MEK",
      },
      {
        id: "w3-ord",
        title: "ORD: fel-deck före nya ord",
        detail: "Inga nya ord förrän gårdagens fel sitter. Stam-gruppering.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w3-read",
        title: "Sakprosa med MEK-glasögon",
        detail: "Under strecket/ledare: markera varje satskoppling. 5 ORD-ord.",
        minutes: 25,
        section: "MEK",
      },
      {
        id: "w3-elf",
        title: "ELF: ett lätt underhållspass",
        detail: "Behålla 85 %. Analysera bara uppenbara fel.",
        minutes: 40,
        section: "ELF",
      },
    ],
  },
  {
    week: 4,
    phase: "Bas",
    theme: "Verbala avstämningen",
    focus: "Mät lyftet på MEK/ORD. Justera planen efter resultatet.",
    tasks: [
      {
        id: "w4-verbal",
        title: "Hela verbala delen under tid",
        detail: "Jämför särskilt MEK (mål ≥12/20) och ORD (mål ≥14/20) mot förra HP.",
        minutes: 110,
        section: "MEK",
      },
      {
        id: "w4-analys",
        title: "Djup felanalys samma dag",
        detail: "Kunskap / slarv / tid per delprov. Skriv tre konkreta justeringar.",
        minutes: 45,
        section: "ORD",
      },
      {
        id: "w4-patch",
        title: "Lappa MEK eller ORD (det som föll mest)",
        detail: "Dubbla den delen 3 dagar. LÄS/ELF orörda om de höll.",
        minutes: 50,
        section: "MEK",
      },
      {
        id: "w4-dtk",
        title: "DTK + kort kvant-check",
        detail: "Bekräfta att kvant 1,4 håller. Extra DTK om avläsning fortfarande krånglar.",
        minutes: 70,
        section: "DTK",
      },
    ],
  },
  {
    week: 5,
    phase: "Teknik",
    theme: "Tempo på MEK och ORD",
    focus: "Samma material, högre precision under tid.",
    tasks: [
      {
        id: "w5-mek",
        title: "MEK: tidspress + elimineringsteknik",
        detail: "Stryk två alternativ innan du väljer. Notera när magkänsla vs. regel vinner.",
        minutes: 40,
        section: "MEK",
      },
      {
        id: "w5-ord",
        title: "ORD: 30 frågor på tid",
        detail: "Snabb igenkänning. Gissa inte — lämna och återkom om du kör fast.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w5-las",
        title: "LÄS: två tidsatta pass",
        detail: "Putsa mot 16–17/20 om energin räcker efter MEK/ORD.",
        minutes: 50,
        section: "LAS",
      },
      {
        id: "w5-dtk",
        title: "DTK: ett hårt tempo-pass",
        detail: "Mål: färre avläsningsfel under tid.",
        minutes: 45,
        section: "DTK",
      },
    ],
  },
  {
    week: 6,
    phase: "Teknik",
    theme: "Halvprov verbalt",
    focus: "Två verbala block under tid. Jämför med vecka 4.",
    tasks: [
      {
        id: "w6-half1",
        title: "Halvprov A: ORD + MEK",
        detail: "Dina flaskhalsar tillsammans. Direkt felanalys.",
        minutes: 70,
        section: "MEK",
      },
      {
        id: "w6-half2",
        title: "Halvprov B: LÄS + ELF",
        detail: "Skydda styrkorna. Jämför råpoäng med förra HP.",
        minutes: 70,
        section: "LAS",
      },
      {
        id: "w6-ord",
        title: "ORD: intensiv felord-vecka",
        detail: "Inga nya ord förrän fel-decket är stabilt.",
        minutes: 40,
        section: "ORD",
      },
      {
        id: "w6-kva",
        title: "Kvant underhåll (DTK-tungt)",
        detail: "2 kortare pass. Håll handen varm.",
        minutes: 50,
        section: "DTK",
      },
    ],
  },
  {
    week: 7,
    phase: "Fullprov",
    theme: "Första hela HP",
    focus: "Simulera provdagen. Utvärdera energi — MEK brukar dippa sent.",
    tasks: [
      {
        id: "w7-full",
        title: "Hela Högskoleprovet under tid",
        detail: "Riktiga pauser. Notera var koncentrationen föll (ofta MEK).",
        minutes: 235,
        section: "MEK",
      },
      {
        id: "w7-review",
        title: "Tvådagaranalys",
        detail: "Dag 1 rätt/fel. Dag 2: mönster. Målbild MEK ≥14, ORD ≥15.",
        minutes: 90,
        section: "ORD",
      },
      {
        id: "w7-patch",
        title: "Lappa största luckan",
        detail: "Nästan alltid MEK eller ORD. Inte ELF. Inte XYZ.",
        minutes: 60,
        section: "MEK",
      },
      {
        id: "w7-light",
        title: "Lätt DTK + ELF",
        detail: "Korta pass, ingen utmattning.",
        minutes: 45,
        section: "DTK",
      },
    ],
  },
  {
    week: 8,
    phase: "Finish",
    theme: "Puts och vila",
    focus: "Repetera MEK-regler och ORD-deck. Spara energi till provdagen.",
    tasks: [
      {
        id: "w8-mek",
        title: "MEK: lätta set + konnektorlista",
        detail: "Inga nya knep. Bara det du redan kan, lugnt tempo.",
        minutes: 30,
        section: "MEK",
      },
      {
        id: "w8-ord",
        title: "ORD: bara repetition",
        detail: "Inga nya ord sista 3–4 dagarna.",
        minutes: 30,
        section: "ORD",
      },
      {
        id: "w8-mock",
        title: "Valfritt halvprov senast onsdag",
        detail: "ORD+MEK. Inget fullprov sista två dagarna.",
        minutes: 70,
        section: "MEK",
      },
      {
        id: "w8-rest",
        title: "Sömn, mat, logistik",
        detail: "Resväg, ID, pennor. Sista kvällen max 20 min ORD.",
        minutes: 20,
        section: "ELF",
      },
    ],
  },
];

export const DAILY_TEMPLATE = [
  { slot: "Morgon (30–40 min)", item: "ORD-repetition + 15–25 nya ord" },
  { slot: "Huvudpass (35–45 min)", item: "MEK-set under tid + felanalys (nästan varje dag)" },
  { slot: "Lunch/kväll (20–25 min)", item: "Sakprosa: 5 ORD-ord + markera konnektorer" },
  { slot: "Underhåll (2×/vecka)", item: "DTK-pass; ELF högst varannan vecka" },
  { slot: "Söndag (60–90 min)", item: "Felanalys, uppdatera MEK-lista och ORD-deck" },
];

export type ReadingItem = {
  title: string;
  kind: string;
  why: string;
  how: string;
  cadence: string;
  href: string | null;
};

export const READING_LIST: ReadingItem[] = [
  {
    title: "SvD Under strecket",
    kind: "Essä / kulturhistoria",
    why: "Långa meningar och formella bindningar — perfekt MEK-träning utöver ORD.",
    how: "En essä. Markera konnektorer, skriv huvudpoängen i en mening, plocka 5 ord.",
    cadence: "3–4×/vecka",
    href: "https://www.svd.se/under-strecket",
  },
  {
    title: "DN Ledare & Kultur",
    kind: "Opinion + essä",
    why: "Tydlig tes/struktur och skriftspråklig ton — bra för både MEK-register och LÄS-underhåll.",
    how: "En ledare. Hitta tesen, två stöd och tre konnektorer.",
    cadence: "Dagligen (15–20 min)",
    href: "https://www.dn.se/",
  },
  {
    title: "Forskning & Framsteg",
    kind: "Populärvetenskap",
    why: "Saklig prosa och fackord i kontext — matar ORD utan att kräva mer LÄS-drill.",
    how: "Ett artikelkapitel. Sammanfatta + 5 ORD-ord.",
    cadence: "2–3×/vecka",
    href: "https://fof.se/",
  },
  {
    title: "Språktidningen",
    kind: "Språk & stil",
    why: "Direkt relevant för MEK: register, nyanser och satsfogning.",
    how: "En kort artikel. Lägg termer/konnektorer i MEK-listan.",
    cadence: "1–2×/vecka",
    href: "https://spraktidningen.se/",
  },
  {
    title: "Filosofiska rummet (SR)",
    kind: "Resonemang (komplement)",
    why: "Tränar att följa långa kedjor — hjälper LÄS-underhåll utan att ta MEK-tid.",
    how: "Lyssna eller läs referat. Skriv premiss → mellansteg → slutsats.",
    cadence: "1×/vecka",
    href: "https://sverigesradio.se/filosofiskarummet",
  },
  {
    title: "Shorter sakprosa / essäbok",
    kind: "Bok — ett kapitel/dag",
    why: "Kontinuerlig exponering för formellt skriftspråk. Välj essä, inte deckare.",
    how: "10–15 sidor. Fokus meningar, bindningar, ordval.",
    cadence: "Dagligen om du orkar",
    href: null,
  },
];

export const READING_BOOK_PICKS = [
  {
    title: "Ola Wikander — språk-/etymologiessäer",
    note: "Direkt boost till ORD.",
  },
  {
    title: "Essäsamlingar (DN/SvD-antologier, svenska essäister)",
    note: "Hellre korta essäer än tjock roman när målet är MEK + ORD.",
  },
  {
    title: "Populärvetenskap på svenska",
    note: "Precist språk kring abstrakta ämnen — bra ord + sakprosa-flyt.",
  },
];

export const READING_METHOD = [
  "Primärt mål med läsning nu: ORD-ord + MEK-konnektorer (LÄS är redan 75 %).",
  "Efter varje text: en mening sammanfattning utan att titta tillbaka.",
  "Plocka 5 ord/uttryck → ORD-decket samma dag.",
  "Markera konnektorer (emellertid, således, däremot…) — det är din MEK-träning.",
  "Undvik sport/nöje/talspråkskrönikor — för låg densitet för HP.",
];

export const RESOURCES = [
  {
    title: "Gamla högskoleprov",
    body: "Primärmaterialet. Prioritera MEK- och ORD-uppgifter från flera prov.",
    href: "https://www.studera.nu/hogskoleprov/forberedelser/gamla-hogskoleprov/",
  },
  {
    title: "ORD-ordlistor & flashcards",
    body: "Bygg deck från provorden + läsorden. Aktiv recall slår passiv genomläsning.",
    href: null,
  },
  {
    title: "Daglig sakprosa",
    body: "Under strecket, DN Ledare, FoF, Språktidningen — se läslistan.",
    href: "#laslista",
  },
  {
    title: "MEK-konnektorlista",
    body: "Emellertid, således, destomer, i synnerhet, respektive, oaktat, däremot, följaktligen…",
    href: null,
  },
];

export function sectionLabel(id: SectionId): string {
  const map: Partial<Record<SectionId, string>> = {
    LAS: "LÄS",
    KVA: "Kvant",
  };
  return map[id] ?? id;
}

export function priorityLabel(p: Priority): string {
  if (p === "kritiskt") return "Kritiskt";
  if (p === "huvudfokus") return "Huvudfokus";
  if (p === "underhall") return "Underhåll";
  return "Styrka";
}

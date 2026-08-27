import type { PracticeKind } from "@/lib/practice";

export type SectionId = "ORD" | "LAS" | "MEK" | "ELF" | "XYZ" | "KVA" | "NOG" | "DTK";

export type Priority = "kritiskt" | "huvudfokus" | "underhall" | "styrka";

export type StudyTask = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  section: SectionId;
  /** Interaktiva övningar som körs på webbsidan */
  practiceKinds: PracticeKind[];
  questionCount?: number;
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
        title: "MEK: kort set",
        detail: "Öva konnektorer och register direkt här. Bygg känsla för vad som låter fel.",
        minutes: 35,
        section: "MEK",
        practiceKinds: ["mek"],
        questionCount: 8,
      },
      {
        id: "w1-ord",
        title: "ORD: ordförståelse",
        detail: "Träna aktiva ord med flerval. Felord dyker upp igen i nästa set.",
        minutes: 35,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 10,
      },
      {
        id: "w1-las",
        title: "LÄS: sakprosatext + frågor",
        detail: "Kort pass med huvudpoäng och textstöd — matar också ORD/MEK-tänket.",
        minutes: 25,
        section: "LAS",
        practiceKinds: ["las"],
        questionCount: 4,
      },
      {
        id: "w1-dtk",
        title: "DTK: tabellövning",
        detail: "Läs av tabeller under tid. Notera om felen är avläsning eller räkning.",
        minutes: 50,
        section: "DTK",
        practiceKinds: ["dtk"],
        questionCount: 4,
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
        title: "MEK: längre set",
        detail: "Fler frågor. Jämför fel: kunskap vs. slarv vs. tempo.",
        minutes: 40,
        section: "MEK",
        practiceKinds: ["mek"],
        questionCount: 10,
      },
      {
        id: "w2-ord",
        title: "ORD: utökat set",
        detail: "Fler ord per pass. Sikta på stabil igenkänning.",
        minutes: 40,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 12,
      },
      {
        id: "w2-las",
        title: "LÄS: tidsatt pass",
        detail: "Bekräfta att 75 %-nivån håller.",
        minutes: 45,
        section: "LAS",
        practiceKinds: ["las"],
        questionCount: 4,
      },
      {
        id: "w2-kva",
        title: "DTK: blandat underhåll",
        detail: "Kort DTK-pass. Rör inte XYZ i onödan.",
        minutes: 55,
        section: "DTK",
        practiceKinds: ["dtk"],
        questionCount: 5,
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
        title: "MEK: konnektor-fokus",
        detail: "Öva kontrast, orsak och tillägg. Läs varje alternativ högt i huvudet.",
        minutes: 40,
        section: "MEK",
        practiceKinds: ["mek"],
        questionCount: 10,
      },
      {
        id: "w3-ord",
        title: "ORD: repetitionstungt set",
        detail: "Prioritera precist betydelseval framför gissning.",
        minutes: 35,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 10,
      },
      {
        id: "w3-read",
        title: "MEK + ORD: blandat läspass",
        detail: "Kort LÄS plus MEK — träna bindningar i kontext.",
        minutes: 25,
        section: "MEK",
        practiceKinds: ["mek", "las"],
        questionCount: 8,
      },
      {
        id: "w3-elf",
        title: "ELF: underhåll",
        detail: "Behålla 85 %. Analysera bara uppenbara fel.",
        minutes: 40,
        section: "ELF",
        practiceKinds: ["elf"],
        questionCount: 3,
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
        title: "Verbalt blandpass (ORD+MEK+LÄS+ELF)",
        detail: "Simulera verbal bredd. Jämför särskilt MEK och ORD mot förra HP.",
        minutes: 110,
        section: "MEK",
        practiceKinds: ["ord", "mek", "las", "elf"],
        questionCount: 16,
      },
      {
        id: "w4-analys",
        title: "Felanalys",
        detail: "Kunskap / slarv / tid. Skriv tre konkreta justeringar.",
        minutes: 45,
        section: "ORD",
        practiceKinds: ["reflect"],
      },
      {
        id: "w4-patch",
        title: "Lappa MEK + ORD",
        detail: "Dubbla flaskhalsarna efter avstämningen.",
        minutes: 50,
        section: "MEK",
        practiceKinds: ["mek", "ord"],
        questionCount: 12,
      },
      {
        id: "w4-dtk",
        title: "DTK-check",
        detail: "Bekräfta kvant-underhållet via DTK.",
        minutes: 70,
        section: "DTK",
        practiceKinds: ["dtk"],
        questionCount: 5,
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
        title: "MEK: tempo",
        detail: "Eliminera två alternativ innan du väljer.",
        minutes: 40,
        section: "MEK",
        practiceKinds: ["mek"],
        questionCount: 10,
      },
      {
        id: "w5-ord",
        title: "ORD: tempo",
        detail: "Snabb igenkänning utan panikgissning.",
        minutes: 35,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 12,
      },
      {
        id: "w5-las",
        title: "LÄS: teknikpass",
        detail: "Putsa mot högre råpoäng om energin räcker.",
        minutes: 50,
        section: "LAS",
        practiceKinds: ["las"],
        questionCount: 6,
      },
      {
        id: "w5-dtk",
        title: "DTK: tempo",
        detail: "Färre avläsningsfel under tid.",
        minutes: 45,
        section: "DTK",
        practiceKinds: ["dtk"],
        questionCount: 5,
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
        detail: "Dina flaskhalsar tillsammans. Direkt resultat efteråt.",
        minutes: 70,
        section: "MEK",
        practiceKinds: ["ord", "mek"],
        questionCount: 14,
      },
      {
        id: "w6-half2",
        title: "Halvprov B: LÄS + ELF",
        detail: "Skydda styrkorna.",
        minutes: 70,
        section: "LAS",
        practiceKinds: ["las", "elf"],
        questionCount: 7,
      },
      {
        id: "w6-ord",
        title: "ORD: intensivt set",
        detail: "Stabilisera orden du missar.",
        minutes: 40,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 12,
      },
      {
        id: "w6-kva",
        title: "DTK-underhåll",
        detail: "Håll handen varm.",
        minutes: 50,
        section: "DTK",
        practiceKinds: ["dtk"],
        questionCount: 5,
      },
    ],
  },
  {
    week: 7,
    phase: "Fullprov",
    theme: "Första hela HP",
    focus: "Simulera bredden. Utvärdera energi — MEK brukar dippa sent.",
    tasks: [
      {
        id: "w7-full",
        title: "Bred simulering (alla delar)",
        detail: "Blandat set över ORD, MEK, LÄS, ELF och DTK. Notera var energin föll.",
        minutes: 90,
        section: "MEK",
        practiceKinds: ["ord", "mek", "las", "elf", "dtk"],
        questionCount: 18,
      },
      {
        id: "w7-review",
        title: "Tvådagaranalys",
        detail: "Mönster per delprov. Målbild MEK och ORD uppåt.",
        minutes: 90,
        section: "ORD",
        practiceKinds: ["reflect"],
      },
      {
        id: "w7-patch",
        title: "Lappa största luckan",
        detail: "MEK + ORD — inte ELF/XYZ.",
        minutes: 60,
        section: "MEK",
        practiceKinds: ["mek", "ord"],
        questionCount: 12,
      },
      {
        id: "w7-light",
        title: "Lätt DTK + ELF",
        detail: "Korta pass, ingen utmattning.",
        minutes: 45,
        section: "DTK",
        practiceKinds: ["dtk", "elf"],
        questionCount: 6,
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
        title: "MEK: lätt repetition",
        detail: "Inga nya knep. Bara det du redan kan.",
        minutes: 30,
        section: "MEK",
        practiceKinds: ["mek"],
        questionCount: 6,
      },
      {
        id: "w8-ord",
        title: "ORD: lätt repetition",
        detail: "Inga nya ord — bara bekanta.",
        minutes: 30,
        section: "ORD",
        practiceKinds: ["ord"],
        questionCount: 8,
      },
      {
        id: "w8-mock",
        title: "Halvprov ORD + MEK",
        detail: "Senast mitt i veckan. Spara energi sista dagarna.",
        minutes: 70,
        section: "MEK",
        practiceKinds: ["ord", "mek"],
        questionCount: 12,
      },
      {
        id: "w8-rest",
        title: "Provdags-check",
        detail: "Logistik, sömn och sista lätta repetitionen.",
        minutes: 20,
        section: "ELF",
        practiceKinds: ["reflect"],
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
    body: "Officiella häften och facit inbäddade på den här sidan (från UHR/studera.nu).",
    href: "/prov",
  },
  {
    title: "ORD-ordlistor & flashcards",
    body: "Aktiv recall med ORD-ord, läsbibliotekets vokabulär och MEK-konnektorer.",
    href: "/ova",
  },
  {
    title: "Daglig sakprosa",
    body: "Läs färdiga essäer i appens läsbibliotek — ORD-ord och konnektorer ingår.",
    href: "/ova",
  },
  {
    title: "MEK-konnektorlista",
    body: "Träna konnektorer som flashcards — emellertid, således, oaktat…",
    href: "/ova",
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

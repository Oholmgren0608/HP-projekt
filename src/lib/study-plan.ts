export type SectionId = "ORD" | "LAS" | "MEK" | "ELF" | "KVA";

export type Priority = "huvudfokus" | "underhall" | "latt";

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
  why: string;
  methods: string[];
  weeklyGoal: string;
};

export const PROFILE = {
  previousQuant: 1.4,
  previousVerbal: 1.0,
  targetOverall: "1,6–1,8",
  targetVerbal: "1,4+",
  weeksUntilExam: 8,
  hoursPerWeek: 10,
};

export const SECTIONS: SectionGuide[] = [
  {
    id: "ORD",
    name: "ORD — Ordförståelse",
    short: "ORD",
    priority: "huvudfokus",
    why: "Snabbaste poänglyftet på verbala. Ord kunskaper syns direkt i poäng om du repeterar rätt.",
    methods: [
      "Lär 15–25 nya ord per dag från gamla HP-prov och ordlistor",
      "Använd aktiv recall: se ordet → säg betydelsen innan du tittar",
      "Gruppera efter stammar (geo-, -logi, in-/ut-) så ett ord ger flera",
      "Repetera felord samma kväll och nästa morgon",
    ],
    weeklyGoal: "120+ nya ord in i systemet, 80% rätt på veckans ORD-övning",
  },
  {
    id: "LAS",
    name: "LÄS — Svensk läsförståelse",
    short: "LÄS",
    priority: "huvudfokus",
    why: "Här avgörs verbala ofta. Du behöver tempo, precis läsning och att hitta huvudpoängen snabbt.",
    methods: [
      "Läs 1–2 längre sakprosatexter dagligen (DN Ledare, SvD Under strecket, Forskning & Framsteg)",
      "Efter varje text: sammanfatta huvudpoängen i en mening utan att titta",
      "Träna på att markera påståenden som stöds / inte stöds i texten",
      "Gör tidsatta LÄS-pass från gamla prov — analysera varje fel efteråt",
    ],
    weeklyGoal: "3 tidsatta LÄS-pass + daglig sakprosa",
  },
  {
    id: "MEK",
    name: "MEK — Meningskomplettering",
    short: "MEK",
    priority: "huvudfokus",
    why: "MEK belönar språklig känsla: konnektorer, stilnivå och logik i meningen.",
    methods: [
      "Öva konnektorer: emellertid, således, däremot, respektive, i synnerhet",
      "Läs högt och känn vilken variant som låter mest ‘skriftspråklig’",
      "Eliminera alternativ som bryter ton, tempus eller orsaksrelation",
      "Gör korta MEK-set (10–15 frågor) flera gånger i veckan",
    ],
    weeklyGoal: "4 MEK-set + lista över konnektorer du missar",
  },
  {
    id: "ELF",
    name: "ELF — Engelsk läsförståelse",
    short: "ELF",
    priority: "underhall",
    why: "Du är redan stark här. Målet är att inte tappa — inte att jaga mer poäng på bekostnad av svenska.",
    methods: [
      "Ett ELF-pass i veckan räcker under basfasen",
      "Läs engelsk sakprosa lätt (The Economist short reads, BBC) för flyt",
      "I slutfasen: 1–2 tidsatta ELF-pass för att behålla tempo",
    ],
    weeklyGoal: "1 underhållspass (öka till 2 sista 3 veckorna)",
  },
  {
    id: "KVA",
    name: "Kvantitativ del (XYZ, KVA, NOG, DTK)",
    short: "KVA",
    priority: "underhall",
    why: "1,4 är redan bra. Skydda nivån med regelbunden träning istället för att överplugga matte.",
    methods: [
      "2–3 kortare kvantpass per vecka (blandade uppgifter)",
      "Ett fullt kvantitativt delprov varannan vecka",
      "Felanalys: vilka uppgiftstyper drogs ner? Öva bara dem extra",
      "DTK: träna avläsningstempo — ofta billiga poäng",
    ],
    weeklyGoal: "3–4 timmar underhåll, mer bara om felanalys visar glapp",
  },
];

export const STRATEGY = [
  {
    title: "Verbala är flaskhalsen",
    body: "Med 1,0 verbalt och 1,4 kvantitativt ligger merparten av din möjliga höjning i ORD, LÄS och MEK. Lägg ~65–70 % av tiden där.",
  },
  {
    title: "Skydda styrkorna",
    body: "Engelska och matte ska hållas varma med underhåll — inte överges. Ett starkt snitt kräver att du inte tappar 1,4-nivån.",
  },
  {
    title: "Felanalys slår volym",
    body: "Efter varje pass: skriv ner varför rätt svar är rätt. Tre genomtänkta pass ger mer än tio slarviga.",
  },
  {
    title: "Fullprov efter teknik",
    body: "Börja inte med oändliga fullprov. Bygg ordförråd och lästeknik först, sedan tidsatta delprov, sedan hela HP.",
  },
];

export const WEEKLY_PLANS: WeekPlan[] = [
  {
    week: 1,
    phase: "Bas",
    theme: "Bygg systemet",
    focus: "Sätt ordvana, daglig läsning och en enkel rutin du orkar hålla.",
    tasks: [
      {
        id: "w1-ord",
        title: "ORD: 20 ord/dag + kvällsrepetition",
        detail: "Skapa en enkel lista (anteckningar eller Anki). Repetera gårdagens ord varje morgon.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w1-las",
        title: "LÄS: en sakprosatext varje dag",
        detail: "Sammanfatta huvudpoängen i en mening. Markera tre svåra ord.",
        minutes: 25,
        section: "LAS",
      },
      {
        id: "w1-mek",
        title: "MEK: 2 korta set (tis + tors)",
        detail: "Fokusera på konnektorer. Skriv ner varje nyansskillnad du missar.",
        minutes: 40,
        section: "MEK",
      },
      {
        id: "w1-kva",
        title: "Kvant: ett blandat pass",
        detail: "60–75 min blandade uppgifter. Notera uppgiftstyper du tvekar på.",
        minutes: 70,
        section: "KVA",
      },
    ],
  },
  {
    week: 2,
    phase: "Bas",
    theme: "Ord + läsning i djup",
    focus: "Öka ordförrådet och börja göra tidsatta svenska delprov.",
    tasks: [
      {
        id: "w2-ord",
        title: "ORD: 25 ord/dag + helgrepetition",
        detail: "Lägg till ord från veckans LÄS-texter. Helgen: testa dig själv på 80 ord.",
        minutes: 40,
        section: "ORD",
      },
      {
        id: "w2-las",
        title: "LÄS: 2 tidsatta pass",
        detail: "Använd gamla HP-prov. Efteråt: för varje fel, hitta bevisraden i texten.",
        minutes: 50,
        section: "LAS",
      },
      {
        id: "w2-mek",
        title: "MEK: 3 set + konnektorlista",
        detail: "Bygg en personlig lista med 30 konnektorer och exempelmeningar.",
        minutes: 45,
        section: "MEK",
      },
      {
        id: "w2-elf",
        title: "ELF: ett underhållspass",
        detail: "Håll tempot. Analysera bara uppenbara fel.",
        minutes: 40,
        section: "ELF",
      },
    ],
  },
  {
    week: 3,
    phase: "Bas",
    theme: "Stabil rutin",
    focus: "Samma struktur, högre kvalitet på felanalys.",
    tasks: [
      {
        id: "w3-ord",
        title: "ORD: daglig drill + felord-deck",
        detail: "Prioritera ord du missat tidigare. Nya ord får vänta om repetitionen halkar efter.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w3-las",
        title: "LÄS: 3 pass + en ‘svår’ tidningstext",
        detail: "Träna att skilja huvudpoäng från detaljer och exempel.",
        minutes: 55,
        section: "LAS",
      },
      {
        id: "w3-mek",
        title: "MEK: blandade set under tid",
        detail: "Sätt klocka. Gissa inte — eliminera först.",
        minutes: 45,
        section: "MEK",
      },
      {
        id: "w3-kva",
        title: "Kvant: fokusera svaga typer",
        detail: "Bara de typer du missade i vecka 1. Ett kort DTK-pass.",
        minutes: 60,
        section: "KVA",
      },
    ],
  },
  {
    week: 4,
    phase: "Bas",
    theme: "Första avstämningen",
    focus: "Mät läget med ett verbalt delprov och justera.",
    tasks: [
      {
        id: "w4-verbal",
        title: "Hela verbala delen under tid",
        detail: "ORD + LÄS + MEK + ELF. Räkna råpoäng. Jämför med förra HP.",
        minutes: 110,
        section: "LAS",
      },
      {
        id: "w4-analys",
        title: "Djup felanalys (samma dag)",
        detail: "Vilken del drog ner? Vilka fel var kunskap vs. slarv vs. tid?",
        minutes: 45,
        section: "ORD",
      },
      {
        id: "w4-ord",
        title: "ORD: återställ luckor",
        detail: "Dubbla repetitionen på de ord/områden som föll.",
        minutes: 40,
        section: "ORD",
      },
      {
        id: "w4-kva",
        title: "Kvant: ett delprov",
        detail: "Bekräfta att 1,4-nivån håller. Justera bara om det dippar.",
        minutes: 90,
        section: "KVA",
      },
    ],
  },
  {
    week: 5,
    phase: "Teknik",
    theme: "Tempo och precision",
    focus: "Korta, hårda pass. Teknik före volym.",
    tasks: [
      {
        id: "w5-ord",
        title: "ORD: tempo-övningar",
        detail: "30 frågor på tid. Målet: snabb igenkänning, inte gissning.",
        minutes: 35,
        section: "ORD",
      },
      {
        id: "w5-las",
        title: "LÄS: 3 tidsatta pass",
        detail: "Öva skumma → fråga → bevis. Hoppa inte mellan texter slumpmässigt.",
        minutes: 60,
        section: "LAS",
      },
      {
        id: "w5-mek",
        title: "MEK: stilnivå och register",
        detail: "Träna att höra formellt vs. vardagligt. Bygg meningar själv med svåra konnektorer.",
        minutes: 40,
        section: "MEK",
      },
      {
        id: "w5-elf",
        title: "ELF: ett tempo-pass",
        detail: "Behålla flyt. 40–50 minuter räcker.",
        minutes: 45,
        section: "ELF",
      },
    ],
  },
  {
    week: 6,
    phase: "Teknik",
    theme: "Svenska under press",
    focus: "Två verbala ‘halvprov’ och tät repetition.",
    tasks: [
      {
        id: "w6-half1",
        title: "Halvprov A: ORD + LÄS",
        detail: "Under tid. Direkt felanalys efteråt.",
        minutes: 80,
        section: "LAS",
      },
      {
        id: "w6-half2",
        title: "Halvprov B: MEK + ELF",
        detail: "Under tid. Jämför med vecka 4.",
        minutes: 70,
        section: "MEK",
      },
      {
        id: "w6-ord",
        title: "ORD: intensiv felord-vecka",
        detail: "Inga nya ord förrän fel-decket är under kontroll.",
        minutes: 40,
        section: "ORD",
      },
      {
        id: "w6-kva",
        title: "Kvant: blandat underhåll",
        detail: "2 kortare pass. Håll handen varm.",
        minutes: 50,
        section: "KVA",
      },
    ],
  },
  {
    week: 7,
    phase: "Fullprov",
    theme: "Första hela HP",
    focus: "Simulera provdagen och utvärdera energin.",
    tasks: [
      {
        id: "w7-full",
        title: "Hela Högskoleprovet under tid",
        detail: "Samma pauser som på riktiga provet. Inga störningar.",
        minutes: 235,
        section: "LAS",
      },
      {
        id: "w7-review",
        title: "Tvådagaranalys",
        detail: "Dag 1: rätt/fel. Dag 2: mönster per delprov och energi dippar.",
        minutes: 90,
        section: "ORD",
      },
      {
        id: "w7-patch",
        title: "Lappa största luckan",
        detail: "Om ORD faller → orddrill. Om LÄS → mer textbevis. Om MEK → konnektorer.",
        minutes: 60,
        section: "MEK",
      },
      {
        id: "w7-light",
        title: "Lätt underhåll kvant + ELF",
        detail: "Korta pass, inte utmattning.",
        minutes: 45,
        section: "KVA",
      },
    ],
  },
  {
    week: 8,
    phase: "Finish",
    theme: "Puts och vila",
    focus: "Repetera, sova, gå in fräsch. Inga nya tunga system.",
    tasks: [
      {
        id: "w8-ord",
        title: "ORD: bara repetition",
        detail: "Inga nya ord sista 3–4 dagarna. Bara det du redan kan.",
        minutes: 30,
        section: "ORD",
      },
      {
        id: "w8-las",
        title: "LÄS + MEK: lätta set",
        detail: "Ett pass mitt i veckan. Fokus på lugn och metod.",
        minutes: 50,
        section: "LAS",
      },
      {
        id: "w8-mock",
        title: "Valfritt: ett halvprov senast onsdag",
        detail: "Inget fullprov sista två dagarna. Spara energi.",
        minutes: 70,
        section: "MEK",
      },
      {
        id: "w8-rest",
        title: "Sömn, mat, tidig ankomst",
        detail: "Planera resväg, ID, pennor. Sista kvällen: lätt ORD-repetition max 20 min.",
        minutes: 20,
        section: "ELF",
      },
    ],
  },
];

export const DAILY_TEMPLATE = [
  { slot: "Morgon (25–40 min)", item: "ORD-repetition + 15–25 nya ord" },
  { slot: "Lunch/kväll (25 min)", item: "Sakprosatext på svenska + enradssammanfattning" },
  { slot: "Huvudpass (45–90 min)", item: "LÄS eller MEK under tid, 3–5 dagar/vecka" },
  { slot: "Underhåll (2–3×/vecka)", item: "Kvant eller ELF — korta, fokuserade pass" },
  { slot: "Söndag (60–90 min)", item: "Felanalys, uppdatera ordlista, planera nästa vecka" },
];

export type ReadingItem = {
  title: string;
  kind: string;
  why: string;
  how: string;
  cadence: string;
  href: string | null;
};

/** Sakprosa och essäer som speglar LÄS/ORD bättre än nyhetssnack eller lätt skönlitteratur. */
export const READING_LIST: ReadingItem[] = [
  {
    title: "SvD Under strecket",
    kind: "Essä / kulturhistoria",
    why: "Långa, argumenterande texter med densitet och ordnivå nära HP:s LÄS.",
    how: "Läs en essä (~20–30 min). Skriv huvudpoängen i en mening och plocka 5 svåra ord.",
    cadence: "3–4×/vecka",
    href: "https://www.svd.se/under-strecket",
  },
  {
    title: "DN Ledare & Kultur",
    kind: "Opinion + essä",
    why: "Tränar att följa tes → stöd → invändning — exakt den struktur LÄS belönar.",
    how: "Läs en ledare eller kulturessä. Markera tesen och två stödjande påståenden.",
    cadence: "Dagligen (15–20 min)",
    href: "https://www.dn.se/",
  },
  {
    title: "Forskning & Framsteg",
    kind: "Populärvetenskap",
    why: "Saklig prosa, fackord i kontext och förklarande stycken — vanligt LÄS-tonläge.",
    how: "Ett artikelkapitel. Sammanfatta utan att titta. Notera ord du skulle missa i ORD.",
    cadence: "2–3×/vecka",
    href: "https://fof.se/",
  },
  {
    title: "Språktidningen",
    kind: "Språk & stil",
    why: "Bygger språklig medvetenhet som hjälper både MEK (register) och ORD.",
    how: "En kort artikel. Lägg nya termer/konnektorer i din ordlista.",
    cadence: "1–2×/vecka",
    href: "https://spraktidningen.se/",
  },
  {
    title: "Filosofiska rummet (SR) → läs manus/referat när du kan",
    kind: "Resonemang (komplement)",
    why: "Tränar att hålla långa resonemangskedjor — samma uthållighet som svåra LÄS-texter.",
    how: "Lyssna eller läs sammanfattning. Skriv tre påståenden i ordning: premiss → mellansteg → slutsats.",
    cadence: "1×/vecka",
    href: "https://sverigesradio.se/filosofiskarummet",
  },
  {
    title: "Shorter classics i sakprosa (valfri bok)",
    kind: "Bok — ett kapitel/dag",
    why: "Kontinuerlig exponering för formellt skriftspråk. Välj essä/sakprosa, inte bara romaner.",
    how: "10–15 sidor. Ingen plot-jakt — fokusera på meningar, bindningar och ordval.",
    cadence: "Dagligen om du orkar",
    href: null,
  },
];

export const READING_BOOK_PICKS = [
  {
    title: "Ola Wikander — Orden och evigheten (eller liknande språkessä)",
    note: "Etymologi och ordhistoria — direkt boost till ORD.",
  },
  {
    title: "Essäsamlingar (t.ex. DN/SvD-antologier, eller svenska essäister)",
    note: "Hellre korta essäer än tjock roman om målet är HP-svenska.",
  },
  {
    title: "Populärvetenskap på svenska (t.ex. böcker från Fri Tanke / liknande)",
    note: "Tränar precist språk kring abstrakta ämnen — typiskt LÄS-stoff.",
  },
];

export const READING_METHOD = [
  "Skumma inte som nyheter: läs för struktur (tes, stöd, exempel, invändning).",
  "Efter varje text: en mening sammanfattning utan att titta tillbaka.",
  "Plocka 5 ord/uttryck → in i ORD-decket samma dag.",
  "Markera konnektorer (emellertid, således, däremot…) — det stärker MEK.",
  "Undvik att bara läsa sport/nöje/krönikor med talspråk — för låg densitet för HP.",
];

export const RESOURCES = [
  {
    title: "Gamla högskoleprov",
    body: "Primärmaterialet. Träna på riktiga uppgifter under tid och analysera fel.",
    href: "https://www.studera.nu/hogskoleprov/forberedelser/gamla-hogskoleprov/",
  },
  {
    title: "ORD-ordlistor & flashcards",
    body: "Bygg ditt eget deck från provorden. Anki eller papperskort — viktigast är aktiv recall.",
    href: null,
  },
  {
    title: "Daglig sakprosa",
    body: "Under strecket, DN Ledare, Forskning & Framsteg — se läslistan i appen.",
    href: "#laslista",
  },
  {
    title: "Konnektorträning",
    body: "Gör en egen lista: emellertid, således, destomer, i synnerhet, respektive, oaktat…",
    href: null,
  },
];

export function sectionLabel(id: SectionId): string {
  return SECTIONS.find((s) => s.id === id)?.short ?? id;
}

export function priorityLabel(p: Priority): string {
  if (p === "huvudfokus") return "Huvudfokus";
  if (p === "underhall") return "Underhåll";
  return "Lätt";
}

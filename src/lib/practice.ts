import { KVA_BANK, NOG_BANK, XYZ_BANK } from "@/lib/practice-kvant";
import { MEK_BANK } from "@/lib/practice-mek";
import { loadMasteredQuestionIds } from "@/lib/question-mastery";

export { MEK_BANK };

export type PracticeKind =
  | "ord"
  | "mek"
  | "las"
  | "elf"
  | "dtk"
  | "xyz"
  | "kva"
  | "nog"
  | "reflect";

export const MOCK_KINDS: Exclude<PracticeKind, "reflect">[] = [
  "ord",
  "mek",
  "las",
  "elf",
  "xyz",
  "kva",
  "nog",
  "dtk",
];

export type ChoiceQuestion = {
  id: string;
  kind: Exclude<PracticeKind, "reflect">;
  prompt: string;
  passage?: string;
  options: string[];
  correctIndex: number;
  explain: string;
};

export type ReflectPrompt = {
  id: string;
  title: string;
  prompts: string[];
};

/** Egna övningsfrågor i HP-stil — inte hämtade från riktiga prov. */
export const ORD_BANK: ChoiceQuestion[] = [
  {
    id: "ord-1",
    kind: "ord",
    prompt: "Vad betyder ordet ”adekvat”?",
    options: ["överdriven", "lämplig / tillräcklig", "otydlig", "tillfällig"],
    correctIndex: 1,
    explain: "Adekvat = lämplig eller tillräcklig i sammanhanget.",
  },
  {
    id: "ord-2",
    kind: "ord",
    prompt: "Vad betyder ”implikation”?",
    options: ["direkt motsägelse", "följd / underförstådd betydelse", "offentlig debatt", "formell ursäkt"],
    correctIndex: 1,
    explain: "En implikation är något som följer eller underförstås.",
  },
  {
    id: "ord-3",
    kind: "ord",
    prompt: "Vad betyder ”premissen”?",
    options: ["slutsatserna", "utgångspunkten / antagandet", "undantaget", "bevisbördan"],
    correctIndex: 1,
    explain: "Premiss = antagande som ett resonemang bygger på.",
  },
  {
    id: "ord-4",
    kind: "ord",
    prompt: "Vad betyder ”ambivalent”?",
    options: ["helt säker", "kluven / dubbeltydigt sinnad", "ointresserad", "öppen och glad"],
    correctIndex: 1,
    explain: "Ambivalent = att ha blandade eller motstridiga känslor.",
  },
  {
    id: "ord-5",
    kind: "ord",
    prompt: "Vad betyder ”koncist”?",
    options: ["långrandigt", "kortfattat och precist", "poetiskt", "vardagligt"],
    correctIndex: 1,
    explain: "Koncis stil är knappt och klart formulerad.",
  },
  {
    id: "ord-6",
    kind: "ord",
    prompt: "Vad betyder ”relativisera”?",
    options: ["absolutgöra", "sätta i perspektiv / tona ner absoluthet", "förstora", "bevisa"],
    correctIndex: 1,
    explain: "Att relativisera är att se något i förhållande till annat.",
  },
  {
    id: "ord-7",
    kind: "ord",
    prompt: "Vad betyder ”diskrepans”?",
    options: ["överensstämmelse", "skillnad / bristande överensstämmelse", "sammanfattning", "upprepning"],
    correctIndex: 1,
    explain: "Diskrepans = skillnad mellan två uppgifter eller bilder.",
  },
  {
    id: "ord-8",
    kind: "ord",
    prompt: "Vad betyder ”eminent”?",
    options: ["medelmåttig", "framstående", "okänd", "tillfällig"],
    correctIndex: 1,
    explain: "Eminent = synnerligen skicklig eller framstående.",
  },
  {
    id: "ord-9",
    kind: "ord",
    prompt: "Vad betyder ”provisorisk”?",
    options: ["slutgiltig", "tillfällig", "laglig", "dyr"],
    correctIndex: 1,
    explain: "Provisorisk = tillfällig lösning i väntan på något bättre.",
  },
  {
    id: "ord-10",
    kind: "ord",
    prompt: "Vad betyder ”subversiv”?",
    options: ["stödjande", "omstörtande / underminerande", "neutral", "högtidlig"],
    correctIndex: 1,
    explain: "Subversiv verksamhet syftar till att underminera rådande ordning.",
  },
  {
    id: "ord-11",
    kind: "ord",
    prompt: "Vad betyder ”tautologi”?",
    options: ["cirkelresonemang / upprepning av samma sak", "motsägelse", "exempel", "bevis"],
    correctIndex: 0,
    explain: "Tautologi upprepar samma innebörd med andra ord.",
  },
  {
    id: "ord-12",
    kind: "ord",
    prompt: "Vad betyder ”kontroversiell”?",
    options: ["allmänt accepterad", "omstridd", "hemlig", "teknisk"],
    correctIndex: 1,
    explain: "Kontroversiell = något som väcker starka motstridiga åsikter.",
  },
  {
    id: "ord-13",
    kind: "ord",
    prompt: "Vad betyder ”indignation”?",
    options: ["nöjdhet", "rättmätig vrede / upprördhet", "nyfikenhet", "trötthet"],
    correctIndex: 1,
    explain: "Indignation är upprördhet över något som uppfattas som orätt.",
  },
  {
    id: "ord-14",
    kind: "ord",
    prompt: "Vad betyder ”implicit”?",
    options: ["uttryckligen sagt", "underförstått", "felaktigt", "högljutt"],
    correctIndex: 1,
    explain: "Implicit = underförstått, inte uttalat rakt ut.",
  },
  {
    id: "ord-15",
    kind: "ord",
    prompt: "Vad betyder ”konsensus”?",
    options: ["konflikt", "samförstånd", "omröstning", "kompromisslöshet"],
    correctIndex: 1,
    explain: "Konsensus = allmän enighet.",
  },
  {
    id: "ord-16",
    kind: "ord",
    prompt: "Vad betyder ”epitet”?",
    options: ["tillnamn / beskrivande beteckning", "fotnot", "citat", "rubrik"],
    correctIndex: 0,
    explain: "Ett epitet är ett beskrivande tillnamn eller attribut.",
  },
  {
    id: "ord-17",
    kind: "ord",
    prompt: "Vad betyder ”fatal”?",
    options: ["ofarlig", "ödesdiger / katastrofal", "rolig", "långsam"],
    correctIndex: 1,
    explain: "Fatal = som leder till katastrof eller dödlig utgång.",
  },
  {
    id: "ord-18",
    kind: "ord",
    prompt: "Vad betyder ”abstrahera”?",
    options: ["göra konkret", "lyfta ut det väsentliga / bortse från detaljer", "räkna", "översätta"],
    correctIndex: 1,
    explain: "Att abstrahera är att generalisera bort från enskilda detaljer.",
  },
  {
    id: "ord-19",
    kind: "ord",
    prompt: "Vad betyder ”legitim”?",
    options: ["olaglig", "berättigad / giltig", "hemlig", "tillfällig"],
    correctIndex: 1,
    explain: "Legitim = giltig eller berättigad.",
  },
  {
    id: "ord-20",
    kind: "ord",
    prompt: "Vad betyder ”paradox”?",
    options: ["självmotsägande påstående som kan rymma en sanning", "enkel sanning", "statistik", "citat"],
    correctIndex: 0,
    explain: "En paradox verkar motsägelsefull men kan ändå fånga något sant.",
  },
  {
    id: "ord-21",
    kind: "ord",
    prompt: "Vad betyder ”resursstark”?",
    options: ["fattig på medel", "som har goda tillgångar / kapacitet", "ointresserad", "svag"],
    correctIndex: 1,
    explain: "Resursstark = rik på resurser, ofta ekonomiskt eller organisatoriskt.",
  },
  {
    id: "ord-22",
    kind: "ord",
    prompt: "Vad betyder ”dogmatisk”?",
    options: ["öppen för kritik", "låst vid fasta läror utan nyans", "humoristisk", "praktisk"],
    correctIndex: 1,
    explain: "Dogmatisk hållning vägrar ifrågasätta sina grundsatser.",
  },
  {
    id: "ord-23",
    kind: "ord",
    prompt: "Vad betyder ”implicera”?",
    options: ["utesluta", "innebära / antyda", "bevisa med experiment", "citera"],
    correctIndex: 1,
    explain: "Att implicera är att antyda eller medföra något.",
  },
  {
    id: "ord-24",
    kind: "ord",
    prompt: "Vad betyder ”koherent”?",
    options: ["osammanhängande", "sammanhängande / logiskt enhetlig", "lång", "poetisk"],
    correctIndex: 1,
    explain: "Ett koherent resonemang hänger ihop utan motsägelser.",
  },
];

export const LAS_BANK: ChoiceQuestion[] = [
  {
    id: "las-1",
    kind: "las",
    prompt: "Vad är textens huvudpoäng?",
    passage:
      "När medier talar om ”informationsöverflöd” är problemet sällan mängden fakta i sig. Snarare handlar det om att urval och inramning styr vad som uppfattas som viktigt. Den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Informationskompetens är därför mindre en fråga om snabb googling och mer om tålamod: att stanna kvar i en text tillräckligt länge för att se vad som faktiskt påstås.",
    options: [
      "Fler fakta gör alltid människor bättre informerade",
      "Problemet är främst urval och inramning, inte rå mängd information",
      "Googling är den viktigaste färdigheten",
      "Medier bör sluta publicera långa texter",
    ],
    correctIndex: 1,
    explain: "Texten betonar urval/inramning och tålamod framför mer data.",
  },
  {
    id: "las-2",
    kind: "las",
    prompt: "Vilket påstående stöds av texten?",
    passage:
      "När medier talar om ”informationsöverflöd” är problemet sällan mängden fakta i sig. Snarare handlar det om att urval och inramning styr vad som uppfattas som viktigt. Den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Informationskompetens är därför mindre en fråga om snabb googling och mer om tålamod: att stanna kvar i en text tillräckligt länge för att se vad som faktiskt påstås.",
    options: [
      "Att samla mer data utan källkritik kan försämra förståelsen",
      "Alla nyhetsmedier ljuger medvetet",
      "Tålamod är oviktigt vid läsning",
      "Fakta och inramning är samma sak",
    ],
    correctIndex: 0,
    explain: "Menningen om att samla mer data utan att pröva källor stödjer A.",
  },
  {
    id: "las-3",
    kind: "las",
    prompt: "Vad menar författaren med att forskningens värde inte bara sitter i resultatet?",
    passage:
      "I debatten om forskningsfinansiering framställs ofta ”nyttiga” resultat som det enda måttet på framgång. Men forskningens värde sitter lika mycket i metoddisciplin: att formulera frågor precist, att redovisa osäkerhet och att låta negativa fynd synas. När bara spektakulära resultat belönas uppstår ett snedvridet urval av vad som publiceras. Det skadar både vetenskapen och allmänhetens tillit, eftersom bilden av kunskap blir mer säker än den egentligen är.",
    options: [
      "Att negativa fynd bör döljas",
      "Att metod, osäkerhet och negativa fynd också är centrala",
      "Att spektakulära resultat alltid är bäst",
      "Att finansiering bör upphöra",
    ],
    correctIndex: 1,
    explain: "Texten lyfter metoddisciplin, osäkerhet och negativa fynd.",
  },
  {
    id: "las-4",
    kind: "las",
    prompt: "Vilken följd varnar texten för?",
    passage:
      "I debatten om forskningsfinansiering framställs ofta ”nyttiga” resultat som det enda måttet på framgång. Men forskningens värde sitter lika mycket i metoddisciplin: att formulera frågor precist, att redovisa osäkerhet och att låta negativa fynd synas. När bara spektakulära resultat belönas uppstår ett snedvridet urval av vad som publiceras. Det skadar både vetenskapen och allmänhetens tillit, eftersom bilden av kunskap blir mer säker än den egentligen är.",
    options: [
      "Ökad publicering av negativa fynd",
      "Snedvridet urval och överdriven bild av säkerhet",
      "Lägre krav på metod",
      "Att forskare slutar formulera frågor",
    ],
    correctIndex: 1,
    explain: "Belöning av spektakulära resultat → snedvridet urval och falsk säkerhet.",
  },
  {
    id: "las-5",
    kind: "las",
    prompt: "Vilken beskrivning av städernas grönska stämmer bäst?",
    passage:
      "Städers grönska beskrivs ibland som ren dekoration. Forskning visar dock att träd och parker påverkar temperatur, luftkvalitet och människors stressnivåer. Effekten är störst i täta områden där hårdgjorda ytor annars samlar värme. Samtidigt är grönska ojämnt fördelad: socioekonomiskt starka stadsdelar har ofta mer vegetation. Att plantera träd är därför inte bara estetik, utan en fråga om rättvisa och folkhälsa — förutsatt att skötsel och lokal förankring finns.",
    options: [
      "Grönska är bara dekoration",
      "Grönska har mätbara effekter och är ojämnt fördelad",
      "Träd hjälper bara på landsbygden",
      "Socioekonomi saknar betydelse för vegetation",
    ],
    correctIndex: 1,
    explain: "Texten binder ihop effekter (temperatur/hälsa) och ojämn fördelning.",
  },
  {
    id: "las-6",
    kind: "las",
    prompt: "Vad krävs enligt texten för att trädsatsningar ska fungera?",
    passage:
      "Städers grönska beskrivs ibland som ren dekoration. Forskning visar dock att träd och parker påverkar temperatur, luftkvalitet och människors stressnivåer. Effekten är störst i täta områden där hårdgjorda ytor annars samlar värme. Samtidigt är grönska ojämnt fördelad: socioekonomiskt starka stadsdelar har ofta mer vegetation. Att plantera träd är därför inte bara estetik, utan en fråga om rättvisa och folkhälsa — förutsatt att skötsel och lokal förankring finns.",
    options: [
      "Bara fler planteringsceremonier",
      "Skötsel och lokal förankring",
      "Att undvika täta områden",
      "Att ta bort parker i rika områden",
    ],
    correctIndex: 1,
    explain: "Slutet säger uttryckligen skötsel och lokal förankring.",
  },
];

export const ELF_BANK: ChoiceQuestion[] = [
  {
    id: "elf-1",
    kind: "elf",
    prompt: "What is the main claim of the passage?",
    passage:
      "Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.",
    options: [
      "Remote work always increases productivity",
      "The hidden cost is lost informal learning, so mentorship must be redesigned",
      "Hallways are more important than software",
      "Junior staff prefer offices for social reasons only",
    ],
    correctIndex: 1,
    explain: "The passage focuses on informal learning loss and deliberate mentorship.",
  },
  {
    id: "elf-2",
    kind: "elf",
    prompt: "According to the passage, what do weaker remote strategies miss?",
    passage:
      "Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.",
    options: [
      "The cultural cost of fewer informal learning moments",
      "The price of office furniture",
      "How to schedule more meetings",
      "That flexibility never matters",
    ],
    correctIndex: 0,
    explain: "Treating remote work as logistics alone misses the quieter cultural cost.",
  },
  {
    id: "elf-3",
    kind: "elf",
    prompt: "What does the author suggest successful organizations do?",
    passage:
      "Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.",
    options: [
      "Ban remote work",
      "Redesign mentorship on purpose",
      "Add more hallways online",
      "Ignore junior staff",
    ],
    correctIndex: 1,
    explain: "Last sentence: redesign mentorship deliberately.",
  },
  {
    id: "elf-4",
    kind: "elf",
    prompt: "Which statement best matches the passage?",
    passage:
      "Climate reporting has improved at describing extreme weather, but it still struggles with time. Readers are shown a flood or a fire as a dramatic event, then the story ends. The slower processes — soil degradation, insurance retreat, rising baseline heat — get less airtime because they lack a single climax. This narrative bias does not mean journalists are dishonest; it means the formats that attract attention favour suddenness. Understanding climate risk therefore requires reading past the event to the trend underneath.",
    options: [
      "Journalists invent climate disasters",
      "Sudden events get more attention than slow trends, so readers must look for the trend",
      "Floods are unimportant",
      "Insurance is unrelated to climate",
    ],
    correctIndex: 1,
    explain: "The core idea is narrative bias toward suddenness vs slow processes.",
  },
];

export const DTK_BANK: ChoiceQuestion[] = [
  {
    id: "dtk-1",
    kind: "dtk",
    prompt: "Vilken kommun hade högst andel cykelresor 2024?",
    passage:
      "Andel cykelresor av alla resor (procent)\nKommun A: 2022: 12  2023: 14  2024: 15\nKommun B: 2022: 18  2023: 17  2024: 19\nKommun C: 2022: 9   2023: 11  2024: 13\nKommun D: 2022: 16  2023: 16  2024: 18",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    explain: "2024: A15, B19, C13, D18 → B högst.",
  },
  {
    id: "dtk-2",
    kind: "dtk",
    prompt: "Hur många procentenheter ökade Kommun A mellan 2022 och 2024?",
    passage:
      "Andel cykelresor av alla resor (procent)\nKommun A: 2022: 12  2023: 14  2024: 15\nKommun B: 2022: 18  2023: 17  2024: 19\nKommun C: 2022: 9   2023: 11  2024: 13\nKommun D: 2022: 16  2023: 16  2024: 18",
    options: ["2", "3", "4", "15"],
    correctIndex: 1,
    explain: "15 − 12 = 3 procentenheter.",
  },
  {
    id: "dtk-3",
    kind: "dtk",
    prompt: "Vilken kommun minskade något mellan 2022 och 2023?",
    passage:
      "Andel cykelresor av alla resor (procent)\nKommun A: 2022: 12  2023: 14  2024: 15\nKommun B: 2022: 18  2023: 17  2024: 19\nKommun C: 2022: 9   2023: 11  2024: 13\nKommun D: 2022: 16  2023: 16  2024: 18",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    explain: "B: 18 → 17. Övriga ökade eller var oförändrade.",
  },
  {
    id: "dtk-4",
    kind: "dtk",
    prompt: "Ungefär hur stor andel av total försäljning stod Produkt Y för?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["15 %", "25 %", "35 %", "40 %"],
    correctIndex: 1,
    explain: "25/100 = 25 %.",
  },
  {
    id: "dtk-5",
    kind: "dtk",
    prompt: "Vilken produkt hade störst försäljning?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["X", "Y", "Z", "Y och Z lika"],
    correctIndex: 0,
    explain: "X = 40 är störst.",
  },
  {
    id: "dtk-6",
    kind: "dtk",
    prompt: "Med hur många miljoner skiljer sig X och Z?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["5", "10", "15", "25"],
    correctIndex: 0,
    explain: "40 − 35 = 5.",
  },
  {
    id: "dtk-7",
    kind: "dtk",
    prompt: "Vilken avdelning hade lägst sjukfrånvaro i mars?",
    passage:
      "Sjukfrånvaro per avdelning (procent av arbetad tid)\nAvd. A: feb 6,2 · mars 5,4 · april 5,8\nAvd. B: feb 4,9 · mars 5,1 · april 4,7\nAvd. C: feb 7,3 · mars 6,8 · april 7,0\nAvd. D: feb 5,6 · mars 4,9 · april 5,3",
    options: ["A", "B", "C", "D"],
    correctIndex: 3,
    explain: "Mars: A 5,4 · B 5,1 · C 6,8 · D 4,9 → D lägst.",
  },
  {
    id: "dtk-8",
    kind: "dtk",
    prompt: "Hur stor andel av företagets totala kostnader utgjorde material 2023?",
    passage:
      "Kostnader 2023 (miljoner kr): Personal 12 · Material 8 · Lokaler 4 · Övrigt 6. Totalt = 30.",
    options: ["8 %", "ungefär 27 %", "ungefär 40 %", "ungefär 73 %"],
    correctIndex: 1,
    explain: "8 / 30 ≈ 0,267 → cirka 27 %.",
  },
];

export const REFLECT_BANK: ReflectPrompt[] = [
  {
    id: "reflect-analys",
    title: "Felanalys",
    prompts: [
      "Vilket delprov gick sämst i det här passet?",
      "Var felen mest kunskap, slarv eller tidspress?",
      "Skriv tre konkreta åtgärder för nästa vecka.",
    ],
  },
  {
    id: "reflect-rest",
    title: "Provdags-check",
    prompts: [
      "Har du koll på tid, plats, ID och material?",
      "Hur ser sömnen ut de närmaste nätterna?",
      "Vilken lätt repetition gör du sista kvällen (max 20 min)?",
    ],
  },
  {
    id: "reflect-full",
    title: "Efter fullprov",
    prompts: [
      "Råpoäng ungefär per delprov?",
      "Var föll koncentrationen (tidpunkt/delprov)?",
      "Vad lappar du de kommande två dagarna — MEK eller ORD?",
    ],
  },
];

const BANKS: Record<Exclude<PracticeKind, "reflect">, ChoiceQuestion[]> = {
  ord: ORD_BANK,
  mek: MEK_BANK,
  las: LAS_BANK,
  elf: ELF_BANK,
  dtk: DTK_BANK,
  xyz: XYZ_BANK,
  kva: KVA_BANK,
  nog: NOG_BANK,
};

export function findQuestionById(id: string): ChoiceQuestion | undefined {
  for (const bank of Object.values(BANKS)) {
    const found = bank.find((q) => q.id === id);
    if (found) return found;
  }
  return undefined;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  const rand = mulberry32(hashSeed(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function lastShownQuestionsKey(kind: Exclude<PracticeKind, "reflect">) {
  return `hp-last-shown-questions:${kind}`;
}

export function loadLastShownQuestionIds(
  kind: Exclude<PracticeKind, "reflect">,
): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(lastShownQuestionsKey(kind));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function saveLastShownQuestionIds(
  kind: Exclude<PracticeKind, "reflect">,
  ids: string[],
) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(lastShownQuestionsKey(kind), JSON.stringify(ids));
}

/** Spara visade fråge-id:n per delprov — ackumuleras, skrivs inte över. */
export function rememberShownQuestions(questions: ChoiceQuestion[]) {
  const byKind = new Map<Exclude<PracticeKind, "reflect">, string[]>();
  for (const q of questions) {
    const list = byKind.get(q.kind) ?? [];
    list.push(q.id);
    byKind.set(q.kind, list);
  }
  for (const [kind, ids] of byKind) {
    const prev = loadLastShownQuestionIds(kind);
    const seen = new Set(prev);
    const merged = [...prev];
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
    saveLastShownQuestionIds(kind, merged);
  }
}

export function buildQuiz(
  kind: Exclude<PracticeKind, "reflect">,
  seed: string,
  count: number,
  avoidIds: ReadonlySet<string> | readonly string[] = [],
): ChoiceQuestion[] {
  const bank = BANKS[kind];
  const avoid = avoidIds instanceof Set ? avoidIds : new Set(avoidIds);
  const mastered = loadMasteredQuestionIds();

  const unmasteredFresh: ChoiceQuestion[] = [];
  const unmasteredRecent: ChoiceQuestion[] = [];
  const masteredFresh: ChoiceQuestion[] = [];
  const masteredRecent: ChoiceQuestion[] = [];

  for (const q of bank) {
    const isMastered = mastered.has(q.id);
    const isRecent = avoid.has(q.id);
    if (!isMastered && !isRecent) unmasteredFresh.push(q);
    else if (!isMastered) unmasteredRecent.push(q);
    else if (!isRecent) masteredFresh.push(q);
    else masteredRecent.push(q);
  }

  const ordered = [
    ...shuffle(unmasteredFresh, seed),
    ...shuffle(unmasteredRecent, `${seed}:recent`),
    ...shuffle(masteredFresh, `${seed}:mastered`),
    ...shuffle(masteredRecent, `${seed}:mastered-recent`),
  ];
  return ordered.slice(0, Math.min(count, ordered.length));
}

export function buildMixedQuiz(
  kinds: PracticeKind[],
  seed: string,
  count: number,
): ChoiceQuestion[] {
  const quizKinds = kinds.filter((k): k is Exclude<PracticeKind, "reflect"> => k !== "reflect");
  if (quizKinds.length === 0) return [];

  const perKind = Math.max(1, Math.ceil(count / quizKinds.length));
  const pooled: ChoiceQuestion[] = [];
  for (const kind of quizKinds) {
    pooled.push(
      ...buildQuiz(kind, `${seed}:${kind}`, perKind + 2, loadLastShownQuestionIds(kind)),
    );
  }
  return shuffle(pooled, `${seed}:mix`).slice(0, Math.min(count, pooled.length));
}

export function getReflectPrompt(seed: string): ReflectPrompt {
  const idx = hashSeed(seed) % REFLECT_BANK.length;
  return REFLECT_BANK[idx];
}

export function practiceLabel(kind: PracticeKind): string {
  switch (kind) {
    case "ord":
      return "ORD-övning";
    case "mek":
      return "MEK-övning";
    case "las":
      return "LÄS-övning";
    case "elf":
      return "ELF-övning";
    case "dtk":
      return "DTK-övning";
    case "xyz":
      return "XYZ-övning";
    case "kva":
      return "KVA-övning";
    case "nog":
      return "NOG-övning";
    case "reflect":
      return "Reflektion";
  }
}

export function kindBadge(kind: PracticeKind): string {
  if (kind === "las") return "LÄS";
  if (kind === "reflect") return "Reflektion";
  return kind.toUpperCase();
}

export function defaultQuestionCount(kind: PracticeKind): number {
  switch (kind) {
    case "ord":
      return 10;
    case "mek":
      return 8;
    case "las":
      return 4;
    case "elf":
      return 3;
    case "dtk":
      return 4;
    case "xyz":
      return 6;
    case "kva":
      return 8;
    case "nog":
      return 6;
    case "reflect":
      return 0;
  }
}

export function buildMockExam(seed: string, count = 24): ChoiceQuestion[] {
  return buildMixedQuiz(MOCK_KINDS, seed, count);
}

/** Räknar rätt mot en låst svarskopia — obesvarade räknas som fel. */
export function tally(
  questions: readonly ChoiceQuestion[],
  answers: Record<string, number>,
): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  return { correct, total: questions.length };
}

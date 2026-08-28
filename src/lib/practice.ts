import { KVA_BANK, NOG_BANK, XYZ_BANK } from "@/lib/practice-kvant";

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

export const MEK_BANK: ChoiceQuestion[] = [
  {
    id: "mek-1",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Studien fick kritik för små urval; ____ visade uppföljningen samma mönster i en större population.",
    options: ["därför", "emellertid", "exempelvis", "nämligen"],
    correctIndex: 1,
    explain: "”Emellertid” markerar kontrast: trots kritiken bekräftades resultatet.",
  },
  {
    id: "mek-2",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Författaren undviker förenklingar och resonerar ____, med tydliga premisser och slutsatser.",
    options: ["slarvigt", "koherent", "vardagligt", "impulsivt"],
    correctIndex: 1,
    explain: "Koherent passar formell sakprosa och betyder sammanhängande.",
  },
  {
    id: "mek-3",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Priset på råvaran steg kraftigt. ____ tvingades flera företag se över sina marginaler.",
    options: ["Trots det", "Följaktligen", "Däremot", "Ändå"],
    correctIndex: 1,
    explain: "”Följaktligen” uttrycker orsak → verkan.",
  },
  {
    id: "mek-4",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Rapporten är ____ kort: den sammanfattar tre års forskning på tio sidor utan att tappa precisionsnivån.",
    options: ["onödigt", "koncist", "vagt", "mundligt"],
    correctIndex: 1,
    explain: "Koncist = kortfattat och precist.",
  },
  {
    id: "mek-5",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Vissa kritiker såg reformen som för snabb, ____ andra menade att den kom för sent.",
    options: ["respektive", "medan", "således", "dessutom"],
    correctIndex: 1,
    explain: "”Medan” ställer två synsätt mot varandra i samma mening.",
  },
  {
    id: "mek-6",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Hypotesen är intressant, ____ underlaget är ännu för tunt för långtgående slutsatser.",
    options: ["och", "men", "så", "ty"],
    correctIndex: 1,
    explain: "”Men” signalerar reservation mot det föregående.",
  },
  {
    id: "mek-7",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Beslutet fattades ____ efter flera utredningar, inte i hast.",
    options: ["impulsivt", "överlagt", "slumpmässigt", "hemligt"],
    correctIndex: 1,
    explain: "Överlagt = efter noggrant övervägande.",
  },
  {
    id: "mek-8",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Tekniken är lovande. ____ kvarstår frågor om kostnader och rättvisa tillgång.",
    options: ["Således", "Likväl", "Exempelvis", "Nämligen"],
    correctIndex: 1,
    explain: "”Likväl” = trots det; kontrast efter positiv inledning.",
  },
  {
    id: "mek-9",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Hon argumenterade ____: varje påstående backades upp med belägg.",
    options: ["dogmatiskt", "sakligt", "svävande", "ironiskt"],
    correctIndex: 1,
    explain: "Sakligt passar ett resonemang med belägg.",
  },
  {
    id: "mek-10",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Förslaget vann gehör ____ bland dem som tidigare varit skeptiska.",
    options: ["i synnerhet", "oaktat", "följaktligen", "däremot"],
    correctIndex: 0,
    explain: "”I synnerhet” förstärker att det gäller särskilt den gruppen.",
  },
  {
    id: "mek-11",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "____ rådande osäkerhet gick bolaget vidare med investeringen.",
    options: ["Tack vare", "Oaktat", "På grund av", "Till följd av"],
    correctIndex: 1,
    explain: "”Oaktat” = trots; formellt och MEK-typiskt.",
  },
  {
    id: "mek-12",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Texten rör sig mellan empiri och teori, ____ utan att blanda ihop nivåerna.",
    options: ["dock", "alltså", "ty", "så"],
    correctIndex: 0,
    explain: "”Dock” tillför en nyanserad reservation.",
  },
  {
    id: "mek-13",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Resultaten pekar i samma riktning; ____ kan man tala om ett robust fynd.",
    options: ["ändå", "således", "däremot", "trots det"],
    correctIndex: 1,
    explain: "”Således” drar en logisk slutsats.",
  },
  {
    id: "mek-14",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Kritikerna angrep metoden, ____ inte själva frågeställningen.",
    options: ["respektive", "men", "såväl", "både"],
    correctIndex: 1,
    explain: "”Men” kontrasterar vad som angrips och vad som lämnas.",
  },
  {
    id: "mek-15",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Författaren skriver i ett ____ register som passar vetenskaplig essäistik.",
    options: ["talspråkligt", "formellt", "barnsligt", "slangbetonat"],
    correctIndex: 1,
    explain: "Formellt register hör till sakprosa/essä.",
  },
  {
    id: "mek-16",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Ju mer data som tillkom, ____ tydligare blev mönstret.",
    options: ["desto", "så", "och", "men"],
    correctIndex: 0,
    explain: "Korrelationen ju … desto … är standard.",
  },
  {
    id: "mek-17",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Han var ____ till förslaget: varken entusiastisk eller avvisande.",
    options: ["ambivalent", "entydig", "aggressiv", "indifferent på ett skämtsamt sätt"],
    correctIndex: 0,
    explain: "Ambivalent = kluven.",
  },
  {
    id: "mek-18",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Analysen är skarp, ____ den ibland blir väl kategorisk.",
    options: ["även om", "därför att", "så att", "utan att"],
    correctIndex: 0,
    explain: "”Även om” inför en medgivande bisats.",
  },
  {
    id: "mek-19",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Projektet stoppades ____ bristande finansiering.",
    options: ["trots", "på grund av", "oaktat", "i stället för"],
    correctIndex: 1,
    explain: "”På grund av” anger orsak.",
  },
  {
    id: "mek-20",
    kind: "mek",
    prompt: "Välj det alternativ som bäst fyller i meningen.",
    passage:
      "Skillnaden mellan grupperna är liten, ____ statistiskt signifikant.",
    options: ["dock", "alltså", "nämligen", "respektive"],
    correctIndex: 0,
    explain: "”Dock” = kontrast: liten men ändå signifikant.",
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

/** Spara visade fråge-id:n per delprov — nästa set prioriterar resten av banken. */
export function rememberShownQuestions(questions: ChoiceQuestion[]) {
  const byKind = new Map<Exclude<PracticeKind, "reflect">, string[]>();
  for (const q of questions) {
    const list = byKind.get(q.kind) ?? [];
    list.push(q.id);
    byKind.set(q.kind, list);
  }
  for (const [kind, ids] of byKind) {
    saveLastShownQuestionIds(kind, ids);
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
  const unseen = avoid.size === 0 ? bank : bank.filter((q) => !avoid.has(q.id));
  const seen = avoid.size === 0 ? [] : bank.filter((q) => avoid.has(q.id));
  const ordered =
    unseen.length === 0
      ? shuffle(seen, seed)
      : seen.length === 0
        ? shuffle(unseen, seed)
        : [...shuffle(unseen, seed), ...shuffle(seen, `${seed}:seen`)];
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

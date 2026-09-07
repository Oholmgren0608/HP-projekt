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
    explain: "Adekvat betyder lämplig eller tillräcklig för ett givet syfte. Överdriven beskriver något som gått för långt, vilket är en annan dimension än lämplighet. Otydlig handlar om klarhet, inte om att passa syftet. Tillfällig syftar på varaktighet i tid, inte på lämplighet.",
  },
  {
    id: "ord-2",
    kind: "ord",
    prompt: "Vad betyder ”implikation”?",
    options: ["direkt motsägelse", "följd / underförstådd betydelse", "offentlig debatt", "formell ursäkt"],
    correctIndex: 1,
    explain: "En implikation är en följd eller underförstådd betydelse som ett påstående för med sig. Direkt motsägelse är motsatsen, eftersom en implikation snarare hänger ihop med utsagan än strider mot den. Offentlig debatt handlar om diskussion, inte om logisk följd. Formell ursäkt saknar helt kopplingen till följd eller antydan.",
  },
  {
    id: "ord-3",
    kind: "ord",
    prompt: "Vad betyder ”premissen”?",
    options: ["slutsatserna", "utgångspunkten / antagandet", "undantaget", "bevisbördan"],
    correctIndex: 1,
    explain: "Premissen är den utgångspunkt eller det antagande som ett resonemang bygger på. Slutsatserna är istället vad man kommer fram till efter resonemanget, alltså motsatt ände av tankekedjan. Undantaget rör avvikelser från en regel, inte grunden för argumentet. Bevisbördan handlar om vem som måste styrka ett påstående, vilket är en annan juridisk/logisk term.",
  },
  {
    id: "ord-4",
    kind: "ord",
    prompt: "Vad betyder ”ambivalent”?",
    options: ["helt säker", "kluven / dubbeltydigt sinnad", "ointresserad", "öppen och glad"],
    correctIndex: 1,
    explain: "Ambivalent betyder kluven eller att ha motstridiga känslor samtidigt. Helt säker är motsatsen, då det utesluter tvekan. Ointresserad beskriver brist på engagemang snarare än dubbelhet i känslor. Öppen och glad beskriver ett positivt, enhetligt sinnestillstånd utan den inneboende splittringen.",
  },
  {
    id: "ord-5",
    kind: "ord",
    prompt: "Vad betyder ”koncist”?",
    options: ["långrandigt", "kortfattat och precist", "poetiskt", "vardagligt"],
    correctIndex: 1,
    explain: "Koncist betyder kortfattat och precist formulerat. Långrandigt är motsatsen, eftersom det syftar på utdragna och ordrika formuleringar. Poetiskt handlar om stilistiskt bildspråk, inte om korthet. Vardagligt beskriver register snarare än hur kort eller precis en text är.",
  },
  {
    id: "ord-6",
    kind: "ord",
    prompt: "Vad betyder ”relativisera”?",
    options: ["absolutgöra", "sätta i perspektiv / tona ner absoluthet", "förstora", "bevisa"],
    correctIndex: 1,
    explain: "Att relativisera är att sätta något i perspektiv eller tona ner dess absoluta karaktär genom att jämföra med annat. Absolutgöra är motsatsen, eftersom det förstärker snarare än nyanserar ett påstående. Förstora handlar om att göra något större, inte om att relativisera dess betydelse. Bevisa syftar på att styrka sanningshalt, vilket inte har med perspektivering att göra.",
  },
  {
    id: "ord-7",
    kind: "ord",
    prompt: "Vad betyder ”diskrepans”?",
    options: ["överensstämmelse", "skillnad / bristande överensstämmelse", "sammanfattning", "upprepning"],
    correctIndex: 1,
    explain: "Diskrepans betyder skillnad eller bristande överensstämmelse mellan till exempel två uppgifter. Överensstämmelse är motsatsen, då den beskriver att saker stämmer ihop. Sammanfattning handlar om att komprimera information, inte om att peka på skillnader. Upprepning innebär att säga samma sak igen, vilket är en annan process än att jämföra och hitta avvikelser.",
  },
  {
    id: "ord-8",
    kind: "ord",
    prompt: "Vad betyder ”eminent”?",
    options: ["medelmåttig", "framstående", "okänd", "tillfällig"],
    correctIndex: 1,
    explain: "Eminent betyder framstående eller synnerligen skicklig. Medelmåttig är närmast motsatsen, eftersom det beskriver genomsnittlig kvalitet. Okänd beskriver brist på uppmärksamhet, vilket strider mot att vara framstående. Tillfällig handlar om varaktighet i tid och saknar koppling till skicklighet eller status.",
  },
  {
    id: "ord-9",
    kind: "ord",
    prompt: "Vad betyder ”provisorisk”?",
    options: ["slutgiltig", "tillfällig", "laglig", "dyr"],
    correctIndex: 1,
    explain: "Provisorisk betyder tillfällig, ofta som en lösning i väntan på något bättre. Slutgiltig är motsatsen, då den betecknar det som är avgjort och bestående. Laglig rör lagenlighet, inte varaktighet. Dyr handlar om kostnad, vilket är en helt annan egenskap än hur länge något ska gälla.",
  },
  {
    id: "ord-10",
    kind: "ord",
    prompt: "Vad betyder ”subversiv”?",
    options: ["stödjande", "omstörtande / underminerande", "neutral", "högtidlig"],
    correctIndex: 1,
    explain: "Subversiv betyder omstörtande eller underminerande gentemot en rådande ordning. Stödjande är motsatsen, eftersom det innebär att man bidrar till att upprätthålla något snarare än att underminera det. Neutral beskriver avsaknad av ställningstagande, vilket inte stämmer med den aktiva undermineringen i subversiv. Högtidlig rör ett formellt tonläge och saknar den ifrågasättande innebörden.",
  },
  {
    id: "ord-11",
    kind: "ord",
    prompt: "Vad betyder ”tautologi”?",
    options: ["cirkelresonemang / upprepning av samma sak", "motsägelse", "exempel", "bevis"],
    correctIndex: 0,
    explain: "Tautologi är ett cirkelresonemang eller en upprepning av samma sak i andra ordalag. Motsägelse beskriver istället två påståenden som inte kan vara sanna samtidigt, vilket är motsatt logik. Exempel är en illustration av något, inte en upprepning av samma innebörd. Bevis syftar på belägg för ett påstående, vilket skiljer sig från att bara omformulera det.",
  },
  {
    id: "ord-12",
    kind: "ord",
    prompt: "Vad betyder ”kontroversiell”?",
    options: ["allmänt accepterad", "omstridd", "hemlig", "teknisk"],
    correctIndex: 1,
    explain: "Kontroversiell betyder omstridd, det väcker starka och motstridiga åsikter. Allmänt accepterad är motsatsen, eftersom den beskriver bred enighet snarare än konflikt. Hemlig handlar om att vara dold, inte om att vara omdebatterad. Teknisk syftar på fackmässig karaktär och har ingen koppling till grad av oenighet.",
  },
  {
    id: "ord-13",
    kind: "ord",
    prompt: "Vad betyder ”indignation”?",
    options: ["nöjdhet", "rättmätig vrede / upprördhet", "nyfikenhet", "trötthet"],
    correctIndex: 1,
    explain: "Indignation betyder rättmätig vrede eller upprördhet över något som uppfattas som orätt. Nöjdhet är motsatsen, då den beskriver ett tillfredsställt sinnestillstånd. Nyfikenhet handlar om intresse för att veta mer, inte om upprördhet. Trötthet syftar på brist på energi och saknar den känslomässiga laddningen i indignation.",
  },
  {
    id: "ord-14",
    kind: "ord",
    prompt: "Vad betyder ”implicit”?",
    options: ["uttryckligen sagt", "underförstått", "felaktigt", "högljutt"],
    correctIndex: 1,
    explain: "Implicit betyder underförstått, det är antytt snarare än uttalat. Uttryckligen sagt är motsatsen, eftersom det betecknar det som sägs rakt ut. Felaktigt handlar om sanningshalt, inte om hur något förmedlas. Högljutt rör volym eller intensitet i uttryck, vilket saknar koppling till underförstådd betydelse.",
  },
  {
    id: "ord-15",
    kind: "ord",
    prompt: "Vad betyder ”konsensus”?",
    options: ["konflikt", "samförstånd", "omröstning", "kompromisslöshet"],
    correctIndex: 1,
    explain: "Konsensus betyder samförstånd eller allmän enighet. Konflikt är motsatsen, då den beskriver oenighet snarare än samstämmighet. Omröstning är en metod för att fatta beslut men innebär inte i sig enighet. Kompromisslöshet betecknar en ovilja att mötas, vilket är raka motsatsen till samförstånd.",
  },
  {
    id: "ord-16",
    kind: "ord",
    prompt: "Vad betyder ”epitet”?",
    options: ["tillnamn / beskrivande beteckning", "fotnot", "citat", "rubrik"],
    correctIndex: 0,
    explain: "Epitet är ett tillnamn eller en beskrivande beteckning som fästs vid någon eller något. Fotnot är en förklarande not i en text, vilket är en annan textuell funktion än ett tillnamn. Citat är ett återgivet uttalande, inte en beskrivande benämning. Rubrik är en titel som inleder en text, vilket skiljer sig från ett epitet som beskriver en person eller sak.",
  },
  {
    id: "ord-17",
    kind: "ord",
    prompt: "Vad betyder ”fatal”?",
    options: ["ofarlig", "ödesdiger / katastrofal", "rolig", "långsam"],
    correctIndex: 1,
    explain: "Fatal betyder ödesdiger eller katastrofal, ofta med allvarliga eller dödliga följder. Ofarlig är motsatsen, eftersom den utesluter allvarlig skada. Rolig beskriver ett lustfyllt intryck, vilket är oförenligt med den allvarliga innebörden i fatal. Långsam handlar om hastighet, inte om graden av allvar i följderna.",
  },
  {
    id: "ord-18",
    kind: "ord",
    prompt: "Vad betyder ”abstrahera”?",
    options: ["göra konkret", "lyfta ut det väsentliga / bortse från detaljer", "räkna", "översätta"],
    correctIndex: 1,
    explain: "Att abstrahera är att lyfta ut det väsentliga och bortse från enskilda detaljer. Göra konkret är motsatsen, då det innebär att knyta något till specifika, konkreta exempel snarare än att generalisera. Räkna handlar om matematisk bearbetning, inte om att bortse från detaljer. Översätta rör överföring mellan språk, vilket är en annan process än generalisering.",
  },
  {
    id: "ord-19",
    kind: "ord",
    prompt: "Vad betyder ”legitim”?",
    options: ["olaglig", "berättigad / giltig", "hemlig", "tillfällig"],
    correctIndex: 1,
    explain: "Legitim betyder berättigad eller giltig, ofta i juridisk eller moralisk mening. Olaglig är motsatsen, eftersom den betecknar det som strider mot lagen. Hemlig handlar om att vara dold, vilket inte har med giltighet att göra. Tillfällig syftar på varaktighet i tid, en annan egenskap än att vara berättigad.",
  },
  {
    id: "ord-20",
    kind: "ord",
    prompt: "Vad betyder ”paradox”?",
    options: ["självmotsägande påstående som kan rymma en sanning", "enkel sanning", "statistik", "citat"],
    correctIndex: 0,
    explain: "En paradox är ett självmotsägande påstående som trots det kan rymma en sanning. Enkel sanning är motsatsen, då den saknar den motsägelsefulla ytan som utmärker en paradox. Statistik handlar om sifferunderlag, inte om ett logiskt spänningsfullt påstående. Citat är ett återgivet uttalande, vilket inte i sig behöver innehålla någon motsägelse.",
  },
  {
    id: "ord-21",
    kind: "ord",
    prompt: "Vad betyder ”resursstark”?",
    options: ["fattig på medel", "som har goda tillgångar / kapacitet", "ointresserad", "svag"],
    correctIndex: 1,
    explain: "Resursstark betyder att ha goda tillgångar eller kapacitet, till exempel ekonomiskt eller organisatoriskt. Fattig på medel är motsatsen, eftersom den beskriver brist snarare än överflöd av resurser. Ointresserad handlar om engagemang, inte om tillgång till resurser. Svag beskriver bristande kraft eller förmåga, vilket är motsatt innebörd till att vara resursstark.",
  },
  {
    id: "ord-22",
    kind: "ord",
    prompt: "Vad betyder ”dogmatisk”?",
    options: ["öppen för kritik", "låst vid fasta läror utan nyans", "humoristisk", "praktisk"],
    correctIndex: 1,
    explain: "Dogmatisk betyder att vara låst vid fasta läror utan att öppna för nyans eller kritik. Öppen för kritik är motsatsen, eftersom den beskriver en beredskap att ompröva sina ståndpunkter. Humoristisk rör lekfullhet i uttryck, vilket saknar kopplingen till orubblig övertygelse. Praktisk handlar om verklighetsanpassning snarare än om orubblig fasthet vid en lära.",
  },
  {
    id: "ord-23",
    kind: "ord",
    prompt: "Vad betyder ”implicera”?",
    options: ["utesluta", "innebära / antyda", "bevisa med experiment", "citera"],
    correctIndex: 1,
    explain: "Att implicera är att innebära eller antyda något utan att säga det rakt ut. Utesluta är motsatsen, då det innebär att avlägsna eller frånta möjligheten, inte att antyda. Bevisa med experiment syftar på empirisk verifiering, vilket är en mycket starkare och annorlunda process än att antyda. Citera handlar om att återge någons ord, inte om att låta något förstås indirekt.",
  },
  {
    id: "ord-24",
    kind: "ord",
    prompt: "Vad betyder ”koherent”?",
    options: ["osammanhängande", "sammanhängande / logiskt enhetlig", "lång", "poetisk"],
    correctIndex: 1,
    explain: "Koherent betyder sammanhängande och logiskt enhetlig, utan inbördes motsägelser. Osammanhängande är motsatsen, eftersom det just beskriver brist på inre logik. Lång handlar om omfång, vilket är oberoende av om resonemanget hänger ihop. Poetisk rör stilistiskt bildspråk, vilket inte har med logisk sammanhållning att göra.",
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
    explain: "Texten framhåller att problemet är hur information väljs ut och ramas in, inte hur mycket information som finns, vilket gör att huvudpoängen handlar om urval och inramning snarare än mängd. Att fler fakta alltid gör människor bättre informerade motsägs av just den poängen, eftersom texten ifrågasätter att mer data i sig hjälper. Att googling är den viktigaste färdigheten är en för smal och konkret tolkning som inte fångar resonemanget om inramning. Att medier bör sluta publicera långa texter nämns inte och är en helt annan slutsats än den om urval och tålamod.",
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
    explain: "Texten stödjer att det är problematiskt att samla mer data utan att pröva källorna, eftersom det är just denna okritiska datainsamling som texten varnar för. Att alla nyhetsmedier ljuger medvetet är en överdrift som går längre än vad texten påstår om brister i granskning. Att tålamod är oviktigt vid läsning strider mot textens betoning av tålamod som en dygd. Att fakta och inramning är samma sak motsäger textens poäng om att det är just skillnaden mellan dem som spelar roll.",
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
    explain: "Författaren menar att forskningens värde också ligger i metoddisciplin, redovisad osäkerhet och negativa fynd, inte bara i det slutliga resultatet. Att negativa fynd bör döljas är motsatsen till vad som lyfts fram, eftersom texten snarare vill synliggöra dem. Att spektakulära resultat alltid är bäst är precis den syn som texten ifrågasätter genom att peka på andra värden i forskningen. Att finansiering bör upphöra är en långtgående slutsats som inte har stöd i resonemanget om vad som gör forskning värdefull.",
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
    explain: "Texten varnar för att belöning av spektakulära resultat leder till snedvridet urval och en överdriven bild av hur säker kunskapen egentligen är. Ökad publicering av negativa fynd är motsatt riktning mot vad som varnas för, eftersom det snarare skulle motverka snedvridningen. Lägre krav på metod är inte den konsekvens som texten pekar ut, utan snarare en följd av snedvridet urval än varningen i sig. Att forskare slutar formulera frågor nämns inte och ligger utanför det som beskrivs som konsekvens.",
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
    explain: "Texten kopplar samman grönskans mätbara effekter, till exempel på temperatur och hälsa, med att den är ojämnt fördelad mellan olika områden. Att grönska bara är dekoration motsäger att texten lyfter fram konkreta, mätbara effekter. Att träd bara hjälper på landsbygden strider mot att resonemanget handlar om städer. Att socioekonomi saknar betydelse för vegetation går emot att texten just kopplar den ojämna fördelningen till sociala och ekonomiska skillnader.",
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
    explain: "Texten anger uttryckligen att skötsel och lokal förankring krävs för att trädsatsningar ska fungera på sikt. Fler planteringsceremonier beskriver en engångshändelse och saknar den långsiktiga skötsel som texten kräver. Att undvika täta områden nämns inte som ett villkor för att satsningarna ska lyckas. Att ta bort parker i rika områden är en omfördelningsåtgärd som inte är det som texten anger som förutsättning.",
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
    explain: "The passage's main claim is that remote work carries a hidden cost in lost informal learning, which means mentorship needs to be deliberately redesigned rather than left to chance. The claim that remote work always increases productivity overstates the passage's point, which is about a specific cultural cost rather than a blanket productivity effect. Saying hallways matter more than software takes a supporting image too literally instead of the broader argument about learning. Reducing junior staff's preference for offices to social reasons only ignores the passage's emphasis on learning, not just socializing.",
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
    explain: "Weaker remote strategies overlook the cultural cost of fewer informal learning moments, since they treat remote work only as a logistical matter. The price of office furniture is irrelevant and not something the passage discusses as a missed cost. Scheduling more meetings is not identified as the missing insight, since the issue is the quality of informal exchange, not meeting frequency. Claiming flexibility never matters overstates the passage's position, which criticizes shallow strategies, not flexibility itself.",
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
    explain: "According to the author, successful organizations deliberately redesign mentorship to compensate for what remote work removes. Banning remote work contradicts the passage's assumption that remote work continues and simply needs better mentorship. Adding more hallways online is a literal misreading of the hallway image rather than the actual recommendation to redesign mentorship. Ignoring junior staff is the opposite of the intent, since the passage's concern is precisely about supporting them.",
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
    explain: "The passage's core idea is that sudden events attract more attention than slow-moving trends, so readers need to actively look for the underlying trend themselves. Saying journalists invent climate disasters goes beyond the claim, which is about attention bias, not fabrication. Calling floods unimportant misreads the point, since floods are used as an example of a sudden event, not dismissed as trivial. Saying insurance is unrelated to climate ignores that such details likely serve as evidence within the passage's argument, not as an unrelated aside.",
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
    explain: "År 2024 hade B högst andel med 19 procent, jämfört med D:s 18, A:s 15 och C:s 13, vilket gör B till den kommun med störst cykelandel. A och C ligger klart lägre och kan uteslutas direkt, och D:s 18 procent är nära men ändå lägre än B:s 19.",
  },
  {
    id: "dtk-2",
    kind: "dtk",
    prompt: "Hur många procentenheter ökade Kommun A mellan 2022 och 2024?",
    passage:
      "Andel cykelresor av alla resor (procent)\nKommun A: 2022: 12  2023: 14  2024: 15\nKommun B: 2022: 18  2023: 17  2024: 19\nKommun C: 2022: 9   2023: 11  2024: 13\nKommun D: 2022: 16  2023: 16  2024: 18",
    options: ["2", "3", "4", "15"],
    correctIndex: 1,
    explain: "Kommun A gick från 12 procent 2022 till 15 procent 2024, en ökning med 3 procentenheter. Alternativen 2 och 4 motsvarar inte differensen mellan dessa två värden, och 15 procentenheter vore orimligt stort eftersom det är själva slutvärdet, inte förändringen.",
  },
  {
    id: "dtk-3",
    kind: "dtk",
    prompt: "Vilken kommun minskade något mellan 2022 och 2023?",
    passage:
      "Andel cykelresor av alla resor (procent)\nKommun A: 2022: 12  2023: 14  2024: 15\nKommun B: 2022: 18  2023: 17  2024: 19\nKommun C: 2022: 9   2023: 11  2024: 13\nKommun D: 2022: 16  2023: 16  2024: 18",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    explain: "B är den enda kommun som minskade mellan 2022 och 2023, från 18 till 17 procent. A, C och D antingen ökade eller låg still under samma period och kan därför uteslutas.",
  },
  {
    id: "dtk-4",
    kind: "dtk",
    prompt: "Ungefär hur stor andel av total försäljning stod Produkt Y för?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["15 %", "25 %", "35 %", "40 %"],
    correctIndex: 1,
    explain: "Produkt Y svarade för 25 av totalt 100 (motsvarande enheter), det vill säga 25 procent av den totala försäljningen. 15 procent är för lågt och 35/40 procent överskattar Y:s andel, vilka snarare stämmer med andra produkters värden i diagrammet.",
  },
  {
    id: "dtk-5",
    kind: "dtk",
    prompt: "Vilken produkt hade störst försäljning?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["X", "Y", "Z", "Y och Z lika"],
    correctIndex: 0,
    explain: "X hade störst försäljning med värdet 40, vilket är högre än både Y (25) och Z (35). Y och Z ligger båda under X och är dessutom inte lika stora som varandra, så det sista alternativet stämmer inte heller.",
  },
  {
    id: "dtk-6",
    kind: "dtk",
    prompt: "Med hur många miljoner skiljer sig X och Z?",
    passage:
      "Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.",
    options: ["5", "10", "15", "25"],
    correctIndex: 0,
    explain: "X ligger på 40 miljoner och Z på 35 miljoner, en skillnad på 5 miljoner. 10 och 15 miljoner är för stora skillnader utifrån dessa värden, och 25 miljoner motsvarar snarare skillnaden mellan X och en annan produkt.",
  },
  {
    id: "dtk-7",
    kind: "dtk",
    prompt: "Vilken avdelning hade lägst sjukfrånvaro i mars?",
    passage:
      "Sjukfrånvaro per avdelning (procent av arbetad tid)\nAvd. A: feb 6,2 · mars 5,4 · april 5,8\nAvd. B: feb 4,9 · mars 5,1 · april 4,7\nAvd. C: feb 7,3 · mars 6,8 · april 7,0\nAvd. D: feb 5,6 · mars 4,9 · april 5,3",
    options: ["A", "B", "C", "D"],
    correctIndex: 3,
    explain: "I mars hade D lägst sjukfrånvaro med 4,9 procent, vilket är lägre än B:s 5,1, A:s 5,4 och C:s 6,8. B (5,1) är näst lägst men ändå högre än D, och C sticker tvärtom ut som avdelningen med högst frånvaro.",
  },
  {
    id: "dtk-8",
    kind: "dtk",
    prompt: "Hur stor andel av företagets totala kostnader utgjorde material 2023?",
    passage:
      "Kostnader 2023 (miljoner kr): Personal 12 · Material 8 · Lokaler 4 · Övrigt 6. Totalt = 30.",
    options: ["8 %", "ungefär 27 %", "ungefär 40 %", "ungefär 73 %"],
    correctIndex: 1,
    explain: "Materialkostnaden var 8 av totalt 30 (motsvarande enheter), vilket ger 8/30 ≈ 0,27, det vill säga ungefär 27 procent. 8 procent förväxlar delvärdet med andelen, medan 40 och 73 procent bygger på fel jämförelsetal och blir alldeles för höga.",
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

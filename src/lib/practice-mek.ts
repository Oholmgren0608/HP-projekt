import type { ChoiceQuestion } from "@/lib/practice";

/** Egna HP-stil-frågor — inte från officiella prov. */

const MEK_PROMPT = "Välj det alternativ som bäst fyller i meningen.";
const MEK_PROMPT_TWO = "Välj det alternativ som bäst fyller i luckorna.";

export const MEK_BANK: ChoiceQuestion[] = [
  {
    id: "mek-1",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Studien fick kritik för små urval; ____ visade uppföljningen samma mönster i en större population.",
    options: ["därför", "emellertid", "exempelvis", "nämligen"],
    correctIndex: 1,
    explain: "Emellertid signalerar kontrast, vilket krävs eftersom meningen vänder från kritiken till att resultatet ändå bekräftades. Därför uttrycker orsak och verkan, inte motsägelse, och ger fel logik. Exempelvis inleder ett exempel, vilket inte passar när ett förhållande ska nyanseras. Nämligen förklarar eller preciserar något föregående utan att ge den kontrast som krävs.",
  },
  {
    id: "mek-2",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren undviker förenklingar och resonerar ____, med tydliga premisser och slutsatser.",
    options: ["slarvigt", "impulsivt", "koherent", "vardagligt"],
    correctIndex: 2,
    explain: "Koherent betyder sammanhängande och logiskt uppbyggt, vilket krävs i formell sakprosa. Slarvigt beskriver bristande noggrannhet och ger fel innebörd. Impulsivt handlar om spontant handlande, inte om textens struktur. Vardagligt är fel register eftersom sammanhanget är formellt.",
  },
  {
    id: "mek-3",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Priset på råvaran steg kraftigt. ____ tvingades flera företag se över sina marginaler.",
    options: ["Följaktligen", "Trots det", "Däremot", "Ändå"],
    correctIndex: 0,
    explain: "Följaktligen uttrycker att det som följer är en logisk konsekvens av det föregående, orsak till verkan. Trots det inför en motsägelse och bryter den logiska kedjan. Däremot ställer två led i kontrast mot varandra i stället för i följd. Ändå markerar samma slags motsägelse och passar inte när ett resonemang mynnar ut i en slutsats.",
  },
  {
    id: "mek-4",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Rapporten är ____ kort: den sammanfattar tre års forskning på tio sidor utan att tappa precisionsnivån.",
    options: ["onödigt", "vagt", "mundligt", "koncist"],
    correctIndex: 3,
    explain: "Koncist betyder kortfattat och precist, den positiva egenskap meningen beskriver. Onödigt är en värdering som inte beskriver språklig stil. Vagt är nästan motsatsen, eftersom det innebär otydlighet snarare än precision. Mundligt (muntligt) beskriver talspråklig framställning, inte kortfattad precision.",
  },
  {
    id: "mek-5",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Vissa kritiker såg reformen som för snabb, ____ andra menade att den kom för sent.",
    options: ["respektive", "medan", "således", "dessutom"],
    correctIndex: 1,
    explain: "Medan ställer två synsätt mot varandra inom samma mening, vilket krävs när innehållet kontrasteras. Respektive parar ihop flera led var för sig utan att skapa motsättning. Således drar en slutsats och signalerar inte samtidig kontrast. Dessutom lägger bara till information utan att skapa någon motsättning.",
  },
  {
    id: "mek-6",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Hypotesen är intressant, ____ underlaget är ännu för tunt för långtgående slutsatser.",
    options: ["och", "så", "men", "ty"],
    correctIndex: 2,
    explain: "Men signalerar en reservation eller motsägelse mot det som just sagts. Och binder samman likställda led utan reservation. Så anger följd, inte motsättning. Ty anger orsak till det föregående och passar inte när en invändning ska göras.",
  },
  {
    id: "mek-7",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Beslutet fattades ____ efter flera utredningar, inte i hast.",
    options: ["överlagt", "impulsivt", "slumpmässigt", "hemligt"],
    correctIndex: 0,
    explain: "Överlagt betyder genomtänkt, efter noggrant övervägande, motsatsen till det oplanerade. Impulsivt beskriver just ett handlande utan eftertanke och är därmed motsatsordet till det sökta. Slumpmässigt antyder att ingen plan alls låg bakom, vilket också strider mot betydelsen. Hemligt handlar om sekretess, inte om graden av eftertanke.",
  },
  {
    id: "mek-8",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tekniken är lovande. ____ kvarstår frågor om kostnader och rättvis tillgång.",
    options: ["Således", "Exempelvis", "Nämligen", "Likväl"],
    correctIndex: 3,
    explain: "Likväl betyder trots det och passar när en kontrast ska följa på en positiv inledning. Således drar en logisk slutsats i stället för att införa en motsägelse. Exempelvis inleder ett exempel, vilket inte ger den kontrast som krävs. Nämligen förklarar eller motiverar något föregående utan att vända innebörden.",
  },
  {
    id: "mek-9",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Hon argumenterade ____: varje påstående backades upp med belägg.",
    options: ["dogmatiskt", "sakligt", "svävande", "ironiskt"],
    correctIndex: 1,
    explain: "Sakligt beskriver ett resonemang som bygger på belägg och konkreta fakta, vilket passar ett underbyggt resonemang. Dogmatiskt antyder ett resonemang som utgår från fasta åsikter snarare än belägg. Svävande betyder vagt och obestämt, alltså motsatsen till ett tydligt underbyggt resonemang. Ironiskt beskriver en attityd av underförstådd motsats, inte ett sätt att argumentera sakligt.",
  },
  {
    id: "mek-10",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Förslaget vann gehör ____ bland dem som tidigare varit skeptiska.",
    options: ["oaktat", "följaktligen", "i synnerhet", "däremot"],
    correctIndex: 2,
    explain: "I synnerhet förstärker att något gäller särskilt eller framför allt en viss grupp. Oaktat betyder trots och inför en motsägelse som inte hör hemma här. Följaktligen drar en slutsats i stället för att peka ut en särskild grupp. Däremot ställer två led i kontrast och passar inte när en grupp ska lyftas fram som särskilt berörd.",
  },
  {
    id: "mek-11",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ rådande osäkerhet gick bolaget vidare med investeringen.",
    options: ["Oaktat", "Tack vare", "På grund av", "Till följd av"],
    correctIndex: 0,
    explain: "Oaktat betyder trots och är ett formellt uttryck som passar när något gäller trots en omständighet. Tack vare anger en positiv orsak, inte en motsägelse. På grund av anger orsak-verkan rakt av, vilket ger fel logik om meningen kräver en motsägelse. Till följd av uttrycker samma slags orsakssamband och passar därför inte heller.",
  },
  {
    id: "mek-12",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Texten rör sig mellan empiri och teori, ____ utan att blanda ihop nivåerna.",
    options: ["alltså", "ty", "så", "dock"],
    correctIndex: 3,
    explain: "Dock tillför en nyanserad reservation, en mildare motsägelse mot det som sagts. Alltså signalerar en slutsats, inte en invändning. Ty anger orsak till det föregående, en annan logisk relation. Så anger följd och ger inte den reservation som krävs.",
  },
  {
    id: "mek-13",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Resultaten pekar i samma riktning; ____ kan man tala om ett robust fynd.",
    options: ["ändå", "således", "däremot", "trots det"],
    correctIndex: 1,
    explain: "Således drar en logisk slutsats av det som just konstaterats. Ändå inför en motsägelse och passar inte när en konsekvens ska uttryckas. Däremot ställer två led i kontrast mot varandra, vilket inte stämmer med ett orsak–verkan-samband. Trots det har samma motsägande funktion och är därför också fel här.",
  },
  {
    id: "mek-14",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kritikerna angrep metoden, ____ inte själva frågeställningen.",
    options: ["respektive", "såväl", "men", "både"],
    correctIndex: 2,
    explain: "Men kontrasterar det som angrips i resonemanget mot det som ändå lämnas orört. Respektive parar ihop flera led var för sig utan att skapa motsättning. Såväl inleder en uppräkning som förutsätter ett efterföljande som och ger ingen kontrast. Både förenar två led på samma sätt i stället för att ställa dem mot varandra.",
  },
  {
    id: "mek-15",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren skriver i ett ____ register som passar vetenskaplig essäistik.",
    options: ["formellt", "talspråkligt", "barnsligt", "slangbetonat"],
    correctIndex: 0,
    explain: "Formellt register hör hemma i sakprosa och essäistik av det slag som beskrivs. Talspråkligt är motsatt register och passar inte i en formell text. Barnsligt beskriver en omogen framställning, inte den vårdade stil som avses. Slangbetonat innebär informellt och vardagsnära språk, vilket krockar med sammanhangets formella ton.",
  },
  {
    id: "mek-16",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Ju mer data som tillkom, ____ tydligare blev mönstret.",
    options: ["så", "och", "men", "desto"],
    correctIndex: 3,
    explain: "Desto ingår i den fasta korrelationen ju … desto, som krävs för att uttrycka en proportionell relation. Så bildar andra konstruktioner men inte den aktuella korrelationen. Och binder samman led utan att uttrycka en gradvis samvariation. Men inför en motsägelse i stället för det stegrande samband som krävs.",
  },
  {
    id: "mek-17",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Han var ____ till förslaget: varken entusiastisk eller avvisande.",
    options: ["entydig", "ambivalent", "aggressiv", "indifferent på ett skämtsamt sätt"],
    correctIndex: 1,
    explain: "Ambivalent betyder kluven, det vill säga att ha motstridiga känslor eller uppfattningar samtidigt. Entydig betyder tvärtom tydlig och utan tvetydighet, motsatsen till det sökta. Aggressiv beskriver fientlighet, inte inre kluvenhet. Indifferent på ett skämtsamt sätt beskriver likgiltighet snarare än att vara splittrad mellan två ståndpunkter.",
  },
  {
    id: "mek-18",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Analysen är skarp, ____ den ibland blir väl kategorisk.",
    options: ["därför att", "så att", "även om", "utan att"],
    correctIndex: 2,
    explain: "Även om inför en medgivande bisats, det vill säga något gäller trots en omständighet. Därför att anger orsak, en annan logisk relation än medgivande. Så att uttrycker följd eller syfte, inte en invändning. Utan att anger frånvaro av en handling och ger inte den medgivande innebörden som krävs.",
  },
  {
    id: "mek-19",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Projektet stoppades ____ bristande finansiering.",
    options: ["på grund av", "trots", "oaktat", "i stället för"],
    correctIndex: 0,
    explain: "På grund av anger orsak, den logiska relation meningen kräver. Trots inför en motsägelse och vänder sambandet fel väg. Oaktat betyder likaså trots och ger samma felaktiga motsatsbetydelse. I stället för anger ett utbyte mellan alternativ, inte en orsak.",
  },
  {
    id: "mek-20",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Skillnaden mellan grupperna är liten, ____ statistiskt signifikant.",
    options: ["alltså", "nämligen", "respektive", "dock"],
    correctIndex: 3,
    explain: "Dock uttrycker en kontrast: skillnaden är liten men ändå betydelsefull. Alltså drar en slutsats i stället för att införa en invändning. Nämligen förklarar eller preciserar något föregående utan att vända innebörden. Respektive parar ihop led var för sig och ger ingen kontrastiv nyans.",
  },
  {
    id: "mek-21",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ mer tid som lades på granskningen, ____ färre fel återstod i manuskriptet.",
    options: ["Ju / desto", "Så / att", "Varken / eller", "Dels / dels"],
    correctIndex: 0,
    explain: "Ju … desto är det fasta korrelatet för att uttrycka att en förändring i den ena storheten motsvaras av en förändring i den andra. Så … att uttrycker i stället följd, en helt annan konstruktion. Varken … eller negerar två led, vilket inte är vad en proportionell relation kräver. Dels … dels räknar upp parallella omständigheter utan att uttrycka gradvis samvariation.",
  },
  {
    id: "mek-22",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Kommittén var ____ beredd att kompromissa ____ villig att överge kärnfrågan.",
    options: ["både / och", "varken / eller", "dels / dels", "såväl / som"],
    correctIndex: 1,
    explain: "Varken … eller negerar båda leden samtidigt, vilket krävs när ingetdera alternativ gäller. Både … och skulle i stället bekräfta att båda leden gäller, det motsatta av vad som avses. Dels … dels räknar upp två sanna omständigheter utan negation. Såväl … som bekräftar likaså båda leden och ger fel innebörd.",
  },
  {
    id: "mek-23",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Utredningen var ____ försenad ____ underfinansierad, vilket förklarar det tunna underlaget.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "inte / utan"],
    correctIndex: 2,
    explain: "Dels … dels räknar upp två parallella omständigheter som båda gäller samtidigt. Varken … eller negerar båda leden, vilket inte stämmer när båda faktiskt gäller. Antingen … eller uttrycker ett ömsesidigt uteslutande val mellan leden, inte en uppräkning. Inte … utan ersätter ett förkastat led med ett annat, vilket inte passar en ren uppräkning.",
  },
  {
    id: "mek-24",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Metoden är ____ tidskrävande ____ robust nog för att användas i uppföljande studier.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "både / och"],
    correctIndex: 3,
    explain: "Både … och förenar två positiva egenskaper som gäller samtidigt. Varken … eller negerar i stället båda leden. Antingen … eller ställer leden som ömsesidigt uteslutande alternativ. Dels … dels fungerar som uppräkning men saknar den sammanbindande, förstärkande innebörd som både … och ger här.",
  },
  {
    id: "mek-25",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Förslaget vann gehör ____ bland forskarna ____ bland praktikerna i fältet.",
    options: ["såväl / som", "varken / eller", "antingen / eller", "ju / desto"],
    correctIndex: 0,
    explain: "Såväl … som markerar att båda de nämnda grupperna avses, en bekräftande uppräkning. Varken … eller skulle i stället utesluta båda grupperna. Antingen … eller ställer grupperna som ett val mellan dem, inte som båda samtidigt. Ju … desto uttrycker en proportionell relation, inte en uppräkning av grupper.",
  },
  {
    id: "mek-26",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Reformen var ____ en ekonomisk fråga ____ en fråga om tillit till institutionerna.",
    options: ["varken / eller", "inte bara / utan också", "dels / dels", "antingen / eller"],
    correctIndex: 1,
    explain: "Inte bara … utan också utvidgar påståendet genom att lägga till ytterligare ett led utöver det första. Varken … eller negerar båda leden, motsatsen till en utvidgning. Dels … dels räknar upp led parallellt utan den förstärkande, stegrande effekten. Antingen … eller ställer leden som ett ömsesidigt uteslutande val.",
  },
  {
    id: "mek-27",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Kommunen måste ____ höja avgiften ____ skära i verksamheten; en tredje väg finns inte i budgeten.",
    options: ["både / och", "varken / eller", "antingen / eller", "såväl / som"],
    correctIndex: 2,
    explain: "Antingen … eller uttrycker ett tvingande val mellan två alternativ där bara det ena kan gälla. Både … och skulle i stället bekräfta att båda alternativen gäller samtidigt. Varken … eller negerar båda alternativen. Såväl … som bekräftar likaså båda leden, vilket krockar med tanken på ett val mellan dem.",
  },
  {
    id: "mek-28",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Urvalet var ____ litet ____ resultaten måste tolkas med stor försiktighet.",
    options: ["ju / desto", "varken / eller", "dels / dels", "så / att"],
    correctIndex: 3,
    explain: "Så … att anger följd: storleken eller egenskapen gör att en viss konsekvens uppstår, här att försiktighet krävs. Ju … desto uttrycker i stället en proportionell samvariation, inte en följd. Varken … eller negerar båda leden och saknar följdbetydelse. Dels … dels räknar bara upp parallella omständigheter utan att ange konsekvens.",
  },
  {
    id: "mek-29",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Rapporten ger ____ en entydig rekommendation ____ en klar tidsplan för genomförandet.",
    options: ["varken / eller", "både / och", "såväl / som", "dels / dels"],
    correctIndex: 0,
    explain: "Varken … eller krävs för att negera båda leden samtidigt. Både … och skulle bekräfta att båda leden gäller, det motsatta. Såväl … som bekräftar likaså båda leden. Dels … dels räknar upp sanna omständigheter utan negation.",
  },
  {
    id: "mek-30",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ tätare mätningarna gjordes, ____ tydligare framträdde säsongsvariationen.",
    options: ["Så / att", "Ju / desto", "Om / så", "Dels / dels"],
    correctIndex: 1,
    explain: "Ju … desto är det korrekta korrelatet när två luckor tillsammans ska uttrycka en proportionell relation. Så … att uttrycker följd, inte samvariation. Om … så inför ett villkor, en annan logisk konstruktion. Dels … dels räknar upp parallella led utan att koppla dem proportionellt till varandra.",
  },
  {
    id: "mek-31",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Beslutet fattades ____ den nya förordningen och kan därför inte överklagas på den grunden.",
    options: ["i strid med", "oaktat", "i enlighet med", "till skillnad från"],
    correctIndex: 2,
    explain: "I enlighet med betyder enligt eller i överensstämmelse med, vilket passar när något stämmer med en regel eller ett beslut. I strid med är motsatsen och skulle ange att något bryter mot det som avses. Oaktat betyder trots och inför en motsägelse som inte hör hemma här. Till skillnad från markerar en kontrast mellan två företeelser, inte en överensstämmelse.",
  },
  {
    id: "mek-32",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Studien säger lite om kausalitet; den är mer informativ ____ sambandens styrka än deras riktning.",
    options: ["trots", "genom", "inför", "med avseende på"],
    correctIndex: 3,
    explain: "Med avseende på betyder beträffande eller när det gäller, vilket passar för att peka ut vilken aspekt som avses. Trots inför en motsägelse som inte stämmer med att bara ange en aspekt. Genom anger medel eller metod, inte vilken aspekt som avses. Inför anger en tidsmässig eller rumslig relation, vilket inte matchar betydelsen beträffande.",
  },
  {
    id: "mek-33",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Flera linjer ställdes in ____ den ihållande stormen.",
    options: ["till följd av", "i stället för", "oaktat", "till förmån för"],
    correctIndex: 0,
    explain: "Till följd av anger orsak, att något inträffar som en konsekvens av något annat. I stället för anger ett utbyte mellan alternativ, inte orsak. Oaktat betyder trots och vänder sambandet till en motsägelse. Till förmån för anger att något gynnas på bekostnad av något annat, en annan relation än ren orsak.",
  },
  {
    id: "mek-34",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kostnaden är låg ____ den samhällsnytta som investeringen förväntas ge.",
    options: ["på grund av", "i förhållande till", "till följd av", "i enlighet med"],
    correctIndex: 1,
    explain: "I förhållande till jämför två storheter mot varandra, här kostnad mot nytta. På grund av anger orsak, inte jämförelse. Till följd av anger likaså orsak-verkan, inte en jämförelse mellan två storheter. I enlighet med betyder överensstämmelse med något, inte en jämförelse.",
  },
  {
    id: "mek-35",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Snabbare handläggning uppnåddes ____ rättssäkerheten, vilket kritiserades i remissvaren.",
    options: ["till förmån för", "i enlighet med", "på bekostnad av", "med undantag av"],
    correctIndex: 2,
    explain: "På bekostnad av betyder att något vinns genom att något annat förloras eller offras. Till förmån för anger att något gynnas, utan den förlust som den sökta frasen innebär. I enlighet med anger överensstämmelse, en helt annan relation. Med undantag av avgränsar något från en helhet, vilket inte uttrycker en vinst-förlust-relation.",
  },
  {
    id: "mek-36",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ tidigare prognoser visade utfallet en tydlig nedgång redan under första kvartalet.",
    options: ["I enlighet med", "Till följd av", "Med avseende på", "I motsats till"],
    correctIndex: 3,
    explain: "I motsats till kontrasterar det aktuella resultatet mot de tidigare prognoserna. I enlighet med skulle i stället ange överensstämmelse, motsatsen till den kontrast som avses. Till följd av anger orsak-verkan, inte en motsättning mellan två uppgifter. Med avseende på pekar bara ut en aspekt utan att uttrycka någon kontrast.",
  },
  {
    id: "mek-37",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Alla regioner, ____ tre glesbygdskommuner, nådde målet inom utsatt tid.",
    options: ["med undantag av", "till följd av", "i stället för", "på grund av"],
    correctIndex: 0,
    explain: "Med undantag av avgränsar tre kommuner från resten av en större grupp. Till följd av anger orsak, inte en avgränsning av vissa enheter. I stället för anger utbyte mellan alternativ, inte undantag från en grupp. På grund av anger likaså orsak, vilket inte matchar en avgränsande betydelse.",
  },
  {
    id: "mek-38",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Planeringen måste ____ de boendes synpunkter, inte bara de tekniska kalkylerna.",
    options: ["bortse från", "ta hänsyn till", "ge avkall på", "ställa in"],
    correctIndex: 1,
    explain: "Ta hänsyn till är den fasta kollokationen som krävs i sammanhanget. Bortse från är motsatsen, att inte beakta något. Ge avkall på betyder att pruta på eller avstå från något, en annan innebörd. Ställa in betyder att avbryta eller justera något, vilket inte matchar betydelsen att beakta.",
  },
  {
    id: "mek-39",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Utifrån de samstämmiga mätningarna kunde forskarna ____ att effekten var reell.",
    options: ["ställa krav", "ge uttryck", "dra slutsatsen", "fatta intresse"],
    correctIndex: 2,
    explain: "Dra slutsatsen (att) är den fasta kollokationen för att ange vad ett resonemang mynnar ut i. Ställa krav handlar om att kräva något, inte om att komma fram till en slutsats. Ge uttryck (för) kräver en annan preposition och en annan betydelse, att visa en känsla eller åsikt. Fatta intresse betyder att bli intresserad, vilket inte hör ihop med att dra en slutsats.",
  },
  {
    id: "mek-40",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren ____ sin oro för att debatten förenklas redan i förordet.",
    options: ["ställer krav på", "tar hänsyn till", "drar slutsatsen av", "ger uttryck för"],
    correctIndex: 3,
    explain: "Ge uttryck för är den fasta kollokationen för att visa eller förmedla en känsla eller uppfattning. Ställer krav på handlar om att kräva något, en annan innebörd. Tar hänsyn till betyder att beakta något, inte att förmedla en uppfattning. Drar slutsatsen av anger att komma fram till en slutsats genom något, inte att uttrycka en känsla.",
  },
  {
    id: "mek-41",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Styrelsen ____ att skjuta upp investeringen till nästa budgetår.",
    options: ["fattade beslutet", "drog slutsatsen av", "tog hänsyn", "gav uttryck"],
    correctIndex: 0,
    explain: "Den etablerade kollokationen är \"fatta beslut\", vilket gör att verbfrasen passar grammatiskt och stilistiskt i meningen. \"Drog slutsatsen av\" hör ihop med en slutsats, inte ett beslut, och kräver en annan konstruktion. \"Tog hänsyn\" betyder att beakta något, inte att bestämma sig för något. \"Gav uttryck\" betyder att uttrycka en känsla eller åsikt, inte att fatta ett beslut.",
  },
  {
    id: "mek-42",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tillsynsmyndigheten ____ strängare redovisning av bieffekter.",
    options: ["tog hänsyn", "ställde krav på", "fattade intresse för", "gav avkall"],
    correctIndex: 1,
    explain: "Kollokationen \"ställa krav på\" är den naturliga verbfrasen när någon kräver något av någon annan. \"Tog hänsyn\" betyder att beakta något, vilket är en annan handling än att kräva. \"Fattade intresse för\" betyder att bli intresserad, vilket har en helt annan innebörd. \"Gav avkall\" betyder att offra eller minska på något, alltså motsatt riktning mot att ställa krav.",
  },
  {
    id: "mek-43",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Osäkerheten i skattningarna är ____ beroende av urvalets storlek.",
    options: ["i synnerhet", "i stället", "i hög grad", "i enlighet"],
    correctIndex: 2,
    explain: "\"I hög grad\" betyder i stor utsträckning och passar därför som gradmarkör i meningen. \"I synnerhet\" lyfter fram ett särskilt fall snarare än att ange grad. \"I stället\" anger ersättning, inte omfattning. \"I enlighet\" kräver kompletteringen \"med\" och betyder överensstämmelse, inte grad.",
  },
  {
    id: "mek-44",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kritiken riktades ____ mot den bristande transparensen i urvalet.",
    options: ["respektive", "följaktligen", "oaktat", "främst"],
    correctIndex: 3,
    explain: "\"Främst\" preciserar att kritiken gällde särskilt transparensen, vilket är den betydelse sammanhanget kräver. \"Respektive\" används för att para ihop led i en uppräkning, inte för att peka ut en särskild aspekt. \"Följaktligen\" anger en logisk följd, inte en precisering. \"Oaktat\" betyder trots, vilket inte stämmer med att lyfta fram något specifikt.",
  },
  {
    id: "mek-45",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I en vetenskaplig artikel ____ man normalt redovisa osäkerhet och avgränsningar.",
    options: ["förväntas", "köttar", "snackar om att", "kör med att"],
    correctIndex: 0,
    explain: "\"Förväntas\" hör till ett formellt register som matchar textens övriga stilnivå. \"Köttar\" är ett talspråkligt slangord som inte hör hemma i en formell text. \"Snackar om att\" är talspråkligt och bryter mot registret. \"Kör med att\" är likaså vardagligt och passar inte i sammanhanget.",
  },
  {
    id: "mek-46",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Metoden är väldokumenterad. ____ har den prövats i tre oberoende kohorter.",
    options: ["Däremot", "Dessutom", "Trots det", "Emellertid"],
    correctIndex: 1,
    explain: "\"Dessutom\" lägger till ett stödjande skäl till det som redan sagts, vilket är den logik meningen bygger på. \"Däremot\" markerar en kontrast, inte ett tillägg. \"Trots det\" signalerar en motsägelse som inte finns i sammanhanget. \"Emellertid\" markerar en invändning snarare än ett ytterligare skäl.",
  },
  {
    id: "mek-47",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Exporten ökade något. ____ sjönk hemmamarknaden mer än väntat.",
    options: ["Således", "Följaktligen", "Däremot", "Nämligen"],
    correctIndex: 2,
    explain: "\"Däremot\" ställer två utvecklingar mot varandra, vilket är precis vad meningen gör. \"Således\" anger en slutsats, inte en motsättning. \"Följaktligen\" markerar orsak och verkan, vilket inte stämmer med kontrasten i texten. \"Nämligen\" förklarar eller specificerar något, det ställer inte två saker mot varandra.",
  },
  {
    id: "mek-48",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tre faktorer tycks samverka, ____ finansiering, tidsram och lokal förankring.",
    options: ["emellertid", "oaktat", "däremot", "nämligen"],
    correctIndex: 3,
    explain: "\"Nämligen\" specificerar vilka faktorer som avses, vilket är den förklarande funktion meningen kräver. \"Emellertid\" markerar en kontrast, inte en precisering. \"Oaktat\" betyder trots, vilket är en helt annan betydelse. \"Däremot\" ställer istället två led mot varandra och passar inte som förklaring.",
  },
  {
    id: "mek-49",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Påståendet bör prövas empiriskt, ____ det strider mot tidigare rön.",
    options: ["ty", "således", "exempelvis", "respektive"],
    correctIndex: 0,
    explain: "\"Ty\" är en formell konjunktion som betyder eftersom och anger skäl, vilket stämmer med meningens logik. \"Således\" anger en följd eller slutsats, inte ett skäl. \"Exempelvis\" ger ett exempel snarare än en orsak. \"Respektive\" används vid uppräkningar och fungerar inte som orsakskonjunktion.",
  },
  {
    id: "mek-50",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Förslaget gick igenom, ____ flera ledamöter reserverade sig mot beräkningsgrunden.",
    options: ["därför att", "fastän", "så att", "för att"],
    correctIndex: 1,
    explain: "\"Fastän\" inför ett medgivande som ändå inte upphäver huvudsatsen, vilket är den logiska relationen i meningen. \"Därför att\" anger en orsak, inte ett medgivande. \"Så att\" anger en följd eller ett syfte, vilket inte matchar sammanhanget. \"För att\" anger ett syfte, vilket inte fyller samma funktion som ett medgivande.",
  },
  {
    id: "mek-51",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Avtalet förlängs automatiskt, ____ någon av parterna säger upp det i tid.",
    options: ["eftersom", "därför att", "såvida inte", "så att"],
    correctIndex: 2,
    explain: "\"Såvida inte\" betyder om inte och inför en villkorlig undantagsbisats, vilket är den relation meningen beskriver. \"Eftersom\" anger en orsak, inte ett villkor. \"Därför att\" anger likaledes orsak snarare än ett undantag. \"Så att\" anger en följd, vilket inte stämmer med ett villkorligt undantag.",
  },
  {
    id: "mek-52",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Modellen kan generaliseras, ____ samma mätfel inte återkommer i nya stickprov.",
    options: ["trots att", "oaktat att", "även om", "förutsatt att"],
    correctIndex: 3,
    explain: "\"Förutsatt att\" sätter ett tydligt villkor för att generaliseringen ska gälla, vilket matchar meningens logik. \"Trots att\" inför ett medgivande utan att ange något villkor. \"Oaktat att\" har samma medgivande betydelse och passar därför inte. \"Även om\" är också ett medgivande snarare än ett villkor för giltighet.",
  },
  {
    id: "mek-53",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Huvudresultatet står sig. ____ kan nämnas att svarsfrekvensen var ovanligt hög.",
    options: ["För övrigt", "Följaktligen", "Däremot", "Emellertid"],
    correctIndex: 0,
    explain: "\"För övrigt\" tillför en sidoupplysning, vilket är den funktion uttrycket har i meningen. \"Följaktligen\" anger en slutsats, inte en sidoupplysning. \"Däremot\" markerar en kontrast som inte finns i sammanhanget. \"Emellertid\" signalerar en invändning snarare än ett tillägg vid sidan om.",
  },
  {
    id: "mek-54",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kostnaderna skenade; ____ saknades en realistisk riskbuffert från början.",
    options: ["i synnerhet", "med andra ord", "oaktat", "respektive"],
    correctIndex: 1,
    explain: "\"Med andra ord\" omformulerar samma poäng med andra ord, vilket är precis den funktionen som krävs här. \"I synnerhet\" lyfter fram ett specifikt exempel, inte en omformulering. \"Oaktat\" betyder trots, en helt annan betydelse. \"Respektive\" används vid uppräkningar och fyller inte samma funktion som en omformulering.",
  },
  {
    id: "mek-55",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Problemet är ____ bristen på data ____ bristen på en gemensam definition.",
    options: ["både / och", "såväl / som", "inte / utan", "varken / eller"],
    correctIndex: 2,
    explain: "\"Inte … utan\" korrigerar ett påstående till ett annat och markerar att det är det senare ledet som är det egentliga problemet. \"Både … och\" anger addition av två saker som båda gäller, inte en korrigering. \"Såväl … som\" fyller samma additiva funktion och passar inte för att ersätta ett påstående med ett annat. \"Varken … eller\" nekar båda alternativen samtidigt, vilket inte stämmer med att ett av dem faktiskt gäller.",
  },
  {
    id: "mek-56",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ mer komplext regelverket blev, ____ färre små aktörer klarade efterlevnaden.",
    options: ["Så / att", "Varken / eller", "Dels / dels", "Ju / desto"],
    correctIndex: 3,
    explain: "\"Ju … desto\" uttrycker en omvänd proportionalitet: ju mer komplexitet, desto färre som klarar kraven, vilket stämmer med meningens innehåll. \"Så … att\" anger en följdkonstruktion, inte en proportionalitet mellan två storheter. \"Varken … eller\" nekar båda leden och passar inte här. \"Dels … dels\" räknar bara upp led utan att uttrycka något samband mellan grader.",
  },
  {
    id: "mek-57",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Strategin vilar ____ på styrmedel ____ på frivilliga överenskommelser med branschen.",
    options: ["dels / dels", "varken / eller", "antingen / eller", "ju / desto"],
    correctIndex: 0,
    explain: "\"Dels … dels\" räknar upp två kompletterande delar som tillsammans utgör helheten, vilket matchar meningens uppbyggnad. \"Varken … eller\" nekar båda leden, vilket är motsatt logik. \"Antingen … eller\" anger två ömsesidigt uteslutande alternativ, inte två samtidigt gällande delar. \"Ju … desto\" uttrycker proportionalitet och passar inte för en enkel uppräkning.",
  },
  {
    id: "mek-58",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Utvärderingen belyser ____ genomförandet ____ de långsiktiga effekterna.",
    options: ["varken / eller", "både / och", "antingen / eller", "så / att"],
    correctIndex: 1,
    explain: "\"Både … och\" täcker två aspekter samtidigt, vilket är den logik meningen bygger på. \"Varken … eller\" utesluter båda aspekterna, alltså motsatt betydelse. \"Antingen … eller\" anger att bara en av aspekterna gäller, inte båda. \"Så … att\" anger en följdkonstruktion och fyller inte samma funktion som en dubbel bekräftelse.",
  },
  {
    id: "mek-59",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Gruppen ____ att vänta med publicering efter att ha vägt osäkerheterna.",
    options: ["ställde krav", "tog hänsyn", "kom fram till", "gav uttryck"],
    correctIndex: 2,
    explain: "\"Kom fram till\" är kollokationen för att nå en slutsats, vilket är innebörden meningen kräver. \"Ställde krav\" har en helt annan betydelse som rör fordringar, inte slutsatser. \"Tog hänsyn\" betyder att beakta något, inte att nå ett resultat. \"Gav uttryck\" betyder att uttrycka en känsla eller åsikt, inte att komma fram till en slutsats.",
  },
  {
    id: "mek-60",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Forskarna ____ en reviderad hypotes redan i nästa artikel.",
    options: ["ställde in", "tog avstånd", "fäste avseende", "lade fram"],
    correctIndex: 3,
    explain: "\"Lade fram\" är den etablerade kollokationen för att presentera en hypotes eller ett förslag, vilket stämmer med sammanhanget. \"Ställde in\" betyder att avboka något, en helt annan betydelse. \"Tog avstånd\" betyder att markera oenighet med något, inte att presentera det. \"Fäste avseende\" är en ovanlig och felaktig kollokation som inte hör ihop med att lägga fram en hypotes.",
  },
  {
    id: "mek-61",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Samma mönster syntes i storstäderna; ____ rapporterades det från flera regioncentra.",
    options: ["likaledes", "däremot", "emellertid", "oaktat"],
    correctIndex: 0,
    explain: "\"Likaledes\" betyder på samma sätt och markerar ett tillägg snarare än en motsättning, vilket passar meningens logik. \"Däremot\" markerar istället en kontrast. \"Emellertid\" signalerar en invändning eller motsättning. \"Oaktat\" betyder trots, vilket inte fyller samma additiva funktion.",
  },
  {
    id: "mek-62",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Underlaget är ofullständigt; ____ talar de samstämmiga indikationerna för att trenden är reell.",
    options: ["följaktligen", "icke desto mindre", "nämligen", "exempelvis"],
    correctIndex: 1,
    explain: "\"Icke desto mindre\" betyder likväl och markerar att något gäller trots det föregående, vilket matchar meningens logik. \"Följaktligen\" anger en slutsats som följer av det tidigare, inte en motsättning. \"Nämligen\" förklarar eller specificerar, det markerar inte en motsättning. \"Exempelvis\" exemplifierar snarare än att uttrycka trots.",
  },
  {
    id: "mek-63",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Mätfelen var systematiska. ____ måste tidigare skattningar räknas om.",
    options: ["Trots det", "Däremot", "Följaktligen", "Oaktat detta"],
    correctIndex: 2,
    explain: "\"Följaktligen\" fångar orsak-och-verkan-relationen mellan de systematiska felen och den nödvändiga omräkningen. \"Trots det\" signalerar en motsättning som inte stämmer med den logiska följden. \"Däremot\" ställer istället två led mot varandra. \"Oaktat detta\" betyder trots detta, vilket är ett medgivande snarare än en följd.",
  },
  {
    id: "mek-64",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kunskapen spreds ____ seminarier och öppna arbetsmaterial snarare än via pressmeddelanden.",
    options: ["oaktat", "trots", "inför", "genom"],
    correctIndex: 3,
    explain: "\"Genom\" anger det medel eller den kanal som avses i meningen, vilket är den betydelse sammanhanget kräver. \"Oaktat\" betyder trots, en helt annan betydelse. \"Trots\" anger en motsättning som inte stämmer med att ange ett medel. \"Inför\" används om något som nalkas i tiden, inte om ett medel.",
  },
  {
    id: "mek-65",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ förhandlingarna skärptes tonen, men parterna lämnade inte bordet.",
    options: ["Under", "Oaktat", "Till följd", "I enlighet"],
    correctIndex: 0,
    explain: "\"Under\" anger en tidsrymd, det vill säga medan förhandlingarna pågick, vilket är den betydelse meningen behöver. \"Oaktat\" betyder trots, vilket är en annan relation. \"Till följd\" anger en orsak och kräver dessutom kompletteringen \"av\", vilket inte passar tidsangivelsen. \"I enlighet\" anger överensstämmelse, inte tidsrymd.",
  },
  {
    id: "mek-66",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I sakprosa ____ man gärna osäkerhet i stället för att överdriva säkerheten i fynden.",
    options: ["kör över", "redovisar", "slänger ur sig", "tjatar om"],
    correctIndex: 1,
    explain: "\"Redovisar\" är ett formellt verb som passar för att presentera osäkerhet i en saklig text. \"Kör över\" betyder att ignorera eller övertrumfa något, både fel betydelse och fel register. \"Slänger ur sig\" är talspråkligt och signalerar ett ogenomtänkt uttalande, vilket inte matchar formell redovisning. \"Tjatar om\" är också talspråkligt och har en negativ klang som inte passar sammanhanget.",
  },
  {
    id: "mek-67",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Den ena skolan betonar struktur, ____ den andra lägger vikten vid aktörers handlingsutrymme.",
    options: ["respektive", "således", "medan", "dessutom"],
    correctIndex: 2,
    explain: "\"Medan\" kontrasterar de två skolorna mot varandra, vilket är den relation meningen beskriver. \"Respektive\" används vid uppräkningar för att para ihop led, inte som kontrasterande konjunktion. \"Således\" anger en slutsats, inte en kontrast. \"Dessutom\" anger ett tillägg, vilket inte stämmer med att ställa två skolor mot varandra.",
  },
  {
    id: "mek-68",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Premisserna är desamma i båda modellerna; skillnaden ligger ____ i hur osäkerhet hanteras.",
    options: ["oaktat", "emellertid", "nämligen", "alltså"],
    correctIndex: 3,
    explain: "\"Alltså\" preciserar var skillnaden ligger som en slutsats av det tidigare sagda, vilket matchar meningens logik. \"Oaktat\" betyder trots, en helt annan betydelse. \"Emellertid\" anger en kontrast snarare än en slutsats. \"Nämligen\" specificerar en orsak men drar inte samma slutsats som \"alltså\" gör här.",
  },
  {
    id: "mek-69",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Definitionen var ____ vag ____ jämförbarhet mellan studierna blev i praktiken omöjlig.",
    options: ["så / att", "ju / desto", "varken / eller", "dels / dels"],
    correctIndex: 0,
    explain: "\"Så … att\" anger följden av vagheten som beskrivs, vilket är den relation meningen bygger på. \"Ju … desto\" uttrycker proportionalitet mellan två storheter, inte en enkel följdrelation. \"Varken … eller\" nekar båda leden och passar inte som följdkonstruktion. \"Dels … dels\" räknar bara upp led utan att ange en följd.",
  },
  {
    id: "mek-70",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ samma urvalskriterier används, ____ kan tidsserierna läggas samman.",
    options: ["Så / att", "Om / så", "Ju / desto", "Varken / eller"],
    correctIndex: 1,
    explain: "\"Om … så\" bygger upp villkoret att om kriterierna är desamma, så kan serierna slås ihop, vilket är precis den logik meningen uttrycker. \"Så … att\" anger en följd utan att formulera något villkor. \"Ju … desto\" uttrycker proportionalitet, inte ett enkelt villkor. \"Varken … eller\" nekar båda leden och saknar villkorets struktur helt.",
  },
  {
    id: "mek-71",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ de nya rönen ter sig den tidigare rekommendationen alltför kategorisk.",
    options: ["Oaktat", "Till följd av", "I ljuset av", "På bekostnad av"],
    correctIndex: 2,
    explain: "\"I ljuset av\" betyder med de nya rönen som bakgrund, vilket är den innebörd meningen kräver. \"Oaktat\" betyder trots, en helt annan relation. \"Till följd av\" anger ett mer direkt kausalt samband än det stödjande sammanhang som avses. \"På bekostnad av\" betyder att något offras för något annat, vilket inte stämmer med att ge en bakgrund.",
  },
  {
    id: "mek-72",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den senaste lågkonjunkturen framstår sparandet som mer begripligt.",
    options: ["I stället för", "Till förmån för", "Med undantag av", "Mot bakgrund av"],
    correctIndex: 3,
    explain: "\"Mot bakgrund av\" ger den kontext som gör beteendet begripligt, vilket är den funktion uttrycket fyller. \"I stället för\" anger en ersättning, inte en förklarande bakgrund. \"Till förmån för\" anger att något gynnas, en annan relation. \"Med undantag av\" anger en uteslutning, vilket inte stämmer med att ge sammanhang.",
  },
  {
    id: "mek-73",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Modellen predicerade en uppgång. ____ sjönk indikatorerna tre månader i följd.",
    options: ["Emellertid", "Således", "Följaktligen", "Nämligen"],
    correctIndex: 0,
    explain: "\"Emellertid\" kontrasterar prediktionen mot det faktiska utfallet, vilket är den relation meningen beskriver. \"Således\" anger en slutsats, inte en motsättning mellan förväntning och resultat. \"Följaktligen\" anger orsak och verkan snarare än en kontrast. \"Nämligen\" specificerar något men uttrycker ingen motsättning.",
  },
  {
    id: "mek-74",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den politiska osäkerheten tecknades det långsiktiga avtalet.",
    options: ["Tack vare", "Oaktat", "På grund av", "Till följd av"],
    correctIndex: 1,
    explain: "\"Oaktat\" markerar att avtalet tecknades trots osäkerheten, vilket är den motsättning meningen beskriver. \"Tack vare\" anger en positiv bidragande orsak, men osäkerhet är inget som underlättar ett avtal. \"På grund av\" anger orsak, medan avtalet i själva verket tecknades trots osäkerheten, inte på grund av den. \"Till följd av\" anger samma felaktiga kausala riktning som \"på grund av\".",
  },
  {
    id: "mek-75",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Texten är ____ polemisk ____ slarvig; den är saklig men onödigt lång.",
    options: ["både / och", "dels / dels", "varken / eller", "antingen / eller"],
    correctIndex: 2,
    explain: "\"Varken … eller\" avvisar båda de negativa etiketterna samtidigt, det vill säga att texten är varken polemisk eller slarvig. \"Både … och\" skulle betyda att båda etiketterna gäller, motsatt den avsedda betydelsen. \"Dels … dels\" räknar bara upp led utan den nekande innebörden. \"Antingen … eller\" anger att ett av alternativen gäller, inte att båda avvisas.",
  },
  {
    id: "mek-76",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Åtgärden berör ____ hushållen ____ de mindre företagen i innerstaden.",
    options: ["varken / eller", "antingen / eller", "ju / desto", "såväl / som"],
    correctIndex: 3,
    explain: "\"Såväl … som\" inkluderar båda grupperna samtidigt, vilket är den betydelse meningen kräver. \"Varken … eller\" utesluter båda grupperna, motsatt betydelse. \"Antingen … eller\" anger att bara en av grupperna gäller. \"Ju … desto\" uttrycker proportionalitet och saknar den inkluderande funktionen helt.",
  },
  {
    id: "mek-77",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den stundande omorganisationen växte oron bland de tillsvidareanställda.",
    options: ["Inför", "Oaktat", "Genom", "Enligt"],
    correctIndex: 0,
    explain: "\"Inför\" betyder med tanke på något som nalkas, vilket är den tidsmässiga innebörd meningen behöver. \"Oaktat\" betyder trots, en annan relation. \"Genom\" anger ett medel, inte något som ligger framför i tiden. \"Enligt\" anger en källa eller överensstämmelse, vilket inte stämmer med sammanhanget.",
  },
  {
    id: "mek-78",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I utredningens sammanfattning ____ man sig från att spekulera om enskilda aktörers motiv.",
    options: ["backar", "avhåller", "köttar", "svävar"],
    correctIndex: 1,
    explain: "\"Avhåller\" hör till uttrycket \"avhålla sig från\" och passar det formella registret i meningen. \"Backar\" är vardagligt och beskriver en annan, mer konkret handling. \"Köttar\" är talspråklig slang som inte hör hemma i en formell text. \"Svävar\" betyder att vara osäker eller obestämd, vilket inte matchar betydelsen att avstå från något.",
  },
  {
    id: "mek-79",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Premisserna preciserades. ____ blev det möjligt att jämföra de två modellerna på lika villkor.",
    options: ["Trots det", "Däremot", "Därmed", "Oaktat detta"],
    correctIndex: 2,
    explain: "\"Därmed\" betyder därigenom och markerar en följd av den precisering som just gjorts, vilket är den relation meningen uttrycker. \"Trots det\" signalerar en motsättning som inte stämmer med att något följer logiskt. \"Däremot\" ställer istället två led mot varandra. \"Oaktat detta\" betyder trots detta, vilket också är ett medgivande snarare än en följd.",
  },
  {
    id: "mek-80",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Förändringen var ____ teknisk ____ institutionell: nya rutiner krävde ny ansvarsfördelning.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "inte bara / utan även"],
    correctIndex: 3,
    explain: "\"Inte bara … utan även\" utvidgar påståendet till att gälla mer än bara det tekniska, vilket är den betydelse meningen kräver. \"Varken … eller\" nekar båda leden, motsatt den utvidgande betydelsen. \"Antingen … eller\" anger ett ömsesidigt uteslutande val, inte en utvidgning. \"Dels … dels\" räknar bara upp led utan den gradvisa utvidgning som \"inte bara … utan även\" uttrycker.",
  },
];

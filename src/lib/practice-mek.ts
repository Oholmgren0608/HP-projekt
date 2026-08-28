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
    explain: "”Emellertid” markerar kontrast: trots kritiken bekräftades resultatet.",
  },
  {
    id: "mek-2",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren undviker förenklingar och resonerar ____, med tydliga premisser och slutsatser.",
    options: ["slarvigt", "impulsivt", "koherent", "vardagligt"],
    correctIndex: 2,
    explain: "Koherent passar formell sakprosa och betyder sammanhängande.",
  },
  {
    id: "mek-3",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Priset på råvaran steg kraftigt. ____ tvingades flera företag se över sina marginaler.",
    options: ["Följaktligen", "Trots det", "Däremot", "Ändå"],
    correctIndex: 0,
    explain: "”Följaktligen” uttrycker orsak → verkan.",
  },
  {
    id: "mek-4",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Rapporten är ____ kort: den sammanfattar tre års forskning på tio sidor utan att tappa precisionsnivån.",
    options: ["onödigt", "vagt", "mundligt", "koncist"],
    correctIndex: 3,
    explain: "Koncist = kortfattat och precist.",
  },
  {
    id: "mek-5",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Vissa kritiker såg reformen som för snabb, ____ andra menade att den kom för sent.",
    options: ["respektive", "medan", "således", "dessutom"],
    correctIndex: 1,
    explain: "”Medan” ställer två synsätt mot varandra i samma mening.",
  },
  {
    id: "mek-6",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Hypotesen är intressant, ____ underlaget är ännu för tunt för långtgående slutsatser.",
    options: ["och", "så", "men", "ty"],
    correctIndex: 2,
    explain: "”Men” signalerar reservation mot det föregående.",
  },
  {
    id: "mek-7",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Beslutet fattades ____ efter flera utredningar, inte i hast.",
    options: ["överlagt", "impulsivt", "slumpmässigt", "hemligt"],
    correctIndex: 0,
    explain: "Överlagt = efter noggrant övervägande.",
  },
  {
    id: "mek-8",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tekniken är lovande. ____ kvarstår frågor om kostnader och rättvis tillgång.",
    options: ["Således", "Exempelvis", "Nämligen", "Likväl"],
    correctIndex: 3,
    explain: "”Likväl” = trots det; kontrast efter positiv inledning.",
  },
  {
    id: "mek-9",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Hon argumenterade ____: varje påstående backades upp med belägg.",
    options: ["dogmatiskt", "sakligt", "svävande", "ironiskt"],
    correctIndex: 1,
    explain: "Sakligt passar ett resonemang med belägg.",
  },
  {
    id: "mek-10",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Förslaget vann gehör ____ bland dem som tidigare varit skeptiska.",
    options: ["oaktat", "följaktligen", "i synnerhet", "däremot"],
    correctIndex: 2,
    explain: "”I synnerhet” förstärker att det gäller särskilt den gruppen.",
  },
  {
    id: "mek-11",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ rådande osäkerhet gick bolaget vidare med investeringen.",
    options: ["Oaktat", "Tack vare", "På grund av", "Till följd av"],
    correctIndex: 0,
    explain: "”Oaktat” = trots; formellt och MEK-typiskt.",
  },
  {
    id: "mek-12",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Texten rör sig mellan empiri och teori, ____ utan att blanda ihop nivåerna.",
    options: ["alltså", "ty", "så", "dock"],
    correctIndex: 3,
    explain: "”Dock” tillför en nyanserad reservation.",
  },
  {
    id: "mek-13",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Resultaten pekar i samma riktning; ____ kan man tala om ett robust fynd.",
    options: ["ändå", "således", "däremot", "trots det"],
    correctIndex: 1,
    explain: "”Således” drar en logisk slutsats.",
  },
  {
    id: "mek-14",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kritikerna angrep metoden, ____ inte själva frågeställningen.",
    options: ["respektive", "såväl", "men", "både"],
    correctIndex: 2,
    explain: "”Men” kontrasterar vad som angrips och vad som lämnas.",
  },
  {
    id: "mek-15",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren skriver i ett ____ register som passar vetenskaplig essäistik.",
    options: ["formellt", "talspråkligt", "barnsligt", "slangbetonat"],
    correctIndex: 0,
    explain: "Formellt register hör till sakprosa/essä.",
  },
  {
    id: "mek-16",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Ju mer data som tillkom, ____ tydligare blev mönstret.",
    options: ["så", "och", "men", "desto"],
    correctIndex: 3,
    explain: "Korrelationen ju … desto … är standard.",
  },
  {
    id: "mek-17",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Han var ____ till förslaget: varken entusiastisk eller avvisande.",
    options: ["entydig", "ambivalent", "aggressiv", "indifferent på ett skämtsamt sätt"],
    correctIndex: 1,
    explain: "Ambivalent = kluven.",
  },
  {
    id: "mek-18",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Analysen är skarp, ____ den ibland blir väl kategorisk.",
    options: ["därför att", "så att", "även om", "utan att"],
    correctIndex: 2,
    explain: "”Även om” inför en medgivande bisats.",
  },
  {
    id: "mek-19",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Projektet stoppades ____ bristande finansiering.",
    options: ["på grund av", "trots", "oaktat", "i stället för"],
    correctIndex: 0,
    explain: "”På grund av” anger orsak.",
  },
  {
    id: "mek-20",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Skillnaden mellan grupperna är liten, ____ statistiskt signifikant.",
    options: ["alltså", "nämligen", "respektive", "dock"],
    correctIndex: 3,
    explain: "”Dock” = kontrast: liten men ändå signifikant.",
  },
  {
    id: "mek-21",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ mer tid som lades på granskningen, ____ färre fel återstod i manuskriptet.",
    options: ["Ju / desto", "Så / att", "Varken / eller", "Dels / dels"],
    correctIndex: 0,
    explain: "Fast korrelat: ju … desto …",
  },
  {
    id: "mek-22",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Kommittén var ____ beredd att kompromissa ____ villig att överge kärnfrågan.",
    options: ["både / och", "varken / eller", "dels / dels", "såväl / som"],
    correctIndex: 1,
    explain: "”Varken … eller” negerar båda leden.",
  },
  {
    id: "mek-23",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Utredningen var ____ försenad ____ underfinansierad, vilket förklarar det tunna underlaget.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "inte / utan"],
    correctIndex: 2,
    explain: "”Dels … dels” räknar upp två parallella omständigheter.",
  },
  {
    id: "mek-24",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Metoden är ____ tidskrävande ____ robust nog för att användas i uppföljande studier.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "både / och"],
    correctIndex: 3,
    explain: "”Både … och” förenar två positiva egenskaper.",
  },
  {
    id: "mek-25",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Förslaget vann gehör ____ bland forskarna ____ bland praktikerna i fältet.",
    options: ["såväl / som", "varken / eller", "antingen / eller", "ju / desto"],
    correctIndex: 0,
    explain: "”Såväl … som” markerar att båda grupperna avses.",
  },
  {
    id: "mek-26",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Reformen var ____ en ekonomisk fråga ____ en fråga om tillit till institutionerna.",
    options: ["varken / eller", "inte bara / utan också", "dels / dels", "antingen / eller"],
    correctIndex: 1,
    explain: "”Inte bara … utan också” utvidgar påståendet.",
  },
  {
    id: "mek-27",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Kommunen måste ____ höja avgiften ____ skära i verksamheten; en tredje väg finns inte i budgeten.",
    options: ["både / och", "varken / eller", "antingen / eller", "såväl / som"],
    correctIndex: 2,
    explain: "”Antingen … eller” uttrycker ett tvingande val mellan två alternativ.",
  },
  {
    id: "mek-28",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Urvalet var ____ litet ____ resultaten måste tolkas med stor försiktighet.",
    options: ["ju / desto", "varken / eller", "dels / dels", "så / att"],
    correctIndex: 3,
    explain: "”Så … att” anger följd: storleken gör att försiktighet krävs.",
  },
  {
    id: "mek-29",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Rapporten ger ____ en entydig rekommendation ____ en klar tidsplan för genomförandet.",
    options: ["varken / eller", "både / och", "såväl / som", "dels / dels"],
    correctIndex: 0,
    explain: "Negationen av båda leden kräver ”varken … eller”.",
  },
  {
    id: "mek-30",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ tätare mätningarna gjordes, ____ tydligare framträdde säsongsvariationen.",
    options: ["Så / att", "Ju / desto", "Om / så", "Dels / dels"],
    correctIndex: 1,
    explain: "Åter ”ju … desto” med två luckor.",
  },
  {
    id: "mek-31",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Beslutet fattades ____ den nya förordningen och kan därför inte överklagas på den grunden.",
    options: ["i strid med", "oaktat", "i enlighet med", "till skillnad från"],
    correctIndex: 2,
    explain: "”I enlighet med” = enligt, i överensstämmelse med.",
  },
  {
    id: "mek-32",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Studien säger lite om kausalitet; den är mer informativ ____ sambandens styrka än deras riktning.",
    options: ["trots", "genom", "inför", "med avseende på"],
    correctIndex: 3,
    explain: "”Med avseende på” = beträffande.",
  },
  {
    id: "mek-33",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Flera linjer ställdes in ____ den ihållande stormen.",
    options: ["till följd av", "i stället för", "oaktat", "till förmån för"],
    correctIndex: 0,
    explain: "”Till följd av” anger orsak.",
  },
  {
    id: "mek-34",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kostnaden är låg ____ den samhällsnytta som investeringen förväntas ge.",
    options: ["på grund av", "i förhållande till", "till följd av", "i enlighet med"],
    correctIndex: 1,
    explain: "”I förhållande till” jämför kostnad och nytta.",
  },
  {
    id: "mek-35",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Snabbare handläggning uppnåddes ____ rättssäkerheten, vilket kritiserades i remissvaren.",
    options: ["till förmån för", "i enlighet med", "på bekostnad av", "med undantag av"],
    correctIndex: 2,
    explain: "”På bekostnad av” = något vinns genom att något annat förloras.",
  },
  {
    id: "mek-36",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ tidigare prognoser visade utfallet en tydlig nedgång redan under första kvartalet.",
    options: ["I enlighet med", "Till följd av", "Med avseende på", "I motsats till"],
    correctIndex: 3,
    explain: "”I motsats till” kontrasterar mot de tidigare prognoserna.",
  },
  {
    id: "mek-37",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Alla regioner, ____ tre glesbygdskommuner, nådde målet inom utsatt tid.",
    options: ["med undantag av", "till följd av", "i stället för", "på grund av"],
    correctIndex: 0,
    explain: "”Med undantag av” avgränsar tre kommuner från resten.",
  },
  {
    id: "mek-38",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Planeringen måste ____ de boendes synpunkter, inte bara de tekniska kalkylerna.",
    options: ["bortse från", "ta hänsyn till", "ge avkall på", "ställa in"],
    correctIndex: 1,
    explain: "Kollokationen är ”ta hänsyn till”.",
  },
  {
    id: "mek-39",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Utifrån de samstämmiga mätningarna kunde forskarna ____ att effekten var reell.",
    options: ["ställa krav", "ge uttryck", "dra slutsatsen", "fatta intresse"],
    correctIndex: 2,
    explain: "Kollokationen är ”dra slutsatsen (att)”.",
  },
  {
    id: "mek-40",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Författaren ____ sin oro för att debatten förenklas redan i förordet.",
    options: ["ställer krav på", "tar hänsyn till", "drar slutsatsen av", "ger uttryck för"],
    correctIndex: 3,
    explain: "Kollokationen är ”ge uttryck för”.",
  },
  {
    id: "mek-41",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Styrelsen ____ att skjuta upp investeringen till nästa budgetår.",
    options: ["fattade beslutet", "drog slutsatsen av", "tog hänsyn", "gav uttryck"],
    correctIndex: 0,
    explain: "Kollokationen är ”fatta beslut (om/att)”.",
  },
  {
    id: "mek-42",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tillsynsmyndigheten ____ strängare redovisning av bieffekter.",
    options: ["tog hänsyn", "ställde krav på", "fattade intresse för", "gav avkall"],
    correctIndex: 1,
    explain: "Kollokationen är ”ställa krav på”.",
  },
  {
    id: "mek-43",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Osäkerheten i skattningarna är ____ beroende av urvalets storlek.",
    options: ["i synnerhet", "i stället", "i hög grad", "i enlighet"],
    correctIndex: 2,
    explain: "”I hög grad” = i stor utsträckning.",
  },
  {
    id: "mek-44",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kritiken riktades ____ mot den bristande transparensen i urvalet.",
    options: ["respektive", "följaktligen", "oaktat", "främst"],
    correctIndex: 3,
    explain: "”Främst” precisering: kritiken gällde särskilt transparensen.",
  },
  {
    id: "mek-45",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I en vetenskaplig artikel ____ man normalt redovisa osäkerhet och avgränsningar.",
    options: ["förväntas", "köttar", "snackar om att", "kör med att"],
    correctIndex: 0,
    explain: "Formellt register: ”förväntas”, inte talspråk.",
  },
  {
    id: "mek-46",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Metoden är väldokumenterad. ____ har den prövats i tre oberoende kohorter.",
    options: ["Däremot", "Dessutom", "Trots det", "Emellertid"],
    correctIndex: 1,
    explain: "”Dessutom” lägger till ett stödjande skäl, inte en kontrast.",
  },
  {
    id: "mek-47",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Exporten ökade något. ____ sjönk hemmamarknaden mer än väntat.",
    options: ["Således", "Följaktligen", "Däremot", "Nämligen"],
    correctIndex: 2,
    explain: "”Däremot” ställer två utvecklingar mot varandra.",
  },
  {
    id: "mek-48",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Tre faktorer tycks samverka, ____ finansiering, tidsram och lokal förankring.",
    options: ["emellertid", "oaktat", "däremot", "nämligen"],
    correctIndex: 3,
    explain: "”Nämligen” specificerar vilka faktorer som avses.",
  },
  {
    id: "mek-49",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Påståendet bör prövas empiriskt, ____ det strider mot tidigare rön.",
    options: ["ty", "således", "exempelvis", "respektive"],
    correctIndex: 0,
    explain: "Formellt ”ty” = eftersom; anger skäl.",
  },
  {
    id: "mek-50",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Förslaget gick igenom, ____ flera ledamöter reserverade sig mot beräkningsgrunden.",
    options: ["därför att", "fastän", "så att", "för att"],
    correctIndex: 1,
    explain: "”Fastän” inför ett medgivande som inte upphäver huvudsatsen.",
  },
  {
    id: "mek-51",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Avtalet förlängs automatiskt, ____ någon av parterna säger upp det i tid.",
    options: ["eftersom", "därför att", "såvida inte", "så att"],
    correctIndex: 2,
    explain: "”Såvida inte” = om inte; villkorlig undantagsbisats.",
  },
  {
    id: "mek-52",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Modellen kan generaliseras, ____ samma mätfel inte återkommer i nya stickprov.",
    options: ["trots att", "oaktat att", "även om", "förutsatt att"],
    correctIndex: 3,
    explain: "”Förutsatt att” sätter ett villkor för generaliseringen.",
  },
  {
    id: "mek-53",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Huvudresultatet står sig. ____ kan nämnas att svarsfrekvensen var ovanligt hög.",
    options: ["För övrigt", "Följaktligen", "Däremot", "Emellertid"],
    correctIndex: 0,
    explain: "”För övrigt” tillför en sidoupplysning, inte en kontrast eller slutsats.",
  },
  {
    id: "mek-54",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kostnaderna skenade; ____ saknades en realistisk riskbuffert från början.",
    options: ["i synnerhet", "med andra ord", "oaktat", "respektive"],
    correctIndex: 1,
    explain: "”Med andra ord” omformulerar samma poäng.",
  },
  {
    id: "mek-55",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Problemet är ____ bristen på data ____ bristen på en gemensam definition.",
    options: ["både / och", "såväl / som", "inte / utan", "varken / eller"],
    correctIndex: 2,
    explain: "”Inte … utan” korrigerar: det är det senare som är problemet.",
  },
  {
    id: "mek-56",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ mer komplext regelverket blev, ____ färre små aktörer klarade efterlevnaden.",
    options: ["Så / att", "Varken / eller", "Dels / dels", "Ju / desto"],
    correctIndex: 3,
    explain: "”Ju … desto” med omvänd följd: mer komplexitet, färre som klarar kraven.",
  },
  {
    id: "mek-57",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Strategin vilar ____ på styrmedel ____ på frivilliga överenskommelser med branschen.",
    options: ["dels / dels", "varken / eller", "antingen / eller", "ju / desto"],
    correctIndex: 0,
    explain: "”Dels … dels” räknar upp två kompletterande ben.",
  },
  {
    id: "mek-58",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Utvärderingen belyser ____ genomförandet ____ de långsiktiga effekterna.",
    options: ["varken / eller", "både / och", "antingen / eller", "så / att"],
    correctIndex: 1,
    explain: "”Både … och” täcker två aspekter samtidigt.",
  },
  {
    id: "mek-59",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Gruppen ____ att vänta med publicering efter att ha vägt osäkerheterna.",
    options: ["ställde krav", "tog hänsyn", "kom fram till", "gav uttryck"],
    correctIndex: 2,
    explain: "Kollokationen är ”komma fram till” = nå slutsatsen.",
  },
  {
    id: "mek-60",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Forskarna ____ en reviderad hypotes redan i nästa artikel.",
    options: ["ställde in", "tog avstånd", "fäste avseende", "lade fram"],
    correctIndex: 3,
    explain: "Kollokationen är ”lägga fram” en hypotes/ett förslag.",
  },
  {
    id: "mek-61",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Samma mönster syntes i storstäderna; ____ rapporterades det från flera regioncentra.",
    options: ["likaledes", "däremot", "emellertid", "oaktat"],
    correctIndex: 0,
    explain: "”Likaledes” = på samma sätt; addition, inte kontrast.",
  },
  {
    id: "mek-62",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Underlaget är ofullständigt; ____ talar de samstämmiga indikationerna för att trenden är reell.",
    options: ["följaktligen", "icke desto mindre", "nämligen", "exempelvis"],
    correctIndex: 1,
    explain: "”Icke desto mindre” = likväl, trots det föregående.",
  },
  {
    id: "mek-63",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Mätfelen var systematiska. ____ måste tidigare skattningar räknas om.",
    options: ["Trots det", "Däremot", "Följaktligen", "Oaktat detta"],
    correctIndex: 2,
    explain: "Systematiska fel → omräkning: orsak och följd.",
  },
  {
    id: "mek-64",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Kunskapen spreds ____ seminarier och öppna arbetsmaterial snarare än via pressmeddelanden.",
    options: ["oaktat", "trots", "inför", "genom"],
    correctIndex: 3,
    explain: "”Genom” anger medel/kanal.",
  },
  {
    id: "mek-65",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ förhandlingarna skärptes tonen, men parterna lämnade inte bordet.",
    options: ["Under", "Oaktat", "Till följd", "I enlighet"],
    correctIndex: 0,
    explain: "”Under” anger tidsrymd: medan förhandlingarna pågick.",
  },
  {
    id: "mek-66",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I sakprosa ____ man gärna osäkerhet i stället för att överdriva säkerheten i fynden.",
    options: ["kör över", "redovisar", "slänger ur sig", "tjatar om"],
    correctIndex: 1,
    explain: "Formellt verb: redovisa osäkerhet.",
  },
  {
    id: "mek-67",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Den ena skolan betonar struktur, ____ den andra lägger vikten vid aktörers handlingsutrymme.",
    options: ["respektive", "således", "medan", "dessutom"],
    correctIndex: 2,
    explain: "”Medan” kontrasterar två skolor; ”respektive” passar inte som konjunktion här.",
  },
  {
    id: "mek-68",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Premisserna är desamma i båda modellerna; skillnaden ligger ____ i hur osäkerhet hanteras.",
    options: ["oaktat", "emellertid", "nämligen", "alltså"],
    correctIndex: 3,
    explain: "”Alltså” preciserar var skillnaden ligger, som slutsats av det föregående.",
  },
  {
    id: "mek-69",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Definitionen var ____ vag ____ jämförbarhet mellan studierna blev i praktiken omöjlig.",
    options: ["så / att", "ju / desto", "varken / eller", "dels / dels"],
    correctIndex: 0,
    explain: "”Så … att” anger följd av vagheten.",
  },
  {
    id: "mek-70",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "____ samma urvalskriterier används, ____ kan tidsserierna läggas samman.",
    options: ["Så / att", "Om / så", "Ju / desto", "Varken / eller"],
    correctIndex: 1,
    explain: "Villkor: om kriterierna är desamma, så kan serierna slås ihop.",
  },
  {
    id: "mek-71",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ de nya rönen ter sig den tidigare rekommendationen alltför kategorisk.",
    options: ["Oaktat", "Till följd av", "I ljuset av", "På bekostnad av"],
    correctIndex: 2,
    explain: "”I ljuset av” = med de nya rönen som bakgrund.",
  },
  {
    id: "mek-72",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den senaste lågkonjunkturen framstår sparandet som mer begripligt.",
    options: ["I stället för", "Till förmån för", "Med undantag av", "Mot bakgrund av"],
    correctIndex: 3,
    explain: "”Mot bakgrund av” ger kontext som gör beteendet begripligt.",
  },
  {
    id: "mek-73",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Modellen predicerade en uppgång. ____ sjönk indikatorerna tre månader i följd.",
    options: ["Emellertid", "Således", "Följaktligen", "Nämligen"],
    correctIndex: 0,
    explain: "”Emellertid” kontrasterar prediktion och utfall.",
  },
  {
    id: "mek-74",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den politiska osäkerheten tecknades det långsiktiga avtalet.",
    options: ["Tack vare", "Oaktat", "På grund av", "Till följd av"],
    correctIndex: 1,
    explain: "Avtalet tecknades trots osäkerheten.",
  },
  {
    id: "mek-75",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Texten är ____ polemisk ____ slarvig; den är saklig men onödigt lång.",
    options: ["både / och", "dels / dels", "varken / eller", "antingen / eller"],
    correctIndex: 2,
    explain: "Båda negativa etiketterna avvisas: varken polemisk eller slarvig.",
  },
  {
    id: "mek-76",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Åtgärden berör ____ hushållen ____ de mindre företagen i innerstaden.",
    options: ["varken / eller", "antingen / eller", "ju / desto", "såväl / som"],
    correctIndex: 3,
    explain: "”Såväl … som” inkluderar båda grupperna.",
  },
  {
    id: "mek-77",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "____ den stundande omorganisationen växte oron bland de tillsvidareanställda.",
    options: ["Inför", "Oaktat", "Genom", "Enligt"],
    correctIndex: 0,
    explain: "”Inför” = med tanke på något som nalkas.",
  },
  {
    id: "mek-78",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "I utredningens sammanfattning ____ man sig från att spekulera om enskilda aktörers motiv.",
    options: ["backar", "avhåller", "köttar", "svävar"],
    correctIndex: 1,
    explain: "Formellt: ”avhålla sig från”. Talspråkliga alternativ passar inte.",
  },
  {
    id: "mek-79",
    kind: "mek",
    prompt: MEK_PROMPT,
    passage:
      "Premisserna preciserades. ____ blev det möjligt att jämföra de två modellerna på lika villkor.",
    options: ["Trots det", "Däremot", "Därmed", "Oaktat detta"],
    correctIndex: 2,
    explain: "”Därmed” = därigenom; följd av preciseringen.",
  },
  {
    id: "mek-80",
    kind: "mek",
    prompt: MEK_PROMPT_TWO,
    passage:
      "Förändringen var ____ teknisk ____ institutionell: nya rutiner krävde ny ansvarsfördelning.",
    options: ["varken / eller", "antingen / eller", "dels / dels", "inte bara / utan även"],
    correctIndex: 3,
    explain: "”Inte bara … utan även” utvidgar: mer än bara teknisk.",
  },
];

# HP Lift

Ett studieverktyg för den som läser inför Högskoleprovet (HP): användaren matar in sin nivå, får en prioriterad veckoplan och övar mot den.

## Language

**Högskoleprovet (HP)**:
Det officiella provet från UHR som består av åtta delprov fördelade på två block.
_Avoid_: Högskoleprov som pluralform för enskilda provtillfällen (använd Prov)

**Delprov**:
Ett av provets åtta delmoment: KVA, DTK, XYZ, NOG, ORD, LÄS, MEK, ELF.
_Avoid_: Sektion, section, subtest

**Block**:
Den grupp av delprov som utgör ett provpass: verbalt (ORD, LÄS, MEK, ELF) eller kvantitativt (KVA, DTK, XYZ, NOG).
_Avoid_: Del, kategori

**Provpass**:
Ett pass på 40 frågor ur ett block, tidtaget till 55 minuter (80 med förlängd provtid). Rättningen visas först efteråt.
_Avoid_: Mini-prov, test

**Prov**:
Ett helt officiellt gammalt Högskoleprov från UHR, tillgängligt som PDF.
_Avoid_: Gammalt HP, tentamen

**Nivåtest**:
Ett kort, otidsatt test med frågor från alla delprov som uppskattar användarens nivå per delprov när riktiga HP-resultat saknas.
_Avoid_: Diagnostiskt test, placeringstest

**Resultatformulär**:
Formuläret där användaren själv matar in sina HP-resultat (normpoäng per block, råpoäng per delprov) som indata till planen.
_Avoid_: Poängformulär

**Veckoplan**:
Den genererade studieplanen med övningar per delprov, byggd på nivå, timmar per vecka och provdatumet. Veckorna följer kalendern fram till provet, högst 16 veckor. Varje veckas uppgifter fördelas på elevens pluggdagar. Missade pass flyttas till nästa pluggdag; får de inte plats krymper veckan (pass med lägst prioritet tas bort) i stället för att staplas. På söndagen visas en veckoavstämning. Kräver konto; en gäst ser vecka 1 som förhandsvisning.
_Avoid_: Schema, studieplan (som synonym för veckoplanen)

## Resultat och nivå

**Råpoäng**:
Antal rätta svar i ett delprov.
_Avoid_: Poäng (utan precisering), score

**Normpoäng**:
Provets normerade poäng för ett block, i appen kvantitativ eller verbal norm. Anges för block, inte för delprov.
_Avoid_: Normerad poäng, HP-poäng

**Nivå**:
Användarens utgångsläge som veckoplanen bygger på: normpoäng per block och råpoäng per delprov, inmatade i resultatformuläret eller uppskattade av nivåtestet. Har inget med spelnivå att göra.
_Avoid_: Level, färdighetsnivå

## Övning

**Repetitionskort (SRS)**:
Ett kort som skapas av en felbesvarad fråga och återkommer vid daglig repetition tills användaren minns det.
_Avoid_: Flashcard (flashcards är ett separat material), glosa

## Frågebank

**Frågebank**:
Samlingen av alla flervalsfrågor appen använder. Databasen är sanningen; den inbyggda kopian i koden är bara en reserv utan nätverk.
_Avoid_: Frågedatabas, content

**Provfråga**:
En fråga ur ett officiellt Prov från UHR, med uppgift om prov, provpass och frågenummer (id `hp-<datum>-p<n>-q<m>`). De kvantitativa (XYZ, KVA, NOG, DTK) får publiceras sedan 2026-11-11, med UHR:s tillstånd, egen förklaring och källa, och väljs före Övningsfrågorna. De verbala är upphovsrättsskyddade utan tillstånd och används bara som Förlaga.
_Avoid_: Importerad fråga, riktig fråga

**Övningsfråga**:
En egenskriven fråga i HP-stil som inte kommer från ett officiellt prov. Huvudkällan i frågebanken.
_Avoid_: Egen fråga, syntetisk fråga

**Förlaga**:
En verbal Provfråga som används som mall för att skriva en Övningsfråga. Mönstret återanvänds, inte innehållet: den nya frågan har egna siffror, ord och texter, och förlagan visas aldrig för användare.
_Avoid_: Mall, original

**Andra kontrollen**:
En oberoende kontroll av en ny Övningsfråga: en annan AI än den som skrev frågan löser den utan facit och granskar sedan förklaringen. Resultatet är ense eller oense, och en oense fråga granskas en och en innan den kan publiceras.
_Avoid_: Verifiering, dubbelkoll

**Stickprov**:
Teamets manuella läsning av ett urval nya Övningsfrågor innan de publiceras.
_Avoid_: Granskning (som om varje fråga lästes)

**Felrapport**:
En användares anmälan, med motivering, att en publicerad fråga är fel. När tre olika användare har öppna felrapporter på samma fråga dras den tillbaka till utkast; rapporterna stängs när frågan publiceras igen.
_Avoid_: Flagga (det ordet används för importskriptets egna varningar), anmälan

**Bemästrad**:
En fråga är bemästrad när användaren svarat rätt på den tre gånger i rad. Ett enda rätt svar räcker inte, eftersom ett av fyra eller fem alternativ kan gissas. Ett fel svar nollställer serien.
_Avoid_: Klarad, inlärd, masterad

## Duell

**Duell**:
En match med 10 frågor ur spelpoolen (två var ur ORD, MEK, XYZ, KVA och NOG) mot en annan spelare eller en bot, i läget ranked, casual eller privat. Tiden per fråga följer delprovet.
_Avoid_: Quiz, match (som huvudterm)

**ELO**:
Spelarens rankingtal i duell, med startvärde 1200, som endast servern uppdaterar efter ranked-matcher.
_Avoid_: Rank, rating

**Alla mot alla**:
Gruppspel där 2–30 spelare får samma fråga samtidigt och tävlar om poäng per spel, i privat rum eller slumpad lobby. Påverkar inte ELO (`docs/alla-mot-alla/spec.md`).
_Avoid_: Kahoot, gruppduell, quizkamp

**Spelpool**:
Den stängda delen av frågebanken som tävlingslägena (duell och Alla mot alla) använder för ORD och MEK. Ingen klient kan läsa den, den finns inte i offlinekopian, och facit skickas först när frågan har stängt. Spelens XYZ, KVA och NOG är i stället de publicerade UHR-frågorna (sedan 2026-11-12). Skiljs från övningsfrågorna, som är publika med facit.
_Avoid_: Duellpool (som om bara duellen använde den), hemliga frågor

**Profilbild**:
En bild som en inloggad användare laddar upp. Den syns för andra först när den automatiska kontrollen (Claude) eller teamet har godkänt den, och döljs efter tre rapporter från olika användare tills teamet har granskat den.
_Avoid_: Avatar (i text för användare)

## Spelmoment

**XP**:
Poäng som användaren tjänar för studieaktivitet och som avgör spelnivå. XP är personlig och rankas inte.
_Avoid_: Erfarenhetspoäng

**Spelnivå**:
Steg 1–20 i belöningssystemet, bestämt av total XP (från "Nybörjare" till "Oövervinnelig"). Skiljs från nivå.
_Avoid_: Nivå (ensamt), level

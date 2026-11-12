# Avskrift av ett kvantitativt provpass (instruktion till AI:n)

Du skriver av ett av UHR:s kvantitativa provpass (40 uppgifter: XYZ 1–12, KVA 13–22, NOG 23–28, DTK 29–40)
till `content/uhr/<examId>-p<N>.json`, löser varje uppgift **utan facit**, skriver en förklaring och klipper ut
figurerna. Frågorna visas sedan i appen för studenter, så avskriften måste stämma exakt med provet.

## Underlag

- `content/uhr/.arbete/<examId>-p<N>/sida-NN.png` är sidorna (110 dpi). `underlag.json` i samma katalog listar
  vilka uppgifter som står på vilken sida (`pages[].questions`), liggande sidor (`pages[].landscape`),
  DTK-uppgifternas figursidor (`questions[].figurePages`; tom lista = leta i sidbilderna) och importens tolkade
  text (`importText`). Importens text är ofta trasig (bråk, exponenter, tabeller, ordningen på rader) och saknas
  ibland helt. Sidbilden gäller alltid.
- Förstora en del av en sida när något är svårläst:
  `npx tsx scripts/uhr/figur.ts --zoom <examId>-p<N> <sida> x0 y0 x1 y1 [--dpi 600] [--rotate 90]` (andelar 0–1
  av sidan) och titta på `content/uhr/.arbete/<examId>-p<N>/zoom.png`. Gör det för exponenter, index, små bråk och
  tal i diagram; `--dpi 600` för enstaka punkter och staplar, `--rotate 90` för liggande sidor.
- Poppler måste finnas på PATH: kör kommandona med `. ~/.cache/hp-uhr/env.sh && …` om `pdftoppm` saknas.
- **Öppna inte `content/uhr/facit.json`** och kör inte `scripts/uhr/kontroll.ts` förrän alla 40 uppgifter är
  lösta och sparade. Lösningen ska göras utan facit.

## Filformat

```json
{
  "examId": "hp-2019-10-20",
  "passNumber": 1,
  "questions": [
    {
      "number": 3,
      "kind": "xyz",
      "prompt": "En femhörning är inritad i ett koordinatsystem som figuren visar. Vilken area har femhörningen?",
      "options": ["5 areaenheter", "6 areaenheter", "8 areaenheter", "10 areaenheter"],
      "blindAnswer": 2,
      "explain": "…",
      "figure": { "pages": [3], "box": [0.17, 0.12, 0.52, 0.35] },
      "note": ""
    }
  ]
}
```

- `blindAnswer`: ditt svar, 0 = A, 1 = B …
- `figure`: `null` om uppgiften inte har någon figur. `box` = x0, y0, x1, y1 som andel av sidans bredd och höjd,
  tätt runt figuren med dess etiketter men **utan** frågetext och svarsalternativ (vita kanter tas bort
  automatiskt). DTK: `{ "pages": [16] }` utan box ger hela figursidan; ange flera sidor om uppgiftens underlag står
  på flera sidor. Ange bara box för DTK om sidan innehåller annat än underlaget. Behövs bara en del av någon av
  sidorna (t.ex. tabellen på figursidan och diagrammen bland uppgifterna på nästa sida), ange en box per sida i
  `boxes` i stället för `box`, med `null` för en hel DTK-sida: `{ "pages": [18, 19], "boxes": [null, [0.1, 0.5, 0.9, 0.8]] }`. Liggande sida
  (`landscape` i underlaget, texten går lodrätt): lägg till `"rotate": 90` (medurs; 270 om texten går uppifrån
  och ned) så att figuren blir rättvänd.
- `note`: tom sträng, eller en kort mening till granskaren om något i avskriften eller avläsningen är osäkert
  (t.ex. tal i ett diagram som ligger nära varandra, eller hur bildalternativ har skrivits). Den visas på /review.

## Avskrift

- Ordagrant som på provet, med svensk stavning, provets ordval och provets skiljetecken (även punkt i slutet av
  ett alternativ). Fetstil och kursiv försvinner (ren text). Ord som är avstavade vid radbrytning skrivs ihop
  ("angräns-ande" → "angränsande").
- Matematik i ren text med Unicode: exponenter `x²`, `3⁵`, `2⁻³`, `aⁿ`; rötter `√2`, `√(x + 1)`, `∛8`;
  bråk `3/4`, med parenteser när det behövs: `(x + 1)/(x − 1)`; gånger `·`; minus `−` (U+2212); `≤ ≥ ≠ ≈ π °`;
  decimalkomma `0,25`; tusental med mellanslag `40 000`. Index som `x₁`. Vinklar `∠ABC` om provet skriver så.
- Frågetexten (`prompt`) visas på en rad. Allt som behöver radbrytningar (ekvationssystem, villkor på egna rader,
  kvantiteter, påståenden) står i `passage`, med `\n` mellan raderna.
- **XYZ:** `prompt` = själva frågan. Inledande rader och villkor som står på egna rader i provet ("x och y är
  positiva tal.", "Medelvärdet av a och b är 6.") står i `passage`, liksom text som står bredvid en figur
  ("Koordinatsystemet kan användas för att lösa uppgiften."). 4 alternativ.
- **KVA:** `prompt` = `Jämför kvantitet I och kvantitet II.` `passage` = den gemensamma informationen (om den
  finns) och sedan `Kvantitet I: …` och `Kvantitet II: …` på egna rader. Alternativen exakt:
  `["I är större än II", "II är större än I", "I är lika med II", "Informationen är otillräcklig"]`.
- **NOG:** `prompt` = `Tillräcklig information för lösningen erhålls` `passage` = frågan och sedan
  `(1) …` och `(2) …` på egna rader. Alternativen exakt:
  `["i (1) men ej i (2)", "i (2) men ej i (1)", "i (1) tillsammans med (2)", "i (1) och (2) var för sig", "ej genom de båda påståendena"]`.
- **DTK:** `prompt` = uppgiften. Har alternativen kolumnrubriker (t.ex. "Till enskilda barn" / "Till grupper av
  barn"), skriv rubrikerna i `passage` ("Svarsalternativen anger: till enskilda barn – till grupper av barn") och
  alternativen som `50 procent – 50 procent`. 4 alternativ. Alla DTK-uppgifter har figur.
- XYZ, KVA och NOG med en ritad figur, graf, tabell eller tallinje får `figure` med box. En uppgift vars
  alternativ eller uttryck inte går att skriva läsbart i ren text (t.ex. stora bråk i flera nivåer) får också en
  figur som visar uttrycket; skriv ändå alternativen så läsbart det går.
- **Bildalternativ** (alternativen är grafer eller figurer märkta A–D): lägg figurerna med sina etiketter i
  `figure` och skriv alternativen som etiketten i figuren, t.ex. `"Graf A"`, `"Graf B"` eller `"Linje A"`.
  Etiketten följer med alternativet, så här får förklaringen nämna dem.
- Tabeller och listor i två kolumner i `passage`: en rad per rad i provet, kolumnerna åtskilda med ` – ` eller
  `: ` (t.ex. `God: 89 procent`).
- Specialtecken skrivs med närmaste Unicode-tecken (t.ex. romb `◊`, stjärna `∗`, `□`), och skriv i `note` vad
  tecknet är om det är ovanligt.

## Lösning och förklaring

- Lös uppgiften själv innan du skriver förklaringen. Räkna noga; kontrollera med en andra metod när det går.
- `explain` på svenska, ren text utan markdown, i samma ton som appens övningsfrågor: lösningen steg för steg,
  kort och konkret (oftast 3–8 meningar), med uträkningarna. Säg gärna varför ett vanligt felalternativ lockar.
  KVA: visa varför relationen alltid gäller, eller ge två exempel som ger olika svar när informationen är
  otillräcklig. NOG: pröva (1) för sig och (2) för sig och sedan tillsammans, gärna på egna rader.
  DTK: ange var i figuren värdena står och räkna.
- Skriv aldrig "facit", "UHR" eller "rätt svar enligt …" i förklaringen. Förklaringen ska leda fram till svaret.
- Nämn alternativ med deras innehåll, inte med bokstäverna A–D framför dem (alternativen kan visas i annan
  ordning). Undantag: bildalternativ, där etiketten är en del av alternativets text.

## Figurer

När alla figurer har box/sidor: `npx tsx scripts/uhr/figur.ts <examId>-p<N>`, och titta på varje bild i
`public/uhr/<examId>/`. Figuren ska vara hel (inga avhuggna etiketter) och utan frågetext och alternativ. Rätta
boxen och kör om tills den stämmer.

## När alla 40 är klara

1. Kör `npx tsx scripts/uhr/kontroll.ts <examId>-p<N>` (ange alltid provpasset: andra provpass skrivs av
   samtidigt). Rätta alla FEL.
2. För varje uppgift där ditt svar skiljer sig från facit: titta på uppgiften igen, med facit. Ändra **inte**
   `blindAnswer`. Ta reda på varför:
   - fel i avskriften (läs av med zoom) → rätta texten,
   - fel i din lösning → skriv om förklaringen så att den leder till facits svar,
   - facit verkar fel eller uppgiften är tvetydig → låt förklaringen vara och skriv det.
   Skriv vad du kom fram till i `verificationNote` (en eller två meningar, t.ex. "Avskriften rättad: exponenten
   är −2, inte 2. Förklaringen omskriven." eller "Första lösningen räknade med fel bas; omräknad, facit stämmer.").
3. Kör `npx tsx scripts/uhr/kontroll.ts --write <examId>-p<N>` så att `verification` sätts.
4. Rapportera: antal lika med facit före genomgången, vilka som skilde och varför, och osäkra avskrifter.

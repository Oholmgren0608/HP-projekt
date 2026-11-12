# UHR:s kvantitativa frågor i appen – plan

Status: **1 948 av 2 080 publicerade** (2026-11-12). Alla 52 kvantitativa provpass är avskrivna, lösta utan facit,
förklarade och inlagda i databasen. Oscar beslutade att de 1 948 där AI:n fick samma svar som facit och avskriften
saknar anteckning publiceras direkt (`npm run fragebank:upload -- --uhr --publicera`); de 132 med "Att kontrollera"
granskas på /review. Spelens XYZ, KVA och NOG är bara UHR-frågor (migration 0041). Tillståndet gäller den
kvantitativa delen och är noterat i `docs/juridik/uhr-tillstand-kvant.md`. Svar om den verbala delen väntas;
verbala Provfrågor är fortfarande spärrade.

## Bakgrund

Oscar har frågat UHR och fått tillåtelse att använda alla frågor i den kvantitativa delen (XYZ, KVA, NOG, DTK).
UHR:s frågor ska användas i första hand och appens egna AI-frågor bara som reserv.

`scripts/import-prov/manifest.json` har 26 prov (hösten 2012 till hösten 2024) med 52 kvantitativa provpass, alltså
2 080 frågor. Den automatiska tolkningen av PDF:erna räcker inte för att visa frågorna: bara 1 311 av 2 080 var utan
varningar (DTK bara 98 av 624). Bråk och exponenter blir trasiga ("1\n7"), alternativ saknas och figurutklippen är
ofta avhuggna. Importens utkast fanns inte heller i databasen. Varje provpass skrivs därför av från sidbilderna.

## Beslut (Oscar, 2026-11-11)

1. **Tillståndet:** sparas i `docs/juridik/` (gjort; kopian av UHR:s svar ska läggas till där).
2. **Förklaringar:** AI skriver förklaringar till varje UHR-fråga och granskar noggrant. Varje fråga ska ha en
   förklaring innan den visas, och teamet stickprovar på /review innan publicering.
3. **Var de används:** överallt i den kvantitativa delen, även duell och Alla mot alla. UHR-frågorna går före
   AI-frågorna, som bara används när det inte finns UHR-frågor att välja. Risken i spelen är accepterad: facit finns
   publikt hos UHR (ADR 0001 är uppdaterad).
4. **Offline:** UHR-frågorna kommer med i offlinekopian (`fallback-bank.json`).

## Kedjan (byggd)

Per provpass, med verktygen i `scripts/uhr/` (steg för steg i `scripts/uhr/README.md`):

1. `prepare.ts` renderar sidorna ur UHR:s PDF och skriver underlag (vilken uppgift som står på vilken sida, liggande
   sidor, DTK:s figursidor) och UHR:s facit till `content/uhr/facit.json`.
2. En AI skriver av de 40 uppgifterna från sidbilderna enligt `scripts/uhr/AVSKRIFT.md`, **löser dem utan facit**
   och skriver förklaringar. Resultatet: `content/uhr/<examId>-p<N>.json`.
3. `figur.ts` klipper ut figurerna ur PDF:en (200 dpi, WebP) till `public/uhr/<examId>/`. De serveras som statiska
   filer, så de syns för gäster och följer med appen. DTK-figurer är hela underlagssidan; liggande sidor vrids.
4. `kontroll.ts` kontrollerar formatet och jämför AI:ns svar med UHR:s facit. Där svaren skiljer sig går AI:n
   igenom uppgiften igen med facit: avskriftsfel rättas, förklaringen skrivs om mot facit, och vad som hände skrivs i
   `verificationNote`. Sådana frågor märks "AI:n fick ett annat svar än facit" på /review och granskas en och en.
5. `npm run fragebank:upload -- --uhr` lägger in frågorna som **utkast** med UHR:s facit, förklaring, figur och
   resultatet av jämförelsen. Publicerade och refuserade frågor rörs aldrig.
6. Teamet stickprovar på /review och publicerar. "Publicera N ense" tar bara frågor där AI:n fick samma svar som
   facit och som saknar varningar.
7. `npm run fragebank:export` skriver om offlinekopian när frågorna är publicerade.

Resultat: i alla 52 provpass fick AI:n samma svar som UHR:s facit på alla 2 080 uppgifter innan den såg facit
(ingen uppgift behövde gås igenom i efterhand). 850 uppgifter har figur (450 bildfiler, 33 MB i `public/uhr/`),
och 132 har en anteckning till granskaren om något i avskriften eller avläsningen ("Att kontrollera: …" på
/review), t.ex. diagramvärden som ligger nära varandra, bildalternativ och tryckfel i provet.

## Appen och databasen (byggt)

- Migration `0040_uhr_kvantfragor.sql`: villkoret `questions_provfraga_publicering` släpper igenom Provfrågor bara i
  XYZ, KVA, NOG och DTK, i övningspoolen och med riktig förklaring. Verbala Provfrågor går fortfarande inte att
  publicera. `pool_pick_questions` väljer UHR-frågor först i spelen. Test: `~/.cache/hp-db-test/test-0040.mjs`.
- `src/lib/uhr.ts`: vilka UHR-frågor som får visas, källan, och UHR-först i urvalet. Frågeladdaren släpper aldrig
  igenom verbala UHR-frågor, även om en sådan rad skulle dyka upp.
- `buildQuiz` (övning, provpass, snabbprov, nivåtest, veckoplanens pass) lägger UHR-frågorna först inom varje nivå,
  så att osedda frågor fortfarande går före sedda.
- Källan visas under varje UHR-fråga ("Källa: Högskoleprovet hösten 2019, provpass 1, uppgift 3 (UHR)").
- UHR-figurerna visas i full bredd och kan öppnas i full storlek.
- Felkort: kvantitativa UHR-frågor blir felkort i Dagens repetition; verbala UHR-id tas fortfarande bort.
- /review: kvantitativa UHR-frågor kan godkännas och publiceras i bulk; verbala är fortfarande förlagor.

## Kvar

- Applicera migration 0041 på databasen när ändringen har nått main (0040 är applicerad). Därefter är spelens
  kvantfrågor bara UHR-frågor, och de 120 egna XYZ-, KVA- och NOG-frågorna i spelpoolen flyttas till övningen; kör
  `fragebank:export` igen så att de kommer med i offlinekopian.
- Granska de 132 frågorna med "Att kontrollera" på /review (grupperna "UHR: Högskoleprovet …") och publicera dem en
  och en, sedan `fragebank:export`. Stickprova gärna även bland de 1 948 publicerade; en felaktig fråga dras tillbaka
  med "Markera som fel".
- Oscar: lägg in UHR:s skriftliga svar i `docs/juridik/uhr-tillstand-kvant.md` och stäm av källraden mot villkoren.
- När UHR svarar om de verbala frågorna: ny migration och ändring av AGENTS.md regel 1.

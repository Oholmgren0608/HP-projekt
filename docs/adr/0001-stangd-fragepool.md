# 0001 – Stängd frågepool för tävlingslägen

- Status: beslutad (Oscar, 2026-11-07), byggd (migration 0035–0037), ändrad 2026-11-11 och 2026-11-12 (UHR-frågor i spelen, se sist)
- Gäller: duellerna och Alla mot alla ([spec](../alla-mot-alla/spec.md))

## Bakgrund

Övningsfrågorna är publika med facit, med flit: övningen ska fungera utan konto och offline
(AGENTS.md regel 5). Policyn `questions_select_published` (migration 0017) låter alla läsa publicerade frågor,
och offlinekopian `src/lib/content/fallback-bank.json` ligger i appens bundle.

Duellerna använder samma frågor. Servern rättar mot `duel_questions`, som klienter inte kan läsa, men svaret
kan ändå slås upp i den publika banken. Dessutom:

- klienten väljer själv vilka fråge-id den svarar på, och servern kontrollerar inte att de hör till matchen,
- klienten rapporterar själv sin svarstid (`duel_submit_answer(p_time_ms)`),
- i botmatcher rapporterar klienten själv hur många rätt boten fick (`duel_finish_bot(p_bot_correct)`), och
  botens svar simuleras i webbläsaren med facit (`src/lib/duel/bot.ts`).

Därmed kan duellvinster och ELO fejkas (`docs/KNOWN_ISSUES.md`, "Duel answers reach the browser"). Alla mot alla
skulle ärva samma hål.

## Beslut

Tävlingslägena får en egen **stängd frågepool** som aldrig når klienten med facit:

1. Varje fråga hör till en pool: **övning** (som i dag, publik) eller **spel** (stängd).
2. Spelpoolens frågor kan inte läsas av någon klient, varken anon eller authenticated, och finns inte i
   offlinekopian.
3. Servern väljer frågorna till varje match eller spel, skickar en fråga i taget **utan** facit och
   skickar rätt svar och förklaring först när frågan har stängt för spelaren.
4. Servern mäter svarstiden och kontrollerar tidsgränsen per delprov.
5. Botarnas svar räknas ut på servern.
6. Poolens frågor blir inte felkort i Dagens repetition.

Poolen fylls på två sätt:

- **Nu:** 40 slumpade publicerade frågor per delprov (ORD, MEK, XYZ, KVA, NOG; 200 totalt) flyttas från
  övningen till spelpoolen. Frågor med öppna felrapporter tas inte med.
- **Löpande:** nya frågor går genom samma kvalitetskedja (automatiska kontroller, andra kontrollen, utkast,
  stickprov). På /review väljer granskaren om en fråga publiceras till övningen eller till poolen. Mål: 80 per
  delprov.

## Konsekvenser

- Övningsbanken krymper från cirka 1 600 till cirka 1 400 frågor.
- Facit visas efter varje fråga, så en spelare kan memorera eller dela svar över tid. Poolen läcker därför
  långsamt; det motverkas med påfyllning och med att servern undviker frågor som spelarna fått de senaste
  30 dagarna. Det är accepterat eftersom ingen ranking hänger på Alla mot alla, och duellernas ELO skyddas
  mycket bättre än i dag.
- DTK tas bort ur duellerna (för långa uppgifter för ett tidsatt spel), så poolen behöver inga DTK-frågor.
- Användare som redan har felkort på frågor som flyttas till poolen ser inte de korten längre (appen döljer
  redan kort för frågor som inte finns i den publicerade övningsbanken).
- AGENTS.md §6 ("Duel-pool questions never reach the client with correct_index") blir sant först när steg 1 är
  byggt.

## Förkastade alternativ

- **Behålla publika frågor och acceptera fusket.** Förkastat av Oscar: hålet täpps först.
- **Skriva en helt ny pool innan start.** För långsamt som enda väg; används som löpande påfyllning.
- **Gömma facit bara i duellvyn.** Hjälper inte, eftersom samma fråga med facit finns i den publika banken.

## Ändring 2026-11-11: UHR:s kvantitativa frågor först i spelen

Oscar har beslutat att UHR:s kvantitativa frågor ska användas i första hand överallt, även i duellerna och Alla mot
alla (`docs/uhr-fragor/plan.md`, tillstånd i `docs/juridik/uhr-tillstand-kvant.md`).

- `pool_pick_questions` (migration 0040) väljer bland spelpoolen **och** publicerade UHR-frågor i XYZ, KVA och NOG.
  Inom ett delprov går frågor som ingen av spelarna fått de senaste 30 dagarna först, och bland dem UHR-frågorna före
  AI-frågorna. Spelpoolen fyller på när UHR-frågorna inte räcker, och ORD och MEK kommer som förut bara ur spelpoolen.
- UHR-frågorna ligger i övningspoolen och är publika med facit, och UHR publicerar själva facit på studera.nu. En
  spelare kan alltså slå upp svaret. Det strider mot punkt 2 ovan men är accepterat av Oscar. Servern väljer, tidtar
  och rättar fortfarande varje svar, och skickar inget facit förrän frågan har stängt.
- UHR-frågor i spelen blir inte felkort från spelen (samma regel som för poolen), men de blir felkort när de besvaras
  fel i övningen.

## Ändring 2026-11-12: spelens kvantfrågor är bara UHR-frågor

Oscar: "alla kvant frågor i spelpoolen är UHR-frågor ... utöka till så mycket som möjligt". Samma dag publicerades
1 948 UHR-frågor (de 132 med anteckning granskas på /review).

- `pool_pick_questions` (migration 0041) väljer XYZ, KVA och NOG bara bland de publicerade UHR-frågorna, alla som
  finns (1 398 efter publiceringen, 1 456 när alla är publicerade). Appens egna frågor i de delproven väljs bara så
  länge ett delprov saknar publicerade UHR-frågor.
- Den stängda spelpoolen tar bara ORD och MEK (`CLOSED_POOL_KINDS` i `src/lib/pool-time.ts`; /review och
  `fragebank:upload -- --pool spel` följer). De 120 egna XYZ-, KVA- och NOG-frågorna som låg i poolen flyttas tillbaka
  till övningen. ORD och MEK utökas inte (Oscar, samma dag).


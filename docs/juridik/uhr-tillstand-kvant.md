# UHR:s tillstånd: kvantitativa provfrågor

Status: **tillstånd finns för den kvantitativa delen.** Svar om den verbala delen väntas.

## Vad som gäller

- **Vem och när:** Oscar Holmgren, 2026-11-11. Han har frågat Universitets- och högskolerådet (UHR) och fått
  tillstånd att använda alla deras frågor i den kvantitativa delen av högskoleprovet i appen. Hans ord i
  projektets chatt: "Vi har frågat UHR och har fått tillåtelse att använda alla deras frågor i den kvantitativa
  delen i vår webapp". Senare samma dag skrev han att de har fått fullt tillstånd för de kvantitativa frågorna och
  väntar på svar om de verbala.
- **Omfattning:** de kvantitativa delproven XYZ, KVA, NOG och DTK, i de 26 prov från hösten 2012 till hösten 2024
  som finns i `scripts/import-prov/manifest.json`. Figurerna (diagram, tabeller, kartor och geometriska figurer)
  ingår.
- **Användning:** frågorna visas i övningen, i provpassen och nivåtestet, i duellerna och i Alla mot alla, och de
  finns med i offlinekopian. Förklaringarna är våra egna, skrivna och kontrollerade av AI och stickprovade av
  teamet (`docs/uhr-fragor/plan.md`).
- **Källa:** varje UHR-fråga visar var den kommer ifrån, t.ex. "Källa: Högskoleprovet hösten 2019, provpass 1,
  uppgift 3 (UHR)" (`src/components/question-source.tsx`).
- **Gäller inte:** de verbala delproven ORD, LÄS, MEK och ELF. De är fortfarande spärrade i databasen (villkoret
  `questions_provfraga_publicering`, migration 0040) och används bara som förlagor (AGENTS.md regel 1).

## Att göra

- [ ] Oscar: lägg in en kopia av UHR:s skriftliga svar här (mejl eller avtal, med datum och avsändare) och notera
      eventuella villkor: krav på källhänvisning eller formulering, tidsgräns, och om tillståndet gäller även en
      framtida app i App Store/Google Play.
- [ ] Stäm av källraden ovan mot UHR:s villkor och ändra `uhrSource` i `src/lib/uhr.ts` om de kräver en annan
      formulering.
- [ ] När UHR svarar om de verbala frågorna: uppdatera den här filen, AGENTS.md regel 1 och villkoret i databasen
      (en ny migration).

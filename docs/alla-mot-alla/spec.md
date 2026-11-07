# Alla mot alla – spec

Beslutad med Oscar 2026-11-07 (grill-session i projektchatten). Byggd samma dag i tre steg
(se [Ordning](#ordning)): migrationerna 0035–0038, `src/components/alla-mot-alla/`, `src/lib/alla-mot-alla/`.

## Vad det är

Ett gruppspel i stil med Kahoot, fast med HP-frågor: en duell med flera spelare samtidigt. Alla får samma
fråga på samma gång, svarar på sin egen skärm och ser en poängtavla mellan frågorna.

- Namn i appen: **Alla mot alla**. Ligger under Öva, bredvid Duell.
- Kräver konto och nätverk. Det är ett uttalat undantag från AGENTS.md regel 5 (appen fungerar utan konto).
- Påverkar inte ELO eller någon ranking. Kan läggas till senare.
- Ingen chatt och inga fritextnamn. Spelare visas med sitt befintliga användarnamn (`player_profiles`).

## Frågor

- Delprov: **ORD, MEK, XYZ, KVA, NOG**. LÄS, ELF och DTK tar för lång tid för ett gruppspel.
- Frågan visas med sina riktiga alternativ: ORD och NOG har fem (A–E), MEK, XYZ och KVA fyra (A–D).
- 10 frågor per spel.
- Frågorna kommer ur den **stängda frågepoolen** ([ADR 0001](../adr/0001-stangd-fragepool.md)). Facit skickas
  till klienterna först när frågan har stängt.
- Servern väljer i första hand frågor som ingen av spelarna har fått de senaste 30 dagarna.
- Privat rum: skaparen väljer ett eller flera av de fem delproven. Slumpad lobby: alla fem blandas.

## Tid per fråga

| Delprov | Tid |
|---|---|
| ORD | 20 s |
| MEK | 45 s |
| KVA | 75 s |
| XYZ | 90 s |
| NOG | 90 s |

- Frågan stängs när tiden är ute eller när alla har svarat.
- Privat rum: skaparen kan slå på **Längre tid** (×1,5) för hela rummet. Slumpad lobby har alltid standardtid.
- Samma tider gäller för duellerna från steg 1 (ersätter 40 s för alla frågor i migration 0024).

## Poäng

- Rätt svar: **600 poäng + tidsbonus upp till 400**. Bonusen minskar linjärt från 400 vid frågans start till 0
  vid frågans sluttid.
- Fel eller inget svar: 0.
- Lika poäng: kortast sammanlagd svarstid på de rätta svaren vinner.
- Svarstiden mäts på servern (från att frågan öppnades till att svaret kom in), aldrig av klienten.

## Mellan frågorna

Ungefär 6 sekunder med:

- rätt svar,
- hur många som valde varje alternativ,
- topp 5 på poängtavlan och den egna placeringen.

Förklaringarna visas i genomgången efter spelet, så att tempot hålls.

## Efter spelet

- Slutskärm med placering, poäng och genomgång av alla frågor med rätt svar och förklaring.
- Resultatet sparas på servern men visas inte i profilen i första versionen.
- XP som för en duell (deltagande och rätta svar). XP är personlig och rankas inte.
- Poolens frågor blir **inte** felkort i Dagens repetition, så att poolen inte läcker till webbläsarens lagring.
  I stället föreslås vanlig övning i det delprov där det gick sämst ("Öva mer på KVA").

## Privat rum

- Alla inloggade kan skapa ett rum och bjuda in med kod eller länk, som i duellens privata lobby.
- 2–30 spelare. Skaparen väljer delprov och Längre tid och trycker på Starta.
- Spelet fortsätter om skaparen lämnar.

## Slumpad lobby

- "Sök match" ställer spelaren i kö till en lobby med 4–8 spelare.
- När 4 spelare har anslutit startar en nedräkning på 30 sekunder där fler (upp till 8) kan ansluta.
- Har lobbyn färre än 4 efter 60 sekunders väntan fylls platserna upp till 4 med **botar**, tydligt märkta.
- Ingen nivåmatchning i första versionen.

## Botar

Botarnas svar räknas ut på servern när frågan stänger, aldrig i webbläsaren (där skulle boten behöva facit).
I Alla mot alla svarar en bot rätt på ungefär 60 % av frågorna, med varierande svarstid.

## Anslutning och inaktivitet

- Servern äger klockan: varje fråga har en starttid och en sluttid i databasen. Den första klient som märker
  att tiden är ute (eller att alla svarat) anropar servern, som själv kontrollerar villkoret och går vidare.
  Alla klienter får nästa fråga via Supabase Realtime. Ingen ny tjänst behövs.
- Den som tappar anslutningen står kvar på poängtavlan med 0 för missade frågor och kan återansluta under
  spelets gång.
- Inaktiva spelare får 0 och står kvar. Inga straff och ingen utkastning i första versionen.

## Duellerna (ändras i steg 1)

- Använder den stängda poolen och rättas helt på servern (val av frågor, tid och rätt svar).
- DTK tas bort ur duellerna. Delprov: ORD, MEK, XYZ, KVA, NOG.
- Tid per fråga enligt tabellen ovan.
- Botarna flyttar till servern. Träffsäkerheten anpassas efter ELO som i dag.

## Ordning

1. **Stängd frågepool och duellfix.** Poolen, rättning och tidmätning på servern, botar på servern, DTK bort
   ur duellerna. Stänger "Duel answers reach the browser" i `docs/KNOWN_ISSUES.md`.
   Plan: [steg-1-plan.md](steg-1-plan.md).
2. **Alla mot alla med privata rum.**
3. **Slumpad lobby med botar.**

Steg 2 och 3 får egna planer som godkänns innan de byggs.

## Utanför ramen just nu

- ELO, ranking eller topplista för Alla mot alla.
- Storskärmsläge (värdskärm + svarsknappar i mobilen).
- Resultathistorik i profilen.
- Nivåmatchning i den slumpade lobbyn.
- Längre tid i duellerna.

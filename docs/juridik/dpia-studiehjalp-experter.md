# Konsekvensbedömning (DPIA): Studiehjälp – verifiering av experter

> **Utkast 2026-11-01.**
> - Ta ställning till åtgärderna i avsnitt 7.
> - Signera i avsnitt 9.
>
> Bedömningen följer artikel 35 i dataskyddsförordningen (GDPR) och IMY:s vägledning. Den bygger på hur funktionen faktiskt är byggd: migration `0029`, `src/app/studiehjalp/actions.ts` och `docs/studiehjalp/fas-1-experter.md`. Låt gärna en jurist eller dataskyddskunnig granska den innan `experts_apply` slås på för alla.

| | |
|---|---|
| Personuppgiftsansvarig | Oscar Holmgren (privatperson, tills bolaget är bildat) |
| Ansvarig för bedömningen | Oscar Holmgren |
| Datum | 2026-11-01 |
| Version | 0.1 (utkast) |
| Ska omprövas | Före skarp start, vid BankID, betalning eller bokning (Fas 2), och minst en gång per år |

## 1. Behövs en DPIA?

Kriterierna nedan kommer från Europeiska dataskyddsstyrelsens (EDPB) riktlinjer, som IMY:s förteckning bygger på. En DPIA behövs normalt när två eller fler kriterier är uppfyllda.

| Kriterium | Uppfyllt? |
|---|---|
| Bedömning eller betygsättning av personer | **Ja.** Ansökan granskas och godkänns eller avslås, och resultatet blir märken som syns publikt. |
| Känsliga uppgifter eller uppgifter av mycket personlig karaktär | **Delvis.** ID-handlingar, som kan visa personnummer, och provresultat. Inga uppgifter enligt artikel 9. ID-bilden granskas manuellt och behandlas inte biometriskt. |
| Behandling i stor omfattning | **Nej** i piloten. Kan bli ja vid full lansering. |
| Sårbara personer | **Nej** för de sökande, som är 18 år eller äldre. Däremot kan elever som tar kontakt med experter vara unga. |
| Ny teknik | Nej |
| Hindrar någon att utöva en rättighet eller få en tjänst | **Delvis.** Ett avslag hindrar personen från att erbjuda tjänster via HP Lift. |

**Slutsats:** minst två kriterier är uppfyllda, så en DPIA görs.

Resten av appen bedöms inte kräva en DPIA: konto, övning, dueller och forum. Den behandlingen beskrivs i integritetspolicyn.

## 2. Beskrivning av behandlingen

**Syfte:** säkerställa att personer som visas som experter verkligen har minst 1,20 på högskoleprovet eller är legitimerade lärare. Eleverna ska kunna lita på märkena.

**Flöde:**
1. Den sökande, som måste vara inloggad, väljer väg (HP eller lärare) och fyller i namn, resultat eller ämnen, ett meddelande och ett intyg om att hen är minst 18 år.
2. Underlag laddas upp direkt till en privat lagringsplats via en engångslänk. Servern kontrollerar sedan storlek och filtyp, inklusive filens första byte. Högst 10 MB per fil och högst 8 filer per ansökan.
3. Den sökande lämnar samtycke och skickar in. Ansökan kan inte skickas in med ett uppgivet resultat under 1,20.
4. En granskare med rollen `verify_expert` öppnar ansökan. Alla visningar loggas.
   - För att se dokument krävs också rollen `view_sensitive_document`.
   - Dokumenten öppnas via en signerad länk som gäller i 5 minuter, och varje öppning loggas.
5. Granskaren fattar beslut med motivering.
   - För godkännande krävs att granskaren själv har öppnat ID-handlingen och det dokument som vägen kräver.
   - Ingen kan granska sin egen ansökan.
6. Märken räknas fram ur beslutet: "HP-resultat granskat", "Verifierat HP-resultat", "Legitimerad lärare" och "ID-handling granskad". Inget märke påstår kontroll med BankID eller hos en myndighet om en sådan kontroll inte har gjorts.
7. Gallring:
   - Underlagen raderas senast 90 dagar efter uppladdning och senast 30 dagar efter beslut, av ett dagligt schemalagt jobb.
   - Om ansökan dras tillbaka raderas underlagen direkt.
   - Om kontot raderas tas filerna bort först.
8. Den godkända experten kan publicera en profil, som visas med ett eget publikt id och aldrig med konto-id:t.

**Kategorier av registrerade:** sökande experter, som är 18 år eller äldre, och granskare.

**Personuppgifter:**

| Uppgift | Var | Lagringstid i dag |
|---|---|---|
| Namn enligt handlingar, uppgivet resultat och provtillfälle, lärarämnen, meddelande, åldersintyg, tidpunkt för samtycke | `expert_applications` | Avslagna och tillbakadragna: 12 månader efter beslutet. Utkast och kompletteringar: 6 månader utan ändring. Godkända och spärrade: så länge kontot finns (`0031`) |
| Underlag: resultatbesked, legitimation eller registerutdrag, ID-handling | Privat bucket `expert-documents` och metadata i `expert_documents` | Högst 90 dagar, högst 30 dagar efter beslut, direkt vid tillbakadragande |
| Beslut, kontrolltyp, verifierat resultat eller behörighet, källa, motivering, granskare | `expert_verification_reviews` | Som ansökan de hör till |
| Vem som öppnade vad och när | `admin_audit_log` | 24 månader (`0031`) |
| Publik profil och märken | `expert_profiles` | Tills experten avpublicerar eller tar bort kontot |

Personnummer sparas aldrig i databasen, men kan synas i en uppladdad ID-handling.

**Mottagare:**
- Granskare med roll.
- Supabase (databas, lagring och e-post), som personuppgiftsbiträde. Data lagras i EU (Irland).
- Vercel (serverfunktioner), som personuppgiftsbiträde.
- Publik profil: alla besökare.

**Rättslig grund:**
- Samtycke (artikel 6.1 a) för ansökan och underlag. Det lämnas aktivt och kan återkallas genom att ansökan dras tillbaka.
- Berättigat intresse (artikel 6.1 f) för att spara beslut och logg efter beslutet, så att HP Lift kan visa varför ett märke gavs.
- Personnummer i en ID-handling får behandlas med samtycke (3 kap. 10 § i dataskyddslagen, 2018:218).

## 3. Nödvändighet och proportionalitet

| Fråga | Bedömning |
|---|---|
| Behövs uppgifterna för syftet? | Ja. Utan underlag går det inte att kontrollera ett resultat eller en legitimation. Utan ID-kontroll kan någon ladda upp en annan persons resultatbesked. |
| Finns mindre ingripande alternativ? | BankID och en direkt kontroll mot UHR eller Skolverket vore bättre för integriteten, eftersom inga dokument då behöver sparas. Det är planerat men inte möjligt i piloten (beslut 5). Under tiden används manuell kontroll med kort lagringstid. |
| Minimering | Personnummer sparas inte. Bara namn, resultat eller behörighet och beslut sparas strukturerat. Filerna raderas automatiskt. Vid ID-handlingen uppmanas sökanden att täcka över de fyra sista siffrorna i personnumret (A1, klar). |
| Lagringsbegränsning | Underlagen, gamla ansökningar och loggen gallras automatiskt av det dagliga jobbet (A3 och A4, klara i `0031`). |
| Korrekthet | Granskaren antecknar verifierat värde och källa. Sökanden kan komplettera, och ett beslut kan omprövas. |
| Information till de registrerade | Integritetspolicyn, avsnitt 4. Policyn är publicerad på `/integritetspolicy` och länkad från samtycket (A2, klar). |
| Rättigheter | Radering: dra tillbaka ansökan eller ta bort kontot (båda finns). Registerutdrag och dataportabilitet: via e-post (manuellt). |
| Överföring till tredje land | Lagring sker i EU. Leverantörerna är amerikanska bolag, och åtkomst skyddas av standardavtalsklausuler respektive Data Privacy Framework (åtgärd A6). |

## 4. Risker för de registrerade

Sannolikhet (S) och allvarlighet (A) bedöms som 1 = låg, 2 = medel och 3 = hög.

| # | Risk | Konsekvens för personen | S | A | Nivå före åtgärder |
|---|---|---|---|---|---|
| R1 | Obehörig åtkomst till ID-handlingar, till exempel ett dataintrång eller en läckt länk | Identitetsstöld och bedrägeri | 1 | 3 | Medel |
| R2 | En granskare missbrukar sin åtkomst och läser eller sparar dokument privat | Integritetsintrång, identitetsstöld | 1 | 3 | Medel |
| R3 | Underlag sparas längre än nödvändigt | Ökad skada vid intrång | 2 | 2 | Medel |
| R4 | Ett felaktigt märke, falskt godkänt eller felaktigt avslag | Elever vilseleds, eller experten nekas utan grund | 2 | 2 | Medel |
| R5 | Märken som överdriver kontrollen, till exempel att de påstår BankID eller kontroll hos en myndighet | Vilseledande, ett förtroendeproblem | 2 | 2 | Medel |
| R6 | Någon laddar upp en annan persons dokument | Den andra personens uppgifter behandlas utan att hen vet om det | 2 | 2 | Medel |
| R7 | Ansökningsuppgifter och logg sparas utan slut | Onödig lagring | 3 | 1 | Medel |
| R8 | Skadlig fil laddas upp och öppnas av granskaren | Granskarens dator angrips, vilket kan leda till ett intrång | 1 | 2 | Låg |
| R9 | Åtkomst från tredje land via leverantörer | Svagare rättsskydd | 1 | 2 | Låg |
| R10 | Sökanden förstår inte vad som händer med uppgifterna | Bristande insyn och kontroll | 2 | 2 | Medel |

## 5. Åtgärder som redan finns

| Risk | Åtgärd i nuvarande version |
|---|---|
| R1 | <ul><li>Privat lagringsplats med en kontroll vid migreringen som stoppar för breda behörighetsregler.</li><li>Signerade länkar som gäller i 5 minuter.</li><li>Behörighetsregler (RLS) på alla tabeller, och alla skrivningar går via kontrollerade databasfunktioner.</li><li>HTTPS.</li><li>Filer tas bort ur lagringen när kontot raderas.</li></ul> |
| R2 | <ul><li>Separata roller: att granska och att se dokument är olika behörigheter.</li><li>Varje visning av en ansökan och varje öppnat dokument loggas.</li><li>Ingen kan granska sin egen ansökan.</li><li>Roller kan bara ges till konton med bekräftad e-post.</li><li>Den sista adminrollen kan inte tas bort.</li></ul> |
| R3 | Automatisk gallring (90 respektive 30 dagar) via ett dagligt jobb, som också tar bort föräldralösa filer. Underlagen raderas direkt när ansökan dras tillbaka. |
| R4 | <ul><li>Godkännande kräver att granskaren har öppnat ID-handlingen och det dokument som vägen kräver.</li><li>HP-märket kräver ett verifierat resultat på minst 1,20.</li><li>Lärarmärket kräver kontroll i Skolverkets register.</li><li>Varje beslut kräver en motivering, och sökanden kan komplettera.</li></ul> |
| R5 | Märkena räknas fram ur kontrolltypen. "HP-resultat granskat" betyder att ett dokument är granskat, och "Verifierat HP-resultat" att resultatet setts i den officiella tjänsten. ID visas som en egen signal och påstår inte BankID. |
| R6 | Godkännande kräver att granskaren har jämfört namnet på ID-handlingen med underlaget. |
| R8 | Bara PDF, JPEG och PNG tillåts. Filtypen kontrolleras mot filens innehåll, och felaktiga filer tas bort. |
| R9 | Data lagras i EU (Irland). |
| R10 | Aktivt samtycke krävs innan ansökan kan skickas in. Det står i ansökan att den granskas manuellt. |

## 6. Kvarstående risk efter åtgärder

| Risk | Kvarstående nivå |
|---|---|
| R1, R2 | Låg. Dokumenten finns kvar högst 30 dagar efter beslut, åtkomsten loggas och är begränsad. |
| R3 | Låg |
| R4, R5, R6 | Låg till medel. Manuell kontroll kan göra fel, så risken minskar ytterligare med BankID och direkt registerkontroll längre fram. |
| R7 | Låg (A3 och A4 är klara). |
| R8, R9 | Låg |
| R10 | Låg (A2 är klar). |

Ingen kvarstående risk är hög, så något förhandssamråd med IMY behövs inte (artikel 36).

## 7. Åtgärder före skarp start

| # | Åtgärd | Vem | Krävs före `experts_apply = on`? |
|---|---|---|---|
| A1 | I ansökan: uppmana sökande att täcka över de fyra sista siffrorna i personnumret på ID-handlingen. | Utvecklare | **Klar** 2026-11-01 |
| A2 | Publicera integritetspolicyn och länka den från ansökan och från samtyckesrutan. | Oscar + utvecklare | **Klar** 2026-11-01: `/integritetspolicy`, länkad från samtycket, inloggningen och sidfoten |
| A3 | Inför gallring av ansökningsuppgifter. Förslag:<ul><li>Avslagna och tillbakadragna ansökningar: namn, resultat och meddelande raderas 12 månader efter beslutet.</li><li>Utkast som inte har ändrats på 6 månader raderas.</li><li>Godkända ansökningar sparas så länge experten är aktiv.</li></ul> | Beslutat av Oscar 2026-11-01, även för ansökningar som väntar på komplettering. Spärrade ansökningar sparas. | **Klar** i `0031` |
| A4 | Revisionsloggen sparas i 24 månader och gallras automatiskt. | Beslutat av Oscar 2026-11-01 | **Klar** i `0031` |
| A5 | Rutin för granskare: inga nedladdningar till egen dator, inga skärmdumpar, granskning bara på en egen och låst enhet. Skriftlig sekretessförbindelse för varje granskare. | Oscar | **Ja** |
| A6 | Godkänn personuppgiftsbiträdesavtal (DPA) med Supabase och Vercel, och spara kopior. Steg för steg: [`a6-personuppgiftsbitraden.md`](a6-personuppgiftsbitraden.md). Vercels DPA kräver Pro-plan. | Oscar | **Ja** |
| A7 | Slå på "Confirm email" i Supabase Auth och sätt `CRON_SECRET` i Vercel. Kontrollera i Vercels logg att gallringsjobbet går utan fel. | Oscar | **Ja** |
| A8 | Rutin för personuppgiftsincidenter: vem som gör vad, och anmälan till IMY inom 72 timmar. | Oscar | **Ja** |
| A9 | Rutin för registerutdrag och dataportabilitet: svar inom en månad. | Oscar | Ja |
| A10 | Gå igenom loggen regelbundet, till exempel en gång i månaden: vem har öppnat vilka dokument? | Admin | Rekommenderas |
| A11 | Ompröva bedömningen vid BankID, Fas 2 (bokning och betalning) och full lansering. | Oscar | – |

## 8. Synpunkter

- Dataskyddsombud: inget utsett. Det krävs inte enligt artikel 37, eftersom HP Lift inte är en myndighet och inte behandlar känsliga uppgifter i stor omfattning eller övervakar personer systematiskt.
- Registrerades synpunkter (artikel 35.9): be pilotens experter om synpunkter innan skarp start, och anteckna dem här.

## 9. Beslut

- [ ] Behandlingen får starta som pilot (bara för personalen), vilket gäller i dag.
- [ ] Behandlingen får öppnas för alla när åtgärderna A5–A8 är genomförda.

Namn, datum: ______________________

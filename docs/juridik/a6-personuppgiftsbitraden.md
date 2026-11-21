# A6: Personuppgiftsbiträdesavtal med Supabase, Cloudflare och Vercel

DPIA-åtgärd A6 (`dpia-studiehjalp-experter.md`). Villkoren är kontrollerade 2026-11-01 mot:
- supabase.com/legal/dpa (version 1, 1 augusti 2026),
- vercel.com/legal/dpa (gäller från 31 mars 2026),
- vercel.com/legal/terms (uppdaterad 19 oktober 2026).

Cloudflares villkor är kontrollerade 2026-11-21 mot:
- cloudflare.com/cloudflare-customer-dpa (version 6.4, gäller från 3 april 2026),
- cloudflare.com/terms, självbetjäningsavtalet *Self-Serve Subscription Agreement* (uppdaterat 12 september 2025),
- cloudflare.com/gdpr/subprocessors/cloudflare-services (uppdaterad 1 oktober 2025).

Appen flyttas från Vercel till Cloudflare Workers. Vercel gäller tills Cloudflare har tagit över driften. Öppna frågor inför bytet står i avsnitt 6, och vad som ändras på bytesdagen i avsnitt 7.

Menyernas namn i Supabase, Cloudflare och Vercel kan ändras. Leta efter motsvarande ställe om något heter annorlunda.

## Varför

Enligt artikel 28 i GDPR måste det finnas ett skriftligt avtal med varje leverantör som behandlar personuppgifter för din räkning (ett personuppgiftsbiträde). Du ska också kunna visa avtalet om IMY frågar.

## 1. Supabase: databas, inloggning och fillagring

**Läget:** Supabases DPA *"supplements and forms part of the Supabase Terms of Service"*. Den gäller alltså automatiskt för alla planer, även gratisplanen, så det finns inget att signera.
- Avtalspart är **Supabase Pte. Ltd.** (Singapore).
- EU:s standardavtalsklausuler (SCC 2021/914) ingår i avtalet (klausul 12).
- Supabase lovar att lagra data i den region du har valt (klausul 6.1). Projektets databas ligger i `eu-west-1`, alltså Irland.

**Gör så här:**
1. Logga in på supabase.com/dashboard med kontot som äger HP Topp-projektet.
2. Öppna organisationen och gå till organisationens inställningar (*Organization settings*).
3. Öppna *Legal documents*.
   - Ladda ned **DPA** som PDF.
   - Ladda ned **Transfer Impact Assessment (TIA)** om den finns.
   - SOC 2-rapporten finns bara på Team- och Enterprise-planerna och behövs inte.
4. Om det inte går att ladda ned en PDF: öppna supabase.com/legal/dpa och spara sidan som PDF med webbläsarens utskriftsfunktion. Filnamnet ska ha med datum, till exempel `supabase-dpa-v1-2026-08-01.pdf`.
5. Spara också underbiträdeslistan, supabase.com/legal/customer-resources/subprocessor-list, som PDF.
6. Kontrollera att projektets region är *West EU (Ireland)*: *Project settings → General*, eller titta på databasens adress.
7. Valfritt: prenumerera på ändringar i underbiträdeslistan om Supabase erbjuder det. Enligt DPA:n meddelas ändringar i förväg, och du har rätt att invända.

## 2. Vercel: webbhotell och serverfunktioner

**Gäller tills bytet.** När Cloudflare har tagit över driften tas avsnittet bort (avsnitt 7). Om kontot har Hobby och bytet är nära, se öppen fråga 7.

**Läget:** det här kräver ett beslut.
- Vercels DPA gäller bara *"for Customers who are on Enterprise and Pro plans"*. Bara på de planerna är Vercel ditt personuppgiftsbiträde. Avtalet och SCC räknas som signerade när du godkänner villkoren, så det finns inget separat att signera.
- På **Hobby**, alltså gratisplanen:
  - Det finns inget biträdesavtal för appens personuppgifter.
  - Villkoren säger *"You shall only use the Services under a Hobby plan for your personal or non-commercial use"*.
  - På Hobby får Vercel också använda ditt innehåll för att träna AI-modeller.
- HP Topp har användare, och planen är att ta betalt och visa annonser. Därför räcker Hobby inte för A6.

**Gör så här:**
1. Logga in på vercel.com och välj teamet eller kontot som äger HP Topp-projektet.
2. Se vilken plan du har under *Settings → Billing*.
3. **Om det står Hobby:** uppgradera till **Pro**. Pro kostar per medlem och månad; kolla aktuellt pris på vercel.com/pricing.
   - Är du ensam räcker en medlem.
   - Kontrollera efteråt under *Settings* att AI-träningen (*Model Training*) är avstängd. På betald Pro är den avstängd från början.
4. **Om det redan står Pro eller Enterprise:** DPA:n gäller redan och du behöver inte göra något mer i det här steget.
5. Spara vercel.com/legal/dpa som PDF med datum, till exempel `vercel-dpa-2026-03-31.pdf`, eftersom det inte finns någon signerad kopia att ladda ned. Spara även underbiträdeslistan, som DPA:n länkar till.
6. **Funktionernas region:**
   - Nya Vercel-projekt kör serverfunktioner i USA (`iad1`) om inget annat anges.
   - Välj **Dublin (`dub1`)** under *Project → Settings → Functions → Function Region*. Då behandlas uppgifterna i EU, bredvid databasen, och sidorna blir snabbare.
   - Säg till om du hellre vill att utvecklaren ställer in det i `vercel.json` med `"regions": ["dub1"]`, så hamnar det i koden i stället.

## 2a. Cloudflare: drift av appen (ersätter Vercel)

**Vad Cloudflare behandlar:**
- **Workers:** appen körs som Workern `hp-lift` (`cloudflare.config.ts`, `src/worker.ts`).
  - Alla anrop till appen går genom Cloudflare: IP-adress, webbläsarinformation, inloggningstoken och det som skickas till servern, till exempel svar, foruminlägg och expertansökningar.
  - Servern laddar också ned varje uppladdat expertunderlag för att kontrollera storlek och filtyp (`src/app/studiehjalp/actions.ts`).
  - Appen lagrar inget av det hos Cloudflare, eftersom Workern inte har någon databas eller lagring där. Allt sparas hos Supabase.
  - Workers Logs stängs av (beslutat av Oscar 2026-11-21), så Cloudflare sparar inte appens loggar.
- **Cloudflare Images:** profilbilder kodas om med bindningen `IMAGES` (`src/lib/avatar/reencode.workers.ts`). Originalbilden, som kan innehålla metadata som plats, skickas till Images och kommer tillbaka förminskad. Appen tar sedan bort den metadata som finns kvar och sparar bilden hos Supabase. Appen använder inte Images egen lagring.
- **Cron Trigger:** kör gallringen av Studiehjälps underlag dagligen 03.30 UTC (`/api/cron/studiehjalp-purge`). Det som loggas är antal raderade filer och rader, eller ett felmeddelande.
- **Cloudflare Access (bara testversionen):** skyddar i dag `hp-lift.<konto>.workers.dev`. Vid inloggning loggas testarens e-postadress, IP-adress och land, och cookien `CF_Authorization` sätts. Access-loggarna sparas i 24 timmar på Zero Trust Free, och testarna syns i användarlistan under *Zero Trust → Team & Resources → Users*. Access tas bort vid bytet (beslutat av Oscar 2026-11-21).

**Läget:**
- Avtalspart är **Cloudflare, Inc.** (USA).
- Självbetjäningsavtalet gäller tjänster som kräver ett Cloudflare-konto, även gratistjänster (avsnitt 1 och 2.6).
- Avsnitt 6.1 i självbetjäningsavtalet tar in Cloudflares DPA genom hänvisning, utan förbehåll för betalda planer. DPA:n säger själv att den ingår i bland annat självbetjäningsavtalet.
  - DPA:n nämner inte gratisplanerna, men begränsar sig inte heller till vissa planer.
  - Det finns alltså inget separat att signera.
  - Beslutat av Oscar 2026-11-21: kontot ska ha Workers Paid. Images och Access kan ligga kvar på gratisnivåerna under samma avtal.
- Till skillnad från Vercels Hobby-plan finns ingen regel om att gratisplanerna bara får användas privat eller icke-kommersiellt.
- Cloudflare får bara behandla personuppgifterna för att tillhandahålla tjänsterna och inte för marknadsföring eller reklam (DPA 3.1). Självbetjäningsavtalet låter dock Cloudflare använda *Network Data*, alltså data som härleds från trafiken, för att driva och utveckla sina tjänster (avsnitt 2.5.5). AI-träning nämns inte. Se öppen fråga 4.
- EU:s standardavtalsklausuler (SCC 2021/914) ingår i DPA:n, med modul 2 när du är personuppgiftsansvarig (avsnitt 6.2). UK-tillägget och schweiziska ändringar ingår också.
- Cloudflare, Inc. är certifierat enligt EU–US Data Privacy Framework, med UK-tillägget och det schweiziska ramverket. Certifieringen var aktiv på dataprivacyframework.gov 2026-11-21, för både HR-data och annan data, och DPA:n hänvisar till den (6.4).
- **Var:** DPA:n räknar med att Cloudflare och underbiträdena behandlar uppgifter utanför EES (avsnitt 6.1).
  - Ett anrop hanteras i ett datacenter nära besökaren, och Workern körs normalt där.
  - Workers Logs kan lagras i Cloudflares kärndatacenter var som helst i världen, och stängs därför av (beslutat av Oscar 2026-11-21).
  - Att hålla behandling och loggar inom EU (*Data Localization Suite*) är ett tillägg som bara finns för Enterprise.
- Nya underbiträden läggs upp på listan minst 30 dagar innan de används, och du kan invända skriftligt inom 10 dagar (DPA 4). Listan har ett RSS-flöde.
- Myndigheters begäranden: Cloudflare lovar att meddela kunden när det är tillåtet, och att pröva en begäran i domstol innan uppgifter lämnas ut om begäran krockar med dataskyddsreglerna (DPA 8).

**Gör så här:**
1. Logga in på dash.cloudflare.com med kontot som äger Workern `hp-lift`.
2. Uppgradera till **Workers Paid** under *Billing* (beslutat av Oscar 2026-11-21) och kolla aktuellt pris där. Se samtidigt vilka planer kontot har för Images och Zero Trust.
3. Spara som PDF med datum, eftersom det inte finns någon signerad kopia att ladda ned:
   - DPA:n, cloudflare.com/cloudflare-customer-dpa, till exempel `cloudflare-dpa-v6.4-2026-04-03.pdf`,
   - självbetjäningsavtalet, cloudflare.com/terms,
   - underbiträdeslistan, cloudflare.com/gdpr/subprocessors/cloudflare-services.
4. Lägg in underbiträdeslistans RSS-flöde, cloudflare.com/gdpr/subprocessors/rss.xml, i en RSS-läsare. Annars räcker det att läsa listan varje år (avsnitt 5).
5. Spara Cloudflares post i DPF-listan som PDF: dataprivacyframework.gov/list, sök på "Cloudflare". Den var aktiv 2026-11-21.
6. Workers Logs ska vara avstängt (beslutat av Oscar 2026-11-21). Det är påslaget från början för nya Workers.
   - Inställningen finns i `cloudflare.config.ts` (`observability: { enabled: false }`), så den följer med varje deploy.
   - Kontrollera efter nästa deploy från `main` att Workers Logs är avstängt under *Workers & Pages → hp-lift → Settings → Observability*. Vill du stänga av det tidigare gör du det på samma ställe.
   - Utan Workers Logs blir det svårare att felsöka gallringsjobbet (A7).
7. **Vid bytet**, om domänen går genom Cloudflare: håll Web Analytics, Zaraz och bot-skydd som sätter cookies (till exempel Bot Fight Mode) avstängda (beslutat av Oscar 2026-11-21). Ska något av dem slås på senare måste integritetspolicyn, avsnitt 8, uppdateras först.
8. **Vid bytet:** ta bort Access (beslutat av Oscar 2026-11-21), alltså Access-applikationen som skyddar `hp-lift.<konto>.workers.dev`, och ta bort testarna under *Zero Trust → Team & Resources → Users*.

## 2b. Anthropic: kontroll av profilbilder (sedan 2026-11-07)

**Läget:** profilbilder skickas (förminskade, utan metadata och utan namn eller e-post) till Anthropics API för en
automatisk kontroll med Claude Opus 5.5 innan de syns (`docs/profilbild/plan.md`).

**Gör så här:**
1. Skapa en API-nyckel under ett organisationskonto på console.anthropic.com och lägg den som `ANTHROPIC_API_KEY`
   i Vercel (*Project → Settings → Environment Variables*) och som hemlighet för Workern `hp-lift` hos Cloudflare.
   Utan nyckeln hamnar alla nya bilder hos teamet.
2. Kontrollera att Anthropics kommersiella villkor och personuppgiftsbiträdesavtal (DPA, med standardavtalsklausuler)
   gäller för kontot, och spara dem som PDF med datum.
3. Kontrollera att API-data inte används för träning (Anthropics standard för API-kunder) och vilken lagringstid
   som gäller.
4. Stäm av formuleringen om Anthropic i integritetspolicyn (avsnitt 7) mot det du har sparat.

## 3. Google-inloggning

Ingen åtgärd behövs. Vid "Fortsätt med Google" är Google en egen personuppgiftsansvarig för användarens Google-konto och inte ditt biträde. Det står redan i integritetspolicyn.

## 4. Spara och dokumentera

Lägg PDF:erna i en mapp som bara du kommer åt, till exempel i molnlagring. Lägg dem inte i Git-repot. Fyll sedan i loggen nedan.

| Leverantör | Plan | DPA-version | Sparad som | Region | Datum | Klart |
|---|---|---|---|---|---|---|
| Supabase | | v1, 1 aug 2026 | | eu-west-1 (Irland) | | ☐ |
| Cloudflare | Workers Paid | v6.4, 3 apr 2026 | | Globalt nät (EU-region kräver Enterprise) | | ☐ |
| Vercel (tas bort vid bytet) | | 31 mar 2026 | | | | ☐ |

När raderna för Supabase och Cloudflare är klara, och Vercel så länge Vercel sköter driften:
- markera A6 som klar i DPIA:n,
- ta bort anteckningarna märkta **Kontrollera** i integritetspolicyn.

## 5. Varje år eller när något ändras

- Läs DPA:erna och underbiträdeslistorna igen och spara nya versioner om de har ändrats.
- När bolaget är bildat ska konton och avtal flyttas till bolaget. Då blir bolaget kunden i alla tjänsterna, och integritetspolicyn uppdateras.
- Ny leverantör, till exempel för annonser, betalning (Stripe) eller video: ett biträdesavtal behövs innan den börjar användas.

## 6. Öppna frågor inför bytet

Avgör frågorna innan ändringarna publiceras.

1. **Plan och DPA.** **Avgjort 2026-11-21:** kontot ska ha Workers Paid. DPA:n gäller genom självbetjäningsavtalet (6.1), och Images och Access kan ligga kvar på gratisnivåerna under samma avtal.
2. **Var uppgifterna behandlas.** **Avgjort 2026-11-21:** Workers Logs stängs av. Ett anrop hanteras fortfarande i närmaste datacenter, och en EU-begränsning kräver Enterprise. Risk R9 i DPIA:n står kvar som låg.
3. **Överföringsmekanism.** Policyn anger DPF och SCC. Cloudflare är DPF-certifierat (aktivt 2026-11-21), så överföringar till USA har stöd i EU-kommissionens beslut om DPF. För andra länder utanför EES gäller SCC. Räcker det, eller vill du göra en egen överföringsbedömning (TIA) för de länderna? Cloudflare hjälper till med den på kundens bekostnad (DPA 6.5).
4. **Network Data.** Cloudflare får använda data som härleds från trafiken för att driva och utveckla sina tjänster (självbetjäningsavtalet 2.5.5). Ska integritetspolicyn säga något om det?
5. **Testinloggningen.** **Avgjort 2026-11-21:** Access tas bort efter bytet. Fram till dess gäller det bara inbjudna testare, som kan informeras direkt i stället för i policyn.
6. **Cookies och statistik efter bytet.** **Avgjort 2026-11-21:** bot-skydd som sätter cookies (`__cf_bm`, `cf_clearance`) och Web Analytics hålls avstängda, så avsnitt 8 i policyn behöver inte ändras.
7. **Vercel under övergången.** Vercels DPA kräver Pro-plan. Om kontot har Hobby: uppgradera för övergångstiden, eller byta så snart som möjligt? Vad ska tas bort hos Vercel efter bytet: projektet, loggarna, miljövariablerna?
8. **Publicering.** Ska övergångsversionen av policyn, med både Vercel och Cloudflare, publiceras redan nu, eller bara slutversionen på bytesdagen? Datumet högst upp sätts därefter. Ska bytet också meddelas i appen (avsnitt 11 i policyn, "större ändringar")?

## 7. Vid bytet från Vercel till Cloudflare

1. **Integritetspolicyn** (`integritetspolicy.md` och `src/app/integritetspolicy/page.tsx`):
   - ta bort Vercel-raden och stycket om flytten i avsnitt 7,
   - ta bort anteckningarna märkta **Vid bytet**,
   - sätt nytt datum högst upp och i `UPDATED`.
2. **DPIA:n:** under *Mottagare*, ta bort Vercel och orden "I dag bara för testversionen" hos Cloudflare. Ta bort Vercel ur A6 och den gamla Vercel-delen ur A7.
3. **Det här dokumentet:** ta bort avsnitt 2 och Vercel-raden i loggen, gör 2a till avsnitt 2 och ta bort Vercel ur rubriken.
4. **Driften (A7):** kontrollera att kontot har Workers Paid och att Workers Logs är avstängt. Går domänen genom Cloudflare: kontrollera att Web Analytics och bot-skydd som sätter cookies är avstängda (avsnitt 2a, steg 7). Lägg in hemligheterna för Workern `hp-lift`, bland annat `CRON_SECRET` och `ANTHROPIC_API_KEY`. Kontrollera i Cloudflares logg att Cron Triggern har kört gallringen, och stäng sedan av Vercel Cron så att jobbet inte körs från båda.
5. **Access:** ta bort Access-applikationen och testarna (avsnitt 2a, steg 8).
6. **Vercel:** när Cloudflare har fungerat ett tag, ta bort Vercel-projektet eller åtminstone miljövariablerna, bland annat `SUPABASE_SERVICE_ROLE_KEY`. Då finns inga hemligheter eller loggar kvar hos Vercel.

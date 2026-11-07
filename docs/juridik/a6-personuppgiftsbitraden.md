# A6: Personuppgiftsbiträdesavtal med Supabase och Vercel

DPIA-åtgärd A6 (`dpia-studiehjalp-experter.md`). Villkoren är kontrollerade 2026-11-01 mot:
- supabase.com/legal/dpa (version 1, 1 augusti 2026),
- vercel.com/legal/dpa (gäller från 31 mars 2026),
- vercel.com/legal/terms (uppdaterad 19 oktober 2026).

Menyernas namn i Supabase och Vercel kan ändras. Leta efter motsvarande ställe om något heter annorlunda.

## Varför

Enligt artikel 28 i GDPR måste det finnas ett skriftligt avtal med varje leverantör som behandlar personuppgifter för din räkning (ett personuppgiftsbiträde). Du ska också kunna visa avtalet om IMY frågar.

## 1. Supabase: databas, inloggning och fillagring

**Läget:** Supabases DPA *"supplements and forms part of the Supabase Terms of Service"*. Den gäller alltså automatiskt för alla planer, även gratisplanen, så det finns inget att signera.
- Avtalspart är **Supabase Pte. Ltd.** (Singapore).
- EU:s standardavtalsklausuler (SCC 2021/914) ingår i avtalet (klausul 12).
- Supabase lovar att lagra data i den region du har valt (klausul 6.1). Projektets databas ligger i `eu-west-1`, alltså Irland.

**Gör så här:**
1. Logga in på supabase.com/dashboard med kontot som äger HP Lift-projektet.
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

**Läget:** det här kräver ett beslut.
- Vercels DPA gäller bara *"for Customers who are on Enterprise and Pro plans"*. Bara på de planerna är Vercel ditt personuppgiftsbiträde. Avtalet och SCC räknas som signerade när du godkänner villkoren, så det finns inget separat att signera.
- På **Hobby**, alltså gratisplanen:
  - Det finns inget biträdesavtal för appens personuppgifter.
  - Villkoren säger *"You shall only use the Services under a Hobby plan for your personal or non-commercial use"*.
  - På Hobby får Vercel också använda ditt innehåll för att träna AI-modeller.
- HP Lift har användare, och planen är att ta betalt och visa annonser. Därför räcker Hobby inte för A6.

**Gör så här:**
1. Logga in på vercel.com och välj teamet eller kontot som äger HP Lift-projektet.
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

## 2b. Anthropic: kontroll av profilbilder (sedan 2026-11-07)

**Läget:** profilbilder skickas (förminskade, utan metadata och utan namn eller e-post) till Anthropics API för en
automatisk kontroll med Claude Opus 5.5 innan de syns (`docs/profilbild/plan.md`).

**Gör så här:**
1. Skapa en API-nyckel under ett organisationskonto på console.anthropic.com och lägg den som `ANTHROPIC_API_KEY`
   i Vercel (*Project → Settings → Environment Variables*). Utan nyckeln hamnar alla nya bilder hos teamet.
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
| Vercel | | 31 mar 2026 | | | | ☐ |

När båda raderna är klara:
- markera A6 som klar i DPIA:n,
- ta bort anteckningarna märkta **Kontrollera** i integritetspolicyn.

## 5. Varje år eller när något ändras

- Läs DPA:erna och underbiträdeslistorna igen och spara nya versioner om de har ändrats.
- När bolaget är bildat ska konton och avtal flyttas till bolaget. Då blir bolaget kunden i båda tjänsterna, och integritetspolicyn uppdateras.
- Ny leverantör, till exempel för annonser, betalning (Stripe) eller video: ett biträdesavtal behövs innan den börjar användas.

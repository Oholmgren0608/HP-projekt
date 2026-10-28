# Studiehjälp – Fas 0: nulägesaudit, risker och plan

Underlag: *HP Lift Master Developer Prompt v2.0 – Studiehjälp, verifierade experter & Creator-intäkter* (21 okt 2026), [`spec-v2.0-2026-10-21.pdf`](spec-v2.0-2026-10-21.pdf), här kallad **specen**.
Granskat 2026-10-28: koden i repot (main, commit `e4544d1`) och databasens migrationer `0001`–`0028`, som alla är körda.
Inte granskat: Vercel-projektets inställningar och miljövariabler, Supabase-projektets auth-inställningar och eventuella avtal. Dessa finns inte i repot.

Specen kräver i Fas 0 att den här rapporten levereras innan skarpa produktionsmigreringar görs (§9.1, §10 Fas 0). Inget i Studiehjälp är byggt än.

---

## 1. Sammanfattning

**Specen bygger på flera förutsättningar som inte finns i HP Lift i dag.**

| Specen förutsätter | Nuläge |
|---|---|
| Tre befintliga abonnemang med plan-ID:n, priser och entitlements (§1.2) | Finns inte. Det finns ingen betaltjänst, inga priser, inga planer och ingen premiumlogik. Alla funktioner är gratis för alla. |
| Forumet är premiumspärrat och nås bara av nivå 3 (§1, §1.2) | Forumet är öppet. Alla kan läsa, även utloggade, och alla inloggade kan skriva. |
| Annonser på webbplatsens vanliga ytor för gratisnivån (§1.2) | Finns inte. Det finns inget annonsnätverk, ingen cookie- eller samtyckeshantering och ingen analys. |
| Befintligt entitlements- och billinglager att återanvända (§5.2) | Finns inte. |
| Adminroller, revisionslogg och moderering att bygga vidare på | Delvis. `/review` skyddas av en e-postlista i en miljövariabel, och forumet har en moderatortabell. Någon admin-, ekonomi- eller verifieringsroll och någon revisionslogg finns inte. |
| Uppladdning, videoinfrastruktur och mediahantering | Finns inte för användare. Den enda lagringen är en privat bucket för provfigurer som fylls av ett CLI-skript. |
| Integritetspolicy, villkor, cookies och åldersgränser | Finns inte. |

**Två konsekvenser kräver beslut innan något byggs:**

1. *"Behåll de tre befintliga abonnemangen och deras priser"* går inte att uppfylla, eftersom abonnemangen inte finns. De måste först beslutas och byggas: priser, betaltjänst, moms och villkor. Det är ett eget projekt.
2. Att följa §1.2 och låsa forumet till nivå 3 skulle i dag **stänga det befintliga forumet för alla**, eftersom ingen kan bli nivå 3.

**Det som kan byggas nu, utan externa avtal och utan att något fejkas:**
- **Fas 1:** expertansökan, säker uppladdning av underlag, manuell granskning med ärliga statusar, expertprofiler, sök och filter. Inga pengaflöden.
- **Grundstenar:** adminroller, revisionslogg, feature flags och ett entitlement-lager vars standard är dagens beteende.
- **Studiehjälp-fliken** bakom en avstängd flagga.

**Blockerat tills avtal eller beslut finns:**
- Betalningar och utbetalningar, t.ex. Stripe Connect. Kräver bolagskonto, KYC och villkor.
- BankID eller annan ID-leverantör.
- Annonsnätverk och samtyckeshantering.
- Videohosting och transkodning.
- E-post och notiser. Kräver egen SMTP; Supabase Auth skickar bara ett fåtal mejl i timmen utan det.
- Juridisk granskning: GDPR/DPIA, DSA, konsumenträtt, DAC7, moms och minderåriga. Specen kräver den själv inför skarp lansering (§1 punkt 8, §8.2).

---

## 2. Nuläge per område

### 2.1 Webbplats och navigation
- **Uppbyggnad:** en Next.js 16-app (App Router) på Vercel och en Supabase-databas. Huvudlayouten och menyn finns i [`src/components/app-shell.tsx`](../../src/components/app-shell.tsx).
- **Menyn** (`NAV`, rad 163–186):
  - Översikt `/`
  - Plan: Veckoplan, Nivåtest, Poäng
  - Öva: Öva delprov, ORD-Flashcards, Läsbibliotek, Prov, Duell
  - Forum `/forum`
  - Tips `/tips`
- **Desktop** har en vänstermeny.
- **Mobil** har en flikrad i nederkant med fast `grid-cols-4` (rad 420): Plan, Öva, Forum, Tips. En ny huvudflik kräver att raden blir fem kolumner, eller att Tips flyttas in i en grupp.
- **Routes:** `/`, `/plan`, `/nivatest`, `/resultat`, `/ova` och `/ova/[delprov]`, `/ova/flashcards`, `/bibliotek`, `/prov`, `/duell` och `/duell/[id]`, `/forum` och `/forum/fraga/[id]`, `/tips`, `/feedback`, `/profil` och `/review`.
- Det finns inga API-routes (`route.ts`). Serveranrop görs med server actions i `src/app/review/actions.ts` och `src/app/profil/actions.ts`.

### 2.2 Konton och inloggning
- **Inloggning:** Supabase Auth med e-post och lösenord samt Google (`src/lib/supabase/auth-context.tsx`).
- **Sessionen finns bara i webbläsaren.** Den sparas i localStorage under `hp-lift-auth`. Det finns inga cookies, inget `@supabase/ssr` och ingen middleware eller proxy.
- **Server actions** får användarens access-token som argument och verifierar den med `auth.getUser(token)` (`src/lib/supabase/server.ts`: `verifyReviewer`, `verifyUser`).
- **Service-role-nyckeln** används bara på servern (`createAdminClient`, `import "server-only"`).
- **Utan konto:** appen fungerar utan inloggning. Data ligger i localStorage och synkas till `user_state` vid inloggning.

### 2.3 Roller och behörigheter
- **`/review`:** kräver inloggning och att e-posten finns i `REVIEW_ALLOWED_EMAILS` (kontrolleras på servern).
- **Moderatorer:** tabellen `forum_moderators` (migration `0012`). Den första moderatorn läggs in med en hårdkodad e-post i `0014`.
- **Saknas:** `is_admin`-flaggor, rollkolumner, ekonomi- eller verifieringsroller och en revisionslogg för administrativa beslut.
- **RLS är på för alla tabeller.** Skrivningar går genom `SECURITY DEFINER`-funktioner som sätter `search_path = public` och kontrollerar `auth.uid()`. Det mönstret bör användas för allt nytt.

### 2.4 Forumet (`/forum`, migrationer `0012`–`0014`, `0017`)
- **Upplägg:** en tråd per övningsfråga, med svar och svar på svar.
  - Röstning, där man inte kan rösta på sig själv.
  - Bästa svar, som trådstartaren eller en moderator markerar.
  - Rykte: 2 · upp − ned + 15 · bästa svar.
  - Anmälningar som hamnar i en moderatorkö.
- **Åtkomst i dag:** alla kan läsa, även utloggade. Inloggade kan skriva, rösta och anmäla. Det finns ingen premiumspärr.
- **Fel i befintlig funktion:** se 2.10.

### 2.5 Abonnemang, betalningar och annonser
Inget av detta finns: ingen betaltjänst (Stripe, Klarna, Swish), inga priser eller planer, inga entitlements, ingen betalvägg, inga annonser, ingen analys och inga feature flags. `question_flags` är felrapporter och har inget med feature flags att göra.

### 2.6 Lagring och uppladdning
- **Bucket:** en enda, `prov-figures`. Den är privat sedan `0017` och läses bara via signerade URL:er från `/review`.
- **Uppladdning:** sker bara från ett CLI-skript. Det finns ingen uppladdning från användare och därmed ingen filvalidering, virusskanning eller lagringspolicy.

### 2.7 Användarprofil
- **`player_profiles`:** visningsnamn, unikt användarnamn, Elo, vinster och förluster, rapporträknare med mera.
- **Övrigt per användare:** `forum_reputation` och `leaderboard_entries`. Gamification ligger i webbläsaren.
- **Saknas:** foto, presentation, födelsedatum och telefon. E-posten finns bara i `auth.users`.

### 2.8 Drift, konfiguration och tester
- **Konfiguration:** `next.config.ts` sätter bara `allowedDevOrigins`. Det finns ingen `vercel.json` eller `vercel.ts`, ingen middleware och ingen CI.
- **Miljövariabler i appen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` och `REVIEW_ALLOWED_EMAILS`.
- **Tester:** inget testramverk och inget `npm test`. Kontrollen är `lint`, `tsc` och `build`. Migrationer och RLS har testats med en PGlite-rigg och flöden med Playwright, men båda ligger utanför repot.

### 2.9 Juridik och dataskydd
- **Saknas:** integritetspolicy, användarvillkor, cookie- eller samtyckeshantering och ålders- eller vårdnadshavarhantering.
- **Konto:** användaren kan radera sitt konto själv från `/profil`.

### 2.10 Fel i befintlig funktion
- **Kontoradering raderar andras forumsvar.** `forum_posts.author_id` har `on delete cascade` mot `auth.users`, och `parent_id` har `on delete cascade` mot `forum_posts` (`0012`, rad 37–38). När någon raderar sitt konto försvinner därför alla svar som andra har skrivit på den personens inlägg.
  - Det strider mot specens krav att forumets gamla diskussioner ska finnas kvar (§10).
  - Föreslagen rättelse, i en egen liten migration:
    - Behåll inlägget men anonymisera det. `author_id` sätts till `null`, eller till en "raderad användare", och texten ersätts som vid mjuk radering.
    - Ändra `parent_id` till `on delete set null` eller till mjuk radering.
- **Utloggade kan läsa `author_id`** på rå `forum_posts`-rader. Det är ingen säkerhetsbrist i dag, men expertfunktioner bör inte bygga vidare på det mönstret.

---

## 3. Specen mot nuläget – konsekvenser och förslag

| Specen | Problem | Förslag |
|---|---|---|
| §1.2 "behåll befintliga abonnemang, plan-ID:n och priser" | Det finns inga. | Bygg ett generiskt entitlement-lager nu, där alla saknar betalnivå. Abonnemangen, med priser och betaltjänst, blir ett eget beslut och projekt. |
| §1.2 forum endast nivå 3 | Skulle stänga forumet för alla i dag. | Inför `forum_access` som entitlement, men håll spärren avstängd med flaggan `forum_gating` tills nivå 3 går att köpa. Besluta om befintliga forumanvändare ska få fortsatt åtkomst. |
| §1.2 annonser på gratisnivån | Annonsnätverk, samtycke och integritetspolicy saknas. | Inga annonser förrän avtal och samtyckeslösning finns (specen kräver det, §5.2). Webbplats- och videoannonser hålls som separata entitlements. |
| §3.1 identitetskontroll, gärna BankID | Avtal saknas. | Manuell kontroll av handlingar med statusen "Dokument granskat". Etiketten "Verifierat" används aldrig utan oberoende kontroll. BankID ligger bakom en avstängd flagga. |
| §3.3 antivirus på uppladdningar | Supabase har ingen inbyggd skanning. | Tillåt bara PDF, JPEG och PNG med storleksgräns och kontroll av filsignatur. Filer öppnas inte i granskarnas webbläsare utan förhandsvisning. Extern skanning kopplas på senare (blockerad). |
| §5 video och transkodning | Ingen leverantör. | Välj leverantör, t.ex. Mux eller Cloudflare Stream. Till dess bara skrivna guider. |
| §2.4 Stripe Connect och §7.3 utbetalningar | Inget konto och ingen KYC. | Fas 2 och 4 kan inte startas skarpt. Ekonomilogiken (potter och invarianter) kan byggas och testas med 0 kr i flöde. |
| §8.1 elever under 18 | Ingen åldershantering. | Rekommendation för piloten: bokning och kontakt med experter bara för 18 år och äldre. |
| §9.4 en ny huvudflik på mobil | Flikraden har fyra platser. | Fem flikar: Plan, Öva, Forum, Studiehjälp, Tips. Alternativt flyttas Tips in under en grupp. |

---

## 4. Beslut som behövs från produktägaren

1. **Abonnemangen.** Finns de tre nivåerna någon annanstans, med beslutade namn och priser? Om inte: ska de byggas nu (betaltjänst, priser, moms, villkor) eller senare?
   - *Rekommendation:* bygg Fas 1 nu, eftersom den inte beror på abonnemangen. Ta abonnemangen som ett eget projekt.
2. **Forumspärren.** Ska det öppna forumet verkligen låsas till nivå 3, och i så fall från vilket datum? Behåller befintliga skribenter åtkomst?
   - *Rekommendation:* ingen spärr förrän nivå 3 går att köpa.
3. **Annonser.** Ska gratisnivån ha annonser alls? Det kräver annonsnätverk, cookiesamtycke och integritetspolicy.
4. **Granskare.** Vem ska granska expertansökningar och se känsliga dokument?
   - *Rekommendation:* en ny rolltabell (`staff_roles`) med de separata rollerna `verify_expert`, `view_sensitive_document`, `moderator`, `finance_admin` och `payout_admin`, och Oscar som första admin.
5. **Identitetskontroll.** BankID-leverantör nu (avtal och kostnad per kontroll) eller manuell kontroll i piloten?
6. **Åldersgräns.** 18+ för bokningar och expertkontakt i piloten?
7. **Juridik.** Vem tar fram integritetspolicy, expert- och användarvillkor och DPIA? Ingen skarp insamling av HP-resultat eller lärarlegitimationer bör ske innan de finns. Det går att bygga och testa bakom en avstängd flagga.
8. **Betaltjänst och bolag (Fas 2).** Finns ett bolag som kan öppna Stripe-konto (Connect med KYC)?
9. **Video (Fas 3).** Vilken videoleverantör och vilken budget? Börja med skrivna guider?

---

## 5. Föreslagen arkitektur (anpassad till befintlig databas)

**Principer:**
- Allt nytt är additivt: nya tabeller och funktioner, inga ändringar i befintliga, utom rättelsen i 2.10.
- RLS på allt.
- Alla skrivningar och administrativa beslut går via `SECURITY DEFINER`-funktioner som kontrollerar `auth.uid()` och roll, och som skriver till revisionsloggen.
- Allt styrs av flaggor som är avstängda från början.
- Klienten avgör aldrig behörighet (specen §5.2).

### 5.1 Behörighet och konfiguration
- **`staff_roles(user_id, role, granted_by, granted_at)`** med hjälpfunktionen `has_role(role)`. Rollerna hålls åtskilda (specen §2.1, §3.3).
- **`admin_audit_log`:** append-only med aktör, åtgärd, objekt, motivering och tid. Hela dokument loggas aldrig.
- **`feature_flags(key, enabled, note, updated_by, updated_at)`:** alla kan läsa, bara admin kan skriva. Servern läser alltid flaggan själv.
  - Flaggor: `studiehjalp`, `experts_apply`, `experts_public`, `bookings`, `payments`, `creator_uploads`, `video_ads`, `site_ads`, `forum_gating`, `monetization`, `payouts` och `bankid`.
- **Entitlements:**
  - `plan_entitlements(plan_key, website_ad_free, video_ad_free, forum_access)` är konfiguration utan hårdkodade nivå-ID:n.
  - `subscriptions` fylls först när betaltjänsten finns.
  - `entitlements_for(uid)` räknas ut på servern. Utan abonnemang ger den nivå 1, men forumet förblir öppet så länge `forum_gating` är av.
  - De tre rättigheterna är oberoende. `video_ad_free` sätts aldrig bara för att `website_ad_free` är sann.

### 5.2 Fas 1-datamodell (inga pengar)
- **`expert_applications`:** användare, väg (`hp` eller `teacher`), status (`draft`, `submitted`, `in_review`, `needs_completion`, `approved`, `rejected`, `blocked`), datum och beslutsfattare.
- **`verification_documents`:**
  - Lagrar bara metadata: typ, filnamn, storlek, MIME, sökväg i den privata bucketen, uppladdningstid och planerad raderingstid.
  - Själva filen ligger i en ny **privat bucket `expert-documents`**.
  - Uppladdning sker via signerad upload-URL som servern utfärdar efter validering. Granskare läser via signerad URL med kort giltighet.
  - Filen raderas automatiskt 30 dagar efter beslut. Det kräver ett schemalagt jobb, t.ex. pg_cron eller Vercel Cron.
- **`verification_reviews`:**
  - Varje granskningsbeslut med kontrolltyp, verifierad totalpoäng och provår (HP-vägen) eller källa och datum för registerutdrag med verifierad behörighet (lärarvägen), samt motivering.
  - Personnummer lagras inte.
- **`expert_profiles`:** visningsnamn, presentation, upplägg, språk, delprov, eventuella priser (bara information i Fas 1), publiceringsval för HP-resultat och provår, synlighet.
- **`expert_specialties`:** delprov per expert.
- **Märken räknas fram ur granskningsbesluten** och lagras aldrig som fri text:
  - "Verifierat HP-resultat" kräver godkänd kontroll med minst 1,20.
  - "Legitimerad lärare" kräver godkänd registerkontroll.
  - Identitet är en egen signal.
  - Statusen "Dokument granskat" används när ingen oberoende kontroll har gjorts.

### 5.3 Senare faser (översikt)
- **Fas 2:** `tutor_listings`, `availability_slots`, `bookings` med prissnapshot, `booking_events`, `payment_transactions` med idempotency-nycklar, `refunds`, `reviews_expert`, `reviews_student_private` (unikt per bokning, författare och roll) och dubbelblind publicering. Kräver betaltjänst.
- **Fas 3:** `videos`, `video_assets`, `video_captions`, `guides`, `video_view_events_aggregated` och en rankning enligt specen §6 med dokumenterade vikter. Kräver videoleverantör. Skrivna guider kan komma först.
- **Fas 4:**
  - Tabeller: `settlement_periods`, `creator_revenue_ledger` (dubbel bokföring) och `creator_payouts`.
  - Potterna räknas som rena funktioner: `D_ad`, `creator_pool_ad = max(0, min(0,25·D_ad, D_ad − M_ad))` och motsvarande för nivå 3 med 5 %.
  - Invarianterna testas automatiskt (specen §7.3), inklusive exemplen 10 000/4 000/1 500/4 500 och 20 000/14 000/300/5 700.
  - Utbetalningar är spärrade med flagga tills alla invarianter går igenom.

### 5.4 Tester
- **Ren logik**, som potter, rankning och märken: Nodes inbyggda testkörare via `tsx --test`. Det kräver inga nya beroenden, bara ett nytt `npm test`.
- **Migrationer, RLS och RPC:** PGlite-riggen flyttas in i repot (`scripts/db-test/`), så att alla kan köra den.
- **Flöden:** Playwright-flöden för de tre end-to-end-flödena i §9.4, när de finns.

---

## 6. Fasplan

| Steg | Innehåll | Förutsättning |
|---|---|---|
| **0** | Denna audit | Klar |
| **0b** | Rättelse av kontoraderingsfelet i forumet (2.10) | Kan göras direkt |
| **1a** | Grund: `staff_roles`, `admin_audit_log`, `feature_flags`, entitlement-lager med dagens beteende som standard, Studiehjälp-fliken (dold bakom `studiehjalp`) | Beslut 4 |
| **1b** | Expertansökan: väg HP eller lärare, uppladdning till privat bucket med validering, statusflöde, granskningskö för `verify_expert`, beslut med motivering, omprövning, revisionslogg, automatisk radering | Beslut 4–5; integritetstext före skarp start (beslut 7) |
| **1c** | Publika expertprofiler, märken, sök och filter (delprov, språk, distans eller fysiskt, HP-resultat, betyg när det finns), Creator Studio som tom vy | 1b |
| **2** | Annonser för lektioner, kalender, bokning, betalning, kvitton, återbetalning, omdömen | Beslut 6 och 8 |
| **3** | Videor och guider, spelare, sök, rankning | Beslut 9; annonser kräver beslut 3 |
| **4** | Creator-potter, ledger, avräkning, utbetalningar | Fas 2–3 och verklig intäkt |
| **–** | Abonnemangen (nivå 2 och 3), forumspärren | Beslut 1–2 |

## 7. Migrations- och rollbackplan
- Varje steg är en egen numrerad migration. Varje migration testas i PGlite mot hela kedjan `0001`–`00NN` innan den körs, enligt samma rutin som `0017`–`0028`.
- Bara additiva ändringar. Undantaget är rättelsen i 2.10, som ändrar två främmande nycklar och testas extra.
- Varje migration får ett manuellt rollback-skript i `supabase/manual/`, som för `0017`.
- Alla nya flaggor är avstängda vid körning. Ingen användare märker något förrän en flagga slås på.

## 8. Specens acceptanskriterier – hur de prövas

| Kriterium (specen §10) | Prövas med |
|---|---|
| Forumets diskussioner, rykte och bästa svar finns kvar | PGlite-test före och efter varje migration, inklusive kontoradering efter rättelsen i 2.10 |
| Exakt en ny huvudflik och oförändrade befintliga URL:er | Playwright: menyn på desktop och mobil |
| Nivå 1–3 och byte gratis → 2 → 3 → 2 → gratis | PGlite-test av `entitlements_for` när abonnemang finns; RPC:erna avgör, inte klienten |
| 1,15 avslås; 1,20 och 1,25 godkänns först efter kontroll | Test av beslutsfunktionen |
| Inget "Legitimerad lärare"-märke utan registerkontroll | Test av märkesfunktionen |
| Ingen ser andras dokument eller interna elevomdömen | RLS-test med flera användare och anon; signerade URL:er bara för rätt roll |
| Prisändring påverkar inte gamla bokningar | Fas 2: prissnapshot och test |
| Betyg bara efter genomförd bokning, ett per part, dubbelblint | Fas 2: unika index och test |
| 0 intäkt, återbetalning, bot eller annonsblockerare ger 0 kr | Fas 4: invariant-tester med specens exempel |
| Dubbel webhook ger en bokföringspost | Fas 2 och 4: idempotency-nyckel och test |

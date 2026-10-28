# Studiehjälp – Fas 1: verifierade experter (pilot)

Status 2026-10-28: byggd och migration `0029_studiehjalp_experter.sql` är körd mot databasen.
Studiehjälps tre flaggor står på `staff`, så bara konton med en roll i `staff_roles` ser fliken. Andra användare märker ingen skillnad.

Underlag: [specen](spec-v2.0-2026-10-21.pdf) och [Fas 0-auditen](fas-0-nulagesaudit.md).

## Beslut (Oscar, 2026-10-28)

Svar på frågorna i Fas 0-auditen §4:

1. **Abonnemangen** byggs senare. Fas 1 byggs först.
2. **Forumet** förblir öppet tills nivå 3 går att köpa.
3. **Gratisnivån ska ha annonser.** Det kommer i en senare fas och kräver annonsnätverk, cookiesamtycke och integritetspolicy.
4. **Granskare** styrs av rolltabellen `staff_roles`, med ägarkontot som första admin.
5. **Identitet** kontrolleras manuellt i piloten. BankID kommer senare.
6. **Åldersgräns:** bara personer som är 18 år eller äldre.
7. **Integritetspolicy och villkor** kommer från Oscar senare. Fram till dess står flaggorna på `staff`.
8. **Bolag:** inget bolag ännu, men ett kommer. Stripe och Fas 2 väntar på bolaget.
9. **Videoleverantör:** inte bestämd. Fas 3 väntar.

## Vad som finns

| Sida | Innehåll | Flagga |
|---|---|---|
| `/studiehjalp` | Navet: experter, bli expert, Creator Studio och admin. Videor och bokningar står som "Kommer senare". | `studiehjalp` |
| `/studiehjalp/experter` | Sök och filter: fritext, delprov, upplägg (distans eller på plats), språk, maxpris och lägsta HP-resultat. Standardordningen roteras dagligen. | `experts_public` |
| `/studiehjalp/experter/[id]` | Publik expertprofil. `id` är profilens `public_id`, aldrig konto-id:t. | `experts_public` |
| `/studiehjalp/bli-expert` | Ansökan via HP-vägen eller lärarvägen, uppladdning av underlag, skicka in och dra tillbaka. | `experts_apply` |
| `/studiehjalp/creator-studio` | Profilredigering och publicering för godkända experter. Videor kommer i Fas 3. | `studiehjalp` |
| `/studiehjalp/admin` | Granskningskö och beslut, roller, flaggor och revisionslogg. Sidan visas bara för personalen. | Kräver roll |
| `/api/cron/studiehjalp-purge` | Gallrar underlag dagligen klockan 03.30 UTC, styrt av `vercel.json`. | `CRON_SECRET` |

Menyn visar "Studiehjälp" efter Forum när flaggan släpper igenom användaren. På mobil har flikraden då fem platser.

### Datamodell (`0029`)

- **`staff_roles`:** rollerna `admin`, `verify_expert`, `view_sensitive_document`, `moderator`, `finance_admin` och `payout_admin`, som hålls åtskilda. En admin kan inte ta bort den sista admin-rollen.
- **`admin_audit_log`:** append-only. Loggar beslut, rolländringar, flaggor, öppnade ansökningar och dokument, tillbakadragna ansökningar och gallring.
- **`feature_flags`:** varje flagga är `off`, `staff` eller `on`. Klienter får bara läsa `key` och `mode`, och servern kontrollerar flaggan i varje funktion.
- **`expert_applications`:**
  - Status: `draft`, `submitted`, `needs_completion`, `approved`, `rejected`, `blocked` eller `withdrawn`.
  - Varje användare kan ha en öppen ansökan per väg och starta högst fem ansökningar på 30 dagar.
- **`expert_documents`:**
  - Bara metadata i tabellen. Själva filen ligger i den privata bucketen `expert-documents` (PDF, JPEG eller PNG, högst 10 MB).
  - Filen laddas upp via en signerad URL. Servern kontrollerar sedan storlek och filtyp, med magiska byte, innan den räknas som uppladdad.
- **`expert_verification_reviews`:**
  - Ett beslut per granskning: kontrolltyp, verifierat resultat eller verifierad behörighet, källa och motivering.
  - Personnummer lagras inte.
- **`expert_profiles`:**
  - Publik profil med ett eget `public_id`.
  - Kan publiceras bara när ansökan är godkänd och profilen är ifylld.

Alla skrivningar går via `SECURITY DEFINER`-funktioner som kontrollerar `auth.uid()`, roll och flagga. Tabellerna har RLS och klienten får inga direkta skrivrättigheter.

### Regler som databasen upprätthåller

- **HP-vägen:**
  - Ansökan kan inte skickas in med ett resultat under 1,20.
  - Godkännande kräver ett verifierat resultat på minst 1,20 och kontrolltypen `document` eller `live_portal`.
- **Lärarvägen:** godkännande kräver kontroll mot Skolverkets register (`official_register`), ämnen och källa.
- **Före godkännande:**
  - Identiteten måste vara kontrollerad.
  - Granskaren måste själv ha öppnat ID-handlingen och det dokument som vägen kräver.
- **Granskarens begränsningar:**
  - Ingen kan granska sin egen ansökan.
  - Varje beslut kräver en motivering.
- **Märken räknas fram ur besluten** och lagras inte som fri text:
  - "HP-resultat granskat" betyder att ett dokument har granskats.
  - "Verifierat HP-resultat" betyder att granskaren har sett resultatet i den officiella tjänsten.
  - "Legitimerad lärare" kräver registerkontroll.
  - "ID-handling granskad" är en egen signal och påstår inte BankID.
- **Lagringstid för underlag:**
  - Högst 90 dagar från uppladdning och högst 30 dagar efter beslut.
  - Om sökanden drar tillbaka ansökan raderas underlagen direkt.
  - Om kontot raderas tas filerna bort ur Storage först (`src/app/profil/actions.ts`).
- **Endast 18 år och äldre:** sökanden måste intyga ålder och lämna samtycke för att kunna skicka in.

## Drift

- **`CRON_SECRET` måste finnas i Vercel** (Production). Annars svarar gallringsjobbet `503` och underlagen gallras inte automatiskt. Jobbet använder också `SUPABASE_SERVICE_ROLE_KEY`, som redan används vid kontoradering.
- **Roller** ges i `/studiehjalp/admin` med e-postadress. Kontot måste ha bekräftad e-post. Granskare behöver både `verify_expert` och `view_sensitive_document`.
- **Rollback:** [`supabase/manual/0029_studiehjalp_experter_rollback.sql`](../../supabase/manual/0029_studiehjalp_experter_rollback.sql). Töm bucketen via Storage-API:t först.

## Innan flaggorna slås på för alla (`on`)

1. Integritetspolicy, expertvillkor och användarvillkor finns och länkas från ansökan (beslut 7).
2. En DPIA är gjord för behandlingen av HP-resultat, lärarlegitimationer och ID-handlingar.
3. "Confirm email" är påslaget i Supabase Auth.
4. `CRON_SECRET` är satt och gallringsjobbet har gått utan fel i Vercels cron-logg.
5. Minst en granskare utöver ägaren har fått sina roller.

Slå sedan på `experts_public` och `studiehjalp` först. `experts_apply` öppnar själva insamlingen och ska slås på sist.

## Tester

- **SQL, RLS och RPC:** 122 kontroller i PGlite mot hela kedjan `0001`–`0029`.
  - Täcker vem som ser vad (sökande, granskare, anonym, annan användare), gränsen 1,15 mot 1,20 och 1,25, lärarmärket utan registerkontroll, beslutsregler, kvoter, gallring, tillbakadragande och roller.
- **API från början till slut:** 62 kontroller i Node mot en Postgres-baserad Supabase-attrapp. Kör serveråtgärderna, uppladdning med filtypskontroll, signerade URL:er, cron-routen och kontoradering.
- `npm run lint`, `npx tsc --noEmit` och `npm run build` går igenom.
- **Återstår:**
  - Webbläsartester av flödena. Playwright kraschade agentmiljön och kördes därför inte i sin helhet.
  - Att flytta in PGlite-riggen i repot (`scripts/db-test/`), som auditen föreslår i §5.4.

## Kvar till senare faser

- Abonnemang och entitlements (beslut 1), forumspärren (beslut 2) och annonser (beslut 3).
- BankID (beslut 5).
- Fas 2, bokning och betalning, väntar på bolaget (beslut 8).
- Fas 3, video, väntar på leverantör (beslut 9).

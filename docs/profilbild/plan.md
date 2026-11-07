# Profilbilder – plan

Beslut (Oscar, 2026-11-07, i projektchatten):

- Inloggade användare kan ladda upp och byta eller ta bort sin profilbild.
- Varje bild kontrolleras automatiskt av **Claude Opus 5.5** innan den syns för andra.
- Är kontrollen nere sparas bilden, men den syns bara för ägaren tills teamet har godkänt den.
- Andra användare kan rapportera en bild. Efter **3 rapporter från olika användare** döljs den tills teamet har
  granskat den.
- Bilden visas i menyn och på profilen, i forumet och i Duell och Alla mot alla.

Status: byggd 2026-11-07 (Oscar har gett klartecken att bygga planer utan ny godkännanderunda).

## Flöde

1. **I webbläsaren** väljer användaren en bild (JPEG, PNG eller WebP, högst 5 MB). Den beskärs till en kvadrat och
   förhandsvisas.
2. **`POST /api/profilbild`** (Node, Vercel):
   - Verifierar inloggningen med användarens access-token.
   - Läser bilden med `sharp`, beskär den till 256×256, kodar om den till WebP och tar bort all metadata
     (EXIF, plats).
   - Skickar den till Claude Opus 5.5 med våra regler och ett strikt JSON-svar: `allowed`, `category`, `reason`.
3. **Resultatet:**
   - *Godkänd:* bilden sparas i bucketen `avatars` och syns direkt.
   - *Inte godkänd:* inget sparas. Användaren får skälet ("Bilden godkändes inte: …").
   - *Claude avböjer att bedöma (refusal):* räknas som inte godkänd.
   - *Kontrollen svarar inte, eller API-nyckeln saknas:* bilden sparas som `pending`. Den syns bara för ägaren,
     märkt "Granskas av teamet", tills någon med rollen admin eller moderator godkänner den.
4. **`DELETE /api/profilbild`:** ägaren tar bort sin bild.

Regler för Claude: inget sexuellt eller utmanande, inget våld eller blod, inga vapen riktade mot någon, inga
droger, inga hatsymboler eller extremistsymboler, inget kränkande eller grovt språk i bilden, inga kontaktuppgifter
(telefonnummer, adresser, sociala medier) och ingen skärmdump av en annan persons profil. Ansikten och vanliga foton
är tillåtna, liksom djur, natur och tecknat.

## Databas (migration 0039)

- **`user_avatars`:** en rad per användare med `path`, `status` (`pending`/`approved`/`hidden`/`rejected`),
  `checked_by` (`claude`/`team`), `reason`, `updated_at`, `reviewed_at` och `reviewed_by`. RLS: ägaren läser sin
  egen rad. Skrivningar sker bara via servern (service-role) och via RPC:erna.
- **Vyn `public_avatars`:** `user_id` och `path` för godkända bilder. Den kan läsas av alla, eftersom forumet är
  publikt, men inte skrivas (till skillnad från `duel_public_profiles` före 0016).
- **`avatar_reports`:** en rapport per användare och bild. `avatar_report(p_user_id, p_reason)` kräver inloggning,
  att man inte rapporterar sig själv och att bilden är godkänd. Vid 3 öppna rapporter blir den `hidden`.
- **Bucketen `avatars`:** publik läsning, eftersom bilderna visas överallt. Sökvägen är `<user>/<uuid>.webp` och
  går inte att gissa. Inga skrivpolicyer för klienter; bara servern laddar upp och tar bort.
- **Granskning (rollen admin eller moderator, kontroll i databasen):**
  - `avatar_review_queue()` listar bilder som väntar på teamet och dolda bilder med rapporter.
  - `avatar_review(p_user_id, p_decision)` godkänner eller underkänner. Varje beslut skrivs till `admin_audit_log`.
  - En underkänd bild tas bort ur bucketen av servern.
- **`ama_state`:** spelarlistan får ett fält `avatar` (bara godkända bilder).

## Appen

- `/profil`: avsnittet Profilbild med uppladdning, förhandsvisning, status och knappen Ta bort.
- Komponenten `Avatar` visar bilden eller initialer som reserv och hämtar godkända bilder i klump från
  `public_avatars`. Klickar man på någon annans bild visas den större, med knappen "Rapportera bilden".
- Bilden visas i menyn (sidomeny och toppfält), i forumet (inlägg och svar), i Duell (spelarkorten) och i Alla mot
  alla (lobby och poängtavla).
- `/admin/profilbilder` (bara för rollen admin eller moderator): granskningskön med Godkänn och Ta bort. Länken
  finns i kontomenyn för personal.

## Integritet

- Integritetspolicyn får rader om profilbilden: vad som sparas, vem som ser den och att Anthropic kontrollerar den
  automatiskt (USA, Anthropic tränar inte på API-data). Bilden raderas med kontot.
- Uppladdningsrutan påminner: använd inte en bild på någon annan, och du behöver inte visa ansiktet.

## Driftsättning

- `ANTHROPIC_API_KEY` behöver läggas in i Vercel. Utan den hamnar alla nya bilder hos teamet (`pending`).
- Migration 0039 appliceras med `push_migrations`.

## Tester

- PGlite: RLS och rättigheter (ingen kan skriva andras rad, vyn kan inte skrivas, bara godkända syns, rapporter:
  inte sig själv, en per person, döljs vid 3), granskning bara för admin/moderator, revisionslogg, storage-policyer.
- Vitest: moderationssvar och reservfall (fel, refusal, saknad nyckel), validering av fil och typ.
- Webbläsare: uppladdning (godkänd och väntande), visning i meny, forum, duell och Alla mot alla, rapportering
  och granskning, mobil och desktop, ljust och mörkt läge.

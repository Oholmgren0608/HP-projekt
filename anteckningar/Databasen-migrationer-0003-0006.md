# Databasen: migrationerna 0003–0009 + manuell 0010 (2026-09-18)

## Läget före

Databasen (projekt `jhrycfampkrouwtsqxhx`) hade bara **0001 och 0002** körda. Det
förklarar varför Supabase security linter visade 12 varningar (0029/0028) för
`duel_*`-funktionerna: de kommer från 0002 och var de enda som fanns.

Att 0003, 0008 och 0009 aldrig var körda innebar att två funktioner var tyst trasiga:

- **Omdöme efter duell** (`duel_submit_review` + `duel_reviews`) misslyckades.
- **Veckans XP till topplistan** (`leaderboard_submit`, anropas vid varje XP-ändring
  i `gamification/provider.tsx`) misslyckades tyst. XP i sig ligger kvar lokalt.

## Varför 0009 aldrig kunde ha körts

`leaderboard_get` (language sql) joinar `leaderboard_entries le` med
`player_profiles pp`. **Båda tabellerna har kolumnen `updated_at`**, och funktionen
refererade den okvalificerad i både fönsterfunktionen och den avslutande
`order by` → `ERROR 42702: column reference "updated_at" is ambiguous`.

Felet var alltså inbyggt i filen som den committades, inte i databasen.

**Fixen:** `updated_at` → `le.updated_at` på båda ställena. Semantiken är
oförändrad (sorteringen sker fortsätter på topplisteradens egen tidsstämpel).
Samma fix är speglad i 0010:s implementation och i rollback-filen, så att
funktionskropparna förblir byte-identiska mellan filerna.

## Vad 0010 gör (manuell, ej migration)

Flyttar de 16 anropbara RPC-funktionerna till schemat `private` (som **inte** ligger
i `pgrst.db_schemas` och därför inte går att nå via `/rest/v1/rpc/`) och exponerar
tunna `SECURITY INVOKER`-wrappers med identiska namn, argument och
standardvärden i `public`. Klientkoden är oförändrad – samma `rpc("duel_…")`-anrop
fungerar som förut.

Syftet är att bli av med lint **0029/0028** ("SECURITY DEFINER-funktion körbar av
authenticated/anon") utan att ge upp behörighetsmodellen: implementationerna körs
fortsatt som `postgres` (som har `bypassrls`) och har kvar sina egna
`auth.uid()`-ägandekontroller, medan `public` inte längre innehåller någon
`SECURITY DEFINER`-funktion som någon roll kan köra.

**Konvention framåt:** en ny RPC = implementation i `private` + tunn wrapper i
`public`. Aldrig en `SECURITY DEFINER`-funktion direkt i `public`.

Filer: `supabase/manual/0010_duel_rpc_wrapper_hardening.sql`,
`..._rollback.sql` (återställer exakt dagens läge) och `..._verify.sql`
(read-only; avsnitt 0 visar läget i databasen, B/C visar resultatet efteråt).
Hela 0010 ligger nu i `supabase/manual/` (manuella verktyg, körs aldrig
automatiskt) och ingår **inte** i migrationskedjan `0001`–`0009`.

**Status:** 0010 är överspelad av `0004_duel_integrity`, som i stället gör
duell-RPC:erna server-auktoritativa. Eftersom 0010 återskapar de gamla
RPC-signaturerna och därmed backar `0004` får filen **aldrig** köras igen —
den sparas bara som referens.

**Nuance i live-databasen:** 0010 hade redan körts tidigare under sitt gamla
namn `0006_duel_rpc_wrapper_hardening`, så dess resultat finns i databasen:
de 16 `private.*`-implementationerna är kvar. Efter `0004` är de dock
**föräldralösa** — de publika funktionerna kommer från `0004` i stället.
Ofarliga rester; filen ligger kvar i `supabase/manual/` och får aldrig
appliceras igen.

## Verifierat live-läge (Management-API-frågor + Playwright mot live-DB)

Samtliga migrationer `0001`–`0010` finns nu i live-databasen. `0004`–`0007`
kördes i dag i ordning (`0004_duel_integrity`, `0005_questions`,
`0006_exam_import`, `0007_usernames`), paste som
`supabase/manual/apply-0004-0007.sql` i en körning. `0008`–`0010` kördes
tidigare under sina dåvarande namn.

| Migration | Status | Bevis |
| --- | --- | --- |
| `0001`–`0003` | APPLIED | — |
| `0004_duel_integrity` | APPLIED (i dag) | `duel_questions` 136 rader, vyn `duel_public_profiles` finns; RPC-signaturerna matchar klienten och gamla 5/3/4-args-varianterna är borta; `EXECUTE` = true för `authenticated`, false för `anon`; `duel_questions` har RLS med 0 policyer |
| `0005_questions` | APPLIED (i dag) | `questions` 146 rader, `reflect_prompts` 3 rader; publika SELECT-policyer för anon+authenticated |
| `0006_exam_import` | APPLIED (i dag) | `exams` finns med 0 rader (ingen import körd ännu) |
| `0007_usernames` | APPLIED (i dag) | kolumnen `player_profiles.username` finns |
| `0008_duel_rpc_hardening` | APPLIED UNDER OLD NAME | kördes tidigare som `0004_duel_rpc_hardening` (ej verifierbart via REST) |
| `0009_leaderboard` | APPLIED UNDER OLD NAME | `leaderboard_entries` finns med 3 policyer; kördes tidigare som `0005_leaderboard` |
| `0010_duel_rpc_wrapper_hardening` | APPLIED UNDER OLD NAME | de 16 `private.*`-implementationerna finns kvar; kördes tidigare som `0006_duel_rpc_wrapper_hardening` (nu föräldralösa, se ovan) |

Körning av appen mot live-DB (anonymt, ingen inloggning): alla sidor 200,
ORD-övning läser från Supabase (`/rest/v1/questions` 200, 146 rader;
`/rest/v1/reflect_prompts` 200, 3 rader), ingen `PGRST205`, ingen lokal
fallback. `/prov` visar "Inga importerade prov ännu" eftersom `exams` har
0 rader — import-pipelinen måste köras för att fylla den. 404 fortsatt
korrekt; 0 databasskrivningar (endast läsningar).

Åtgärden `supabase/manual/apply-0004-0007.sql` är **körd** (consumed) och
sparas bara som dokumentation över vad som applicerades.
`supabase/combined_migrations.sql` (0001 → 0009) bör fortfarande inte
klistras in blint eftersom allt redan finns i live-databasen.

**Otestsbart utan session (känd lucka, inte bugg):** duel
matchmaking/poängsättning, sätta användarnamn, publicera recensioner och
provimporten.

## Verifierat läge efter (test)körning av 0010

> Avser resultatet av 0010-körningen. Det resultatet finns i live-databasen
> under det gamla namnet `0006_duel_rpc_wrapper_hardening`, men är överspelat
> av `0004_duel_integrity` (implementationerna i `private` är föräldralösa).

| Kontroll | Resultat |
| --- | --- |
| Wrappers i `public` / implementationer i `private` | 16 / 16 |
| `SECURITY DEFINER` kvar i `public` | 0 |
| Tabeller, varav med RLS | 7 av 7 |
| Audit = lintervillkoret (0029 + 0028) | 0 rader |
| Ägare på alla funktioner och tabeller | `postgres` (bypassrls) |

Funktionstester körda i rullade tillbaka transaktioner som `authenticated`:
`leaderboard_submit`/`_get` (topplisterad skriven och läst, `is_me = true`),
`leaderboard_get` som `anon`, `duel_create_private`, `duel_start_bot_match`,
`duel_finish_bot`, `duel_submit_review`, `leaderboard_set_name`. Inga testdata kvar.

## Kvarstår

- `supabase_migrations.schema_migrations` är **fortfarande tom** trots att
  0001–0010 nu är körda. Kör man `supabase db push` senare tror CLI:t att
  inget är applicerat och kommer att köra om allt (och fallera på "already
  exists"). Använd
  `supabase migration repair --status applied 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 --linked`
  om/när CLI:t tas i bruk (obs: 0010 kördes under sitt gamla namn, så dess
  ledger-rad motsvarar ingen fil i `supabase/migrations/`). Tills dess: kör
  filerna manuellt i ordning enligt README.
- Ett B4-test i `..._verify.sql` (att `pgrst.db_schemas` inte är ändrat) är inte
  kört. Standardvärdet (`public`, `storage`, `graphql_public`) gäller om ingen
  medvetet ändrat det.
- **Stängd svaghet:** `duel_submit_answer`, `duel_mark_finished` och
  `duel_finish_bot` litade tidigare på poäng/svar från klienten. Efter
  `0004_duel_integrity` (APPLIED i dag) är rättningen server-auktoritativ:
  facit ligger i `duel_questions` (RLS, 0 policyer), klienten skickar inget
  rätt/fel eller totalpoäng och de gamla signaturerna är borttagna. Kvar som
  testlucka: de klientflöden som kräver en session (matchmaking, poäng,
  användarnamn, recensioner, provimport).

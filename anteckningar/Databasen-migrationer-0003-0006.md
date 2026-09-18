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
RPC-signaturerna och därmed backar `0004` får filen **aldrig** köras mot
nuvarande kod — den sparas bara som referens.

## Verifierat live-läge (read-only REST-prober)

| Migration | Status | Bevis |
| --- | --- | --- |
| `0001`–`0003` | APPLIED | — |
| `0004_duel_integrity` | PENDING | `duel_questions` och vyn `duel_public_profiles` saknas |
| `0005_questions` | PENDING | `questions`/`reflect_prompts` saknas → `PGRST205` |
| `0006_exam_import` | PENDING | `exams` saknas och bucketen `prov-figures` finns inte |
| `0007_usernames` | PENDING | `player_profiles.username` saknas → `42703` |
| `0008_duel_rpc_hardening` | ALREADY APPLIED UNDER OLD NAME | kördes tidigare som `0004_duel_rpc_hardening` (ej verifierbart via REST) |
| `0009_leaderboard` | ALREADY APPLIED UNDER OLD NAME | `leaderboard_entries` finns; kördes tidigare som `0005_leaderboard` |

Rekommenderad åtgärd för de fyra PENDING-migrationerna:
`supabase/manual/apply-0004-0007.sql`. `supabase/combined_migrations.sql`
(0001 → 0009) bör inte klistras in blint eftersom 0001–0003/0008/0009 redan
finns i live-databasen.

## Verifierat läge efter (test)körning av 0010

> Avser resultatet av 0010-körningen, inte den nuvarande live-databasen —
> där är 0010 inte applicerad (se live-läget ovan).

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

- `supabase_migrations.schema_migrations` är **tom** trots att 0001–0003 samt 0008–0009 är körda.
  Kör man `supabase db push` senare tror CLI:t att inget är applicerat och kommer
  att köra om allt (och fallera på "already exists"). Använd
  `supabase migration repair --status applied 0001 0002 0003 0008 0009 --linked`
  om/när CLI:t tas i bruk. Tills dess: kör filerna manuellt i ordning enligt README.
- Ett B4-test i `..._verify.sql` (att `pgrst.db_schemas` inte är ändrat) är inte
  kört. Standardvärdet (`public`, `storage`, `graphql_public`) gäller om ingen
  medvetet ändrat det.
- **Känd kvarvarande svaghet i live:** `duel_submit_answer`, `duel_mark_finished`
  och `duel_finish_bot` litar på de poäng/svar som klienten skickar in. Facit
  finns bara i frontend (`practice.ts` m.fl.), så rankad ELO kan manipuleras från
  webbläsaren. Åtgärden finns redan färdig i `0004_duel_integrity` (facit i
  `duel_questions`, server-auktoritativa 4/1/2-args-RPC:er) — kör den, enklast
  via `supabase/manual/apply-0004-0007.sql`, för att stänga svagheten.

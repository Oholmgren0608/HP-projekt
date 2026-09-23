-- 0011_leaderboard_write_policies.sql
-- ---------------------------------------------------------------------------
-- Mål: stänga den direkta skrivvägen till `leaderboard_entries`.
--
-- Bakgrund: 0009 skapade `leaderboard_insert_own` och `leaderboard_update_own`
-- med kommentaren "Endast egen rad får skrivas (sker via RPC:n nedan)". Det
-- stämde inte - policyerna tillät vilken inloggad klient som helst att skriva
-- sin egen rad direkt via PostgREST och därmed sätta ett godtyckligt XP-värde
-- (verifierat: POST 201, PATCH {"xp": 999999} 200). `leaderboard_submit` är
-- SECURITY DEFINER och kringgår RLS, så den fortsätter fungera oförändrat.
--
-- Klienten använder bara RPC:erna (`src/lib/gamification/leaderboard.ts`),
-- aldrig tabellen direkt, så det här påverkar ingen funktion i appen.
--
-- Kvar efteråt: `leaderboard_select` (publik läsning) - topplistan ska vara
-- läsbar även anonymt.
--
-- Kör med `supabase db push` eller i Dashboard -> SQL Editor.
-- ---------------------------------------------------------------------------

drop policy if exists "leaderboard_insert_own" on public.leaderboard_entries;
drop policy if exists "leaderboard_update_own" on public.leaderboard_entries;

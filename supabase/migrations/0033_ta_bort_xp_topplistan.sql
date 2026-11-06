-- 0033_ta_bort_xp_topplistan.sql
-- ---------------------------------------------------------------------------
-- Mål: ta bort vecko-topplistan för XP (docs/KNOWN_ISSUES.md, "Weekly XP
-- leaderboard trusts client-reported XP"). Beslut av Oscar 2026-11-06,
-- inklusive att tabellen och dess data raderas.
--
-- Bakgrund: XP räknas i webbläsaren, och facit för övningarna är offentligt med
-- flit (AGENTS.md §6). En XP-topplista kan därför aldrig bli pålitlig.
-- leaderboard_submit tog emot vilket värde som helst upp till 25 000 per vecka,
-- och leaderboard_get gick att anropa anonymt (användar-id, namn och XP).
-- Ingen skärm i appen visade listan, och klienten slutar skicka in XP i samma
-- ändring.
--
-- Raderas: leaderboard_submit, leaderboard_get, leaderboard_set_name (stängd
-- sedan 0016), private.leaderboard_submit (finns bara om den manuella
-- 0010-härdningen kördes) och tabellen leaderboard_entries med sina policyer.
--
-- Kvar: player_profiles. leaderboard_submit skapade en profil åt den som inte
-- hade någon; de raderna används av dueller och forum och rörs inte.
--
-- Tester: ~/.cache/hp-db-test/test-0033.mjs (PGlite).
-- ---------------------------------------------------------------------------

drop function if exists public.leaderboard_submit(text, integer);
drop function if exists public.leaderboard_get(text, integer);
drop function if exists public.leaderboard_set_name(text);

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'private') then
    drop function if exists private.leaderboard_submit(text, integer);
  end if;
end;
$$;

drop table if exists public.leaderboard_entries;

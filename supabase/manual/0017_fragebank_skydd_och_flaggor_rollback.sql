-- ============================================================================
-- 0017_fragebank_skydd_och_flaggor_rollback.sql
--
-- NÄR: Kör den här filen ENDAST efter att en person har beslutat att 0017
--      ska ångras, och bara om `0017_fragebank_skydd_och_flaggor.sql` redan
--      är applicerad. Kör den i Supabase Dashboard -> SQL Editor.
--
-- VAD: Backar 0017, i omvänd ordning:
--        1. Default för questions.status blir 'published' igen (0017:10).
--        2. Duellfacit synkas inte längre: trigger och funktion tas bort
--           (0017:9). Raderna i duel_questions ligger kvar.
--        3. Triggern som stänger flaggor vid ny publicering tas bort (0017:8).
--        4. question_flag och tabellen question_flags tas bort (0017:6-7).
--        5. Kolumnerna verification och verification_note tas bort (0017:3).
--        6. Läsregeln heter "public read questions" igen och släpper igenom
--           utkast och refuserade frågor - men inte Provfrågor (0017:2, se
--           BEHÅLLS).
--        7. CHECK-villkoret questions_provfraga_aldrig_publicerad tas bort
--           (0017:1). En Provfråga som ändå publiceras döljs av läsregeln.
--
-- TAR BORT DATA: alla flaggor (question_flags) och alla resultat från AI:ns
--      andra kontroll (questions.verification och verification_note). De går
--      inte att få tillbaka utan backup.
--
-- EXPONERAR IGEN: utkast och refuserade Övningsfrågor blir läsbara för alla
--      via API:t (anon och authenticated), som före 0017.
--
-- BEHÅLLS (skyddet för Provfrågor backas inte):
--        * Läsregeln släpper aldrig igenom Provfrågor:
--          `using (exam_id is null and id not like 'hp-%')` i stället för
--          0005:s `using (true)`.
--        * Bucketen prov-figures förblir privat.
--        * forum_post_to_question behålls som i 0017 (kopierar bara
--          publicerade frågor). 0012-versionen kopierade text ur vilken fråga
--          som helst, även Provfrågor, till publika trådtitlar.
--      Att backa något av detta kräver ett eget beslut.
--
-- ÅTERSTÄLLS INTE (det gamla läget går inte att veta, eller ska inte
--      tillbaka):
--        * Provfrågor som 0017 avpublicerade förblir 'draft'.
--        * Duellfacit som 0017 lade till eller rättade ligger kvar - att ta
--          bort dem skulle ge 'unknown question' i dueller.
--        * Forumtitlar.
--
-- KÖRNING: Hela filen körs som ett block (begin/commit); går något fel rullas
--          allt tillbaka och inget halvt läge uppstår. Kör EFTERÅT, så att
--          migrationshistoriken stämmer (annars tror `db push` att 0017
--          fortfarande är applicerad):
--            npm run db -- migration repair --status reverted 0017
--          0017 kan sedan köras igen med `npm run db:dry` och `npm run db:push`.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Default 'published' för status, som i 0006.
-- ----------------------------------------------------------------------------
alter table public.questions
  alter column status set default 'published';

-- ----------------------------------------------------------------------------
-- 2. Duellfacit: sluta synka (raderna i duel_questions ligger kvar).
-- ----------------------------------------------------------------------------
drop trigger if exists questions_sync_duel_facit on public.questions;
drop function if exists public.questions_sync_duel_facit();

-- ----------------------------------------------------------------------------
-- 3. Triggern som stänger flaggor vid ny publicering.
-- ----------------------------------------------------------------------------
drop trigger if exists questions_resolve_flags_on_publish on public.questions;
drop function if exists public.questions_resolve_flags_on_publish();

-- ----------------------------------------------------------------------------
-- 4. Flaggor (DATA GÅR FÖRLORAD).
-- ----------------------------------------------------------------------------
drop function if exists public.question_flag(text, text);
drop table if exists public.question_flags;

-- ----------------------------------------------------------------------------
-- 5. AI-kontrollens kolumner (DATA GÅR FÖRLORAD).
-- ----------------------------------------------------------------------------
alter table public.questions
  drop column if exists verification_note,
  drop column if exists verification;

-- ----------------------------------------------------------------------------
-- 6. Läsregeln: allt utom Provfrågor (inte 0005:s `using (true)`).
-- ----------------------------------------------------------------------------
drop policy if exists "questions_select_published" on public.questions;
drop policy if exists "public read questions" on public.questions;
create policy "public read questions" on public.questions
  for select to anon, authenticated
  using (exam_id is null and id not like 'hp-%');

-- ----------------------------------------------------------------------------
-- 7. CHECK-villkoret för Provfrågor.
-- ----------------------------------------------------------------------------
alter table public.questions
  drop constraint if exists questions_provfraga_aldrig_publicerad;

commit;

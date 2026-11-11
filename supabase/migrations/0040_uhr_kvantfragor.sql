-- 0040: UHR:s kvantitativa frågor får publiceras (docs/uhr-fragor/plan.md,
-- tillstånd: docs/juridik/uhr-tillstand-kvant.md, Oscar 2026-11-11).
--
-- * Provfrågor (exam_id satt, id hp-…) i XYZ, KVA, NOG och DTK får publiceras
--   när de har en riktig förklaring. Verbala Provfrågor (ORD, LÄS, MEK, ELF)
--   förblir spärrade i databasen: UHR har inte gett tillstånd för dem än.
-- * En publicerad Provfråga ligger alltid i övningspoolen ('ovning'): den är
--   publik som alla övningsfrågor, och facit finns ändå publikt hos UHR.
-- * Spelen (duell och Alla mot alla) väljer UHR:s frågor först i XYZ, KVA och
--   NOG och fyller på med AI-frågorna i spelpoolen (Oscars beslut; risken att
--   facit kan slås upp är accepterad, ADR 0001 är uppdaterad).
-- * Inget raderas och ingen fråga publiceras av migrationen: frågorna
--   publiceras efter stickprov på /review.
--
-- Säkerhet (AGENTS.md regel 1 och 6): RLS är oförändrad (anon/authenticated
-- läser bara publicerade frågor); villkoret nedan är det som håller verbala
-- Provfrågor och frågor utan förklaring borta. Test: ~/.cache/hp-db-test/test-0040.mjs.

-- ---------------------------------------------------------------------------
-- 1. Vilka Provfrågor som får publiceras
-- ---------------------------------------------------------------------------
alter table public.questions
  drop constraint if exists questions_provfraga_aldrig_publicerad;
alter table public.questions
  drop constraint if exists questions_provfraga_publicering;
alter table public.questions
  add constraint questions_provfraga_publicering
  check (
    status <> 'published'
    or (exam_id is null and id not like 'hp-%')
    or (
      exam_id is not null
      and id like 'hp-%'
      and kind in ('xyz', 'kva', 'nog', 'dtk')
      and pool = 'ovning'
      and btrim(coalesce(explain, '')) <> ''
      and explain not like 'Förklaring saknas ännu%'
      and explain not like 'FLAGGOR:%'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Frågeval i spelen: UHR-frågor först, sedan spelpoolen
-- ---------------------------------------------------------------------------
-- Samma signatur och fördelning som i 0037. Kandidaterna är spelpoolen och
-- publicerade kvantitativa UHR-frågor. Inom ett delprov kommer frågor som
-- ingen av spelarna fått de senaste 30 dagarna först, och bland dem
-- UHR-frågorna före AI-frågorna; sedan slump.
create or replace function public.pool_pick_questions(
  p_users uuid[],
  p_kinds text[],
  p_count integer
)
returns table (idx smallint, question_id text, kind text)
language sql
volatile
security definer
set search_path = public
as $$
  with ranked as (
    select q.id,
           q.kind,
           row_number() over (
             partition by q.kind
             order by exists (
               select 1 from public.pool_question_views v
                where v.question_id = q.id
                  and v.user_id = any (p_users)
                  and v.viewed_at > now() - interval '30 days'
             ),
             q.exam_id is null,
             random()
           ) as rn
      from public.questions q
     where q.status = 'published'
       and q.kind = any (p_kinds)
       and (
         q.pool = 'spel'
         or (q.exam_id is not null and q.kind in ('xyz', 'kva', 'nog'))
       )
  ),
  picked as (
    select id, kind from ranked order by rn, random() limit greatest(0, p_count)
  )
  select (row_number() over (order by random()) - 1)::smallint, id, kind from picked;
$$;

revoke execute on function public.pool_pick_questions(uuid[], text[], integer) from public, anon, authenticated;

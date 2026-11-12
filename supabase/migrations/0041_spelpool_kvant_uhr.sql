-- 0041: spelens kvantitativa frågor är UHR-frågor (Oscar, 2026-11-12: "alla
-- kvant frågor i spelpoolen är UHR-frågor ... utöka till så mycket som möjligt").
--
-- * Duell och Alla mot alla väljer XYZ, KVA och NOG bara bland publicerade
--   UHR-frågor, alla som finns (1 456 när alla är publicerade). ORD och MEK
--   kommer som förut ur den stängda spelpoolen.
-- * Reserv: har ett kvantitativt delprov ännu ingen publicerad UHR-fråga väljs
--   appens egna frågor i det delprovet, så att spelen fungerar fram till
--   publiceringen. Så fort en UHR-fråga i delprovet är publicerad väljs bara
--   UHR-frågor där.
-- * AI-frågorna i XYZ, KVA och NOG som låg i spelpoolen (40 per delprov,
--   0036) används inte längre i spelen och flyttas tillbaka till övningen.
--   Inget raderas.
--
-- Säkerhet (AGENTS.md regel 6): RLS och rättigheter är oförändrade. De flyttade
-- frågorna blir läsbara som alla övningsfrågor (policyn questions_select_published);
-- de används inte längre i tävlingslägena. Test: ~/.cache/hp-db-test/test-0041.mjs.

-- ---------------------------------------------------------------------------
-- 1. Frågeval i spelen
-- ---------------------------------------------------------------------------
-- Samma signatur, fördelning och 30-dagarsregel som i 0037/0040.
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
  with uhr_kinds as (
    select distinct u.kind
      from public.questions u
     where u.status = 'published'
       and u.exam_id is not null
       and u.id like 'hp-%'
       and u.kind in ('xyz', 'kva', 'nog')
  ),
  ranked as (
    select q.id,
           q.kind,
           row_number() over (
             partition by q.kind
             order by exists (
               select 1 from public.pool_question_views v
                where v.question_id = q.id
                  and v.user_id = any (p_users)
                  and v.viewed_at > now() - interval '30 days'
             ), random()
           ) as rn
      from public.questions q
     where q.status = 'published'
       and q.kind = any (p_kinds)
       and (
         -- XYZ, KVA, NOG: UHR-frågorna ...
         (q.kind in ('xyz', 'kva', 'nog') and q.exam_id is not null and q.id like 'hp-%')
         -- ... eller appens egna frågor så länge delprovet saknar publicerade UHR-frågor.
         or (q.kind in ('xyz', 'kva', 'nog') and q.exam_id is null and q.id not like 'hp-%'
             and q.kind not in (select kind from uhr_kinds))
         -- ORD och MEK: den stängda spelpoolen.
         or (q.kind in ('ord', 'mek') and q.pool = 'spel')
       )
  ),
  picked as (
    select id, kind from ranked order by rn, random() limit greatest(0, p_count)
  )
  select (row_number() over (order by random()) - 1)::smallint, id, kind from picked;
$$;

revoke execute on function public.pool_pick_questions(uuid[], text[], integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. AI-frågorna i XYZ, KVA och NOG tillbaka till övningen
-- ---------------------------------------------------------------------------
update public.questions
   set pool = 'ovning'
 where pool = 'spel'
   and kind in ('xyz', 'kva', 'nog')
   and exam_id is null
   and id not like 'hp-%';

-- 0036: 40 publicerade övningsfrågor per delprov (ORD, MEK, XYZ, KVA, NOG)
-- flyttas till spelpoolen (ADR 0001). Inget raderas: frågorna får bara
-- pool = 'spel' och försvinner därmed ur övningen och offlinekopian.
--
-- * Bara publicerade Övningsfrågor (inga Provfrågor, inga utkast).
-- * Frågor med öppna felrapporter tas inte med.
-- * Urvalet är deterministiskt (md5 av id), så dry run och skarp körning väljer
--   samma frågor och en omkörning ändrar ingenting.
-- * Finns redan 40 eller fler poolfrågor i ett delprov flyttas inga fler.
--
-- Backa: supabase/manual/0036_flytta_till_spelpool_rollback.sql.

with kandidater as (
  select q.id,
         q.kind,
         row_number() over (partition by q.kind order by md5(q.id), q.id) as nr
    from public.questions q
   where q.status = 'published'
     and q.pool = 'ovning'
     and q.exam_id is null
     and q.id not like 'hp-%'
     and q.kind in ('ord', 'mek', 'xyz', 'kva', 'nog')
     and not exists (
       select 1 from public.question_flags f
        where f.question_id = q.id and f.resolved_at is null
     )
),
redan as (
  select kind, count(*)::int as n
    from public.questions
   where pool = 'spel' and status = 'published'
   group by kind
)
update public.questions q
   set pool = 'spel'
  from kandidater k
  left join redan r on r.kind = k.kind
 where q.id = k.id
   and k.nr <= greatest(0, 40 - coalesce(r.n, 0));

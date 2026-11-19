-- 0043: spelen utan MEK, och duellerna främst UHR-frågor (Oscar, 2026-11-19: "Ta bort alla
-- verbala frågor förutom ord frågorna från duellerna ... frågorna ska främst vara UHR frågorna";
-- via ask_person: även Alla mot alla, och 2 ORD + 8 UHR per duell).
--
-- * Duell och Alla mot alla har ORD, XYZ, KVA och NOG. MEK väljs aldrig mer (LÄS och ELF var
--   aldrig med). ORD är appens egna frågor ur den stängda spelpoolen, eftersom UHR:s verbala
--   frågor är spärrade (AGENTS.md regel 1); XYZ, KVA och NOG är UHR-frågor (0041).
-- * En duell får 2 ORD-frågor och 8 UHR-frågor (jämnt över XYZ, KVA och NOG: 3, 3, 2), i slumpad
--   ordning. Pågående matcher behåller sina frågor.
-- * Alla mot alla: MEK går inte längre att välja, och rum som väntar på start med MEK får det
--   borttaget (ett rum med bara MEK får alla fyra delproven). Pågående och avslutade spel rörs inte.
-- * De 40 MEK-frågorna i spelpoolen (0036) flyttas tillbaka till övningen. Inget raderas.
--
-- Säkerhet (AGENTS.md regel 6): RLS och rättigheter är oförändrade. De flyttade MEK-frågorna blir
-- läsbara som alla övningsfrågor (policyn questions_select_published); de används inte längre i
-- tävlingslägena. Test: ~/.cache/hp-db-test/test-0043.mjs.

-- ---------------------------------------------------------------------------
-- 1. Frågeval i spelen: ORD ur spelpoolen, XYZ/KVA/NOG ur UHR-frågorna, aldrig MEK
-- ---------------------------------------------------------------------------
-- Samma signatur, fördelning och 30-dagarsregel som i 0041.
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
         -- ORD: den stängda spelpoolen. MEK är inte längre med i spelen.
         or (q.kind = 'ord' and q.pool = 'spel')
       )
  ),
  picked as (
    select id, kind from ranked order by rn, random() limit greatest(0, p_count)
  )
  select (row_number() over (order by random()) - 1)::smallint, id, kind from picked;
$$;

revoke execute on function public.pool_pick_questions(uuid[], text[], integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Duellens frågor: 2 ORD och 8 UHR-frågor
-- ---------------------------------------------------------------------------
-- Matchens frågor skapas en gång, under radlås på matchen (som i 0037).
create or replace function public.duel_ensure_questions(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.duel_matches%rowtype;
  v_users uuid[];
  v_n integer;
begin
  select count(*) into v_n from public.duel_match_questions where match_id = p_match_id;
  if v_n > 0 then return v_n; end if;

  select * into v_match from public.duel_matches where id = p_match_id for update;
  select count(*) into v_n from public.duel_match_questions where match_id = p_match_id;
  if v_n > 0 then return v_n; end if;

  v_users := array_remove(array[v_match.player_a, v_match.player_b], null);

  insert into public.duel_match_questions (match_id, idx, question_id, kind)
  select p_match_id, (row_number() over (order by random()) - 1)::smallint, s.question_id, s.kind
    from (
      select o.question_id, o.kind from public.pool_pick_questions(v_users, array['ord'], 2) o
      union all
      select u.question_id, u.kind from public.pool_pick_questions(v_users, array['xyz', 'kva', 'nog'], 8) u
    ) s;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    raise exception 'Spelpoolen har inga frågor ännu.';
  end if;
  return v_n;
end;
$$;

revoke execute on function public.duel_ensure_questions(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Alla mot alla: MEK går inte att välja
-- ---------------------------------------------------------------------------
create or replace function public.ama_valid_kinds(p_kinds text[])
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array(
    select distinct k from unnest(p_kinds) k
     where k in ('ord', 'xyz', 'kva', 'nog')
     order by k
  ), array[]::text[]);
$$;

revoke execute on function public.ama_valid_kinds(text[]) from public, anon, authenticated;

-- Slumpade lobbyspel skapas med kolumnens standardvärde.
alter table public.ama_games alter column kinds set default array['ord', 'xyz', 'kva', 'nog'];

-- Rum som väntar på start: ta bort MEK, och ge ett rum som bara hade MEK alla fyra delproven.
update public.ama_games
   set kinds = case
                 when cardinality(array_remove(kinds, 'mek')) = 0 then array['ord', 'xyz', 'kva', 'nog']
                 else array_remove(kinds, 'mek')
               end
 where status = 'waiting'
   and 'mek' = any (kinds);

-- ---------------------------------------------------------------------------
-- 4. MEK-frågorna i spelpoolen tillbaka till övningen
-- ---------------------------------------------------------------------------
update public.questions
   set pool = 'ovning'
 where pool = 'spel'
   and kind = 'mek';

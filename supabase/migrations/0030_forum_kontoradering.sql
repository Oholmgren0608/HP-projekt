-- 0030: Kontoradering raderar inte längre andras foruminlägg.
--
-- Fel (docs/studiehjalp/fas-0-nulagesaudit.md, 2.10): forum_posts.author_id
-- hade on delete cascade mot auth.users och parent_id on delete cascade mot
-- forum_posts (0012). När någon raderade sitt konto försvann alla deras
-- inlägg, och med dem alla svar som andra hade skrivit på inläggen.
--
-- Nu, när ett konto raderas:
--   * Inläggen finns kvar men anonymiseras: author_id blir null, texten byts
--     mot samma markör som när ett inlägg tas bort, och inlägget räknas som
--     borttaget. Andras svar och trådarna finns kvar. Författaren visas som
--     "Raderat konto".
--   * Kontots röster försvinner som förut, men inläggens röstsummor och
--     skribenternas rykte räknas nu om i stället för att bli inaktuella.
--   * I trådar vars startare har raderat kontot (created_by null) kan bara
--     moderatorer ändra bästa svar. Förut släppte jämförelsen mot null igenom
--     alla. Bästa svaret ger också fortfarande rykte; förut föll det bort
--     vid nästa omräkning.
-- Dessutom:
--   * parent_id får on delete set null, så att ett svar aldrig följer med när
--     ett inlägg raderas på riktigt.
--   * När bästa svar flyttas räknas även det tidigare svarets rykte om.
--
-- Migrationen raderar inga rader. Räknarna räknas om från källan
-- (forum_votes och forum_posts), som i 0013.
-- Rollback: supabase/manual/0030_forum_kontoradering_rollback.sql.

-- ---------------------------------------------------------------------------
-- 1. Främmande nycklar
-- ---------------------------------------------------------------------------

alter table public.forum_posts alter column author_id drop not null;

-- Ta bort de gamla nycklarna oavsett vad de heter.
do $$
declare
  v_con record;
begin
  for v_con in
    select c.conname
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.conrelid = 'public.forum_posts'::regclass
       and c.contype = 'f'
       and cardinality(c.conkey) = 1
       and a.attname in ('author_id', 'parent_id')
  loop
    execute format('alter table public.forum_posts drop constraint %I', v_con.conname);
  end loop;
end;
$$;

alter table public.forum_posts
  add constraint forum_posts_author_id_fkey
    foreign key (author_id) references auth.users (id) on delete set null,
  add constraint forum_posts_parent_id_fkey
    foreign key (parent_id) references public.forum_posts (id) on delete set null;

-- Index för de nycklar som saknade det, så att kontoradering inte söker
-- igenom hela tabellerna.
create index if not exists forum_threads_created_by_idx on public.forum_threads (created_by);
create index if not exists forum_posts_deleted_by_idx on public.forum_posts (deleted_by)
  where deleted_by is not null;
create index if not exists forum_reports_reporter_idx on public.forum_reports (reporter_id);

-- ---------------------------------------------------------------------------
-- 2. Anonymisering när författarens konto raderas
-- ---------------------------------------------------------------------------

-- on delete set null sätter author_id till null; då skrivs innehållet över.
create or replace function public.forum_posts_anonymize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.body := '[Inlägget har tagits bort]';
  new.is_deleted := true;
  new.is_best := false;
  return new;
end;
$$;

revoke all on function public.forum_posts_anonymize() from public, anon, authenticated;

drop trigger if exists forum_posts_anonymize on public.forum_posts;
create trigger forum_posts_anonymize
  before update of author_id on public.forum_posts
  for each row
  when (old.author_id is not null and new.author_id is null)
  execute function public.forum_posts_anonymize();

-- Trådens antal inlägg räknar bara inlägg som inte är borttagna.
create or replace function public.forum_posts_after_anonymize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted)
   where t.id = new.thread_id;
  return null;
end;
$$;

revoke all on function public.forum_posts_after_anonymize() from public, anon, authenticated;

drop trigger if exists forum_posts_after_anonymize on public.forum_posts;
create trigger forum_posts_after_anonymize
  after update of author_id on public.forum_posts
  for each row
  when (old.author_id is not null and new.author_id is null)
  execute function public.forum_posts_after_anonymize();

-- ---------------------------------------------------------------------------
-- 3. Röster som försvinner
-- ---------------------------------------------------------------------------

-- Gäller alla borttagna röster: när väljarens konto raderas (cascade) och när
-- någon tar bort sin röst (forum_vote räknar då om en gång till, vilket inte
-- ändrar något). Rykte räknas bara om för konton som finns kvar.
create or replace function public.forum_votes_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  update public.forum_posts p
     set up_votes = c.upp,
         down_votes = c.ner
    from (
      select count(*) filter (where v.value = 1)::int as upp,
             count(*) filter (where v.value = -1)::int as ner
        from public.forum_votes v
       where v.post_id = old.post_id
    ) c
   where p.id = old.post_id
  returning p.author_id into v_author;

  if v_author is not null and exists (select 1 from auth.users u where u.id = v_author) then
    perform public.forum_recalc_reputation(v_author);
  end if;
  return null;
end;
$$;

revoke all on function public.forum_votes_after_delete() from public, anon, authenticated;

drop trigger if exists forum_votes_after_delete on public.forum_votes;
create trigger forum_votes_after_delete
  after delete on public.forum_votes
  for each row
  execute function public.forum_votes_after_delete();

-- ---------------------------------------------------------------------------
-- 4. Rykte och bästa svar när trådstartaren saknas
-- ---------------------------------------------------------------------------

-- Som 0013, men bästa svar räknas även när trådstartaren har raderat kontot
-- (created_by null). Egna bästa svar ger fortfarande inga poäng.
create or replace function public.forum_recalc_reputation(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_upp integer;
  v_ner integer;
  v_basta integer;
begin
  select count(*) filter (where v.value = 1)::int,
         count(*) filter (where v.value = -1)::int
    into v_upp, v_ner
    from public.forum_votes v
    join public.forum_posts p on p.id = v.post_id
   where p.author_id = p_user and not p.is_deleted;

  select count(*)::int
    into v_basta
    from public.forum_posts p
    join public.forum_threads t on t.id = p.thread_id
   where p.author_id = p_user
     and p.is_best
     and not p.is_deleted
     and t.created_by is distinct from p_user;

  insert into public.forum_reputation (user_id, points, upvotes_received, downvotes_received, best_answers)
  values (p_user, greatest(2 * v_upp - v_ner + 15 * v_basta, 0), v_upp, v_ner, v_basta)
  on conflict (user_id) do update
    set points = greatest(2 * excluded.upvotes_received - excluded.downvotes_received + 15 * excluded.best_answers, 0),
        upvotes_received = excluded.upvotes_received,
        downvotes_received = excluded.downvotes_received,
        best_answers = excluded.best_answers,
        updated_at = now();
end;
$$;

-- Som 0013, men en tråd utan startare kan bara ändras av en moderator, och
-- rykte räknas om även för den vars svar förlorar markeringen.
create or replace function public.forum_mark_best(p_post_id uuid, p_best boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_thread uuid;
  v_author uuid;
  v_startare uuid;
  v_ar_moderator boolean;
  v_tidigare uuid;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select p.thread_id, p.author_id, t.created_by
    into v_thread, v_author, v_startare
    from public.forum_posts p
    join public.forum_threads t on t.id = p.thread_id
   where p.id = p_post_id and not p.is_deleted;

  if v_thread is null then
    raise exception 'POST_NOT_FOUND';
  end if;

  v_ar_moderator := exists (select 1 from public.forum_moderators m where m.user_id = v_user);

  if v_startare is distinct from v_user and not v_ar_moderator then
    raise exception 'NOT_ALLOWED';
  end if;

  select p.author_id into v_tidigare
    from public.forum_posts p
   where p.thread_id = v_thread and p.is_best;

  -- Två steg: först rensa, sedan sätta - det unika indexet kontrolleras per rad.
  update public.forum_posts p set is_best = false where p.thread_id = v_thread and p.is_best;
  if coalesce(p_best, true) then
    update public.forum_posts p set is_best = true where p.id = p_post_id;
  end if;

  perform public.forum_recalc_reputation(v_author);
  if v_tidigare is not null and v_tidigare is distinct from v_author then
    perform public.forum_recalc_reputation(v_tidigare);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. "Raderat konto" i stället för "Spelare"
-- ---------------------------------------------------------------------------

-- Som 0012, men raderade konton får ett eget namn och is_mine/is_op är aldrig
-- null.
create or replace function public.forum_thread_posts(p_thread_id uuid)
returns table (
  id uuid,
  parent_id uuid,
  author_id uuid,
  author_name text,
  body text,
  created_at timestamptz,
  up_votes integer,
  down_votes integer,
  is_best boolean,
  is_deleted boolean,
  my_vote smallint,
  is_mine boolean,
  is_op boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         p.parent_id,
         p.author_id,
         case when p.author_id is null then 'Raderat konto'
              else coalesce(pp.display_name, 'Spelare') end::text,
         p.body,
         p.created_at,
         p.up_votes,
         p.down_votes,
         p.is_best,
         p.is_deleted,
         (select v.value from public.forum_votes v where v.post_id = p.id and v.user_id = auth.uid()),
         coalesce(auth.uid() = p.author_id, false),
         coalesce(p.author_id = t.created_by, false)
  from public.forum_posts p
  join public.forum_threads t on t.id = p.thread_id
  left join public.player_profiles pp on pp.user_id = p.author_id
  where p.thread_id = p_thread_id
  order by p.is_best desc, p.created_at asc;
$$;

-- Som 0012, men en tråd vars startare har raderat kontot visar "Raderat konto".
create or replace function public.forum_thread_list(
  p_sort text default 'new',
  p_kind text default null,
  p_search text default null,
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  id uuid,
  question_id text,
  kind text,
  title text,
  created_at timestamptz,
  last_activity_at timestamptz,
  post_count integer,
  score integer,
  solved boolean,
  author_name text,
  preview text
)
language sql
stable
security definer
set search_path = public
as $$
  with bas as (
    select t.*,
           (select count(*)::int from public.forum_posts p
             where p.thread_id = t.id and not p.is_deleted) as antal,
           (select coalesce(sum(p.up_votes - p.down_votes), 0)::int from public.forum_posts p
             where p.thread_id = t.id and not p.is_deleted) as poang,
           (select p.body from public.forum_posts p
             where p.thread_id = t.id and not p.is_deleted order by p.created_at limit 1) as forsta,
           (select coalesce(pp.display_name, 'Spelare') from public.player_profiles pp
             where pp.user_id = t.created_by) as namn,
           exists (select 1 from public.forum_posts p
                    where p.thread_id = t.id and p.is_best and not p.is_deleted) as lost
    from public.forum_threads t
  )
  select b.id,
         b.question_id,
         b.kind,
         b.title,
         b.created_at,
         b.last_activity_at,
         b.antal,
         b.poang,
         b.lost,
         case when b.created_by is null then 'Raderat konto'
              else coalesce(b.namn, 'Spelare') end::text,
         coalesce(left(b.forsta, 180), '')::text
  from bas b
  where (p_kind is null or b.kind = p_kind)
    and (
      p_search is null
      or p_search = ''
      or b.title ilike '%' || p_search || '%'
      or b.question_id ilike '%' || p_search || '%'
      or exists (
        select 1 from public.forum_posts p
        where p.thread_id = b.id and not p.is_deleted and p.body ilike '%' || p_search || '%'
      )
    )
    and (p_sort <> 'unanswered' or b.antal <= 1)
  order by
    case when p_sort = 'popular' then b.poang end desc nulls last,
    case when p_sort = 'new' then b.created_at end desc nulls last,
    b.last_activity_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- Som 0014, men anmälda inlägg från raderade konton visar "Raderat konto".
create or replace function public.forum_moderator_reports(p_limit integer default 50)
returns table (
  report_id uuid,
  post_id uuid,
  thread_id uuid,
  question_id text,
  reason text,
  status text,
  created_at timestamptz,
  author_name text,
  reporter_name text,
  body text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
         r.post_id,
         p.thread_id,
         t.question_id,
         r.reason,
         r.status,
         r.created_at,
         case when p.author_id is null then 'Raderat konto'
              else coalesce(ap.display_name, 'Spelare') end::text,
         coalesce(rp.display_name, 'Spelare')::text,
         p.body
  from public.forum_reports r
  join public.forum_posts p on p.id = r.post_id
  join public.forum_threads t on t.id = p.thread_id
  left join public.player_profiles ap on ap.user_id = p.author_id
  left join public.player_profiles rp on rp.user_id = r.reporter_id
  where exists (select 1 from public.forum_moderators m where m.user_id = auth.uid())
    and r.status = 'open'
  order by r.created_at asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

-- ---------------------------------------------------------------------------
-- 6. Räkna om räknarna en gång (idempotent)
-- ---------------------------------------------------------------------------

-- Röster från konton som redan har raderats finns inte kvar i forum_votes,
-- men kan fortfarande ingå i inläggens summor.
update public.forum_posts p
   set up_votes = c.upp,
       down_votes = c.ner
  from (
    select p2.id,
           count(v.post_id) filter (where v.value = 1)::int as upp,
           count(v.post_id) filter (where v.value = -1)::int as ner
      from public.forum_posts p2
      left join public.forum_votes v on v.post_id = p2.id
     group by p2.id
  ) c
 where c.id = p.id
   and (p.up_votes, p.down_votes) is distinct from (c.upp, c.ner);

update public.forum_threads t
   set post_count = c.antal
  from (
    select t2.id, count(p.id) filter (where not p.is_deleted)::int as antal
      from public.forum_threads t2
      left join public.forum_posts p on p.thread_id = t2.id
     group by t2.id
  ) c
 where c.id = t.id
   and t.post_count is distinct from c.antal;

do $$
declare
  r record;
begin
  for r in select user_id from public.forum_reputation loop
    perform public.forum_recalc_reputation(r.user_id);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Rättigheter (oförändrade mot 0012-0014, upprepade för tydlighet)
-- ---------------------------------------------------------------------------

revoke execute on function public.forum_recalc_reputation(uuid) from public, anon, authenticated;
revoke execute on function public.forum_mark_best(uuid, boolean) from public, anon;
grant execute on function public.forum_mark_best(uuid, boolean) to authenticated;
revoke execute on function public.forum_thread_posts(uuid) from public;
grant execute on function public.forum_thread_posts(uuid) to anon, authenticated;
revoke execute on function public.forum_thread_list(text, text, text, integer, integer) from public;
grant execute on function public.forum_thread_list(text, text, text, integer, integer) to anon, authenticated;
revoke execute on function public.forum_moderator_reports(integer) from public, anon;
grant execute on function public.forum_moderator_reports(integer) to authenticated;

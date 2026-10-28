-- Rollback av 0030_forum_kontoradering.
--
-- Återställer främmande nycklarna och funktionerna från 0012-0014. Det tar
-- tillbaka felet att kontoradering raderar andras foruminlägg, så kör bara om
-- 0030 själv orsakar problem.
--
-- Rollbacken stoppar om något konto redan har raderats efter 0030. Då finns
-- anonymiserade inlägg (author_id null), och author_id kan inte bli not null
-- igen utan att de raderas. Skriv i så fall en ny migration i stället.

begin;

do $$
begin
  if exists (select 1 from public.forum_posts where author_id is null) then
    raise exception 'ANONYMIZED_POSTS_EXIST: det finns inlägg från raderade konton; rollbacken avbryts';
  end if;
end;
$$;

drop trigger if exists forum_votes_after_delete on public.forum_votes;
drop trigger if exists forum_posts_after_anonymize on public.forum_posts;
drop trigger if exists forum_posts_anonymize on public.forum_posts;
drop function if exists public.forum_votes_after_delete();
drop function if exists public.forum_posts_after_anonymize();
drop function if exists public.forum_posts_anonymize();

alter table public.forum_posts
  drop constraint if exists forum_posts_author_id_fkey,
  drop constraint if exists forum_posts_parent_id_fkey;
alter table public.forum_posts alter column author_id set not null;
alter table public.forum_posts
  add constraint forum_posts_author_id_fkey
    foreign key (author_id) references auth.users (id) on delete cascade,
  add constraint forum_posts_parent_id_fkey
    foreign key (parent_id) references public.forum_posts (id) on delete cascade;

drop index if exists public.forum_threads_created_by_idx;
drop index if exists public.forum_posts_deleted_by_idx;
drop index if exists public.forum_reports_reporter_idx;

-- Funktionerna som de var i 0013 (rykte, bästa svar), 0012 (trådens inlägg,
-- trådlistan) och 0014 (moderatorkön).

-- Räknar om en användares rykte från grunden (idempotent).
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
     and t.created_by <> p_user;

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

-- Markera/avmarkera bästa svar. Trådstartaren eller en moderator får göra det.
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

  if v_user <> v_startare and not v_ar_moderator then
    raise exception 'NOT_ALLOWED';
  end if;

  -- Två steg: först rensa, sedan sätta - det unika indexet kontrolleras per rad.
  update public.forum_posts p set is_best = false where p.thread_id = v_thread and p.is_best;
  if coalesce(p_best, true) then
    update public.forum_posts p set is_best = true where p.id = p_post_id;
  end if;

  perform public.forum_recalc_reputation(v_author);
end;
$$;

-- Alla inlägg i en tråd, med författarnamn, röster och egen röst.
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
         coalesce(pp.display_name, 'Spelare')::text,
         p.body,
         p.created_at,
         p.up_votes,
         p.down_votes,
         p.is_best,
         p.is_deleted,
         (select v.value from public.forum_votes v where v.post_id = p.id and v.user_id = auth.uid()),
         (auth.uid() = p.author_id),
         (p.author_id = t.created_by)
  from public.forum_posts p
  join public.forum_threads t on t.id = p.thread_id
  left join public.player_profiles pp on pp.user_id = p.author_id
  where p.thread_id = p_thread_id
  order by p.is_best desc, p.created_at asc;
$$;

-- Listan över diskussioner: sök, filter per delprov och sortering.
-- p_sort: 'new' (nyast), 'popular' (mest populära), 'unanswered' (obesvarade),
--         'active' (senast aktiv).
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
         coalesce(b.namn, 'Spelare')::text,
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

-- Anmälningar i kön (endast öppna), med inläggets text och trådens fråga.
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
         coalesce(ap.display_name, 'Spelare')::text,
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

commit;

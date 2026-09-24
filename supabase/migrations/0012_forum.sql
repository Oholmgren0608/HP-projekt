-- 0012_forum.sql
-- ---------------------------------------------------------------------------
-- Blogg / frågeforum: en diskussionstråd per quizfråga.
--
-- Designval (medvetna, för att hålla funktionen smidig och säker):
-- * En tråd per fråga (`question_id` unik) - "Behöver du hjälp?" på en rättad
--   fråga går alltid till samma tråd.
-- * Allt skrivande går via SECURITY DEFINER-funktioner (samma mönster som
--   duellerna): röster, bästa svar och rykte räknas atomiskt i SQL och kan
--   aldrig sättas direkt av klienten.
-- * Läsning är publik (anon + authenticated); skrivning kräver inloggning.
-- * Borttagning är mjuk men innehållet skrivs över med en markör, så att
--   borttaget innehåll inte längre går att läsa via API:t.
-- * Rykte: +2 per uppröst, -1 per nedröst, +15 för markerat bästa svar.
--   Nedre gräns 0. Egna röster och egna bästa-svar ger inga poäng.
--
-- Kör med `npm run db:push` (se AGENTS.md).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Tabeller
-- ---------------------------------------------------------------------------
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  question_id text not null unique,
  kind text not null,
  title text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  post_count integer not null default 0
);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  parent_id uuid references public.forum_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  is_best boolean not null default false,
  is_deleted boolean not null default false,
  deleted_by uuid references auth.users (id) on delete set null,
  up_votes integer not null default 0,
  down_votes integer not null default 0
);

-- Endast ett bästa svar per tråd.
create unique index forum_posts_one_best_idx on public.forum_posts (thread_id) where is_best;

create table public.forum_votes (
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'handled', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create table public.forum_moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table public.forum_reputation (
  user_id uuid primary key references auth.users (id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  upvotes_received integer not null default 0,
  best_answers integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Index
-- ---------------------------------------------------------------------------
create index forum_threads_activity_idx on public.forum_threads (last_activity_at desc);
create index forum_threads_kind_idx on public.forum_threads (kind, last_activity_at desc);
create index forum_posts_thread_idx on public.forum_posts (thread_id, created_at);
create index forum_posts_parent_idx on public.forum_posts (parent_id);
create index forum_posts_author_idx on public.forum_posts (author_id);
create index forum_votes_user_idx on public.forum_votes (user_id);
create index forum_reports_status_idx on public.forum_reports (status, created_at desc);
create index forum_reputation_points_idx on public.forum_reputation (points desc);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_votes enable row level security;
alter table public.forum_reports enable row level security;
alter table public.forum_moderators enable row level security;
alter table public.forum_reputation enable row level security;

-- Diskussionerna är publika (även för utloggade), precis som topplistan.
create policy "forum_threads_select" on public.forum_threads
  for select to anon, authenticated using (true);
create policy "forum_posts_select" on public.forum_posts
  for select to anon, authenticated using (true);
create policy "forum_reputation_select" on public.forum_reputation
  for select to anon, authenticated using (true);

-- Egna röster och egna anmälningar är privata.
create policy "forum_votes_select_own" on public.forum_votes
  for select to authenticated using (auth.uid() = user_id);
create policy "forum_reports_select_own" on public.forum_reports
  for select to authenticated using (auth.uid() = reporter_id);

-- Klienten behöver bara veta om den egna användaren är moderator.
create policy "forum_moderators_select_own" on public.forum_moderators
  for select to authenticated using (auth.uid() = user_id);

-- Inga insert/update/delete-policyer: allt skrivande sker via RPC:erna nedan.

-- ---------------------------------------------------------------------------
-- 4. RPC:er
-- ---------------------------------------------------------------------------

-- Hjälpare: säkerställ att spelarprofilen finns så att visningsnamnet kan visas.
create or replace function public.forum_ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profiles (user_id, display_name)
  values (
    auth.uid(),
    coalesce(
      nullif((select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid()), ''),
      'Spelare'
    )
  )
  on conflict (user_id) do nothing;
end;
$$;

-- Trådmetadata för en fråga (null om ingen diskussion startats än).
create or replace function public.forum_thread_by_question(p_question_id text)
returns table (
  id uuid,
  question_id text,
  kind text,
  title text,
  created_by uuid,
  created_at timestamptz,
  last_activity_at timestamptz,
  post_count integer,
  best_post_id uuid,
  is_moderator boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id,
         t.question_id,
         t.kind,
         t.title,
         t.created_by,
         t.created_at,
         t.last_activity_at,
         (select count(*)::int from public.forum_posts p where p.thread_id = t.id and not p.is_deleted),
         (select p.id from public.forum_posts p where p.thread_id = t.id and p.is_best and not p.is_deleted limit 1),
         exists (select 1 from public.forum_moderators m where m.user_id = auth.uid())
  from public.forum_threads t
  where t.question_id = p_question_id;
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

-- Starta en diskussion för en fråga: skapar tråden vid behov och lägger
-- inlägget i samma transaktion. Delprov och titel hämtas från frågebanken när
-- frågan finns där, annars används det klienten skickade med.
create or replace function public.forum_post_to_question(
  p_question_id text,
  p_kind text,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_thread uuid;
  v_post uuid;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  perform public.forum_ensure_profile();

  insert into public.forum_threads (question_id, kind, title, created_by)
  values (
    p_question_id,
    coalesce((select q.kind from public.questions q where q.id = p_question_id), p_kind, 'okand'),
    coalesce(
      nullif((select left(q.prompt, 200) from public.questions q where q.id = p_question_id), ''),
      nullif(left(coalesce(p_title, ''), 200), ''),
      p_question_id
    ),
    v_user
  )
  on conflict (question_id) do update
    set last_activity_at = now()
  returning id into v_thread;

  insert into public.forum_posts (thread_id, author_id, body)
  values (v_thread, v_user, trim(p_body))
  returning id into v_post;

  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted),
         last_activity_at = now()
   where t.id = v_thread;

  return v_post;
end;
$$;

-- Svara på ett inlägg i en befintlig tråd.
create or replace function public.forum_create_post(
  p_thread_id uuid,
  p_parent_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_post uuid;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if trim(coalesce(p_body, '')) = '' then
    raise exception 'EMPTY_BODY';
  end if;

  if not exists (select 1 from public.forum_threads t where t.id = p_thread_id) then
    raise exception 'THREAD_NOT_FOUND';
  end if;

  -- Svaret måste höra till samma tråd.
  if p_parent_id is not null
     and not exists (select 1 from public.forum_posts p
                      where p.id = p_parent_id and p.thread_id = p_thread_id) then
    raise exception 'PARENT_NOT_IN_THREAD';
  end if;

  perform public.forum_ensure_profile();

  insert into public.forum_posts (thread_id, parent_id, author_id, body)
  values (p_thread_id, p_parent_id, v_user, trim(p_body))
  returning id into v_post;

  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted),
         last_activity_at = now()
   where t.id = p_thread_id;

  return v_post;
end;
$$;

-- Rösta på ett inlägg. p_value: 1 = upp, -1 = ned, 0 = ta bort rösten.
-- Postens röstsummor och skribentens rykte räknas om atomiskt.
create or replace function public.forum_vote(p_post_id uuid, p_value smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_author uuid;
  v_old smallint;
  v_ny smallint;
  v_gammal smallint;
  v_delta integer;
  v_up_delta integer;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if coalesce(p_value, 0) not in (-1, 0, 1) then
    raise exception 'INVALID_VOTE';
  end if;

  select p.author_id into v_author
    from public.forum_posts p
   where p.id = p_post_id and not p.is_deleted;

  if v_author is null then
    raise exception 'POST_NOT_FOUND';
  end if;

  -- Man får inte rösta på sig själv.
  if v_author = v_user then
    return;
  end if;

  select v.value into v_old
    from public.forum_votes v
   where v.post_id = p_post_id and v.user_id = v_user;

  if coalesce(p_value, 0) = 0 then
    delete from public.forum_votes v where v.post_id = p_post_id and v.user_id = v_user;
  else
    insert into public.forum_votes (post_id, user_id, value)
    values (p_post_id, v_user, p_value)
    on conflict (post_id, user_id) do update set value = excluded.value;
  end if;

  update public.forum_posts p
     set up_votes = c.upp,
         down_votes = c.ner
    from (
      select count(*) filter (where v.value = 1)::int as upp,
             count(*) filter (where v.value = -1)::int as ner
        from public.forum_votes v
       where v.post_id = p_post_id
    ) c
   where p.id = p_post_id;

  -- Ryktesdelta: nytt bidrag minus det gamla (så att byte av röst blir rätt).
  v_ny := case coalesce(p_value, 0) when 1 then 2 when -1 then -1 else 0 end;
  v_gammal := case coalesce(v_old, 0) when 1 then 2 when -1 then -1 else 0 end;

  if v_ny <> v_gammal then
    v_delta := v_ny - v_gammal;
    v_up_delta := (case when coalesce(p_value, 0) = 1 then 1 else 0 end)
                - (case when coalesce(v_old, 0) = 1 then 1 else 0 end);

    insert into public.forum_reputation (user_id, points, upvotes_received)
    values (v_author, greatest(v_delta, 0), greatest(v_up_delta, 0))
    on conflict (user_id) do update
      set points = greatest(public.forum_reputation.points + v_delta, 0),
          upvotes_received = greatest(public.forum_reputation.upvotes_received + v_up_delta, 0),
          updated_at = now();
  end if;
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

  -- Rykte bara när någon annan markerar ditt svar (och bara en gång per svar).
  if v_author <> v_startare then
    if coalesce(p_best, true) then
      insert into public.forum_reputation (user_id, points, best_answers)
      values (v_author, 15, 1)
      on conflict (user_id) do update
        set points = public.forum_reputation.points + 15,
            best_answers = public.forum_reputation.best_answers + 1,
            updated_at = now();
    else
      insert into public.forum_reputation (user_id, points, best_answers)
      values (v_author, 0, 0)
      on conflict (user_id) do update
        set points = greatest(public.forum_reputation.points - 15, 0),
            best_answers = greatest(public.forum_reputation.best_answers - 1, 0),
            updated_at = now();
    end if;
  end if;
end;
$$;

-- Anmäl ett inlägg (en anmälan per användare och inlägg).
create or replace function public.forum_report(p_post_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if trim(coalesce(p_reason, '')) = '' then
    raise exception 'EMPTY_REASON';
  end if;

  if not exists (select 1 from public.forum_posts p where p.id = p_post_id) then
    raise exception 'POST_NOT_FOUND';
  end if;

  insert into public.forum_reports (post_id, reporter_id, reason)
  values (p_post_id, v_user, left(trim(p_reason), 500))
  on conflict (post_id, reporter_id) do update
    set reason = excluded.reason,
        status = 'open',
        created_at = now();
end;
$$;

-- Ta bort ett inlägg: egen text eller moderator. Innehållet skrivs över så att
-- det inte längre går att läsa via API:t, men trådstrukturen behålls.
create or replace function public.forum_moderate_delete(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_author uuid;
  v_thread uuid;
  v_var_bast boolean;
  v_ar_moderator boolean;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select p.author_id, p.thread_id, p.is_best
    into v_author, v_thread, v_var_bast
    from public.forum_posts p
   where p.id = p_post_id and not p.is_deleted;

  if v_author is null then
    raise exception 'POST_NOT_FOUND';
  end if;

  v_ar_moderator := exists (select 1 from public.forum_moderators m where m.user_id = v_user);

  if v_user <> v_author and not v_ar_moderator then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.forum_posts p
     set body = '[Inlägget har tagits bort]',
         is_deleted = true,
         is_best = false,
         deleted_by = v_user
   where p.id = p_post_id;

  -- Om det borttagna inlägget var bästa svar dras ryktespoängen tillbaka.
  if v_var_bast and v_author <> v_user then
    insert into public.forum_reputation (user_id, points, best_answers)
    values (v_author, 0, 0)
    on conflict (user_id) do update
      set points = greatest(public.forum_reputation.points - 15, 0),
          best_answers = greatest(public.forum_reputation.best_answers - 1, 0),
          updated_at = now();
  end if;

  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted)
   where t.id = v_thread;
end;
$$;

-- Topplista över hjälpsamma medlemmar.
create or replace function public.forum_reputation_top(p_limit integer default 10)
returns table (user_id uuid, display_name text, points integer, upvotes_received integer, best_answers integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.user_id,
         coalesce(pp.display_name, 'Spelare')::text,
         r.points,
         r.upvotes_received,
         r.best_answers
  from public.forum_reputation r
  left join public.player_profiles pp on pp.user_id = r.user_id
  where r.points > 0
  order by r.points desc, r.best_answers desc, r.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

-- ---------------------------------------------------------------------------
-- 5. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.forum_ensure_profile() from public, anon;
revoke execute on function public.forum_thread_by_question(text) from public;
revoke execute on function public.forum_thread_posts(uuid) from public;
revoke execute on function public.forum_thread_list(text, text, text, integer, integer) from public;
revoke execute on function public.forum_post_to_question(text, text, text, text) from public, anon;
revoke execute on function public.forum_create_post(uuid, uuid, text) from public, anon;
revoke execute on function public.forum_vote(uuid, smallint) from public, anon;
revoke execute on function public.forum_mark_best(uuid, boolean) from public, anon;
revoke execute on function public.forum_report(uuid, text) from public, anon;
revoke execute on function public.forum_moderate_delete(uuid) from public, anon;
revoke execute on function public.forum_reputation_top(integer) from public;

grant execute on function public.forum_ensure_profile() to authenticated;
grant execute on function public.forum_thread_by_question(text) to anon, authenticated;
grant execute on function public.forum_thread_posts(uuid) to anon, authenticated;
grant execute on function public.forum_thread_list(text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.forum_reputation_top(integer) to anon, authenticated;
grant execute on function public.forum_post_to_question(text, text, text, text) to authenticated;
grant execute on function public.forum_create_post(uuid, uuid, text) to authenticated;
grant execute on function public.forum_vote(uuid, smallint) to authenticated;
grant execute on function public.forum_mark_best(uuid, boolean) to authenticated;
grant execute on function public.forum_report(uuid, text) to authenticated;
grant execute on function public.forum_moderate_delete(uuid) to authenticated;

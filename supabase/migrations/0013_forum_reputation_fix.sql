-- 0013_forum_reputation_fix.sql
-- ---------------------------------------------------------------------------
-- Mål: rykte som alltid stämmer.
--
-- Bakgrund: 0012 räknade rykte med delta (+2 upp, -1 ned, +15 bästa svar) och
-- golvade summan vid 0. Golvet gjorde att kontot kunde "läcka" poäng: en
-- nedröst som golvades till 0 gav +1 tillbaka när den togs bort (verifierat:
-- B fick 1 poäng kvar med 0 uppröster efter upp- -> ned- -> borttagen röst).
--
-- Ny modell: allt rykte härleds ur källan (forum_votes och forum_posts):
--   points = max(2*upp - 1*ned + 15*bästa_svar, 0)
-- Räknarna räknas om vid varje ändring, så upprepade eller borttagna röster
-- kan aldrig drifta. Borttagna inlägg ger varken röster eller bästa svar.
--
-- Kör med `npm run db:push`.
-- ---------------------------------------------------------------------------

alter table public.forum_reputation
  add column if not exists downvotes_received integer not null default 0;

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

-- Rösta på ett inlägg. p_value: 1 = upp, -1 = ned, 0 = ta bort rösten.
create or replace function public.forum_vote(p_post_id uuid, p_value smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_author uuid;
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

  perform public.forum_recalc_reputation(v_author);
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
  v_ar_moderator boolean;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select p.author_id, p.thread_id
    into v_author, v_thread
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

  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted)
   where t.id = v_thread;

  -- Borttagna inlägg ger varken röster eller bästa svar.
  perform public.forum_recalc_reputation(v_author);
end;
$$;

-- Visningsnamnet ska inte fastna som "Spelare" när profilen redan fanns:
-- uppdatera från inloggningens metadata så länge namnet är platshållaren.
create or replace function public.forum_ensure_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_namn text;
begin
  v_namn := coalesce(
    nullif((select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid()), ''),
    'Spelare'
  );

  insert into public.player_profiles (user_id, display_name)
  values (auth.uid(), v_namn)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now()
    where public.player_profiles.display_name = 'Spelare'
      and excluded.display_name <> 'Spelare';
end;
$$;

-- Rätta befintliga rader en gång (idempotent).
do $$
declare
  r record;
begin
  for r in select distinct user_id from public.forum_reputation loop
    perform public.forum_recalc_reputation(r.user_id);
  end loop;
end;
$$;

-- Rättigheter
revoke execute on function public.forum_recalc_reputation(uuid) from public, anon, authenticated;
revoke execute on function public.forum_vote(uuid, smallint) from public, anon;
grant execute on function public.forum_vote(uuid, smallint) to authenticated;
revoke execute on function public.forum_mark_best(uuid, boolean) from public, anon;
grant execute on function public.forum_mark_best(uuid, boolean) to authenticated;
revoke execute on function public.forum_moderate_delete(uuid) from public, anon;
grant execute on function public.forum_moderate_delete(uuid) to authenticated;
revoke execute on function public.forum_ensure_profile() from public, anon;
grant execute on function public.forum_ensure_profile() to authenticated;

-- 0038: Alla mot alla – gruppspel med privata rum och slumpad lobby (steg 2 och 3,
-- docs/alla-mot-alla/spec.md och steg-2-3-plan.md).
--
-- * Frågorna kommer ur spelpoolen (0035/0036) via pool_pick_questions (0037).
-- * Servern äger takten: varje fas har en sluttid och ama_tick går vidare när
--   den passerat eller när alla har svarat. Faser: starting (3 s) -> question
--   (tid efter delprov, x1,5 med Längre tid) -> reveal (6 s) -> nästa fråga.
-- * Poäng när frågan stänger: rätt = 600 + 400 x återstående andel av tiden,
--   fel/inget svar = 0. Lika poäng avgörs av kortast tid på rätta svar.
-- * Facit skickas först i reveal; förklaringar först när spelet är slut.
-- * Slumpad lobby: 4–8 spelare; start 30 s efter fjärde spelaren eller direkt
--   vid 8; efter 60 s fylls lobbyn med botar upp till 4. Botarna svarar på
--   servern, ungefär 60 % rätt.
--
-- Säkerhet (AGENTS.md regel 6): RLS på alla tabeller. Spelare kan läsa sitt
-- eget spels rad och spelarlista (för Realtime och poängtavlan) via
-- ama_is_member; ama_questions och ama_answers har inga policies. Inga direkta
-- skrivningar – allt går via RPC:erna nedan. Test: ~/.cache/hp-db-test/test-0038.mjs.

-- ---------------------------------------------------------------------------
-- 1. Tabeller
-- ---------------------------------------------------------------------------
create table if not exists public.ama_games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('private', 'lobby')),
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'finished', 'cancelled')),
  phase text check (phase in ('starting', 'question', 'reveal')),
  host uuid references auth.users (id) on delete set null,
  invite_code text,
  kinds text[] not null default array['ord', 'mek', 'xyz', 'kva', 'nog'],
  extended boolean not null default false,
  question_count smallint not null default 10,
  current_idx smallint not null default -1,
  phase_started_at timestamptz,
  phase_ends_at timestamptz,
  lobby_full_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create unique index if not exists ama_games_open_code_idx
  on public.ama_games (invite_code) where status = 'waiting' and invite_code is not null;
create index if not exists ama_games_mode_status_idx on public.ama_games (mode, status, created_at);

create table if not exists public.ama_players (
  game_id uuid not null references public.ama_games (id) on delete cascade,
  player_id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  is_bot boolean not null default false,
  display_name text not null,
  score integer not null default 0,
  correct integer not null default 0,
  correct_time_ms integer not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (game_id, player_id),
  unique (game_id, user_id),
  check (is_bot or user_id is not null)
);
create index if not exists ama_players_user_idx on public.ama_players (user_id);

create table if not exists public.ama_questions (
  game_id uuid not null references public.ama_games (id) on delete cascade,
  idx smallint not null,
  question_id text not null references public.questions (id) on delete cascade,
  kind text not null,
  opened_at timestamptz,
  closes_at timestamptz,
  closed boolean not null default false,
  primary key (game_id, idx)
);

create table if not exists public.ama_answers (
  game_id uuid not null references public.ama_games (id) on delete cascade,
  idx smallint not null,
  player_id uuid not null,
  chosen integer not null,
  correct boolean not null,
  time_ms integer not null,
  points integer not null default 0,
  answered_at timestamptz not null default now(),
  primary key (game_id, idx, player_id)
);

alter table public.ama_games enable row level security;
alter table public.ama_players enable row level security;
alter table public.ama_questions enable row level security;
alter table public.ama_answers enable row level security;

revoke all on public.ama_games, public.ama_players, public.ama_questions, public.ama_answers
  from public, anon, authenticated;
grant select on public.ama_games, public.ama_players to authenticated;

-- Medlemskap utan rekursion i policyerna.
create or replace function public.ama_is_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ama_players
     where game_id = p_game_id and user_id = auth.uid()
  );
$$;
revoke execute on function public.ama_is_member(uuid) from public, anon;
grant execute on function public.ama_is_member(uuid) to authenticated;

drop policy if exists "ama_games_select_member" on public.ama_games;
create policy "ama_games_select_member" on public.ama_games
  for select to authenticated using (public.ama_is_member(id));

drop policy if exists "ama_players_select_member" on public.ama_players;
create policy "ama_players_select_member" on public.ama_players
  for select to authenticated using (public.ama_is_member(game_id));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ama_games'
  ) then
    alter publication supabase_realtime add table public.ama_games;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Interna hjälpfunktioner
-- ---------------------------------------------------------------------------
create or replace function public.ama_player_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select nullif(coalesce(pp.username, pp.display_name), '') from public.player_profiles pp where pp.user_id = p_user),
    (select nullif(u.raw_user_meta_data ->> 'name', '') from auth.users u where u.id = p_user),
    'Spelare'
  );
$$;

create or replace function public.ama_limit_ms(p_game_id uuid, p_kind text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select (public.pool_time_limit_ms(p_kind)
          * case when g.extended then 1.5 else 1 end)::integer
    from public.ama_games g where g.id = p_game_id;
$$;

-- Startar spelet: väljer frågor och går till fasen starting.
create or replace function public.ama_begin(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.ama_games%rowtype;
  v_n integer;
begin
  select * into v_game from public.ama_games where id = p_game_id for update;
  if v_game.status <> 'waiting' then return; end if;

  insert into public.ama_questions (game_id, idx, question_id, kind)
  select p_game_id, p.idx, p.question_id, p.kind
    from public.pool_pick_questions(
      array(select user_id from public.ama_players
             where game_id = p_game_id and user_id is not null and left_at is null),
      v_game.kinds,
      v_game.question_count
    ) p;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    raise exception 'Spelpoolen har inga frågor ännu.';
  end if;

  update public.ama_games
     set status = 'active',
         phase = 'starting',
         question_count = v_n,
         current_idx = -1,
         started_at = now(),
         phase_started_at = now(),
         phase_ends_at = now() + interval '3 seconds'
   where id = p_game_id;
end;
$$;

create or replace function public.ama_open_question(p_game_id uuid, p_idx integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_qid text;
  v_limit integer;
begin
  select kind, question_id into v_kind, v_qid
    from public.ama_questions where game_id = p_game_id and idx = p_idx;
  v_limit := public.ama_limit_ms(p_game_id, v_kind);
  update public.ama_questions
     set opened_at = now(), closes_at = now() + make_interval(secs => v_limit / 1000.0)
   where game_id = p_game_id and idx = p_idx;
  update public.ama_games
     set phase = 'question',
         current_idx = p_idx,
         phase_started_at = now(),
         phase_ends_at = now() + make_interval(secs => v_limit / 1000.0)
   where id = p_game_id;
  insert into public.pool_question_views (user_id, question_id, viewed_at)
  select p.user_id, v_qid, now()
    from public.ama_players p
   where p.game_id = p_game_id and p.user_id is not null and p.left_at is null
  on conflict (user_id, question_id) do update set viewed_at = excluded.viewed_at;
end;
$$;

-- Stänger aktuell fråga: botarnas svar, poäng, poängtavla, fasen reveal.
create or replace function public.ama_close_question(p_game_id uuid, p_idx integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q public.questions%rowtype;
  v_limit integer;
  v_n integer;
begin
  select q.* into v_q
    from public.ama_questions aq join public.questions q on q.id = aq.question_id
   where aq.game_id = p_game_id and aq.idx = p_idx;
  v_limit := public.ama_limit_ms(p_game_id, v_q.kind);
  v_n := jsonb_array_length(v_q.options);

  -- Botar: ungefär 60 % rätt, svarstid 20–80 % av tiden.
  insert into public.ama_answers (game_id, idx, player_id, chosen, correct, time_ms)
  select p_game_id, p_idx, b.player_id,
         case when b.ok then v_q.correct_index
              else (b.wrong + case when b.wrong >= v_q.correct_index then 1 else 0 end) end,
         b.ok,
         round(v_limit * (0.2 + 0.6 * random()))::integer
    from (
      select p.player_id,
             random() < 0.6 as ok,
             floor(random() * greatest(1, v_n - 1))::integer as wrong
        from public.ama_players p
       where p.game_id = p_game_id and p.is_bot
    ) b
  on conflict do nothing;

  update public.ama_answers
     set points = case when correct
                       then 600 + round(400 * greatest(0, v_limit - time_ms)::numeric / v_limit)::integer
                       else 0 end
   where game_id = p_game_id and idx = p_idx;

  update public.ama_players p
     set score = p.score + a.points,
         correct = p.correct + case when a.correct then 1 else 0 end,
         correct_time_ms = p.correct_time_ms + case when a.correct then a.time_ms else 0 end
    from public.ama_answers a
   where a.game_id = p_game_id and a.idx = p_idx
     and p.game_id = p_game_id and p.player_id = a.player_id;

  update public.ama_questions set closed = true where game_id = p_game_id and idx = p_idx;
  update public.ama_games
     set phase = 'reveal', phase_started_at = now(), phase_ends_at = now() + interval '6 seconds'
   where id = p_game_id;
end;
$$;

-- Botar fyller en slumpad lobby upp till 4 spelare.
create or replace function public.ama_fill_bots(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
  v_names text[] := array['Bot Ada', 'Bot Bo', 'Bot Cleo'];
  v_i integer := 1;
begin
  select count(*) into v_n from public.ama_players where game_id = p_game_id and left_at is null;
  while v_n < 4 and v_i <= 3 loop
    insert into public.ama_players (game_id, is_bot, display_name)
    values (p_game_id, true, v_names[v_i]);
    v_n := v_n + 1;
    v_i := v_i + 1;
  end loop;
end;
$$;

-- Driver spelet framåt. Säker att anropa hur ofta som helst.
create or replace function public.ama_tick(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.ama_games%rowtype;
  v_q public.ama_questions%rowtype;
  v_players integer;
  v_humans integer;
  v_answered integer;
  v_i integer := 0;
begin
  select * into v_game from public.ama_games where id = p_game_id for update;
  if not found then return; end if;

  if v_game.status = 'waiting' then
    if v_game.mode = 'lobby' then
      select count(*), count(*) filter (where not is_bot) into v_players, v_humans
        from public.ama_players where game_id = p_game_id and left_at is null;
      if v_humans = 0 then
        update public.ama_games set status = 'cancelled', finished_at = now() where id = p_game_id;
      elsif v_players >= 8
            or (v_game.lobby_full_at is not null and now() >= v_game.lobby_full_at + interval '30 seconds') then
        perform public.ama_begin(p_game_id);
      elsif v_players < 4 and now() >= v_game.created_at + interval '60 seconds' then
        perform public.ama_fill_bots(p_game_id);
        perform public.ama_begin(p_game_id);
      end if;
    end if;
    return;
  end if;

  while v_game.status = 'active' and v_i < 30 loop
    v_i := v_i + 1;

    select count(*) into v_humans from public.ama_players
     where game_id = p_game_id and not is_bot and left_at is null;
    if v_humans = 0 then
      update public.ama_games set status = 'finished', phase = null, finished_at = now() where id = p_game_id;
      exit;
    end if;

    if v_game.phase = 'starting' then
      exit when now() < v_game.phase_ends_at;
      perform public.ama_open_question(p_game_id, 0);
    elsif v_game.phase = 'question' then
      select * into v_q from public.ama_questions where game_id = p_game_id and idx = v_game.current_idx;
      select count(*) into v_answered
        from public.ama_answers a
        join public.ama_players p on p.game_id = a.game_id and p.player_id = a.player_id
       where a.game_id = p_game_id and a.idx = v_game.current_idx
         and not p.is_bot and p.left_at is null;
      exit when now() < v_q.closes_at + interval '1500 milliseconds' and v_answered < v_humans;
      perform public.ama_close_question(p_game_id, v_game.current_idx);
    elsif v_game.phase = 'reveal' then
      exit when now() < v_game.phase_ends_at;
      if v_game.current_idx + 1 < v_game.question_count then
        perform public.ama_open_question(p_game_id, v_game.current_idx + 1);
      else
        update public.ama_games set status = 'finished', phase = null, finished_at = now() where id = p_game_id;
      end if;
    else
      exit;
    end if;

    select * into v_game from public.ama_games where id = p_game_id;
  end loop;
end;
$$;

create or replace function public.ama_valid_kinds(p_kinds text[])
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array(
    select distinct k from unnest(p_kinds) k
     where k in ('ord', 'mek', 'xyz', 'kva', 'nog')
     order by k
  ), array[]::text[]);
$$;

-- ---------------------------------------------------------------------------
-- 3. Klient-RPC:er
-- ---------------------------------------------------------------------------
create or replace function public.ama_create_private(p_kinds text[], p_extended boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_kinds text[] := public.ama_valid_kinds(p_kinds);
  v_code text;
  v_id uuid;
  v_tries integer := 0;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  if cardinality(v_kinds) = 0 then raise exception 'Välj minst ett delprov.'; end if;
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.ama_games where invite_code = v_code and status = 'waiting');
    v_tries := v_tries + 1;
    if v_tries > 20 then raise exception 'Kunde inte skapa en kod. Försök igen.'; end if;
  end loop;

  insert into public.ama_games (mode, host, invite_code, kinds, extended)
  values ('private', v_user, v_code, v_kinds, coalesce(p_extended, false))
  returning id into v_id;
  insert into public.ama_players (game_id, user_id, display_name)
  values (v_id, v_user, public.ama_player_name(v_user));
  return jsonb_build_object('game_id', v_id, 'code', v_code);
end;
$$;

create or replace function public.ama_join_private(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.ama_games%rowtype;
  v_n integer;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  select * into v_game from public.ama_games
   where invite_code = upper(trim(p_code)) and status = 'waiting' and mode = 'private'
   for update;
  if not found then raise exception 'Hittade inget rum med den koden.'; end if;
  if exists (select 1 from public.ama_players where game_id = v_game.id and user_id = v_user) then
    update public.ama_players set left_at = null where game_id = v_game.id and user_id = v_user;
    return v_game.id;
  end if;
  select count(*) into v_n from public.ama_players where game_id = v_game.id and left_at is null;
  if v_n >= 30 then raise exception 'Rummet är fullt (30 spelare).'; end if;
  insert into public.ama_players (game_id, user_id, display_name)
  values (v_game.id, v_user, public.ama_player_name(v_user));
  return v_game.id;
end;
$$;

create or replace function public.ama_update_settings(p_game_id uuid, p_kinds text[], p_extended boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kinds text[] := public.ama_valid_kinds(p_kinds);
begin
  if cardinality(v_kinds) = 0 then raise exception 'Välj minst ett delprov.'; end if;
  update public.ama_games
     set kinds = v_kinds, extended = coalesce(p_extended, false)
   where id = p_game_id and host = auth.uid() and status = 'waiting' and mode = 'private';
  if not found then raise exception 'Bara den som skapade rummet kan ändra inställningarna.'; end if;
end;
$$;

create or replace function public.ama_start(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.ama_games%rowtype;
  v_n integer;
begin
  select * into v_game from public.ama_games where id = p_game_id for update;
  if not found or v_game.host is distinct from auth.uid() or v_game.mode <> 'private' then
    raise exception 'Bara den som skapade rummet kan starta.';
  end if;
  if v_game.status <> 'waiting' then return; end if;
  select count(*) into v_n from public.ama_players where game_id = p_game_id and left_at is null;
  if v_n < 2 then raise exception 'Minst 2 spelare behövs.'; end if;
  perform public.ama_begin(p_game_id);
end;
$$;

create or replace function public.ama_leave(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.ama_games%rowtype;
  v_n integer;
begin
  select * into v_game from public.ama_games where id = p_game_id for update;
  if not found then return; end if;
  if v_game.status = 'waiting' then
    if v_game.mode = 'private' and v_game.host = v_user then
      update public.ama_games set status = 'cancelled', finished_at = now() where id = p_game_id;
      return;
    end if;
    delete from public.ama_players where game_id = p_game_id and user_id = v_user;
    if v_game.mode = 'lobby' then
      select count(*) into v_n from public.ama_players where game_id = p_game_id and left_at is null;
      if v_n = 0 then
        update public.ama_games set status = 'cancelled', finished_at = now() where id = p_game_id;
      elsif v_n < 4 then
        update public.ama_games set lobby_full_at = null where id = p_game_id;
      end if;
    end if;
  elsif v_game.status = 'active' then
    update public.ama_players set left_at = now() where game_id = p_game_id and user_id = v_user;
  end if;
end;
$$;

-- Slumpad lobby: gå med i en väntande lobby med plats, eller skapa en.
create or replace function public.ama_find_match()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_n integer;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;

  select g.id into v_id
    from public.ama_games g
    join public.ama_players p on p.game_id = g.id
   where g.mode = 'lobby' and g.status = 'waiting' and p.user_id = v_user
   limit 1;
  if found then
    perform public.ama_tick(v_id);
    return v_id;
  end if;

  select g.id into v_id
    from public.ama_games g
   where g.mode = 'lobby' and g.status = 'waiting'
     and (select count(*) from public.ama_players p where p.game_id = g.id and p.left_at is null) < 8
   order by g.created_at
   limit 1
   for update skip locked;
  if not found then
    insert into public.ama_games (mode) values ('lobby') returning id into v_id;
  end if;

  insert into public.ama_players (game_id, user_id, display_name)
  values (v_id, v_user, public.ama_player_name(v_user))
  on conflict (game_id, user_id) do update set left_at = null;

  select count(*) into v_n from public.ama_players where game_id = v_id and left_at is null;
  if v_n >= 4 then
    update public.ama_games set lobby_full_at = coalesce(lobby_full_at, now()) where id = v_id;
  end if;
  perform public.ama_tick(v_id);
  return v_id;
end;
$$;

create or replace function public.ama_submit(p_game_id uuid, p_idx integer, p_chosen integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.ama_games%rowtype;
  v_player uuid;
  v_q public.questions%rowtype;
  v_aq public.ama_questions%rowtype;
  v_limit integer;
  v_elapsed integer;
  v_chosen integer;
begin
  select * into v_game from public.ama_games where id = p_game_id for update;
  if not found then raise exception 'invalid game'; end if;
  select player_id into v_player from public.ama_players where game_id = p_game_id and user_id = v_user;
  if not found then raise exception 'invalid game'; end if;
  update public.ama_players set left_at = null where game_id = p_game_id and player_id = v_player and left_at is not null;

  if v_game.status <> 'active' or v_game.phase <> 'question' or v_game.current_idx <> p_idx then
    return jsonb_build_object('accepted', false);
  end if;
  select * into v_aq from public.ama_questions where game_id = p_game_id and idx = p_idx;
  if now() > v_aq.closes_at + interval '1500 milliseconds' then
    return jsonb_build_object('accepted', false);
  end if;
  if exists (select 1 from public.ama_answers where game_id = p_game_id and idx = p_idx and player_id = v_player) then
    return jsonb_build_object('accepted', false, 'already', true);
  end if;

  select * into v_q from public.questions where id = v_aq.question_id;
  v_limit := public.ama_limit_ms(p_game_id, v_q.kind);
  v_elapsed := (extract(epoch from (now() - v_aq.opened_at)) * 1000)::integer;
  v_chosen := coalesce(p_chosen, -1);
  if v_chosen < 0 or v_chosen >= jsonb_array_length(v_q.options) then v_chosen := -1; end if;

  insert into public.ama_answers (game_id, idx, player_id, chosen, correct, time_ms)
  values (p_game_id, p_idx, v_player, v_chosen,
          v_chosen >= 0 and v_chosen = v_q.correct_index,
          greatest(1, least(v_elapsed, v_limit)));

  perform public.ama_tick(p_game_id);
  return jsonb_build_object('accepted', true);
end;
$$;

-- Hela läget för spelaren. Driver också spelet framåt (ama_tick).
create or replace function public.ama_state(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game public.ama_games%rowtype;
  v_me public.ama_players%rowtype;
  v_q public.questions%rowtype;
  v_aq public.ama_questions%rowtype;
  v_result jsonb;
  v_players jsonb;
  v_question jsonb := null;
  v_reveal jsonb := null;
  v_final jsonb := null;
  v_my_answer jsonb := null;
  v_answered integer := 0;
  v_active integer := 0;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  select * into v_me from public.ama_players where game_id = p_game_id and user_id = v_user;
  if not found then raise exception 'invalid game'; end if;

  perform public.ama_tick(p_game_id);
  select * into v_game from public.ama_games where id = p_game_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'player_id', p.player_id,
           'name', p.display_name,
           'is_bot', p.is_bot,
           'is_me', p.user_id = v_user,
           'is_host', p.user_id is not distinct from v_game.host and v_game.mode = 'private',
           'score', p.score,
           'correct', p.correct,
           'left', p.left_at is not null,
           'rank', p.rnk
         ) order by p.rnk, p.joined_at), '[]'::jsonb)
    into v_players
    from (
      select pl.*, rank() over (order by pl.score desc, pl.correct_time_ms asc) as rnk
        from public.ama_players pl where pl.game_id = p_game_id
    ) p;

  select count(*) filter (where not is_bot and left_at is null) into v_active
    from public.ama_players where game_id = p_game_id;

  if v_game.status = 'active' and v_game.phase in ('question', 'reveal') then
    select * into v_aq from public.ama_questions where game_id = p_game_id and idx = v_game.current_idx;
    select * into v_q from public.questions where id = v_aq.question_id;
    v_question := jsonb_build_object(
      'index', v_game.current_idx,
      'id', v_q.id, 'kind', v_q.kind, 'prompt', v_q.prompt, 'passage', v_q.passage,
      'options', v_q.options, 'figure_url', v_q.figure_url,
      'time_limit_ms', public.ama_limit_ms(p_game_id, v_q.kind)
    );
    select jsonb_build_object('chosen', a.chosen) into v_my_answer
      from public.ama_answers a
     where a.game_id = p_game_id and a.idx = v_game.current_idx and a.player_id = v_me.player_id;
    select count(*) into v_answered
      from public.ama_answers a
      join public.ama_players p on p.game_id = a.game_id and p.player_id = a.player_id
     where a.game_id = p_game_id and a.idx = v_game.current_idx and not p.is_bot;

    if v_game.phase = 'reveal' then
      v_reveal := jsonb_build_object(
        'correct_index', v_q.correct_index,
        'distribution', (
          select coalesce(jsonb_agg(coalesce(c.n, 0) order by o.i), '[]'::jsonb)
            from generate_series(0, jsonb_array_length(v_q.options) - 1) o(i)
            left join (
              select chosen, count(*)::int n from public.ama_answers
               where game_id = p_game_id and idx = v_game.current_idx and chosen >= 0
               group by chosen
            ) c on c.chosen = o.i
        ),
        'my_points', coalesce((select points from public.ama_answers
                                where game_id = p_game_id and idx = v_game.current_idx
                                  and player_id = v_me.player_id), 0),
        'my_correct', coalesce((select correct from public.ama_answers
                                 where game_id = p_game_id and idx = v_game.current_idx
                                   and player_id = v_me.player_id), false)
      );
    end if;
  end if;

  if v_game.status = 'finished' then
    v_final := jsonb_build_object(
      'review', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'index', aq.idx,
                 'question', jsonb_build_object(
                   'id', q.id, 'kind', q.kind, 'prompt', q.prompt, 'passage', q.passage,
                   'options', q.options, 'figure_url', q.figure_url),
                 'correct_index', q.correct_index,
                 'explain', q.explain,
                 'my_chosen', a.chosen,
                 'my_points', coalesce(a.points, 0)
               ) order by aq.idx)
          from public.ama_questions aq
          join public.questions q on q.id = aq.question_id
          left join public.ama_answers a
            on a.game_id = aq.game_id and a.idx = aq.idx and a.player_id = v_me.player_id
         where aq.game_id = p_game_id and aq.opened_at is not null
      ), '[]'::jsonb),
      'weakest_kind', (
        select aq.kind
          from public.ama_questions aq
          left join public.ama_answers a
            on a.game_id = aq.game_id and a.idx = aq.idx and a.player_id = v_me.player_id
         where aq.game_id = p_game_id and aq.opened_at is not null
         group by aq.kind
         order by avg(case when a.correct then 1.0 else 0.0 end), aq.kind
         limit 1
      )
    );
  end if;

  return jsonb_build_object(
    'game', jsonb_build_object(
      'id', v_game.id,
      'mode', v_game.mode,
      'status', v_game.status,
      'phase', v_game.phase,
      'current_idx', v_game.current_idx,
      'question_count', v_game.question_count,
      'kinds', to_jsonb(v_game.kinds),
      'extended', v_game.extended,
      'invite_code', case when v_game.status = 'waiting' then v_game.invite_code end,
      'is_host', v_game.host is not distinct from v_user and v_game.mode = 'private',
      'remaining_ms', case when v_game.phase_ends_at is null then null
                           else greatest(0, (extract(epoch from (v_game.phase_ends_at - now())) * 1000)::integer) end,
      'lobby_starts_in_ms', case
        when v_game.mode = 'lobby' and v_game.status = 'waiting' and v_game.lobby_full_at is not null
          then greatest(0, (extract(epoch from (v_game.lobby_full_at + interval '30 seconds' - now())) * 1000)::integer)
        end,
      'bots_in_ms', case
        when v_game.mode = 'lobby' and v_game.status = 'waiting' and v_game.lobby_full_at is null
          then greatest(0, (extract(epoch from (v_game.created_at + interval '60 seconds' - now())) * 1000)::integer)
        end
    ),
    'me', jsonb_build_object('player_id', v_me.player_id, 'score', v_me.score, 'correct', v_me.correct),
    'players', v_players,
    'question', v_question,
    'my_answer', v_my_answer,
    'answered_count', v_answered,
    'active_count', v_active,
    'reveal', v_reveal,
    'final', v_final
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.ama_player_name(uuid) from public, anon, authenticated;
revoke execute on function public.ama_limit_ms(uuid, text) from public, anon, authenticated;
revoke execute on function public.ama_begin(uuid) from public, anon, authenticated;
revoke execute on function public.ama_open_question(uuid, integer) from public, anon, authenticated;
revoke execute on function public.ama_close_question(uuid, integer) from public, anon, authenticated;
revoke execute on function public.ama_fill_bots(uuid) from public, anon, authenticated;
revoke execute on function public.ama_tick(uuid) from public, anon, authenticated;
revoke execute on function public.ama_valid_kinds(text[]) from public, anon, authenticated;

revoke execute on function public.ama_create_private(text[], boolean) from public, anon;
revoke execute on function public.ama_join_private(text) from public, anon;
revoke execute on function public.ama_update_settings(uuid, text[], boolean) from public, anon;
revoke execute on function public.ama_start(uuid) from public, anon;
revoke execute on function public.ama_leave(uuid) from public, anon;
revoke execute on function public.ama_find_match() from public, anon;
revoke execute on function public.ama_submit(uuid, integer, integer) from public, anon;
revoke execute on function public.ama_state(uuid) from public, anon;

grant execute on function public.ama_create_private(text[], boolean) to authenticated;
grant execute on function public.ama_join_private(text) to authenticated;
grant execute on function public.ama_update_settings(uuid, text[], boolean) to authenticated;
grant execute on function public.ama_start(uuid) to authenticated;
grant execute on function public.ama_leave(uuid) to authenticated;
grant execute on function public.ama_find_match() to authenticated;
grant execute on function public.ama_submit(uuid, integer, integer) to authenticated;
grant execute on function public.ama_state(uuid) to authenticated;

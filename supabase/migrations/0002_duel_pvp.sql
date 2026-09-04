-- HP Lift: PvP-frågedueller.
-- Tabeller för spelarprofiler (ELO/statistik), matcher, per-fråga-svar,
-- matchmaking-kö samt SECURITY DEFINER-funktioner som sköter all
-- rankinglogik atomärt (klienten kan inte skriva ELO direkt).
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0001).

-- ---------------------------------------------------------------------------
-- 1. Spelarprofiler
-- ---------------------------------------------------------------------------
create table public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  elo integer not null default 1200,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;

-- Läsbar för alla inloggade (motståndarnamn + topplista).
create policy "profiles_select" on public.player_profiles
  for select using (auth.role() = 'authenticated');

-- Skapa sin egen profil. Ingen UPDATE/DELETE-policy: ELO och statistik
-- uppdateras enbart av SECURITY DEFINER-funktionerna nedan (anti-fusk).
create policy "profiles_insert_own" on public.player_profiles
  for insert with check (auth.uid() = user_id);

create index player_profiles_elo_idx on public.player_profiles (elo desc);

-- ---------------------------------------------------------------------------
-- 2. Matcher
-- ---------------------------------------------------------------------------
create table public.duel_matches (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('ranked', 'casual', 'private')),
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'finished', 'forfeit', 'cancelled')),
  player_a uuid not null references auth.users (id) on delete cascade,
  player_b uuid references auth.users (id) on delete cascade,
  bot_elo integer,
  question_seed text not null default '',
  winner uuid,
  a_correct integer,
  b_correct integer,
  a_time_ms integer,
  b_time_ms integer,
  elo_a_delta integer,
  elo_b_delta integer,
  invite_code text,
  a_finished_at timestamptz,
  b_finished_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table public.duel_matches enable row level security;

create policy "matches_select" on public.duel_matches
  for select using (auth.uid() = player_a or auth.uid() = player_b);

create policy "matches_insert_own" on public.duel_matches
  for insert with check (auth.uid() = player_a);

create policy "matches_update_involved" on public.duel_matches
  for update
  using (auth.uid() = player_a or auth.uid() = player_b)
  with check (auth.uid() = player_a or auth.uid() = player_b);

create index duel_matches_players_idx on public.duel_matches (player_a, player_b);
create index duel_matches_status_idx on public.duel_matches (status);

-- ---------------------------------------------------------------------------
-- 3. Svar per fråga (driver live-ställningen via Realtime)
-- ---------------------------------------------------------------------------
create table public.duel_answers (
  match_id uuid not null references public.duel_matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  chosen integer not null,
  correct boolean not null,
  time_ms integer not null,
  answered_at timestamptz not null default now(),
  primary key (match_id, user_id, question_id)
);

alter table public.duel_answers enable row level security;

create policy "answers_select_involved" on public.duel_answers
  for select using (
    exists (
      select 1 from public.duel_matches m
      where m.id = match_id
        and (m.player_a = auth.uid() or m.player_b = auth.uid())
    )
  );

create policy "answers_insert_own" on public.duel_answers
  for insert with check (auth.uid() = user_id);

create index duel_answers_match_idx on public.duel_answers (match_id);

-- ---------------------------------------------------------------------------
-- 4. Matchmaking-kö
-- ---------------------------------------------------------------------------
create table public.duel_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('ranked', 'casual')),
  elo integer not null,
  created_at timestamptz not null default now()
);

alter table public.duel_queue enable row level security;

create policy "queue_select_own" on public.duel_queue
  for select using (auth.uid() = user_id);
create policy "queue_insert_own" on public.duel_queue
  for insert with check (auth.uid() = user_id);
create policy "queue_delete_own" on public.duel_queue
  for delete using (auth.uid() = user_id);

create index duel_queue_mode_elo_idx on public.duel_queue (mode, elo);

-- ---------------------------------------------------------------------------
-- Realtime-publikation (skyddad mot att köras flera gånger)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'duel_matches'
  ) then
    alter publication supabase_realtime add table public.duel_matches;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'duel_answers'
  ) then
    alter publication supabase_realtime add table public.duel_answers;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'duel_queue'
  ) then
    alter publication supabase_realtime add table public.duel_queue;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. RPC-funktioner (SECURITY DEFINER — körs med ägarens rättigheter)
-- ---------------------------------------------------------------------------

-- Skapa profil om den saknas (idempotent).
create or replace function public.duel_ensure_profile(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profiles (user_id, display_name)
  values (auth.uid(), coalesce(nullif(p_display_name, ''), 'Spelare'))
  on conflict (user_id) do nothing;
end;
$$;

-- Hitta motståndare eller ställ dig i kö. Returnerar match-id om matchad,
-- annars null (du står nu i kö).
create or replace function public.duel_join_queue(p_mode text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_elo integer;
  v_opp record;
  v_match_id uuid;
begin
  insert into public.player_profiles (user_id, display_name)
  values (v_user, coalesce(nullif((select raw_user_meta_data ->> 'name' from auth.users where id = v_user), ''), 'Spelare'))
  on conflict (user_id) do nothing;

  select elo into v_elo from public.player_profiles where user_id = v_user;
  v_elo := coalesce(v_elo, 1200);

  delete from public.duel_queue where user_id = v_user;

  -- Närmast i ELO inom samma läge; lås raden så att två inte matchar samma.
  select * into v_opp
  from public.duel_queue
  where mode = p_mode and user_id <> v_user
  order by abs(elo - v_elo) asc, created_at asc
  limit 1
  for update skip locked;

  if v_opp.id is not null then
    delete from public.duel_queue where id = v_opp.id;
    insert into public.duel_matches (mode, status, player_a, player_b, question_seed, started_at)
    values (p_mode, 'active', v_user, v_opp.user_id,
            md5(random()::text || clock_timestamp()::text), now())
    returning id into v_match_id;
    return v_match_id;
  else
    insert into public.duel_queue (user_id, mode, elo) values (v_user, p_mode, v_elo);
    return null;
  end if;
end;
$$;

-- Lämna kön (avbryt sökning).
create or replace function public.duel_cancel_queue()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.duel_queue where user_id = auth.uid();
end;
$$;

-- Starta match mot AI-bot (efter söktimeout). Returnerar match-id.
create or replace function public.duel_start_bot_match(p_mode text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_elo integer;
  v_match_id uuid;
begin
  delete from public.duel_queue where user_id = v_user;
  select elo into v_elo from public.player_profiles where user_id = v_user;
  v_elo := coalesce(v_elo, 1200);

  insert into public.duel_matches (mode, status, player_a, bot_elo, question_seed, started_at)
  values (p_mode, 'active', v_user, v_elo,
          md5(random()::text || clock_timestamp()::text), now())
  returning id into v_match_id;
  return v_match_id;
end;
$$;

-- Registrera ett svar (validerar att matchen är aktiv och att du är med).
create or replace function public.duel_submit_answer(
  p_match_id uuid,
  p_question_id text,
  p_chosen integer,
  p_correct boolean,
  p_time_ms integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.duel_matches m
    where m.id = p_match_id
      and (m.player_a = auth.uid() or m.player_b = auth.uid())
      and m.status = 'active'
  ) then
    raise exception 'invalid match';
  end if;

  insert into public.duel_answers (match_id, user_id, question_id, chosen, correct, time_ms)
  values (p_match_id, auth.uid(), p_question_id, p_chosen, p_correct, p_time_ms)
  on conflict (match_id, user_id, question_id) do nothing;
end;
$$;

-- Markera dig som klar. När båda är klara avgörs vinnare + ELO atomärt.
-- Returnerar match-id om matchen finaliserades, annars null (vänta på motståndare).
create or replace function public.duel_mark_finished(
  p_match_id uuid,
  p_correct integer,
  p_time_ms integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_elo_a integer; v_elo_b integer;
  v_ea numeric; v_eb numeric;
  v_score_a numeric := 0; v_score_b numeric := 0;
  v_delta_a integer := 0; v_delta_b integer := 0;
  v_winner uuid;
  v_k integer := 32;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return null; end if;
  if v_match.status <> 'active' then return null; end if;

  if v_match.player_a = v_user then
    update public.duel_matches
    set a_correct = p_correct, a_time_ms = p_time_ms, a_finished_at = now()
    where id = p_match_id;
  elsif v_match.player_b = v_user then
    update public.duel_matches
    set b_correct = p_correct, b_time_ms = p_time_ms, b_finished_at = now()
    where id = p_match_id;
  else
    return null;
  end if;

  select * into v_match from public.duel_matches where id = p_match_id;

  if v_match.a_correct is null or v_match.b_correct is null then
    return null; -- vänta på motståndaren
  end if;

  -- Avgör vinnare: flest rätt, därefter snabbast totaltid, annars oavgjort.
  if v_match.a_correct > v_match.b_correct then
    v_winner := v_match.player_a;
  elsif v_match.b_correct > v_match.a_correct then
    v_winner := v_match.player_b;
  elsif v_match.a_time_ms < v_match.b_time_ms then
    v_winner := v_match.player_a;
  elsif v_match.b_time_ms < v_match.a_time_ms then
    v_winner := v_match.player_b;
  else
    v_winner := null;
  end if;

  if v_match.mode = 'ranked' then
    select elo into v_elo_a from public.player_profiles where user_id = v_match.player_a;
    select elo into v_elo_b from public.player_profiles where user_id = v_match.player_b;
    v_elo_a := coalesce(v_elo_a, 1200);
    v_elo_b := coalesce(v_elo_b, 1200);

    v_ea := 1.0 / (1.0 + power(10.0, (v_elo_b - v_elo_a)::numeric / 400.0));
    v_eb := 1.0 / (1.0 + power(10.0, (v_elo_a - v_elo_b)::numeric / 400.0));

    if v_winner = v_match.player_a then
      v_score_a := 1;
    elsif v_winner = v_match.player_b then
      v_score_b := 1;
    elsif v_winner is null then
      v_score_a := 0.5;
      v_score_b := 0.5;
    end if;

    v_delta_a := round(v_k * (v_score_a - v_ea))::integer;
    v_delta_b := round(v_k * (v_score_b - v_eb))::integer;

    update public.player_profiles
    set elo = greatest(0, elo + v_delta_a),
        wins = wins + (case when v_winner = v_match.player_a then 1 else 0 end),
        losses = losses + (case when v_winner = v_match.player_b then 1 else 0 end),
        draws = draws + (case when v_winner is null then 1 else 0 end),
        updated_at = now()
    where user_id = v_match.player_a;

    update public.player_profiles
    set elo = greatest(0, elo + v_delta_b),
        wins = wins + (case when v_winner = v_match.player_b then 1 else 0 end),
        losses = losses + (case when v_winner = v_match.player_a then 1 else 0 end),
        draws = draws + (case when v_winner is null then 1 else 0 end),
        updated_at = now()
    where user_id = v_match.player_b;
  end if;

  update public.duel_matches
  set status = 'finished', winner = v_winner, finished_at = now(),
      elo_a_delta = v_delta_a, elo_b_delta = v_delta_b
  where id = p_match_id;

  return p_match_id;
end;
$$;

-- Avsluta match mot bot (reducerad ELO-vikt, K=16). Returnerar delta + vinnare.
create or replace function public.duel_finish_bot(
  p_match_id uuid,
  p_player_correct integer,
  p_player_time_ms integer,
  p_bot_correct integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_elo integer;
  v_score numeric := 0.5;
  v_delta integer := 0;
  v_winner uuid;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return null; end if;
  if v_match.player_a <> v_user or v_match.player_b is not null then return null; end if;
  if v_match.status <> 'active' then return null; end if;

  if p_player_correct > p_bot_correct then
    v_winner := v_user; v_score := 1;
  elsif p_bot_correct > p_player_correct then
    v_winner := null; v_score := 0;
  else
    v_winner := null; v_score := 0.5;
  end if;

  select elo into v_elo from public.player_profiles where user_id = v_user;
  v_elo := coalesce(v_elo, 1200);

  if v_match.mode = 'ranked' then
    -- Boten är rankad på din ELO => förväntad poäng 0.5, K = 16.
    v_delta := round(16 * (v_score - 0.5))::integer;
    update public.player_profiles
    set elo = greatest(0, elo + v_delta),
        wins = wins + (case when v_score = 1 then 1 else 0 end),
        losses = losses + (case when v_score = 0 then 1 else 0 end),
        draws = draws + (case when v_score = 0.5 then 1 else 0 end),
        updated_at = now()
    where user_id = v_user;
  end if;

  update public.duel_matches
  set status = 'finished',
      winner = v_winner,
      a_correct = p_player_correct,
      b_correct = p_bot_correct,
      a_time_ms = p_player_time_ms,
      elo_a_delta = v_delta,
      finished_at = now()
  where id = p_match_id;

  return jsonb_build_object('delta', v_delta, 'winner_is_me', (v_winner = v_user));
end;
$$;

-- Spelaren ger upp mitt i matchen: förlorar med full ELO-påverkan.
create or replace function public.duel_forfeit(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_opp uuid;
  v_elo integer; v_opp_elo integer;
  v_ea numeric;
  v_delta integer := 0; v_opp_delta integer := 0;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return; end if;
  if v_match.status <> 'active' then return; end if;
  if v_match.player_a <> v_user and v_match.player_b <> v_user then return; end if;

  v_opp := case when v_match.player_a = v_user then v_match.player_b else v_match.player_a end;

  if v_match.mode = 'ranked' then
    select elo into v_elo from public.player_profiles where user_id = v_user;
    v_elo := coalesce(v_elo, 1200);

    if v_opp is not null then
      select elo into v_opp_elo from public.player_profiles where user_id = v_opp;
      v_opp_elo := coalesce(v_opp_elo, 1200);
      v_ea := 1.0 / (1.0 + power(10.0, (v_opp_elo - v_elo)::numeric / 400.0));
      v_delta := round(32 * (0 - v_ea))::integer;
      v_opp_delta := -v_delta;

      update public.player_profiles
      set elo = greatest(0, elo + v_delta), losses = losses + 1, updated_at = now()
      where user_id = v_user;
      update public.player_profiles
      set elo = greatest(0, elo + v_opp_delta), wins = wins + 1, updated_at = now()
      where user_id = v_opp;
    else
      v_delta := round(16 * (0 - 0.5))::integer; -- -8
      update public.player_profiles
      set elo = greatest(0, elo + v_delta), losses = losses + 1, updated_at = now()
      where user_id = v_user;
    end if;
  end if;

  update public.duel_matches
  set status = 'forfeit', winner = v_opp, finished_at = now(),
      elo_a_delta = case when v_match.player_a = v_user then v_delta else v_opp_delta end,
      elo_b_delta = case when v_match.player_b = v_user then v_delta else v_opp_delta end
  where id = p_match_id;
end;
$$;

-- Gör anspråk på vinst om motståndaren inte avslutat inom 60 s efter att du
-- blev klar (motståndaren behandlas som att ha gett upp).
create or replace function public.duel_claim_stall_win(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_my_finished timestamptz;
  v_opp uuid;
  v_elo integer; v_opp_elo integer;
  v_ea numeric;
  v_delta integer := 0; v_opp_delta integer := 0;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return; end if;
  if v_match.status <> 'active' then return; end if;
  if v_match.player_a <> v_user and v_match.player_b <> v_user then return; end if;

  v_my_finished := case when v_match.player_a = v_user then v_match.a_finished_at
                        else v_match.b_finished_at end;
  v_opp := case when v_match.player_a = v_user then v_match.player_b else v_match.player_a end;

  if v_opp is null then return; end if;
  if v_my_finished is null or (now() - v_my_finished) < interval '60 seconds' then return; end if;

  if v_match.mode = 'ranked' then
    select elo into v_elo from public.player_profiles where user_id = v_user;
    select elo into v_opp_elo from public.player_profiles where user_id = v_opp;
    v_elo := coalesce(v_elo, 1200);
    v_opp_elo := coalesce(v_opp_elo, 1200);
    v_ea := 1.0 / (1.0 + power(10.0, (v_opp_elo - v_elo)::numeric / 400.0));
    v_delta := round(32 * (1 - v_ea))::integer;
    v_opp_delta := -v_delta;

    update public.player_profiles
    set elo = greatest(0, elo + v_delta), wins = wins + 1, updated_at = now()
    where user_id = v_user;
    update public.player_profiles
    set elo = greatest(0, elo + v_opp_delta), losses = losses + 1, updated_at = now()
    where user_id = v_opp;
  end if;

  update public.duel_matches
  set status = 'forfeit', winner = v_user, finished_at = now(),
      elo_a_delta = case when v_match.player_a = v_user then v_delta else v_opp_delta end,
      elo_b_delta = case when v_match.player_b = v_user then v_delta else v_opp_delta end
  where id = p_match_id;
end;
$$;

-- Skapa privat match, returnerar 6-teckens kod + match-id.
create or replace function public.duel_create_private()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_match_id uuid;
  v_tries integer := 0;
begin
  insert into public.player_profiles (user_id, display_name)
  values (v_user, coalesce(nullif((select raw_user_meta_data ->> 'name' from auth.users where id = v_user), ''), 'Spelare'))
  on conflict (user_id) do nothing;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.duel_matches where invite_code = v_code and status = 'waiting'
    );
    v_tries := v_tries + 1;
    if v_tries > 20 then exit; end if;
  end loop;

  insert into public.duel_matches (mode, status, player_a, invite_code, question_seed)
  values ('private', 'waiting', v_user, v_code, md5(random()::text || clock_timestamp()::text))
  returning id into v_match_id;
  return jsonb_build_object('code', v_code, 'match_id', v_match_id);
end;
$$;

-- Gå med i privat match via kod. Returnerar match-id (null om ogiltig/full).
create or replace function public.duel_join_private(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
begin
  select * into v_match from public.duel_matches
  where invite_code = upper(trim(p_code)) and status = 'waiting'
  limit 1
  for update skip locked;

  if not found then return null; end if;
  if v_match.player_a = v_user then return v_match.id; end if;
  if v_match.player_b is not null then return null; end if;

  update public.duel_matches
  set player_b = v_user, status = 'active', started_at = now()
  where id = v_match.id;
  return v_match.id;
end;
$$;

-- Avbryt en väntande privat lobby (endast skaparen).
create or replace function public.duel_cancel_private(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.duel_matches
  set status = 'cancelled'
  where id = p_match_id
    and player_a = auth.uid()
    and status = 'waiting';
end;
$$;

-- ---------------------------------------------------------------------------
-- Rättigheter: endast inloggade användare får anropa funktionerna.
-- ---------------------------------------------------------------------------
revoke execute on function public.duel_ensure_profile(text) from public, anon;
revoke execute on function public.duel_join_queue(text) from public, anon;
revoke execute on function public.duel_cancel_queue() from public, anon;
revoke execute on function public.duel_start_bot_match(text) from public, anon;
revoke execute on function public.duel_submit_answer(uuid, text, integer, boolean, integer) from public, anon;
revoke execute on function public.duel_mark_finished(uuid, integer, integer) from public, anon;
revoke execute on function public.duel_finish_bot(uuid, integer, integer, integer) from public, anon;
revoke execute on function public.duel_forfeit(uuid) from public, anon;
revoke execute on function public.duel_claim_stall_win(uuid) from public, anon;
revoke execute on function public.duel_create_private() from public, anon;
revoke execute on function public.duel_join_private(text) from public, anon;
revoke execute on function public.duel_cancel_private(uuid) from public, anon;

grant execute on function public.duel_ensure_profile(text) to authenticated;
grant execute on function public.duel_join_queue(text) to authenticated;
grant execute on function public.duel_cancel_queue() to authenticated;
grant execute on function public.duel_start_bot_match(text) to authenticated;
grant execute on function public.duel_submit_answer(uuid, text, integer, boolean, integer) to authenticated;
grant execute on function public.duel_mark_finished(uuid, integer, integer) to authenticated;
grant execute on function public.duel_finish_bot(uuid, integer, integer, integer) to authenticated;
grant execute on function public.duel_forfeit(uuid) to authenticated;
grant execute on function public.duel_claim_stall_win(uuid) to authenticated;
grant execute on function public.duel_create_private() to authenticated;
grant execute on function public.duel_join_private(text) to authenticated;
grant execute on function public.duel_cancel_private(uuid) to authenticated;

-- 0016_duel_leaderboard_hardening.sql
-- ---------------------------------------------------------------------------
-- Mål: stänga skrivvägar som gick runt de server-auktoritativa duell-RPC:erna
-- och begränsa vad topplistan tar emot.
--
-- 1. `duel_public_profiles` (0004) är en enkel vy och därmed automatiskt
--    uppdateringsbar. Den ägs av postgres, som kringgår RLS, och Supabases
--    default privileges gav anon/authenticated INSERT/UPDATE/DELETE när vyn
--    skapades - 0004 justerade bara SELECT. Alla inloggade kunde alltså sätta
--    andras ELO/vinster eller radera profiler via PATCH/DELETE
--    /rest/v1/duel_public_profiles.
-- 2. INSERT-policyerna från 0002 (`profiles_insert_own`, `matches_insert_own`,
--    `queue_insert_own`) togs aldrig bort. Med dem kunde en klient skapa en
--    egen profil med valfri ELO, en "aktiv" rankad match mot vem som helst
--    med bakdaterad sluttid (och sedan ta vinsten via duel_claim_stall_win)
--    och köposter förbi spärrarna i duel_join_queue. Appen skriver aldrig
--    direkt till tabellerna - allt går via RPC:erna.
-- 3. duel_claim_stall_win krävde bara att anroparen varit klar i 60 s. Den som
--    markerade sig klar utan att svara kunde ta vinsten medan motståndaren
--    fortfarande hade speltid kvar. Nu krävs också att motståndarens speltid
--    har gått ut (10 frågor x 20 s plus marginal = 5 min från matchstart) och
--    att motståndaren inte har svarat den senaste minuten.
-- 4. duel_forfeit och duel_claim_stall_win jämförde deltagare med `<>`, som
--    blir NULL när player_b saknas (botmatcher). Då kunde vem som helst med
--    match-id:t ge upp någon annans rankade botmatch - ELO-överföring från ett
--    andra konto. Kontrollen är nu NULL-säker.
-- 5. leaderboard_submit tog emot godtycklig XP för godtycklig vecka. Nu bara
--    innevarande ISO-vecka (±1 dygn för tidszoner) och högst 25 000 XP per
--    vecka. XP räknas fortfarande i klienten, så taket begränsar skadan men
--    gör inte topplistan fuskfri.
-- 6. leaderboard_get: p_limit begränsas till 1-100.
-- 7. leaderboard_set_name används inte av appen och kringgick valideringen i
--    profile_set_username (0007) - stängs för klienter.
--
-- I live-databasen är några av funktionerna fortfarande tunna wrappers mot
-- private.* (från den manuella 0010-härdningen). `create or replace` med samma
-- signatur ersätter dem; private-varianterna blir oanvända.
--
-- Kör med `npm run db:dry` och sedan `npm run db:push` (se AGENTS.md).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Vyn är bara läsbar.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on public.duel_public_profiles from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Inga direkta INSERT:s i duelltabellerna.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_insert_own" on public.player_profiles;
drop policy if exists "matches_insert_own" on public.duel_matches;
drop policy if exists "queue_insert_own" on public.duel_queue;

-- ---------------------------------------------------------------------------
-- 3 + 4. Vinst på grund av passivitet: motståndarens speltid måste ha gått ut.
-- ---------------------------------------------------------------------------
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
  if v_user is null then return; end if;

  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return; end if;
  if v_match.status <> 'active' then return; end if;
  if v_match.player_a is distinct from v_user
     and v_match.player_b is distinct from v_user then
    return;
  end if;

  v_my_finished := case when v_match.player_a = v_user then v_match.a_finished_at
                        else v_match.b_finished_at end;
  v_opp := case when v_match.player_a = v_user then v_match.player_b else v_match.player_a end;

  if v_opp is null then return; end if;
  if v_my_finished is null or (now() - v_my_finished) < interval '60 seconds' then return; end if;

  -- En duell är 10 frågor x 20 s; klienten skickar in obesvarade frågor när
  -- tiden tar slut. Fem minuter från start räcker med god marginal för den
  -- som faktiskt spelar - och den som har svarat nyss spelar fortfarande.
  if now() < coalesce(v_match.started_at, v_match.created_at) + interval '5 minutes'
     or exists (
       select 1 from public.duel_answers da
       where da.match_id = p_match_id
         and da.user_id = v_opp
         and da.answered_at > now() - interval '60 seconds'
     ) then
    raise exception 'Motståndaren har fortfarande speltid kvar.';
  end if;

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

revoke execute on function public.duel_claim_stall_win(uuid) from public, anon;
grant execute on function public.duel_claim_stall_win(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Ge upp: bara matchens egna spelare (NULL-säkert för botmatcher).
-- ---------------------------------------------------------------------------
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
  if v_user is null then return; end if;

  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return; end if;
  if v_match.status <> 'active' then return; end if;
  if v_match.player_a is distinct from v_user
     and v_match.player_b is distinct from v_user then
    return;
  end if;

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

revoke execute on function public.duel_forfeit(uuid) from public, anon;
grant execute on function public.duel_forfeit(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Topplistan: bara innevarande vecka och ett rimligt tak.
-- ---------------------------------------------------------------------------
create or replace function public.leaderboard_submit(p_week text, p_xp integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Långt över vad någon hinner tjäna på en vecka (5 XP per rätt svar).
  v_max_week_xp constant integer := 25000;
begin
  if auth.uid() is null then
    return;
  end if;

  -- Klienten räknar veckan i lokal tid; ±1 dygn täcker alla tidszoner.
  if p_week is null or p_week not in (
    to_char(now() - interval '1 day', 'IYYY-"W"IW'),
    to_char(now(), 'IYYY-"W"IW'),
    to_char(now() + interval '1 day', 'IYYY-"W"IW')
  ) then
    return;
  end if;

  insert into public.player_profiles (user_id, display_name)
  values (
    auth.uid(),
    coalesce(nullif((select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid()), ''), 'Spelare')
  )
  on conflict (user_id) do nothing;

  insert into public.leaderboard_entries (user_id, week, xp)
  values (auth.uid(), p_week, least(greatest(coalesce(p_xp, 0), 0), v_max_week_xp))
  on conflict (user_id, week) do update
    set xp = greatest(public.leaderboard_entries.xp, excluded.xp),
        updated_at = now();
end;
$$;

revoke execute on function public.leaderboard_submit(text, integer) from public, anon;
grant execute on function public.leaderboard_submit(text, integer) to authenticated;

-- Rader som redan ligger över taket (bara möjligt före den här migrationen).
update public.leaderboard_entries set xp = 25000 where xp > 25000;

-- ---------------------------------------------------------------------------
-- 6. Topplistan: högst 100 rader per anrop.
-- ---------------------------------------------------------------------------
create or replace function public.leaderboard_get(p_week text, p_limit integer default 50)
returns table (rank bigint, user_id uuid, display_name text, xp integer, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select rank() over (order by xp desc, le.updated_at asc),
         le.user_id,
         coalesce(pp.display_name, 'Spelare')::text,
         le.xp,
         (auth.uid() = le.user_id)
  from public.leaderboard_entries le
  left join public.player_profiles pp on pp.user_id = le.user_id
  where le.week = p_week
  order by xp desc, le.updated_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke execute on function public.leaderboard_get(text, integer) from public;
grant execute on function public.leaderboard_get(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Visningsnamn sätts via profile_set_username (validerat), inte här.
-- ---------------------------------------------------------------------------
revoke execute on function public.leaderboard_set_name(text) from public, anon, authenticated;

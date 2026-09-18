-- ============================================================================
-- 0006_duel_rpc_wrapper_hardening_rollback.sql
--
-- NÄR: Kör den här filen i Supabase Dashboard -> SQL Editor ENDAST om
--      `0006_duel_rpc_wrapper_hardening.sql` har körts och måste ångras.
--      Filen förutsätter alltså att 0006 redan är applicerad (att wrappers i
--      public och implementationer i schemat private finns).
--
-- VAD: Återställer exakt läget FÖRE 0006:
--        1. Alla 16 RPC:er i public skapas igen med sina ursprungliga,
--           byte-identiska kroppar, SECURITY DEFINER och sin ursprungliga
--           `set search_path`-rad (public respektive '' för de två från 0004).
--        2. Implementationerna i private droppas, därefter schemat private.
--        3. Dagens (före 0006) grant-läge återskapas för alla 16, inklusive
--           att leaderboard_get även är körbar för anon.
--
-- KÖRNING: Hela filen körs som ett block (begin/commit). Är något oväntat i
--          private-schemat (t.ex. andra objekt än de 16 funktionerna) kommer
--          `drop schema if exists private;` att avbryta transaktionen — då
--          rullas allt tillbaka och inget halvt läge uppstår. Inspektera i så
--          fall private-schemat manuellt innan du kör igen.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Återställ de 16 implementationerna i public (ursprungliga kroppar).
-- ----------------------------------------------------------------------------

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

create or replace function public.duel_join_queue(p_mode text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_elo integer;
  v_flagged boolean;
  v_opp record;
  v_match_id uuid;
begin
  insert into public.player_profiles (user_id, display_name)
  values (v_user, coalesce(nullif((select raw_user_meta_data ->> 'name' from auth.users where id = v_user), ''), 'Spelare'))
  on conflict (user_id) do nothing;

  select elo into v_elo from public.player_profiles where user_id = v_user;
  v_elo := coalesce(v_elo, 1200);

  if p_mode = 'ranked' then
    select flagged into v_flagged from public.player_profiles where user_id = v_user;
    if coalesce(v_flagged, false) then
      raise exception 'Ditt konto är under granskning och kan inte spela Ranked just nu.';
    end if;
  end if;

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

-- Avbryt kösökning (endast egen körad).

create or replace function public.duel_cancel_queue()
returns void
language plpgsql
security definer
set search_path = ''
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
set search_path = ''
as $$
begin
  update public.duel_matches
  set status = 'cancelled'
  where id = p_match_id
    and player_a = auth.uid()
    and status = 'waiting';
end;
$$;

create or replace function public.duel_submit_review(
  p_match_id uuid,
  p_rating integer,          -- 1-5 mot människa (null mot bot)
  p_difficulty text,         -- 'too_easy' | 'just_right' | 'too_hard' (bot)
  p_report_reason text,      -- rapportorsak mot människa (null = ingen)
  p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_target uuid;
  v_is_bot boolean := false;
  v_matches_played integer := 0;
  v_weight numeric := 0.5;
  v_wsum numeric := 0;
  v_wcount numeric := 0;
  v_count integer := 0;
  v_weighted_avg numeric;
  v_recent_reports integer := 0;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then
    raise exception 'matchen finns inte';
  end if;
  if v_match.status not in ('finished', 'forfeit') then
    raise exception 'matchen är inte avslutad';
  end if;
  if v_match.player_a <> v_user and v_match.player_b <> v_user then
    raise exception 'du är inte deltagare i matchen';
  end if;
  if exists (
    select 1 from public.duel_reviews
    where match_id = p_match_id and reviewer_id = v_user
  ) then
    raise exception 'du har redan recenserat den här matchen';
  end if;

  -- Måltavla: motståndaren eller boten.
  if v_match.player_b is null then
    v_is_bot := true;
  else
    v_target := case
      when v_match.player_a = v_user then v_match.player_b
      else v_match.player_a
    end;
  end if;

  -- Trovärdighetsvikt: 0.5 -> 1.0 baserat på antal genomförda matcher.
  select count(*) into v_matches_played
  from public.duel_matches
  where (player_a = v_user or player_b = v_user)
    and status in ('finished', 'forfeit');
  v_weight := round(0.5 + 0.5 * least(1.0, v_matches_played::numeric / 20.0), 2);

  insert into public.duel_reviews
    (match_id, reviewer_id, target_user, target_is_bot, rating, difficulty,
     report_reason, comment, weight)
  values (
    p_match_id, v_user, v_target, v_is_bot,
    case when v_is_bot then null else coalesce(p_rating, 3) end,
    case when v_is_bot then coalesce(p_difficulty, 'just_right') else null end,
    case when v_is_bot then null else p_report_reason end,
    nullif(btrim(coalesce(p_comment, '')), ''),
    v_weight
  );

  if v_is_bot then
    -- Bot-svårighet: "för lätt" => boten blir svårare (+25), "för svår" =>
    -- lättare (-25), "lagom" => rör sig tillbaka mot noll. Spärr ±200.
    update public.player_profiles
    set bot_skill_offset = case
          when coalesce(p_difficulty, 'just_right') = 'too_easy'
            then least(200, bot_skill_offset + 25)
          when coalesce(p_difficulty, 'just_right') = 'too_hard'
            then greatest(-200, bot_skill_offset - 25)
          when bot_skill_offset > 0 then greatest(0, bot_skill_offset - 10)
          when bot_skill_offset < 0 then least(0, bot_skill_offset + 10)
          else 0
        end,
        updated_at = now()
    where user_id = v_user;
    return jsonb_build_object('status', 'ok');
  end if;

  -- Aggregera viktade omdömen på måltavlan.
  select coalesce(sum(rating * weight), 0), coalesce(sum(weight), 0)
    into v_wsum, v_wcount
  from public.duel_reviews where target_user = v_target;

  select count(*) into v_count
  from public.duel_reviews where target_user = v_target;

  select count(*) into v_recent_reports
  from public.duel_reviews
  where target_user = v_target and report_reason is not null
    and created_at > now() - interval '30 days';

  update public.player_profiles
  set received_rating_sum = v_wsum,
      received_rating_count = v_count,
      report_count = (
        select count(*) from public.duel_reviews
        where target_user = v_target and report_reason is not null
      ),
      updated_at = now()
  where user_id = v_target;

  v_weighted_avg := case
    when v_wcount > 0 then v_wsum / v_wcount
    else null
  end;

  -- Auto-flaggning: minst 3 omdömen med viktat snitt <= 2.0,
  -- eller minst 3 rapporter de senaste 30 dagarna.
  if (v_count >= 3 and v_weighted_avg is not null and v_weighted_avg <= 2.0)
     or v_recent_reports >= 3 then
    update public.player_profiles
    set flagged = true, flagged_at = coalesce(flagged_at, now()), updated_at = now()
    where user_id = v_target and not flagged;
  end if;

  -- Auto-avflagga när omdömena har förbättrats tillräckligt.
  if exists (select 1 from public.player_profiles where user_id = v_target and flagged) then
    if v_count >= 5 and v_weighted_avg >= 3.5 and v_recent_reports < 2 then
      update public.player_profiles
      set flagged = false, flagged_at = null, updated_at = now()
      where user_id = v_target;
    end if;
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Skicka in veckans XP (kumulativt — värdet kan bara växa under veckan).
-- Säkerställer också att spelarprofilen finns (namn från Google eller
-- "Spelare") så att visningsnamnet alltid kan visas.

create or replace function public.leaderboard_submit(p_week text, p_xp integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.player_profiles (user_id, display_name)
  values (
    auth.uid(),
    coalesce(nullif((select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid()), ''), 'Spelare')
  )
  on conflict (user_id) do nothing;

  insert into public.leaderboard_entries (user_id, week, xp)
  values (auth.uid(), p_week, greatest(p_xp, 0))
  on conflict (user_id, week) do update
    set xp = greatest(public.leaderboard_entries.xp, excluded.xp),
        updated_at = now();
end;
$$;

-- Veckans topplista med rank och visningsnamn. is_me markerar egna raden.

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
  limit p_limit;
$$;

-- Ändra eget visningsnamn (används även av duellerna).

create or replace function public.leaderboard_set_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.player_profiles (user_id, display_name)
  values (auth.uid(), coalesce(nullif(trim(p_display_name), ''), 'Spelare'))
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now();
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Droppa implementationerna i private och därefter schemat private.
--    (Explicita argumentlistor; default-värden utelämnas i drop-signaturen.)
-- ----------------------------------------------------------------------------

drop function if exists private.duel_ensure_profile(text);
drop function if exists private.duel_join_queue(text);
drop function if exists private.duel_cancel_queue();
drop function if exists private.duel_start_bot_match(text);
drop function if exists private.duel_submit_answer(uuid, text, integer, boolean, integer);
drop function if exists private.duel_mark_finished(uuid, integer, integer);
drop function if exists private.duel_finish_bot(uuid, integer, integer, integer);
drop function if exists private.duel_forfeit(uuid);
drop function if exists private.duel_claim_stall_win(uuid);
drop function if exists private.duel_create_private();
drop function if exists private.duel_join_private(text);
drop function if exists private.duel_cancel_private(uuid);
drop function if exists private.duel_submit_review(uuid, integer, text, text, text);
drop function if exists private.leaderboard_submit(text, integer);
drop function if exists private.leaderboard_get(text, integer);
drop function if exists private.leaderboard_set_name(text);

drop schema if exists private;

-- ----------------------------------------------------------------------------
-- 3. Återställ dagens grant-läge (före 0006): endast authenticated, utom
--    leaderboard_get som även anon får köra.
-- ----------------------------------------------------------------------------

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
revoke execute on function public.duel_submit_review(uuid, integer, text, text, text) from public, anon;
revoke execute on function public.leaderboard_submit(text, integer) from public, anon;
revoke execute on function public.leaderboard_get(text, integer) from public, anon;
revoke execute on function public.leaderboard_set_name(text) from public, anon;

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
grant execute on function public.duel_submit_review(uuid, integer, text, text, text) to authenticated;
grant execute on function public.leaderboard_submit(text, integer) to authenticated;
grant execute on function public.leaderboard_set_name(text) to authenticated;

-- Dagens läge för den publika topplistan: även anon får köra.
grant execute on function public.leaderboard_get(text, integer) to anon, authenticated;

commit;

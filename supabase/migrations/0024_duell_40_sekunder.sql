-- 0024: 40 sekunder per fråga i dueller (Oscar 2026-10-27).
--
-- Frågorna är nu på provets nivå, och 20 s räckte inte. Klienten
-- (DUEL_SECONDS_PER_QUESTION) och servern ändras tillsammans:
-- * duel_submit_answer (från 0004) godtar och begränsar svarstiden till 40 000 ms
--   i stället för 20 000 ms. Funktionen är i övrigt oförändrad.
-- * duel_claim_stall_win (från 0016) godtar anspråk på vinst tidigast 8 minuter
--   efter matchstart i stället för 5 (10 frågor x 40 s + marginal). Funktionen är
--   i övrigt oförändrad.
-- Behörigheterna påverkas inte av create or replace.

create or replace function public.duel_submit_answer(
  p_match_id uuid,
  p_question_id text,
  p_chosen integer,
  p_time_ms integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_correct_index integer;
  v_correct boolean;
begin
  if not exists (
    select 1 from public.duel_matches m
    where m.id = p_match_id
      and (m.player_a = v_user or m.player_b = v_user)
      and m.status = 'active'
  ) then
    raise exception 'invalid match';
  end if;

  select correct_index into v_correct_index
  from public.duel_questions
  where question_id = p_question_id;
  if not found then
    raise exception 'unknown question';
  end if;

  p_chosen := coalesce(p_chosen, -1);
  p_time_ms := coalesce(p_time_ms, 40000);
  v_correct := (p_chosen >= 0 and p_chosen = v_correct_index);
  p_time_ms := greatest(1, least(p_time_ms, 40000));

  -- Spärra mer än 10 svar per spelare och match (en duell har exakt 10 frågor),
  -- så att en klient inte kan blåsa upp antalet rätt med extra fråge-id:n.
  if (select count(*) from public.duel_answers
      where match_id = p_match_id and user_id = v_user) >= 10 then
    raise exception 'för många svar';
  end if;

  insert into public.duel_answers (match_id, user_id, question_id, chosen, correct, time_ms)
  values (p_match_id, v_user, p_question_id, p_chosen, v_correct, p_time_ms)
  on conflict (match_id, user_id, question_id) do nothing;
end;
$$;

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

  -- En duell är 10 frågor x 40 s; klienten skickar in obesvarade frågor när
  -- tiden tar slut. Åtta minuter från start räcker med god marginal för den
  -- som faktiskt spelar - och den som har svarat nyss spelar fortfarande.
  if now() < coalesce(v_match.started_at, v_match.created_at) + interval '8 minutes'
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

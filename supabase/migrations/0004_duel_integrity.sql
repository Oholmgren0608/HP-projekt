-- HP Lift: Duelintegritet — server-auktoritativ rättning, tätare RLS
-- och mindre dataexponering.
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0003).

-- ---------------------------------------------------------------------------
-- 1. Facit-tabell. Klienten får aldrig läsa den (inga policies); SECURITY
--    DEFINER-funktionerna körs med ägarens rättigheter och kan läsa facit.
-- ---------------------------------------------------------------------------
create table if not exists public.duel_questions (
  question_id text primary key,
  correct_index integer not null check (correct_index >= 0)
);

alter table public.duel_questions enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Facit (136 frågor).
-- ---------------------------------------------------------------------------
insert into public.duel_questions (question_id, correct_index) values
  ('ord-1', 1),
  ('ord-2', 1),
  ('ord-3', 1),
  ('ord-4', 1),
  ('ord-5', 1),
  ('ord-6', 1),
  ('ord-7', 1),
  ('ord-8', 1),
  ('ord-9', 1),
  ('ord-10', 1),
  ('ord-11', 0),
  ('ord-12', 1),
  ('ord-13', 1),
  ('ord-14', 1),
  ('ord-15', 1),
  ('ord-16', 0),
  ('ord-17', 1),
  ('ord-18', 1),
  ('ord-19', 1),
  ('ord-20', 0),
  ('ord-21', 1),
  ('ord-22', 1),
  ('ord-23', 1),
  ('ord-24', 1),
  ('dtk-1', 1),
  ('dtk-2', 1),
  ('dtk-3', 1),
  ('dtk-4', 1),
  ('dtk-5', 0),
  ('dtk-6', 0),
  ('dtk-7', 3),
  ('dtk-8', 1),
  ('mek-1', 1),
  ('mek-2', 2),
  ('mek-3', 0),
  ('mek-4', 3),
  ('mek-5', 1),
  ('mek-6', 2),
  ('mek-7', 0),
  ('mek-8', 3),
  ('mek-9', 1),
  ('mek-10', 2),
  ('mek-11', 0),
  ('mek-12', 3),
  ('mek-13', 1),
  ('mek-14', 2),
  ('mek-15', 0),
  ('mek-16', 3),
  ('mek-17', 1),
  ('mek-18', 2),
  ('mek-19', 0),
  ('mek-20', 3),
  ('mek-21', 0),
  ('mek-22', 1),
  ('mek-23', 2),
  ('mek-24', 3),
  ('mek-25', 0),
  ('mek-26', 1),
  ('mek-27', 2),
  ('mek-28', 3),
  ('mek-29', 0),
  ('mek-30', 1),
  ('mek-31', 2),
  ('mek-32', 3),
  ('mek-33', 0),
  ('mek-34', 1),
  ('mek-35', 2),
  ('mek-36', 3),
  ('mek-37', 0),
  ('mek-38', 1),
  ('mek-39', 2),
  ('mek-40', 3),
  ('mek-41', 0),
  ('mek-42', 1),
  ('mek-43', 2),
  ('mek-44', 3),
  ('mek-45', 0),
  ('mek-46', 1),
  ('mek-47', 2),
  ('mek-48', 3),
  ('mek-49', 0),
  ('mek-50', 1),
  ('mek-51', 2),
  ('mek-52', 3),
  ('mek-53', 0),
  ('mek-54', 1),
  ('mek-55', 2),
  ('mek-56', 3),
  ('mek-57', 0),
  ('mek-58', 1),
  ('mek-59', 2),
  ('mek-60', 3),
  ('mek-61', 0),
  ('mek-62', 1),
  ('mek-63', 2),
  ('mek-64', 3),
  ('mek-65', 0),
  ('mek-66', 1),
  ('mek-67', 2),
  ('mek-68', 3),
  ('mek-69', 0),
  ('mek-70', 1),
  ('mek-71', 2),
  ('mek-72', 3),
  ('mek-73', 0),
  ('mek-74', 1),
  ('mek-75', 2),
  ('mek-76', 3),
  ('mek-77', 0),
  ('mek-78', 1),
  ('mek-79', 2),
  ('mek-80', 3),
  ('xyz-1', 1),
  ('xyz-2', 1),
  ('xyz-3', 1),
  ('xyz-4', 1),
  ('xyz-5', 1),
  ('xyz-6', 1),
  ('xyz-7', 1),
  ('xyz-8', 1),
  ('kva-1', 2),
  ('kva-2', 2),
  ('kva-3', 3),
  ('kva-4', 2),
  ('kva-5', 0),
  ('kva-6', 0),
  ('kva-7', 3),
  ('kva-8', 2),
  ('nog-1', 2),
  ('nog-2', 3),
  ('nog-3', 2),
  ('nog-4', 1),
  ('nog-5', 0),
  ('nog-6', 2),
  ('nog-7', 0),
  ('nog-8', 2) on conflict (question_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Alla matchmutationer går via SECURITY DEFINER-funktioner; ta bort den
--    breda UPDATE-policyn så klienten inte kan skriva direkt.
-- ---------------------------------------------------------------------------
drop policy if exists "matches_update_involved" on public.duel_matches;

-- ---------------------------------------------------------------------------
-- 4. Täta till duel_answers: dölj motståndarens per-fråga-svar under pågående
--    match (fixar facit-läckan) och kräv matchmedlemskap vid insert.
-- ---------------------------------------------------------------------------
drop policy if exists "answers_insert_own" on public.duel_answers;
-- Ingen INSERT-policy: insättning sker enbart via SECURITY DEFINER-funktionen
-- duel_submit_answer, så klienten kan aldrig skriva `correct` direkt.

drop policy if exists "answers_select_involved" on public.duel_answers;
create policy "answers_select_involved" on public.duel_answers
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.duel_matches m
      where m.id = match_id
        and (m.player_a = auth.uid() or m.player_b = auth.uid())
        and m.status in ('finished', 'forfeit')
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Recensioner: klienten läser bara sina egna recensioner.
-- ---------------------------------------------------------------------------
drop policy if exists "reviews_select_involved" on public.duel_reviews;
create policy "reviews_select_involved" on public.duel_reviews
  for select using (reviewer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Minimera profil-exponering: egen rad i sin helhet, övriga ser bara den
--    publika leaderboard-vyn.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.player_profiles;
drop policy if exists "profiles_select_own" on public.player_profiles;
create policy "profiles_select_own" on public.player_profiles
  for select using (auth.uid() = user_id);

create or replace view public.duel_public_profiles as
select user_id, display_name, elo, wins, losses, draws
from public.player_profiles;

revoke select on public.duel_public_profiles from anon, public;
grant select on public.duel_public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 7. received_rating_count ska lagra viktad summa (numeric) för konsistens
--    med received_rating_sum.
-- ---------------------------------------------------------------------------
alter table public.player_profiles
  alter column received_rating_count type numeric using received_rating_count::numeric;

-- ---------------------------------------------------------------------------
-- 8. Ta bort de gamla, osäkra funktionssignaturerna.
-- ---------------------------------------------------------------------------
drop function if exists public.duel_submit_answer(uuid, text, integer, boolean, integer);
drop function if exists public.duel_mark_finished(uuid, integer, integer);
drop function if exists public.duel_finish_bot(uuid, integer, integer, integer);

-- ---------------------------------------------------------------------------
-- 9. Server-auktoritativ rättning (facit läses från duel_questions).
-- ---------------------------------------------------------------------------
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
  p_time_ms := coalesce(p_time_ms, 20000);
  v_correct := (p_chosen >= 0 and p_chosen = v_correct_index);
  p_time_ms := greatest(1, least(p_time_ms, 20000));

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

-- Markera dig som klar. Resultat hämtas från duel_answers (inte klienten).
-- När båda är klara avgörs vinnare + ELO atomärt.
create or replace function public.duel_mark_finished(
  p_match_id uuid
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

  -- Markera spelaren som klar och härled hens resultat från duel_answers.
  if v_match.player_a = v_user then
    update public.duel_matches
    set a_finished_at = now(),
        a_correct = (
          select count(*) from public.duel_answers da
          where da.match_id = p_match_id and da.user_id = v_match.player_a and da.correct
        ),
        a_time_ms = (
          select coalesce(sum(da.time_ms), 0) from public.duel_answers da
          where da.match_id = p_match_id and da.user_id = v_match.player_a
        )
    where id = p_match_id;
  elsif v_match.player_b = v_user then
    update public.duel_matches
    set b_finished_at = now(),
        b_correct = (
          select count(*) from public.duel_answers da
          where da.match_id = p_match_id and da.user_id = v_match.player_b and da.correct
        ),
        b_time_ms = (
          select coalesce(sum(da.time_ms), 0) from public.duel_answers da
          where da.match_id = p_match_id and da.user_id = v_match.player_b
        )
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

-- Avsluta match mot bot (K=16). Spelarens resultat härleds från duel_answers.
create or replace function public.duel_finish_bot(
  p_match_id uuid,
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
  v_score numeric := 0.5;
  v_delta integer := 0;
  v_winner uuid;
  v_player_correct integer;
  v_player_time_ms integer;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found then return null; end if;
  if v_match.player_a <> v_user or v_match.player_b is not null then return null; end if;
  if v_match.status <> 'active' then return null; end if;

  p_bot_correct := greatest(0, least(10, p_bot_correct));

  select count(*) filter (where correct),
         coalesce(sum(time_ms), 0)
    into v_player_correct, v_player_time_ms
  from public.duel_answers
  where match_id = p_match_id and user_id = v_user;

  if v_player_correct > p_bot_correct then
    v_winner := v_user; v_score := 1;
  elsif p_bot_correct > v_player_correct then
    v_winner := null; v_score := 0;
  else
    v_winner := null; v_score := 0.5;
  end if;

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
      a_correct = v_player_correct,
      b_correct = p_bot_correct,
      a_time_ms = v_player_time_ms,
      elo_a_delta = v_delta,
      finished_at = now()
  where id = p_match_id;

  return jsonb_build_object('delta', v_delta, 'winner_is_me', (v_winner = v_user));
end;
$$;

-- Starta match mot AI-bot (spärrat för flaggade konton i Ranked).
create or replace function public.duel_start_bot_match(p_mode text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_elo integer;
  v_flagged boolean;
  v_match_id uuid;
begin
  delete from public.duel_queue where user_id = v_user;
  select elo into v_elo from public.player_profiles where user_id = v_user;
  v_elo := coalesce(v_elo, 1200);

  if p_mode = 'ranked' then
    select flagged into v_flagged from public.player_profiles where user_id = v_user;
    if coalesce(v_flagged, false) then
      raise exception 'Ditt konto är under granskning och kan inte spela Ranked just nu.';
    end if;
  end if;

  insert into public.duel_matches (mode, status, player_a, bot_elo, question_seed, started_at)
  values (p_mode, 'active', v_user, v_elo,
          md5(random()::text || clock_timestamp()::text), now())
  returning id into v_match_id;
  return v_match_id;
end;
$$;

-- Skicka in recension (konsekvent viktade lagrade kolumner).
create or replace function public.duel_submit_review(
  p_match_id uuid,
  p_rating integer,
  p_difficulty text,
  p_report_reason text,
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
  if v_match.player_a is distinct from v_user and v_match.player_b is distinct from v_user then
    raise exception 'du är inte deltagare i matchen';
  end if;
  if exists (
    select 1 from public.duel_reviews
    where match_id = p_match_id and reviewer_id = v_user
  ) then
    raise exception 'du har redan recenserat den här matchen';
  end if;

  if v_match.player_b is null then
    v_is_bot := true;
  else
    v_target := case
      when v_match.player_a = v_user then v_match.player_b
      else v_match.player_a
    end;
  end if;

  -- Serialisera samtidiga recensioner av samma måltavla så att den
  -- denormaliserade aggregatet (received_rating_*) inte tappar uppdateringar.
  if v_target is not null then
    perform 1 from public.player_profiles where user_id = v_target for update;
  end if;

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

  -- Aggregera konsekvent viktade omdömen på måltavlan.
  select coalesce(sum(rating * weight), 0), coalesce(sum(weight), 0)
    into v_wsum, v_wcount
  from public.duel_reviews where target_user = v_target;

  v_weighted_avg := case
    when v_wcount > 0 then v_wsum / v_wcount
    else null
  end;

  v_wsum := round(v_wsum, 2);
  v_wcount := round(v_wcount, 2);

  select count(*) into v_count
  from public.duel_reviews where target_user = v_target;

  select count(*) into v_recent_reports
  from public.duel_reviews
  where target_user = v_target and report_reason is not null
    and created_at > now() - interval '30 days';

  update public.player_profiles
  set received_rating_sum = v_wsum,
      received_rating_count = v_wcount,
      report_count = (
        select count(*) from public.duel_reviews
        where target_user = v_target and report_reason is not null
      ),
      updated_at = now()
  where user_id = v_target;

  if (v_count >= 3 and v_weighted_avg is not null and v_weighted_avg <= 2.0)
     or v_recent_reports >= 3 then
    update public.player_profiles
    set flagged = true, flagged_at = coalesce(flagged_at, now()), updated_at = now()
    where user_id = v_target and not flagged;
  end if;

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

-- ---------------------------------------------------------------------------
-- 10. Rättigheter (nya signaturer).
-- ---------------------------------------------------------------------------
revoke execute on function public.duel_submit_answer(uuid, text, integer, integer) from public, anon;
revoke execute on function public.duel_mark_finished(uuid) from public, anon;
revoke execute on function public.duel_finish_bot(uuid, integer) from public, anon;
revoke execute on function public.duel_start_bot_match(text) from public, anon;
revoke execute on function public.duel_submit_review(uuid, integer, text, text, text) from public, anon;

grant execute on function public.duel_submit_answer(uuid, text, integer, integer) to authenticated;
grant execute on function public.duel_mark_finished(uuid) to authenticated;
grant execute on function public.duel_finish_bot(uuid, integer) to authenticated;
grant execute on function public.duel_start_bot_match(text) to authenticated;
grant execute on function public.duel_submit_review(uuid, integer, text, text, text) to authenticated;

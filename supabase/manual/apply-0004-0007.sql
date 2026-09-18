-- =====================================================================
-- HP Lift — APPLICERA DE FYRA PENDING-MIGRATIONERNA (0004 -> 0007)
-- =====================================================================
-- VAD FILEN GÖR
--   Kör 0004_duel_integrity, 0005_questions, 0006_exam_import och
--   0007_usernames i EXAKT den ordningen. Det är de fyra migrationer som
--   saknas i live-databasen; 0001-0003, 0008 och 0009 finns redan.
--   Filen är byggd för att klistras in i Supabase Dashboard -> SQL Editor
--   och köras i ett svep.
--
-- KÖR BARA EN GÅNG
--   Filen är idempotent ENDAST i den mån migrationerna själva är det
--   (t.ex. create table if not exists, add column if not exists,
--   create index if not exists, on conflict do nothing). Flera satser i
--   0005/0006 (create table utan if not exists, create policy,
--   create unique index samt insert av seed-rader) är INTE idempotenta och
--   misslyckas om de körs två gånger. Kör därför filen en gång mot en
--   databas där de fyra migrationerna ännu inte är applicerade.
--
-- FÖRUTSÄTTNING
--   0001-0003 måste redan finnas (de är applicerade i live-databasen).
--
-- BLANDA INTE
--   Filen får ALDRIG kombineras med supabase/manual/0010_*.sql. 0010
--   återskapar de gamla 5/3/4-args-duell-RPC:erna och backar 0004:s
--   server-auktoritativa rättning; se varningshuvudet i 0010-filen.
--
-- VARFÖR INTE "supabase db push"?
--   supabase_migrations.schema_migrations är tom (migrationerna kördes
--   manuellt i SQL Editor), så db push tror att inget är applicerat och
--   skulle köra om allt. Alternativ om du vill använda CLI:t:
--     1. markera de redan körda som applicerade en gång:
--        supabase migration repair --status applied 0001 0002 0003 0008 0009 --linked
--     2. därefter:
--        supabase db push
--   Den här filen är den enkla vägen: den innehåller bara det som saknas.
-- =====================================================================

-- ============ MIGRATION 0004: duel_integrity ============
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

-- ============ MIGRATION 0005: questions ============
-- HP Lift: Frågebanker för övning (ORD, MEK, LÄS, ELF, DTK, XYZ, KVA, NOG)
-- samt reflektionsprompter. Innehållet är en 1:1-seed av de hårdkodade
-- TypeScript-bankerna i src/lib/{practice,practice-mek,practice-kvant}.ts.
-- Regenereras med: npx tsx scripts/emit-questions-sql.ts
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0003).

create table public.questions (
  id text primary key,
  kind text not null,
  prompt text not null,
  passage text,
  options jsonb not null,
  correct_index smallint not null,
  explain text not null
);

create table public.reflect_prompts (
  id text primary key,
  title text not null,
  prompts jsonb not null
);

alter table public.questions enable row level security;
alter table public.reflect_prompts enable row level security;

-- Skrivskyddad: frågorna läses av alla, men skrivs enbart via
-- Supabase Dashboard / service role.
create policy "public read questions" on public.questions
  for select to anon, authenticated using (true);

create policy "public read reflect_prompts" on public.reflect_prompts
  for select to anon, authenticated using (true);

insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-1', 'ord', 'Vad betyder ordet ”adekvat”?', null, jsonb_build_array('överdriven', 'lämplig / tillräcklig', 'otydlig', 'tillfällig'), 1, 'Adekvat betyder lämplig eller tillräcklig för ett givet syfte. Överdriven beskriver något som gått för långt, vilket är en annan dimension än lämplighet. Otydlig handlar om klarhet, inte om att passa syftet. Tillfällig syftar på varaktighet i tid, inte på lämplighet.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-2', 'ord', 'Vad betyder ”implikation”?', null, jsonb_build_array('direkt motsägelse', 'följd / underförstådd betydelse', 'offentlig debatt', 'formell ursäkt'), 1, 'En implikation är en följd eller underförstådd betydelse som ett påstående för med sig. Direkt motsägelse är motsatsen, eftersom en implikation snarare hänger ihop med utsagan än strider mot den. Offentlig debatt handlar om diskussion, inte om logisk följd. Formell ursäkt saknar helt kopplingen till följd eller antydan.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-3', 'ord', 'Vad betyder ”premissen”?', null, jsonb_build_array('slutsatserna', 'utgångspunkten / antagandet', 'undantaget', 'bevisbördan'), 1, 'Premissen är den utgångspunkt eller det antagande som ett resonemang bygger på. Slutsatserna är istället vad man kommer fram till efter resonemanget, alltså motsatt ände av tankekedjan. Undantaget rör avvikelser från en regel, inte grunden för argumentet. Bevisbördan handlar om vem som måste styrka ett påstående, vilket är en annan juridisk/logisk term.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-4', 'ord', 'Vad betyder ”ambivalent”?', null, jsonb_build_array('helt säker', 'kluven / dubbeltydigt sinnad', 'ointresserad', 'öppen och glad'), 1, 'Ambivalent betyder kluven eller att ha motstridiga känslor samtidigt. Helt säker är motsatsen, då det utesluter tvekan. Ointresserad beskriver brist på engagemang snarare än dubbelhet i känslor. Öppen och glad beskriver ett positivt, enhetligt sinnestillstånd utan den inneboende splittringen.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-5', 'ord', 'Vad betyder ”koncist”?', null, jsonb_build_array('långrandigt', 'kortfattat och precist', 'poetiskt', 'vardagligt'), 1, 'Koncist betyder kortfattat och precist formulerat. Långrandigt är motsatsen, eftersom det syftar på utdragna och ordrika formuleringar. Poetiskt handlar om stilistiskt bildspråk, inte om korthet. Vardagligt beskriver register snarare än hur kort eller precis en text är.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-6', 'ord', 'Vad betyder ”relativisera”?', null, jsonb_build_array('absolutgöra', 'sätta i perspektiv / tona ner absoluthet', 'förstora', 'bevisa'), 1, 'Att relativisera är att sätta något i perspektiv eller tona ner dess absoluta karaktär genom att jämföra med annat. Absolutgöra är motsatsen, eftersom det förstärker snarare än nyanserar ett påstående. Förstora handlar om att göra något större, inte om att relativisera dess betydelse. Bevisa syftar på att styrka sanningshalt, vilket inte har med perspektivering att göra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-7', 'ord', 'Vad betyder ”diskrepans”?', null, jsonb_build_array('överensstämmelse', 'skillnad / bristande överensstämmelse', 'sammanfattning', 'upprepning'), 1, 'Diskrepans betyder skillnad eller bristande överensstämmelse mellan till exempel två uppgifter. Överensstämmelse är motsatsen, då den beskriver att saker stämmer ihop. Sammanfattning handlar om att komprimera information, inte om att peka på skillnader. Upprepning innebär att säga samma sak igen, vilket är en annan process än att jämföra och hitta avvikelser.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-8', 'ord', 'Vad betyder ”eminent”?', null, jsonb_build_array('medelmåttig', 'framstående', 'okänd', 'tillfällig'), 1, 'Eminent betyder framstående eller synnerligen skicklig. Medelmåttig är närmast motsatsen, eftersom det beskriver genomsnittlig kvalitet. Okänd beskriver brist på uppmärksamhet, vilket strider mot att vara framstående. Tillfällig handlar om varaktighet i tid och saknar koppling till skicklighet eller status.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-9', 'ord', 'Vad betyder ”provisorisk”?', null, jsonb_build_array('slutgiltig', 'tillfällig', 'laglig', 'dyr'), 1, 'Provisorisk betyder tillfällig, ofta som en lösning i väntan på något bättre. Slutgiltig är motsatsen, då den betecknar det som är avgjort och bestående. Laglig rör lagenlighet, inte varaktighet. Dyr handlar om kostnad, vilket är en helt annan egenskap än hur länge något ska gälla.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-10', 'ord', 'Vad betyder ”subversiv”?', null, jsonb_build_array('stödjande', 'omstörtande / underminerande', 'neutral', 'högtidlig'), 1, 'Subversiv betyder omstörtande eller underminerande gentemot en rådande ordning. Stödjande är motsatsen, eftersom det innebär att man bidrar till att upprätthålla något snarare än att underminera det. Neutral beskriver avsaknad av ställningstagande, vilket inte stämmer med den aktiva undermineringen i subversiv. Högtidlig rör ett formellt tonläge och saknar den ifrågasättande innebörden.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-11', 'ord', 'Vad betyder ”tautologi”?', null, jsonb_build_array('cirkelresonemang / upprepning av samma sak', 'motsägelse', 'exempel', 'bevis'), 0, 'Tautologi är ett cirkelresonemang eller en upprepning av samma sak i andra ordalag. Motsägelse beskriver istället två påståenden som inte kan vara sanna samtidigt, vilket är motsatt logik. Exempel är en illustration av något, inte en upprepning av samma innebörd. Bevis syftar på belägg för ett påstående, vilket skiljer sig från att bara omformulera det.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-12', 'ord', 'Vad betyder ”kontroversiell”?', null, jsonb_build_array('allmänt accepterad', 'omstridd', 'hemlig', 'teknisk'), 1, 'Kontroversiell betyder omstridd, det väcker starka och motstridiga åsikter. Allmänt accepterad är motsatsen, eftersom den beskriver bred enighet snarare än konflikt. Hemlig handlar om att vara dold, inte om att vara omdebatterad. Teknisk syftar på fackmässig karaktär och har ingen koppling till grad av oenighet.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-13', 'ord', 'Vad betyder ”indignation”?', null, jsonb_build_array('nöjdhet', 'rättmätig vrede / upprördhet', 'nyfikenhet', 'trötthet'), 1, 'Indignation betyder rättmätig vrede eller upprördhet över något som uppfattas som orätt. Nöjdhet är motsatsen, då den beskriver ett tillfredsställt sinnestillstånd. Nyfikenhet handlar om intresse för att veta mer, inte om upprördhet. Trötthet syftar på brist på energi och saknar den känslomässiga laddningen i indignation.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-14', 'ord', 'Vad betyder ”implicit”?', null, jsonb_build_array('uttryckligen sagt', 'underförstått', 'felaktigt', 'högljutt'), 1, 'Implicit betyder underförstått, det är antytt snarare än uttalat. Uttryckligen sagt är motsatsen, eftersom det betecknar det som sägs rakt ut. Felaktigt handlar om sanningshalt, inte om hur något förmedlas. Högljutt rör volym eller intensitet i uttryck, vilket saknar koppling till underförstådd betydelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-15', 'ord', 'Vad betyder ”konsensus”?', null, jsonb_build_array('konflikt', 'samförstånd', 'omröstning', 'kompromisslöshet'), 1, 'Konsensus betyder samförstånd eller allmän enighet. Konflikt är motsatsen, då den beskriver oenighet snarare än samstämmighet. Omröstning är en metod för att fatta beslut men innebär inte i sig enighet. Kompromisslöshet betecknar en ovilja att mötas, vilket är raka motsatsen till samförstånd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-16', 'ord', 'Vad betyder ”epitet”?', null, jsonb_build_array('tillnamn / beskrivande beteckning', 'fotnot', 'citat', 'rubrik'), 0, 'Epitet är ett tillnamn eller en beskrivande beteckning som fästs vid någon eller något. Fotnot är en förklarande not i en text, vilket är en annan textuell funktion än ett tillnamn. Citat är ett återgivet uttalande, inte en beskrivande benämning. Rubrik är en titel som inleder en text, vilket skiljer sig från ett epitet som beskriver en person eller sak.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-17', 'ord', 'Vad betyder ”fatal”?', null, jsonb_build_array('ofarlig', 'ödesdiger / katastrofal', 'rolig', 'långsam'), 1, 'Fatal betyder ödesdiger eller katastrofal, ofta med allvarliga eller dödliga följder. Ofarlig är motsatsen, eftersom den utesluter allvarlig skada. Rolig beskriver ett lustfyllt intryck, vilket är oförenligt med den allvarliga innebörden i fatal. Långsam handlar om hastighet, inte om graden av allvar i följderna.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-18', 'ord', 'Vad betyder ”abstrahera”?', null, jsonb_build_array('göra konkret', 'lyfta ut det väsentliga / bortse från detaljer', 'räkna', 'översätta'), 1, 'Att abstrahera är att lyfta ut det väsentliga och bortse från enskilda detaljer. Göra konkret är motsatsen, då det innebär att knyta något till specifika, konkreta exempel snarare än att generalisera. Räkna handlar om matematisk bearbetning, inte om att bortse från detaljer. Översätta rör överföring mellan språk, vilket är en annan process än generalisering.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-19', 'ord', 'Vad betyder ”legitim”?', null, jsonb_build_array('olaglig', 'berättigad / giltig', 'hemlig', 'tillfällig'), 1, 'Legitim betyder berättigad eller giltig, ofta i juridisk eller moralisk mening. Olaglig är motsatsen, eftersom den betecknar det som strider mot lagen. Hemlig handlar om att vara dold, vilket inte har med giltighet att göra. Tillfällig syftar på varaktighet i tid, en annan egenskap än att vara berättigad.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-20', 'ord', 'Vad betyder ”paradox”?', null, jsonb_build_array('självmotsägande påstående som kan rymma en sanning', 'enkel sanning', 'statistik', 'citat'), 0, 'En paradox är ett självmotsägande påstående som trots det kan rymma en sanning. Enkel sanning är motsatsen, då den saknar den motsägelsefulla ytan som utmärker en paradox. Statistik handlar om sifferunderlag, inte om ett logiskt spänningsfullt påstående. Citat är ett återgivet uttalande, vilket inte i sig behöver innehålla någon motsägelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-21', 'ord', 'Vad betyder ”resursstark”?', null, jsonb_build_array('fattig på medel', 'som har goda tillgångar / kapacitet', 'ointresserad', 'svag'), 1, 'Resursstark betyder att ha goda tillgångar eller kapacitet, till exempel ekonomiskt eller organisatoriskt. Fattig på medel är motsatsen, eftersom den beskriver brist snarare än överflöd av resurser. Ointresserad handlar om engagemang, inte om tillgång till resurser. Svag beskriver bristande kraft eller förmåga, vilket är motsatt innebörd till att vara resursstark.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-22', 'ord', 'Vad betyder ”dogmatisk”?', null, jsonb_build_array('öppen för kritik', 'låst vid fasta läror utan nyans', 'humoristisk', 'praktisk'), 1, 'Dogmatisk betyder att vara låst vid fasta läror utan att öppna för nyans eller kritik. Öppen för kritik är motsatsen, eftersom den beskriver en beredskap att ompröva sina ståndpunkter. Humoristisk rör lekfullhet i uttryck, vilket saknar kopplingen till orubblig övertygelse. Praktisk handlar om verklighetsanpassning snarare än om orubblig fasthet vid en lära.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-23', 'ord', 'Vad betyder ”implicera”?', null, jsonb_build_array('utesluta', 'innebära / antyda', 'bevisa med experiment', 'citera'), 1, 'Att implicera är att innebära eller antyda något utan att säga det rakt ut. Utesluta är motsatsen, då det innebär att avlägsna eller frånta möjligheten, inte att antyda. Bevisa med experiment syftar på empirisk verifiering, vilket är en mycket starkare och annorlunda process än att antyda. Citera handlar om att återge någons ord, inte om att låta något förstås indirekt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('ord-24', 'ord', 'Vad betyder ”koherent”?', null, jsonb_build_array('osammanhängande', 'sammanhängande / logiskt enhetlig', 'lång', 'poetisk'), 1, 'Koherent betyder sammanhängande och logiskt enhetlig, utan inbördes motsägelser. Osammanhängande är motsatsen, eftersom det just beskriver brist på inre logik. Lång handlar om omfång, vilket är oberoende av om resonemanget hänger ihop. Poetisk rör stilistiskt bildspråk, vilket inte har med logisk sammanhållning att göra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-1', 'las', 'Vad är textens huvudpoäng?', 'När medier talar om ”informationsöverflöd” är problemet sällan mängden fakta i sig. Snarare handlar det om att urval och inramning styr vad som uppfattas som viktigt. Den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Informationskompetens är därför mindre en fråga om snabb googling och mer om tålamod: att stanna kvar i en text tillräckligt länge för att se vad som faktiskt påstås.', jsonb_build_array('Fler fakta gör alltid människor bättre informerade', 'Problemet är främst urval och inramning, inte rå mängd information', 'Googling är den viktigaste färdigheten', 'Medier bör sluta publicera långa texter'), 1, 'Texten framhåller att problemet är hur information väljs ut och ramas in, inte hur mycket information som finns, vilket gör att huvudpoängen handlar om urval och inramning snarare än mängd. Att fler fakta alltid gör människor bättre informerade motsägs av just den poängen, eftersom texten ifrågasätter att mer data i sig hjälper. Att googling är den viktigaste färdigheten är en för smal och konkret tolkning som inte fångar resonemanget om inramning. Att medier bör sluta publicera långa texter nämns inte och är en helt annan slutsats än den om urval och tålamod.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-2', 'las', 'Vilket påstående stöds av texten?', 'När medier talar om ”informationsöverflöd” är problemet sällan mängden fakta i sig. Snarare handlar det om att urval och inramning styr vad som uppfattas som viktigt. Den som bara samlar mer data utan att pröva källor och perspektiv riskerar att bli sämre informerad, inte bättre. Informationskompetens är därför mindre en fråga om snabb googling och mer om tålamod: att stanna kvar i en text tillräckligt länge för att se vad som faktiskt påstås.', jsonb_build_array('Att samla mer data utan källkritik kan försämra förståelsen', 'Alla nyhetsmedier ljuger medvetet', 'Tålamod är oviktigt vid läsning', 'Fakta och inramning är samma sak'), 0, 'Texten stödjer att det är problematiskt att samla mer data utan att pröva källorna, eftersom det är just denna okritiska datainsamling som texten varnar för. Att alla nyhetsmedier ljuger medvetet är en överdrift som går längre än vad texten påstår om brister i granskning. Att tålamod är oviktigt vid läsning strider mot textens betoning av tålamod som en dygd. Att fakta och inramning är samma sak motsäger textens poäng om att det är just skillnaden mellan dem som spelar roll.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-3', 'las', 'Vad menar författaren med att forskningens värde inte bara sitter i resultatet?', 'I debatten om forskningsfinansiering framställs ofta ”nyttiga” resultat som det enda måttet på framgång. Men forskningens värde sitter lika mycket i metoddisciplin: att formulera frågor precist, att redovisa osäkerhet och att låta negativa fynd synas. När bara spektakulära resultat belönas uppstår ett snedvridet urval av vad som publiceras. Det skadar både vetenskapen och allmänhetens tillit, eftersom bilden av kunskap blir mer säker än den egentligen är.', jsonb_build_array('Att negativa fynd bör döljas', 'Att metod, osäkerhet och negativa fynd också är centrala', 'Att spektakulära resultat alltid är bäst', 'Att finansiering bör upphöra'), 1, 'Författaren menar att forskningens värde också ligger i metoddisciplin, redovisad osäkerhet och negativa fynd, inte bara i det slutliga resultatet. Att negativa fynd bör döljas är motsatsen till vad som lyfts fram, eftersom texten snarare vill synliggöra dem. Att spektakulära resultat alltid är bäst är precis den syn som texten ifrågasätter genom att peka på andra värden i forskningen. Att finansiering bör upphöra är en långtgående slutsats som inte har stöd i resonemanget om vad som gör forskning värdefull.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-4', 'las', 'Vilken följd varnar texten för?', 'I debatten om forskningsfinansiering framställs ofta ”nyttiga” resultat som det enda måttet på framgång. Men forskningens värde sitter lika mycket i metoddisciplin: att formulera frågor precist, att redovisa osäkerhet och att låta negativa fynd synas. När bara spektakulära resultat belönas uppstår ett snedvridet urval av vad som publiceras. Det skadar både vetenskapen och allmänhetens tillit, eftersom bilden av kunskap blir mer säker än den egentligen är.', jsonb_build_array('Ökad publicering av negativa fynd', 'Snedvridet urval och överdriven bild av säkerhet', 'Lägre krav på metod', 'Att forskare slutar formulera frågor'), 1, 'Texten varnar för att belöning av spektakulära resultat leder till snedvridet urval och en överdriven bild av hur säker kunskapen egentligen är. Ökad publicering av negativa fynd är motsatt riktning mot vad som varnas för, eftersom det snarare skulle motverka snedvridningen. Lägre krav på metod är inte den konsekvens som texten pekar ut, utan snarare en följd av snedvridet urval än varningen i sig. Att forskare slutar formulera frågor nämns inte och ligger utanför det som beskrivs som konsekvens.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-5', 'las', 'Vilken beskrivning av städernas grönska stämmer bäst?', 'Städers grönska beskrivs ibland som ren dekoration. Forskning visar dock att träd och parker påverkar temperatur, luftkvalitet och människors stressnivåer. Effekten är störst i täta områden där hårdgjorda ytor annars samlar värme. Samtidigt är grönska ojämnt fördelad: socioekonomiskt starka stadsdelar har ofta mer vegetation. Att plantera träd är därför inte bara estetik, utan en fråga om rättvisa och folkhälsa — förutsatt att skötsel och lokal förankring finns.', jsonb_build_array('Grönska är bara dekoration', 'Grönska har mätbara effekter och är ojämnt fördelad', 'Träd hjälper bara på landsbygden', 'Socioekonomi saknar betydelse för vegetation'), 1, 'Texten kopplar samman grönskans mätbara effekter, till exempel på temperatur och hälsa, med att den är ojämnt fördelad mellan olika områden. Att grönska bara är dekoration motsäger att texten lyfter fram konkreta, mätbara effekter. Att träd bara hjälper på landsbygden strider mot att resonemanget handlar om städer. Att socioekonomi saknar betydelse för vegetation går emot att texten just kopplar den ojämna fördelningen till sociala och ekonomiska skillnader.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('las-6', 'las', 'Vad krävs enligt texten för att trädsatsningar ska fungera?', 'Städers grönska beskrivs ibland som ren dekoration. Forskning visar dock att träd och parker påverkar temperatur, luftkvalitet och människors stressnivåer. Effekten är störst i täta områden där hårdgjorda ytor annars samlar värme. Samtidigt är grönska ojämnt fördelad: socioekonomiskt starka stadsdelar har ofta mer vegetation. Att plantera träd är därför inte bara estetik, utan en fråga om rättvisa och folkhälsa — förutsatt att skötsel och lokal förankring finns.', jsonb_build_array('Bara fler planteringsceremonier', 'Skötsel och lokal förankring', 'Att undvika täta områden', 'Att ta bort parker i rika områden'), 1, 'Texten anger uttryckligen att skötsel och lokal förankring krävs för att trädsatsningar ska fungera på sikt. Fler planteringsceremonier beskriver en engångshändelse och saknar den långsiktiga skötsel som texten kräver. Att undvika täta områden nämns inte som ett villkor för att satsningarna ska lyckas. Att ta bort parker i rika områden är en omfördelningsåtgärd som inte är det som texten anger som förutsättning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('elf-1', 'elf', 'What is the main claim of the passage?', 'Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.', jsonb_build_array('Remote work always increases productivity', 'The hidden cost is lost informal learning, so mentorship must be redesigned', 'Hallways are more important than software', 'Junior staff prefer offices for social reasons only'), 1, 'The passage''s main claim is that remote work carries a hidden cost in lost informal learning, which means mentorship needs to be deliberately redesigned rather than left to chance. The claim that remote work always increases productivity overstates the passage''s point, which is about a specific cultural cost rather than a blanket productivity effect. Saying hallways matter more than software takes a supporting image too literally instead of the broader argument about learning. Reducing junior staff''s preference for offices to social reasons only ignores the passage''s emphasis on learning, not just socializing.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('elf-2', 'elf', 'According to the passage, what do weaker remote strategies miss?', 'Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.', jsonb_build_array('The cultural cost of fewer informal learning moments', 'The price of office furniture', 'How to schedule more meetings', 'That flexibility never matters'), 0, 'Weaker remote strategies overlook the cultural cost of fewer informal learning moments, since they treat remote work only as a logistical matter. The price of office furniture is irrelevant and not something the passage discusses as a missed cost. Scheduling more meetings is not identified as the missing insight, since the issue is the quality of informal exchange, not meeting frequency. Claiming flexibility never matters overstates the passage''s position, which criticizes shallow strategies, not flexibility itself.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('elf-3', 'elf', 'What does the author suggest successful organizations do?', 'Remote work is often framed as a simple trade-off between flexibility and productivity. Yet the more interesting shift is cultural: when colleagues no longer share the same hallway, informal learning shrinks. Junior staff lose the half-overheard conversations that once taught them how decisions are made. Companies that treat remote work as a logistics problem alone — desks, software, meetings — miss this quieter cost. The organizations that adapt best redesign mentorship deliberately, instead of hoping it happens by accident.', jsonb_build_array('Ban remote work', 'Redesign mentorship on purpose', 'Add more hallways online', 'Ignore junior staff'), 1, 'According to the author, successful organizations deliberately redesign mentorship to compensate for what remote work removes. Banning remote work contradicts the passage''s assumption that remote work continues and simply needs better mentorship. Adding more hallways online is a literal misreading of the hallway image rather than the actual recommendation to redesign mentorship. Ignoring junior staff is the opposite of the intent, since the passage''s concern is precisely about supporting them.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('elf-4', 'elf', 'Which statement best matches the passage?', 'Climate reporting has improved at describing extreme weather, but it still struggles with time. Readers are shown a flood or a fire as a dramatic event, then the story ends. The slower processes — soil degradation, insurance retreat, rising baseline heat — get less airtime because they lack a single climax. This narrative bias does not mean journalists are dishonest; it means the formats that attract attention favour suddenness. Understanding climate risk therefore requires reading past the event to the trend underneath.', jsonb_build_array('Journalists invent climate disasters', 'Sudden events get more attention than slow trends, so readers must look for the trend', 'Floods are unimportant', 'Insurance is unrelated to climate'), 1, 'The passage''s core idea is that sudden events attract more attention than slow-moving trends, so readers need to actively look for the underlying trend themselves. Saying journalists invent climate disasters goes beyond the claim, which is about attention bias, not fabrication. Calling floods unimportant misreads the point, since floods are used as an example of a sudden event, not dismissed as trivial. Saying insurance is unrelated to climate ignores that such details likely serve as evidence within the passage''s argument, not as an unrelated aside.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-1', 'dtk', 'Vilken kommun hade högst andel cykelresor 2024?', 'Andel cykelresor av alla resor (procent)
Kommun A: 2022: 12  2023: 14  2024: 15
Kommun B: 2022: 18  2023: 17  2024: 19
Kommun C: 2022: 9   2023: 11  2024: 13
Kommun D: 2022: 16  2023: 16  2024: 18', jsonb_build_array('A', 'B', 'C', 'D'), 1, 'År 2024 hade B högst andel med 19 procent, jämfört med D:s 18, A:s 15 och C:s 13, vilket gör B till den kommun med störst cykelandel. A och C ligger klart lägre och kan uteslutas direkt, och D:s 18 procent är nära men ändå lägre än B:s 19.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-2', 'dtk', 'Hur många procentenheter ökade Kommun A mellan 2022 och 2024?', 'Andel cykelresor av alla resor (procent)
Kommun A: 2022: 12  2023: 14  2024: 15
Kommun B: 2022: 18  2023: 17  2024: 19
Kommun C: 2022: 9   2023: 11  2024: 13
Kommun D: 2022: 16  2023: 16  2024: 18', jsonb_build_array('2', '3', '4', '15'), 1, 'Kommun A gick från 12 procent 2022 till 15 procent 2024, en ökning med 3 procentenheter. Alternativen 2 och 4 motsvarar inte differensen mellan dessa två värden, och 15 procentenheter vore orimligt stort eftersom det är själva slutvärdet, inte förändringen.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-3', 'dtk', 'Vilken kommun minskade något mellan 2022 och 2023?', 'Andel cykelresor av alla resor (procent)
Kommun A: 2022: 12  2023: 14  2024: 15
Kommun B: 2022: 18  2023: 17  2024: 19
Kommun C: 2022: 9   2023: 11  2024: 13
Kommun D: 2022: 16  2023: 16  2024: 18', jsonb_build_array('A', 'B', 'C', 'D'), 1, 'B är den enda kommun som minskade mellan 2022 och 2023, från 18 till 17 procent. A, C och D antingen ökade eller låg still under samma period och kan därför uteslutas.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-4', 'dtk', 'Ungefär hur stor andel av total försäljning stod Produkt Y för?', 'Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.', jsonb_build_array('15 %', '25 %', '35 %', '40 %'), 1, 'Produkt Y svarade för 25 av totalt 100 (motsvarande enheter), det vill säga 25 procent av den totala försäljningen. 15 procent är för lågt och 35/40 procent överskattar Y:s andel, vilka snarare stämmer med andra produkters värden i diagrammet.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-5', 'dtk', 'Vilken produkt hade störst försäljning?', 'Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.', jsonb_build_array('X', 'Y', 'Z', 'Y och Z lika'), 0, 'X hade störst försäljning med värdet 40, vilket är högre än både Y (25) och Z (35). Y och Z ligger båda under X och är dessutom inte lika stora som varandra, så det sista alternativet stämmer inte heller.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-6', 'dtk', 'Med hur många miljoner skiljer sig X och Z?', 'Försäljning per produkt (miljoner kr): X = 40, Y = 25, Z = 35. Totalt = 100.', jsonb_build_array('5', '10', '15', '25'), 0, 'X ligger på 40 miljoner och Z på 35 miljoner, en skillnad på 5 miljoner. 10 och 15 miljoner är för stora skillnader utifrån dessa värden, och 25 miljoner motsvarar snarare skillnaden mellan X och en annan produkt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-7', 'dtk', 'Vilken avdelning hade lägst sjukfrånvaro i mars?', 'Sjukfrånvaro per avdelning (procent av arbetad tid)
Avd. A: feb 6,2 · mars 5,4 · april 5,8
Avd. B: feb 4,9 · mars 5,1 · april 4,7
Avd. C: feb 7,3 · mars 6,8 · april 7,0
Avd. D: feb 5,6 · mars 4,9 · april 5,3', jsonb_build_array('A', 'B', 'C', 'D'), 3, 'I mars hade D lägst sjukfrånvaro med 4,9 procent, vilket är lägre än B:s 5,1, A:s 5,4 och C:s 6,8. B (5,1) är näst lägst men ändå högre än D, och C sticker tvärtom ut som avdelningen med högst frånvaro.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('dtk-8', 'dtk', 'Hur stor andel av företagets totala kostnader utgjorde material 2023?', 'Kostnader 2023 (miljoner kr): Personal 12 · Material 8 · Lokaler 4 · Övrigt 6. Totalt = 30.', jsonb_build_array('8 %', 'ungefär 27 %', 'ungefär 40 %', 'ungefär 73 %'), 1, 'Materialkostnaden var 8 av totalt 30 (motsvarande enheter), vilket ger 8/30 ≈ 0,27, det vill säga ungefär 27 procent. 8 procent förväxlar delvärdet med andelen, medan 40 och 73 procent bygger på fel jämförelsetal och blir alldeles för höga.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-1', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Studien fick kritik för små urval; ____ visade uppföljningen samma mönster i en större population.', jsonb_build_array('därför', 'emellertid', 'exempelvis', 'nämligen'), 1, 'Emellertid signalerar kontrast, vilket krävs eftersom meningen vänder från kritiken till att resultatet ändå bekräftades. Därför uttrycker orsak och verkan, inte motsägelse, och ger fel logik. Exempelvis inleder ett exempel, vilket inte passar när ett förhållande ska nyanseras. Nämligen förklarar eller preciserar något föregående utan att ge den kontrast som krävs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-2', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Författaren undviker förenklingar och resonerar ____, med tydliga premisser och slutsatser.', jsonb_build_array('slarvigt', 'impulsivt', 'koherent', 'vardagligt'), 2, 'Koherent betyder sammanhängande och logiskt uppbyggt, vilket krävs i formell sakprosa. Slarvigt beskriver bristande noggrannhet och ger fel innebörd. Impulsivt handlar om spontant handlande, inte om textens struktur. Vardagligt är fel register eftersom sammanhanget är formellt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-3', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Priset på råvaran steg kraftigt. ____ tvingades flera företag se över sina marginaler.', jsonb_build_array('Följaktligen', 'Trots det', 'Däremot', 'Ändå'), 0, 'Följaktligen uttrycker att det som följer är en logisk konsekvens av det föregående, orsak till verkan. Trots det inför en motsägelse och bryter den logiska kedjan. Däremot ställer två led i kontrast mot varandra i stället för i följd. Ändå markerar samma slags motsägelse och passar inte när ett resonemang mynnar ut i en slutsats.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-4', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Rapporten är ____ kort: den sammanfattar tre års forskning på tio sidor utan att tappa precisionsnivån.', jsonb_build_array('onödigt', 'vagt', 'mundligt', 'koncist'), 3, 'Koncist betyder kortfattat och precist, den positiva egenskap meningen beskriver. Onödigt är en värdering som inte beskriver språklig stil. Vagt är nästan motsatsen, eftersom det innebär otydlighet snarare än precision. Mundligt (muntligt) beskriver talspråklig framställning, inte kortfattad precision.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-5', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Vissa kritiker såg reformen som för snabb, ____ andra menade att den kom för sent.', jsonb_build_array('respektive', 'medan', 'således', 'dessutom'), 1, 'Medan ställer två synsätt mot varandra inom samma mening, vilket krävs när innehållet kontrasteras. Respektive parar ihop flera led var för sig utan att skapa motsättning. Således drar en slutsats och signalerar inte samtidig kontrast. Dessutom lägger bara till information utan att skapa någon motsättning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-6', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Hypotesen är intressant, ____ underlaget är ännu för tunt för långtgående slutsatser.', jsonb_build_array('och', 'så', 'men', 'ty'), 2, 'Men signalerar en reservation eller motsägelse mot det som just sagts. Och binder samman likställda led utan reservation. Så anger följd, inte motsättning. Ty anger orsak till det föregående och passar inte när en invändning ska göras.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-7', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Beslutet fattades ____ efter flera utredningar, inte i hast.', jsonb_build_array('överlagt', 'impulsivt', 'slumpmässigt', 'hemligt'), 0, 'Överlagt betyder genomtänkt, efter noggrant övervägande, motsatsen till det oplanerade. Impulsivt beskriver just ett handlande utan eftertanke och är därmed motsatsordet till det sökta. Slumpmässigt antyder att ingen plan alls låg bakom, vilket också strider mot betydelsen. Hemligt handlar om sekretess, inte om graden av eftertanke.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-8', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Tekniken är lovande. ____ kvarstår frågor om kostnader och rättvis tillgång.', jsonb_build_array('Således', 'Exempelvis', 'Nämligen', 'Likväl'), 3, 'Likväl betyder trots det och passar när en kontrast ska följa på en positiv inledning. Således drar en logisk slutsats i stället för att införa en motsägelse. Exempelvis inleder ett exempel, vilket inte ger den kontrast som krävs. Nämligen förklarar eller motiverar något föregående utan att vända innebörden.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-9', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Hon argumenterade ____: varje påstående backades upp med belägg.', jsonb_build_array('dogmatiskt', 'sakligt', 'svävande', 'ironiskt'), 1, 'Sakligt beskriver ett resonemang som bygger på belägg och konkreta fakta, vilket passar ett underbyggt resonemang. Dogmatiskt antyder ett resonemang som utgår från fasta åsikter snarare än belägg. Svävande betyder vagt och obestämt, alltså motsatsen till ett tydligt underbyggt resonemang. Ironiskt beskriver en attityd av underförstådd motsats, inte ett sätt att argumentera sakligt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-10', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Förslaget vann gehör ____ bland dem som tidigare varit skeptiska.', jsonb_build_array('oaktat', 'följaktligen', 'i synnerhet', 'däremot'), 2, 'I synnerhet förstärker att något gäller särskilt eller framför allt en viss grupp. Oaktat betyder trots och inför en motsägelse som inte hör hemma här. Följaktligen drar en slutsats i stället för att peka ut en särskild grupp. Däremot ställer två led i kontrast och passar inte när en grupp ska lyftas fram som särskilt berörd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-11', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ rådande osäkerhet gick bolaget vidare med investeringen.', jsonb_build_array('Oaktat', 'Tack vare', 'På grund av', 'Till följd av'), 0, 'Oaktat betyder trots och är ett formellt uttryck som passar när något gäller trots en omständighet. Tack vare anger en positiv orsak, inte en motsägelse. På grund av anger orsak-verkan rakt av, vilket ger fel logik om meningen kräver en motsägelse. Till följd av uttrycker samma slags orsakssamband och passar därför inte heller.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-12', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Texten rör sig mellan empiri och teori, ____ utan att blanda ihop nivåerna.', jsonb_build_array('alltså', 'ty', 'så', 'dock'), 3, 'Dock tillför en nyanserad reservation, en mildare motsägelse mot det som sagts. Alltså signalerar en slutsats, inte en invändning. Ty anger orsak till det föregående, en annan logisk relation. Så anger följd och ger inte den reservation som krävs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-13', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Resultaten pekar i samma riktning; ____ kan man tala om ett robust fynd.', jsonb_build_array('ändå', 'således', 'däremot', 'trots det'), 1, 'Således drar en logisk slutsats av det som just konstaterats. Ändå inför en motsägelse och passar inte när en konsekvens ska uttryckas. Däremot ställer två led i kontrast mot varandra, vilket inte stämmer med ett orsak–verkan-samband. Trots det har samma motsägande funktion och är därför också fel här.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-14', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Kritikerna angrep metoden, ____ inte själva frågeställningen.', jsonb_build_array('respektive', 'såväl', 'men', 'både'), 2, 'Men kontrasterar det som angrips i resonemanget mot det som ändå lämnas orört. Respektive parar ihop flera led var för sig utan att skapa motsättning. Såväl inleder en uppräkning som förutsätter ett efterföljande som och ger ingen kontrast. Både förenar två led på samma sätt i stället för att ställa dem mot varandra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-15', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Författaren skriver i ett ____ register som passar vetenskaplig essäistik.', jsonb_build_array('formellt', 'talspråkligt', 'barnsligt', 'slangbetonat'), 0, 'Formellt register hör hemma i sakprosa och essäistik av det slag som beskrivs. Talspråkligt är motsatt register och passar inte i en formell text. Barnsligt beskriver en omogen framställning, inte den vårdade stil som avses. Slangbetonat innebär informellt och vardagsnära språk, vilket krockar med sammanhangets formella ton.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-16', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Ju mer data som tillkom, ____ tydligare blev mönstret.', jsonb_build_array('så', 'och', 'men', 'desto'), 3, 'Desto ingår i den fasta korrelationen ju … desto, som krävs för att uttrycka en proportionell relation. Så bildar andra konstruktioner men inte den aktuella korrelationen. Och binder samman led utan att uttrycka en gradvis samvariation. Men inför en motsägelse i stället för det stegrande samband som krävs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-17', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Han var ____ till förslaget: varken entusiastisk eller avvisande.', jsonb_build_array('entydig', 'ambivalent', 'aggressiv', 'indifferent på ett skämtsamt sätt'), 1, 'Ambivalent betyder kluven, det vill säga att ha motstridiga känslor eller uppfattningar samtidigt. Entydig betyder tvärtom tydlig och utan tvetydighet, motsatsen till det sökta. Aggressiv beskriver fientlighet, inte inre kluvenhet. Indifferent på ett skämtsamt sätt beskriver likgiltighet snarare än att vara splittrad mellan två ståndpunkter.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-18', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Analysen är skarp, ____ den ibland blir väl kategorisk.', jsonb_build_array('därför att', 'så att', 'även om', 'utan att'), 2, 'Även om inför en medgivande bisats, det vill säga något gäller trots en omständighet. Därför att anger orsak, en annan logisk relation än medgivande. Så att uttrycker följd eller syfte, inte en invändning. Utan att anger frånvaro av en handling och ger inte den medgivande innebörden som krävs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-19', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Projektet stoppades ____ bristande finansiering.', jsonb_build_array('på grund av', 'trots', 'oaktat', 'i stället för'), 0, 'På grund av anger orsak, den logiska relation meningen kräver. Trots inför en motsägelse och vänder sambandet fel väg. Oaktat betyder likaså trots och ger samma felaktiga motsatsbetydelse. I stället för anger ett utbyte mellan alternativ, inte en orsak.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-20', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Skillnaden mellan grupperna är liten, ____ statistiskt signifikant.', jsonb_build_array('alltså', 'nämligen', 'respektive', 'dock'), 3, 'Dock uttrycker en kontrast: skillnaden är liten men ändå betydelsefull. Alltså drar en slutsats i stället för att införa en invändning. Nämligen förklarar eller preciserar något föregående utan att vända innebörden. Respektive parar ihop led var för sig och ger ingen kontrastiv nyans.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-21', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', '____ mer tid som lades på granskningen, ____ färre fel återstod i manuskriptet.', jsonb_build_array('Ju / desto', 'Så / att', 'Varken / eller', 'Dels / dels'), 0, 'Ju … desto är det fasta korrelatet för att uttrycka att en förändring i den ena storheten motsvaras av en förändring i den andra. Så … att uttrycker i stället följd, en helt annan konstruktion. Varken … eller negerar två led, vilket inte är vad en proportionell relation kräver. Dels … dels räknar upp parallella omständigheter utan att uttrycka gradvis samvariation.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-22', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Kommittén var ____ beredd att kompromissa ____ villig att överge kärnfrågan.', jsonb_build_array('både / och', 'varken / eller', 'dels / dels', 'såväl / som'), 1, 'Varken … eller negerar båda leden samtidigt, vilket krävs när ingetdera alternativ gäller. Både … och skulle i stället bekräfta att båda leden gäller, det motsatta av vad som avses. Dels … dels räknar upp två sanna omständigheter utan negation. Såväl … som bekräftar likaså båda leden och ger fel innebörd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-23', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Utredningen var ____ försenad ____ underfinansierad, vilket förklarar det tunna underlaget.', jsonb_build_array('varken / eller', 'antingen / eller', 'dels / dels', 'inte / utan'), 2, 'Dels … dels räknar upp två parallella omständigheter som båda gäller samtidigt. Varken … eller negerar båda leden, vilket inte stämmer när båda faktiskt gäller. Antingen … eller uttrycker ett ömsesidigt uteslutande val mellan leden, inte en uppräkning. Inte … utan ersätter ett förkastat led med ett annat, vilket inte passar en ren uppräkning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-24', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Metoden är ____ tidskrävande ____ robust nog för att användas i uppföljande studier.', jsonb_build_array('varken / eller', 'antingen / eller', 'dels / dels', 'både / och'), 3, 'Både … och förenar två positiva egenskaper som gäller samtidigt. Varken … eller negerar i stället båda leden. Antingen … eller ställer leden som ömsesidigt uteslutande alternativ. Dels … dels fungerar som uppräkning men saknar den sammanbindande, förstärkande innebörd som både … och ger här.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-25', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Förslaget vann gehör ____ bland forskarna ____ bland praktikerna i fältet.', jsonb_build_array('såväl / som', 'varken / eller', 'antingen / eller', 'ju / desto'), 0, 'Såväl … som markerar att båda de nämnda grupperna avses, en bekräftande uppräkning. Varken … eller skulle i stället utesluta båda grupperna. Antingen … eller ställer grupperna som ett val mellan dem, inte som båda samtidigt. Ju … desto uttrycker en proportionell relation, inte en uppräkning av grupper.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-26', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Reformen var ____ en ekonomisk fråga ____ en fråga om tillit till institutionerna.', jsonb_build_array('varken / eller', 'inte bara / utan också', 'dels / dels', 'antingen / eller'), 1, 'Inte bara … utan också utvidgar påståendet genom att lägga till ytterligare ett led utöver det första. Varken … eller negerar båda leden, motsatsen till en utvidgning. Dels … dels räknar upp led parallellt utan den förstärkande, stegrande effekten. Antingen … eller ställer leden som ett ömsesidigt uteslutande val.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-27', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Kommunen måste ____ höja avgiften ____ skära i verksamheten; en tredje väg finns inte i budgeten.', jsonb_build_array('både / och', 'varken / eller', 'antingen / eller', 'såväl / som'), 2, 'Antingen … eller uttrycker ett tvingande val mellan två alternativ där bara det ena kan gälla. Både … och skulle i stället bekräfta att båda alternativen gäller samtidigt. Varken … eller negerar båda alternativen. Såväl … som bekräftar likaså båda leden, vilket krockar med tanken på ett val mellan dem.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-28', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Urvalet var ____ litet ____ resultaten måste tolkas med stor försiktighet.', jsonb_build_array('ju / desto', 'varken / eller', 'dels / dels', 'så / att'), 3, 'Så … att anger följd: storleken eller egenskapen gör att en viss konsekvens uppstår, här att försiktighet krävs. Ju … desto uttrycker i stället en proportionell samvariation, inte en följd. Varken … eller negerar båda leden och saknar följdbetydelse. Dels … dels räknar bara upp parallella omständigheter utan att ange konsekvens.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-29', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Rapporten ger ____ en entydig rekommendation ____ en klar tidsplan för genomförandet.', jsonb_build_array('varken / eller', 'både / och', 'såväl / som', 'dels / dels'), 0, 'Varken … eller krävs för att negera båda leden samtidigt. Både … och skulle bekräfta att båda leden gäller, det motsatta. Såväl … som bekräftar likaså båda leden. Dels … dels räknar upp sanna omständigheter utan negation.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-30', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', '____ tätare mätningarna gjordes, ____ tydligare framträdde säsongsvariationen.', jsonb_build_array('Så / att', 'Ju / desto', 'Om / så', 'Dels / dels'), 1, 'Ju … desto är det korrekta korrelatet när två luckor tillsammans ska uttrycka en proportionell relation. Så … att uttrycker följd, inte samvariation. Om … så inför ett villkor, en annan logisk konstruktion. Dels … dels räknar upp parallella led utan att koppla dem proportionellt till varandra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-31', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Beslutet fattades ____ den nya förordningen och kan därför inte överklagas på den grunden.', jsonb_build_array('i strid med', 'oaktat', 'i enlighet med', 'till skillnad från'), 2, 'I enlighet med betyder enligt eller i överensstämmelse med, vilket passar när något stämmer med en regel eller ett beslut. I strid med är motsatsen och skulle ange att något bryter mot det som avses. Oaktat betyder trots och inför en motsägelse som inte hör hemma här. Till skillnad från markerar en kontrast mellan två företeelser, inte en överensstämmelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-32', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Studien säger lite om kausalitet; den är mer informativ ____ sambandens styrka än deras riktning.', jsonb_build_array('trots', 'genom', 'inför', 'med avseende på'), 3, 'Med avseende på betyder beträffande eller när det gäller, vilket passar för att peka ut vilken aspekt som avses. Trots inför en motsägelse som inte stämmer med att bara ange en aspekt. Genom anger medel eller metod, inte vilken aspekt som avses. Inför anger en tidsmässig eller rumslig relation, vilket inte matchar betydelsen beträffande.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-33', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Flera linjer ställdes in ____ den ihållande stormen.', jsonb_build_array('till följd av', 'i stället för', 'oaktat', 'till förmån för'), 0, 'Till följd av anger orsak, att något inträffar som en konsekvens av något annat. I stället för anger ett utbyte mellan alternativ, inte orsak. Oaktat betyder trots och vänder sambandet till en motsägelse. Till förmån för anger att något gynnas på bekostnad av något annat, en annan relation än ren orsak.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-34', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Kostnaden är låg ____ den samhällsnytta som investeringen förväntas ge.', jsonb_build_array('på grund av', 'i förhållande till', 'till följd av', 'i enlighet med'), 1, 'I förhållande till jämför två storheter mot varandra, här kostnad mot nytta. På grund av anger orsak, inte jämförelse. Till följd av anger likaså orsak-verkan, inte en jämförelse mellan två storheter. I enlighet med betyder överensstämmelse med något, inte en jämförelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-35', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Snabbare handläggning uppnåddes ____ rättssäkerheten, vilket kritiserades i remissvaren.', jsonb_build_array('till förmån för', 'i enlighet med', 'på bekostnad av', 'med undantag av'), 2, 'På bekostnad av betyder att något vinns genom att något annat förloras eller offras. Till förmån för anger att något gynnas, utan den förlust som den sökta frasen innebär. I enlighet med anger överensstämmelse, en helt annan relation. Med undantag av avgränsar något från en helhet, vilket inte uttrycker en vinst-förlust-relation.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-36', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ tidigare prognoser visade utfallet en tydlig nedgång redan under första kvartalet.', jsonb_build_array('I enlighet med', 'Till följd av', 'Med avseende på', 'I motsats till'), 3, 'I motsats till kontrasterar det aktuella resultatet mot de tidigare prognoserna. I enlighet med skulle i stället ange överensstämmelse, motsatsen till den kontrast som avses. Till följd av anger orsak-verkan, inte en motsättning mellan två uppgifter. Med avseende på pekar bara ut en aspekt utan att uttrycka någon kontrast.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-37', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Alla regioner, ____ tre glesbygdskommuner, nådde målet inom utsatt tid.', jsonb_build_array('med undantag av', 'till följd av', 'i stället för', 'på grund av'), 0, 'Med undantag av avgränsar tre kommuner från resten av en större grupp. Till följd av anger orsak, inte en avgränsning av vissa enheter. I stället för anger utbyte mellan alternativ, inte undantag från en grupp. På grund av anger likaså orsak, vilket inte matchar en avgränsande betydelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-38', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Planeringen måste ____ de boendes synpunkter, inte bara de tekniska kalkylerna.', jsonb_build_array('bortse från', 'ta hänsyn till', 'ge avkall på', 'ställa in'), 1, 'Ta hänsyn till är den fasta kollokationen som krävs i sammanhanget. Bortse från är motsatsen, att inte beakta något. Ge avkall på betyder att pruta på eller avstå från något, en annan innebörd. Ställa in betyder att avbryta eller justera något, vilket inte matchar betydelsen att beakta.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-39', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Utifrån de samstämmiga mätningarna kunde forskarna ____ att effekten var reell.', jsonb_build_array('ställa krav', 'ge uttryck', 'dra slutsatsen', 'fatta intresse'), 2, 'Dra slutsatsen (att) är den fasta kollokationen för att ange vad ett resonemang mynnar ut i. Ställa krav handlar om att kräva något, inte om att komma fram till en slutsats. Ge uttryck (för) kräver en annan preposition och en annan betydelse, att visa en känsla eller åsikt. Fatta intresse betyder att bli intresserad, vilket inte hör ihop med att dra en slutsats.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-40', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Författaren ____ sin oro för att debatten förenklas redan i förordet.', jsonb_build_array('ställer krav på', 'tar hänsyn till', 'drar slutsatsen av', 'ger uttryck för'), 3, 'Ge uttryck för är den fasta kollokationen för att visa eller förmedla en känsla eller uppfattning. Ställer krav på handlar om att kräva något, en annan innebörd. Tar hänsyn till betyder att beakta något, inte att förmedla en uppfattning. Drar slutsatsen av anger att komma fram till en slutsats genom något, inte att uttrycka en känsla.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-41', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Styrelsen ____ att skjuta upp investeringen till nästa budgetår.', jsonb_build_array('fattade beslutet', 'drog slutsatsen av', 'tog hänsyn', 'gav uttryck'), 0, 'Den etablerade kollokationen är "fatta beslut", vilket gör att verbfrasen passar grammatiskt och stilistiskt i meningen. "Drog slutsatsen av" hör ihop med en slutsats, inte ett beslut, och kräver en annan konstruktion. "Tog hänsyn" betyder att beakta något, inte att bestämma sig för något. "Gav uttryck" betyder att uttrycka en känsla eller åsikt, inte att fatta ett beslut.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-42', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Tillsynsmyndigheten ____ strängare redovisning av bieffekter.', jsonb_build_array('tog hänsyn', 'ställde krav på', 'fattade intresse för', 'gav avkall'), 1, 'Kollokationen "ställa krav på" är den naturliga verbfrasen när någon kräver något av någon annan. "Tog hänsyn" betyder att beakta något, vilket är en annan handling än att kräva. "Fattade intresse för" betyder att bli intresserad, vilket har en helt annan innebörd. "Gav avkall" betyder att offra eller minska på något, alltså motsatt riktning mot att ställa krav.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-43', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Osäkerheten i skattningarna är ____ beroende av urvalets storlek.', jsonb_build_array('i synnerhet', 'i stället', 'i hög grad', 'i enlighet'), 2, '"I hög grad" betyder i stor utsträckning och passar därför som gradmarkör i meningen. "I synnerhet" lyfter fram ett särskilt fall snarare än att ange grad. "I stället" anger ersättning, inte omfattning. "I enlighet" kräver kompletteringen "med" och betyder överensstämmelse, inte grad.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-44', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Kritiken riktades ____ mot den bristande transparensen i urvalet.', jsonb_build_array('respektive', 'följaktligen', 'oaktat', 'främst'), 3, '"Främst" preciserar att kritiken gällde särskilt transparensen, vilket är den betydelse sammanhanget kräver. "Respektive" används för att para ihop led i en uppräkning, inte för att peka ut en särskild aspekt. "Följaktligen" anger en logisk följd, inte en precisering. "Oaktat" betyder trots, vilket inte stämmer med att lyfta fram något specifikt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-45', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'I en vetenskaplig artikel ____ man normalt redovisa osäkerhet och avgränsningar.', jsonb_build_array('förväntas', 'köttar', 'snackar om att', 'kör med att'), 0, '"Förväntas" hör till ett formellt register som matchar textens övriga stilnivå. "Köttar" är ett talspråkligt slangord som inte hör hemma i en formell text. "Snackar om att" är talspråkligt och bryter mot registret. "Kör med att" är likaså vardagligt och passar inte i sammanhanget.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-46', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Metoden är väldokumenterad. ____ har den prövats i tre oberoende kohorter.', jsonb_build_array('Däremot', 'Dessutom', 'Trots det', 'Emellertid'), 1, '"Dessutom" lägger till ett stödjande skäl till det som redan sagts, vilket är den logik meningen bygger på. "Däremot" markerar en kontrast, inte ett tillägg. "Trots det" signalerar en motsägelse som inte finns i sammanhanget. "Emellertid" markerar en invändning snarare än ett ytterligare skäl.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-47', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Exporten ökade något. ____ sjönk hemmamarknaden mer än väntat.', jsonb_build_array('Således', 'Följaktligen', 'Däremot', 'Nämligen'), 2, '"Däremot" ställer två utvecklingar mot varandra, vilket är precis vad meningen gör. "Således" anger en slutsats, inte en motsättning. "Följaktligen" markerar orsak och verkan, vilket inte stämmer med kontrasten i texten. "Nämligen" förklarar eller specificerar något, det ställer inte två saker mot varandra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-48', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Tre faktorer tycks samverka, ____ finansiering, tidsram och lokal förankring.', jsonb_build_array('emellertid', 'oaktat', 'däremot', 'nämligen'), 3, '"Nämligen" specificerar vilka faktorer som avses, vilket är den förklarande funktion meningen kräver. "Emellertid" markerar en kontrast, inte en precisering. "Oaktat" betyder trots, vilket är en helt annan betydelse. "Däremot" ställer istället två led mot varandra och passar inte som förklaring.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-49', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Påståendet bör prövas empiriskt, ____ det strider mot tidigare rön.', jsonb_build_array('ty', 'således', 'exempelvis', 'respektive'), 0, '"Ty" är en formell konjunktion som betyder eftersom och anger skäl, vilket stämmer med meningens logik. "Således" anger en följd eller slutsats, inte ett skäl. "Exempelvis" ger ett exempel snarare än en orsak. "Respektive" används vid uppräkningar och fungerar inte som orsakskonjunktion.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-50', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Förslaget gick igenom, ____ flera ledamöter reserverade sig mot beräkningsgrunden.', jsonb_build_array('därför att', 'fastän', 'så att', 'för att'), 1, '"Fastän" inför ett medgivande som ändå inte upphäver huvudsatsen, vilket är den logiska relationen i meningen. "Därför att" anger en orsak, inte ett medgivande. "Så att" anger en följd eller ett syfte, vilket inte matchar sammanhanget. "För att" anger ett syfte, vilket inte fyller samma funktion som ett medgivande.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-51', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Avtalet förlängs automatiskt, ____ någon av parterna säger upp det i tid.', jsonb_build_array('eftersom', 'därför att', 'såvida inte', 'så att'), 2, '"Såvida inte" betyder om inte och inför en villkorlig undantagsbisats, vilket är den relation meningen beskriver. "Eftersom" anger en orsak, inte ett villkor. "Därför att" anger likaledes orsak snarare än ett undantag. "Så att" anger en följd, vilket inte stämmer med ett villkorligt undantag.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-52', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Modellen kan generaliseras, ____ samma mätfel inte återkommer i nya stickprov.', jsonb_build_array('trots att', 'oaktat att', 'även om', 'förutsatt att'), 3, '"Förutsatt att" sätter ett tydligt villkor för att generaliseringen ska gälla, vilket matchar meningens logik. "Trots att" inför ett medgivande utan att ange något villkor. "Oaktat att" har samma medgivande betydelse och passar därför inte. "Även om" är också ett medgivande snarare än ett villkor för giltighet.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-53', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Huvudresultatet står sig. ____ kan nämnas att svarsfrekvensen var ovanligt hög.', jsonb_build_array('För övrigt', 'Följaktligen', 'Däremot', 'Emellertid'), 0, '"För övrigt" tillför en sidoupplysning, vilket är den funktion uttrycket har i meningen. "Följaktligen" anger en slutsats, inte en sidoupplysning. "Däremot" markerar en kontrast som inte finns i sammanhanget. "Emellertid" signalerar en invändning snarare än ett tillägg vid sidan om.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-54', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Kostnaderna skenade; ____ saknades en realistisk riskbuffert från början.', jsonb_build_array('i synnerhet', 'med andra ord', 'oaktat', 'respektive'), 1, '"Med andra ord" omformulerar samma poäng med andra ord, vilket är precis den funktionen som krävs här. "I synnerhet" lyfter fram ett specifikt exempel, inte en omformulering. "Oaktat" betyder trots, en helt annan betydelse. "Respektive" används vid uppräkningar och fyller inte samma funktion som en omformulering.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-55', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Problemet är ____ bristen på data ____ bristen på en gemensam definition.', jsonb_build_array('både / och', 'såväl / som', 'inte / utan', 'varken / eller'), 2, '"Inte … utan" korrigerar ett påstående till ett annat och markerar att det är det senare ledet som är det egentliga problemet. "Både … och" anger addition av två saker som båda gäller, inte en korrigering. "Såväl … som" fyller samma additiva funktion och passar inte för att ersätta ett påstående med ett annat. "Varken … eller" nekar båda alternativen samtidigt, vilket inte stämmer med att ett av dem faktiskt gäller.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-56', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', '____ mer komplext regelverket blev, ____ färre små aktörer klarade efterlevnaden.', jsonb_build_array('Så / att', 'Varken / eller', 'Dels / dels', 'Ju / desto'), 3, '"Ju … desto" uttrycker en omvänd proportionalitet: ju mer komplexitet, desto färre som klarar kraven, vilket stämmer med meningens innehåll. "Så … att" anger en följdkonstruktion, inte en proportionalitet mellan två storheter. "Varken … eller" nekar båda leden och passar inte här. "Dels … dels" räknar bara upp led utan att uttrycka något samband mellan grader.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-57', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Strategin vilar ____ på styrmedel ____ på frivilliga överenskommelser med branschen.', jsonb_build_array('dels / dels', 'varken / eller', 'antingen / eller', 'ju / desto'), 0, '"Dels … dels" räknar upp två kompletterande delar som tillsammans utgör helheten, vilket matchar meningens uppbyggnad. "Varken … eller" nekar båda leden, vilket är motsatt logik. "Antingen … eller" anger två ömsesidigt uteslutande alternativ, inte två samtidigt gällande delar. "Ju … desto" uttrycker proportionalitet och passar inte för en enkel uppräkning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-58', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Utvärderingen belyser ____ genomförandet ____ de långsiktiga effekterna.', jsonb_build_array('varken / eller', 'både / och', 'antingen / eller', 'så / att'), 1, '"Både … och" täcker två aspekter samtidigt, vilket är den logik meningen bygger på. "Varken … eller" utesluter båda aspekterna, alltså motsatt betydelse. "Antingen … eller" anger att bara en av aspekterna gäller, inte båda. "Så … att" anger en följdkonstruktion och fyller inte samma funktion som en dubbel bekräftelse.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-59', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Gruppen ____ att vänta med publicering efter att ha vägt osäkerheterna.', jsonb_build_array('ställde krav', 'tog hänsyn', 'kom fram till', 'gav uttryck'), 2, '"Kom fram till" är kollokationen för att nå en slutsats, vilket är innebörden meningen kräver. "Ställde krav" har en helt annan betydelse som rör fordringar, inte slutsatser. "Tog hänsyn" betyder att beakta något, inte att nå ett resultat. "Gav uttryck" betyder att uttrycka en känsla eller åsikt, inte att komma fram till en slutsats.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-60', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Forskarna ____ en reviderad hypotes redan i nästa artikel.', jsonb_build_array('ställde in', 'tog avstånd', 'fäste avseende', 'lade fram'), 3, '"Lade fram" är den etablerade kollokationen för att presentera en hypotes eller ett förslag, vilket stämmer med sammanhanget. "Ställde in" betyder att avboka något, en helt annan betydelse. "Tog avstånd" betyder att markera oenighet med något, inte att presentera det. "Fäste avseende" är en ovanlig och felaktig kollokation som inte hör ihop med att lägga fram en hypotes.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-61', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Samma mönster syntes i storstäderna; ____ rapporterades det från flera regioncentra.', jsonb_build_array('likaledes', 'däremot', 'emellertid', 'oaktat'), 0, '"Likaledes" betyder på samma sätt och markerar ett tillägg snarare än en motsättning, vilket passar meningens logik. "Däremot" markerar istället en kontrast. "Emellertid" signalerar en invändning eller motsättning. "Oaktat" betyder trots, vilket inte fyller samma additiva funktion.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-62', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Underlaget är ofullständigt; ____ talar de samstämmiga indikationerna för att trenden är reell.', jsonb_build_array('följaktligen', 'icke desto mindre', 'nämligen', 'exempelvis'), 1, '"Icke desto mindre" betyder likväl och markerar att något gäller trots det föregående, vilket matchar meningens logik. "Följaktligen" anger en slutsats som följer av det tidigare, inte en motsättning. "Nämligen" förklarar eller specificerar, det markerar inte en motsättning. "Exempelvis" exemplifierar snarare än att uttrycka trots.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-63', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Mätfelen var systematiska. ____ måste tidigare skattningar räknas om.', jsonb_build_array('Trots det', 'Däremot', 'Följaktligen', 'Oaktat detta'), 2, '"Följaktligen" fångar orsak-och-verkan-relationen mellan de systematiska felen och den nödvändiga omräkningen. "Trots det" signalerar en motsättning som inte stämmer med den logiska följden. "Däremot" ställer istället två led mot varandra. "Oaktat detta" betyder trots detta, vilket är ett medgivande snarare än en följd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-64', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Kunskapen spreds ____ seminarier och öppna arbetsmaterial snarare än via pressmeddelanden.', jsonb_build_array('oaktat', 'trots', 'inför', 'genom'), 3, '"Genom" anger det medel eller den kanal som avses i meningen, vilket är den betydelse sammanhanget kräver. "Oaktat" betyder trots, en helt annan betydelse. "Trots" anger en motsättning som inte stämmer med att ange ett medel. "Inför" används om något som nalkas i tiden, inte om ett medel.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-65', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ förhandlingarna skärptes tonen, men parterna lämnade inte bordet.', jsonb_build_array('Under', 'Oaktat', 'Till följd', 'I enlighet'), 0, '"Under" anger en tidsrymd, det vill säga medan förhandlingarna pågick, vilket är den betydelse meningen behöver. "Oaktat" betyder trots, vilket är en annan relation. "Till följd" anger en orsak och kräver dessutom kompletteringen "av", vilket inte passar tidsangivelsen. "I enlighet" anger överensstämmelse, inte tidsrymd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-66', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'I sakprosa ____ man gärna osäkerhet i stället för att överdriva säkerheten i fynden.', jsonb_build_array('kör över', 'redovisar', 'slänger ur sig', 'tjatar om'), 1, '"Redovisar" är ett formellt verb som passar för att presentera osäkerhet i en saklig text. "Kör över" betyder att ignorera eller övertrumfa något, både fel betydelse och fel register. "Slänger ur sig" är talspråkligt och signalerar ett ogenomtänkt uttalande, vilket inte matchar formell redovisning. "Tjatar om" är också talspråkligt och har en negativ klang som inte passar sammanhanget.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-67', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Den ena skolan betonar struktur, ____ den andra lägger vikten vid aktörers handlingsutrymme.', jsonb_build_array('respektive', 'således', 'medan', 'dessutom'), 2, '"Medan" kontrasterar de två skolorna mot varandra, vilket är den relation meningen beskriver. "Respektive" används vid uppräkningar för att para ihop led, inte som kontrasterande konjunktion. "Således" anger en slutsats, inte en kontrast. "Dessutom" anger ett tillägg, vilket inte stämmer med att ställa två skolor mot varandra.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-68', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Premisserna är desamma i båda modellerna; skillnaden ligger ____ i hur osäkerhet hanteras.', jsonb_build_array('oaktat', 'emellertid', 'nämligen', 'alltså'), 3, '"Alltså" preciserar var skillnaden ligger som en slutsats av det tidigare sagda, vilket matchar meningens logik. "Oaktat" betyder trots, en helt annan betydelse. "Emellertid" anger en kontrast snarare än en slutsats. "Nämligen" specificerar en orsak men drar inte samma slutsats som "alltså" gör här.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-69', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Definitionen var ____ vag ____ jämförbarhet mellan studierna blev i praktiken omöjlig.', jsonb_build_array('så / att', 'ju / desto', 'varken / eller', 'dels / dels'), 0, '"Så … att" anger följden av vagheten som beskrivs, vilket är den relation meningen bygger på. "Ju … desto" uttrycker proportionalitet mellan två storheter, inte en enkel följdrelation. "Varken … eller" nekar båda leden och passar inte som följdkonstruktion. "Dels … dels" räknar bara upp led utan att ange en följd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-70', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', '____ samma urvalskriterier används, ____ kan tidsserierna läggas samman.', jsonb_build_array('Så / att', 'Om / så', 'Ju / desto', 'Varken / eller'), 1, '"Om … så" bygger upp villkoret att om kriterierna är desamma, så kan serierna slås ihop, vilket är precis den logik meningen uttrycker. "Så … att" anger en följd utan att formulera något villkor. "Ju … desto" uttrycker proportionalitet, inte ett enkelt villkor. "Varken … eller" nekar båda leden och saknar villkorets struktur helt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-71', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ de nya rönen ter sig den tidigare rekommendationen alltför kategorisk.', jsonb_build_array('Oaktat', 'Till följd av', 'I ljuset av', 'På bekostnad av'), 2, '"I ljuset av" betyder med de nya rönen som bakgrund, vilket är den innebörd meningen kräver. "Oaktat" betyder trots, en helt annan relation. "Till följd av" anger ett mer direkt kausalt samband än det stödjande sammanhang som avses. "På bekostnad av" betyder att något offras för något annat, vilket inte stämmer med att ge en bakgrund.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-72', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ den senaste lågkonjunkturen framstår sparandet som mer begripligt.', jsonb_build_array('I stället för', 'Till förmån för', 'Med undantag av', 'Mot bakgrund av'), 3, '"Mot bakgrund av" ger den kontext som gör beteendet begripligt, vilket är den funktion uttrycket fyller. "I stället för" anger en ersättning, inte en förklarande bakgrund. "Till förmån för" anger att något gynnas, en annan relation. "Med undantag av" anger en uteslutning, vilket inte stämmer med att ge sammanhang.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-73', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Modellen predicerade en uppgång. ____ sjönk indikatorerna tre månader i följd.', jsonb_build_array('Emellertid', 'Således', 'Följaktligen', 'Nämligen'), 0, '"Emellertid" kontrasterar prediktionen mot det faktiska utfallet, vilket är den relation meningen beskriver. "Således" anger en slutsats, inte en motsättning mellan förväntning och resultat. "Följaktligen" anger orsak och verkan snarare än en kontrast. "Nämligen" specificerar något men uttrycker ingen motsättning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-74', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ den politiska osäkerheten tecknades det långsiktiga avtalet.', jsonb_build_array('Tack vare', 'Oaktat', 'På grund av', 'Till följd av'), 1, '"Oaktat" markerar att avtalet tecknades trots osäkerheten, vilket är den motsättning meningen beskriver. "Tack vare" anger en positiv bidragande orsak, men osäkerhet är inget som underlättar ett avtal. "På grund av" anger orsak, medan avtalet i själva verket tecknades trots osäkerheten, inte på grund av den. "Till följd av" anger samma felaktiga kausala riktning som "på grund av".');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-75', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Texten är ____ polemisk ____ slarvig; den är saklig men onödigt lång.', jsonb_build_array('både / och', 'dels / dels', 'varken / eller', 'antingen / eller'), 2, '"Varken … eller" avvisar båda de negativa etiketterna samtidigt, det vill säga att texten är varken polemisk eller slarvig. "Både … och" skulle betyda att båda etiketterna gäller, motsatt den avsedda betydelsen. "Dels … dels" räknar bara upp led utan den nekande innebörden. "Antingen … eller" anger att ett av alternativen gäller, inte att båda avvisas.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-76', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Åtgärden berör ____ hushållen ____ de mindre företagen i innerstaden.', jsonb_build_array('varken / eller', 'antingen / eller', 'ju / desto', 'såväl / som'), 3, '"Såväl … som" inkluderar båda grupperna samtidigt, vilket är den betydelse meningen kräver. "Varken … eller" utesluter båda grupperna, motsatt betydelse. "Antingen … eller" anger att bara en av grupperna gäller. "Ju … desto" uttrycker proportionalitet och saknar den inkluderande funktionen helt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-77', 'mek', 'Välj det alternativ som bäst fyller i meningen.', '____ den stundande omorganisationen växte oron bland de tillsvidareanställda.', jsonb_build_array('Inför', 'Oaktat', 'Genom', 'Enligt'), 0, '"Inför" betyder med tanke på något som nalkas, vilket är den tidsmässiga innebörd meningen behöver. "Oaktat" betyder trots, en annan relation. "Genom" anger ett medel, inte något som ligger framför i tiden. "Enligt" anger en källa eller överensstämmelse, vilket inte stämmer med sammanhanget.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-78', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'I utredningens sammanfattning ____ man sig från att spekulera om enskilda aktörers motiv.', jsonb_build_array('backar', 'avhåller', 'köttar', 'svävar'), 1, '"Avhåller" hör till uttrycket "avhålla sig från" och passar det formella registret i meningen. "Backar" är vardagligt och beskriver en annan, mer konkret handling. "Köttar" är talspråklig slang som inte hör hemma i en formell text. "Svävar" betyder att vara osäker eller obestämd, vilket inte matchar betydelsen att avstå från något.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-79', 'mek', 'Välj det alternativ som bäst fyller i meningen.', 'Premisserna preciserades. ____ blev det möjligt att jämföra de två modellerna på lika villkor.', jsonb_build_array('Trots det', 'Däremot', 'Därmed', 'Oaktat detta'), 2, '"Därmed" betyder därigenom och markerar en följd av den precisering som just gjorts, vilket är den relation meningen uttrycker. "Trots det" signalerar en motsättning som inte stämmer med att något följer logiskt. "Däremot" ställer istället två led mot varandra. "Oaktat detta" betyder trots detta, vilket också är ett medgivande snarare än en följd.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('mek-80', 'mek', 'Välj det alternativ som bäst fyller i luckorna.', 'Förändringen var ____ teknisk ____ institutionell: nya rutiner krävde ny ansvarsfördelning.', jsonb_build_array('varken / eller', 'antingen / eller', 'dels / dels', 'inte bara / utan även'), 3, '"Inte bara … utan även" utvidgar påståendet till att gälla mer än bara det tekniska, vilket är den betydelse meningen kräver. "Varken … eller" nekar båda leden, motsatt den utvidgande betydelsen. "Antingen … eller" anger ett ömsesidigt uteslutande val, inte en utvidgning. "Dels … dels" räknar bara upp led utan den gradvisa utvidgning som "inte bara … utan även" uttrycker.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-1', 'xyz', 'Ett rektangulärt rum är 6 m långt och 4 m brett. Hur stor är arean?', null, jsonb_build_array('20 m²', '24 m²', '28 m²', '36 m²'), 1, 'Arean av en rektangel fås genom längd gånger bredd: 6 × 4 = 24 m². 20 m² och 28 m² kommer från felräkningar av multiplikationen, och 36 m² är istället kvadraten på 6, inte rektangelns area.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-2', 'xyz', 'Priset sänks med 20 % från 250 kr. Vad kostar varan sedan?', null, jsonb_build_array('180 kr', '200 kr', '210 kr', '230 kr'), 1, '20 procent av 250 kr är 50 kr, och 250 − 50 = 200 kr efter sänkningen. 230 kr motsvarar en sänkning med bara 20 kr, 210 kr är för litet avdrag, och 180 kr är ett för stort avdrag för en 20-procentig sänkning.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-3', 'xyz', 'En cyklist kör 45 km på 1,5 timme. Vilken medelhastighet?', null, jsonb_build_array('25 km/h', '30 km/h', '35 km/h', '40 km/h'), 1, 'Medelhastigheten fås genom sträcka delat med tid: 45 km / 1,5 h = 30 km/h. 25 km/h och 35 km/h ligger nära men stämmer inte med divisionen, och 40 km/h skulle kräva en kortare tid än 1,5 timme.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-4', 'xyz', 'Lös 3x − 7 = 14. Vad är x?', null, jsonb_build_array('5', '7', '9', '21'), 1, 'Ekvationen ger 3x = 14 + 7 = 21, vilket ger x = 21/3 = 7. x = 5 och x = 9 uppfyller inte ekvationen vid insättning, och 21 är värdet på 3x, inte på x.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-5', 'xyz', 'En triangel har bas 10 cm och höjd 6 cm. Area?', null, jsonb_build_array('16 cm²', '30 cm²', '60 cm²', '120 cm²'), 1, 'Triangelns area beräknas som (bas × höjd)/2 = (10 × 6)/2 = 30 cm². 60 cm² är produkten bas gånger höjd utan att delas med 2, 120 cm² är dubbelt så mycket, och 16 cm² stämmer inte med formeln alls.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-6', 'xyz', 'Ett lån på 8 000 kr ökar med 5 % ränta på ett år. Ny skuld?', null, jsonb_build_array('8 200 kr', '8 400 kr', '8 500 kr', '8 800 kr'), 1, 'Räntan blir 5 procent av 8 000 kr, det vill säga 400 kr, så den nya skulden är 8 000 + 400 = 8 400 kr. 8 200 kr och 8 500 kr bygger på felaktig procentberäkning, och 8 800 kr motsvarar snarare en räntesats på 10 procent.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-7', 'xyz', 'Medelvärdet av 4, 8 och 12 är 8. Vilket tal ska läggas till så att medelvärdet blir 10?', null, jsonb_build_array('10', '16', '18', '20'), 1, 'För att medelvärdet av fyra tal ska bli 10 måste summan vara 4 × 10 = 40. De tre kända talen summerar till 4 + 8 + 12 = 24, så det fjärde talet måste vara 40 − 24 = 16. 10 och 18 ger fel totalsumma, och 20 skulle ge ett medelvärde högre än 10.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('xyz-8', 'xyz', 'En karta har skalan 1:50 000. 4 cm på kartan motsvarar hur lång sträcka i verkligheten?', null, jsonb_build_array('0,2 km', '2 km', '20 km', '200 km'), 1, 'Skalan 1:50 000 innebär att 4 cm på kartan motsvarar 4 × 50 000 = 200 000 cm i verkligheten, vilket är 2 000 m, det vill säga 2 km. 0,2 km är hundra gånger för litet, och 20 km respektive 200 km är för stora eftersom de bygger på en felaktig enhetsomvandling.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-1', 'kva', 'Kvantitet I: 3/4. Kvantitet II: 0,75. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 2, 'Kvantitet I: 3/4 = 0,75. Kvantitet II: 0,75. De två uttrycken beskriver exakt samma tal, så kvantiteterna är lika stora. Alternativen där I eller II anges som större bygger på att man inte omvandlar bråket till decimalform, och att avgörandet skulle vara omöjligt stämmer inte eftersom talen kan jämföras exakt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-2', 'kva', 'Kvantitet I: 2² + 2². Kvantitet II: 2³. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 2, 'Kvantitet I: 2² + 2² = 4 + 4 = 8. Kvantitet II: 2³ = 8. Båda uttrycken ger samma värde, så kvantiteterna är lika stora. Att påstå att I eller II är större bygger på en felaktig uträkning av potenserna, och uppgiften går att avgöra exakt utan någon okänd variabel.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-3', 'kva', 'x > 0. Kvantitet I: 2x. Kvantitet II: x + 3. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 3, 'Kvantitet I: 2x. Kvantitet II: x + 3. Om x = 1 blir I = 2 och II = 4, så II är större, men om x = 4 blir I = 8 och II = 7, så då är I större i stället. Eftersom relationen beror på vilket positivt värde x har går det inte att avgöra vilken kvantitet som är störst, så varken I är större eller II är större eller lika stora kan gälla generellt.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-4', 'kva', 'Kvantitet I: 15 % av 80. Kvantitet II: 20 % av 60. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 2, 'Kvantitet I: 15 procent av 80 är 12. Kvantitet II: 20 procent av 60 är också 12. Kvantiteterna är alltså lika stora trots att procentsatserna och grundtalen skiljer sig åt. Att I eller II skulle vara större bygger på att man bara jämför procentsatserna eller grundtalen var för sig i stället för att räkna ut de faktiska värdena.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-5', 'kva', 'Kvantitet I: arean av en kvadrat med sidan 5. Kvantitet II: 24. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 0, 'Kvantitet I: arean av en kvadrat med sidan 5 är 5² = 25. Kvantitet II är 24, vilket är mindre än 25, så kvantitet I är störst. Att II skulle vara större eller att de är lika bygger på en felaktig uträkning av kvadratens area, och relationen går att avgöra exakt eftersom inga okända variabler finns.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-6', 'kva', 'Kvantitet I: (−3)². Kvantitet II: −9. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 0, 'Kvantitet I: (−3)² = 9, eftersom en negativ faktor multiplicerad med sig själv ger ett positivt tal. Kvantitet II är −9, vilket är betydligt mindre än 9, så kvantitet I är störst. Den vanliga fällan är att tro att (−3)² blir −9 genom att bara kvadrera talet 3 och behålla minustecknet, vilket skulle ge fel svar.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-7', 'kva', 'Ett tal avrundas till 7,4. Kvantitet I: det ursprungliga talet. Kvantitet II: 7,35. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 3, 'Ett tal som avrundas till 7,4 kan ligga någonstans i intervallet 7,35 till precis under 7,45. Kvantitet II är exakt 7,35, vilket ligger i den nedre kanten av intervallet, så det ursprungliga talet kan vara lika med 7,35 eller större än 7,35 beroende på var i intervallet det faktiskt låg. Eftersom relationen mellan kvantiteterna varierar beroende på det exakta ursprungsvärdet går det inte att avgöra säkert vilken som är störst, eller om de är lika.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('kva-8', 'kva', 'Kvantitet I: 1/2 + 1/3. Kvantitet II: 5/6. Vilken är störst?', null, jsonb_build_array('I är större', 'II är större', 'De är lika stora', 'Går inte att avgöra'), 2, 'Kvantitet I: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Kvantitet II är också 5/6, så kvantiteterna är lika stora. Att I eller II skulle vara större bygger på en felaktig hantering av gemensam nämnare vid additionen av bråken.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-1', 'nog', 'Vad är värdet av x + y? (1) x = 4. (2) y = 6. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Inte ens båda räcker'), 2, 'Påstående (1) ger bara x = 4 utan information om y, så summan x + y kan inte beräknas.
Påstående (2) ger bara y = 6 utan information om x, vilket av samma skäl inte räcker ensamt.
Tillsammans ger de x + y = 4 + 6 = 10, så båda behövs för att lösa uppgiften.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-2', 'nog', 'Är n jämnt? (1) n är delbart med 4. (2) n är delbart med 2. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Vardera räcker för sig'), 3, 'Påstående (1) säger att n är delbart med 4, och alla tal som är delbara med 4 är per definition jämna, så (1) räcker ensamt.
Påstående (2) säger direkt att n är delbart med 2, vilket är samma sak som att n är jämnt, så även (2) räcker ensamt.
Eftersom båda påståendena var för sig avgör frågan, räcker vardera för sig.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-3', 'nog', 'Vad är rektangelns area? (1) Längden är 8 cm. (2) Omkretsen är 24 cm. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Inte ens båda räcker'), 2, 'Påstående (1) ger bara längden 8 cm utan information om bredden, så arean går inte att beräkna ensamt.
Påstående (2) ger enbart omkretsen 24 cm, vilket i sig kan motsvara oändligt många kombinationer av längd och bredd.
Tillsammans ger de bredden 24/2 − 8 = 4 cm och därmed arean 8 × 4 = 32 cm², så båda behövs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-4', 'nog', 'Är heltalet k positivt? (1) k² = 16. (2) k > 0. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Vardera räcker för sig'), 1, 'Påstående (1) ger k² = 16, vilket betyder att k är antingen 4 eller −4, så tecknet på k förblir okänt och räcker inte ensamt.
Påstående (2) säger direkt att k > 0, vilket omedelbart avgör att k är positivt.
Därför räcker bara (2) för att besvara frågan.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-5', 'nog', 'Vad är medelvärdet av a och b? (1) a + b = 20. (2) a − b = 4. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Vardera räcker för sig'), 0, 'Medelvärdet av a och b är (a + b)/2. Påstående (1) ger a + b = 20 direkt, vilket genast ger medelvärdet 10, så (1) räcker ensamt.
Påstående (2) ger bara skillnaden a − b = 4, vilket inte säger något om summan och därför inte räcker ensamt för att bestämma medelvärdet.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-6', 'nog', 'Hur många elever finns i klassen? (1) 40 % är flickor. (2) Det finns 12 flickor. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Inte ens båda räcker'), 2, 'Påstående (1) ger bara att 40 procent är flickor, utan ett faktiskt antal går det inte att räkna ut klassens storlek.
Påstående (2) ger enbart antalet flickor, 12, utan att veta vilken andel de utgör av klassen.
Tillsammans ger de att 12 motsvarar 40 procent, vilket ger totalt 12 / 0,4 = 30 elever, så båda behövs.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-7', 'nog', 'Vad är p · q? (1) p = 0. (2) q = 17. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Inte ens båda räcker'), 0, 'Påstående (1) ger p = 0, och då blir produkten p · q alltid 0 oavsett vad q är, så (1) räcker ensamt.
Påstående (2) ger bara q = 17 utan information om p, vilket inte räcker för att bestämma produkten.
Därför räcker bara (1) för att besvara frågan.');
insert into public.questions (id, kind, prompt, passage, options, correct_index, explain) values ('nog-8', 'nog', 'Ligger punkten (x, y) på linjen y = 2x + 1? (1) x = 3. (2) y = 7. Vilken information räcker?', null, jsonb_build_array('Bara (1) räcker', 'Bara (2) räcker', 'Båda behövs tillsammans, ingen ensam', 'Inte ens båda räcker'), 2, 'Påstående (1) ger bara x = 3 utan att ange y, så det går inte att kontrollera om punkten ligger på linjen.
Påstående (2) ger bara y = 7 utan att ange x, vilket av samma skäl inte räcker ensamt.
Tillsammans ger de att 2 · 3 + 1 = 7, vilket stämmer med y-värdet, så båda behövs för att avgöra att punkten faktiskt ligger på linjen.');
insert into public.reflect_prompts (id, title, prompts) values ('reflect-analys', 'Felanalys', jsonb_build_array('Vilket delprov gick sämst i det här passet?', 'Var felen mest kunskap, slarv eller tidspress?', 'Skriv tre konkreta åtgärder för nästa vecka.'));
insert into public.reflect_prompts (id, title, prompts) values ('reflect-rest', 'Provdags-check', jsonb_build_array('Har du koll på tid, plats, ID och material?', 'Hur ser sömnen ut de närmaste nätterna?', 'Vilken lätt repetition gör du sista kvällen (max 20 min)?'));
insert into public.reflect_prompts (id, title, prompts) values ('reflect-full', 'Efter fullprov', jsonb_build_array('Råpoäng ungefär per delprov?', 'Var föll koncentrationen (tidpunkt/delprov)?', 'Vad lappar du de kommande två dagarna — MEK eller ORD?'));

-- ============ MIGRATION 0006: exam_import ============
-- new question columns
alter table public.questions
  add column if not exists exam_id text,
  add column if not exists exam_date date,
  add column if not exists pass_number smallint,
  add column if not exists question_number smallint,
  add column if not exists figure_url text,
  add column if not exists source_url text,
  add column if not exists status text not null default 'published';

alter table public.questions
  add constraint questions_status_check check (status in ('draft','published','rejected'));

create index if not exists idx_questions_exam on public.questions (exam_id);
create index if not exists idx_questions_status on public.questions (status);
create index if not exists idx_questions_exam_pass on public.questions (exam_id, pass_number);

-- exams registry table (powers the old-exams browser UI)
create table if not exists public.exams (
  id text primary key,
  exam_date date not null,
  title text not null,
  status text not null default 'imported' check (status in ('imported','published','rejected')),
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;
create policy "public read exams" on public.exams
  for select to anon, authenticated using (true);

-- public figure bucket (anonymous users must be able to see extracted figures)
insert into storage.buckets (id, name, public) values ('prov-figures','prov-figures', true)
  on conflict (id) do nothing;

-- ============ MIGRATION 0007: usernames ============
-- HP Lift: unika användarnamn + profil-säkerställande.
--
-- Lägger till en `username`-kolumn på player_profiles med ett skiftlägesokänsligt
-- unikt index, samt två SECURITY DEFINER-funktioner:
--   * profile_set_username(text) — validerar + sparar användarnamnet och
--     skriver samtidigt display_name = användarnamnet (så att dueller och
--     topplistor visar det valda namnet).
--   * profile_ensure() — skapar profilraden om den saknas (annars ingen-op),
--     och returnerar raden. Används av profilsidan och av användarnamnsprompten.
--
-- OBS: de befintliga duell-RPC:erna (duel_ensure_profile, duel_join_queue,
-- duel_create_private) lämnas orörda. De kan fortfarande skapa en rad med
-- fallback-namnet "Spelare" om användaren duellerar innan den valt användarnamn
-- — det är OK eftersom profile_set_username skriver över display_name och
-- username tillsammans.
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0005).

-- ---------------------------------------------------------------------------
-- 1. Kolumn + unikt (skiftlägesokänsligt) index
-- ---------------------------------------------------------------------------
alter table public.player_profiles
  add column if not exists username text;

-- Unikhet gäller per gemener-värde och enbart för ifyllda användarnamn,
-- så att flera rader med username = null tillåts.
create unique index if not exists player_profiles_username_lower_key
  on public.player_profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- 2. Sätt/spara användarnamn (SECURITY DEFINER — klienten kan inte skriva
--    display_name direkt eftersom tabellen saknar UPDATE-policy)
-- ---------------------------------------------------------------------------
create or replace function public.profile_set_username(p_username text)
returns public.player_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_username text;
  v_profile public.player_profiles;
begin
  -- Kräv inloggning.
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Format: 3-20 tecken, bokstäver (inkl. åäö/ÅÄÖ), siffror, _ eller -.
  if p_username is null or p_username !~ '^[a-zA-Z0-9_åäöÅÄÖ-]{3,20}$' then
    raise exception 'INVALID';
  end if;

  v_username := p_username;

  -- Unikhet, skiftlägesokänslig (och trimmat för säkerhets skull).
  if exists (
    select 1 from public.player_profiles
    where user_id <> v_user
      and lower(username) = lower(btrim(v_username))
  ) then
    raise exception 'TAKEN';
  end if;

  -- Upserta egen rad: användarnamnet blir också visningsnamnet i dueller.
  insert into public.player_profiles (user_id, display_name, username, updated_at)
  values (v_user, v_username, v_username, now())
  on conflict (user_id) do update
    set username = excluded.username,
        display_name = excluded.display_name,
        updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Säkerställ att profilraden finns (idempotent) och returnera den
-- ---------------------------------------------------------------------------
create or replace function public.profile_ensure()
returns public.player_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.player_profiles;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.player_profiles (user_id, display_name)
  values (v_user, 'Spelare')
  on conflict (user_id) do nothing;

  select * into v_profile from public.player_profiles where user_id = v_user;
  return v_profile;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Rättigheter: endast inloggade användare får anropa funktionerna
-- ---------------------------------------------------------------------------
revoke execute on function public.profile_set_username(text) from public, anon;
revoke execute on function public.profile_ensure() from public, anon;

grant execute on function public.profile_set_username(text) to authenticated;
grant execute on function public.profile_ensure() to authenticated;

-- =====================================================================
-- EFTERKONTROLL (ENDAST LÄSNING — inga dataändrande satser)
-- =====================================================================
-- Kör gärna hela blocket efter att migrationerna ovan kört klart.
-- Förväntat: alla *_finns-kolumner = true, gammal_tre_args_variant_finns =
-- false, questions = 146 och duel_questions = 136.

-- 1. Tabellerna ska finnas.
select '1. tabeller' as kontroll,
       to_regclass('public.duel_questions')  is not null as duel_questions_finns,
       to_regclass('public.questions')       is not null as questions_finns,
       to_regclass('public.reflect_prompts') is not null as reflect_prompts_finns,
       to_regclass('public.exams')           is not null as exams_finns;

-- 2. player_profiles.username ska finnas (0007).
select '2. username' as kontroll,
       exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'player_profiles'
           and column_name = 'username'
       ) as player_profiles_username_finns;

-- 3. Server-auktoritativ signatur: public.duel_mark_finished(uuid) ska
--    finnas, och den gamla 3-args-varianten ska INTE finnas.
select '3. duel_mark_finished-signatur' as kontroll,
       exists (
         select 1
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname = 'duel_mark_finished'
           and pg_get_function_identity_arguments(p.oid) = 'uuid'
       ) as ett_args_variant_finns,
       exists (
         select 1
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname = 'duel_mark_finished'
           and pg_get_function_identity_arguments(p.oid) = 'uuid, integer, integer'
       ) as gammal_tre_args_variant_finns;

-- 4. Antal seedade rader (0004: 136 facit-rader, 0005: 146 frågor).
select '4. antal rader' as kontroll,
       (select count(*) from public.duel_questions)  as duel_questions_rader,
       (select count(*) from public.questions)       as questions_rader,
       (select count(*) from public.reflect_prompts) as reflect_prompts_rader;

-- HP Lift: Recensionssystem för dueller.
-- Efter avslutad match kan spelare betygsätta motståndaren (1-5 stjärnor),
-- rapportera osportsligt beteende och lämna feedback. Mot botar röstar man
-- istället på svårighetsgraden (för lätt / lagom / för svår) — det justerar
-- botens svårighet för den spelaren.
--
-- Röster viktas efter trovärdighet (fler genomförda matcher => tyngre röst).
-- Konton flaggas automatiskt vid upprepade negativa omdömen eller rapporter
-- och stängs då av från Ranked-matchmaking tills omdömena förbättras.
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0002).

-- ---------------------------------------------------------------------------
-- 1. Nya kolumner på spelarprofilen
-- ---------------------------------------------------------------------------
alter table public.player_profiles
  add column if not exists flagged boolean not null default false,
  add column if not exists flagged_at timestamptz,
  add column if not exists received_rating_sum numeric not null default 0,
  add column if not exists received_rating_count integer not null default 0,
  add column if not exists report_count integer not null default 0,
  add column if not exists bot_skill_offset integer not null default 0;

-- ---------------------------------------------------------------------------
-- 2. Recensioner
-- ---------------------------------------------------------------------------
create table if not exists public.duel_reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.duel_matches (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  target_user uuid references auth.users (id) on delete cascade,
  target_is_bot boolean not null default false,
  rating integer check (rating between 1 and 5),
  difficulty text check (difficulty in ('too_easy', 'just_right', 'too_hard')),
  report_reason text check (report_reason in ('cheating', 'unsportsmanlike', 'abuse', 'other')),
  comment text,
  weight numeric not null default 1,
  created_at timestamptz not null default now(),
  unique (match_id, reviewer_id),
  check (
    (target_is_bot and target_user is null and difficulty is not null)
    or
    (not target_is_bot and target_user is not null and rating is not null)
  )
);

alter table public.duel_reviews enable row level security;

-- Deltagarna i matchen får se recensionerna (anonymiserade i UI:t).
create policy "reviews_select_involved" on public.duel_reviews
  for select using (
    exists (
      select 1 from public.duel_matches m
      where m.id = match_id
        and (m.player_a = auth.uid() or m.player_b = auth.uid())
    )
  );

-- Ingen INSERT/UPDATE/DELETE-policy: recensioner skrivs enbart via
-- SECURITY DEFINER-funktionen nedan (anti-fusk).

create index duel_reviews_target_idx on public.duel_reviews (target_user);
create index duel_reviews_match_idx on public.duel_reviews (match_id);

-- ---------------------------------------------------------------------------
-- 3. Skicka in recension (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. Ranked spärras för flaggade konton (ersätter duel_join_queue från 0002)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.duel_submit_review(uuid, integer, text, text, text) from public, anon;
grant execute on function public.duel_submit_review(uuid, integer, text, text, text) to authenticated;

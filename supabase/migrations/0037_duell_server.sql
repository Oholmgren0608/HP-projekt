-- 0037: duellerna rättas, tidmäts och väljer frågor på servern (steg 1,
-- docs/alla-mot-alla/steg-1-plan.md, ADR 0001).
--
-- Hål som stängs:
-- * Klienten valde själv fråge-id (buildDuelQuiz) och duel_submit_answer
--   kontrollerade inte att frågan hörde till matchen.
-- * Klienten rapporterade sin egen svarstid (p_time_ms).
-- * I botmatcher rapporterade klienten botens resultat (duel_finish_bot(p_bot_correct)),
--   och botens svar simulerades i webbläsaren med facit.
-- * Duellernas frågor och facit fanns i den publika frågebanken (löst med
--   spelpoolen i 0035/0036).
--
-- Nytt:
-- * duel_match_questions: matchens tio frågor (2 per delprov ur spelpoolen,
--   ORD/MEK/XYZ/KVA/NOG), väljs av servern första gången någon hämtar en fråga.
-- * duel_question_serves: när spelaren fick varje fråga. Svarstiden räknas
--   från den tidpunkten, aldrig av klienten.
-- * duel_next_question: nästa fråga utan facit. duel_submit_answer: svar på
--   fråga nummer p_idx; returnerar facit och förklaring för just den frågan.
-- * duel_review: alla frågor med facit, först när spelaren är klar.
-- * Botens svar simuleras på servern (duel_bot_answers); duel_finish_bot tar
--   inte längre emot något resultat från klienten. En ny botmatch avslutar
--   spelarens tidigare, övergivna botmatcher, så att man inte kan lämna de
--   matcher man håller på att förlora.
-- * Tid per fråga efter delprov: ORD 20 s, MEK 45 s, KVA 75 s, XYZ/NOG 90 s
--   (ersätter 40 s från 0024), plus 2 s marginal för nätet.
-- * pool_question_views + pool_pick_questions: delas med Alla mot alla; frågor
--   som spelarna fått de senaste 30 dagarna väljs sist.
-- * Pågående matcher avbryts (de har inga serverade frågor).
--
-- Säkerhet (AGENTS.md regel 6): de nya tabellerna har RLS utan policies (bara
-- security definer-funktionerna läser dem). De gamla signaturerna
-- duel_submit_answer(uuid, text, integer, integer) och
-- duel_finish_bot(uuid, integer) tas bort. Test: ~/.cache/hp-db-test/test-0035-0037.mjs.

-- ---------------------------------------------------------------------------
-- 1. Tid per delprov
-- ---------------------------------------------------------------------------
create or replace function public.pool_time_limit_ms(p_kind text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_kind
    when 'ord' then 20000
    when 'mek' then 45000
    when 'kva' then 75000
    when 'xyz' then 90000
    when 'nog' then 90000
    else 60000
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Tabeller
-- ---------------------------------------------------------------------------
create table if not exists public.pool_question_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
alter table public.pool_question_views enable row level security;

create table if not exists public.duel_match_questions (
  match_id uuid not null references public.duel_matches (id) on delete cascade,
  idx smallint not null check (idx between 0 and 29),
  question_id text not null references public.questions (id) on delete cascade,
  kind text not null,
  primary key (match_id, idx)
);
alter table public.duel_match_questions enable row level security;

create table if not exists public.duel_question_serves (
  match_id uuid not null references public.duel_matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  idx smallint not null,
  served_at timestamptz not null default now(),
  primary key (match_id, user_id, idx)
);
alter table public.duel_question_serves enable row level security;

create table if not exists public.duel_bot_answers (
  match_id uuid not null references public.duel_matches (id) on delete cascade,
  idx smallint not null,
  chosen integer not null,
  correct boolean not null,
  time_ms integer not null,
  primary key (match_id, idx)
);
alter table public.duel_bot_answers enable row level security;

alter table public.duel_answers add column if not exists idx smallint;

-- Supabases standardrättigheter ger anon/authenticated allt på nya tabeller;
-- RLS utan policies stänger läsning, men skrivrättigheterna tas också bort.
revoke all on public.pool_question_views, public.duel_match_questions,
  public.duel_question_serves, public.duel_bot_answers
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Frågeval ur spelpoolen (delas med Alla mot alla)
-- ---------------------------------------------------------------------------
-- Jämnt fördelat över delproven (rangordning inom delprov, sedan rundor),
-- frågor som någon av spelarna fått de senaste 30 dagarna sist, i slumpad ordning.
create or replace function public.pool_pick_questions(
  p_users uuid[],
  p_kinds text[],
  p_count integer
)
returns table (idx smallint, question_id text, kind text)
language sql
volatile
security definer
set search_path = public
as $$
  with ranked as (
    select q.id,
           q.kind,
           row_number() over (
             partition by q.kind
             order by exists (
               select 1 from public.pool_question_views v
                where v.question_id = q.id
                  and v.user_id = any (p_users)
                  and v.viewed_at > now() - interval '30 days'
             ), random()
           ) as rn
      from public.questions q
     where q.pool = 'spel'
       and q.status = 'published'
       and q.kind = any (p_kinds)
  ),
  picked as (
    select id, kind from ranked order by rn, random() limit greatest(0, p_count)
  )
  select (row_number() over (order by random()) - 1)::smallint, id, kind from picked;
$$;

-- Matchens frågor skapas en gång, under radlås på matchen.
create or replace function public.duel_ensure_questions(p_match_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.duel_matches%rowtype;
  v_n integer;
begin
  select count(*) into v_n from public.duel_match_questions where match_id = p_match_id;
  if v_n > 0 then return v_n; end if;

  select * into v_match from public.duel_matches where id = p_match_id for update;
  select count(*) into v_n from public.duel_match_questions where match_id = p_match_id;
  if v_n > 0 then return v_n; end if;

  insert into public.duel_match_questions (match_id, idx, question_id, kind)
  select p_match_id, p.idx, p.question_id, p.kind
    from public.pool_pick_questions(
      array_remove(array[v_match.player_a, v_match.player_b], null),
      array['ord', 'mek', 'xyz', 'kva', 'nog'],
      10
    ) p;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    raise exception 'Spelpoolen har inga frågor ännu.';
  end if;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Bot på servern
-- ---------------------------------------------------------------------------
create or replace function public.duel_bot_answer(p_match_id uuid, p_idx integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.duel_matches%rowtype;
  v_q public.questions%rowtype;
  v_elo integer;
  v_offset integer;
  v_acc numeric;
  v_correct boolean;
  v_chosen integer;
  v_n integer;
  v_limit integer;
  v_existing boolean;
begin
  select correct into v_existing from public.duel_bot_answers
   where match_id = p_match_id and idx = p_idx;
  if found then return v_existing; end if;

  select * into v_match from public.duel_matches where id = p_match_id;
  select q.* into v_q
    from public.duel_match_questions mq
    join public.questions q on q.id = mq.question_id
   where mq.match_id = p_match_id and mq.idx = p_idx;
  if not found then return null; end if;

  select bot_skill_offset into v_offset from public.player_profiles where user_id = v_match.player_a;
  v_elo := coalesce(v_match.bot_elo, 1200) + coalesce(v_offset, 0);
  v_acc := least(0.85, greatest(0.35, 0.35 + (v_elo - 800)::numeric / 3000));
  v_correct := random() < v_acc;
  v_n := jsonb_array_length(v_q.options);
  if v_correct then
    v_chosen := v_q.correct_index;
  else
    v_chosen := floor(random() * greatest(1, v_n - 1))::integer;
    if v_chosen >= v_q.correct_index then v_chosen := v_chosen + 1; end if;
  end if;
  v_limit := public.pool_time_limit_ms(v_q.kind);

  insert into public.duel_bot_answers (match_id, idx, chosen, correct, time_ms)
  values (p_match_id, p_idx, v_chosen, v_correct,
          round(v_limit * (case when v_correct then 0.15 + 0.35 * random()
                                else 0.30 + 0.50 * random() end))::integer)
  on conflict (match_id, idx) do nothing;
  return v_correct;
end;
$$;

-- Avslutar en botmatch: botens saknade svar simuleras, spelarens obesvarade
-- frågor räknas som fel. Anropas av duel_finish_bot och duel_start_bot_match.
create or replace function public.duel_settle_bot_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.duel_matches%rowtype;
  v_bot_correct integer;
  v_player_correct integer;
  v_player_time_ms integer;
  v_score numeric;
  v_delta integer := 0;
  v_winner uuid;
  v_idx smallint;
begin
  select * into v_match from public.duel_matches where id = p_match_id for update;
  if not found or v_match.status <> 'active' or v_match.player_b is not null
     or v_match.bot_elo is null then
    return null;
  end if;

  perform public.duel_ensure_questions(p_match_id);
  for v_idx in select idx from public.duel_match_questions where match_id = p_match_id loop
    perform public.duel_bot_answer(p_match_id, v_idx);
  end loop;

  select count(*) filter (where correct) into v_bot_correct
    from public.duel_bot_answers where match_id = p_match_id;
  select count(*) filter (where correct), coalesce(sum(time_ms), 0)
    into v_player_correct, v_player_time_ms
    from public.duel_answers where match_id = p_match_id and user_id = v_match.player_a;

  if v_player_correct > v_bot_correct then
    v_winner := v_match.player_a; v_score := 1;
  elsif v_bot_correct > v_player_correct then
    v_winner := null; v_score := 0;
  else
    v_winner := null; v_score := 0.5;
  end if;

  if v_match.mode = 'ranked' then
    v_delta := round(16 * (v_score - 0.5))::integer;
    update public.player_profiles
       set elo = greatest(0, elo + v_delta),
           wins = wins + (case when v_score = 1 then 1 else 0 end),
           losses = losses + (case when v_score = 0 then 1 else 0 end),
           draws = draws + (case when v_score = 0.5 then 1 else 0 end),
           updated_at = now()
     where user_id = v_match.player_a;
  end if;

  update public.duel_matches
     set status = 'finished',
         winner = v_winner,
         a_correct = v_player_correct,
         b_correct = v_bot_correct,
         a_time_ms = v_player_time_ms,
         a_finished_at = coalesce(a_finished_at, now()),
         elo_a_delta = v_delta,
         finished_at = now()
   where id = p_match_id;

  return jsonb_build_object(
    'delta', v_delta,
    'winner_is_me', coalesce(v_winner = v_match.player_a, false),
    'bot_correct', v_bot_correct,
    'my_correct', v_player_correct
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Klient-RPC:er
-- ---------------------------------------------------------------------------
create or replace function public.duel_next_question(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_total integer;
  v_idx smallint;
  v_q public.questions%rowtype;
  v_served timestamptz;
  v_limit integer;
  v_elapsed integer;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  select * into v_match from public.duel_matches where id = p_match_id;
  if not found or (v_match.player_a is distinct from v_user and v_match.player_b is distinct from v_user) then
    raise exception 'invalid match';
  end if;
  if v_match.status <> 'active' then
    return jsonb_build_object('done', true, 'status', v_match.status);
  end if;

  v_total := public.duel_ensure_questions(p_match_id);

  loop
    select mq.idx into v_idx
      from public.duel_match_questions mq
     where mq.match_id = p_match_id
       and not exists (
         select 1 from public.duel_answers da
          where da.match_id = p_match_id and da.user_id = v_user and da.idx = mq.idx
       )
     order by mq.idx
     limit 1;
    if not found then
      return jsonb_build_object('done', true, 'status', v_match.status, 'total', v_total);
    end if;

    select q.* into v_q
      from public.duel_match_questions mq
      join public.questions q on q.id = mq.question_id
     where mq.match_id = p_match_id and mq.idx = v_idx;
    v_limit := public.pool_time_limit_ms(v_q.kind);

    select served_at into v_served from public.duel_question_serves
     where match_id = p_match_id and user_id = v_user and idx = v_idx;
    if not found then
      insert into public.duel_question_serves (match_id, user_id, idx)
      values (p_match_id, v_user, v_idx)
      on conflict do nothing;
      v_served := now();
      insert into public.pool_question_views (user_id, question_id, viewed_at)
      values (v_user, v_q.id, now())
      on conflict (user_id, question_id) do update set viewed_at = excluded.viewed_at;
    end if;

    v_elapsed := (extract(epoch from (now() - v_served)) * 1000)::integer;
    if v_elapsed <= v_limit + 2000 then
      return jsonb_build_object(
        'done', false,
        'index', v_idx,
        'total', v_total,
        'time_limit_ms', v_limit,
        'remaining_ms', greatest(0, v_limit - v_elapsed),
        'question', jsonb_build_object(
          'id', v_q.id,
          'kind', v_q.kind,
          'prompt', v_q.prompt,
          'passage', v_q.passage,
          'options', v_q.options,
          'figure_url', v_q.figure_url
        )
      );
    end if;

    -- Tiden gick ut medan spelaren var borta: räknas som obesvarad.
    insert into public.duel_answers (match_id, user_id, question_id, chosen, correct, time_ms, idx)
    values (p_match_id, v_user, v_q.id, -1, false, v_limit, v_idx)
    on conflict do nothing;
    if v_match.player_b is null then
      perform public.duel_bot_answer(p_match_id, v_idx);
    end if;
  end loop;
end;
$$;

create or replace function public.duel_submit_answer(
  p_match_id uuid,
  p_idx integer,
  p_chosen integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_q public.questions%rowtype;
  v_served timestamptz;
  v_limit integer;
  v_elapsed integer;
  v_chosen integer;
  v_correct boolean;
  v_time integer;
  v_existing public.duel_answers%rowtype;
  v_bot jsonb := null;
  v_bot_correct boolean;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  select * into v_match from public.duel_matches where id = p_match_id;
  if not found or (v_match.player_a is distinct from v_user and v_match.player_b is distinct from v_user) then
    raise exception 'invalid match';
  end if;

  select q.* into v_q
    from public.duel_match_questions mq
    join public.questions q on q.id = mq.question_id
   where mq.match_id = p_match_id and mq.idx = p_idx;
  if not found then raise exception 'unknown question'; end if;

  select * into v_existing from public.duel_answers
   where match_id = p_match_id and user_id = v_user and idx = p_idx;
  if found then
    v_chosen := v_existing.chosen; v_correct := v_existing.correct; v_time := v_existing.time_ms;
  else
    if v_match.status <> 'active' then raise exception 'invalid match'; end if;
    select served_at into v_served from public.duel_question_serves
     where match_id = p_match_id and user_id = v_user and idx = p_idx;
    if not found then raise exception 'Frågan har inte visats.'; end if;

    v_limit := public.pool_time_limit_ms(v_q.kind);
    v_elapsed := (extract(epoch from (now() - v_served)) * 1000)::integer;
    v_chosen := coalesce(p_chosen, -1);
    if v_chosen < 0 or v_chosen >= jsonb_array_length(v_q.options) or v_elapsed > v_limit + 2000 then
      v_chosen := -1;
    end if;
    v_correct := v_chosen >= 0 and v_chosen = v_q.correct_index;
    v_time := case when v_chosen < 0 then v_limit else greatest(1, least(v_elapsed, v_limit)) end;

    insert into public.duel_answers (match_id, user_id, question_id, chosen, correct, time_ms, idx)
    values (p_match_id, v_user, v_q.id, v_chosen, v_correct, v_time, p_idx)
    on conflict do nothing;
  end if;

  if v_match.player_b is null and v_match.bot_elo is not null then
    v_bot_correct := public.duel_bot_answer(p_match_id, p_idx);
    v_bot := jsonb_build_object(
      'correct', v_bot_correct,
      'total_correct', (select count(*) filter (where correct) from public.duel_bot_answers where match_id = p_match_id)
    );
  end if;

  return jsonb_build_object(
    'index', p_idx,
    'chosen', v_chosen,
    'correct', v_correct,
    'correct_index', v_q.correct_index,
    'explain', v_q.explain,
    'time_ms', v_time,
    'bot', v_bot
  );
end;
$$;

create or replace function public.duel_review(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.duel_matches%rowtype;
  v_mine_done boolean;
  v_over boolean;
  v_opp uuid;
begin
  select * into v_match from public.duel_matches where id = p_match_id;
  if not found or (v_match.player_a is distinct from v_user and v_match.player_b is distinct from v_user) then
    raise exception 'invalid match';
  end if;
  v_over := v_match.status in ('finished', 'forfeit', 'cancelled');
  v_mine_done := case when v_match.player_a = v_user then v_match.a_finished_at is not null
                      else v_match.b_finished_at is not null end;
  if not v_over and not v_mine_done then
    raise exception 'Genomgången visas när du är klar.';
  end if;
  v_opp := case when v_match.player_a = v_user then v_match.player_b else v_match.player_a end;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'index', mq.idx,
             'question', jsonb_build_object(
               'id', q.id, 'kind', q.kind, 'prompt', q.prompt, 'passage', q.passage,
               'options', q.options, 'figure_url', q.figure_url),
             'correct_index', q.correct_index,
             'explain', q.explain,
             'my_chosen', mine.chosen,
             'opp_chosen', case when v_over then coalesce(opp.chosen, bot.chosen) end
           ) order by mq.idx)
      from public.duel_match_questions mq
      join public.questions q on q.id = mq.question_id
      left join public.duel_answers mine
        on mine.match_id = mq.match_id and mine.user_id = v_user and mine.idx = mq.idx
      left join public.duel_answers opp
        on opp.match_id = mq.match_id and opp.user_id = v_opp and opp.idx = mq.idx
      left join public.duel_bot_answers bot
        on bot.match_id = mq.match_id and bot.idx = mq.idx and v_match.player_b is null
     where mq.match_id = p_match_id
  ), '[]'::jsonb);
end;
$$;

drop function if exists public.duel_finish_bot(uuid, integer);
drop function if exists public.duel_submit_answer(uuid, text, integer, integer);

create or replace function public.duel_finish_bot(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then return null; end if;
  if not exists (
    select 1 from public.duel_matches
     where id = p_match_id and player_a = v_user and player_b is null and bot_elo is not null
  ) then
    return null;
  end if;
  return public.duel_settle_bot_match(p_match_id);
end;
$$;

-- En ny botmatch avslutar spelarens tidigare, övergivna botmatcher.
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
  v_old uuid;
begin
  if v_user is null then raise exception 'Du måste vara inloggad.'; end if;
  if p_mode not in ('ranked', 'casual') then raise exception 'invalid mode'; end if;

  for v_old in
    select id from public.duel_matches
     where player_a = v_user and player_b is null and bot_elo is not null and status = 'active'
  loop
    perform public.duel_settle_bot_match(v_old);
  end loop;

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
  values (p_mode, 'active', v_user, v_elo, '', now())
  returning id into v_match_id;
  return v_match_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Vinst på grund av passivitet: längre speltid (10 x 90 s + paus mellan frågorna)
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

  -- Längsta tänkbara match: 10 frågor x 90 s plus pauser. Den som har fått en
  -- fråga de senaste två minuterna spelar fortfarande.
  if now() < coalesce(v_match.started_at, v_match.created_at) + interval '17 minutes'
     or exists (
       select 1 from public.duel_question_serves s
        where s.match_id = p_match_id and s.user_id = v_opp
          and s.served_at > now() - interval '120 seconds'
     )
     or exists (
       select 1 from public.duel_answers da
        where da.match_id = p_match_id and da.user_id = v_opp
          and da.answered_at > now() - interval '120 seconds'
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

-- ---------------------------------------------------------------------------
-- 7. Pågående matcher har inga serverade frågor och avbryts.
-- ---------------------------------------------------------------------------
update public.duel_matches
   set status = 'cancelled', finished_at = now()
 where status = 'active';

-- ---------------------------------------------------------------------------
-- 8. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.pool_time_limit_ms(text) from public;
grant execute on function public.pool_time_limit_ms(text) to anon, authenticated;

revoke execute on function public.pool_pick_questions(uuid[], text[], integer) from public, anon, authenticated;
revoke execute on function public.duel_ensure_questions(uuid) from public, anon, authenticated;
revoke execute on function public.duel_bot_answer(uuid, integer) from public, anon, authenticated;
revoke execute on function public.duel_settle_bot_match(uuid) from public, anon, authenticated;

revoke execute on function public.duel_next_question(uuid) from public, anon;
revoke execute on function public.duel_submit_answer(uuid, integer, integer) from public, anon;
revoke execute on function public.duel_review(uuid) from public, anon;
revoke execute on function public.duel_finish_bot(uuid) from public, anon;
revoke execute on function public.duel_start_bot_match(text) from public, anon;
revoke execute on function public.duel_claim_stall_win(uuid) from public, anon;

grant execute on function public.duel_next_question(uuid) to authenticated;
grant execute on function public.duel_submit_answer(uuid, integer, integer) to authenticated;
grant execute on function public.duel_review(uuid) to authenticated;
grant execute on function public.duel_finish_bot(uuid) to authenticated;
grant execute on function public.duel_start_bot_match(text) to authenticated;
grant execute on function public.duel_claim_stall_win(uuid) to authenticated;

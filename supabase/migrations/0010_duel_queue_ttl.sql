-- 0010_duel_queue_ttl.sql
-- ---------------------------------------------------------------------------
-- Mål: övergivna köposter och matcher ska inte ligga kvar för evigt.
--
-- Bakgrund: `duel_queue` töms bara av `duel_cancel_queue` eller av att en ny
-- match skapas. Stänger spelaren fliken (krasch, tappad uppkoppling) utan att
-- klicka Avbryt ligger raden kvar, och nästa sökande matchas mot en spelare som
-- inte är där. Spöket får då förlust + ELO-tapp utan att ha spelat, och raden
-- samlas på hög (en kontroll 2026-09 visade 6 samtidiga aktiva/väntande matcher
-- för samma konto, den äldsta 19 dagar gammal).
--
-- Åtgärd, allt server-side så att det gäller även när klienten kraschar:
--   1. `duel_queue.expires_at` (5 min) — en köpost är bara matchbar så länge
--      den är färsk. Klienten förnyar raden när spelaren väljer "Fortsätt söka".
--   2. `duel_join_queue` städar utgångna köposter och avbryter övergivna
--      matcher (äldre än 30 min utan ett enda svar) innan den matchar.
--   3. Engångsstädning av det som redan ligger i databasen.
--
-- Kör filen i Supabase Dashboard → SQL Editor. Idempotent: säker att köra om.
-- ---------------------------------------------------------------------------

-- 1. Utgångstid på köposter -------------------------------------------------
alter table public.duel_queue
  add column if not exists expires_at timestamptz not null default now() + interval '5 minutes';

create index if not exists duel_queue_expires_at_idx
  on public.duel_queue (expires_at);

-- 2. Kö-funktionen: städa + matcha bara färska köposter ---------------------
-- Ersätter versionen från 0003 (flagg-spärren för Ranked behålls).
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

  -- Städning 1: köposter som löpt ut kan aldrig bli en match.
  delete from public.duel_queue where expires_at <= now();

  -- Städning 2: övergivna matcher. Att bara avbryta (inte ge någon förlust) är
  -- avsiktligt — ingen har spelat klart. Två fall räknas som övergivna:
  --   * ingen motståndare finns (botmatch eller privat lobby som aldrig fylldes
  --     — ingen kan vänta på dem, och ingen kan vinna dem),
  --   * ingen har svarat på 30 minuter.
  update public.duel_matches m
     set status = 'cancelled',
         finished_at = now()
   where m.status in ('waiting', 'active')
     and m.created_at < now() - interval '30 minutes'
     and (
       m.player_b is null
       or not exists (select 1 from public.duel_answers a where a.match_id = m.id)
     );

  -- Spelarens egen rad förnyas alltid (delete + insert nedan) så att
  -- expires_at speglar den aktiva sökningen.
  delete from public.duel_queue where user_id = v_user;

  -- Närmast i ELO inom samma läge, bara färska köposter; lås raden så att två
  -- sökande inte matchar samma.
  select * into v_opp
  from public.duel_queue
  where mode = p_mode
    and user_id <> v_user
    and expires_at > now()
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

revoke execute on function public.duel_join_queue(text) from public, anon;
grant execute on function public.duel_join_queue(text) to authenticated;

-- 3. Engångsstädning av befintliga spökrader --------------------------------
delete from public.duel_queue where expires_at <= now();

update public.duel_matches m
   set status = 'cancelled',
       finished_at = now()
 where m.status in ('waiting', 'active')
   and m.created_at < now() - interval '30 minutes'
   and (
     m.player_b is null
     or not exists (select 1 from public.duel_answers a where a.match_id = m.id)
   );

-- HP Lift: Vecko-XP-topplista (gamification).
-- En rad per användare och ISO-vecka med kumulativ XP. Topplistan är
-- läsbar för alla (även anonyma), men bara inloggade användare kan
-- skicka in sin egen XP via leaderboard_submit (SECURITY DEFINER,
-- anti-fusk på samma sätt som duellerna).
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor (efter 0001-0008).

-- ---------------------------------------------------------------------------
-- 1. Tabell
-- ---------------------------------------------------------------------------
create table public.leaderboard_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  week text not null, -- ex. "2025-W37"
  xp integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

alter table public.leaderboard_entries enable row level security;

-- Listan är publik: anonyma besökare ser topplistan (men rankas inte).
create policy "leaderboard_select" on public.leaderboard_entries
  for select using (true);

-- Endast egen rad får skrivas (sker via RPC:n nedan).
create policy "leaderboard_insert_own" on public.leaderboard_entries
  for insert with check (auth.uid() = user_id);
create policy "leaderboard_update_own" on public.leaderboard_entries
  for update using (auth.uid() = user_id);

create index leaderboard_week_xp_idx on public.leaderboard_entries (week, xp desc);

-- ---------------------------------------------------------------------------
-- 2. RPC-funktioner (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.leaderboard_submit(text, integer) from public, anon;
revoke execute on function public.leaderboard_get(text, integer) from public, anon;
revoke execute on function public.leaderboard_set_name(text) from public, anon;

grant execute on function public.leaderboard_submit(text, integer) to authenticated;
grant execute on function public.leaderboard_get(text, integer) to anon, authenticated;
grant execute on function public.leaderboard_set_name(text) to authenticated;

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

-- 0032_user_state_servertid.sql
-- ---------------------------------------------------------------------------
-- Mål: synken mellan enheter ska bygga på serverns tid och aldrig skriva över
-- en ändring som en annan enhet hunnit göra (docs/KNOWN_ISSUES.md, "Login sync
-- can overwrite progress").
--
-- Bakgrund: klienten satte själv user_state.updated_at med enhetens klocka, och
-- en skrivning ersatte alltid hela raden. En enhet med fel klocka kunde vinna,
-- och två enheter skrev över varandra.
--
-- 1. updated_at sätts av servern vid varje INSERT och UPDATE (trigger) och
--    ökar alltid per rad, även inom samma transaktion. Klientens värde
--    ignoreras. Värdet är radens version.
-- 2. user_state_put(p_key, p_base, p_value) skriver bara om raden fortfarande
--    har versionen p_base (null = raden ska inte finnas än). Annars skrivs
--    ingenting och funktionen returnerar raden som den ser ut nu, så att
--    klienten kan slå ihop och försöka igen.
--
-- RLS och rättigheter på tabellen ändras inte här. Direkta INSERT/UPDATE från
-- klienter stängs i en senare migration, när den nya klienten är driftsatt
-- (gamla flikar skriver fortfarande direkt).
--
-- Tester: ~/.cache/hp-db-test/test-0032.mjs (PGlite).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Serverns tid som version.
-- ---------------------------------------------------------------------------
create or replace function public.user_state_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  else
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;

revoke all on function public.user_state_stamp() from public, anon, authenticated;

drop trigger if exists user_state_stamp on public.user_state;
create trigger user_state_stamp
  before insert or update on public.user_state
  for each row execute function public.user_state_stamp();

-- ---------------------------------------------------------------------------
-- 2. Skrivning med versionskontroll.
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER så att funktionen fortsätter fungera när direkta skrivningar
-- stängs. Den skriver bara den inloggades egna rader (auth.uid()).
create or replace function public.user_state_put(
  p_key text,
  p_base timestamptz,
  p_value jsonb
)
returns table (applied boolean, stored_value jsonb, stored_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_state%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if p_key is null or p_key = '' then
    raise exception 'INVALID_KEY' using errcode = '22023';
  end if;
  if p_value is null or jsonb_typeof(p_value -> 'v') is distinct from 'string' then
    raise exception 'INVALID_VALUE' using errcode = '22023';
  end if;

  select * into v_row
  from public.user_state s
  where s.user_id = v_user and s.storage_key = p_key
  for update;

  if not found then
    if p_base is not null then
      -- Klienten tror att raden finns, men den har tagits bort.
      return query select false, null::jsonb, null::timestamptz;
      return;
    end if;
    insert into public.user_state (user_id, storage_key, value)
    values (v_user, p_key, p_value)
    on conflict (user_id, storage_key) do nothing;
    -- Gick insättningen inte igenom hann en annan enhet före: returnera dess rad.
    return query
      select found, s.value, s.updated_at
      from public.user_state s
      where s.user_id = v_user and s.storage_key = p_key;
    return;
  end if;

  if p_base is null or v_row.updated_at <> p_base then
    return query select false, v_row.value, v_row.updated_at;
    return;
  end if;

  update public.user_state s
  set value = p_value
  where s.user_id = v_user and s.storage_key = p_key;

  return query
    select true, s.value, s.updated_at
    from public.user_state s
    where s.user_id = v_user and s.storage_key = p_key;
end;
$$;

revoke all on function public.user_state_put(text, timestamptz, jsonb) from public, anon;
grant execute on function public.user_state_put(text, timestamptz, jsonb) to authenticated;

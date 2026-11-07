-- 0039: profilbilder med automatisk kontroll, rapporter och granskning
-- (docs/profilbild/plan.md, Oscar 2026-11-07).
--
-- * Servern (POST /api/profilbild, service-role) laddar upp bilden efter att
--   Claude har godkänt den; är kontrollen nere sparas den som 'pending' och syns
--   bara för ägaren tills teamet godkänt den.
-- * Andra ser bara godkända bilder (vyn public_avatars, läsbar för alla men inte
--   skrivbar). Tre öppna rapporter från olika användare döljer bilden ('hidden').
-- * Granskning för rollerna admin och moderator; varje beslut skrivs till
--   admin_audit_log.
-- * Bucketen avatars är publik för läsning (bilderna visas i forumet, som är
--   publikt) men har inga skrivpolicyer: bara servern laddar upp och tar bort.
--   Sökvägen <user>/<uuid>.webp går inte att gissa.
--
-- Säkerhet (AGENTS.md regel 6): RLS på user_avatars (ägaren läser sin rad) och
-- avatar_reports (ingen läser direkt); inga direkta skrivningar för klienter.
-- Test: ~/.cache/hp-db-test/test-0039.mjs.

-- ---------------------------------------------------------------------------
-- 1. Tabeller och vy
-- ---------------------------------------------------------------------------
create table if not exists public.user_avatars (
  user_id uuid primary key references auth.users (id) on delete cascade,
  path text not null,
  status text not null check (status in ('pending', 'approved', 'hidden', 'rejected')),
  checked_by text not null default 'claude' check (checked_by in ('claude', 'team')),
  reason text,
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);
alter table public.user_avatars enable row level security;
revoke all on public.user_avatars from public, anon, authenticated;
grant select on public.user_avatars to authenticated;
drop policy if exists "user_avatars_select_own" on public.user_avatars;
create policy "user_avatars_select_own" on public.user_avatars
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.avatar_reports (
  avatar_user_id uuid not null references auth.users (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  path text not null,
  reason text not null check (char_length(btrim(reason)) between 3 and 300),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (avatar_user_id, reporter_id, path)
);
alter table public.avatar_reports enable row level security;
revoke all on public.avatar_reports from public, anon, authenticated;

-- Uppladdningsförsök (även underkända), så att servern kan begränsa hur många
-- bilder som skickas till kontrollen per dygn. Bara servern läser och skriver.
create table if not exists public.avatar_upload_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists avatar_upload_attempts_user_idx on public.avatar_upload_attempts (user_id, created_at);
alter table public.avatar_upload_attempts enable row level security;
revoke all on public.avatar_upload_attempts from public, anon, authenticated;

create or replace view public.public_avatars as
  select user_id, path from public.user_avatars where status = 'approved';
revoke all on public.public_avatars from public, anon, authenticated;
grant select on public.public_avatars to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bucket (publik läsning, inga skrivpolicyer)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3. Rapportering
-- ---------------------------------------------------------------------------
create or replace function public.avatar_report(p_user_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_avatar public.user_avatars%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_open integer;
begin
  if v_user is null then raise exception 'Du måste vara inloggad för att rapportera.'; end if;
  if v_user = p_user_id then raise exception 'Du kan inte rapportera din egen bild.'; end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 300 then
    raise exception 'Skriv ett kort skäl (3–300 tecken).';
  end if;
  select * into v_avatar from public.user_avatars where user_id = p_user_id for update;
  if not found or v_avatar.status <> 'approved' then
    return jsonb_build_object('accepted', false);
  end if;

  insert into public.avatar_reports (avatar_user_id, reporter_id, path, reason)
  values (p_user_id, v_user, v_avatar.path, v_reason)
  on conflict do nothing;

  select count(*) into v_open from public.avatar_reports
   where avatar_user_id = p_user_id and path = v_avatar.path and resolved_at is null;
  if v_open >= 3 then
    update public.user_avatars
       set status = 'hidden', updated_at = now()
     where user_id = p_user_id;
  end if;
  return jsonb_build_object('accepted', true, 'hidden', v_open >= 3);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Granskning (admin och moderator)
-- ---------------------------------------------------------------------------
create or replace function public.avatar_can_review()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin') or public.has_role('moderator');
$$;

create or replace function public.avatar_review_queue()
returns table (
  user_id uuid,
  display_name text,
  path text,
  status text,
  reason text,
  updated_at timestamptz,
  reports jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.avatar_can_review() then
    raise exception 'Bara teamet kan granska profilbilder.';
  end if;
  return query
    select a.user_id,
           coalesce(nullif(coalesce(pp.username, pp.display_name), ''), 'Spelare'),
           a.path,
           a.status,
           a.reason,
           a.updated_at,
           coalesce((
             select jsonb_agg(jsonb_build_object('reason', r.reason, 'created_at', r.created_at) order by r.created_at)
               from public.avatar_reports r
              where r.avatar_user_id = a.user_id and r.path = a.path and r.resolved_at is null
           ), '[]'::jsonb)
      from public.user_avatars a
      left join public.player_profiles pp on pp.user_id = a.user_id
     where a.status in ('pending', 'hidden')
     order by a.updated_at;
end;
$$;

-- Godkänn eller underkänn. Underkända bilder tas bort ur bucketen av servern.
create or replace function public.avatar_review(p_user_id uuid, p_decision text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avatar public.user_avatars%rowtype;
begin
  if not public.avatar_can_review() then
    raise exception 'Bara teamet kan granska profilbilder.';
  end if;
  if p_decision not in ('approve', 'reject') then raise exception 'Okänt beslut.'; end if;
  select * into v_avatar from public.user_avatars where user_id = p_user_id for update;
  if not found then raise exception 'Bilden finns inte längre.'; end if;

  update public.user_avatars
     set status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
         checked_by = 'team',
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         updated_at = now()
   where user_id = p_user_id;
  update public.avatar_reports set resolved_at = now()
   where avatar_user_id = p_user_id and path = v_avatar.path and resolved_at is null;

  perform public.audit_log_add(
    case when p_decision = 'approve' then 'avatar_approved' else 'avatar_rejected' end,
    'user_avatar', p_user_id::text,
    jsonb_build_object('path', v_avatar.path, 'previous_status', v_avatar.status)
  );
  return v_avatar.path;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Profilbilder i Alla mot alla (spelarna har inga user_id på klienten)
-- ---------------------------------------------------------------------------
create or replace function public.ama_avatars(p_game_id uuid)
returns table (player_id uuid, path text)
language sql
stable
security definer
set search_path = public
as $$
  select p.player_id, a.path
    from public.ama_players p
    join public.user_avatars a on a.user_id = p.user_id and a.status = 'approved'
   where p.game_id = p_game_id
     and public.ama_is_member(p_game_id);
$$;

-- ---------------------------------------------------------------------------
-- 6. Rättigheter
-- ---------------------------------------------------------------------------
revoke execute on function public.avatar_report(uuid, text) from public, anon;
revoke execute on function public.avatar_can_review() from public, anon;
revoke execute on function public.avatar_review_queue() from public, anon;
revoke execute on function public.avatar_review(uuid, text) from public, anon;
revoke execute on function public.ama_avatars(uuid) from public, anon;
grant execute on function public.avatar_report(uuid, text) to authenticated;
grant execute on function public.avatar_can_review() to authenticated;
grant execute on function public.avatar_review_queue() to authenticated;
grant execute on function public.avatar_review(uuid, text) to authenticated;
grant execute on function public.ama_avatars(uuid) to authenticated;

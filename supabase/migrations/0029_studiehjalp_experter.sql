-- 0029: Studiehjälp, Fas 1 – roller, revisionslogg, funktionsflaggor,
-- expertansökningar med manuell granskning och expertprofiler.
--
-- Underlag: docs/studiehjalp/fas-0-nulagesaudit.md och Oscars beslut
-- 2026-10-28: abonnemangen byggs senare, forumet förblir öppet, granskare
-- styrs av en rolltabell med ägarkontot som första admin, manuell kontroll i
-- piloten (ingen BankID), 18 år och äldre, integritetstexter kommer senare.
-- Därför står Studiehjälps flaggor på 'staff' (syns bara för teamet) tills
-- texterna finns och någon slår på dem i adminvyn.
--
-- Allt här är nytt; inga befintliga tabeller ändras. Skrivningar sker bara via
-- SECURITY DEFINER-funktioner som kontrollerar auth.uid(), roll och flagga.
-- Dokumenten ligger i en privat bucket och nås bara via signerade URL:er som
-- servern skapar (se src/app/studiehjalp/actions.ts).
--
-- Märkena räknas fram ur granskningsbesluten och är medvetet försiktiga:
--   * HP-resultat: 'document' = officiellt resultatbesked granskat (dokument),
--     'live_portal' = granskaren såg resultatet i den officiella tjänsten.
--     Ingen märkning påstår kontroll "via myndighet".
--   * "Legitimerad lärare" kräver kontroll mot Skolverkets register
--     ('official_register'); ett uppladdat dokument räcker inte.
--   * Identitet är en egen signal (ID-handling granskad).
--
-- Efter säkerhetsgranskningen (2026-10-28): underlag har en högsta
-- lagringstid (90 dagar, 30 efter beslut) och gallras även av ett schemalagt
-- jobb; ansökan kan dras tillbaka (samtycket återkallas) och då raderas
-- underlagen direkt; granskaren måste ha öppnat underlagen innan ansökan kan
-- godkännas; experter har ett eget publikt id (inte konto-id:t).

-- ---------------------------------------------------------------------------
-- Roller
-- ---------------------------------------------------------------------------

create table public.staff_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in (
    'admin', 'verify_expert', 'view_sensitive_document', 'moderator', 'finance_admin', 'payout_admin'
  )),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.staff_roles enable row level security;
create policy "staff_roles_select_own" on public.staff_roles
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.staff_roles from anon, authenticated;
grant select on public.staff_roles to authenticated;

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_roles r where r.user_id = auth.uid() and r.role = p_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff_roles r where r.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Revisionslogg (bara tillägg; läses av admin via funktion)
-- ---------------------------------------------------------------------------

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;

create or replace function public.audit_log_add(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- Funktionsflaggor: 'off', 'staff' (bara personer med en roll) eller 'on'
-- ---------------------------------------------------------------------------

create table public.feature_flags (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  mode text not null default 'off' check (mode in ('off', 'staff', 'on')),
  note text not null default '' check (char_length(note) <= 300),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
create policy "feature_flags_select" on public.feature_flags
  for select to anon, authenticated using (true);
revoke all on public.feature_flags from anon, authenticated;
grant select (key, mode) on public.feature_flags to anon, authenticated;

insert into public.feature_flags (key, mode, note) values
  ('studiehjalp', 'staff', 'Fliken Studiehjälp i menyn och dess sidor.'),
  ('experts_apply', 'staff', 'Expertansökan och uppladdning av underlag. Slå inte på för alla förrän integritetspolicy och villkor finns.'),
  ('experts_public', 'staff', 'Publika expertprofiler och sök.')
on conflict (key) do nothing;

create or replace function public.flag_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select f.mode = 'on' or (f.mode = 'staff' and public.is_staff())
       from public.feature_flags f where f.key = p_key),
    false
  );
$$;

-- Det klienten behöver för att visa fliken: flaggor och egna roller.
create or replace function public.studiehjalp_access()
returns table (flags jsonb, roles text[])
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (select jsonb_object_agg(f.key, f.mode = 'on' or (f.mode = 'staff' and public.is_staff()))
         from public.feature_flags f),
      '{}'::jsonb
    ),
    coalesce(
      (select array_agg(r.role order by r.role) from public.staff_roles r where r.user_id = auth.uid()),
      '{}'::text[]
    );
$$;

-- ---------------------------------------------------------------------------
-- Expertansökningar, dokument och granskningsbeslut
-- ---------------------------------------------------------------------------

create table public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('hp', 'teacher')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'needs_completion', 'approved', 'rejected', 'blocked', 'withdrawn')),
  legal_name text not null default '' check (char_length(legal_name) <= 120),
  claimed_total numeric(3, 2) check (claimed_total is null or claimed_total between 0 and 2),
  claimed_test text not null default '' check (char_length(claimed_test) <= 60),
  teacher_subjects text not null default '' check (char_length(teacher_subjects) <= 300),
  message text not null default '' check (char_length(message) <= 2000),
  adult_confirmed boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  decided_at timestamptz
);

-- Högst en öppen ansökan per väg och person.
create unique index expert_applications_one_open_idx
  on public.expert_applications (user_id, track)
  where status in ('draft', 'submitted', 'needs_completion');
create index expert_applications_status_idx on public.expert_applications (status, submitted_at);

create table public.expert_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('hp_result', 'teacher_license', 'identity', 'other')),
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  status text not null default 'pending' check (status in ('pending', 'uploaded')),
  created_at timestamptz not null default now(),
  delete_after timestamptz,
  deleted_at timestamptz
);

create index expert_documents_application_idx on public.expert_documents (application_id);
create index expert_documents_retention_idx on public.expert_documents (delete_after) where deleted_at is null;

create table public.expert_verification_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.expert_applications (id) on delete cascade,
  reviewer_id uuid references auth.users (id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected', 'needs_completion', 'blocked')),
  check_type text check (check_type in ('document', 'live_portal', 'official_register')),
  verified_total numeric(3, 2) check (verified_total is null or verified_total between 0 and 2),
  verified_test text not null default '' check (char_length(verified_test) <= 60),
  verified_subjects text not null default '' check (char_length(verified_subjects) <= 300),
  identity_checked boolean not null default false,
  source_ref text not null default '' check (char_length(source_ref) <= 200),
  reason text not null check (char_length(reason) between 3 and 2000),
  created_at timestamptz not null default now()
);

create index expert_verification_reviews_application_idx
  on public.expert_verification_reviews (application_id, created_at desc);

alter table public.expert_applications enable row level security;
alter table public.expert_documents enable row level security;
alter table public.expert_verification_reviews enable row level security;

create policy "expert_applications_select_own" on public.expert_applications
  for select to authenticated using (auth.uid() = user_id);
create policy "expert_documents_select_own" on public.expert_documents
  for select to authenticated using (auth.uid() = user_id);
-- Granskningsbesluten nås bara via funktioner (granskarens id ska inte visas).

revoke all on public.expert_applications from anon, authenticated;
revoke all on public.expert_documents from anon, authenticated;
revoke all on public.expert_verification_reviews from anon, authenticated;
grant select on public.expert_applications to authenticated;
grant select on public.expert_documents to authenticated;

-- Privat bucket för underlagen. Inga policies på storage.objects: bara
-- servern (service role) kan skapa signerade upp- och nedladdnings-URL:er.
-- En bred policy på storage.objects (utan villkor på bucket_id) skulle ge
-- åtkomst även hit, så då avbryts migrationen hellre (jfr 0017).
do $$
declare
  v_bad text;
begin
  select string_agg(p.policyname, ', ')
    into v_bad
    from pg_policies p
   where p.schemaname = 'storage' and p.tablename = 'objects'
     and (
       (coalesce(p.qual, '') not like '%bucket_id%' and coalesce(p.with_check, '') not like '%bucket_id%')
       or coalesce(p.qual, '') like '%expert-documents%'
       or coalesce(p.with_check, '') like '%expert-documents%'
     );
  if v_bad is not null then
    raise exception 'STORAGE_POLICY_TOO_BROAD: %', v_bad;
  end if;
end;
$$;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expert-documents', 'expert-documents', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Starta (eller återuppta) en ansökan.
create or replace function public.expert_application_start(p_track text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not public.flag_enabled('experts_apply') then
    raise exception 'NOT_AVAILABLE';
  end if;
  if coalesce(p_track, '') not in ('hp', 'teacher') then
    raise exception 'INVALID_TRACK';
  end if;
  if exists (select 1 from public.expert_applications a where a.user_id = v_uid and a.status = 'blocked') then
    raise exception 'BLOCKED';
  end if;

  select a.id into v_id
    from public.expert_applications a
   where a.user_id = v_uid and a.track = p_track
     and a.status in ('draft', 'submitted', 'needs_completion');
  if v_id is not null then
    return v_id;
  end if;

  if exists (
    select 1 from public.expert_applications a
     where a.user_id = v_uid and a.track = p_track and a.status = 'approved'
  ) then
    raise exception 'ALREADY_APPROVED';
  end if;
  if (select count(*) from public.expert_applications a
       where a.user_id = v_uid and a.created_at > now() - interval '30 days') >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.expert_applications (user_id, track)
  values (v_uid, p_track)
  returning id into v_id;
  return v_id;
end;
$$;

-- Hämtar en egen ansökan som går att ändra, annars fel.
create or replace function public.expert_application_editable(p_application_id uuid)
returns public.expert_applications
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not public.flag_enabled('experts_apply') then
    raise exception 'NOT_AVAILABLE';
  end if;
  select * into v_app from public.expert_applications a
   where a.id = p_application_id and a.user_id = auth.uid();
  if v_app.id is null then
    raise exception 'NOT_FOUND';
  end if;
  if v_app.status not in ('draft', 'needs_completion') then
    raise exception 'NOT_EDITABLE';
  end if;
  return v_app;
end;
$$;

create or replace function public.expert_application_save(
  p_application_id uuid,
  p_legal_name text,
  p_claimed_total numeric,
  p_claimed_test text,
  p_teacher_subjects text,
  p_message text,
  p_adult_confirmed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications := public.expert_application_editable(p_application_id);
begin
  update public.expert_applications a
     set legal_name = btrim(coalesce(p_legal_name, '')),
         claimed_total = case when a.track = 'hp' then p_claimed_total else null end,
         claimed_test = case when a.track = 'hp' then btrim(coalesce(p_claimed_test, '')) else '' end,
         teacher_subjects = case when a.track = 'teacher' then btrim(coalesce(p_teacher_subjects, '')) else '' end,
         message = btrim(coalesce(p_message, '')),
         adult_confirmed = coalesce(p_adult_confirmed, false),
         updated_at = now()
   where a.id = v_app.id;
end;
$$;

create or replace function public.expert_application_submit(p_application_id uuid, p_consent boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications := public.expert_application_editable(p_application_id);
  v_required text := case when v_app.track = 'hp' then 'hp_result' else 'teacher_license' end;
begin
  if not coalesce(p_consent, false) then
    raise exception 'CONSENT_REQUIRED';
  end if;
  if not v_app.adult_confirmed then
    raise exception 'ADULT_REQUIRED';
  end if;
  if char_length(v_app.legal_name) < 2 then
    raise exception 'NAME_REQUIRED';
  end if;
  if v_app.track = 'hp' then
    if v_app.claimed_total is null or v_app.claimed_test = '' then
      raise exception 'HP_DETAILS_REQUIRED';
    end if;
    if v_app.claimed_total < 1.20 then
      raise exception 'HP_BELOW_THRESHOLD';
    end if;
  elsif v_app.teacher_subjects = '' then
    raise exception 'TEACHER_DETAILS_REQUIRED';
  end if;
  if not exists (
       select 1 from public.expert_documents d
        where d.application_id = v_app.id and d.kind = v_required
          and d.status = 'uploaded' and d.deleted_at is null)
     or not exists (
       select 1 from public.expert_documents d
        where d.application_id = v_app.id and d.kind = 'identity'
          and d.status = 'uploaded' and d.deleted_at is null) then
    raise exception 'MISSING_DOCUMENTS';
  end if;

  update public.expert_applications a
     set status = 'submitted',
         submitted_at = now(),
         consent_at = now(),
         updated_at = now()
   where a.id = v_app.id;
end;
$$;

-- Egna ansökningar med dokument och senaste beslut (utan granskarens id).
create or replace function public.expert_application_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'track', a.track,
    'status', a.status,
    'legal_name', a.legal_name,
    'claimed_total', a.claimed_total,
    'claimed_test', a.claimed_test,
    'teacher_subjects', a.teacher_subjects,
    'message', a.message,
    'adult_confirmed', a.adult_confirmed,
    'created_at', a.created_at,
    'submitted_at', a.submitted_at,
    'decided_at', a.decided_at,
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'kind', d.kind, 'file_name', d.file_name, 'mime', d.mime,
        'size_bytes', d.size_bytes, 'created_at', d.created_at,
        'deleted', d.deleted_at is not null
      ) order by d.created_at)
      from public.expert_documents d
      where d.application_id = a.id and d.status = 'uploaded'
    ), '[]'::jsonb),
    'last_decision', (
      select jsonb_build_object('decision', r.decision, 'reason', r.reason, 'created_at', r.created_at)
        from public.expert_verification_reviews r
       where r.application_id = a.id
       order by r.created_at desc
       limit 1
    )
  ) order by a.created_at desc), '[]'::jsonb)
  from public.expert_applications a
  where a.user_id = auth.uid();
$$;

-- Registrerar ett dokument innan uppladdningen. Servern skapar sedan en
-- signerad upload-URL för sökvägen och bekräftar filen när den har kontrollerat
-- innehållet (status 'uploaded').
create or replace function public.expert_document_begin(
  p_application_id uuid,
  p_kind text,
  p_file_name text,
  p_mime text,
  p_size integer
)
returns table (id uuid, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications := public.expert_application_editable(p_application_id);
  v_id uuid := gen_random_uuid();
  v_ext text;
  v_name text;
  v_path text;
begin
  if p_kind is null
     or p_kind not in ('identity', 'other', case when v_app.track = 'hp' then 'hp_result' else 'teacher_license' end) then
    raise exception 'INVALID_KIND';
  end if;
  v_ext := case p_mime
    when 'application/pdf' then 'pdf'
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
  end;
  if v_ext is null then
    raise exception 'INVALID_FILE_TYPE';
  end if;
  if p_size is null or p_size < 1 or p_size > 10485760 then
    raise exception 'INVALID_FILE_SIZE';
  end if;
  -- Samtidiga anrop för samma ansökan körs i tur och ordning, så att gränsen håller.
  perform 1 from public.expert_applications a where a.id = v_app.id for update;
  if (select count(*) from public.expert_documents d
       where d.application_id = v_app.id and d.deleted_at is null) >= 8 then
    raise exception 'TOO_MANY_DOCUMENTS';
  end if;
  -- Alla försök räknas, även borttagna och avvisade, så att uppladdningar inte
  -- kan upprepas i det oändliga.
  if (select count(*) from public.expert_documents d
       where d.user_id = v_app.user_id and d.created_at > now() - interval '1 day') >= 30 then
    raise exception 'RATE_LIMITED';
  end if;

  v_name := left(btrim(regexp_replace(coalesce(p_file_name, ''), '[^A-Za-z0-9ÅÄÖåäö._ -]', '_', 'g')), 120);
  if v_name = '' then
    v_name := 'dokument.' || v_ext;
  end if;
  v_path := v_app.user_id::text || '/' || v_app.id::text || '/' || v_id::text || '.' || v_ext;

  -- Högsta lagringstid redan från början; ett beslut kortar den till 30 dagar.
  insert into public.expert_documents (
    id, application_id, user_id, kind, storage_path, file_name, mime, size_bytes, delete_after
  ) values (
    v_id, v_app.id, v_app.user_id, p_kind, v_path, v_name, p_mime, p_size, now() + interval '90 days'
  );

  return query select v_id, v_path;
end;
$$;

-- Tar bort ett eget dokument ur en ändringsbar ansökan; servern raderar filen.
create or replace function public.expert_document_remove(p_document_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.expert_documents;
begin
  select * into v_doc from public.expert_documents d
   where d.id = p_document_id and d.user_id = auth.uid() and d.deleted_at is null;
  if v_doc.id is null then
    raise exception 'NOT_FOUND';
  end if;
  -- Kräver inte flaggan: den som har laddat upp något ska alltid kunna ta bort det.
  if not exists (
    select 1 from public.expert_applications a
     where a.id = v_doc.application_id and a.status in ('draft', 'needs_completion')
  ) then
    raise exception 'NOT_EDITABLE';
  end if;
  update public.expert_documents d set deleted_at = now() where d.id = v_doc.id;
  return v_doc.storage_path;
end;
$$;

-- Det servern behöver för att kontrollera en uppladdad fil: bara för eget,
-- obekräftat underlag i en ansökan som fortfarande går att ändra.
create or replace function public.expert_document_confirmable(p_document_id uuid)
returns table (storage_path text, mime text, size_bytes integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_doc public.expert_documents;
begin
  select * into v_doc from public.expert_documents d
   where d.id = p_document_id and d.user_id = auth.uid()
     and d.status = 'pending' and d.deleted_at is null;
  if v_doc.id is null then
    raise exception 'NOT_FOUND';
  end if;
  perform public.expert_application_editable(v_doc.application_id);
  return query select v_doc.storage_path, v_doc.mime, v_doc.size_bytes;
end;
$$;

-- Drar tillbaka en egen ansökan (och samtycket). Underlagen markeras som
-- raderade och servern tar bort filerna direkt. Kräver inte flaggan.
create or replace function public.expert_application_withdraw(p_application_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications;
  v_paths text[];
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  select * into v_app from public.expert_applications a
   where a.id = p_application_id and a.user_id = auth.uid()
   for update;
  if v_app.id is null then
    raise exception 'NOT_FOUND';
  end if;
  if v_app.status not in ('draft', 'submitted', 'needs_completion', 'approved') then
    raise exception 'NOT_WITHDRAWABLE';
  end if;

  update public.expert_applications a
     set status = 'withdrawn', updated_at = now()
   where a.id = v_app.id;

  with gone as (
    update public.expert_documents d
       set deleted_at = now()
     where d.application_id = v_app.id and d.deleted_at is null
    returning d.storage_path
  )
  select coalesce(array_agg(storage_path), '{}') into v_paths from gone;

  if not exists (
    select 1 from public.expert_applications a
     where a.user_id = v_app.user_id and a.status = 'approved'
  ) then
    update public.expert_profiles p set published = false, updated_at = now()
     where p.user_id = v_app.user_id and p.published;
  end if;

  perform public.audit_log_add('application_withdrawn', 'expert_application', v_app.id::text,
                               jsonb_build_object('previous_status', v_app.status));
  return v_paths;
end;
$$;

-- ---------------------------------------------------------------------------
-- Granskning (roll verify_expert) och dokumentvisning (view_sensitive_document)
-- ---------------------------------------------------------------------------

create or replace function public.expert_queue(p_status text default 'submitted')
returns table (
  id uuid,
  user_id uuid,
  track text,
  status text,
  display_name text,
  legal_name text,
  claimed_total numeric,
  claimed_test text,
  teacher_subjects text,
  submitted_at timestamptz,
  decided_at timestamptz,
  document_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role('verify_expert') then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select a.id, a.user_id, a.track, a.status,
           coalesce(pp.display_name, 'Spelare')::text,
           a.legal_name, a.claimed_total, a.claimed_test, a.teacher_subjects,
           a.submitted_at, a.decided_at,
           (select count(*)::integer from public.expert_documents d
             where d.application_id = a.id and d.status = 'uploaded' and d.deleted_at is null)
      from public.expert_applications a
      left join public.player_profiles pp on pp.user_id = a.user_id
     where (coalesce(p_status, 'submitted') = 'all' and a.status <> 'draft')
        or a.status = coalesce(p_status, 'submitted')
     order by coalesce(a.submitted_at, a.created_at) asc
     limit 200;
end;
$$;

create or replace function public.expert_application_admin(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.has_role('verify_expert') then
    raise exception 'FORBIDDEN';
  end if;
  select jsonb_build_object(
    'id', a.id,
    'user_id', a.user_id,
    'track', a.track,
    'status', a.status,
    'display_name', coalesce(pp.display_name, 'Spelare'),
    'email', u.email,
    'legal_name', a.legal_name,
    'claimed_total', a.claimed_total,
    'claimed_test', a.claimed_test,
    'teacher_subjects', a.teacher_subjects,
    'message', a.message,
    'adult_confirmed', a.adult_confirmed,
    'consent_at', a.consent_at,
    'created_at', a.created_at,
    'submitted_at', a.submitted_at,
    'decided_at', a.decided_at,
    'is_own', a.user_id = auth.uid(),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'kind', d.kind, 'file_name', d.file_name, 'mime', d.mime,
        'size_bytes', d.size_bytes, 'created_at', d.created_at,
        'delete_after', d.delete_after, 'deleted_at', d.deleted_at
      ) order by d.created_at)
      from public.expert_documents d
      where d.application_id = a.id and d.status = 'uploaded'
    ), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'decision', r.decision, 'check_type', r.check_type,
        'verified_total', r.verified_total, 'verified_test', r.verified_test,
        'verified_subjects', r.verified_subjects, 'identity_checked', r.identity_checked,
        'source_ref', r.source_ref, 'reason', r.reason, 'created_at', r.created_at,
        'reviewer_name', coalesce(rp.display_name, 'Granskare')
      ) order by r.created_at desc)
      from public.expert_verification_reviews r
      left join public.player_profiles rp on rp.user_id = r.reviewer_id
      where r.application_id = a.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.expert_applications a
  join auth.users u on u.id = a.user_id
  left join public.player_profiles pp on pp.user_id = a.user_id
  where a.id = p_application_id and a.status <> 'draft';

  if v_result is null then
    raise exception 'NOT_FOUND';
  end if;
  -- Personuppgifterna i ansökan (namn, e-post) har visats: logga det.
  perform public.audit_log_add('application_viewed', 'expert_application', p_application_id::text, '{}'::jsonb);
  return v_result;
end;
$$;

create or replace function public.expert_application_decide(
  p_application_id uuid,
  p_decision text,
  p_check_type text,
  p_verified_total numeric,
  p_verified_test text,
  p_verified_subjects text,
  p_identity_checked boolean,
  p_source_ref text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.expert_applications;
  v_check text := nullif(btrim(coalesce(p_check_type, '')), '');
  v_test text := btrim(coalesce(p_verified_test, ''));
  v_subjects text := btrim(coalesce(p_verified_subjects, ''));
  v_source text := btrim(coalesce(p_source_ref, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_review uuid;
begin
  if not public.has_role('verify_expert') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_app from public.expert_applications a
   where a.id = p_application_id
   for update;
  if v_app.id is null or v_app.status = 'draft' then
    raise exception 'NOT_FOUND';
  end if;
  if v_app.user_id = auth.uid() then
    raise exception 'OWN_APPLICATION';
  end if;
  if coalesce(p_decision, '') not in ('approved', 'rejected', 'needs_completion', 'blocked') then
    raise exception 'INVALID_DECISION';
  end if;
  if char_length(v_reason) < 3 then
    raise exception 'REASON_REQUIRED';
  end if;

  -- Tillåtna övergångar: inskickad ansökan får alla beslut; en godkänd kan
  -- återkallas (avslag eller spärr), t.ex. vid återkallad legitimation.
  if not (
    v_app.status = 'submitted'
    or (v_app.status = 'approved' and p_decision in ('rejected', 'blocked'))
  ) then
    raise exception 'INVALID_TRANSITION';
  end if;

  if p_decision = 'approved' then
    if not coalesce(p_identity_checked, false) then
      raise exception 'IDENTITY_REQUIRED';
    end if;
    if v_app.track = 'hp' then
      if v_check is null or v_check not in ('document', 'live_portal') then
        raise exception 'INVALID_CHECK_TYPE';
      end if;
      if p_verified_total is null or v_test = '' then
        raise exception 'HP_DETAILS_REQUIRED';
      end if;
      if p_verified_total < 1.20 then
        raise exception 'HP_BELOW_THRESHOLD';
      end if;
    else
      if v_check is distinct from 'official_register' then
        raise exception 'TEACHER_REGISTER_REQUIRED';
      end if;
      if v_subjects = '' or v_source = '' then
        raise exception 'TEACHER_DETAILS_REQUIRED';
      end if;
    end if;
    -- Granskaren ska själv ha öppnat det obligatoriska underlaget och ID-handlingen.
    if exists (
      select 1
        from unnest(array['identity', case when v_app.track = 'hp' then 'hp_result' else 'teacher_license' end]) k(kind)
       where not exists (
         select 1
           from public.admin_audit_log l
           join public.expert_documents d on d.id::text = l.target_id
          where l.action = 'document_viewed' and l.actor_id = auth.uid()
            and d.application_id = v_app.id and d.kind = k.kind
       )
    ) then
      raise exception 'DOCUMENTS_NOT_VIEWED';
    end if;
  end if;

  insert into public.expert_verification_reviews (
    application_id, reviewer_id, decision, check_type, verified_total, verified_test,
    verified_subjects, identity_checked, source_ref, reason
  ) values (
    v_app.id, auth.uid(), p_decision,
    case when p_decision = 'approved' then v_check end,
    case when p_decision = 'approved' and v_app.track = 'hp' then p_verified_total end,
    case when p_decision = 'approved' and v_app.track = 'hp' then v_test else '' end,
    case when p_decision = 'approved' and v_app.track = 'teacher' then v_subjects else '' end,
    p_decision = 'approved' and coalesce(p_identity_checked, false),
    v_source,
    v_reason
  )
  returning id into v_review;

  update public.expert_applications a
     set status = p_decision,
         decided_at = case when p_decision = 'needs_completion' then a.decided_at else now() end,
         updated_at = now()
   where a.id = v_app.id;

  -- Underlagen sparas bara kort efter beslut (högst 30 dagar).
  if p_decision in ('approved', 'rejected', 'blocked') then
    update public.expert_documents d
       set delete_after = least(coalesce(d.delete_after, now() + interval '30 days'), now() + interval '30 days')
     where d.application_id = v_app.id and d.deleted_at is null;
  end if;

  -- En återkallad expert syns inte längre.
  if p_decision in ('rejected', 'blocked') and not exists (
    select 1 from public.expert_applications a
     where a.user_id = v_app.user_id and a.status = 'approved' and a.id <> v_app.id
  ) then
    update public.expert_profiles p set published = false, updated_at = now()
     where p.user_id = v_app.user_id and p.published;
  end if;

  perform public.audit_log_add(
    'expert_decision', 'expert_application', v_app.id::text,
    jsonb_build_object(
      'decision', p_decision, 'previous_status', v_app.status, 'track', v_app.track,
      'check_type', v_check, 'review_id', v_review
    )
  );
end;
$$;

-- Ger servern sökvägen till ett dokument och loggar att det visades.
create or replace function public.expert_document_open(p_document_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.expert_documents;
begin
  if not public.has_role('view_sensitive_document') then
    raise exception 'FORBIDDEN';
  end if;
  select d.* into v_doc
    from public.expert_documents d
    join public.expert_applications a on a.id = d.application_id
   where d.id = p_document_id and d.status = 'uploaded' and d.deleted_at is null
     and a.status <> 'draft' and a.consent_at is not null;
  if v_doc.id is null then
    raise exception 'NOT_FOUND';
  end if;
  perform public.audit_log_add(
    'document_viewed', 'expert_document', v_doc.id::text,
    jsonb_build_object('application_id', v_doc.application_id, 'kind', v_doc.kind)
  );
  return v_doc.storage_path;
end;
$$;

-- Gallring: dokument vars lagringstid har gått ut, och uppladdningar som aldrig
-- bekräftades.
create or replace function public.expert_documents_due(p_limit integer default 100)
returns table (id uuid, storage_path text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (auth.role() = 'service_role' or public.has_role('verify_expert') or public.has_role('admin')) then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select d.id, d.storage_path
      from public.expert_documents d
     where d.deleted_at is null
       and (d.delete_after <= now()
            or (d.status = 'pending' and d.created_at < now() - interval '1 day'))
     order by d.created_at
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

create or replace function public.expert_documents_mark_deleted(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not (auth.role() = 'service_role' or public.has_role('verify_expert') or public.has_role('admin')) then
    raise exception 'FORBIDDEN';
  end if;
  update public.expert_documents d
     set deleted_at = now()
   where d.id = any(coalesce(p_ids, '{}'::uuid[]))
     and d.deleted_at is null
     and (d.delete_after <= now()
          or (d.status = 'pending' and d.created_at < now() - interval '1 day'));
  get diagnostics v_count = row_count;
  if v_count > 0 then
    perform public.audit_log_add('documents_purged', 'expert_document', null,
                                 jsonb_build_object('count', v_count));
  end if;
  return v_count;
end;
$$;

-- Filer i bucketen som saknar en levande rad (t.ex. en uppladdning via en
-- signerad länk efter att raden togs bort). Bara för det schemalagda jobbet.
create or replace function public.expert_storage_orphans(p_limit integer default 200)
returns table (name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.name::text
      from storage.objects o
     where o.bucket_id = 'expert-documents'
       and o.created_at < now() - interval '3 hours'
       and not exists (
         select 1 from public.expert_documents d
          where d.storage_path = o.name and d.deleted_at is null
       )
     order by o.created_at
     limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end;
$$;

-- ---------------------------------------------------------------------------
-- Expertprofiler
-- ---------------------------------------------------------------------------

create table public.expert_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Publikt id i länkar och sök, så att profilen inte kan kopplas till kontots
  -- id i forumet och topplistorna.
  public_id uuid not null unique default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 60),
  headline text not null default '' check (char_length(headline) <= 120),
  bio text not null default '' check (char_length(bio) <= 3000),
  method text not null default '' check (char_length(method) <= 2000),
  experience text not null default '' check (char_length(experience) <= 2000),
  subtests text[] not null default '{}'
    check (subtests <@ array['kva', 'nog', 'xyz', 'dtk', 'ord', 'las', 'mek', 'elf']::text[]
           and cardinality(subtests) <= 8),
  languages text[] not null default '{svenska}'
    check (coalesce(array_length(languages, 1), 0) <= 8),
  formats text[] not null default '{online}'
    check (formats <@ array['online', 'fysiskt']::text[] and cardinality(formats) <= 2),
  city text not null default '' check (char_length(city) <= 60),
  price_30 integer check (price_30 is null or price_30 between 50 and 10000),
  price_60 integer check (price_60 is null or price_60 between 50 and 10000),
  price_90 integer check (price_90 is null or price_90 between 50 and 10000),
  free_consultation boolean not null default false,
  show_hp_score boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expert_profiles enable row level security;
create policy "expert_profiles_select_own" on public.expert_profiles
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.expert_profiles from anon, authenticated;
grant select on public.expert_profiles to authenticated;

create or replace function public.expert_is_approved(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.expert_applications a
     where a.user_id = p_user_id and a.status = 'approved'
  );
$$;

create or replace function public.expert_profile_mine()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.expert_profiles p where p.user_id = auth.uid()),
    'approved', public.expert_is_approved(auth.uid())
  );
$$;

create or replace function public.expert_profile_save(
  p_display_name text,
  p_headline text,
  p_bio text,
  p_method text,
  p_experience text,
  p_subtests text[],
  p_languages text[],
  p_formats text[],
  p_city text,
  p_price_30 integer,
  p_price_60 integer,
  p_price_90 integer,
  p_free_consultation boolean,
  p_show_hp_score boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_languages text[];
  v_subtests text[] := (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_subtests, '{}'::text[])) x);
  v_formats text[] := (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_formats, '{}'::text[])) x);
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not public.flag_enabled('experts_apply') then
    raise exception 'NOT_AVAILABLE';
  end if;
  if exists (select 1 from public.expert_applications a where a.user_id = v_uid and a.status = 'blocked') then
    raise exception 'BLOCKED';
  end if;
  if not exists (select 1 from public.expert_applications a where a.user_id = v_uid) then
    raise exception 'NO_APPLICATION';
  end if;

  select coalesce(array_agg(l), '{}')
    into v_languages
    from (
      select distinct btrim(x) as l
        from unnest(coalesce(p_languages, '{}'::text[])) as x
       where btrim(x) <> ''
    ) s;
  if exists (select 1 from unnest(v_languages) l where char_length(l) > 30) then
    raise exception 'INVALID_LANGUAGE';
  end if;

  insert into public.expert_profiles as p (
    user_id, display_name, headline, bio, method, experience, subtests, languages,
    formats, city, price_30, price_60, price_90, free_consultation, show_hp_score
  ) values (
    v_uid, btrim(coalesce(p_display_name, '')), btrim(coalesce(p_headline, '')),
    btrim(coalesce(p_bio, '')), btrim(coalesce(p_method, '')), btrim(coalesce(p_experience, '')),
    v_subtests, v_languages, v_formats,
    btrim(coalesce(p_city, '')), p_price_30, p_price_60, p_price_90,
    coalesce(p_free_consultation, false), coalesce(p_show_hp_score, true)
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        headline = excluded.headline,
        bio = excluded.bio,
        method = excluded.method,
        experience = excluded.experience,
        subtests = excluded.subtests,
        languages = excluded.languages,
        formats = excluded.formats,
        city = excluded.city,
        price_30 = excluded.price_30,
        price_60 = excluded.price_60,
        price_90 = excluded.price_90,
        free_consultation = excluded.free_consultation,
        show_hp_score = excluded.show_hp_score,
        updated_at = now();
end;
$$;

create or replace function public.expert_profile_publish(p_published boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.expert_profiles;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  select * into v_profile from public.expert_profiles p where p.user_id = auth.uid();
  if v_profile.user_id is null then
    raise exception 'NO_PROFILE';
  end if;
  if coalesce(p_published, false) then
    if not public.flag_enabled('experts_apply') then
      raise exception 'NOT_AVAILABLE';
    end if;
    if not public.expert_is_approved(auth.uid()) then
      raise exception 'NOT_APPROVED';
    end if;
    if cardinality(v_profile.subtests) = 0 or cardinality(v_profile.formats) = 0
       or char_length(v_profile.headline) < 3 or char_length(v_profile.bio) < 20 then
      raise exception 'PROFILE_INCOMPLETE';
    end if;
  end if;
  update public.expert_profiles p
     set published = coalesce(p_published, false), updated_at = now()
   where p.user_id = auth.uid();
end;
$$;

-- Publik vy: bara godkända experter med publicerad profil, och märken som
-- räknas fram ur granskningsbesluten. Egen profil kan alltid förhandsvisas.
create or replace function public.expert_directory(p_public_id uuid default null)
returns table (
  public_id uuid,
  is_own boolean,
  display_name text,
  headline text,
  bio text,
  method text,
  experience text,
  subtests text[],
  languages text[],
  formats text[],
  city text,
  price_30 integer,
  price_60 integer,
  price_90 integer,
  free_consultation boolean,
  published boolean,
  hp_check text,
  hp_total numeric,
  hp_test text,
  hp_checked_at timestamptz,
  teacher_verified boolean,
  teacher_subjects text,
  teacher_checked_at timestamptz,
  identity_checked boolean,
  verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.public_id, p.user_id = auth.uid(), p.display_name, p.headline, p.bio, p.method, p.experience,
         p.subtests, p.languages, p.formats, p.city,
         p.price_30, p.price_60, p.price_90, p.free_consultation, p.published,
         hp.check_type,
         case when p.show_hp_score then hp.verified_total end,
         case when p.show_hp_score then hp.verified_test end,
         hp.created_at,
         coalesce(t.check_type = 'official_register', false),
         coalesce(t.verified_subjects, ''),
         t.created_at,
         coalesce(idc.checked, false),
         greatest(hp.created_at, t.created_at)
    from public.expert_profiles p
    left join lateral (
      select r.check_type, r.verified_total, r.verified_test, r.created_at
        from public.expert_applications a
        join public.expert_verification_reviews r on r.application_id = a.id
       where a.user_id = p.user_id and a.track = 'hp' and a.status = 'approved'
         and r.decision = 'approved'
       order by r.created_at desc
       limit 1
    ) hp on true
    left join lateral (
      select r.check_type, r.verified_subjects, r.created_at
        from public.expert_applications a
        join public.expert_verification_reviews r on r.application_id = a.id
       where a.user_id = p.user_id and a.track = 'teacher' and a.status = 'approved'
         and r.decision = 'approved'
       order by r.created_at desc
       limit 1
    ) t on true
    left join lateral (
      select bool_or(r.identity_checked) as checked
        from public.expert_applications a
        join public.expert_verification_reviews r on r.application_id = a.id
       where a.user_id = p.user_id and a.status = 'approved' and r.decision = 'approved'
    ) idc on true
   where (p_public_id is null or p.public_id = p_public_id)
     and (
       (public.flag_enabled('experts_public') and p.published and public.expert_is_approved(p.user_id))
       or (p_public_id is not null and p.user_id = auth.uid())
     );
$$;

-- Sök bland experterna. Standardordningen roteras varje dag så att nya
-- experter syns; ingen kan betala för en bättre plats.
create or replace function public.expert_search(
  p_subtest text default null,
  p_format text default null,
  p_language text default null,
  p_max_price integer default null,
  p_min_hp numeric default null,
  p_query text default null,
  p_sort text default 'rotation',
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  public_id uuid,
  display_name text,
  headline text,
  subtests text[],
  languages text[],
  formats text[],
  city text,
  price_60 integer,
  free_consultation boolean,
  hp_check text,
  hp_total numeric,
  hp_test text,
  teacher_verified boolean,
  teacher_subjects text,
  identity_checked boolean,
  verified_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    -- Fritexten begränsas och % och _ tolkas bokstavligt.
    select '%' || replace(replace(replace(left(btrim(coalesce(p_query, '')), 100), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern,
           left(btrim(coalesce(p_query, '')), 100) = '' as empty
  ),
  d as (
    select e.*
      from public.expert_directory(null) e, q
     where e.published
       and (p_subtest is null or p_subtest = any(e.subtests))
       and (p_format is null or p_format = any(e.formats))
       and (p_language is null or exists (
             select 1 from unnest(e.languages) l where lower(l) = lower(left(p_language, 30))))
       and (p_max_price is null or (e.price_60 is not null and e.price_60 <= p_max_price))
       and (p_min_hp is null or (e.hp_total is not null and e.hp_total >= p_min_hp))
       and (q.empty
            or e.display_name ilike q.pattern escape '\'
            or e.headline ilike q.pattern escape '\'
            or e.bio ilike q.pattern escape '\')
  )
  select d.public_id, d.display_name, d.headline, d.subtests, d.languages, d.formats, d.city,
         d.price_60, d.free_consultation, d.hp_check, d.hp_total, d.hp_test,
         d.teacher_verified, d.teacher_subjects, d.identity_checked, d.verified_at,
         count(*) over ()
    from d
   order by
     case when p_sort = 'price' then d.price_60 end asc nulls last,
     case when p_sort = 'newest' then d.verified_at end desc nulls last,
     md5(d.public_id::text || current_date::text)
   limit least(greatest(coalesce(p_limit, 30), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- Administration (roll admin)
-- ---------------------------------------------------------------------------

create or replace function public.admin_staff_list()
returns table (user_id uuid, display_name text, email text, roles text[])
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select r.user_id, coalesce(pp.display_name, 'Spelare')::text, u.email::text,
           array_agg(r.role order by r.role)
      from public.staff_roles r
      join auth.users u on u.id = r.user_id
      left join public.player_profiles pp on pp.user_id = r.user_id
     group by r.user_id, pp.display_name, u.email
     order by u.email;
end;
$$;

create or replace function public.admin_grant_role(p_email text, p_role text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  if coalesce(p_role, '') not in (
    'admin', 'verify_expert', 'view_sensitive_document', 'moderator', 'finance_admin', 'payout_admin'
  ) then
    raise exception 'INVALID_ROLE';
  end if;
  select u.id into v_user from auth.users u
   where lower(u.email) = lower(btrim(coalesce(p_email, ''))) and u.email_confirmed_at is not null;
  if v_user is null then
    raise exception 'USER_NOT_FOUND';
  end if;
  insert into public.staff_roles (user_id, role, granted_by)
  values (v_user, p_role, auth.uid())
  on conflict (user_id, role) do nothing;
  if found then
    perform public.audit_log_add('role_granted', 'user', v_user::text, jsonb_build_object('role', p_role));
  end if;
  return v_user;
end;
$$;

create or replace function public.admin_revoke_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  if p_role = 'admin' and (
    select count(*) from public.staff_roles r where r.role = 'admin'
  ) <= 1 and exists (
    select 1 from public.staff_roles r where r.role = 'admin' and r.user_id = p_user_id
  ) then
    raise exception 'LAST_ADMIN';
  end if;
  delete from public.staff_roles r where r.user_id = p_user_id and r.role = p_role;
  if found then
    perform public.audit_log_add('role_revoked', 'user', p_user_id::text, jsonb_build_object('role', p_role));
  end if;
end;
$$;

create or replace function public.admin_set_flag(p_key text, p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  if coalesce(p_mode, '') not in ('off', 'staff', 'on') then
    raise exception 'INVALID_MODE';
  end if;
  select f.mode into v_old from public.feature_flags f where f.key = p_key for update;
  if v_old is null then
    raise exception 'UNKNOWN_FLAG';
  end if;
  if v_old = p_mode then
    return;
  end if;
  update public.feature_flags f
     set mode = p_mode, updated_by = auth.uid(), updated_at = now()
   where f.key = p_key;
  perform public.audit_log_add('flag_changed', 'feature_flag', p_key,
                               jsonb_build_object('from', v_old, 'to', p_mode));
end;
$$;

create or replace function public.admin_flags()
returns table (key text, mode text, note text, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  return query select f.key, f.mode, f.note, f.updated_at from public.feature_flags f order by f.key;
end;
$$;

create or replace function public.admin_audit_recent(p_limit integer default 100)
returns table (
  id bigint,
  actor_name text,
  action text,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select l.id, coalesce(pp.display_name, 'Okänd')::text, l.action, l.target_type, l.target_id,
           l.details, l.created_at
      from public.admin_audit_log l
      left join public.player_profiles pp on pp.user_id = l.actor_id
     order by l.id desc
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

-- ---------------------------------------------------------------------------
-- Första admin: ägarkontot (samma som /review och forummoderatorn i 0014)
-- ---------------------------------------------------------------------------

insert into public.staff_roles (user_id, role)
select u.id, r.role
  from auth.users u
 cross join (values ('admin'), ('verify_expert'), ('view_sensitive_document')) as r(role)
 where lower(u.email) = 'oholmgren32@gmail.com'
on conflict (user_id, role) do nothing;

-- ---------------------------------------------------------------------------
-- Rättigheter
-- ---------------------------------------------------------------------------

revoke execute on function public.audit_log_add(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.expert_application_editable(uuid) from public, anon, authenticated;
revoke execute on function public.expert_storage_orphans(integer) from public, anon, authenticated;
grant execute on function public.expert_storage_orphans(integer) to service_role;
revoke execute on function public.expert_is_approved(uuid) from public, anon, authenticated;

-- Läsbara för alla (avslöjar bara den egna statusen eller publika uppgifter).
revoke execute on function public.has_role(text) from public;
revoke execute on function public.is_staff() from public;
revoke execute on function public.flag_enabled(text) from public;
revoke execute on function public.studiehjalp_access() from public;
revoke execute on function public.expert_directory(uuid) from public;
revoke execute on function public.expert_search(text, text, text, integer, numeric, text, text, integer, integer) from public;
grant execute on function public.has_role(text) to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.flag_enabled(text) to anon, authenticated;
grant execute on function public.studiehjalp_access() to anon, authenticated;
grant execute on function public.expert_directory(uuid) to anon, authenticated;
grant execute on function public.expert_search(text, text, text, integer, numeric, text, text, integer, integer) to anon, authenticated;

-- Bara inloggade.
revoke execute on function public.expert_application_start(text) from public, anon;
revoke execute on function public.expert_application_save(uuid, text, numeric, text, text, text, boolean) from public, anon;
revoke execute on function public.expert_application_submit(uuid, boolean) from public, anon;
revoke execute on function public.expert_application_mine() from public, anon;
revoke execute on function public.expert_document_begin(uuid, text, text, text, integer) from public, anon;
revoke execute on function public.expert_document_remove(uuid) from public, anon;
revoke execute on function public.expert_document_confirmable(uuid) from public, anon;
revoke execute on function public.expert_application_withdraw(uuid) from public, anon;
revoke execute on function public.admin_flags() from public, anon;
revoke execute on function public.expert_queue(text) from public, anon;
revoke execute on function public.expert_application_admin(uuid) from public, anon;
revoke execute on function public.expert_application_decide(uuid, text, text, numeric, text, text, boolean, text, text) from public, anon;
revoke execute on function public.expert_document_open(uuid) from public, anon;
revoke execute on function public.expert_documents_due(integer) from public, anon;
revoke execute on function public.expert_documents_mark_deleted(uuid[]) from public, anon;
revoke execute on function public.expert_profile_mine() from public, anon;
revoke execute on function public.expert_profile_save(text, text, text, text, text, text[], text[], text[], text, integer, integer, integer, boolean, boolean) from public, anon;
revoke execute on function public.expert_profile_publish(boolean) from public, anon;
revoke execute on function public.admin_staff_list() from public, anon;
revoke execute on function public.admin_grant_role(text, text) from public, anon;
revoke execute on function public.admin_revoke_role(uuid, text) from public, anon;
revoke execute on function public.admin_set_flag(text, text) from public, anon;
revoke execute on function public.admin_audit_recent(integer) from public, anon;

grant execute on function public.expert_application_start(text) to authenticated;
grant execute on function public.expert_application_save(uuid, text, numeric, text, text, text, boolean) to authenticated;
grant execute on function public.expert_application_submit(uuid, boolean) to authenticated;
grant execute on function public.expert_application_mine() to authenticated;
grant execute on function public.expert_document_begin(uuid, text, text, text, integer) to authenticated;
grant execute on function public.expert_document_remove(uuid) to authenticated;
grant execute on function public.expert_document_confirmable(uuid) to authenticated;
grant execute on function public.expert_application_withdraw(uuid) to authenticated;
grant execute on function public.admin_flags() to authenticated;
grant execute on function public.expert_queue(text) to authenticated;
grant execute on function public.expert_application_admin(uuid) to authenticated;
grant execute on function public.expert_application_decide(uuid, text, text, numeric, text, text, boolean, text, text) to authenticated;
grant execute on function public.expert_document_open(uuid) to authenticated;
grant execute on function public.expert_documents_due(integer) to authenticated, service_role;
grant execute on function public.expert_documents_mark_deleted(uuid[]) to authenticated, service_role;
grant execute on function public.expert_profile_mine() to authenticated;
grant execute on function public.expert_profile_save(text, text, text, text, text, text[], text[], text[], text, integer, integer, integer, boolean, boolean) to authenticated;
grant execute on function public.expert_profile_publish(boolean) to authenticated;
grant execute on function public.admin_staff_list() to authenticated;
grant execute on function public.admin_grant_role(text, text) to authenticated;
grant execute on function public.admin_revoke_role(uuid, text) to authenticated;
grant execute on function public.admin_set_flag(text, text) to authenticated;
grant execute on function public.admin_audit_recent(integer) to authenticated;

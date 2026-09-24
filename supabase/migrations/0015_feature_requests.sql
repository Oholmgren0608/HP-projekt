-- 0015_feature_requests.sql
-- ---------------------------------------------------------------------------
-- Hjälp & feedback: önskemål och problemrapporter från användarna.
--
-- Designval (medvetna):
-- * En tabell för båda kanalerna, åtskilda av `kind` ('idea' | 'problem').
--   Formuläret har två ingångar ("💡 Skicka önskemål" och "⚠ Rapportera ett
--   problem") men samma fält och samma kö.
-- * Allt skrivande går via RPC:n feature_request_submit (SECURITY DEFINER):
--   klienten kan aldrig sätta user_id, status eller created_at själv.
-- * Utloggade får skicka (user_id blir null) - en idé ska inte kräva konto.
-- * Ingen select-policy: ärendena är privata mellan avsändaren och ägaren,
--   som läser dem med service role tills en adminvy/"mina ärenden"-vy byggs
--   (lägg då en select-policy på user_id = auth.uid()).
-- * Status: new -> reviewing -> planned -> implemented/declined. Ändras
--   aldrig av klienten, bara av ägaren (admin/panel senare).
--
-- Kör med `npm run db:push` (se AGENTS.md).
-- ---------------------------------------------------------------------------

create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'idea' check (kind in ('idea', 'problem')),
  user_id uuid references auth.users (id) on delete set null,
  category text not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  reason text check (reason is null or char_length(reason) <= 2000),
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'planned', 'implemented', 'declined')),
  created_at timestamptz not null default now()
);

-- Ägarens kö: nyaste först, filtrerat per kanal och status.
create index feature_requests_queue_idx
  on public.feature_requests (kind, status, created_at desc);

alter table public.feature_requests enable row level security;

-- Inga insert/update/delete/select-policyer: allt skrivande sker via RPC:n
-- nedan och läsning sker med service role.

-- ---------------------------------------------------------------------------
-- RPC: skicka in ett ärende
-- ---------------------------------------------------------------------------

create or replace function public.feature_request_submit(
  p_kind text,
  p_category text,
  p_title text,
  p_description text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := lower(btrim(coalesce(p_kind, '')));
  v_category text := lower(btrim(coalesce(p_category, '')));
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := btrim(coalesce(p_description, ''));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_id uuid;
begin
  -- Samma kategorilista för båda kanalerna; 'other' finns i båda.
  if v_kind not in ('idea', 'problem') then
    raise exception 'Ogiltig typ av ärende.' using errcode = '22023';
  end if;

  if v_category not in (
    'new_feature', 'improvement', 'questions', 'design', 'analytics', 'other',
    'wrong_question', 'technical', 'account', 'duel'
  ) then
    raise exception 'Ogiltig kategori.' using errcode = '22023';
  end if;

  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'Rubriken måste vara 3-120 tecken.' using errcode = '22023';
  end if;

  if char_length(v_description) < 10 or char_length(v_description) > 4000 then
    raise exception 'Beskrivningen måste vara 10-4000 tecken.' using errcode = '22023';
  end if;

  if v_reason is not null and char_length(v_reason) > 2000 then
    raise exception 'Fritextfältet får vara högst 2000 tecken.' using errcode = '22023';
  end if;

  -- Skydd mot oavsiktliga dubbelskick (klienten inaktiverar också knappen).
  if auth.uid() is not null and exists (
    select 1
    from public.feature_requests r
    where r.user_id = auth.uid()
      and r.title = v_title
      and r.created_at > now() - interval '1 minute'
  ) then
    raise exception 'Ett ärende med samma rubrik skickades nyss.' using errcode = '22023';
  end if;

  insert into public.feature_requests (kind, user_id, category, title, description, reason)
  values (v_kind, auth.uid(), v_category, v_title, v_description, v_reason)
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.feature_request_submit(text, text, text, text, text) from public;
grant execute on function public.feature_request_submit(text, text, text, text, text) to anon, authenticated;

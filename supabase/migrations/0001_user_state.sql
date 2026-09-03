-- HP Lift: generisk nyckel/värde-synkningstabell.
-- En rad per (användare, localStorage-nyckel); value är jsonb, updated_at
-- används för "nyaste vinner"-merge vid första inloggning.
--
-- Kör den här filen i Supabase Dashboard -> SQL Editor.

create table public.user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_key text not null check (storage_key <> ''),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, storage_key)
);

alter table public.user_state enable row level security;

-- Användare får bara läsa/skriva sina egna rader.
create policy "select own state" on public.user_state
  for select using ((select auth.uid()) = user_id);

create policy "insert own state" on public.user_state
  for insert with check ((select auth.uid()) = user_id);

create policy "update own state" on public.user_state
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "delete own state" on public.user_state
  for delete using ((select auth.uid()) = user_id);

create index user_state_updated_at_idx
  on public.user_state (user_id, updated_at desc);

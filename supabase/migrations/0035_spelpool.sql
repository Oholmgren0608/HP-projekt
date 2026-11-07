-- 0035: stängd spelpool för tävlingslägena (duell och Alla mot alla).
-- Beslut: docs/adr/0001-stangd-fragepool.md, plan: docs/alla-mot-alla/steg-1-plan.md.
--
-- * questions.pool: 'ovning' (publik med facit, som hittills) eller 'spel'
--   (stängd). Alla befintliga frågor blir 'ovning'.
-- * questions_select_published släpper bara igenom övningsfrågor. Ingen klient
--   (anon eller authenticated) kan därmed läsa spelpoolen, och exporten av
--   offlinekopian (fragebank:export, anon-nyckel) tappar den automatiskt.
--   Tävlings-RPC:erna (security definer) läser poolen och skickar aldrig facit
--   innan frågan har stängt för spelaren.
--
-- RLS-ändring (AGENTS.md regel 6): policyn questions_select_published får
-- villkoret pool = 'ovning'. Test: ~/.cache/hp-db-test/test-0035-0037.mjs.

alter table public.questions
  add column if not exists pool text not null default 'ovning';

alter table public.questions
  drop constraint if exists questions_pool_check;
alter table public.questions
  add constraint questions_pool_check check (pool in ('ovning', 'spel'));

create index if not exists questions_pool_status_kind_idx
  on public.questions (pool, status, kind);

drop policy if exists "questions_select_published" on public.questions;
create policy "questions_select_published" on public.questions
  for select
  using (status = 'published' and pool = 'ovning');

-- 0014_forum_moderation.sql
-- ---------------------------------------------------------------------------
-- Mål: moderatorer ska kunna se och hantera anmälningar.
--
-- 0012/0013 lät användare anmäla inlägg (forum_reports) och moderatorer ta
-- bort innehåll (forum_moderate_delete), men anmälningarna gick inte att läsa
-- någonstans - ingen policy ger SELECT på andras anmälningar. Här kommer en
-- moderator-kö: bara den som står i forum_moderators kan läsa och kvittera.
--
-- Första moderator: kontot i REVIEW_ALLOWED_EMAILS (samma ägare som /review).
-- Kör med `npm run db:push`.
-- ---------------------------------------------------------------------------

-- Anmälningar i kön (endast öppna), med inläggets text och trådens fråga.
create or replace function public.forum_moderator_reports(p_limit integer default 50)
returns table (
  report_id uuid,
  post_id uuid,
  thread_id uuid,
  question_id text,
  reason text,
  status text,
  created_at timestamptz,
  author_name text,
  reporter_name text,
  body text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id,
         r.post_id,
         p.thread_id,
         t.question_id,
         r.reason,
         r.status,
         r.created_at,
         coalesce(ap.display_name, 'Spelare')::text,
         coalesce(rp.display_name, 'Spelare')::text,
         p.body
  from public.forum_reports r
  join public.forum_posts p on p.id = r.post_id
  join public.forum_threads t on t.id = p.thread_id
  left join public.player_profiles ap on ap.user_id = p.author_id
  left join public.player_profiles rp on rp.user_id = r.reporter_id
  where exists (select 1 from public.forum_moderators m where m.user_id = auth.uid())
    and r.status = 'open'
  order by r.created_at asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

-- Kvittera en anmälan ('handled' = åtgärdad, 'dismissed' = ogiltig).
create or replace function public.forum_resolve_report(p_report_id uuid, p_status text default 'handled')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not exists (select 1 from public.forum_moderators m where m.user_id = auth.uid()) then
    raise exception 'NOT_ALLOWED';
  end if;

  if coalesce(p_status, '') not in ('handled', 'dismissed', 'open') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.forum_reports r
     set status = p_status
   where r.id = p_report_id;
end;
$$;

-- Första moderator: ägarkontot (samma som /review använder).
insert into public.forum_moderators (user_id)
select u.id from auth.users u where lower(u.email) = 'oholmgren32@gmail.com'
on conflict (user_id) do nothing;

-- Rättigheter
revoke execute on function public.forum_moderator_reports(integer) from public, anon;
grant execute on function public.forum_moderator_reports(integer) to authenticated;
revoke execute on function public.forum_resolve_report(uuid, text) from public, anon;
grant execute on function public.forum_resolve_report(uuid, text) to authenticated;

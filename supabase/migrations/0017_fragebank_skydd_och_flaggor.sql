-- 0017_fragebank_skydd_och_flaggor.sql
-- ---------------------------------------------------------------------------
-- Mål: Provfrågor ska aldrig gå att läsa för användare, och användare ska
-- kunna flagga felaktiga frågor.
--
-- Bakgrund: public.questions har två sorters frågor. Provfrågor kommer ur
-- UHR:s officiella prov (`exam_id` satt, id `hp-...`) och är
-- upphovsrättsskyddade - de får sparas som förlagor men aldrig publiceras.
-- Övningsfrågor är våra egna (`exam_id` null) och utgör den publicerade
-- frågebanken.
--
-- 1. Publicerade Provfrågor avpubliceras ('draft') och ett CHECK-villkor gör
--    att en Provfråga aldrig kan publiceras igen - varken med exam_id eller
--    med importens id-prefix `hp-`. Villkoret gäller alla roller, även
--    service role och tabellägaren.
-- 2. "public read questions" (0005) lät anon/authenticated läsa alla rader,
--    även utkast, refuserade frågor och Provfrågor. Nu bara publicerade.
-- 3. Resultatet av AI:ns oberoende andra kontroll av nya Övningsfrågor
--    sparas per fråga: `verification` och `verification_note`.
-- 4. Bucketen prov-figures (0006) var publik och innehåller figurer
--    utklippta ur UHR:s prov. Den blir privat; objekten ligger kvar.
-- 5. forum_post_to_question (0012) kopierade prompt och delprov från vilken
--    fråga som helst - även utkast och Provfrågor - till en publik
--    trådtitel. Nu bara från publicerade frågor.
-- 6-8. Flaggor: en inloggad användare flaggar en fråga som fel med en
--    motivering (question_flag). När tre olika användare har öppna flaggor
--    på samma fråga dras den automatiskt tillbaka till 'draft'. När en
--    granskare publicerar den igen (service role via /review) stänger en
--    trigger de öppna flaggorna, så att räkningen börjar om. Den vars flagga
--    har hanterats kan inte flagga samma fråga igen förrän efter 30 dagar.
-- 9. Duellens facit (duel_questions, 0004) följer de publicerade
--    Övningsfrågorna: facit skrivs när en fråga publiceras och när
--    correct_index ändras på en publicerad fråga. Duellerna delar frågebank
--    med övningen.
-- 10. Nya frågor blir utkast ('draft') om ingen status anges - ingenting
--    publiceras utan granskning.
--
-- Kör med `npm run db:dry` och sedan `npm run db:push` (se AGENTS.md).
-- Skrivskyddade kontrollfrågor (före och efter) finns sist i filen.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. En Provfråga är aldrig publicerad.
-- ---------------------------------------------------------------------------
-- En Provfråga känns igen på exam_id eller på id-prefixet `hp-` (importens
-- format, hp-ÅÅÅÅ-MM-DD-...), så att även en Provfråga som saknar exam_id
-- stoppas. En fråga vars id börjar med `hp-` kan alltså aldrig publiceras.
update public.questions
   set status = 'draft'
 where status = 'published'
   and (exam_id is not null or id like 'hp-%');

-- En Provfråga som läggs in utan status blir ett utkast (default 'draft',
-- se 10).
alter table public.questions
  drop constraint if exists questions_provfraga_aldrig_publicerad;
alter table public.questions
  add constraint questions_provfraga_aldrig_publicerad
  check ((exam_id is null and id not like 'hp-%') or status <> 'published');

-- ---------------------------------------------------------------------------
-- 2. Användare läser bara publicerade frågor.
-- ---------------------------------------------------------------------------
-- Tack vare villkoret i 1 är en publicerad fråga alltid en Övningsfråga.
-- Granskningen (/review) och importen använder service role och påverkas inte.
drop policy if exists "public read questions" on public.questions;
drop policy if exists "questions_select_published" on public.questions;
create policy "questions_select_published" on public.questions
  for select to anon, authenticated
  using (status = 'published');

-- ---------------------------------------------------------------------------
-- 3. AI:ns andra kontroll av nya Övningsfrågor.
-- ---------------------------------------------------------------------------
-- null = ingen andra kontroll gjord (t.ex. äldre frågor). 'disagreed' = den
-- andra AI:n valde ett annat svar eller underkände förklaringen; varför står
-- i verification_note och frågan granskas manuellt. Kolumnerna går att läsa
-- för alla på publicerade frågor (klienten hämtar `select *`), så
-- anteckningen får inte innehålla något hemligt - och aldrig text ur en
-- förlaga.
alter table public.questions
  add column if not exists verification text
    constraint questions_verification_check
    check (verification in ('agreed', 'disagreed')),
  add column if not exists verification_note text;

-- ---------------------------------------------------------------------------
-- 4. Figurerna ur UHR:s prov är inte längre publika.
-- ---------------------------------------------------------------------------
-- De publika URL:erna i questions.figure_url (/storage/v1/object/public/...)
-- slutar fungera för den här bucketen. Det är avsiktligt: figurerna hör till
-- Provfrågor. Ska granskningen visa dem behövs signerade URL:er (service
-- role). Inga objekt raderas.
update storage.buckets
   set public = false
 where id = 'prov-figures';

-- ---------------------------------------------------------------------------
-- 5. Forumtrådar får titel och delprov bara från publicerade frågor.
-- ---------------------------------------------------------------------------
-- Samma signatur och kropp som i 0012. Enda skillnaden är
-- `and q.status = 'published'` i de två uppslagen mot frågebanken: för
-- utkast, refuserade frågor och Provfrågor används det klienten skickade
-- med, precis som för frågor som inte finns i banken. `create or replace`
-- behåller ägare och rättigheter; de sätts ändå igen nedan, identiskt med
-- 0012 (ingen senare migration har ändrat dem).
create or replace function public.forum_post_to_question(
  p_question_id text,
  p_kind text,
  p_title text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_thread uuid;
  v_post uuid;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  perform public.forum_ensure_profile();

  insert into public.forum_threads (question_id, kind, title, created_by)
  values (
    p_question_id,
    coalesce((select q.kind from public.questions q where q.id = p_question_id and q.status = 'published'), p_kind, 'okand'),
    coalesce(
      nullif((select left(q.prompt, 200) from public.questions q where q.id = p_question_id and q.status = 'published'), ''),
      nullif(left(coalesce(p_title, ''), 200), ''),
      p_question_id
    ),
    v_user
  )
  on conflict (question_id) do update
    set last_activity_at = now()
  returning id into v_thread;

  insert into public.forum_posts (thread_id, author_id, body)
  values (v_thread, v_user, trim(p_body))
  returning id into v_post;

  update public.forum_threads t
     set post_count = (select count(*)::int from public.forum_posts p
                        where p.thread_id = t.id and not p.is_deleted),
         last_activity_at = now()
   where t.id = v_thread;

  return v_post;
end;
$$;

revoke execute on function public.forum_post_to_question(text, text, text, text) from public, anon;
grant execute on function public.forum_post_to_question(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Flaggor: "den här frågan är fel".
-- ---------------------------------------------------------------------------
-- En rad per fråga och användare; öppen flagga = resolved_at är null. En ny
-- flagga från samma användare ersätter den gamla (ny motivering och tid) och
-- öppnar den igen om den var stängd - med de spärrar som beskrivs i 7.
-- Motiveringen sparas trimmad, 3-500 tecken. Allt skrivande går via
-- question_flag (7) och triggern (8); klienten kan bara läsa sina egna
-- flaggor.
create table if not exists public.question_flags (
  question_id text not null references public.questions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null
    constraint question_flags_reason_check
    check (reason = btrim(reason, E' \t\r\n') and char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (question_id, user_id)
);

-- Öppna flaggor per fråga: räkningen i question_flag, triggern och
-- granskningens lista över flaggade frågor.
create index if not exists question_flags_open_idx
  on public.question_flags (question_id)
  where resolved_at is null;

-- Hastighetsspärren (egna flaggor senaste dygnet). Täcker också
-- referensen till auth.users när ett konto tas bort.
create index if not exists question_flags_user_created_idx
  on public.question_flags (user_id, created_at);

alter table public.question_flags enable row level security;

drop policy if exists "question_flags_select_own" on public.question_flags;
create policy "question_flags_select_own" on public.question_flags
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Supabases default privileges ger anon/authenticated ALL på nya tabeller.
-- Utan policy stoppar RLS redan insert/update/delete, men TRUNCATE går inte
-- genom RLS - så rättigheterna dras in uttryckligen. Service role
-- (granskningen) får läsa och hantera flaggor.
revoke all on table public.question_flags from public, anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.question_flags from authenticated;
grant select on table public.question_flags to authenticated;
grant select, insert, update, delete on table public.question_flags to service_role;

-- ---------------------------------------------------------------------------
-- 7. question_flag: flagga en publicerad fråga som fel.
-- ---------------------------------------------------------------------------
-- Svar: {"flags": <antal öppna flaggor på frågan>, "withdrawn": <true om
-- just den här flaggan drog tillbaka frågan>}.
-- Fel: NOT_AUTHENTICATED, INVALID_REASON (inte 3-500 tecken efter trim),
-- QUESTION_NOT_FOUND (finns inte eller är inte publicerad),
-- ALREADY_REVIEWED (användarens flagga på frågan har hanterats de senaste
-- 30 dagarna), RATE_LIMITED.
--
-- * Samma användare igen inom 10 minuter från sin öppna flagga: ingenting
--   skrivs, svaret är nuläget ({"flags": n, "withdrawn": false}). Efter 10
--   minuter ersätts motiveringen och tiden.
-- * En hanterad (stängd) flagga öppnas inte igen förrän 30 dagar efter att
--   den stängdes. Annars kunde samma tre konton dra tillbaka frågan direkt
--   igen efter att en granskare publicerat den eller kvitterat flaggorna.
-- * Hastighetsspärr: högst 50 flaggor per användare och rullande dygn.
--   Räknar egna flaggor skapade (eller förnyade) de senaste 24 timmarna,
--   utom en befintlig flagga på samma fråga - den ersätts i stället för att
--   läggas till.
--
-- Lås, alltid i den här ordningen och till anropets slut: först ett
-- transaktionslås per användare (pg_advisory_xact_lock), så att samtidiga
-- anrop från samma användare körs ett i taget och spärren håller exakt;
-- sedan frågeraden (for update), så att samtidiga flaggor på samma fråga
-- räknas en i taget - den som ger tre öppna flaggor drar alltid tillbaka
-- frågan, och den som väntade får QUESTION_NOT_FOUND efteråt.
create or replace function public.question_flag(p_question_id text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''), E' \t\r\n');
  v_status text;
  v_har_flagga boolean;
  v_skapad timestamptz;
  v_stangd timestamptz;
  v_open integer;
  v_withdrawn boolean := false;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if char_length(v_reason) not between 3 and 500 then
    raise exception 'INVALID_REASON';
  end if;

  perform pg_advisory_xact_lock(hashtext('question_flag:' || v_user::text));

  select q.status into v_status
    from public.questions q
   where q.id = p_question_id
     for update;

  if v_status is distinct from 'published' then
    raise exception 'QUESTION_NOT_FOUND';
  end if;

  select f.created_at, f.resolved_at
    into v_skapad, v_stangd
    from public.question_flags f
   where f.question_id = p_question_id
     and f.user_id = v_user;
  v_har_flagga := found;

  if v_stangd > now() - interval '30 days' then
    raise exception 'ALREADY_REVIEWED';
  end if;

  if v_har_flagga and v_stangd is null and v_skapad > now() - interval '10 minutes' then
    select count(*)::int into v_open
      from public.question_flags f
     where f.question_id = p_question_id
       and f.resolved_at is null;
    return jsonb_build_object('flags', v_open, 'withdrawn', false);
  end if;

  if (select count(*)
        from public.question_flags f
       where f.user_id = v_user
         and f.created_at > now() - interval '24 hours'
         and f.question_id <> p_question_id) >= 50 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.question_flags (question_id, user_id, reason)
  values (p_question_id, v_user, v_reason)
  on conflict (question_id, user_id) do update
    set reason = excluded.reason,
        created_at = now(),
        resolved_at = null;

  -- En rad per användare, så antalet rader är antalet olika användare.
  select count(*)::int into v_open
    from public.question_flags f
   where f.question_id = p_question_id
     and f.resolved_at is null;

  if v_open >= 3 then
    update public.questions set status = 'draft' where id = p_question_id;
    v_withdrawn := true;
  end if;

  return jsonb_build_object('flags', v_open, 'withdrawn', v_withdrawn);
end;
$$;

revoke all on function public.question_flag(text, text) from public, anon;
grant execute on function public.question_flag(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Ny publicering stänger frågans öppna flaggor.
-- ---------------------------------------------------------------------------
-- Gäller när status går från något annat till 'published', oavsett vem som
-- uppdaterar (i praktiken granskningen via service role). Ändringar av en
-- fråga som redan är publicerad stänger inga flaggor. Funktionen ska bara
-- köras av triggern.
create or replace function public.questions_resolve_flags_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.question_flags f
     set resolved_at = now()
   where f.question_id = new.id
     and f.resolved_at is null;
  return null;
end;
$$;

revoke all on function public.questions_resolve_flags_on_publish() from public, anon, authenticated;

drop trigger if exists questions_resolve_flags_on_publish on public.questions;
create trigger questions_resolve_flags_on_publish
  after update on public.questions
  for each row
  when (new.status = 'published' and old.status is distinct from 'published')
  execute function public.questions_resolve_flags_on_publish();

-- ---------------------------------------------------------------------------
-- 9. Duellens facit följer de publicerade Övningsfrågorna.
-- ---------------------------------------------------------------------------
-- duel_questions (0004) är facit som duel_submit_answer rättar mot. Det
-- seedades en gång med 136 frågor, så nya Övningsfrågor saknade facit
-- ('unknown question' i duellen) och ändrat facit i /review nådde aldrig
-- dit. Duellerna använder bara publicerade frågor, så facit skrivs bara för
-- publicerade Övningsfrågor (exam_id null, id som inte börjar med `hp-`,
-- correct_index >= 0):
-- * när en fråga läggs in som publicerad eller publiceras (igen) - med det
--   correct_index den har då, så ett facit som ändrades medan frågan var
--   utkast kommer med;
-- * när correct_index ändras på en publicerad fråga.
-- Rader tas aldrig bort - inte heller när en fråga avpubliceras eller dras
-- tillbaka - så att pågående dueller fortfarande kan rättas. Provfrågor och
-- utkast som aldrig har publicerats får ingen rad. Ett negativt
-- correct_index (ogiltig fråga, som appen ändå hoppar över) hoppas över:
-- duel_questions kräver correct_index >= 0, och skrivningen till questions
-- ska inte stoppas av facit-tabellen.
create or replace function public.questions_sync_duel_facit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and new.exam_id is null
     and new.id not like 'hp-%'
     and new.correct_index >= 0 then
    insert into public.duel_questions (question_id, correct_index)
    values (new.id, new.correct_index)
    on conflict (question_id) do update
      set correct_index = excluded.correct_index
      where public.duel_questions.correct_index is distinct from excluded.correct_index;
  end if;
  return null;
end;
$$;

revoke all on function public.questions_sync_duel_facit() from public, anon, authenticated;

drop trigger if exists questions_sync_duel_facit on public.questions;
create trigger questions_sync_duel_facit
  after insert or update of correct_index, exam_id, status on public.questions
  for each row
  execute function public.questions_sync_duel_facit();

-- Engångsfyllning av alla publicerade Övningsfrågor, efter triggern (hela
-- migrationen är en transaktion och questions är låst sedan steg 1, så
-- inget hinner ändras emellan). Rättar också äldre rader vars facit hade
-- glidit isär från frågebanken. Facit för utkast rörs inte.
insert into public.duel_questions (question_id, correct_index)
select q.id, q.correct_index
  from public.questions q
 where q.status = 'published'
   and q.exam_id is null
   and q.id not like 'hp-%'
   and q.correct_index >= 0
on conflict (question_id) do update
  set correct_index = excluded.correct_index
  where public.duel_questions.correct_index is distinct from excluded.correct_index;

-- ---------------------------------------------------------------------------
-- 10. Nya frågor är utkast tills de har granskats.
-- ---------------------------------------------------------------------------
-- Med default 'published' (0006) blev en fråga som lades in utan status -
-- t.ex. manuellt i Dashboard - publicerad direkt, utan granskning. Nu blir
-- den ett utkast. Befintliga rader påverkas inte; importen och
-- scripts/fragebank anger redan status 'draft' själva.
alter table public.questions
  alter column status set default 'draft';

-- ---------------------------------------------------------------------------
-- 11. Kontrollfrågor (skrivskyddade, ändrar ingenting).
-- ---------------------------------------------------------------------------
-- Kopiera en fråga i taget till Supabase Dashboard -> SQL Editor och ta bort
-- "-- " i början av varje rad. 0a-0c körs FÖRE `npm run db:push` och visar
-- hur mycket som ändras; A-D körs efteråt. A ska visa OK på varje rad; 0a-0c,
-- B, C och D är information.
--
-- -- 0a. Före db:push: publicerade Provfrågor som steg 1 avpublicerar.
-- select count(*) as publicerade_provfragor
--   from public.questions
--  where status = 'published'
--    and (exam_id is not null or id like 'hp-%');
--
-- -- 0b. Före db:push: användare vars repetitionskort (SRS) pekar på
-- --     Provfrågor (hp-...). 0017 rör inte user_state.
-- select count(*) from public.user_state where storage_key = 'hp-lift-srs-v1' and value->>'v' like '%"hp-%';
--
-- -- 0c. Före db:push: duellfacit som engångsfyllningen i 9 lägger till
-- --     (duellfacit null) eller ändrar.
-- select q.id, d.correct_index as duellfacit, q.correct_index as fragebanken
--   from public.questions q
--   left join public.duel_questions d on d.question_id = q.id
--  where q.status = 'published'
--    and q.exam_id is null
--    and q.id not like 'hp-%'
--    and q.correct_index >= 0
--    and d.correct_index is distinct from q.correct_index
--  order by q.id;
--
-- -- A. Efter db:push, en rad per kontroll.
-- select 'villkoret questions_provfraga_aldrig_publicerad' as kontroll,
--        case when exists (select 1 from pg_constraint
--                           where conrelid = 'public.questions'::regclass
--                             and conname = 'questions_provfraga_aldrig_publicerad'
--                             and convalidated
--                             and pg_get_constraintdef(oid) like '%exam_id IS NULL%hp-%')
--             then 'OK' else 'FEL' end as status
-- union all
-- select 'inga publicerade Provfrågor',
--        case when not exists (select 1 from public.questions
--                               where status = 'published'
--                                 and (exam_id is not null or id like 'hp-%'))
--             then 'OK' else 'FEL' end
-- union all
-- select 'nya frågor blir utkast (default draft)',
--        case when (select column_default from information_schema.columns
--                    where table_schema = 'public' and table_name = 'questions'
--                      and column_name = 'status') = '''draft''::text'
--             then 'OK' else 'FEL' end
-- union all
-- select 'enda policyn på questions: bara publicerade',
--        case when (select array_agg(policyname || ' ' || cmd || ' ' || roles::text || ' ' || qual)
--                     from pg_policies
--                    where schemaname = 'public' and tablename = 'questions')
--                  = array['questions_select_published SELECT {anon,authenticated} (status = ''published''::text)']
--             then 'OK' else 'FEL' end
-- union all
-- select 'bucketen prov-figures är privat',
--        case when exists (select 1 from storage.buckets where id = 'prov-figures' and not public)
--             then 'OK' else 'FEL' end
-- union all
-- select 'question_flag: authenticated ja, anon nej',
--        case when has_function_privilege('authenticated', to_regprocedure('public.question_flag(text,text)'), 'execute')
--              and not has_function_privilege('anon', to_regprocedure('public.question_flag(text,text)'), 'execute')
--             then 'OK' else 'FEL' end
-- union all
-- select 'forum_post_to_question: rättigheter och bara publicerade',
--        case when has_function_privilege('authenticated', to_regprocedure('public.forum_post_to_question(text,text,text,text)'), 'execute')
--              and not has_function_privilege('anon', to_regprocedure('public.forum_post_to_question(text,text,text,text)'), 'execute')
--              and (select prosrc from pg_proc
--                    where oid = to_regprocedure('public.forum_post_to_question(text,text,text,text)'))
--                  like '%q.status = ''published''%q.status = ''published''%'
--             then 'OK' else 'FEL' end
-- union all
-- select 'triggrarna finns, funktionerna går inte att anropa',
--        case when (select count(*) from pg_trigger
--                    where tgrelid = 'public.questions'::regclass
--                      and tgname in ('questions_resolve_flags_on_publish', 'questions_sync_duel_facit')
--                      and tgenabled = 'O') = 2
--              and not has_function_privilege('authenticated', to_regprocedure('public.questions_resolve_flags_on_publish()'), 'execute')
--              and not has_function_privilege('anon', to_regprocedure('public.questions_resolve_flags_on_publish()'), 'execute')
--              and not has_function_privilege('authenticated', to_regprocedure('public.questions_sync_duel_facit()'), 'execute')
--              and not has_function_privilege('anon', to_regprocedure('public.questions_sync_duel_facit()'), 'execute')
--             then 'OK' else 'FEL' end
-- union all
-- select 'duellfacit finns och stämmer för varje publicerad Övningsfråga',
--        case when not exists (select 1 from public.questions q
--                                left join public.duel_questions d on d.question_id = q.id
--                               where q.status = 'published'
--                                 and q.exam_id is null
--                                 and q.id not like 'hp-%'
--                                 and q.correct_index >= 0
--                                 and d.correct_index is distinct from q.correct_index)
--             then 'OK' else 'FEL' end
-- union all
-- select 'question_flags: RLS, authenticated bara SELECT, anon inget',
--        case when (select relrowsecurity from pg_class where oid = to_regclass('public.question_flags'))
--              and has_table_privilege('authenticated', to_regclass('public.question_flags'), 'select')
--              and not has_table_privilege('authenticated', to_regclass('public.question_flags'), 'insert, update, delete, truncate')
--              and not has_table_privilege('anon', to_regclass('public.question_flags'), 'select, insert, update, delete, truncate')
--             then 'OK' else 'FEL' end
-- union all
-- select 'migrationen är registrerad',
--        case when exists (select 1 from supabase_migrations.schema_migrations where version = '0017')
--             then 'OK' else 'FEL' end;
--
-- -- B. Forumtrådar vars fråga inte är publicerad. Titeln kan ha kopierats ur
-- --    ett utkast eller en Provfråga före 0017. titel_ar_fragetext = true:
-- --    titeln är frågans nuvarande text. false kan ändå vara en kopia av en
-- --    äldre version - läs titeln. Att byta ut titlar beslutar en person.
-- select t.id, t.question_id, q.status, q.exam_id is not null as provfraga,
--        t.title = left(q.prompt, 200) as titel_ar_fragetext
--   from public.forum_threads t
--   join public.questions q on q.id = t.question_id
--  where q.status <> 'published';
--
-- -- C. Publicerade frågor med figur i den nu privata bucketen (bilden slutar
-- --    visas i appen).
-- select id, figure_url
--   from public.questions
--  where status = 'published' and figure_url like '%/prov-figures/%';
--
-- -- D. Policyer på storage.objects. Ingen får matcha bucketen 'prov-figures'
-- --    (eller gälla alla buckets) - då kan användare ändå läsa eller lista
-- --    figurerna via Storage-API:t fast bucketen är privat.
-- select policyname, roles, cmd, qual from pg_policies where schemaname='storage' and tablename='objects';

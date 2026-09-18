-- ============================================================================
-- 0. LÄGET I DATABASEN (kör denna FÖRST)
--
-- En rad per förväntat objekt (tabell, funktion, schema, RLS). Allt ska visa
-- OK — utom raden för schemat private, som ska vara SAKNAS innan 0006 körs
-- (och FINNS efteråt, när 0006 är helt applicerad).
-- Hela sektionen är en enda SELECT (UNION ALL) och kan köras i ett svep.
-- ============================================================================
select '0001' as migration,
       'tabell' as typ,
       'public.user_state' as objekt,
       case when pg_catalog.to_regclass('public.user_state') is not null
            then 'OK'
            else 'SAKNAS - kör 0001_user_state.sql'
       end as status
union all
select '0002', 'tabell', 'public.player_profiles',
       case when pg_catalog.to_regclass('public.player_profiles') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'tabell', 'public.duel_matches',
       case when pg_catalog.to_regclass('public.duel_matches') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'tabell', 'public.duel_answers',
       case when pg_catalog.to_regclass('public.duel_answers') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'tabell', 'public.duel_queue',
       case when pg_catalog.to_regclass('public.duel_queue') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0003', 'tabell', 'public.duel_reviews',
       case when pg_catalog.to_regclass('public.duel_reviews') is not null
            then 'OK' else 'SAKNAS - kör 0003_duel_reviews.sql' end
union all
select '0005', 'tabell', 'public.leaderboard_entries',
       case when pg_catalog.to_regclass('public.leaderboard_entries') is not null
            then 'OK' else 'SAKNAS - kör 0005_leaderboard.sql' end
union all
select '0002', 'funktion', 'public.duel_ensure_profile(text)',
       case when pg_catalog.to_regprocedure('public.duel_ensure_profile(text)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_join_queue(text)',  -- omdefinierad i 0003
       case when pg_catalog.to_regprocedure('public.duel_join_queue(text)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_cancel_queue()',  -- omdefinierad i 0004
       case when pg_catalog.to_regprocedure('public.duel_cancel_queue()') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_start_bot_match(text)',
       case when pg_catalog.to_regprocedure('public.duel_start_bot_match(text)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_submit_answer(uuid,text,integer,boolean,integer)',
       case when pg_catalog.to_regprocedure('public.duel_submit_answer(uuid,text,integer,boolean,integer)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_mark_finished(uuid,integer,integer)',
       case when pg_catalog.to_regprocedure('public.duel_mark_finished(uuid,integer,integer)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_finish_bot(uuid,integer,integer,integer)',
       case when pg_catalog.to_regprocedure('public.duel_finish_bot(uuid,integer,integer,integer)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_forfeit(uuid)',
       case when pg_catalog.to_regprocedure('public.duel_forfeit(uuid)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_claim_stall_win(uuid)',
       case when pg_catalog.to_regprocedure('public.duel_claim_stall_win(uuid)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_create_private()',
       case when pg_catalog.to_regprocedure('public.duel_create_private()') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_join_private(text)',
       case when pg_catalog.to_regprocedure('public.duel_join_private(text)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0002', 'funktion', 'public.duel_cancel_private(uuid)',  -- omdefinierad i 0004
       case when pg_catalog.to_regprocedure('public.duel_cancel_private(uuid)') is not null
            then 'OK' else 'SAKNAS - kör 0002_duel_pvp.sql' end
union all
select '0003', 'funktion', 'public.duel_submit_review(uuid,integer,text,text,text)',
       case when pg_catalog.to_regprocedure('public.duel_submit_review(uuid,integer,text,text,text)') is not null
            then 'OK' else 'SAKNAS - kör 0003_duel_reviews.sql' end
union all
select '0005', 'funktion', 'public.leaderboard_submit(text,integer)',
       case when pg_catalog.to_regprocedure('public.leaderboard_submit(text,integer)') is not null
            then 'OK' else 'SAKNAS - kör 0005_leaderboard.sql' end
union all
select '0005', 'funktion', 'public.leaderboard_get(text,integer)',
       case when pg_catalog.to_regprocedure('public.leaderboard_get(text,integer)') is not null
            then 'OK' else 'SAKNAS - kör 0005_leaderboard.sql' end
union all
select '0005', 'funktion', 'public.leaderboard_set_name(text)',
       case when pg_catalog.to_regprocedure('public.leaderboard_set_name(text)') is not null
            then 'OK' else 'SAKNAS - kör 0005_leaderboard.sql' end
union all
select '0006', 'schema', 'private',
       case when pg_catalog.to_regnamespace('private') is null
            then 'SAKNAS (OK - inget av 0006 är applicerat)'
            else 'FINNS - 0006 är delvis eller helt körd' end
union all
select v.migration, 'rls', 'public.' || v.relname,
       case
         when c.oid is null
           then 'SAKNAS - tabellen finns inte'
         when c.relrowsecurity
           then 'OK (' || (select count(*) from pg_catalog.pg_policy p where p.polrelid = c.oid) || ' policies)'
         else 'SAKNAS - RLS är inte på'
       end
from (values
        ('0001', 'user_state'),
        ('0002', 'player_profiles'),
        ('0002', 'duel_matches'),
        ('0002', 'duel_answers'),
        ('0002', 'duel_queue'),
        ('0003', 'duel_reviews'),
        ('0005', 'leaderboard_entries')
     ) as v(migration, relname)
left join pg_catalog.pg_class c
       on c.relnamespace = 'public'::regnamespace
      and c.relname = v.relname
order by 1, 2, 3;


-- ============================================================================
-- 0006_duel_rpc_wrapper_hardening_verify.sql
--
-- NÄR: Klistra in i Supabase Dashboard -> SQL Editor. Kör SEKTION A FÖRE
--      0006 och SEKTION B EFTER 0006 (och gärna B igen när som helst).
--
-- VAD: Hela filen är läsande (read-only): ingen transaktion, ingen DDL och
--      inga skrivningar. Den ändrar ingenting och kan köras hur många gånger
--      som helst — även upprepade gånger i rad.
--
--      Sektion A visar utgångsläget: de 16 publika RPC:erna med SECURITY
--      DEFINER, sina `set search_path`-värden, vem som får köra dem och ett
--      md5 på definitionen (def_md5). Spara resultatet och jämför med
--      sektion B efter 0006.
--      Sektion B visar att 0006 blev korrekt: (1) ingen SECURITY DEFINER-
--      funktion i public är körbar för anon/authenticated, (2) alla 16 finns
--      både i public och i private, (3) båda lagren syns sida vid sida.
-- ============================================================================


-- ============================================================================
-- SEKTION A — FÖRE 0006
--
-- Live-läget för de 16 publika funktionerna.
-- Förväntat: 16 rader. security_definer = true för alla, config visar
-- `search_path=public` för 14 och `search_path=` (tomt) för duel_cancel_queue
-- och duel_cancel_private. anon_can = false för alla UTOM leaderboard_get.
-- auth_can = true för alla 16.
--
-- def_md5 är md5 av pg_get_functiondef() — ett fingeravtryck av hela
-- definitionen inklusive schemanamn och set search_path. Det gör det möjligt
-- att jämföra före/efter (och mellan miljöer): public-raderna i sektion B ska
-- ha ett annat def_md5 än här (de är tunna wrappers), och private-raderna får
-- ett eget def_md5 eftersom både schemanamnet och `set search_path = ''`
-- ingår i definitionen — även när själva kroppen är oförändrad.
-- ============================================================================
select n.nspname                                        as schema,
       p.proname                                        as function,
       pg_get_function_identity_arguments(p.oid)         as args,
       p.prosecdef                                      as security_definer,
       array_to_string(p.proconfig, ',')                 as config,
       has_function_privilege('anon', p.oid, 'EXECUTE')  as anon_can,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can,
       md5(pg_get_functiondef(p.oid))                    as def_md5
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
        'duel_ensure_profile',
        'duel_join_queue',
        'duel_cancel_queue',
        'duel_start_bot_match',
        'duel_submit_answer',
        'duel_mark_finished',
        'duel_finish_bot',
        'duel_forfeit',
        'duel_claim_stall_win',
        'duel_create_private',
        'duel_join_private',
        'duel_cancel_private',
        'duel_submit_review',
        'leaderboard_submit',
        'leaderboard_get',
        'leaderboard_set_name'
      ])
order by p.proname;


-- ============================================================================
-- SEKTION B — EFTER 0006
-- Kör hela sektionen (B1-B3). Allt är read-only och ofarligt att köra om.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- B1) Kontroll: ska returnera 0 rader.
-- Letar efter SECURITY DEFINER-funktioner i public som fortfarande är
-- körbara för anon eller authenticated. 0 rader = implementationerna är
-- borta från public och endast de tunna SECURITY INVOKER-wrappers som
-- klienten använder ligger kvar där.
-- ----------------------------------------------------------------------------
select n.nspname as schema, p.proname as function,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
order by 2;

-- ----------------------------------------------------------------------------
-- B2) Kontroll: ska returnera 0 rader.
-- Varje rad = en förväntad funktion som saknas i public eller i private.
-- Kolumnen "saknas" säger vilket lager som saknas; "BADA saknas" betyder att
-- signaturen inte finns i något av schemana. 0 rader = alla 16 finns kvar i
-- public och har en motsvarande implementation i private.
-- ----------------------------------------------------------------------------
select e.name,
       e.argsig,
       case
         when to_regprocedure('public.'  || e.name || '(' || e.argsig || ')') is null
          and to_regprocedure('private.' || e.name || '(' || e.argsig || ')') is null
           then 'BADA saknas (public + private)'
         when to_regprocedure('public.'  || e.name || '(' || e.argsig || ')') is null
           then 'public saknas'
         else 'private saknas'
       end as saknas
from (values
        ('duel_ensure_profile',  'text'),
        ('duel_join_queue',      'text'),
        ('duel_cancel_queue',    ''),
        ('duel_start_bot_match', 'text'),
        ('duel_submit_answer',   'uuid, text, integer, boolean, integer'),
        ('duel_mark_finished',   'uuid, integer, integer'),
        ('duel_finish_bot',      'uuid, integer, integer, integer'),
        ('duel_forfeit',         'uuid'),
        ('duel_claim_stall_win', 'uuid'),
        ('duel_create_private',  ''),
        ('duel_join_private',    'text'),
        ('duel_cancel_private',  'uuid'),
        ('duel_submit_review',   'uuid, integer, text, text, text'),
        ('leaderboard_submit',   'text, integer'),
        ('leaderboard_get',      'text, integer'),
        ('leaderboard_set_name', 'text')
     ) as e(name, argsig)
where to_regprocedure('public.'  || e.name || '(' || e.argsig || ')') is null
   or to_regprocedure('private.' || e.name || '(' || e.argsig || ')') is null
order by e.name;

-- ----------------------------------------------------------------------------
-- B3) Översikt över båda lagren.
-- Samma kolumner som sektion A men över public + private.
-- Förväntat efter 0006:
--   * public:  security_definer = false (SECURITY INVOKER-wrapper),
--              config = '' (inga proconfig-poster),
--              anon_can = false (utom leaderboard_get), auth_can = true.
--   * private: security_definer = true, config = 'search_path=' (tomt) och
--              execute-grants som motsvarar implementationslagret
--              (authenticated, samt anon för leaderboard_get). Schemat private
--              är inte exponerat i API:t, så funktionerna nås bara via
--              wrappern — anon_can/auth_can här säger alltså inget om vad en
--              klient kan anropa direkt.
--              def_md5 är privatlagrets eget fingeravtryck (skiljer sig från
--              public-raden i sektion A eftersom schemanamn och search_path
--              ingår i definitionen).
-- ----------------------------------------------------------------------------
select n.nspname                                        as schema,
       p.proname                                        as function,
       pg_get_function_identity_arguments(p.oid)         as args,
       p.prosecdef                                      as security_definer,
       array_to_string(p.proconfig, ',')                 as config,
       has_function_privilege('anon', p.oid, 'EXECUTE')  as anon_can,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can,
       md5(pg_get_functiondef(p.oid))                    as def_md5
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.proname = any (array[
        'duel_ensure_profile',
        'duel_join_queue',
        'duel_cancel_queue',
        'duel_start_bot_match',
        'duel_submit_answer',
        'duel_mark_finished',
        'duel_finish_bot',
        'duel_forfeit',
        'duel_claim_stall_win',
        'duel_create_private',
        'duel_join_private',
        'duel_cancel_private',
        'duel_submit_review',
        'leaderboard_submit',
        'leaderboard_get',
        'leaderboard_set_name'
      ])
order by n.nspname, p.proname;

-- ----------------------------------------------------------------------------
-- B4. Kontroll: är `private` verkligen oexponerat?
-- Om pgrst.db_schemas är anpassat för rollen authenticator och innehåller fler
-- scheman än public, är antagandet bakom 0006 inte uppfyllt och då måste även
-- de schemana kontrolleras. 0 rader = standardvärdet gäller (public, storage,
-- graphql_public) och `private` är inte nåbart via API:et.
-- ----------------------------------------------------------------------------
select r.rolname as role, s.setconfig
from pg_catalog.pg_db_role_setting s
join pg_catalog.pg_roles r on r.oid = s.setrole
where array_to_string(s.setconfig, ',') ilike '%pgrst.db_schemas%';

-- ----------------------------------------------------------------------------
-- B5. Kontroll: kör SECURITY DEFINER fortfarande med rätt ägare?
-- Implementationerna körs som sin ägare. Ägaren måste vara samma roll som äger
-- tabellerna (annars slår RLS till och skrivningarna i duellerna misslyckas).
-- Alla funktioner och alla sex tabeller ska visa SAMMA ägare (postgres).
-- ----------------------------------------------------------------------------
select 'function' as kind,
       n.nspname || '.' || p.proname as object,
       pg_catalog.pg_get_userbyid(p.proowner) as owner
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.proname = any(array['duel_ensure_profile','duel_join_queue','duel_cancel_queue','duel_start_bot_match','duel_submit_answer','duel_mark_finished','duel_finish_bot','duel_forfeit','duel_claim_stall_win','duel_create_private','duel_join_private','duel_cancel_private','duel_submit_review','leaderboard_submit','leaderboard_get','leaderboard_set_name'])
union all
select 'table',
       c.relnamespace::regnamespace::text || '.' || c.relname,
       pg_catalog.pg_get_userbyid(c.relowner)
from pg_catalog.pg_class c
where c.relname in ('duel_matches','duel_answers','duel_queue','player_profiles','duel_reviews','leaderboard_entries')
order by 1, 2;

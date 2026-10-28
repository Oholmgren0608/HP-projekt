-- Rollback av 0029_studiehjalp_experter (Studiehjälp, Fas 1).
--
-- OBS: raderar allt som Studiehjälp har sparat – roller, flaggor, loggen,
-- expertansökningar, granskningsbeslut och expertprofiler. Kör bara om
-- funktionen ska tas bort helt. Filerna i bucketen expert-documents raderas
-- inte av SQL (Supabase kräver Storage-API:t): töm bucketen i Dashboard eller
-- via API innan bucketen tas bort, annars misslyckas sista raden.

begin;

drop function if exists public.admin_audit_recent(integer);
drop function if exists public.admin_flags();
drop function if exists public.expert_storage_orphans(integer);
drop function if exists public.expert_application_withdraw(uuid);
drop function if exists public.expert_document_confirmable(uuid);
drop function if exists public.admin_set_flag(text, text);
drop function if exists public.admin_revoke_role(uuid, text);
drop function if exists public.admin_grant_role(text, text);
drop function if exists public.admin_staff_list();
drop function if exists public.expert_search(text, text, text, integer, numeric, text, text, integer, integer);
drop function if exists public.expert_directory(uuid);
drop function if exists public.expert_profile_publish(boolean);
drop function if exists public.expert_profile_save(text, text, text, text, text, text[], text[], text[], text, integer, integer, integer, boolean, boolean);
drop function if exists public.expert_profile_mine();
drop function if exists public.expert_is_approved(uuid);
drop function if exists public.expert_documents_mark_deleted(uuid[]);
drop function if exists public.expert_documents_due(integer);
drop function if exists public.expert_document_open(uuid);
drop function if exists public.expert_application_decide(uuid, text, text, numeric, text, text, boolean, text, text);
drop function if exists public.expert_application_admin(uuid);
drop function if exists public.expert_queue(text);
drop function if exists public.expert_document_remove(uuid);
drop function if exists public.expert_document_begin(uuid, text, text, text, integer);
drop function if exists public.expert_application_mine();
drop function if exists public.expert_application_submit(uuid, boolean);
drop function if exists public.expert_application_save(uuid, text, numeric, text, text, text, boolean);
drop function if exists public.expert_application_editable(uuid);
drop function if exists public.expert_application_start(text);
drop function if exists public.studiehjalp_access();
drop function if exists public.flag_enabled(text);
drop function if exists public.audit_log_add(text, text, text, jsonb);
drop function if exists public.is_staff();
drop function if exists public.has_role(text);

drop table if exists public.expert_profiles;
drop table if exists public.expert_verification_reviews;
drop table if exists public.expert_documents;
drop table if exists public.expert_applications;
drop table if exists public.feature_flags;
drop table if exists public.admin_audit_log;
drop table if exists public.staff_roles;

delete from storage.buckets where id = 'expert-documents';

commit;

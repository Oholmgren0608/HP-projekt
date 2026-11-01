-- 0031: Gallring av expertansökningar och revisionsloggen.
--
-- Beslut (Oscar, 2026-11-01), åtgärderna A3 och A4 i
-- docs/juridik/dpia-studiehjalp-experter.md:
--   * Avslagna och tillbakadragna ansökningar raderas 12 månader efter
--     beslutet (eller efter tillbakadragandet).
--   * Utkast och ansökningar som väntar på komplettering raderas när de inte
--     har ändrats på 6 månader.
--   * Revisionsloggen sparas i 24 månader.
-- Godkända och spärrade ansökningar sparas så länge kontot finns: de visar
-- varför ett märke gavs respektive varför någon inte får söka igen.
--
-- Med ansökan försvinner dess granskningsbeslut och dokumentrader (on delete
-- cascade). En ansökan raderas bara när alla dess filer redan är borttagna ur
-- lagringen (deleted_at satt); underlagen gallras långt tidigare, senast 90
-- dagar efter uppladdning, av expert_documents_due i samma dagliga jobb.
--
-- Migrationen raderar ingenting själv. Gallringen körs av det dagliga
-- jobbet /api/cron/studiehjalp-purge via expert_retention_purge().

create index if not exists expert_applications_retention_idx
  on public.expert_applications (status, coalesce(decided_at, updated_at));
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at);

create or replace function public.expert_retention_purge()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applications integer;
  v_log integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  with gamla as (
    select a.id
      from public.expert_applications a
     where ((a.status in ('rejected', 'withdrawn')
             and coalesce(a.decided_at, a.updated_at) < now() - interval '12 months')
         or (a.status in ('draft', 'needs_completion')
             and a.updated_at < now() - interval '6 months'))
       and not exists (
         select 1 from public.expert_documents d
          where d.application_id = a.id and d.deleted_at is null
       )
  )
  delete from public.expert_applications a
   using gamla
   where a.id = gamla.id;
  get diagnostics v_applications = row_count;

  delete from public.admin_audit_log l
   where l.created_at < now() - interval '24 months';
  get diagnostics v_log = row_count;

  if v_applications > 0 or v_log > 0 then
    perform public.audit_log_add('retention_purged', 'expert_application', null,
      jsonb_build_object('applications', v_applications, 'audit_log_rows', v_log));
  end if;

  return jsonb_build_object('applications', v_applications, 'audit_log_rows', v_log);
end;
$$;

revoke all on function public.expert_retention_purge() from public, anon, authenticated;
grant execute on function public.expert_retention_purge() to service_role;

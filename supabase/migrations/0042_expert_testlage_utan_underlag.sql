-- 0042: testläge för expertansökningar utan ID-handling och bevis (Oscar,
-- 2026-11-13: "skapa en expertprofil utan att behöva ladda upp id eller bevis
-- ... sedan vill jag lägga tillbaka uppladdningsbeviset igen").
--
-- * Ny flagga experts_require_documents. "På" = som förut: ansökan kräver
--   resultatbesked/legitimation och ID-handling, och granskaren måste ha öppnat
--   dem och kryssat i identitetskontrollen innan godkännande. "Av" = testläge:
--   ansökan kan skickas in och godkännas utan underlag.
-- * Flaggan läggs in som "av" (testläge). Slå på den igen under Studiehjälp ->
--   Admin -> Flaggor; ändringen skrivs i revisionsloggen. Ingen migration behövs.
-- * Allt annat gäller som förut: bara teamet når Studiehjälp, ingen får granska
--   sin egen ansökan, och varje beslut skrivs i revisionsloggen (med
--   documents_required, så att beslut i testläge syns i efterhand).
--
-- Säkerhet (AGENTS.md regel 6): inga RLS-policyer, roller eller lagringsregler
-- ändras. Test: ~/.cache/hp-db-test/test-0042.mjs.

insert into public.feature_flags (key, mode, note) values
  ('experts_require_documents', 'off',
   'På: expertansökan kräver resultatbesked/legitimation och ID-handling. Av: testläge utan underlag.')
on conflict (key) do nothing;

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
  if public.flag_enabled('experts_require_documents') and (
     not exists (
       select 1 from public.expert_documents d
        where d.application_id = v_app.id and d.kind = v_required
          and d.status = 'uploaded' and d.deleted_at is null)
     or not exists (
       select 1 from public.expert_documents d
        where d.application_id = v_app.id and d.kind = 'identity'
          and d.status = 'uploaded' and d.deleted_at is null)) then
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
  -- Testläge (flaggan experts_require_documents av): ingen ID-handling eller
  -- inget bevis krävs, så identitet och visade underlag kontrolleras inte.
  v_documents boolean := public.flag_enabled('experts_require_documents');
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
    if v_documents and not coalesce(p_identity_checked, false) then
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
    if v_documents and exists (
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
      'check_type', v_check, 'review_id', v_review, 'documents_required', v_documents
    )
  );
end;
$$;

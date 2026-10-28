import { getSupabase } from "@/lib/supabase/client";
import {
  beginDocumentUpload,
  confirmDocumentUpload,
  openDocument,
  purgeDueDocuments,
  removeDocument,
  withdrawApplication as withdrawApplicationAction,
} from "@/app/studiehjalp/actions";
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  studiehjalpError,
  type AdminApplication,
  type AuditEntry,
  type Decision,
  type CheckType,
  type DocumentKind,
  type ExpertDirectoryEntry,
  type ExpertProfileRow,
  type ExpertSearchRow,
  type ExpertTrack,
  type FlagMode,
  type MyApplication,
  type QueueRow,
  type StaffMember,
  type StaffRole,
} from "./types";

/**
 * Klientens anrop till Studiehjälp: RPC:er i databasen (migration 0029) och
 * server actions för dokumenten. Alla returnerar { ok, data } eller { ok: false,
 * error } med en svensk felbeskrivning.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function fail<T>(raw: string | null | undefined): Result<T> {
  return { ok: false, error: studiehjalpError(raw) };
}

async function accessToken(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

async function rpc<T>(
  call: (supabase: NonNullable<ReturnType<typeof getSupabase>>) => PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>,
): Promise<Result<T>> {
  const supabase = getSupabase();
  if (!supabase) return fail("NOT_CONFIGURED");
  const { data, error } = await call(supabase);
  if (error) return fail(error.message);
  return { ok: true, data: data as T };
}

// ---------------------------------------------------------------- Ansökan

export function fetchMyApplications() {
  return rpc<MyApplication[]>((s) => s.rpc("expert_application_mine"));
}

export function startApplication(track: ExpertTrack) {
  return rpc<string>((s) => s.rpc("expert_application_start", { p_track: track }));
}

export function saveApplication(input: {
  id: string;
  legalName: string;
  claimedTotal: number | null;
  claimedTest: string;
  teacherSubjects: string;
  message: string;
  adultConfirmed: boolean;
}) {
  return rpc<null>((s) =>
    s.rpc("expert_application_save", {
      p_application_id: input.id,
      p_legal_name: input.legalName,
      p_claimed_total: input.claimedTotal,
      p_claimed_test: input.claimedTest,
      p_teacher_subjects: input.teacherSubjects,
      p_message: input.message,
      p_adult_confirmed: input.adultConfirmed,
    }),
  );
}

export function submitApplication(id: string, consent: boolean) {
  return rpc<null>((s) =>
    s.rpc("expert_application_submit", { p_application_id: id, p_consent: consent }),
  );
}

/** Drar tillbaka ansökan (och samtycket); underlagen raderas direkt. */
export async function withdrawApplication(id: string): Promise<Result<null>> {
  const res = await withdrawApplicationAction({ accessToken: await accessToken(), applicationId: id });
  return res.ok ? { ok: true, data: null } : fail(res.error);
}

/** Laddar upp ett underlag: registrera, ladda upp till signerad URL, bekräfta. */
export async function uploadDocument(input: {
  applicationId: string;
  kind: DocumentKind;
  file: File;
}): Promise<Result<null>> {
  const { file } = input;
  if (!(DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) return fail("INVALID_FILE_TYPE");
  if (file.size < 1 || file.size > DOCUMENT_MAX_BYTES) return fail("INVALID_FILE_SIZE");

  const supabase = getSupabase();
  if (!supabase) return fail("NOT_CONFIGURED");
  const token = await accessToken();

  const begun = await beginDocumentUpload({
    accessToken: token,
    applicationId: input.applicationId,
    kind: input.kind,
    fileName: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!begun.ok) return fail(begun.error);

  const uploaded = await supabase.storage
    .from("expert-documents")
    .uploadToSignedUrl(begun.path, begun.uploadToken, file, { contentType: file.type });
  if (uploaded.error) return fail("UPLOAD_FAILED");

  const confirmed = await confirmDocumentUpload({ accessToken: token, documentId: begun.documentId });
  if (!confirmed.ok) return fail(confirmed.error);
  return { ok: true, data: null };
}

export async function deleteDocument(documentId: string): Promise<Result<null>> {
  const res = await removeDocument({ accessToken: await accessToken(), documentId });
  return res.ok ? { ok: true, data: null } : fail(res.error);
}

// ---------------------------------------------------------------- Profil

export function fetchMyProfile() {
  return rpc<{ profile: ExpertProfileRow | null; approved: boolean }>((s) => s.rpc("expert_profile_mine"));
}

export type ProfileInput = {
  displayName: string;
  headline: string;
  bio: string;
  method: string;
  experience: string;
  subtests: string[];
  languages: string[];
  formats: string[];
  city: string;
  price30: number | null;
  price60: number | null;
  price90: number | null;
  freeConsultation: boolean;
  showHpScore: boolean;
};

export function saveProfile(p: ProfileInput) {
  return rpc<null>((s) =>
    s.rpc("expert_profile_save", {
      p_display_name: p.displayName,
      p_headline: p.headline,
      p_bio: p.bio,
      p_method: p.method,
      p_experience: p.experience,
      p_subtests: p.subtests,
      p_languages: p.languages,
      p_formats: p.formats,
      p_city: p.city,
      p_price_30: p.price30,
      p_price_60: p.price60,
      p_price_90: p.price90,
      p_free_consultation: p.freeConsultation,
      p_show_hp_score: p.showHpScore,
    }),
  );
}

export function setProfilePublished(published: boolean) {
  return rpc<null>((s) => s.rpc("expert_profile_publish", { p_published: published }));
}

// ---------------------------------------------------------------- Katalog

export type SearchFilters = {
  subtest: string | null;
  format: string | null;
  language: string | null;
  maxPrice: number | null;
  minHp: number | null;
  query: string;
  sort: "rotation" | "price" | "newest";
};

export function searchExperts(f: SearchFilters, limit = 30, offset = 0) {
  return rpc<ExpertSearchRow[]>((s) =>
    s.rpc("expert_search", {
      p_subtest: f.subtest,
      p_format: f.format,
      p_language: f.language,
      p_max_price: f.maxPrice,
      p_min_hp: f.minHp,
      p_query: f.query.trim() || null,
      p_sort: f.sort,
      p_limit: limit,
      p_offset: offset,
    }),
  );
}

export async function fetchExpert(publicId: string): Promise<Result<ExpertDirectoryEntry | null>> {
  const res = await rpc<ExpertDirectoryEntry[]>((s) => s.rpc("expert_directory", { p_public_id: publicId }));
  return res.ok ? { ok: true, data: res.data?.[0] ?? null } : res;
}

// ---------------------------------------------------------------- Granskning

export function fetchQueue(status: string) {
  return rpc<QueueRow[]>((s) => s.rpc("expert_queue", { p_status: status }));
}

export function fetchApplicationAdmin(id: string) {
  return rpc<AdminApplication>((s) => s.rpc("expert_application_admin", { p_application_id: id }));
}

export function decideApplication(input: {
  id: string;
  decision: Decision;
  checkType: CheckType | null;
  verifiedTotal: number | null;
  verifiedTest: string;
  verifiedSubjects: string;
  identityChecked: boolean;
  sourceRef: string;
  reason: string;
}) {
  return rpc<null>((s) =>
    s.rpc("expert_application_decide", {
      p_application_id: input.id,
      p_decision: input.decision,
      p_check_type: input.checkType,
      p_verified_total: input.verifiedTotal,
      p_verified_test: input.verifiedTest,
      p_verified_subjects: input.verifiedSubjects,
      p_identity_checked: input.identityChecked,
      p_source_ref: input.sourceRef,
      p_reason: input.reason,
    }),
  );
}

export async function openDocumentUrl(documentId: string): Promise<Result<string>> {
  const res = await openDocument({ accessToken: await accessToken(), documentId });
  return res.ok ? { ok: true, data: res.url } : fail(res.error);
}

export async function purgeDocuments(): Promise<Result<number>> {
  const res = await purgeDueDocuments({ accessToken: await accessToken() });
  return res.ok ? { ok: true, data: res.purged } : fail(res.error);
}

// ---------------------------------------------------------------- Admin

export function fetchStaff() {
  return rpc<StaffMember[]>((s) => s.rpc("admin_staff_list"));
}

export function grantRole(email: string, role: StaffRole) {
  return rpc<string>((s) => s.rpc("admin_grant_role", { p_email: email, p_role: role }));
}

export function revokeRole(userId: string, role: StaffRole) {
  return rpc<null>((s) => s.rpc("admin_revoke_role", { p_user_id: userId, p_role: role }));
}

export function fetchFlags() {
  return rpc<{ key: string; mode: FlagMode; note: string; updated_at: string }[]>((s) => s.rpc("admin_flags"));
}

export function setFlag(key: string, mode: FlagMode) {
  return rpc<null>((s) => s.rpc("admin_set_flag", { p_key: key, p_mode: mode }));
}

export function fetchAudit(limit = 100) {
  return rpc<AuditEntry[]>((s) => s.rpc("admin_audit_recent", { p_limit: limit }));
}

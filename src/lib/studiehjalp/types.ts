/**
 * Studiehjälp: typer, etiketter och felmeddelanden som delas av klienten och
 * serveråtgärderna. Datamodellen finns i supabase/migrations/0029.
 */

export type ExpertTrack = "hp" | "teacher";
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "needs_completion"
  | "approved"
  | "rejected"
  | "blocked"
  | "withdrawn";
export type DocumentKind = "hp_result" | "teacher_license" | "identity" | "other";
export type Decision = "approved" | "rejected" | "needs_completion" | "blocked";
export type CheckType = "document" | "live_portal" | "official_register";
export type FlagMode = "off" | "staff" | "on";
export type StaffRole =
  | "admin"
  | "verify_expert"
  | "view_sensitive_document"
  | "moderator"
  | "finance_admin"
  | "payout_admin";

export type ExpertDocument = {
  id: string;
  kind: DocumentKind;
  file_name: string;
  mime: string;
  size_bytes: number;
  created_at: string;
  deleted: boolean;
};

export type MyApplication = {
  id: string;
  track: ExpertTrack;
  status: ApplicationStatus;
  legal_name: string;
  claimed_total: number | null;
  claimed_test: string;
  teacher_subjects: string;
  message: string;
  adult_confirmed: boolean;
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  documents: ExpertDocument[];
  last_decision: { decision: Decision; reason: string; created_at: string } | null;
};

export type ExpertProfileRow = {
  user_id: string;
  public_id: string;
  display_name: string;
  headline: string;
  bio: string;
  method: string;
  experience: string;
  subtests: string[];
  languages: string[];
  formats: string[];
  city: string;
  price_30: number | null;
  price_60: number | null;
  price_90: number | null;
  free_consultation: boolean;
  show_hp_score: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
};

/** En expert i den publika katalogen, med märken framräknade ur granskningen. */
export type ExpertDirectoryEntry = {
  public_id: string;
  is_own: boolean;
  display_name: string;
  headline: string;
  bio: string;
  method: string;
  experience: string;
  subtests: string[];
  languages: string[];
  formats: string[];
  city: string;
  price_30: number | null;
  price_60: number | null;
  price_90: number | null;
  free_consultation: boolean;
  published: boolean;
  hp_check: CheckType | null;
  hp_total: number | null;
  hp_test: string | null;
  hp_checked_at: string | null;
  teacher_verified: boolean;
  teacher_subjects: string;
  teacher_checked_at: string | null;
  identity_checked: boolean;
  verified_at: string | null;
};

export type ExpertSearchRow = Pick<
  ExpertDirectoryEntry,
  | "public_id"
  | "display_name"
  | "headline"
  | "subtests"
  | "languages"
  | "formats"
  | "city"
  | "price_60"
  | "free_consultation"
  | "hp_check"
  | "hp_total"
  | "hp_test"
  | "teacher_verified"
  | "teacher_subjects"
  | "identity_checked"
  | "verified_at"
> & { total_count: number };

export type QueueRow = {
  id: string;
  user_id: string;
  track: ExpertTrack;
  status: ApplicationStatus;
  display_name: string;
  legal_name: string;
  claimed_total: number | null;
  claimed_test: string;
  teacher_subjects: string;
  submitted_at: string | null;
  decided_at: string | null;
  document_count: number;
};

export type AdminApplication = {
  id: string;
  user_id: string;
  track: ExpertTrack;
  status: ApplicationStatus;
  display_name: string;
  email: string | null;
  legal_name: string;
  claimed_total: number | null;
  claimed_test: string;
  teacher_subjects: string;
  message: string;
  adult_confirmed: boolean;
  consent_at: string | null;
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  is_own: boolean;
  documents: {
    id: string;
    kind: DocumentKind;
    file_name: string;
    mime: string;
    size_bytes: number;
    created_at: string;
    delete_after: string | null;
    deleted_at: string | null;
  }[];
  reviews: {
    decision: Decision;
    check_type: CheckType | null;
    verified_total: number | null;
    verified_test: string;
    verified_subjects: string;
    identity_checked: boolean;
    source_ref: string;
    reason: string;
    created_at: string;
    reviewer_name: string;
  }[];
};

export type StaffMember = { user_id: string; display_name: string; email: string; roles: StaffRole[] };

export type AuditEntry = {
  id: number;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export const TRACK_LABEL: Record<ExpertTrack, string> = {
  hp: "HP-expert",
  teacher: "Legitimerad lärare",
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Utkast",
  submitted: "Inskickad – granskas",
  needs_completion: "Komplettering behövs",
  approved: "Godkänd",
  rejected: "Avslagen",
  blocked: "Spärrad",
  withdrawn: "Tillbakadragen",
};

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  hp_result: "Resultatbesked från högskoleprovet",
  teacher_license: "Lärarlegitimation eller registerutdrag",
  identity: "ID-handling",
  other: "Övrigt underlag",
};

export const DECISION_LABEL: Record<Decision, string> = {
  approved: "Godkänn",
  needs_completion: "Begär komplettering",
  rejected: "Avslå",
  blocked: "Avslå och spärra",
};

export const CHECK_LABEL: Record<CheckType, string> = {
  document: "Officiellt resultatbesked granskat (dokument)",
  live_portal: "Resultatet visat live i den officiella tjänsten",
  official_register: "Kontrollerat i Skolverkets lärarregister",
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Admin (roller, flaggor, logg)",
  verify_expert: "Granskar expertansökningar",
  view_sensitive_document: "Får öppna känsliga dokument",
  moderator: "Moderator",
  finance_admin: "Ekonomi",
  payout_admin: "Utbetalningar",
};

export const FLAG_MODE_LABEL: Record<FlagMode, string> = {
  off: "Av",
  staff: "Bara teamet",
  on: "På för alla",
};

export const FORMAT_LABEL: Record<string, string> = {
  online: "Online",
  fysiskt: "På plats",
};

/** Godkända filtyper och maxstorlek (samma gränser som i databasen och bucketen). */
export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Lägsta HP-resultat för HP-experter (specen §1, §3.1). */
export const HP_THRESHOLD = 1.2;

const ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: "Du behöver logga in.",
  NOT_AVAILABLE: "Den här delen av Studiehjälp är inte öppen än.",
  FORBIDDEN: "Du saknar behörighet för det här.",
  NOT_FOUND: "Hittade inte det du letade efter.",
  NOT_EDITABLE: "Ansökan går inte att ändra just nu.",
  INVALID_TRACK: "Välj HP-expert eller legitimerad lärare.",
  BLOCKED: "Kontot är spärrat från att ansöka. Kontakta oss om du tror att det är fel.",
  ALREADY_APPROVED: "Du är redan godkänd på den vägen.",
  RATE_LIMITED: "Du har startat många ansökningar på kort tid. Försök igen senare.",
  CONSENT_REQUIRED: "Du behöver godkänna att vi behandlar dina uppgifter för granskningen.",
  ADULT_REQUIRED: "Du behöver vara minst 18 år.",
  NAME_REQUIRED: "Fyll i ditt namn som det står på handlingarna.",
  HP_DETAILS_REQUIRED: "Fyll i resultat och provtillfälle.",
  HP_BELOW_THRESHOLD: "Det krävs minst 1,20 i totalresultat.",
  TEACHER_DETAILS_REQUIRED: "Fyll i legitimation, behörighet och källa.",
  MISSING_DOCUMENTS: "Ladda upp de underlag som krävs (se listan).",
  INVALID_KIND: "Den typen av underlag hör inte till den här ansökan.",
  INVALID_FILE_TYPE: "Bara PDF, JPEG och PNG går att ladda upp.",
  INVALID_FILE_SIZE: "Filen får vara högst 10 MB.",
  TOO_MANY_DOCUMENTS: "Högst åtta underlag per ansökan.",
  FILE_MISMATCH: "Filen ser inte ut att vara en PDF, JPEG eller PNG.",
  UPLOAD_FAILED: "Uppladdningen misslyckades. Försök igen.",
  OWN_APPLICATION: "Du kan inte granska din egen ansökan.",
  DOCUMENTS_NOT_VIEWED:
    "Öppna både det obligatoriska underlaget och ID-handlingen innan du godkänner ansökan.",
  NOT_WITHDRAWABLE: "Ansökan kan inte dras tillbaka i sin nuvarande status.",
  INVALID_DECISION: "Välj ett beslut.",
  REASON_REQUIRED: "Skriv en motivering (minst tre tecken).",
  INVALID_TRANSITION: "Det beslutet går inte att fatta för ansökan i dess nuvarande status.",
  IDENTITY_REQUIRED: "Identiteten måste vara kontrollerad innan ansökan godkänns.",
  INVALID_CHECK_TYPE: "Välj hur HP-resultatet kontrollerades.",
  TEACHER_REGISTER_REQUIRED:
    "En lärare kan bara godkännas efter kontroll i Skolverkets lärarregister.",
  NO_APPLICATION: "Skicka in en expertansökan först.",
  NO_PROFILE: "Spara profilen först.",
  NOT_APPROVED: "Profilen kan publiceras först när ansökan är godkänd.",
  PROFILE_INCOMPLETE:
    "Fyll i rubrik, presentation (minst 20 tecken), minst ett delprov och hur du undervisar innan du publicerar.",
  INVALID_LANGUAGE: "Ett språk får vara högst 30 tecken.",
  INVALID_ROLE: "Okänd roll.",
  USER_NOT_FOUND: "Ingen användare med den e-postadressen.",
  LAST_ADMIN: "Den sista admin-rollen kan inte tas bort.",
  INVALID_MODE: "Okänt läge.",
  UNKNOWN_FLAG: "Okänd flagga.",
  NOT_CONFIGURED: "Servern saknar inställningar för Studiehjälp.",
};

/** Översätter en felkod från databasen eller servern till svensk text. */
export function studiehjalpError(raw: string | null | undefined): string {
  const text = raw ?? "";
  for (const [code, message] of Object.entries(ERRORS)) {
    if (text.includes(code)) return message;
  }
  if (/violates check constraint/.test(text)) return "Något fält har för lång eller ogiltig text.";
  return "Något gick fel. Försök igen.";
}

export function formatHp(total: number | null | undefined): string {
  if (total === null || total === undefined) return "";
  return Number(total).toFixed(2).replace(".", ",");
}

export function formatSek(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return `${new Intl.NumberFormat("sv-SE").format(value)} kr`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(iso));
}

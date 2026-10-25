"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, verifyReviewer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/paginate";
import {
  isProvfraga,
  PRACTICE_GROUP_ID,
  UNKNOWN_EXAM_GROUP_ID,
  type ReviewExamGroup,
  type ReviewQuestion,
} from "./types";

export type ReviewError =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "PROVFRAGA_LOCKED"
  | "UPSTREAM_ERROR";

export type ListResult =
  | { ok: true; groups: ReviewExamGroup[] }
  | { ok: false; error: ReviewError };

export type MutateResult = { ok: true } | { ok: false; error: ReviewError };

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type ExamRow = Database["public"]["Tables"]["exams"]["Row"];
type FlagRow = Pick<
  Database["public"]["Tables"]["question_flags"]["Row"],
  "question_id" | "reason" | "created_at"
>;

/** Figurerna ur UHR:s prov ligger i en privat bucket och visas via signerade länkar. */
const FIGURE_BUCKET = "prov-figures";
const FIGURE_URL_MARKER = `/storage/v1/object/public/${FIGURE_BUCKET}/`;
const SIGNED_URL_SECONDS = 4 * 60 * 60;

/** Alla server actions börjar här: verifiera token + e-post + admin-client. */
async function authorize(
  accessToken: string,
): Promise<{ ok: true; admin: AdminClient } | { ok: false; error: ReviewError }> {
  if (!accessToken) return { ok: false, error: "NOT_AUTHENTICATED" };
  const email = await verifyReviewer(accessToken);
  if (!email) return { ok: false, error: "NOT_AUTHORIZED" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "NOT_CONFIGURED" };
  return { ok: true, admin };
}

function toReviewQuestion(r: QuestionRow, reports: FlagRow[]): ReviewQuestion {
  return {
    id: r.id,
    kind: r.kind,
    prompt: r.prompt,
    passage: r.passage,
    options: Array.isArray(r.options) ? r.options : [],
    correctIndex: r.correct_index,
    explain: r.explain,
    examId: r.exam_id,
    examDate: r.exam_date,
    passNumber: r.pass_number,
    questionNumber: r.question_number,
    figureUrl: r.figure_url,
    sourceUrl: r.source_url,
    status: r.status,
    verification: r.verification,
    verificationNote: r.verification_note,
    openReports: reports.map((f) => ({ reason: f.reason, createdAt: f.created_at })),
  };
}

function compareQuestions(a: ReviewQuestion, b: ReviewQuestion): number {
  const ap = a.passNumber ?? Number.MAX_SAFE_INTEGER;
  const bp = b.passNumber ?? Number.MAX_SAFE_INTEGER;
  if (ap !== bp) return ap - bp;
  const aq = a.questionNumber ?? Number.MAX_SAFE_INTEGER;
  const bq = b.questionNumber ?? Number.MAX_SAFE_INTEGER;
  if (aq !== bq) return aq - bq;
  return a.id.localeCompare(b.id, "sv", { numeric: true });
}

function groupQuestions(
  questions: ReviewQuestion[],
  exams: Map<string, ExamRow>,
): ReviewExamGroup[] {
  const byExam = new Map<string, ReviewQuestion[]>();
  const practice: ReviewQuestion[] = [];

  for (const q of questions) {
    if (isProvfraga(q)) {
      const key = q.examId ?? UNKNOWN_EXAM_GROUP_ID;
      const arr = byExam.get(key) ?? [];
      arr.push(q);
      byExam.set(key, arr);
    } else {
      practice.push(q);
    }
  }

  const groups: ReviewExamGroup[] = [];

  for (const [examId, qs] of byExam) {
    const exam = exams.get(examId);
    const sorted = qs.slice().sort(compareQuestions);
    groups.push({
      examId,
      examDate: exam?.exam_date ?? sorted.find((q) => q.examDate)?.examDate ?? null,
      title:
        examId === UNKNOWN_EXAM_GROUP_ID
          ? "Förlagor: utan provtillhörighet"
          : `Förlagor: ${exam?.title ?? `Prov ${examId}`}`,
      questions: sorted,
    });
  }

  groups.sort((a, b) => {
    if (a.examDate == null && b.examDate == null) return a.examId.localeCompare(b.examId);
    if (a.examDate == null) return 1;
    if (b.examDate == null) return -1;
    return a.examDate.localeCompare(b.examDate);
  });

  // Övningsfrågorna är det som granskas och publiceras, så de visas först.
  if (practice.length > 0) {
    practice.sort(compareQuestions);
    groups.unshift({
      examId: PRACTICE_GROUP_ID,
      examDate: null,
      title: "Övningsfrågor",
      questions: practice,
    });
  }

  return groups;
}

function fetchAllQuestions(admin: AdminClient): Promise<QuestionRow[] | null> {
  return fetchAllPages((from, to) =>
    admin.from("questions").select("*", { count: "exact" }).order("id").range(from, to),
  );
}

/**
 * Felkoder för en tabell som inte finns: PostgREST (schema-cachen) och Postgres.
 * Innan migration 0017 är körd saknas question_flags; då finns inga rapporter
 * och granskningen ska fungera som förut i stället för att stanna.
 */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

async function fetchOpenReports(admin: AdminClient): Promise<FlagRow[] | null> {
  const probe = await admin
    .from("question_flags")
    .select("question_id", { count: "exact", head: true });
  if (probe.error) return MISSING_TABLE_CODES.has(probe.error.code) ? [] : null;
  // Primärnyckeln (question_id, user_id) gör sorteringen entydig mellan sidor.
  return fetchAllPages((from, to) =>
    admin
      .from("question_flags")
      .select("question_id, reason, created_at", { count: "exact" })
      .is("resolved_at", null)
      .order("created_at")
      .order("question_id")
      .order("user_id")
      .range(from, to),
  );
}

/** Byter publika figurlänkar mot tidsbegränsade signerade länkar. */
async function signFigureUrls(admin: AdminClient, questions: ReviewQuestion[]): Promise<void> {
  const pathOf = (url: string | null) => {
    const at = url ? url.indexOf(FIGURE_URL_MARKER) : -1;
    if (at < 0) return null;
    try {
      return decodeURIComponent(url!.slice(at + FIGURE_URL_MARKER.length));
    } catch {
      return null; // trasig länk: visas inte, men stoppar inte listan
    }
  };
  const paths = [...new Set(questions.map((q) => pathOf(q.figureUrl)).filter((p): p is string => !!p))];
  if (paths.length === 0) return;

  const signed = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 100) {
    const { data, error } = await admin.storage
      .from(FIGURE_BUCKET)
      .createSignedUrls(paths.slice(i, i + 100), SIGNED_URL_SECONDS);
    if (error) continue;
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }
  for (const q of questions) {
    const path = pathOf(q.figureUrl);
    if (!path) continue;
    q.figureUrl = signed.get(path) ?? null;
    if (!q.figureUrl) q.figureUnavailable = true;
  }
}

/** Hämtar alla frågor (oavsett status) med öppna felrapporter, grupperade per prov. */
export async function listAll(accessToken: string): Promise<ListResult> {
  const auth = await authorize(accessToken);
  if (!auth.ok) return auth;

  const [questionRows, reportRows, eRes] = await Promise.all([
    fetchAllQuestions(auth.admin),
    fetchOpenReports(auth.admin),
    auth.admin.from("exams").select("*"),
  ]);

  if (!questionRows || !reportRows || eRes.error) return { ok: false, error: "UPSTREAM_ERROR" };

  const reportsByQuestion = new Map<string, FlagRow[]>();
  for (const r of reportRows) {
    const arr = reportsByQuestion.get(r.question_id) ?? [];
    arr.push(r);
    reportsByQuestion.set(r.question_id, arr);
  }

  const questions = questionRows.map((r) => toReviewQuestion(r, reportsByQuestion.get(r.id) ?? []));
  await signFigureUrls(auth.admin, questions);
  const exams = new Map<string, ExamRow>(
    (eRes.data ?? []).map((e) => [e.id, e]),
  );

  return { ok: true, groups: groupQuestions(questions, exams) };
}

/** Id-listor delas upp så att filtret `in.(...)` inte gör URL:en för lång. */
const ID_CHUNK = 200;

function chunks(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) out.push(ids.slice(i, i + ID_CHUNK));
  return out;
}

/**
 * Provfrågor (exam_id satt eller id "hp-…") får aldrig publiceras – databasen
 * stoppar det också (villkoret i 0017).
 */
async function includesProvfraga(admin: AdminClient, ids: string[]): Promise<boolean | null> {
  for (const chunk of chunks(ids)) {
    const { data, error } = await admin
      .from("questions")
      .select("id")
      .in("id", chunk)
      .or("exam_id.not.is.null,id.like.hp-*")
      .limit(1);
    if (error) return null;
    if ((data ?? []).length > 0) return true;
  }
  return false;
}

export type SaveQuestionInput = {
  accessToken: string;
  id: string;
  prompt: string;
  passage: string | null;
  options: string[];
  correctIndex: number;
  explain: string;
  status?: string;
};

/** Sparar frågeinnehåll för en fråga, och sätter eventuellt ny status. */
export async function saveQuestion(input: SaveQuestionInput): Promise<MutateResult> {
  const auth = await authorize(input.accessToken);
  if (!auth.ok) return auth;

  const prompt = input.prompt.trim();
  const options = input.options;
  const correctIndex = input.correctIndex;

  if (!input.id || !prompt) return { ok: false, error: "INVALID_INPUT" };
  if (!Array.isArray(options) || options.length < 2) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (!options.every((o) => typeof o === "string" && o.trim().length > 0)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const update: {
    prompt: string;
    passage: string | null;
    options: string[];
    correct_index: number;
    explain: string;
    verification?: null;
    verification_note?: null;
    status?: string;
  } = {
    prompt,
    passage: input.passage && input.passage.trim() ? input.passage : null,
    options,
    correct_index: correctIndex,
    explain: input.explain,
  };

  // En handredigerad fråga har inte gått igenom andra kontrollen i sin nya
  // form: "ense" gäller inte längre, så den publiceras en och en.
  const { data: current, error: readError } = await auth.admin
    .from("questions")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (readError) return { ok: false, error: "UPSTREAM_ERROR" };
  if (!current) return { ok: false, error: "INVALID_INPUT" };
  // Jämför utan blanksteg i kanterna: formuläret trimmar, så en lagrad text
  // med ett avslutande blanksteg är ingen ändring.
  const same = (a: string | null | undefined, b: string | null | undefined) =>
    (a ?? "").trim() === (b ?? "").trim();
  const contentChanged =
    !same(current.prompt, update.prompt) ||
    !same(current.passage, update.passage) ||
    current.options.length !== update.options.length ||
    current.options.some((o, i) => !same(o, update.options[i])) ||
    current.correct_index !== update.correct_index ||
    !same(current.explain, update.explain);
  // Kolumnerna finns först efter migration 0017.
  if (contentChanged && "verification" in current) {
    update.verification = null;
    update.verification_note = null;
  }
  if (input.status === "published" || input.status === "rejected" || input.status === "draft") {
    update.status = input.status;
  }
  if (update.status === "published") {
    const locked = await includesProvfraga(auth.admin, [input.id]);
    if (locked === null) return { ok: false, error: "UPSTREAM_ERROR" };
    if (locked) return { ok: false, error: "PROVFRAGA_LOCKED" };
  }

  const { error } = await auth.admin
    .from("questions")
    .update(update)
    .eq("id", input.id);

  if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  revalidatePath("/review");
  return { ok: true };
}

/**
 * Sätter status (draft/published/rejected) på en eller flera frågor. När en
 * fråga publiceras igen löser databasen dess öppna felrapporter (trigger i 0017).
 */
export async function setStatus(input: {
  accessToken: string;
  ids: string[];
  status: string;
}): Promise<MutateResult> {
  const auth = await authorize(input.accessToken);
  if (!auth.ok) return auth;

  if (!["draft", "published", "rejected"].includes(input.status)) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const ids = (input.ids ?? []).filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return { ok: false, error: "INVALID_INPUT" };
  if (input.status === "published") {
    const locked = await includesProvfraga(auth.admin, ids);
    if (locked === null) return { ok: false, error: "UPSTREAM_ERROR" };
    if (locked) return { ok: false, error: "PROVFRAGA_LOCKED" };
  }

  for (const chunk of chunks(ids)) {
    const { error } = await auth.admin
      .from("questions")
      .update({ status: input.status })
      .in("id", chunk);
    if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  }
  revalidatePath("/review");
  return { ok: true };
}

/**
 * Markerar en frågas öppna felrapporter som hanterade, för en publicerad fråga
 * som granskaren har rättat eller bedömt som korrekt. (När en fråga publiceras
 * igen stänger databasen rapporterna själv.)
 */
export async function resolveReports(input: {
  accessToken: string;
  questionId: string;
}): Promise<MutateResult> {
  const auth = await authorize(input.accessToken);
  if (!auth.ok) return auth;
  if (!input.questionId) return { ok: false, error: "INVALID_INPUT" };

  const { error } = await auth.admin
    .from("question_flags")
    .update({ resolved_at: new Date().toISOString() })
    .eq("question_id", input.questionId)
    .is("resolved_at", null);

  if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  revalidatePath("/review");
  return { ok: true };
}

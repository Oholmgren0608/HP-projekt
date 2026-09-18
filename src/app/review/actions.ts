"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, verifyReviewer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/client";
import type { ReviewExamGroup, ReviewQuestion } from "./types";

export type ReviewError =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "UPSTREAM_ERROR";

export type ListResult =
  | { ok: true; groups: ReviewExamGroup[] }
  | { ok: false; error: ReviewError };

export type MutateResult = { ok: true } | { ok: false; error: ReviewError };

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type ExamRow = Database["public"]["Tables"]["exams"]["Row"];

/** Alla server actions börjar här: verifiera token + e-post + admin-client. */
async function authorize(
  accessToken: string,
): Promise<
  { ok: true; admin: NonNullable<ReturnType<typeof createAdminClient>> } | { ok: false; error: ReviewError }
> {
  if (!accessToken) return { ok: false, error: "NOT_AUTHENTICATED" };
  const email = await verifyReviewer(accessToken);
  if (!email) return { ok: false, error: "NOT_AUTHORIZED" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "NOT_CONFIGURED" };
  return { ok: true, admin };
}

function toReviewQuestion(r: QuestionRow): ReviewQuestion {
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
  };
}

function compareQuestions(a: ReviewQuestion, b: ReviewQuestion): number {
  const ap = a.passNumber ?? Number.MAX_SAFE_INTEGER;
  const bp = b.passNumber ?? Number.MAX_SAFE_INTEGER;
  if (ap !== bp) return ap - bp;
  const aq = a.questionNumber ?? Number.MAX_SAFE_INTEGER;
  const bq = b.questionNumber ?? Number.MAX_SAFE_INTEGER;
  if (aq !== bq) return aq - bq;
  return a.id.localeCompare(b.id);
}

function groupQuestions(
  questions: ReviewQuestion[],
  exams: Map<string, ExamRow>,
): ReviewExamGroup[] {
  const byExam = new Map<string, ReviewQuestion[]>();
  const legacy: ReviewQuestion[] = [];

  for (const q of questions) {
    if (q.examId) {
      const arr = byExam.get(q.examId) ?? [];
      arr.push(q);
      byExam.set(q.examId, arr);
    } else {
      legacy.push(q);
    }
  }

  const groups: ReviewExamGroup[] = [];

  for (const [examId, qs] of byExam) {
    const exam = exams.get(examId);
    const sorted = qs.slice().sort(compareQuestions);
    groups.push({
      examId,
      examDate: exam?.exam_date ?? sorted.find((q) => q.examDate)?.examDate ?? null,
      title: exam?.title ?? `Prov ${examId}`,
      examStatus: exam?.status ?? "imported",
      questions: sorted,
    });
  }

  if (legacy.length > 0) {
    legacy.sort(compareQuestions);
    groups.push({
      examId: "__legacy__",
      examDate: null,
      title: "Utan provtillhörighet",
      examStatus: "imported",
      questions: legacy,
    });
  }

  groups.sort((a, b) => {
    if (a.examDate == null && b.examDate == null) return a.examId.localeCompare(b.examId);
    if (a.examDate == null) return 1; // legacy sist
    if (b.examDate == null) return -1;
    return a.examDate.localeCompare(b.examDate);
  });

  return groups;
}

/** Hämtar alla frågor (oavsett status), grupperade per prov. */
export async function listAll(accessToken: string): Promise<ListResult> {
  const auth = await authorize(accessToken);
  if (!auth.ok) return auth;

  const [qRes, eRes] = await Promise.all([
    auth.admin.from("questions").select("*"),
    auth.admin.from("exams").select("*"),
  ]);

  if (qRes.error || eRes.error) return { ok: false, error: "UPSTREAM_ERROR" };

  const questions = (qRes.data ?? []).map(toReviewQuestion);
  const exams = new Map<string, ExamRow>(
    (eRes.data ?? []).map((e) => [e.id, e]),
  );

  return { ok: true, groups: groupQuestions(questions, exams) };
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
    status?: string;
  } = {
    prompt,
    passage: input.passage && input.passage.trim() ? input.passage : null,
    options,
    correct_index: correctIndex,
    explain: input.explain,
  };
  if (input.status === "published" || input.status === "rejected" || input.status === "draft") {
    update.status = input.status;
  }

  const { error } = await auth.admin
    .from("questions")
    .update(update)
    .eq("id", input.id);

  if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  revalidatePath("/review");
  return { ok: true };
}

/** Sätter status (draft/published/rejected) på en eller flera frågor. */
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

  const { error } = await auth.admin
    .from("questions")
    .update({ status: input.status })
    .in("id", ids);

  if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  revalidatePath("/review");
  return { ok: true };
}

/** Publicerar ett prov (exams.status = 'published'). */
export async function publishExam(input: {
  accessToken: string;
  examId: string;
}): Promise<MutateResult> {
  const auth = await authorize(input.accessToken);
  if (!auth.ok) return auth;

  if (!input.examId || input.examId === "__legacy__") {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const { error } = await auth.admin
    .from("exams")
    .update({ status: "published" })
    .eq("id", input.examId);

  if (error) return { ok: false, error: "UPSTREAM_ERROR" };
  revalidatePath("/review");
  return { ok: true };
}

import fallbackBank from "@/lib/content/fallback-bank.json";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchAllPages } from "@/lib/supabase/paginate";
import type { ChoiceQuestion, ReflectPrompt } from "@/lib/practice-types";

/**
 * Runtime-"source of truth" för övningsfrågorna.
 *
 * Databasen (`questions` / `reflect_prompts`) är sanningen: frågor skapas som
 * utkast, granskas på /review och publiceras där. När Supabase är konfigurerat
 * hämtas de publicerade frågorna en gång per sidladdning och cachelagras i
 * localStorage. Vid fel, tomt resultat eller utan Supabase används den bundlade
 * banken (`fallback-bank.json`) så att appen fungerar offline. Den filen
 * genereras från databasen med `npm run fragebank:export` och redigeras inte
 * för hand.
 */

export type QuestionBank = {
  questions: ChoiceQuestion[];
  reflect: ReflectPrompt[];
};

/**
 * v3 sedan 0017: en äldre cache (v2) kan innehålla frågor som inte längre får
 * visas (utkast eller provfrågor från före migrationen) och tas bort.
 */
const CACHE_KEY = "hp-lift-questions-v3";
const LEGACY_CACHE_KEYS = ["hp-lift-questions-v2"];

/** Bara det appen visar – granskningsdata som andra kontrollens anteckningar hämtas inte. */
const QUESTION_COLUMNS = "id, kind, prompt, passage, options, correct_index, explain, figure_url";

const QUESTION_KINDS: ChoiceQuestion["kind"][] = [
  "ord",
  "mek",
  "las",
  "elf",
  "dtk",
  "xyz",
  "kva",
  "nog",
];

let bank: QuestionBank | null = null;
let loadPromise: Promise<QuestionBank> | null = null;
/** Varifrån den laddade banken kom; "database" betyder exakt det som är publicerat nu. */
let bankSource: "database" | "cache" | "fallback" | null = null;

let fallback: QuestionBank | null = null;

/** Den bundlade banken, validerad med samma regler som cachen. */
function getFallback(): QuestionBank {
  if (!fallback) {
    fallback = {
      questions: (fallbackBank.questions as unknown[]).filter(isChoiceQuestion),
      reflect: (fallbackBank.reflect as unknown[]).filter(isReflectPrompt),
    };
  }
  return fallback;
}

/** Bundlade reflektionsfrågor, för när databasen saknar egna. */
export function getFallbackReflectPrompts(): ReflectPrompt[] {
  return getFallback().reflect;
}

// ---- Row-mappning (Supabase) ----------------------------------------------

function isString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === "string");
}

function questionFromRow(row: Record<string, unknown>): ChoiceQuestion | null {
  const {
    id,
    kind,
    prompt,
    passage,
    options,
    correct_index,
    explain,
    figure_url,
  } = row;
  const valid =
    isString(id) &&
    isString(kind) &&
    QUESTION_KINDS.includes(kind as ChoiceQuestion["kind"]) &&
    isString(prompt) &&
    isString(explain) &&
        isStringArray(options) &&
    typeof correct_index === "number" &&
    Number.isInteger(correct_index) &&
    correct_index >= 0 &&
    correct_index < options.length &&
    (passage === null || passage === undefined || typeof passage === "string");
  if (!valid) {
    console.warn("[questions] Hoppar över ogiltig frågerad:", row);
    return null;
  }
  return {
    id: id as string,
    kind: kind as ChoiceQuestion["kind"],
    prompt: prompt as string,
    passage: typeof passage === "string" ? passage : undefined,
    options: options as string[],
    correctIndex: correct_index as number,
    explain: explain as string,
    figureUrl: typeof figure_url === "string" ? figure_url : undefined,
  };
}

function reflectFromRow(row: Record<string, unknown>): ReflectPrompt | null {
  const { id, title, prompts } = row;
  if (!isString(id) || !isString(title) || !isStringArray(prompts)) {
    console.warn("[questions] Hoppar över ogiltig reflektion:", row);
    return null;
  }
  return { id: id as string, title: title as string, prompts: prompts as string[] };
}

// ---- localStorage-cache ----------------------------------------------------

type CacheEntry = {
  fetchedAt?: number;
  questions?: unknown;
  reflect?: unknown;
};

function isChoiceQuestion(q: unknown): q is ChoiceQuestion {
  if (!q || typeof q !== "object") return false;
  const o = q as Record<string, unknown>;
  return (
    isString(o.id) &&
    isString(o.kind) &&
    isString(o.prompt) &&
    isString(o.explain) &&
        isStringArray(o.options) &&
    typeof o.correctIndex === "number" &&
    Number.isInteger(o.correctIndex) &&
    o.correctIndex >= 0 &&
    o.correctIndex < o.options.length &&
    QUESTION_KINDS.includes(o.kind as ChoiceQuestion["kind"]) &&
    (o.passage === undefined || typeof o.passage === "string")
  );
}

function isReflectPrompt(r: unknown): r is ReflectPrompt {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return isString(o.id) && isString(o.title) && isStringArray(o.prompts);
}

function readCache(): QuestionBank | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.reflect)) {
      return null;
    }
    const questions = (parsed.questions as unknown[])
      .filter(isChoiceQuestion)
      .map((q) => q as ChoiceQuestion);
    const reflect = (parsed.reflect as unknown[])
      .filter(isReflectPrompt)
      .map((r) => r as ReflectPrompt);
    if (questions.length === 0) return null;
    return { questions, reflect };
  } catch {
    return null;
  }
}

function writeCache(value: QuestionBank): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_CACHE_KEYS) window.localStorage.removeItem(key);
    const entry: CacheEntry & { fetchedAt: number } = {
      fetchedAt: Date.now(),
      questions: value.questions,
      reflect: value.reflect,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore — cache är bara en optimering.
  }
}

// ---- Laddning --------------------------------------------------------------

/**
 * Hämtar alla publicerade frågor sida för sida (sorterade på id så att
 * sidorna inte överlappar). Utan sidindelning kapas banken tyst vid radtaket.
 */
async function fetchPublishedQuestionRows(): Promise<{
  rows: Record<string, unknown>[];
  error: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: true };
  const rows = await fetchAllPages((from, to) =>
    supabase
      .from("questions")
      .select(QUESTION_COLUMNS, { count: "exact" })
      .eq("status", "published")
      .order("id")
      .range(from, to),
  );
  return rows ? { rows: rows as Record<string, unknown>[], error: false } : { rows: [], error: true };
}

/**
 * Id och delprov för alla frågor som är publicerade just nu, direkt från
 * databasen (dueller: båda spelarna väljer ur samma aktuella lista även om
 * deras sidor laddades vid olika tidpunkter). Null utan Supabase eller vid fel.
 */
export async function fetchPublishedQuestionIds(
  kinds: readonly ChoiceQuestion["kind"][],
): Promise<{ id: string; kind: string }[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    return await fetchAllPages((from, to) =>
      supabase
        .from("questions")
        .select("id, kind", { count: "exact" })
        .eq("status", "published")
        .in("kind", [...kinds])
        .order("id")
        .range(from, to),
    );
  } catch {
    return null;
  }
}

/** Publicerade frågor med givna id:n, för frågor som publicerats efter sidladdningen. */
export async function fetchPublishedQuestionsByIds(
  ids: readonly string[],
): Promise<ChoiceQuestion[]> {
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("questions")
      .select(QUESTION_COLUMNS)
      .eq("status", "published")
      .in("id", [...ids]);
    if (error) return [];
    return ((data ?? []) as Record<string, unknown>[])
      .map(questionFromRow)
      .filter((q): q is ChoiceQuestion => q !== null);
  } catch {
    return [];
  }
}

/** Sant när banken laddades från databasen, alltså är exakt det som är publicerat nu. */
export function isBankFromDatabase(): boolean {
  return bankSource === "database";
}

/**
 * Laddar frågebanken en gång per sidladdning (modul-singleton). Resolverar
 * alltid — fallback-banken garanterar att appen fungerar även utan nätverk
 * eller Supabase.
 */
export function loadQuestions(): Promise<QuestionBank> {
  if (bank) return Promise.resolve(bank);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const [questionsRes, reflectRes] = await Promise.all([
            fetchPublishedQuestionRows(),
            supabase.from("reflect_prompts").select("*"),
          ]);

          const qRows = questionsRes.rows;
          const rRows = (reflectRes.data ?? []) as Record<string, unknown>[];

          if (!questionsRes.error && !reflectRes.error && qRows.length > 0) {
            const next: QuestionBank = {
              questions: qRows
                .map(questionFromRow)
                .filter((q): q is ChoiceQuestion => q !== null),
              reflect: rRows
                .map(reflectFromRow)
                .filter((r): r is ReflectPrompt => r !== null),
            };
            writeCache(next);
            bank = next;
            bankSource = "database";
            return next;
          }
        } catch (err) {
          console.warn("[questions] Supabase-hämtning misslyckades — använder fallback:", err);
        }
      }
    }

    const cached = readCache();
    if (cached) {
      bank = cached;
      bankSource = "cache";
      return cached;
    }

    bank = getFallback();
    bankSource = "fallback";
    return bank;
  })();

  return loadPromise;
}

/**
 * Synkron accessor för befintliga sync-kodvägar: returnerar den laddade banken
 * eller fallback om inget laddats ännu.
 */
export function getQuestionBankSync(): QuestionBank {
  return bank ?? getFallback();
}

export function getQuestions(): ChoiceQuestion[] {
  return getQuestionBankSync().questions;
}

export function getReflectPrompts(): ReflectPrompt[] {
  return getQuestionBankSync().reflect;
}

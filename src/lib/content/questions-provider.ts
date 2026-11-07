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
 * för hand. Den är 2,6 MB och laddas därför som en egen chunk först när den
 * behövs, inte på varje sida.
 */

export type QuestionBank = {
  questions: ChoiceQuestion[];
  reflect: ReflectPrompt[];
};

/**
 * v4 sedan 0035/0036: äldre cacher (v2, v3) kan innehålla frågor som inte längre
 * får visas – utkast och provfrågor (före 0017) eller spelpoolens frågor med
 * facit (före 0036) – och tas bort.
 */
const CACHE_KEY = "hp-lift-questions-v4";
const LEGACY_CACHE_KEYS = ["hp-lift-questions-v2", "hp-lift-questions-v3"];

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
let fallbackPromise: Promise<QuestionBank> | null = null;

const EMPTY_BANK: QuestionBank = { questions: [], reflect: [] };

/** Den bundlade banken, validerad med samma regler som cachen. */
function loadFallback(): Promise<QuestionBank> {
  if (fallback) return Promise.resolve(fallback);
  fallbackPromise ??= import("@/lib/content/fallback-bank.json").then((mod) => {
    const data = mod.default;
    fallback = {
      questions: (data.questions as unknown[]).filter(isChoiceQuestion),
      reflect: (data.reflect as unknown[]).filter(isReflectPrompt),
    };
    return fallback;
  }).catch((err) => {
    // Chunken kunde inte hämtas (t.ex. offline innan den cachats). Försök igen nästa gång.
    console.warn("[questions] Kunde inte ladda den bundlade banken:", err);
    fallbackPromise = null;
    return EMPTY_BANK;
  });
  return fallbackPromise;
}

/**
 * Bundlade reflektionsfrågor, för när databasen saknar egna. `loadQuestions()`
 * laddar dem i så fall, så de finns här när banken är klar.
 */
export function getFallbackReflectPrompts(): ReflectPrompt[] {
  return fallback?.reflect ?? [];
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
    // Äldre cacher kan innehålla spelpoolens frågor med facit; ta bort dem
    // även när databasen inte svarar (writeCache körs då aldrig).
    for (const key of LEGACY_CACHE_KEYS) window.localStorage.removeItem(key);
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
 * Längsta tid som databasen får på sig innan övningen startar med cachen eller
 * den bundlade banken. En hel nedladdning tar normalt några sekunder.
 */
const BANK_DEADLINE_MS = 8_000;

/**
 * Hämtar alla publicerade frågor sida för sida (sorterade på id så att
 * sidorna inte överlappar). Utan sidindelning kapas banken tyst vid radtaket.
 * Inga automatiska omförsök: utan nät ska reservbanken användas direkt.
 */
async function fetchPublishedQuestionRows(signal: AbortSignal): Promise<{
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
      .range(from, to)
      .retry(false)
      .abortSignal(signal),
  );
  return rows ? { rows: rows as Record<string, unknown>[], error: false } : { rows: [], error: true };
}

/** Banken från databasen, eller null om den inte gick att hämta. */
async function fetchBankFromDatabase(signal: AbortSignal): Promise<QuestionBank | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const [questionsRes, reflectRes] = await Promise.all([
    fetchPublishedQuestionRows(signal),
    supabase.from("reflect_prompts").select("*").retry(false).abortSignal(signal),
  ]);
  const qRows = questionsRes.rows;
  if (questionsRes.error || reflectRes.error || qRows.length === 0) return null;
  const rRows = (reflectRes.data ?? []) as Record<string, unknown>[];
  return {
    questions: qRows.map(questionFromRow).filter((q): q is ChoiceQuestion => q !== null),
    reflect: rRows.map(reflectFromRow).filter((r): r is ReflectPrompt => r !== null),
  };
}

/**
 * Kör `work` men ger upp efter `ms`: anropen avbryts och resultatet blir null.
 * Den yttre gränsen behövs eftersom en utgången session kan hänga i
 * token-förnyelsen innan själva anropet (och dess abort-signal) ens startar.
 */
async function withDeadline<T>(
  work: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, ms);
  });
  try {
    return await Promise.race([work(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
  }
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
      try {
        const next = await withDeadline(fetchBankFromDatabase, BANK_DEADLINE_MS);
        if (next) {
          if (next.reflect.length === 0) await loadFallback();
          writeCache(next);
          bank = next;
          bankSource = "database";
          return next;
        }
      } catch (err) {
        console.warn("[questions] Supabase-hämtning misslyckades — använder fallback:", err);
      }
    }

    const cached = readCache();
    if (cached) {
      if (cached.reflect.length === 0) await loadFallback();
      bank = cached;
      bankSource = "cache";
      return cached;
    }

    bank = await loadFallback();
    bankSource = "fallback";
    return bank;
  })();

  return loadPromise;
}

/**
 * Synkron accessor för befintliga sync-kodvägar: returnerar den laddade banken,
 * eller en tom bank om `loadQuestions()` inte är klar än.
 */
export function getQuestionBankSync(): QuestionBank {
  return bank ?? EMPTY_BANK;
}

export function getQuestions(): ChoiceQuestion[] {
  return getQuestionBankSync().questions;
}

export function getReflectPrompts(): ReflectPrompt[] {
  return getQuestionBankSync().reflect;
}

import {
  DTK_BANK,
  ELF_BANK,
  LAS_BANK,
  ORD_BANK,
  REFLECT_BANK,
} from "@/lib/practice";
import { MEK_BANK } from "@/lib/practice-mek";
import { KVA_BANK, NOG_BANK, XYZ_BANK } from "@/lib/practice-kvant";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ChoiceQuestion, ReflectPrompt } from "@/lib/practice-types";

/**
 * Runtime-"source of truth" för övningsfrågorna.
 *
 * Frågorna kan ligga i Supabase (`questions` / `reflect_prompts`) och redigeras
 * från dashboarden. När Supabase är konfigurerat hämtas de en gång per sidladdning
 * och cachelagras i localStorage. Vid fel, tomt resultat eller utan Supabase
 * används den bundlade statiska banken som fallback, så appen fungerar offline.
 */

export type QuestionBank = {
  questions: ChoiceQuestion[];
  reflect: ReflectPrompt[];
};

const CACHE_KEY = "hp-lift-questions-v1";

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

let fallback: QuestionBank | null = null;

/** Den bundlade statiska banken (146 frågor + 3 reflektioner). Byggs lazily
 *  för att undvika cirkulär import mot practice.ts vid modul-initiering. */
function getFallback(): QuestionBank {
  if (!fallback) {
    fallback = {
      questions: [
        ...ORD_BANK,
        ...MEK_BANK,
        ...LAS_BANK,
        ...ELF_BANK,
        ...DTK_BANK,
        ...XYZ_BANK,
        ...KVA_BANK,
        ...NOG_BANK,
      ],
      reflect: REFLECT_BANK,
    };
  }
  return fallback;
}

// ---- Row-mappning (Supabase) ----------------------------------------------

function isString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === "string");
}

function questionFromRow(row: Record<string, unknown>): ChoiceQuestion | null {
  const { id, kind, prompt, passage, options, correct_index, explain } = row;
  const valid =
    isString(id) &&
    isString(kind) &&
    QUESTION_KINDS.includes(kind as ChoiceQuestion["kind"]) &&
    isString(prompt) &&
    isString(explain) &&
    isStringArray(options) &&
    Number.isInteger(correct_index) &&
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
    Number.isInteger(o.correctIndex) &&
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
            supabase.from("questions").select("*"),
            supabase.from("reflect_prompts").select("*"),
          ]);

          const qRows = (questionsRes.data ?? []) as Record<string, unknown>[];
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
      return cached;
    }

    bank = getFallback();
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

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ExamRecord } from "@/lib/practice-types";

/**
 * Runtime-"source of truth" för importerade prov (`public.exams`).
 *
 * Hämtas en gång per sidladdning (modul-singleton). Vid fel, utan Supabase
 * eller tomt resultat returneras en tom lista — appen fortsätter fungera och
 * examens-vyn faller tillbaka på sina "inga importerade prov"-tillstånd.
 * Till skillnad från frågebanken finns ingen bundlad fallback: importerade prov
 * existerar bara i Supabase.
 */

let exams: ExamRecord[] | null = null;
let loadPromise: Promise<ExamRecord[]> | null = null;

function isString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function examFromRow(row: Record<string, unknown>): ExamRecord | null {
  const { id, exam_date, title, status } = row;
  if (!isString(id) || !isString(exam_date) || !isString(title)) {
    console.warn("[exams] Hoppar över ogiltig provrad:", row);
    return null;
  }
  return {
    id: id as string,
    examDate: exam_date as string,
    title: title as string,
    status: typeof status === "string" ? status : "imported",
  };
}

/** Laddar provlistan en gång per sidladdning. Resolverar alltid (tom lista vid fel). */
export function loadExams(): Promise<ExamRecord[]> {
  if (exams) return Promise.resolve(exams);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const res = await supabase
            .from("exams")
            .select("*")
            .order("exam_date", { ascending: false });

          if (!res.error) {
            const rows = (res.data ?? []) as Record<string, unknown>[];
            const next = rows
              .map(examFromRow)
              .filter((e): e is ExamRecord => e !== null);
            exams = next;
            return next;
          }
          console.warn("[exams] Supabase-fråga misslyckades:", res.error);
        } catch (err) {
          console.warn("[exams] Supabase-hämtning misslyckades — tom lista:", err);
        }
      }
    }

    exams = [];
    return [];
  })();

  return loadPromise;
}

/** Synkron accessor: returnerar den laddade listan eller tom lista. */
export function getExamsSync(): ExamRecord[] {
  return exams ?? [];
}

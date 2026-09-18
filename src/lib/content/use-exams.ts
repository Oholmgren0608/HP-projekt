"use client";

import { useEffect, useState } from "react";
import { loadExams } from "@/lib/content/exams-provider";
import type { ExamRecord } from "@/lib/practice-types";

/**
 * Triggar `loadExams()` en gång vid mount och exponerar `exams` + `ready`.
 * Vid fel eller utan Supabase blir listan tom — komponenter visar då sitt
 * "inga importerade prov"-tillstånd.
 */
export function useExams(): { exams: ExamRecord[]; ready: boolean } {
  const [state, setState] = useState<{ exams: ExamRecord[]; ready: boolean }>({
    exams: [],
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    void loadExams().then((list) => {
      if (!cancelled) setState({ exams: list, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

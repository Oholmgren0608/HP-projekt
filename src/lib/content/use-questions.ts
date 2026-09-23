"use client";

import { useEffect, useState } from "react";
import { loadQuestions } from "@/lib/content/questions-provider";
import type { ChoiceQuestion } from "@/lib/practice";

/**
 * Triggar `loadQuestions()` en gång vid mount och exponerar `ready`, som blir
 * `true` först när banken är laddad. Fallback-banken räknas som redo, så
 * komponenter behöver inte skilja på Supabase/offline.
 */
export function useQuestions(): { ready: boolean; questions: ChoiceQuestion[] } {
  const [state, setState] = useState<{ ready: boolean; questions: ChoiceQuestion[] }>({
    ready: false,
    questions: [],
  });

  useEffect(() => {
    let cancelled = false;
    void loadQuestions().then((bank) => {
      if (!cancelled) setState({ ready: true, questions: bank.questions });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

"use client";

import { useEffect, useState } from "react";
import { loadQuestions } from "@/lib/content/questions-provider";

/**
 * Triggar `loadQuestions()` en gång vid mount och exponerar `ready`, som blir
 * `true` först när banken är laddad. Fallback-banken räknas som redo, så
 * komponenter behöver inte skilja på Supabase/offline.
 */
export function useQuestions(): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadQuestions().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready };
}

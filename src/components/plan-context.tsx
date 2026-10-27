"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearScores as clearStoredScores,
  loadScores,
  markScoresSaved,
  saveScores,
  type ScoreInput,
} from "@/lib/hp-scores";
import { generatePlan, type GeneratedPlan } from "@/lib/plan-generator";
import { loadQuestions } from "@/lib/content/questions-provider";
import { bankSizes } from "@/lib/practice";
import { useHydrated } from "@/lib/use-hydrated";
import {
  ADAPT_PLAN_EVENT,
  ADAPT_PLAN_KEY,
  loadAdaptPlanEnabled,
  saveAdaptPlanEnabled,
} from "@/lib/adapt-plan-setting";
import { detectPracticeTrends } from "@/lib/practice-trends";
import {
  HISTORY_EVENT,
  HISTORY_STORAGE_KEY,
  appendScoreSnapshot,
  ensureScoreBaseline,
  loadHistory,
} from "@/lib/progress-history";
import { SCORES_STORAGE_KEY } from "@/lib/hp-scores";
import {
  LOCKED_WEEKS_KEY,
  WEEK_PROGRESS_EVENT,
  WEEK_PROGRESS_KEY,
  WEEK_SCORES_KEY,
  loadLockedWeeks,
  loadWeekProgress,
  startedWeekNumbers,
} from "@/lib/week-progress";

/** Nycklar planen faktiskt läser — bara de ska räkna om den. */
const PLAN_STORAGE_KEYS = new Set<string>([
  SCORES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  WEEK_PROGRESS_KEY,
  WEEK_SCORES_KEY,
  LOCKED_WEEKS_KEY,
  ADAPT_PLAN_KEY,
]);

type PlanContextValue = {
  /** Sparat underlag. `null` = inget sparat — visa tomt läge, aldrig gissade siffror. */
  scores: ScoreInput | null;
  /** Genererad plan. `null` följer av `scores === null`. */
  plan: GeneratedPlan | null;
  ready: boolean;
  adaptEnabled: boolean;
  setAdaptEnabled: (enabled: boolean) => void;
  updateScores: (next: ScoreInput) => void;
  clearScores: () => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<ScoreInput | null>(loadScores);
  const ready = useHydrated();
  const [adaptEnabled, setAdaptEnabledState] = useState(loadAdaptPlanEnabled);
  const [revision, setRevision] = useState(0);

  // Baslinjen i historiken skrivs bara när det finns ett sparat underlag —
  // annars skulle grafen få en mätpunkt som aldrig mättes.
  useEffect(() => {
    const saved = loadScores();
    if (saved) ensureScoreBaseline(saved);
  }, []);

  // Passens längd beror på hur många frågor banken har; bygg om planen när
  // banken (databas, cache eller reservbank) har laddats.
  useEffect(() => {
    let cancelled = false;
    void loadQuestions().then(() => {
      if (!cancelled) setRevision((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const bump = () => {
      setAdaptEnabledState(loadAdaptPlanEnabled());
      // Läs om underlaget så att skrivningar från andra flikar slår igenom.
      // Identitetskoll: oförändrade värden ska inte rita om planen (och därmed
      // återställa ett halvfyllt formulär) i onödan.
      setScores((current) => {
        const next = loadScores();
        return JSON.stringify(next) === JSON.stringify(current) ? current : next;
      });
      setRevision((n) => n + 1);
    };
    // Ett storage-event för t.ex. flashcards eller SRS rör inte planen; utan
    // filtret genererades hela planen om på varje synkad nyckel från andra flikar.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && !PLAN_STORAGE_KEYS.has(event.key)) return;
      bump();
    };
    window.addEventListener(HISTORY_EVENT, bump);
    window.addEventListener(WEEK_PROGRESS_EVENT, bump);
    window.addEventListener(ADAPT_PLAN_EVENT, bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(HISTORY_EVENT, bump);
      window.removeEventListener(WEEK_PROGRESS_EVENT, bump);
      window.removeEventListener(ADAPT_PLAN_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateScores = useCallback((next: ScoreInput) => {
    saveScores(next);
    markScoresSaved();
    setScores(next);
    appendScoreSnapshot(next);
  }, []);

  const clearScores = useCallback(() => {
    clearStoredScores();
    setScores(null);
  }, []);

  const setAdaptEnabled = useCallback((enabled: boolean) => {
    setAdaptEnabledState(enabled);
    saveAdaptPlanEnabled(enabled);
  }, []);

  const plan = useMemo(() => {
    if (!scores) return null;
    if (!ready) return generatePlan(scores);
    // `revision` is a change counter bumped by external-store events; reading it
    // here (as a no-op void) keeps it a genuine, lint-clean dependency so the
    // plan recomputes when persisted history/progress changes.
    void revision;
    const trends = adaptEnabled ? detectPracticeTrends(scores, loadHistory()) : [];
    return generatePlan(scores, {
      bankSizes: bankSizes(),
      adapt: adaptEnabled,
      trends,
      lockedWeeks: loadLockedWeeks(),
      startedWeeks: startedWeekNumbers(loadWeekProgress()),
    });
  }, [scores, adaptEnabled, revision, ready]);

  const value = useMemo(
    () => ({
      scores,
      plan,
      ready,
      adaptEnabled,
      setAdaptEnabled,
      updateScores,
      clearScores,
    }),
    [scores, plan, ready, adaptEnabled, setAdaptEnabled, updateScores, clearScores],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

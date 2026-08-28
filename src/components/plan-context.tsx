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
  DEFAULT_SCORES,
  loadScores,
  saveScores,
  type ScoreInput,
} from "@/lib/hp-scores";
import { generatePlan, type GeneratedPlan } from "@/lib/plan-generator";
import { useHydrated } from "@/lib/use-hydrated";
import {
  ADAPT_PLAN_EVENT,
  loadAdaptPlanEnabled,
  saveAdaptPlanEnabled,
} from "@/lib/adapt-plan-setting";
import { detectPracticeTrends } from "@/lib/practice-trends";
import {
  HISTORY_EVENT,
  appendScoreSnapshot,
  ensureScoreBaseline,
  loadHistory,
} from "@/lib/progress-history";
import {
  WEEK_PROGRESS_EVENT,
  loadLockedWeeks,
  loadWeekProgress,
  startedWeekNumbers,
} from "@/lib/week-progress";

type PlanContextValue = {
  scores: ScoreInput;
  plan: GeneratedPlan;
  ready: boolean;
  adaptEnabled: boolean;
  setAdaptEnabled: (enabled: boolean) => void;
  updateScores: (next: ScoreInput) => void;
  resetScores: () => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<ScoreInput>(loadScores);
  const ready = useHydrated();
  const [adaptEnabled, setAdaptEnabledState] = useState(loadAdaptPlanEnabled);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    ensureScoreBaseline(loadScores());
  }, []);

  useEffect(() => {
    const bump = () => {
      setAdaptEnabledState(loadAdaptPlanEnabled());
      setRevision((n) => n + 1);
    };
    window.addEventListener(HISTORY_EVENT, bump);
    window.addEventListener(WEEK_PROGRESS_EVENT, bump);
    window.addEventListener(ADAPT_PLAN_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(HISTORY_EVENT, bump);
      window.removeEventListener(WEEK_PROGRESS_EVENT, bump);
      window.removeEventListener(ADAPT_PLAN_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const updateScores = useCallback((next: ScoreInput) => {
    setScores(next);
    saveScores(next);
    appendScoreSnapshot(next);
  }, []);

  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
    saveScores(DEFAULT_SCORES);
    appendScoreSnapshot(DEFAULT_SCORES);
  }, []);

  const setAdaptEnabled = useCallback((enabled: boolean) => {
    setAdaptEnabledState(enabled);
    saveAdaptPlanEnabled(enabled);
  }, []);

  const plan = useMemo(() => {
    if (!ready) return generatePlan(scores);
    // `revision` is a change counter bumped by external-store events; reading it
    // here (as a no-op void) keeps it a genuine, lint-clean dependency so the
    // plan recomputes when persisted history/progress changes.
    void revision;
    const trends = adaptEnabled ? detectPracticeTrends(scores, loadHistory()) : [];
    return generatePlan(scores, {
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
      resetScores,
    }),
    [scores, plan, ready, adaptEnabled, setAdaptEnabled, updateScores, resetScores],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

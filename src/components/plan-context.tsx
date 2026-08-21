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

type PlanContextValue = {
  scores: ScoreInput;
  plan: GeneratedPlan;
  ready: boolean;
  updateScores: (next: ScoreInput) => void;
  resetScores: () => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<ScoreInput>(DEFAULT_SCORES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setScores(loadScores());
    setReady(true);
  }, []);

  const updateScores = useCallback((next: ScoreInput) => {
    setScores(next);
    saveScores(next);
  }, []);

  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
    saveScores(DEFAULT_SCORES);
  }, []);

  const plan = useMemo(() => generatePlan(scores), [scores]);

  const value = useMemo(
    () => ({ scores, plan, ready, updateScores, resetScores }),
    [scores, plan, ready, updateScores, resetScores],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

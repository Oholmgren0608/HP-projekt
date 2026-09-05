"use client";

/**
 * React-brygga till gamification-motorn: ger komponenter reaktivt
 * tillstånd (XP, streak, uppdrag, achievements) via useSyncExternalStore
 * och skickar veckans XP till topplistan när användaren är inloggad.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getGamificationState,
  markAchievementsSeen,
  markOnboarded,
  recordEvent,
  serverSnapshot,
  subscribeGamification,
  weekKey,
  type GameEvent,
  type GamificationState,
} from "./engine";
import { levelFromXp, ACHIEVEMENTS } from "./config";
import { submitWeeklyXp } from "./leaderboard";
import { useAuth } from "@/lib/supabase/auth-context";

type GamificationApi = {
  state: GamificationState;
  level: ReturnType<typeof levelFromXp>;
  week: string;
  recordEvent: (e: GameEvent) => void;
  markAchievementsSeen: (ids: string[]) => void;
  markOnboarded: () => void;
  unlockedCount: number;
};

const GamificationContext = createContext<GamificationApi | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const state = useSyncExternalStore(subscribeGamification, getGamificationState, () => serverSnapshot);

  // Skicka veckans XP till topplistan när inloggad (tyst no-op annars).
  const week = weekKey();
  const weekXp = state.weeklyXp[week] ?? 0;
  useEffect(() => {
    if (user && weekXp > 0) void submitWeeklyXp(week, weekXp);
  }, [user, week, weekXp]);

  const value = useMemo<GamificationApi>(
    () => ({
      state,
      level: levelFromXp(state.xp),
      week,
      recordEvent,
      markAchievementsSeen,
      markOnboarded,
      unlockedCount: Object.keys(state.achievements).length,
    }),
    [state, week],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification(): GamificationApi {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification måste användas inuti <GamificationProvider>");
  return ctx;
}

export { ACHIEVEMENTS };

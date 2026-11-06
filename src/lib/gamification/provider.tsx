"use client";

/**
 * React-brygga till gamification-motorn: ger komponenter reaktivt
 * tillstånd (XP, streak, uppdrag, achievements) via useSyncExternalStore.
 * XP är personlig: den skickas inte till någon topplista.
 */

import {
  createContext,
  useContext,
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
  type GameEvent,
  type GamificationState,
} from "./engine";
import { levelFromXp, ACHIEVEMENTS } from "./config";

type GamificationApi = {
  state: GamificationState;
  level: ReturnType<typeof levelFromXp>;
  recordEvent: (e: GameEvent) => void;
  markAchievementsSeen: (ids: string[]) => void;
  markOnboarded: () => void;
  unlockedCount: number;
};

const GamificationContext = createContext<GamificationApi | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeGamification, getGamificationState, () => serverSnapshot);

  const value = useMemo<GamificationApi>(
    () => ({
      state,
      level: levelFromXp(state.xp),
      recordEvent,
      markAchievementsSeen,
      markOnboarded,
      unlockedCount: Object.keys(state.achievements).length,
    }),
    [state],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification(): GamificationApi {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification måste användas inuti <GamificationProvider>");
  return ctx;
}

export { ACHIEVEMENTS };

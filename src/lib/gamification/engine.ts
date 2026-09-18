/**
 * Gamification-motorn: XP, streak, dagliga uppdrag och achievements.
 *
 * - Tillståndet sparas i "hp-lift-gamification-v1" via storage-sync
 *   (lokal + Supabase-synk när inloggad) och läses reaktivt med
 *   useSyncExternalStore.
 * - Alla aktiviteter rapporteras genom recordEvent(...). Motorn räknar
 *   XP, uppdaterar dagens mätare, streak, uppdrag och achievements och
 *   lägger notiser (levelup/achievement/questdone/streak) i en kö som
 *   CelebrationsLayer konsumerar.
 * - Veckans XP skickas till topplistan av GamificationProvider när
 *   användaren är inloggad.
 */

import {
  ACHIEVEMENTS,
  LEVEL_FLOORS,
  levelFromXp,
  QUEST_POOL,
  questsForDay,
  STREAK_MILESTONES,
  XP_VALUES,
  type QuestDefinition,
} from "./config";
import { storageGet, storageSet } from "@/lib/sync/storage-sync";

export const GAMIFICATION_KEY = "hp-lift-gamification-v1";

/** Persisterade duell-id:n som redan rapporterats (anti-dubbel vid reload/remount). */
const REPORTED_DUELS_KEY = "hp-lift-reported-duels-v1";

function readReportedDuels(): Record<string, true> {
  try {
    const raw = storageGet(REPORTED_DUELS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, true> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key && value) out[key] = true;
    }
    return out;
  } catch {
    return {};
  }
}

function writeReportedDuels(reported: Record<string, true>): void {
  try {
    storageSet(REPORTED_DUELS_KEY, JSON.stringify(reported));
  } catch {
    /* ignorera — gamification får aldrig krascha appen */
  }
}

// ---- Typer -----------------------------------------------------------------

export type GameStats = {
  questionsAnswered: number;
  correctAnswers: number;
  practiceSessions: number;
  flashcardsReviewed: number;
  duelsWon: number;
  duelsPlayed: number;
  mockExams: number;
  levelTests: number;
  readingsDone: number;
  planWeeksCompleted: number;
  srsReviews: number;
  questsCompleted: number;
};

export type TodayState = {
  date: string; // "YYYY-MM-DD"
  questions: number;
  correct: number;
  flashcards: number;
  xp: number;
  srs: number;
  duels: number;
  reading: number;
  practice: number;
};

export type QuestInstance = QuestDefinition & {
  progress: number;
  done: boolean;
};

export type GamificationState = {
  xp: number;
  streak: { current: number; best: number; lastActive: string | null };
  /** Aktiva dagar (senaste ~14) — driver veckostripens rutor. */
  activeDays: Record<string, true>;
  achievements: Record<string, { unlockedAt: string; seen: boolean }>;
  quests: { date: string; items: QuestInstance[]; allDone: boolean };
  stats: GameStats;
  today: TodayState;
  weeklyXp: Record<string, number>;
  onboarded: boolean;
};

export type GameEvent =
  | { type: "question"; correct: boolean }
  | { type: "practice_session_complete"; correct: number; total: number }
  | { type: "flashcards"; count: number }
  | { type: "srs_review"; count: number }
  | {
      type: "duel_end";
      result: "win" | "loss" | "draw";
      matchId: string;
      /** true om matchen slutade i uppgivande (status "forfeit"). */
      forfeit: boolean;
      /** Antal frågor som den här spelaren besvarade. */
      answers: number;
    }
  | { type: "mock_exam_complete" }
  | { type: "level_test_complete" }
  | { type: "reading_done" }
  | { type: "plan_week_complete" };

export type GameNotification =
  | { kind: "levelup"; level: number; title: string }
  | { kind: "achievement"; id: string }
  | { kind: "questdone"; questId: string }
  | { kind: "streak"; count: number };

// ---- Datum-hjälpare ---------------------------------------------------------

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayIndex(d: Date = new Date()): number {
  // Lokal midnatt — samma kalenderdag som dateKey() — så att uppdragens
  // rotation följer lokal tid (inte UTC) precis som resten av datumlogiken.
  const localMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(localMidnight.getTime() / 86400000);
}

/** ISO-veckonyckel, ex. "2025-W37" (måndag som veckostart). */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; // söndag=0 → 7
  t.setUTCDate(t.getUTCDate() + 4 - day); // torsdagen i veckan
  const isoYear = t.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((t.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

// ---- Default-tillstånd -------------------------------------------------------

function emptyStats(): GameStats {
  return {
    questionsAnswered: 0,
    correctAnswers: 0,
    practiceSessions: 0,
    flashcardsReviewed: 0,
    duelsWon: 0,
    duelsPlayed: 0,
    mockExams: 0,
    levelTests: 0,
    readingsDone: 0,
    planWeeksCompleted: 0,
    srsReviews: 0,
    questsCompleted: 0,
  };
}

function emptyToday(): TodayState {
  return {
    date: dateKey(),
    questions: 0,
    correct: 0,
    flashcards: 0,
    xp: 0,
    srs: 0,
    duels: 0,
    reading: 0,
    practice: 0,
  };
}

function makeQuests(): GamificationState["quests"] {
  const items = questsForDay(dayIndex()).map((q) => ({ ...q, progress: 0, done: false }));
  return { date: dateKey(), items, allDone: false };
}

function defaultState(): GamificationState {
  return {
    xp: 0,
    streak: { current: 0, best: 0, lastActive: null },
    activeDays: {},
    achievements: {},
    quests: makeQuests(),
    stats: emptyStats(),
    today: emptyToday(),
    weeklyXp: {},
    onboarded: false,
  };
}

function loadState(): GamificationState {
  try {
    const raw = storageGet(GAMIFICATION_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<GamificationState>;
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      streak: { ...base.streak, ...(parsed.streak ?? {}) },
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      today: { ...base.today, ...(parsed.today ?? {}) },
      quests: parsed.quests ?? base.quests,
      achievements: parsed.achievements ?? {},
      activeDays: parsed.activeDays ?? {},
      weeklyXp: parsed.weeklyXp ?? {},
    };
  } catch {
    return defaultState();
  }
}

// ---- Store -------------------------------------------------------------------

type Listener = () => void;

let state: GamificationState = loadState();
const listeners = new Set<Listener>();
let notifications: GameNotification[] = [];

function persist() {
  try {
    storageSet(GAMIFICATION_KEY, JSON.stringify(state));
  } catch {
    /* ignorera — gamification får aldrig krascha appen */
  }
}

function rolloverIfNeeded(s: GamificationState): GamificationState {
  const today = dateKey();
  if (s.today.date === today && s.quests.date === today) return s;
  let next: GamificationState = {
    ...s,
    today: { ...emptyToday(), date: today },
    quests: makeQuests(),
  };
  // Streak nollställs inte automatiskt — det sker när nästa aktivitet
  // kommer (och det har gått mer än en dag sedan senaste).
  next = { ...next, streak: { ...next.streak } };
  return next;
}

function addXp(s: GamificationState, amount: number): GamificationState {
  if (amount <= 0) return s;
  const wk = weekKey();
  return {
    ...s,
    xp: s.xp + amount,
    today: { ...s.today, xp: s.today.xp + amount },
    weeklyXp: { ...s.weeklyXp, [wk]: (s.weeklyXp[wk] ?? 0) + amount },
  };
}

function touchStreak(s: GamificationState): {
  state: GamificationState;
  gained: number;
  milestone: number | null;
} {
  const today = dateKey();
  const last = s.streak.lastActive;
  if (last === today) return { state: s, gained: 0, milestone: null };

  // Gårdagens nyckel
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = dateKey(y);

  const current = last === yesterday ? s.streak.current + 1 : 1;
  const best = Math.max(s.streak.best, current);
  const milestoneBonus = STREAK_MILESTONES[current] ?? 0;

  // Aktiva dagar — behåll bara de senaste 14 dagarna.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);
  const activeDays: Record<string, true> = {};
  for (const key of Object.keys(s.activeDays)) {
    if (key >= dateKey(cutoff)) activeDays[key] = true;
  }
  activeDays[today] = true;

  let next: GamificationState = {
    ...s,
    streak: { current, best, lastActive: today },
    activeDays,
  };
  if (milestoneBonus > 0) next = addXp(next, milestoneBonus);
  return { state: next, gained: milestoneBonus, milestone: milestoneBonus > 0 ? current : null };
}

function questProgressOf(s: GamificationState, q: QuestInstance): number {
  const t = s.today;
  switch (q.metric) {
    case "questions": return t.questions;
    case "correct": return t.correct;
    case "flashcards": return t.flashcards;
    case "practice": return t.practice;
    case "srs": return t.srs;
    case "duels": return t.duels;
    case "reading": return t.reading;
    case "xp": return t.xp;
  }
}

function applyQuests(s: GamificationState): {
  state: GamificationState;
  completed: string[];
} {
  const completed: string[] = [];
  const items = s.quests.items.map((q) => {
    if (q.done) return q;
    const progress = questProgressOf(s, q);
    if (progress >= q.target) {
      completed.push(q.id);
      return { ...q, progress: q.target, done: true };
    }
    return { ...q, progress };
  });
  let next = s;
  for (const id of completed) {
    const def = QUEST_POOL.find((q) => q.id === id);
    if (def) next = addXp(next, def.xp);
  }
  const allDone = items.every((q) => q.done);
  next = {
    ...next,
    quests: { ...next.quests, items, allDone },
    stats: { ...next.stats, questsCompleted: next.stats.questsCompleted + completed.length },
  };
  return { state: next, completed };
}

function checkAchievements(s: GamificationState): { state: GamificationState; unlocked: string[] } {
  const unlocked: string[] = [];
  const level = levelFromXp(s.xp).level;
  const facts = {
    xp: s.xp,
    streakBest: s.streak.best,
    questions: s.stats.questionsAnswered,
    correct: s.stats.correctAnswers,
    duelsWon: s.stats.duelsWon,
    flashcards: s.stats.flashcardsReviewed,
    mockExams: s.stats.mockExams,
    levelTests: s.stats.levelTests,
    readings: s.stats.readingsDone,
    planWeeks: s.stats.planWeeksCompleted,
    srsReviews: s.stats.srsReviews,
    questsCompleted: s.stats.questsCompleted,
    level,
  };
  const achievements = { ...s.achievements };
  for (const def of ACHIEVEMENTS) {
    if (achievements[def.id]) continue;
    if (def.check(facts)) {
      achievements[def.id] = { unlockedAt: new Date().toISOString(), seen: false };
      unlocked.push(def.id);
    }
  }
  return { state: { ...s, achievements }, unlocked };
}

// ---- Publikt API ---------------------------------------------------------------

export function getGamificationState(): GamificationState {
  return state;
}

/** Stabil snapshot för SSR (useSyncExternalStore). */
export const serverSnapshot: GamificationState = defaultState();

export function subscribeGamification(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function consumeNotifications(): GameNotification[] {
  const n = notifications;
  notifications = [];
  return n;
}

export function recordEvent(event: GameEvent): void {
  const prevLevel = levelFromXp(state.xp).level;
  let s = rolloverIfNeeded(state);

  const emit: GameNotification[] = [];
  let xpGain = 0;

  switch (event.type) {
    case "question": {
      const amount = event.correct ? XP_VALUES.questionCorrect : XP_VALUES.questionWrong;
      xpGain += amount;
      s = {
        ...s,
        stats: {
          ...s.stats,
          questionsAnswered: s.stats.questionsAnswered + 1,
          correctAnswers: s.stats.correctAnswers + (event.correct ? 1 : 0),
        },
        today: {
          ...s.today,
          questions: s.today.questions + 1,
          correct: s.today.correct + (event.correct ? 1 : 0),
        },
      };
      break;
    }
    case "practice_session_complete": {
      xpGain += XP_VALUES.practiceSession;
      s = {
        ...s,
        stats: { ...s.stats, practiceSessions: s.stats.practiceSessions + 1 },
        today: { ...s.today, practice: s.today.practice + 1 },
      };
      break;
    }
    case "flashcards": {
      xpGain += event.count * XP_VALUES.flashcard;
      s = {
        ...s,
        stats: { ...s.stats, flashcardsReviewed: s.stats.flashcardsReviewed + event.count },
        today: { ...s.today, flashcards: s.today.flashcards + event.count },
      };
      break;
    }
    case "srs_review": {
      xpGain += XP_VALUES.srsReview;
      s = {
        ...s,
        stats: { ...s.stats, srsReviews: s.stats.srsReviews + 1 },
        today: { ...s.today, srs: s.today.srs + 1 },
      };
      break;
    }
    case "duel_end": {
      // Samma match får aldrig belönas två gånger (reload/remount).
      const reported = readReportedDuels();
      if (reported[event.matchId]) return;
      writeReportedDuels({ ...reported, [event.matchId]: true });

      // Uppgivande utan några besvarade frågor ger varken XP eller
      // duell-uppdragsprogress (motverkar "ge upp"-farmning).
      const noReward = event.forfeit && event.answers === 0 && event.result !== "win";

      if (!noReward) {
        xpGain +=
          event.result === "win"
            ? XP_VALUES.duelWin
            : event.result === "loss"
              ? XP_VALUES.duelLoss
              : XP_VALUES.duelDraw;
      }
      s = {
        ...s,
        stats: {
          ...s.stats,
          duelsPlayed: s.stats.duelsPlayed + 1,
          duelsWon: s.stats.duelsWon + (event.result === "win" ? 1 : 0),
        },
        today: { ...s.today, duels: s.today.duels + (noReward ? 0 : 1) },
      };
      break;
    }
    case "mock_exam_complete": {
      xpGain += XP_VALUES.mockExam;
      s = {
        ...s,
        stats: { ...s.stats, mockExams: s.stats.mockExams + 1 },
        today: { ...s.today, practice: s.today.practice + 1 },
      };
      break;
    }
    case "level_test_complete": {
      xpGain += XP_VALUES.levelTest;
      s = {
        ...s,
        stats: { ...s.stats, levelTests: s.stats.levelTests + 1 },
        today: { ...s.today, practice: s.today.practice + 1 },
      };
      break;
    }
    case "reading_done": {
      xpGain += XP_VALUES.reading;
      s = {
        ...s,
        stats: { ...s.stats, readingsDone: s.stats.readingsDone + 1 },
        today: { ...s.today, reading: s.today.reading + 1 },
      };
      break;
    }
    case "plan_week_complete": {
      xpGain += XP_VALUES.planWeek;
      s = {
        ...s,
        stats: { ...s.stats, planWeeksCompleted: s.stats.planWeeksCompleted + 1 },
      };
      break;
    }
  }

  s = addXp(s, xpGain);

  // Streak (all aktivitet räknas som studiedag)
  const streakRes = touchStreak(s);
  s = streakRes.state;
  if (streakRes.state.streak.current > 1 && streakRes.state.streak.lastActive !== state.streak.lastActive) {
    emit.push({ kind: "streak", count: streakRes.state.streak.current });
  }

  // Uppdrag
  const questRes = applyQuests(s);
  s = questRes.state;
  for (const id of questRes.completed) emit.push({ kind: "questdone", questId: id });

  // Achievements
  const achRes = checkAchievements(s);
  s = achRes.state;
  for (const id of achRes.unlocked) emit.push({ kind: "achievement", id });

  // Nivå
  const newLevel = levelFromXp(s.xp);
  if (newLevel.level > prevLevel) {
    emit.push({ kind: "levelup", level: newLevel.level, title: newLevel.title });
  }

  state = s;
  notifications.push(...emit);
  persist();
  for (const l of listeners) l();
}

/** Markera achievements som sedda (toast bortstängd / panel öppnad). */
export function markAchievementsSeen(ids: string[]): void {
  if (ids.length === 0) return;
  const achievements = { ...state.achievements };
  for (const id of ids) {
    if (achievements[id]) achievements[id] = { ...achievements[id], seen: true };
  }
  state = { ...state, achievements };
  persist();
  for (const l of listeners) l();
}

export function markOnboarded(): void {
  state = { ...state, onboarded: true };
  persist();
  for (const l of listeners) l();
}

/** Felsökningshjälp. */
export function __gamificationDebug() {
  return {
    state,
    maxLevel: LEVEL_FLOORS.length,
  };
}

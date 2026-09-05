/**
 * Gamification-konfiguration: nivåer, XP-värden, dagliga uppdrag och
 * achievements. All text på svenska — appens språk.
 */

export type LevelInfo = {
  level: number;
  title: string;
  /** XP vid nivåns början */
  floor: number;
  /** XP som krävs för nästa nivå (null på maxnivå) */
  ceiling: number | null;
  /** 0–1 framsteg mot nästa nivå */
  progress: number;
};

export const LEVEL_FLOORS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200, 11000, 13000, 15000, 17500, 20000,
] as const;

export const LEVEL_TITLES = [
  "Nybörjare",
  "Nyfiken",
  "Lärjunge",
  "Plugghäst",
  "Ordkännare",
  "Matteknäckare",
  "Läsfantast",
  "Strateg",
  "Provkrigare",
  "Elitstudent",
  "HP-Mästare",
  "Legendar",
  "Stormästare",
  "Virtuos",
  "Fenomen",
  "Professor",
  "Mentor",
  "Orakel",
  "HP-Gud",
  "Oövervinnelig",
] as const;

export function levelFromXp(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVEL_FLOORS.length; i++) {
    if (xp >= LEVEL_FLOORS[i]) idx = i;
    else break;
  }
  const floor = LEVEL_FLOORS[idx];
  const ceiling = idx + 1 < LEVEL_FLOORS.length ? LEVEL_FLOORS[idx + 1] : null;
  const progress = ceiling === null ? 1 : (xp - floor) / (ceiling - floor);
  return {
    level: idx + 1,
    title: LEVEL_TITLES[idx],
    floor,
    ceiling,
    progress,
  };
}

/** XP-belöningar per aktivitet. */
export const XP_VALUES = {
  questionCorrect: 5,
  questionWrong: 1,
  practiceSession: 15,
  srsReview: 10,
  flashcard: 1,
  duelWin: 30,
  duelLoss: 10,
  duelDraw: 15,
  mockExam: 50,
  levelTest: 40,
  reading: 20,
  planWeek: 25,
} as const;

/** Bonus-XP vid streak-milstolpar. */
export const STREAK_MILESTONES: Record<number, number> = {
  3: 25,
  7: 50,
  14: 100,
  30: 250,
};

export type QuestMetric =
  | "questions"
  | "correct"
  | "flashcards"
  | "practice"
  | "srs"
  | "duels"
  | "reading"
  | "xp";

export type QuestDefinition = {
  id: string;
  emoji: string;
  label: string;
  metric: QuestMetric;
  target: number;
  xp: number;
};

export const QUEST_POOL: QuestDefinition[] = [
  { id: "q10", emoji: "🎯", label: "Svara på 10 frågor", metric: "questions", target: 10, xp: 20 },
  { id: "q25", emoji: "🏋️", label: "Svara på 25 frågor", metric: "questions", target: 25, xp: 30 },
  { id: "qflash10", emoji: "🃏", label: "Öva 10 flashcards", metric: "flashcards", target: 10, xp: 20 },
  { id: "qcorrect5", emoji: "✅", label: "Svara rätt på 5 frågor", metric: "correct", target: 5, xp: 15 },
  { id: "qpractice1", emoji: "📝", label: "Kör en övningsomgång", metric: "practice", target: 1, xp: 20 },
  { id: "qsrs1", emoji: "🔁", label: "Kör dagens repetition", metric: "srs", target: 1, xp: 15 },
  { id: "qduel1", emoji: "⚔️", label: "Spela en duell", metric: "duels", target: 1, xp: 25 },
  { id: "qreading1", emoji: "📖", label: "Läs en text i biblioteket", metric: "reading", target: 1, xp: 20 },
  { id: "qxp50", emoji: "⭐", label: "Samla 50 XP idag", metric: "xp", target: 50, xp: 25 },
];

/** Väljer 3 dagliga uppdrag — deterministiskt roterande per dag. */
export function questsForDay(dayIndex: number): QuestDefinition[] {
  const n = QUEST_POOL.length;
  return [0, 3, 6].map((offset) => QUEST_POOL[(dayIndex + offset) % n]);
}

export type AchievementDefinition = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (s: {
    xp: number;
    streakBest: number;
    questions: number;
    correct: number;
    duelsWon: number;
    flashcards: number;
    mockExams: number;
    levelTests: number;
    readings: number;
    planWeeks: number;
    srsReviews: number;
    questsCompleted: number;
    level: number;
  }) => boolean;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first_xp", emoji: "🌱", title: "Första steget", desc: "Tjäna dina första XP", check: (s) => s.xp >= 1 },
  { id: "xp_500", emoji: "💰", title: "XP-Samlare", desc: "Samla 500 XP totalt", check: (s) => s.xp >= 500 },
  { id: "xp_2500", emoji: "👑", title: "XP-Magnat", desc: "Samla 2 500 XP totalt", check: (s) => s.xp >= 2500 },
  { id: "streak_3", emoji: "🔥", title: "På gång", desc: "Studera 3 dagar i rad", check: (s) => s.streakBest >= 3 },
  { id: "streak_7", emoji: "⚡", title: "Veckans krigare", desc: "Studera 7 dagar i rad", check: (s) => s.streakBest >= 7 },
  { id: "streak_30", emoji: "🚀", title: "Ostoppbar", desc: "Studera 30 dagar i rad", check: (s) => s.streakBest >= 30 },
  { id: "q_100", emoji: "🧠", title: "Frågesportare", desc: "Besvara 100 frågor", check: (s) => s.questions >= 100 },
  { id: "q_1000", emoji: "🤖", title: "Svarsmaskin", desc: "Besvara 1 000 frågor", check: (s) => s.questions >= 1000 },
  { id: "correct_50", emoji: "🎯", title: "Prickskytt", desc: "Ge 50 rätta svar", check: (s) => s.correct >= 50 },
  { id: "duel_1", emoji: "⚔️", title: "Duellsegrare", desc: "Vinn din första duell", check: (s) => s.duelsWon >= 1 },
  { id: "duel_10", emoji: "🏆", title: "Duellveteran", desc: "Vinn 10 dueller", check: (s) => s.duelsWon >= 10 },
  { id: "flash_100", emoji: "🃏", title: "Kortmästare", desc: "Öva 100 flashcards", check: (s) => s.flashcards >= 100 },
  { id: "mock_1", emoji: "⏱️", title: "Provsimulator", desc: "Genomför ett simulerat prov", check: (s) => s.mockExams >= 1 },
  { id: "mock_5", emoji: "🎓", title: "Provproffs", desc: "Genomför 5 simulerade prov", check: (s) => s.mockExams >= 5 },
  { id: "leveltest_1", emoji: "🧭", title: "Självinsikt", desc: "Gör nivåtestet", check: (s) => s.levelTests >= 1 },
  { id: "reading_5", emoji: "📚", title: "Bokmal", desc: "Läs 5 texter i biblioteket", check: (s) => s.readings >= 5 },
  { id: "week_1", emoji: "🗓️", title: "Planeraren", desc: "Klar med en vecka i planen", check: (s) => s.planWeeks >= 1 },
  { id: "srs_10", emoji: "🔁", title: "Minnesmästare", desc: "Kör 10 repetitioner", check: (s) => s.srsReviews >= 10 },
  { id: "quest_10", emoji: "🧩", title: "Uppdragsexpert", desc: "Klar med 10 dagliga uppdrag", check: (s) => s.questsCompleted >= 10 },
  { id: "level_5", emoji: "🌟", title: "Halvvägs mot toppen", desc: "Nå nivå 5", check: (s) => s.level >= 5 },
];

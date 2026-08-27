import type { ScoreInput } from "@/lib/hp-scores";
import { DELPROV_META } from "@/lib/hp-scores";
import { pct } from "@/lib/study-plan";
import type { SectionId } from "@/lib/study-plan";
import { kindToSection } from "@/lib/practice-pace";
import type { HistoryEvent, QuizHistoryEvent } from "@/lib/progress-history";

const MIN_SESSIONS = 3;
/** Ignore noise around the HP baseline (51 % vs 50 % is not a trend). */
const MIN_GAP = 8;

export type PracticeTrend = {
  id: SectionId;
  direction: "weaker" | "stronger";
};

type Session = { percent: number; at: string };

function sessionsFromHistory(events: HistoryEvent[]): Map<SectionId, Session[]> {
  const map = new Map<SectionId, Session[]>();
  for (const e of events) {
    if (e.type !== "quiz" || e.total <= 0) continue;
    const kinds = e.kinds.filter((k) => k !== "reflect");
    if (kinds.length !== 1) continue;
    const id = kindToSection(kinds[0]);
    if (!id) continue;
    const list = map.get(id) ?? [];
    list.push({
      percent: Math.round((e.correct / e.total) * 100),
      at: e.at,
    });
    map.set(id, list);
  }
  for (const [id, list] of map) {
    list.sort((a, b) => a.at.localeCompare(b.at));
    map.set(id, list);
  }
  return map;
}

export function detectPracticeTrends(
  scores: ScoreInput,
  events: HistoryEvent[],
): PracticeTrend[] {
  const bySection = sessionsFromHistory(events);
  const trends: PracticeTrend[] = [];

  for (const m of DELPROV_META) {
    const sessions = bySection.get(m.id) ?? [];
    if (sessions.length < MIN_SESSIONS) continue;
    const last3 = sessions.slice(-MIN_SESSIONS);
    const hpPercent = pct(scores.delprov[m.id] ?? 0, m.total);
    const weaker = last3.every((s) => s.percent <= hpPercent - MIN_GAP);
    const stronger = last3.every((s) => s.percent >= hpPercent + MIN_GAP);
    if (weaker === stronger) continue;
    trends.push({ id: m.id, direction: weaker ? "weaker" : "stronger" });
  }

  return trends;
}

export function adjustDeficit(
  id: SectionId,
  deficit: number,
  trends: PracticeTrend[],
): number {
  const t = trends.find((x) => x.id === id);
  if (!t) return deficit;
  return t.direction === "weaker" ? deficit + 18 : Math.max(0, deficit - 18);
}

export function quizIsSingleKind(e: QuizHistoryEvent): boolean {
  return e.kinds.filter((k) => k !== "reflect").length === 1;
}

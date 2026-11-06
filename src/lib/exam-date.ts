/**
 * Provdatum och veckoplanens kalender.
 *
 * Veckoplanen räknas fram ur två datum i ScoreInput: provdatumet och
 * planens start (måndagen i veckan då planen skapades). Antalet veckor i planen
 * är antalet kalenderveckor från starten till och med provveckan, högst 16.
 * Ligger provet längre bort täcker planen de sista 16 veckorna, och den börjar
 * då en senare måndag.
 *
 * Alla datum är "YYYY-MM-DD" i lokal kalender. Räkningen sker i UTC på de
 * strängarna, så att sommartid aldrig flyttar en vecka.
 */

/** Högsta antalet veckor i en plan (samma tak som plan-generator.ts). */
export const MAX_PLAN_WEEKS = 16;

/**
 * Kommande högskoleprov, bekräftade av Oscar 2026-11-06 (vårprovet 2027 även
 * mot Örebro universitets sida). Lägg till nya datum när UHR publicerar dem;
 * passerade datum visas inte.
 */
export const HP_EXAM_DATES: ReadonlyArray<{ date: string; label: string }> = [
  { date: "2027-04-10", label: "Våren 2027" },
  { date: "2027-10-24", label: "Hösten 2027" },
];

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Är värdet ett giltigt datum på formen YYYY-MM-DD? */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === value;
}

function toDay(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

function fromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Dagens datum i lokal kalender. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  return fromDay(toDay(date) + days);
}

export function daysBetween(from: string, to: string): number {
  return toDay(to) - toDay(from);
}

/** Måndagen i veckan som datumet ligger i. */
export function mondayOf(date: string): string {
  const day = toDay(date);
  // 1970-01-01 var en torsdag: (dag + 3) % 7 = 0 betyder måndag.
  const weekday = (((day + 3) % 7) + 7) % 7;
  return fromDay(day - weekday);
}

/**
 * Planens första måndag när planen skapas `today` inför provet `examDate`:
 * den här veckan, eller en senare måndag om provet ligger mer än 16 veckor bort.
 */
export function planStartFor(examDate: string, today: string): string {
  const thisWeek = mondayOf(today);
  const earliest = addDays(mondayOf(examDate), -7 * (MAX_PLAN_WEEKS - 1));
  return earliest > thisWeek ? earliest : thisWeek;
}

/** Antal veckor i planen: från startveckan till och med provveckan (1–16). */
export function planWeekCount(planStart: string, examDate: string): number {
  const weeks = Math.floor(daysBetween(mondayOf(planStart), mondayOf(examDate)) / 7) + 1;
  return Math.max(1, Math.min(MAX_PLAN_WEEKS, weeks));
}

/**
 * Vilken vecka i planen `today` ligger i. 0 = planen har inte börjat än;
 * efter provveckan blir det sista veckan.
 */
export function currentPlanWeek(planStart: string, examDate: string, today: string): number {
  const offset = Math.floor(daysBetween(mondayOf(planStart), mondayOf(today)) / 7);
  if (offset < 0) return 0;
  return Math.min(offset + 1, planWeekCount(planStart, examDate));
}

/** Kalenderveckor kvar till provet, den här veckan och provveckan inräknade. 0 efter provet. */
export function weeksLeft(examDate: string, today: string): number {
  if (today > examDate) return 0;
  return Math.floor(daysBetween(mondayOf(today), mondayOf(examDate)) / 7) + 1;
}

/** Måndag–söndag för planens vecka nummer `week`. */
export function planWeekRange(planStart: string, week: number): { start: string; end: string } {
  const start = addDays(mondayOf(planStart), 7 * (week - 1));
  return { start, end: addDays(start, 6) };
}

const MONTHS = ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];
const MONTHS_LONG = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

function parts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** "10 april 2027" */
export function formatDateLong(date: string): string {
  const { y, m, d } = parts(date);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "9–15 nov" eller "30 nov–6 dec" */
export function formatWeekRange(range: { start: string; end: string }): string {
  const a = parts(range.start);
  const b = parts(range.end);
  if (a.m === b.m) return `${a.d}–${b.d} ${MONTHS[b.m - 1]}`;
  return `${a.d} ${MONTHS[a.m - 1]}–${b.d} ${MONTHS[b.m - 1]}`;
}

/** Kommande prov (provdagen idag räknas), i datumordning. */
export function upcomingExamDates(today: string): Array<{ date: string; label: string }> {
  return HP_EXAM_DATES.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

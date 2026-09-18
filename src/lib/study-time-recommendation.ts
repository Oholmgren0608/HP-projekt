import { DELPROV_META, type ScoreInput } from "@/lib/hp-scores";
import { priorityFromPercent } from "@/lib/plan-generator";
import { pct } from "@/lib/format";
import type { Priority, SectionId } from "@/lib/study-plan";
import { sectionShort } from "@/lib/subtests";
import { clamp } from "@/lib/utils";

/**
 * Studietids-rekommendation.
 *
 * Utgår från användarens resultat (delprovspoäng), vald tid/vecka och tid kvar
 * till provdagen, och bedömer om tiden räcker för att lyfta de svaga delarna —
 * och om inte, vilken veckodos som vore rimlig.
 *
 * Modellen är en transparent tumregel, inte en garanti:
 * - Varje delprov får en veckodos utifrån sin prioritetsnivå (samma trösklar
 *   som planens prioritering): en "kritisk" del behöver mer tid än en styrka.
 * - Total mängd arbete antas vara ungefär konstant, så kortare tid till provet
 *   ger en högre veckodos (och tvärtom). Standardhorisonten är 8 veckor.
 * - Resultatet är bara en rekommendation — användaren bestämmer själv.
 */

/** Veckodos (timmar/vecka) per prioriteringsnivå. */
const HOURS_PER_PRIORITY = {
  kritiskt: 2,
  huvudfokus: 1.25,
  underhall: 0.5,
  styrka: 0.25,
} satisfies Record<Priority, number>;

/** Antal veckor som "normal" veckodos är beräknad för. */
const STANDARD_HORIZON_WEEKS = 8;
const MIN_HOURS = 3;
const MAX_HOURS = 40;

/** Delprov under den här procenten räknas som svaga och nämns i rekommendationen. */
const WEAK_THRESHOLD = 65;

export type Bottleneck = {
  id: SectionId;
  name: string;
  percent: number;
};

export type StudyTimeVerdict = {
  /** `insufficient` = för lite tid, `tight` = precis i nedre delen, `comfortable` = god marginal. */
  status: "insufficient" | "tight" | "comfortable";
  currentHours: number;
  recommendedMin: number;
  recommendedMax: number;
  weeksUntilExam: number;
  /** De svagaste delproven (upp till tre), sorterade från lägst procent. */
  bottlenecks: Bottleneck[];
  /** Antal svaga delprov totalt (kan vara fler än `bottlenecks`). */
  weakCount: number;
  /** Kortfattad förklaring på svenska. */
  summary: string;
};

export function recommendStudyTime(scores: ScoreInput): StudyTimeVerdict {
  const perSection = DELPROV_META.map((m) => {
    const percent = pct(scores.delprov[m.id] ?? 0, m.total);
    const priority = priorityFromPercent(percent);
    return {
      id: m.id,
      name: m.name,
      percent,
      hours: HOURS_PER_PRIORITY[priority],
    };
  });

  const baseHours = perSection.reduce((sum, s) => sum + s.hours, 0);

  // Kortare tid till provet → mer per vecka (samma totala mängd arbete).
  // Sanera veckor: NaN/∞/≤0 får inte ge NaN-intervall eller "På 0/NaN veckor".
  const rawWeeks = scores.weeksUntilExam;
  const weeks =
    Number.isFinite(rawWeeks) && rawWeeks > 0 ? rawWeeks : STANDARD_HORIZON_WEEKS;
  const horizonFactor = clamp(STANDARD_HORIZON_WEEKS / weeks, 0.7, 1.6);
  const recommendedMin = clamp(
    Math.round(baseHours * horizonFactor),
    MIN_HOURS,
    MAX_HOURS,
  );
  const recommendedMax = clamp(
    Math.max(recommendedMin + 2, Math.round(recommendedMin * 1.5)),
    MIN_HOURS,
    MAX_HOURS,
  );

  const currentHours = scores.hoursPerWeek;
  let status: StudyTimeVerdict["status"];
  if (currentHours < recommendedMin) {
    status = "insufficient";
  } else if (currentHours < recommendedMax) {
    status = "tight";
  } else {
    status = "comfortable";
  }

  const weakSections = perSection
    .filter((s) => s.percent < WEAK_THRESHOLD)
    .sort((a, b) => a.percent - b.percent);
  const bottlenecks: Bottleneck[] = weakSections
    .slice(0, 3)
    .map(({ id, name, percent }) => ({ id, name, percent }));

  return {
    status,
    currentHours,
    recommendedMin,
    recommendedMax,
    weeksUntilExam: weeks,
    bottlenecks,
    weakCount: weakSections.length,
    summary: buildSummary({
      status,
      currentHours,
      min: recommendedMin,
      max: recommendedMax,
      weeks,
      weakCount: weakSections.length,
      bottlenecks,
    }),
  };
}

function buildSummary(args: {
  status: StudyTimeVerdict["status"];
  currentHours: number;
  min: number;
  max: number;
  weeks: number;
  weakCount: number;
  bottlenecks: Bottleneck[];
}): string {
  const { status, currentHours, min, max, weeks, weakCount, bottlenecks } =
    args;
  if (status === "insufficient") {
    const countLabel =
      weakCount === 1 ? "1 svagt delprov" : `${weakCount} svaga delprov`;
    const weakest = bottlenecks[0];
    const weakestRef = weakest
      ? ` (svagast: ${sectionShort(weakest.id)} ${weakest.percent} %)`
      : "";
    return `På ${weeks} veckor räcker ${currentHours} h/vecka troligtvis inte för att lyfta ${countLabel}${weakestRef}.`;
  }
  if (status === "tight") {
    return `Du ligger i nedre delen av rekommenderad mängd (${min}–${max} h/vecka). Det räcker, men marginalen är liten.`;
  }
  return `${currentHours} h/vecka ger god marginal jämfört med rekommenderade ${min}–${max} h/vecka.`;
}

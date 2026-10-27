import type { PracticeKind } from "@/lib/practice";
import { DELPROV_META, type ScoreInput, formatNorm } from "@/lib/hp-scores";
import type {
  DelprovScore,
  Priority,
  SectionGuide,
  SectionId,
  StudyTask,
  WeekPlan,
} from "@/lib/study-plan";
import { pct } from "@/lib/format";
import { kindToSection, sectionToKinds } from "@/lib/section-kinds";
import { SUBTESTS } from "@/lib/subtests";
import { adjustDeficit, type PracticeTrend } from "@/lib/practice-trends";

export type TimeSplitItem = { label: string; pct: number; note: string };
export type StrategyItem = { title: string; body: string };

export type GeneratedPlan = {
  profile: {
    previousQuant: number;
    previousVerbal: number;
    overall: number;
    totalCorrect: number;
    totalQuestions: number;
    targetOverall: string;
    targetVerbal: string;
    weeksUntilExam: number;
    hoursPerWeek: number;
  };
  delprovScores: DelprovScore[];
  sections: SectionGuide[];
  strategy: StrategyItem[];
  timeSplit: TimeSplitItem[];
  weeklyPlans: WeekPlan[];
  dailyTemplate: { slot: string; item: string }[];
  heroSummary: string;
  focusIds: SectionId[];
  adaptedFromPractice: boolean;
};

export type GeneratePlanOptions = {
  adapt?: boolean;
  trends?: PracticeTrend[];
  lockedWeeks?: Record<number, WeekPlan>;
  startedWeeks?: number[];
  /**
   * Antal publicerade frågor per övningstyp. Ett pass får aldrig fler frågor
   * än banken har, annars visar planen tid för frågor som inte finns.
   */
  bankSizes?: Partial<Record<PracticeKind, number>>;
};

type Ranked = {
  id: SectionId;
  name: string;
  correct: number;
  total: number;
  block: "kvant" | "verbal";
  percent: number;
  deficit: number;
};

const METHODS: Record<
  SectionId,
  { name: string; short: string; methods: string[] }
> = {
  MEK: {
    name: "MEK — Meningskomplettering",
    short: "MEK",
    methods: [
      "Konnektorer dagligen: emellertid, således, däremot, oaktat",
      "Alternativen högt: fel svar bryter ton eller orsaksrelation",
      "Stryk stilfel före logikfel",
      "Korta MEK-set med felanalys",
    ],
  },
  ORD: {
    name: "ORD — Ordförståelse",
    short: "ORD",
    methods: [
      "15–25 nya ord per dag + aktiv recall",
      "Gruppera efter stammar",
      "Fel-decket går före nya ord",
      "Flashcards varje morgon",
    ],
  },
  LAS: {
    name: "LÄS — Svensk läsförståelse",
    short: "LÄS",
    methods: [
      "Daglig sakprosa i läsbiblioteket",
      "Tidsatta pass med bevisrad",
      "Sammanfatta huvudpoängen i en mening",
      "Stöd i texten slår gissningar",
    ],
  },
  ELF: {
    name: "ELF — Engelsk läsförståelse",
    short: "ELF",
    methods: [
      "Underhållspass så tempot hålls",
      "Lätt engelsk sakprosa vid behov",
      "Analysera bara tydliga fel",
    ],
  },
  DTK: {
    name: "DTK — Diagram, tabeller och kartor",
    short: "DTK",
    methods: [
      "Tempo + noggrann avläsning",
      "Stryk irrelevant data före räkning",
      "Felanalys: avläsning, räkning, feltolkning",
    ],
  },
  XYZ: {
    name: "XYZ — Matematisk problemlösning",
    short: "XYZ",
    methods: [
      "Blandade problemlösningspass",
      "Fokusera på missade typer",
      "Korta pass — överplugga inte",
    ],
  },
  KVA: {
    name: "KVA — Kvantitativa jämförelser",
    short: "KVA",
    methods: [
      "Korta jämförelseset under tid",
      "Avgör relation utan full uträkning",
      "Felanalys per uppgiftstyp",
    ],
  },
  NOG: {
    name: "NOG — Kvantitativa resonemang",
    short: "NOG",
    methods: [
      "Träna tillräcklighet: (1), (2), båda, ingetdera",
      "Rita upp vad varje uppgift ger",
      "Korta set med direkt felanalys",
    ],
  },
};

export function priorityFromPercent(percent: number): Priority {
  if (percent < 50) return "kritiskt";
  if (percent < 65) return "huvudfokus";
  if (percent < 80) return "underhall";
  return "styrka";
}

function whyFor(priority: Priority): string {
  if (priority === "kritiskt") {
    return "Tydlig flaskhals — mest poäng att hämta här.";
  }
  if (priority === "huvudfokus") {
    return "Under målzonen. Regelbunden träning ger snabb lyft.";
  }
  if (priority === "underhall") {
    return "God nivå. Underhåll — ta inte tid från svagare delar.";
  }
  return "Styrka. Skydda nivån med korta pass.";
}

function weeklyGoalFor(id: SectionId, priority: Priority): string {
  if (id === "MEK") {
    return priority === "styrka" || priority === "underhall"
      ? "2–3 MEK-set/vecka"
      : "5–6 MEK-set + konnektorlista";
  }
  if (id === "ORD") {
    return priority === "styrka" || priority === "underhall"
      ? "Daglig lätt flashcard-repetition"
      : "15–25 ord/dag + flashcards, ≥80 % på veckotest";
  }
  if (id === "LAS") {
    return priority === "kritiskt" || priority === "huvudfokus"
      ? "3 tidsatta LÄS-pass + daglig sakprosa"
      : "Daglig läsning + 1–2 LÄS-pass";
  }
  if (id === "ELF") {
    return priority === "styrka" || priority === "underhall"
      ? "1 underhållspass/vecka"
      : "2–3 ELF-pass + felanalys";
  }
  if (id === "DTK") return "1–2 DTK-pass/vecka";
  if (id === "XYZ") return "1–2 XYZ-pass";
  if (id === "KVA") return "Korta KVA-set under tid";
  if (id === "NOG") return "1 NOG-pass: tillräcklighet";
  return "1 blandat underhållspass/vecka";
}

function toPractice(id: SectionId): PracticeKind[] {
  return sectionToKinds(id);
}

function allocateTime(ranked: Ranked[]): TimeSplitItem[] {
  const weighted = ranked
    .map((r) => ({ r, weight: Math.max(0, r.total - r.correct) }))
    .filter((row) => row.weight > 0);

  const sum = weighted.reduce((acc, row) => acc + row.weight, 0);
  if (sum === 0) return [];

  const items: TimeSplitItem[] = weighted.map(({ r, weight }) => ({
    label: METHODS[r.id]?.short ?? r.id,
    pct: Math.round((weight / sum) * 100),
    note: r.percent < 65 ? "prioritet" : "underhåll",
  }));

  const drift = 100 - items.reduce((a, b) => a + b.pct, 0);
  if (items.length && drift !== 0) items[0].pct += drift;
  // Behåll den ordning rankningen gav (svagast först) i stället för att sortera
  // om på andel, så att tidfördelningen pekar på samma delprov som fokuslistan.
  return items;
}

/** Minsta tid för en uppgift i planen. */
const MIN_TASK_MINUTES = 15;
/** Andel av den angivna veckotiden planen lägger upp — resten är repetition och oförutsett. */
const WEEKLY_LOAD_FACTOR = 0.8;
/**
 * Nedtrappningsveckan ("Puts och vila") får en mindre del av veckotiden. Utan
 * det skalades den till samma budget som byggveckorna och nedtrappningen
 * försvann.
 */
const TAPER_WEEK_SHARE = 0.6;
/** Svara i provtempo plus tid att läsa facit (samma faktor som practice-pace). */
const REVIEW_FACTOR = 1.25;
/** Ett pass är högst ett provpass stort; fler frågor än så blir ett annat pass. */
const MAX_TASK_QUESTIONS = 40;
const MIN_TASK_QUESTIONS = 4;
const MAX_REFLECT_MINUTES = 60;
/** Fler uppgifter än så i en vecka blir oöverskådligt; resten av tiden lämnas fri. */
const MAX_TASKS_PER_WEEK = 7;

const SEC_PER_QUESTION = Object.fromEntries(SUBTESTS.map((s) => [s.id, s.secPerQuestion])) as Record<
  SectionId,
  number
>;

/** Provtempo i sekunder per fråga för ett pass med en eller flera övningstyper. */
function secondsFor(kinds: PracticeKind[]): number {
  const sections = kinds.map((k) => kindToSection(k)).filter((id): id is SectionId => Boolean(id));
  if (sections.length === 0) return 82;
  return sections.reduce((sum, id) => sum + SEC_PER_QUESTION[id], 0) / sections.length;
}

const round5 = (minutes: number) => Math.round(minutes / 5) * 5;

function isReflect(task: StudyTask): boolean {
  return task.practiceKinds.length === 1 && task.practiceKinds[0] === "reflect";
}

/**
 * Ger en uppgift `minutes` minuter: antalet frågor räknas fram ur provtempot,
 * och minuterna sätts sedan efter frågorna, så att den tid planen visar är den
 * tid passet faktiskt tar. Förr skalades bara minuterna och en uppgift kunde
 * stå som 155 min med fyra frågor.
 */
function sizeTask(
  task: StudyTask,
  minutes: number,
  bankSizes?: Partial<Record<PracticeKind, number>>,
): StudyTask {
  if (isReflect(task)) {
    return { ...task, minutes: Math.max(MIN_TASK_MINUTES, Math.min(MAX_REFLECT_MINUTES, round5(minutes))) };
  }
  const perQuestion = (secondsFor(task.practiceKinds) * REVIEW_FACTOR) / 60;
  const available = bankSizes
    ? task.practiceKinds.reduce((sum, k) => sum + (bankSizes[k] ?? MAX_TASK_QUESTIONS), 0)
    : MAX_TASK_QUESTIONS;
  const questionCount = Math.max(
    Math.min(MIN_TASK_QUESTIONS, Math.max(1, available)),
    Math.min(MAX_TASK_QUESTIONS, available, Math.round(minutes / perQuestion)),
  );
  return {
    ...task,
    questionCount,
    minutes: Math.max(MIN_TASK_MINUTES, round5(questionCount * perQuestion)),
  };
}

/**
 * Fördelar veckans tid (hoursPerWeek × 60 × WEEKLY_LOAD_FACTOR) på veckans
 * uppgifter, proportionellt mot mallens vikter. Tid som blir över när ett pass
 * når sitt tak blir extrapass i delprov ur rotationen, så att veckotiden används
 * till övning och inte bara står som siffror.
 */
function fitWeekToBudget(
  tasks: StudyTask[],
  hoursPerWeek: number,
  extras: SectionId[],
  week: number,
  bankSizes?: Partial<Record<PracticeKind, number>>,
): StudyTask[] {
  const totalWeight = tasks.reduce((sum, t) => sum + t.minutes, 0);
  if (totalWeight <= 0) return tasks;
  const budget = Math.max(tasks.length * MIN_TASK_MINUTES, round5(hoursPerWeek * 60 * WEEKLY_LOAD_FACTOR));

  const sized = tasks.map((task) => sizeTask(task, (task.minutes / totalWeight) * budget, bankSizes));
  let leftover = budget - sized.reduce((sum, t) => sum + t.minutes, 0);
  for (let k = 0; k < extras.length && sized.length < MAX_TASKS_PER_WEEK && leftover >= 25; k += 1) {
    const id = extras[k];
    const extra = sizeTask(
      {
        id: `w${week}-x${k + 1}`,
        title: `${METHODS[id].short}: extrapass`,
        detail: "Veckans övriga tid: bredd i ett delprov utanför fokus.",
        minutes: 0,
        section: id,
        practiceKinds: toPractice(id),
      },
      leftover,
      bankSizes,
    );
    sized.push(extra);
    leftover -= extra.minutes;
  }
  return sized;
}

const PHASES = [
  { phase: "Bas", theme: "rutin" },
  { phase: "Bas", theme: "under tid" },
  { phase: "Bas", theme: "Djup felanalys" },
  { phase: "Bas", theme: "Avstämning" },
  { phase: "Teknik", theme: "Tempo" },
  { phase: "Teknik", theme: "Halvprov" },
  { phase: "Fullprov", theme: "Bred simulering" },
  { phase: "Finish", theme: "Puts och vila" },
] as const;

/**
 * Vilken fas (1–8) vecka i av n hör till. De två sista veckorna är alltid
 * Fullprov och Finish; övriga veckor fördelas i ordning över de sex
 * byggfaserna. En lång plan stannar längre i varje fas och en kort hoppar
 * över några, men planen går aldrig tillbaka till en tidigare fas (förr
 * cyklades faserna och en tioveckorsplan började om på Bas vecka 7).
 */
export function phaseForWeek(i: number, n: number): number {
  if (i === n - 1) return 8;
  if (i === n - 2) return 7;
  const body = n - 2;
  return Math.min(6, Math.floor((i * 6) / body) + 1);
}

/**
 * Bygger veckorna. `focus` är [primär, andra blocket, tredje] och `rotation`
 * resten av delproven, svagast först. Varje vecka får ett underhållspass ur
 * rotationen (nästa delprov varje vecka), så att alla åtta delprov övas under
 * planen och inget delprov får två pass samma vecka.
 */
function buildWeeklyPlans(
  focus: SectionId[],
  rotation: SectionId[],
  weeks: number,
  hoursPerWeek = 10,
  bankSizes?: Partial<Record<PracticeKind, number>>,
): WeekPlan[] {
  const [primary, secondary, tertiary] = focus;
  const p = METHODS[primary].short;
  const s = METHODS[secondary].short;
  const t = METHODS[tertiary].short;
  const n = Math.min(Math.max(weeks, 1), 16);
  const plans: WeekPlan[] = [];
  const allKinds = [...new Set(DELPROV_META.flatMap((m) => toPractice(m.id)))];

  for (let i = 0; i < n; i++) {
    const week = i + 1;
    const cycle = phaseForWeek(i, n);
    const rotated = rotation.map((_, k) => rotation[(i + k) % rotation.length]);
    const upkeep = rotated[0];
    const u = METHODS[upkeep].short;
    const focusPass = (id: string, section: SectionId, title: string, detail: string, weight: number): StudyTask => ({
      id: `w${week}-${id}`,
      title,
      detail,
      minutes: weight,
      section,
      practiceKinds: toPractice(section),
    });
    const mixed = (id: string, title: string, detail: string, weight: number, sections: SectionId[]): StudyTask => ({
      id: `w${week}-${id}`,
      title,
      detail,
      minutes: weight,
      section: sections[0],
      practiceKinds: [...new Set(sections.flatMap((x) => toPractice(x)))],
    });
    const reflect = (id: string, title: string, detail: string, weight: number): StudyTask => ({
      id: `w${week}-${id}`,
      title,
      detail,
      minutes: weight,
      section: primary,
      practiceKinds: ["reflect"],
    });

    let tasks: StudyTask[];
    let focusText: string;
    let theme: string;
    if (cycle === 1) {
      theme = `${p}-rutin + ${s}`;
      focusText = `Bygg daglig rutin runt ${p} och ${s}, utan tidspress.`;
      tasks = [
        focusPass("a", primary, `${p}: fokuspass`, `Din svagaste del. Läs förklaringen till varje fel.`, 40),
        focusPass("b", secondary, `${s}: fokuspass`, `Svagast i det andra blocket.`, 35),
        focusPass("c", tertiary, `${t}: komplettering`, "Tredje prioriteten.", 25),
        focusPass("d", upkeep, `${u}: underhåll`, "Håll nivån i ett delprov utanför fokus.", 20),
      ];
    } else if (cycle === 2) {
      theme = `${p} under tid`;
      focusText = `Samma delar i provtempo: håll tiden per fråga.`;
      tasks = [
        focusPass("a", primary, `${p}: i provtempo`, `Håll provets tid per fråga.`, 40),
        focusPass("b", secondary, `${s}: i provtempo`, `Håll provets tid per fråga.`, 35),
        focusPass("c", tertiary, `${t}: komplettering`, "Tredje prioriteten.", 25),
        focusPass("d", upkeep, `${u}: underhåll`, "Håll nivån i ett delprov utanför fokus.", 20),
      ];
    } else if (cycle === 3) {
      theme = "Djup felanalys";
      focusText = "Fel ska bli mönster du känner igen.";
      tasks = [
        focusPass("a", primary, `${p}: fokuspass`, "Notera för varje fel om det var kunskap, slarv eller tid.", 40),
        focusPass("b", secondary, `${s}: fokuspass`, "Notera för varje fel om det var kunskap, slarv eller tid.", 35),
        reflect("analys", "Felanalys", `Gå igenom veckans fel i ${p} och ${s}. Skriv tre mönster.`, 25),
        focusPass("d", upkeep, `${u}: underhåll`, "Håll nivån i ett delprov utanför fokus.", 20),
      ];
    } else if (cycle === 4) {
      theme = "Avstämning";
      focusText = "Mät lyftet på prioriterade delar och justera.";
      tasks = [
        mixed("mix", "Blandpass prioriterade delar", `${p}, ${s} och ${t} i samma pass. Mät andelen rätt.`, 50, [primary, secondary, tertiary]),
        reflect("analys", "Felanalys", "Kunskap / slarv / tid. Tre konkreta justeringar.", 25),
        mixed("patch", `Lappa ${p} + ${s}`, "Dubbla det som föll mest.", 35, [primary, secondary]),
        focusPass("d", upkeep, `${u}: kontroll`, "Bekräfta nivån utanför fokus.", 20),
      ];
    } else if (cycle === 5) {
      theme = "Tempo";
      focusText = "Samma material, högre precision under tid.";
      tasks = [
        focusPass("a", primary, `${p}: tempo`, "Eliminera alternativ under tid.", 40),
        focusPass("b", secondary, `${s}: tempo`, "Snabb igenkänning utan panikgissning.", 35),
        focusPass("c", tertiary, `${t}: tempo`, "Kort pass i provtempo.", 25),
        focusPass("d", upkeep, `${u}: underhåll`, "Håll nivån i ett delprov utanför fokus.", 20),
      ];
    } else if (cycle === 6) {
      theme = "Halvprov";
      focusText = "Kombinera flaskhalsarna i längre pass.";
      tasks = [
        mixed("halv", "Halvprov fokus", `${p} och ${s} blandat i ett längre pass.`, 60, [primary, secondary]),
        focusPass("c", tertiary, `${t}: tempo`, "Kort pass i provtempo.", 25),
        reflect("analys", "Felanalys", "Var tappade du tid eller precision?", 20),
        focusPass("d", upkeep, `${u}: underhåll`, "Håll nivån i ett delprov utanför fokus.", 20),
      ];
    } else if (cycle === 7) {
      theme = "Bred simulering";
      focusText = "Alla delprov blandat. Notera var energin föll.";
      tasks = [
        { ...mixed("full", "Bred simulering", "Blandat set över alla delprov.", 60, [primary]), practiceKinds: allKinds },
        reflect("review", "Analys efter simulering", "Mönster per delprov.", 30),
        mixed("patch", "Lappa största luckan", `Nästan alltid ${p} eller ${s}.`, 35, [primary, secondary]),
        focusPass("light", upkeep, `${u}: lätt underhåll`, "Korta pass, ingen utmattning.", 20),
      ];
    } else {
      theme = "Puts och vila";
      focusText = "Repetition och energi — inga nya tunga system.";
      tasks = [
        focusPass("a", primary, `${p}: lätt repetition`, "Inga nya knep.", 30),
        focusPass("b", secondary, `${s}: lätt repetition`, "Bara bekanta uppgifter.", 30),
        mixed("c", "Halvprov fokus", "Senast mitt i veckan.", 45, [primary, secondary]),
        reflect("d", "Provdags-check", "Logistik, sömn, sista lätta repetition.", 20),
      ];
    }

    const budget = cycle === 8 ? hoursPerWeek * TAPER_WEEK_SHARE : hoursPerWeek;
    plans.push({
      week,
      phase: PHASES[cycle - 1].phase,
      theme,
      focus: focusText,
      // Ingen extratid i nedtrappningen.
      tasks: fitWeekToBudget(tasks, budget, cycle === 8 ? [] : rotated.slice(1), week, bankSizes),
    });
  }

  return plans;
}

/**
 * Väljer planens tre fokusdelprov ur en rangordning (svagast först): det
 * svagaste, det svagaste i det andra blocket och det näst svagaste av resten.
 * Kvant och verbal normeras var för sig och väger lika, så båda blocken får
 * alltid fokus — förr kunde tre kvantdelar ta all tid och MEK på 45 % få noll.
 */
function selectFocus(ranking: Ranked[]): { focus: SectionId[]; rotation: SectionId[] } {
  const primary = ranking[0];
  const secondary = ranking.find((r) => r.block !== primary.block) ?? ranking[1];
  const tertiary = ranking.find((r) => r.id !== primary.id && r.id !== secondary.id)!;
  const focus = [primary.id, secondary.id, tertiary.id];
  return { focus, rotation: ranking.map((r) => r.id).filter((id) => !focus.includes(id)) };
}

/** Jämför två veckoplaner på de fält som faktiskt ändrar vad användaren ser/övar. */
function weekPlanDiffers(a: WeekPlan, b: WeekPlan): boolean {
  if (a.theme !== b.theme || a.focus !== b.focus) return true;
  if (a.tasks.length !== b.tasks.length) return true;
  for (let i = 0; i < a.tasks.length; i++) {
    const ta = a.tasks[i];
    const tb = b.tasks[i];
    if (
      ta.id !== tb.id ||
      ta.title !== tb.title ||
      ta.detail !== tb.detail ||
      ta.section !== tb.section ||
      ta.questionCount !== tb.questionCount ||
      ta.minutes !== tb.minutes ||
      ta.practiceKinds.join("|") !== tb.practiceKinds.join("|")
    ) {
      return true;
    }
  }
  return false;
}

export function generatePlan(
  scores: ScoreInput,
  options: GeneratePlanOptions = {},
): GeneratedPlan {
  // Veckorna normaliseras en gång här, så att planens längd och profilen alltid
  // visar samma sak. Förr kunde profilen säga 20 veckor medan planen hade 16,
  // och ett icke-numeriskt värde gav en tom plan. Korta horisonter (1-3 veckor)
  // är tillåtna: då blir sista veckan alltid nedtrappningen.
  const weeks = Number.isFinite(scores.weeksUntilExam)
    ? Math.min(Math.max(Math.round(scores.weeksUntilExam), 1), 16)
    : 8;

  const ranked: Ranked[] = DELPROV_META.map((m) => {
    const correct = scores.delprov[m.id] ?? 0;
    const percent = pct(correct, m.total);
    return {
      id: m.id,
      name: m.name,
      correct,
      total: m.total,
      block: m.block,
      percent,
      deficit: Math.max(0, 100 - percent),
    };
  }).sort((a, b) => a.percent - b.percent);

  const overall =
    Math.round(((scores.quantNorm + scores.verbalNorm) / 2) * 100) / 100;
  const totalCorrect = DELPROV_META.reduce(
    (sum, m) => sum + (scores.delprov[m.id] ?? 0),
    0,
  );
  const totalQuestions = DELPROV_META.reduce((sum, m) => sum + m.total, 0);

  const targetOverallNum = Math.min(2, Math.round((overall + 0.4) * 10) / 10);
  const targetVerbalNum = Math.min(
    2,
    Math.max(
      scores.verbalNorm + 0.3,
      scores.verbalNorm < 1.2 ? 1.4 : scores.verbalNorm + 0.2,
    ),
  );

  const delprovScores: DelprovScore[] = DELPROV_META.map((m) => ({
    id: m.id,
    name: m.name,
    correct: scores.delprov[m.id] ?? 0,
    total: m.total,
    block: m.block,
  }));

  // Build section guides: critical/focus first, then rest — but include all practice-relevant ones
  const guideOrder = [
    ...ranked.filter((r) => ["MEK", "ORD", "LAS", "ELF", "DTK"].includes(r.id)),
    ...ranked.filter((r) => ["XYZ", "KVA", "NOG"].includes(r.id)),
  ];
  // dedupe
  const seen = new Set<SectionId>();
  const sections: SectionGuide[] = [];
  for (const r of guideOrder) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    // collapse XYZ/KVA/NOG into one card if all are strengths
    if (["XYZ", "KVA", "NOG"].includes(r.id)) continue;
    const priority = priorityFromPercent(r.percent);
    const meta = METHODS[r.id];
    sections.push({
      id: r.id,
      name: meta.name,
      short: meta.short,
      priority,
      scoreLabel: `${r.correct}/${r.total} (${r.percent} %)`,
      why: whyFor(priority),
      methods: meta.methods,
      weeklyGoal: weeklyGoalFor(r.id, priority),
    });
  }

  // Add combined quant card
  const xyz = ranked.find((r) => r.id === "XYZ")!;
  const kva = ranked.find((r) => r.id === "KVA")!;
  const nog = ranked.find((r) => r.id === "NOG")!;
  const quantAvg = Math.round((xyz.percent + kva.percent + nog.percent) / 3);
  sections.push({
    id: "XYZ",
    name: "Övrig kvant (XYZ, KVA, NOG)",
    short: "Kvant",
    priority: priorityFromPercent(quantAvg),
    scoreLabel: `XYZ ${xyz.percent} % · KVA ${kva.percent} % · NOG ${nog.percent} %`,
    why: `Samlat kvant-läge. Svagaste av de tre: ${[xyz, kva, nog].sort((a, b) => a.percent - b.percent)[0].id}.`,
    methods: [
      "1 blandat underhållspass/vecka utöver DTK",
      "Extra set bara på svagaste av XYZ/KVA/NOG",
      "Fullt kvantitativt delprov var 2.–3. vecka",
    ],
    weeklyGoal: "1 blandat underhållspass + DTK vid behov",
  });

  const hpSelection = selectFocus(ranked);
  const hpFocusIds = hpSelection.focus;
  const hpWeakestQuant = ranked.filter((r) => r.block === "kvant")[0];
  const hpWeekly = buildWeeklyPlans(
    hpFocusIds,
    hpSelection.rotation,
    weeks,
    scores.hoursPerWeek,
    options.bankSizes,
  );

  const trends =
    options.adapt && options.trends && options.trends.length > 0
      ? options.trends
      : [];

  let focusIds = hpFocusIds;
  let rotation = hpSelection.rotation;
  let weakestQuant = hpWeakestQuant;

  let effectiveRanking: Ranked[] = ranked;

  if (trends.length > 0) {
    const blended = [...ranked].sort((a, b) => {
      const da = adjustDeficit(a.id, a.deficit, trends);
      const db = adjustDeficit(b.id, b.deficit, trends);
      return db - da;
    });
    effectiveRanking = blended;
    const selection = selectFocus(blended);
    focusIds = selection.focus;
    rotation = selection.rotation;
    weakestQuant =
      blended.filter((r) => r.block === "kvant")[0] ?? hpWeakestQuant;
  }

  // Samma rangordning som fokus och veckoplan använder. Annars kunde
  // strategikorten och tidfördelningen peka på andra delprov än planen
  // faktiskt prioriterar (t.ex. "ORD först" samtidigt som fokus var NOG).
  const weakestVerbal = effectiveRanking.filter((r) => r.block === "verbal")[0];
  const strongestVerbal = [...effectiveRanking]
    .filter((r) => r.block === "verbal")
    .sort((a, b) => b.percent - a.percent)[0];

  const strategy: StrategyItem[] = [
    {
      title: `${METHODS[weakestVerbal.id].short} först i det verbala`,
      body: `Svagaste verbala del: ${METHODS[weakestVerbal.id].short}. Den får mest tid av det verbala blocket.`,
    },
    {
      title: "Skydda det som redan fungerar",
      body: `${METHODS[strongestVerbal.id].short} är stark. Underhåll — ta inte tid från flaskhalsarna.`,
    },
    {
      title: `På kvant: ${METHODS[weakestQuant.id].short}`,
      body: `Kvantens svagaste: ${METHODS[weakestQuant.id].short}. Putsa den före starka delar.`,
    },
    {
      title: "Felanalys slår volym",
      body: "Skriv efter varje pass varför rätt svar är rätt.",
    },
  ];

  const timeSplit = allocateTime(effectiveRanking);

  const heroSummary = `Snitt ${formatNorm(overall)} (kvant ${formatNorm(scores.quantNorm)} / verbal ${formatNorm(scores.verbalNorm)}). Planen prioriterar ${focusIds
    .slice(0, 2)
    .map((id) => METHODS[id].short)
    .join(" och ")} utifrån dina delprovspoäng.`;

  const focusChanged =
    focusIds.length !== hpFocusIds.length ||
    focusIds.some((id, i) => id !== hpFocusIds[i]);

  // Bygg bara om planen när anpassningen faktiskt ändrade fokus eller kvantdel;
  // annars återanvänds hpWeekly (samma innehåll, färre allokeringar och stabil
  // objektidentitet nedströms).
  const rotationChanged = rotation.join("|") !== hpSelection.rotation.join("|");
  const built =
    !focusChanged && !rotationChanged
      ? hpWeekly
      : buildWeeklyPlans(focusIds, rotation, weeks, scores.hoursPerWeek, options.bankSizes);

  const started = new Set(options.startedWeeks ?? []);
  const weeklyPlans = built.map((w) => {
    const snap = options.lockedWeeks?.[w.week];
    if (snap) return snap;
    if (started.has(w.week)) {
      return hpWeekly.find((h) => h.week === w.week) ?? w;
    }
    return w;
  });

  // Jämför före lås och startade veckor: annars kunde ett gammalt låst snapshot
  // göra att planen påstod sig vara trendanpassad utan att någon trend ändrat
  // något i planen.
  const adaptedApplied =
    trends.length > 0 &&
    (focusChanged ||
      built.some((w) => {
        const hp = hpWeekly.find((h) => h.week === w.week);
        return !hp || weekPlanDiffers(hp, w);
      }));

  return {
    profile: {
      previousQuant: scores.quantNorm,
      previousVerbal: scores.verbalNorm,
      overall,
      totalCorrect,
      totalQuestions,
      targetOverall: `${formatNorm(Math.min(2, overall + 0.3))}–${formatNorm(targetOverallNum)}`,
      targetVerbal: `${formatNorm(targetVerbalNum)}+`,
      weeksUntilExam: weeks,
      hoursPerWeek: scores.hoursPerWeek,
    },
    delprovScores,
    sections,
    strategy,
    timeSplit,
    weeklyPlans,
    dailyTemplate: [
      {
        slot: "Morgon (25–40 min)",
        item:
          focusIds.includes("ORD") || focusIds[0] === "ORD"
            ? "Flashcards / ORD-repetition"
            : `Flashcards + kort ${METHODS[focusIds[0]].short}-set`,
      },
      {
        slot: "Huvudpass (35–50 min)",
        item: `${METHODS[focusIds[0]].short}-övning under tid + felanalys`,
      },
      {
        slot: "Lunch/kväll (20–25 min)",
        item: "Sakprosa: ORD-ord + konnektorer",
      },
      {
        slot: "Underhåll (2×/vecka)",
        item: `${METHODS[weakestQuant.id].short} eller ELF — korta pass`,
      },
      {
        slot: "Söndag (60–90 min)",
        item: "Felanalys och justering av nästa vecka",
      },
    ],
    heroSummary,
    focusIds,
    adaptedFromPractice: adaptedApplied,
  };
}

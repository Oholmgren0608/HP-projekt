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
import { sectionToKinds } from "@/lib/section-kinds";
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

/** Minuter per uppgift: kortare än så är inte ett meningsfullt pass, längre är orealistiskt. */
const MIN_TASK_MINUTES = 20;
const MAX_TASK_MINUTES = 180;
/** Andel av den angivna veckotiden planen lägger upp — resten är repetition och oförutsett. */
const WEEKLY_LOAD_FACTOR = 0.8;
/**
 * Nedtrappningsveckan ("Puts och vila") får en mindre del av veckotiden. Utan
 * det skalades den till samma budget som byggveckorna och nedtrappningen
 * försvann (i mallen är den 140 min mot 190–240 för veckorna närmast före).
 */
const TAPER_WEEK_SHARE = 0.6;

function clampTaskMinutes(minutes: number): number {
  return Math.min(MAX_TASK_MINUTES, Math.max(MIN_TASK_MINUTES, Math.round(minutes / 5) * 5));
}

/**
 * Fördelar veckans tillgängliga tid (hoursPerWeek × 60 × WEEKLY_LOAD_FACTOR) på
 * veckans uppgifter, proportionellt mot mallens minuter så att tyngdpunkten
 * mellan uppgifterna behålls. Klampat per uppgift, och överskott från en
 * klampad uppgift flyttas över till de som har utrymme kvar.
 */
function scaleTasksToWeeklyBudget(tasks: StudyTask[], hoursPerWeek: number): StudyTask[] {
  const totalWeight = tasks.reduce((sum, t) => sum + t.minutes, 0);
  if (totalWeight <= 0) return tasks;

  const budget = Math.max(
    tasks.length * MIN_TASK_MINUTES,
    Math.round((hoursPerWeek * 60 * WEEKLY_LOAD_FACTOR) / 5) * 5,
  );

  const scaled = tasks.map((task) => ({
    ...task,
    minutes: clampTaskMinutes((task.minutes / totalWeight) * budget),
  }));

  let leftover = budget - scaled.reduce((sum, t) => sum + t.minutes, 0);
  for (let pass = 0; pass < 4 && leftover >= scaled.length * 5; pass += 1) {
    const room = scaled.filter((t) => t.minutes < MAX_TASK_MINUTES);
    if (room.length === 0) break;
    const step = Math.floor(leftover / room.length / 5) * 5;
    if (step <= 0) break;
    for (const task of room) {
      const add = Math.min(step, MAX_TASK_MINUTES - task.minutes);
      task.minutes += add;
      leftover -= add;
    }
  }

  return scaled;
}

function buildWeeklyPlans(
  focus: SectionId[],
  weeks: number,
  weakestQuant: SectionId = "DTK",
  hoursPerWeek = 10,
): WeekPlan[] {
  const primary = focus[0] ?? "MEK";
  const secondary = focus[1] ?? "ORD";
  const tertiary = focus[2] ?? "LAS";
  const quant: SectionId = ["DTK", "XYZ", "KVA", "NOG"].includes(weakestQuant)
    ? weakestQuant
    : "DTK";

  const phases = [
    {
      phase: "Bas",
      theme: `${METHODS[primary].short}-rutin + ${METHODS[secondary].short}`,
      focus: `Bygg daglig rutin runt ${METHODS[primary].short} och ${METHODS[secondary].short}.`,
    },
    {
      phase: "Bas",
      theme: `${METHODS[primary].short} under tid`,
      focus: `Öka volym och tempo på ${METHODS[primary].short}.`,
    },
    {
      phase: "Bas",
      theme: "Djup felanalys",
      focus: "Fel ska bli mönster du känner igen.",
    },
    {
      phase: "Bas",
      theme: "Avstämning",
      focus: "Mät lyftet på prioriterade delar och justera.",
    },
    {
      phase: "Teknik",
      theme: "Tempo",
      focus: "Samma material, högre precision under tid.",
    },
    {
      phase: "Teknik",
      theme: "Halvprov",
      focus: "Kombinera flaskhalsarna i längre pass.",
    },
    {
      phase: "Fullprov",
      theme: "Bred simulering",
      focus: "Simulera bredd och utvärdera energi.",
    },
    {
      phase: "Finish",
      theme: "Puts och vila",
      focus: "Repetition och energi — inga nya tunga system.",
    },
  ];

  const n = Math.min(Math.max(weeks, 1), 16);
  const plans: WeekPlan[] = [];

  // Kroppen (Bas/Teknik) cyklas, men de två sista veckorna är alltid "Fullprov"
  // och "Finish": nedtrappningen ska ligga före provet även när horisonten inte
  // är exakt 8 eller 16 veckor. Förr hamnade "Puts och vila" på vecka 8 och en
  // 10-veckorsplan började om på "Bas" två veckor före provet.
  const bodyPhases = phases.length - 2;

  for (let i = 0; i < n; i++) {
    const week = i + 1;
    const cycle =
      i === n - 1
        ? phases.length
        : i === n - 2
          ? phases.length - 1
          : (i % bodyPhases) + 1;
    const meta = phases[cycle - 1] ?? phases[phases.length - 1];
    let tasks: StudyTask[] = [];

    if (cycle <= 3) {
      tasks = [
        {
          id: `w${week}-a`,
          title: `${METHODS[primary].short}: fokuspass`,
          detail: `Träna din svagaste del (${METHODS[primary].short}).`,
          minutes: cycle === 1 ? 35 : 40,
          section: primary,
          practiceKinds: toPractice(primary),
          questionCount: primary === "ORD" ? 10 : 8,
        },
        {
          id: `w${week}-b`,
          title: `${METHODS[secondary].short}: stödpass`,
          detail: `Andra prioriteten (${METHODS[secondary].short}).`,
          minutes: 35,
          section: secondary,
          practiceKinds: toPractice(secondary),
          questionCount: 10,
        },
        {
          id: `w${week}-c`,
          title: `${METHODS[tertiary].short}: komplettering`,
          detail: "Håll bredden utan att stjäla tid från flaskhalsarna.",
          minutes: 25,
          section: tertiary,
          practiceKinds: toPractice(tertiary),
          questionCount: tertiary === "LAS" ? 4 : 6,
        },
        {
          id: `w${week}-d`,
          title: `${METHODS[quant].short}: underhåll`,
          detail: "Kvantitativ lucka / underhåll.",
          minutes: 45,
          section: quant,
          practiceKinds: toPractice(quant),
          questionCount: 4,
        },
      ];
    } else if (cycle === 4) {
      tasks = [
        {
          id: `w${week}-verbal`,
          title: "Blandpass prioriterade delar",
          detail: "Mät råpoäng på dina fokusdelar.",
          minutes: 90,
          section: primary,
          practiceKinds: [
            ...new Set([
              ...toPractice(primary),
              ...toPractice(secondary),
              ...toPractice(tertiary),
            ]),
          ],
          questionCount: 14,
        },
        {
          id: `w${week}-analys`,
          title: "Felanalys",
          detail: "Kunskap / slarv / tid. Tre konkreta justeringar.",
          minutes: 45,
          section: secondary,
          practiceKinds: ["reflect"],
        },
        {
          id: `w${week}-patch`,
          title: `Lappa ${METHODS[primary].short} + ${METHODS[secondary].short}`,
          detail: "Dubbla det som föll mest.",
          minutes: 50,
          section: primary,
          practiceKinds: [...toPractice(primary), ...toPractice(secondary)],
          questionCount: 12,
        },
        {
          id: `w${week}-q`,
          title: `${METHODS[quant].short}-check`,
          detail: "Bekräfta kvantnivån.",
          minutes: 50,
          section: quant,
          practiceKinds: toPractice(quant),
          questionCount: 5,
        },
      ];
    } else if (cycle <= 6) {
      tasks = [
        {
          id: `w${week}-a`,
          title: `${METHODS[primary].short}: tempo`,
          detail: "Eliminering under tid.",
          minutes: 40,
          section: primary,
          practiceKinds: toPractice(primary),
          questionCount: 10,
        },
        {
          id: `w${week}-b`,
          title: `${METHODS[secondary].short}: tempo`,
          detail: "Snabb igenkänning utan panikgissning.",
          minutes: 35,
          section: secondary,
          practiceKinds: toPractice(secondary),
          questionCount: 10,
        },
        {
          id: `w${week}-c`,
          title: "Halvprov fokus",
          detail: "Kombinera dina två svagaste delar.",
          minutes: 70,
          section: primary,
          practiceKinds: [...toPractice(primary), ...toPractice(secondary)],
          questionCount: 12,
        },
        {
          id: `w${week}-d`,
          title: `${METHODS[quant].short}: tempo`,
          detail: "Kort hårt pass.",
          minutes: 45,
          section: quant,
          practiceKinds: toPractice(quant),
          questionCount: 5,
        },
      ];
    } else if (cycle === 7) {
      tasks = [
        {
          id: `w${week}-full`,
          title: "Bred simulering",
          detail: "Blandat set över flera delar. Notera var energin föll.",
          minutes: 90,
          section: primary,
          practiceKinds: [
            ...new Set<PracticeKind>([
              "ord",
              "mek",
              "las",
              "elf",
              "dtk",
              ...toPractice(quant),
            ]),
          ],
          questionCount: 16,
        },
        {
          id: `w${week}-review`,
          title: "Analys efter simulering",
          detail: "Mönster per delprov.",
          minutes: 60,
          section: secondary,
          practiceKinds: ["reflect"],
        },
        {
          id: `w${week}-patch`,
          title: "Lappa största luckan",
          detail: `Nästan alltid ${METHODS[primary].short} eller ${METHODS[secondary].short}.`,
          minutes: 50,
          section: primary,
          practiceKinds: [...toPractice(primary), ...toPractice(secondary)],
          questionCount: 12,
        },
        {
          id: `w${week}-light`,
          title: "Lätt underhåll",
          detail: "Korta pass, ingen utmattning.",
          minutes: 40,
          section: quant,
          practiceKinds: toPractice(quant),
          questionCount: 4,
        },
      ];
    } else {
      tasks = [
        {
          id: `w${week}-a`,
          title: `${METHODS[primary].short}: lätt repetition`,
          detail: "Inga nya knep.",
          minutes: 30,
          section: primary,
          practiceKinds: toPractice(primary),
          questionCount: 6,
        },
        {
          id: `w${week}-b`,
          title: `${METHODS[secondary].short}: lätt repetition`,
          detail: "Bara bekanta uppgifter.",
          minutes: 30,
          section: secondary,
          practiceKinds: toPractice(secondary),
          questionCount: 8,
        },
        {
          id: `w${week}-c`,
          title: "Halvprov fokus",
          detail: "Senast mitt i veckan.",
          minutes: 60,
          section: primary,
          practiceKinds: [...toPractice(primary), ...toPractice(secondary)],
          questionCount: 10,
        },
        {
          id: `w${week}-d`,
          title: "Provdags-check",
          detail: "Logistik, sömn, sista lätta repetition.",
          minutes: 20,
          section: "ELF",
          practiceKinds: ["reflect"],
        },
      ];
    }

    plans.push({
      week,
      phase: meta.phase,
      theme: meta.theme,
      focus: meta.focus,
      tasks: scaleTasksToWeeklyBudget(
        tasks,
        cycle === phases.length ? hoursPerWeek * TAPER_WEEK_SHARE : hoursPerWeek,
      ),
    });
  }

  return plans;
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

    const hpFocusIds = [
    ...new Set(ranked.filter((r) => r.percent < 80).slice(0, 3).map((r) => r.id)),
  ];
  for (const row of ranked) {
    if (hpFocusIds.length >= 2) break;
    if (!hpFocusIds.includes(row.id)) hpFocusIds.push(row.id);
  }

  const hpWeakestQuant = ranked.filter((r) => r.block === "kvant")[0];
  const hpWeekly = buildWeeklyPlans(
    hpFocusIds,
    weeks,
    hpWeakestQuant.id,
    scores.hoursPerWeek,
  );

  const trends =
    options.adapt && options.trends && options.trends.length > 0
      ? options.trends
      : [];

  let focusIds = hpFocusIds;
  let weakestQuant = hpWeakestQuant;

  let effectiveRanking: Ranked[] = ranked;

  if (trends.length > 0) {
    const blended = [...ranked].sort((a, b) => {
      const da = adjustDeficit(a.id, a.deficit, trends);
      const db = adjustDeficit(b.id, b.deficit, trends);
      return db - da;
    });
    effectiveRanking = blended;
    focusIds = blended
      .filter(
        (r) =>
          r.percent < 80 ||
          trends.some((t) => t.id === r.id && t.direction === "weaker"),
      )
      .slice(0, 3)
      .map((r) => r.id);
    if (focusIds.length < 2) {
      focusIds = blended.slice(0, 2).map((r) => r.id);
    }
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
  const built =
    !focusChanged && weakestQuant.id === hpWeakestQuant.id
      ? hpWeekly
      : buildWeeklyPlans(focusIds, weeks, weakestQuant.id, scores.hoursPerWeek);

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

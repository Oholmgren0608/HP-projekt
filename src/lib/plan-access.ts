import type { WeekPlan } from "@/lib/study-plan";

/**
 * Veckoplanen (veckorna och deras uppgifter) kräver ett konto. Beslut
 * 2026-11-06; senare kommer ett krav på prenumeration. Gäster ser vecka 1 som
 * förhandsvisning. Allt annat i planen (prioritering per delprov, strategin)
 * och all övning är öppet för alla (AGENTS.md regel 5).
 *
 * Spärren finns bara i gränssnittet: planen räknas fram i webbläsaren. När ett
 * betalt krav kommer måste behörigheten kontrolleras på servern (AGENTS.md §6).
 */
export type PlanAccess = "loading" | "full" | "preview";

/** Samma nyckel som Supabase-klienten sparar sessionen under (client.ts). */
const SESSION_STORAGE_KEY = "hp-lift-auth";

export function planAccess(input: {
  supabaseConfigured: boolean;
  authLoading: boolean;
  signedIn: boolean;
  storedSession: boolean;
}): PlanAccess {
  // Utan Supabase finns inga konton alls (lokal utveckling): visa hela planen.
  if (!input.supabaseConfigured) return "full";
  if (input.signedIn) return "full";
  // En sparad session räcker: offline kan en utgången token inte förnyas, och
  // då ser användaren ut som utloggad tills nätet kommer tillbaka.
  if (input.storedSession) return "full";
  if (input.authLoading) return "loading";
  return "preview";
}

/** Finns en sparad Supabase-session på enheten (även om token har gått ut)? */
export function hasStoredSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as { refresh_token?: unknown; user?: { id?: unknown } } | null;
    return typeof session?.refresh_token === "string" && typeof session?.user?.id === "string";
  } catch {
    return false;
  }
}

export type PlanPreview = {
  /** Vecka 1, som gästen kan läsa men inte bocka av. */
  firstWeek: WeekPlan;
  /** Resten av veckorna, bara rubriker. */
  lockedWeeks: Array<Pick<WeekPlan, "week" | "phase" | "theme">>;
  /** Antal uppgifter i de låsta veckorna. */
  lockedTaskCount: number;
};

/** Förhandsvisningen av en veckoplan, eller null om planen saknar veckor. */
export function buildPlanPreview(weeklyPlans: readonly WeekPlan[]): PlanPreview | null {
  const [firstWeek, ...rest] = [...weeklyPlans].sort((a, b) => a.week - b.week);
  if (!firstWeek) return null;
  return {
    firstWeek,
    lockedWeeks: rest.map(({ week, phase, theme }) => ({ week, phase, theme })),
    lockedTaskCount: rest.reduce((sum, w) => sum + w.tasks.length, 0),
  };
}

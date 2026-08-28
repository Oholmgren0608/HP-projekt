export const ADAPT_PLAN_KEY = "hp-lift-adapt-plan-v1";
export const ADAPT_PLAN_EVENT = "hp-lift-adapt-plan";

export function loadAdaptPlanEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADAPT_PLAN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAdaptPlanEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADAPT_PLAN_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new Event(ADAPT_PLAN_EVENT));
}

import {
  buildQuiz,
  loadLastShownQuestionIds,
  type ChoiceQuestion,
  type PracticeKind,
} from "@/lib/practice";
import { storageSet } from "@/lib/sync/storage-sync";
import { loadJson } from "@/lib/storage";

/**
 * Lägena "Övning" och "Simulera provpass".
 *
 * Båda använder provets riktiga passlängd: 40 frågor på 55 minuter, eller 80
 * minuter med förlängd provtid (dyslexi). Övning kan köras utan tidsgräns och
 * väljer själv om rättningen visas direkt eller efter passet; provpasset är
 * alltid tidtaget och rättas först efteråt.
 */

export const PASS_QUESTIONS = 40;
export const PASS_SECONDS = 55 * 60;
/** Förlängd provtid vid dyslexi. */
export const EXTENDED_PASS_SECONDS = 80 * 60;

export type RevealMode = "immediate" | "after";
export type PracticeTimeLimit = "off" | "normal" | "extended";
export type ProvpassBlock = "verbal" | "kvant";

/** HP:s fördelning per pass — används så långt frågebanken räcker. */
export const PASS_DISTRIBUTION: Record<
  ProvpassBlock,
  Partial<Record<Exclude<PracticeKind, "reflect">, number>>
> = {
  verbal: { ord: 10, las: 10, mek: 10, elf: 10 },
  kvant: { xyz: 12, kva: 10, nog: 6, dtk: 12 },
};

export const BLOCK_LABELS: Record<ProvpassBlock, string> = {
  verbal: "Verbalt",
  kvant: "Kvantitativt",
};

export type PracticeModeSettings = {
  timeLimit: PracticeTimeLimit;
  reveal: RevealMode;
};

export type ProvpassSettings = {
  block: ProvpassBlock;
  extendedTime: boolean;
};

export const PRACTICE_MODE_STORAGE_KEY = "hp-lift-practice-mode-v1";
export const PROVPASS_MODE_STORAGE_KEY = "hp-lift-provpass-mode-v1";

/** Egen takt och rättning direkt är utgångsläget för övning. */
export const DEFAULT_PRACTICE_MODE: PracticeModeSettings = {
  timeLimit: "off",
  reveal: "immediate",
};

export const DEFAULT_PROVPASS_MODE: ProvpassSettings = {
  block: "verbal",
  extendedTime: false,
};

/** Sekunder för ett tidsval (null = ingen tidsgräns). */
export function timeLimitSeconds(limit: PracticeTimeLimit): number | null {
  if (limit === "extended") return EXTENDED_PASS_SECONDS;
  if (limit === "normal") return PASS_SECONDS;
  return null;
}

/** Antal frågor ett pass får plats med, givet hur många banken har per delprov. */
export function provpassQuestionCount(
  block: ProvpassBlock,
  available: Record<string, number>,
): number {
  let total = 0;
  for (const [kind, want] of Object.entries(PASS_DISTRIBUTION[block])) {
    total += Math.min(want ?? 0, available[kind] ?? 0);
  }
  return total;
}

/**
 * Provpassets frågor: HP-fördelningen per delprov så långt banken räcker, i
 * passets ordning (ORD → LÄS → MEK → ELF respektive XYZ → KVA → NOG → DTK).
 * Blir banken kortare än 40 frågor får passet ändå full pass-tid.
 */
export function buildProvpass(
  block: ProvpassBlock,
  seed: string,
  available: Record<string, number>,
): ChoiceQuestion[] {
  const questions: ChoiceQuestion[] = [];
  for (const [kind, want] of Object.entries(PASS_DISTRIBUTION[block]) as [
    Exclude<PracticeKind, "reflect">,
    number,
  ][]) {
    const take = Math.min(want, available[kind] ?? 0);
    if (take <= 0) continue;
    questions.push(...buildQuiz(kind, `${seed}:${kind}`, take, loadLastShownQuestionIds(kind)));
  }
  return questions;
}

export function loadPracticeModeSettings(): PracticeModeSettings {
  const parsed = loadJson<Partial<PracticeModeSettings> | null>(
    PRACTICE_MODE_STORAGE_KEY,
    null,
  );
  const limit = parsed?.timeLimit;
  const reveal = parsed?.reveal;
  return {
    timeLimit: limit === "off" || limit === "normal" || limit === "extended"
      ? limit
      : DEFAULT_PRACTICE_MODE.timeLimit,
    reveal: reveal === "immediate" || reveal === "after"
      ? reveal
      : DEFAULT_PRACTICE_MODE.reveal,
  };
}

export function savePracticeModeSettings(settings: PracticeModeSettings): void {
  if (typeof window === "undefined") return;
  try {
    storageSet(PRACTICE_MODE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Kvot/privat läge: inställningen får inte krascha övningen.
  }
}

export function loadProvpassSettings(): ProvpassSettings {
  const parsed = loadJson<Partial<ProvpassSettings> | null>(
    PROVPASS_MODE_STORAGE_KEY,
    null,
  );
  return {
    block: parsed?.block === "kvant" ? "kvant" : DEFAULT_PROVPASS_MODE.block,
    extendedTime: parsed?.extendedTime === true,
  };
}

export function saveProvpassSettings(settings: ProvpassSettings): void {
  if (typeof window === "undefined") return;
  try {
    storageSet(PROVPASS_MODE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Kvot/privat läge.
  }
}

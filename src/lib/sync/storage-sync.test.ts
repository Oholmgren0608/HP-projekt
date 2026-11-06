/**
 * Två enheter mot samma konto (docs/KNOWN_ISSUES.md, "Login sync can
 * overwrite progress"). Varje test beskriver ett scenario där ingenting får
 * försvinna, oavsett ordning, nätverk eller enheternas klockor.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { World, answered, objectKeys, srsIds, xpOf } from "@/test/sync-world";

const hoisted = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/client", () => ({
  getSupabase: () => hoisted.client,
  isSupabaseConfigured: () => true,
}));

const UID = "11111111-2222-4333-8444-555555555555";
const HISTORY = "hp-lift-history-v1";
const GAMIFICATION = "hp-lift-gamification-v1";
const SRS = "hp-lift-srs-v1";
const PRACTICE_MODE = "hp-lift-practice-mode-v1";
const WEEKS_REWARDED = "hp-lift-weeks-rewarded-v1";
const REPORTED_DUELS = "hp-lift-reported-duels-v1";
/** Måndag 2 november 2026 kl. 08.00 UTC. */
const START = Date.UTC(2026, 10, 2, 8, 0, 0);
const HOUR = 3_600_000;

let world: World;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  world = new World(hoisted, START);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("synk mellan två enheter", () => {
  it("T1: gästens övning på en ny telefon skriver inte över kontots historik", async () => {
    const a = world.device("A");
    await world.openApp(a);
    await world.login(a, UID);
    const fromA = world.practice(a, "ord", 10, "a1");
    await world.settle(a);
    const xpA = xpOf(a.storage.getItem(GAMIFICATION)).xp;

    world.advance(HOUR);
    const b = world.device("B");
    await world.openApp(b);
    const fromB = world.practice(b, "kva", 5, "b1");
    await world.settle(b);
    const xpB = xpOf(b.storage.getItem(GAMIFICATION)).xp;
    await world.login(b, UID);

    expect(answered(world.cloud(UID, HISTORY))).toBe(15);
    expect(answered(b.storage.getItem(HISTORY))).toBe(15);
    expect(xpOf(world.cloud(UID, GAMIFICATION)).questionsAnswered).toBe(15);
    expect(xpOf(world.cloud(UID, GAMIFICATION)).xp).toBeGreaterThanOrEqual(xpA + xpB);
    expect(srsIds(world.cloud(UID, SRS))).toEqual(
      expect.arrayContaining([...fromA.wrongIds, ...fromB.wrongIds]),
    );
  });

  it("T2: är molnet nyare försvinner inte gästens övning vid inloggning", async () => {
    const b = world.device("B");
    await world.openApp(b);
    world.practice(b, "kva", 5, "b1");
    await world.settle(b);

    world.advance(HOUR);
    const a = world.device("A");
    await world.openApp(a);
    await world.login(a, UID);
    world.practice(a, "ord", 10, "a1");
    await world.settle(a);

    world.advance(HOUR);
    await world.login(b, UID);

    expect(answered(b.storage.getItem(HISTORY))).toBe(15);
    expect(answered(world.cloud(UID, HISTORY))).toBe(15);
    expect(xpOf(world.cloud(UID, GAMIFICATION)).questionsAnswered).toBe(15);
  });

  it("T3: två inloggade enheter som övar samtidigt skriver inte över varandra", async () => {
    const a = world.device("A");
    await world.openApp(a);
    await world.login(a, UID);
    world.practice(a, "ord", 6, "a1");
    await world.settle(a);

    const b = world.device("B");
    await world.openApp(b);
    await world.login(b, UID);
    expect(answered(b.storage.getItem(HISTORY))).toBe(6);

    world.practice(a, "mek", 3, "a2");
    await world.settle(a);
    world.practice(b, "xyz", 4, "b1");
    await world.settle(b);

    // Båda apparna startas om och synkar igen.
    await world.openApp(a);
    await world.openApp(b);
    await world.openApp(a);

    expect(answered(world.cloud(UID, HISTORY))).toBe(13);
    expect(answered(a.storage.getItem(HISTORY))).toBe(13);
    expect(answered(b.storage.getItem(HISTORY))).toBe(13);
    expect(xpOf(world.cloud(UID, GAMIFICATION)).questionsAnswered).toBe(13);
  });

  it("T4: övning offline laddas upp när nätet kommer tillbaka, utan omstart", async () => {
    const a = world.device("A");
    await world.openApp(a);
    await world.login(a, UID);
    world.practice(a, "ord", 6, "a1");
    await world.settle(a);
    expect(answered(world.cloud(UID, HISTORY))).toBe(6);

    world.server.offline = true;
    world.practice(a, "kva", 5, "a2");
    await world.settle(a);
    world.server.offline = false;
    a.win.dispatchEvent(new Event("online"));
    await world.settle(a);

    expect(answered(world.cloud(UID, HISTORY))).toBe(11);
  });

  it("T5: belönade veckor och rapporterade dueller följer med kontot och rensas vid utloggning", async () => {
    const a = world.device("A");
    await world.openApp(a);
    await world.login(a, UID);
    a.mods.engine.recordEvent({ type: "plan_week_complete", week: "3" });
    a.mods.engine.recordEvent({
      type: "duel_end",
      result: "win",
      matchId: "match-1",
      forfeit: false,
      answers: 10,
    });
    await world.settle(a);

    const b = world.device("B");
    await world.openApp(b);
    await world.login(b, UID);
    expect(objectKeys(b.storage.getItem(WEEKS_REWARDED))).toContain("3");
    expect(objectKeys(b.storage.getItem(REPORTED_DUELS))).toContain("match-1");

    await world.logout(b);
    expect(b.storage.getItem(WEEKS_REWARDED)).toBeNull();
    expect(b.storage.getItem(REPORTED_DUELS)).toBeNull();
  });

  it("T6: en enhet vars klocka går ett dygn före vinner inte över en senare ändring", async () => {
    const a = world.device("A", 24 * HOUR);
    await world.openApp(a);
    await world.login(a, UID);
    a.mods.modes.savePracticeModeSettings({ timeLimit: "normal", reveal: "immediate" });
    await world.settle(a);

    world.advance(HOUR);
    const b = world.device("B");
    await world.openApp(b);
    await world.login(b, UID);
    b.mods.modes.savePracticeModeSettings({ timeLimit: "extended", reveal: "after" });
    await world.settle(b);

    world.advance(HOUR);
    await world.openApp(a);

    expect(JSON.parse(world.cloud(UID, PRACTICE_MODE) ?? "{}")).toMatchObject({ timeLimit: "extended" });
    expect(JSON.parse(a.storage.getItem(PRACTICE_MODE) ?? "{}")).toMatchObject({ timeLimit: "extended" });
  });
});

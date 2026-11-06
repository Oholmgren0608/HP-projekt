/**
 * Flera simulerade enheter mot samma FakeServer. Varje enhet har egen
 * localStorage, eget window (egna händelser och egen reload) och egen klocka.
 * Modulerna laddas om per enhet när appen "startas", precis som vid en
 * sidladdning, så modulernas tillstånd hör alltid till en enhet.
 *
 * Testfilen måste själv mocka "@/lib/supabase/client" så att getSupabase()
 * returnerar `hoisted.client` (vi.mock lyfts bara i testfilen).
 */
import { vi } from "vitest";
import { FakeServer, type FakeClient } from "./fake-supabase";
import type { ChoiceQuestion, PracticeKind } from "@/lib/practice-types";

export class MemStorage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

export class FakeWindow extends EventTarget {
  reloadRequested = false;
  readonly location = {
    reload: () => {
      this.reloadRequested = true;
    },
  };
  constructor(readonly localStorage: MemStorage) {
    super();
  }
}

type Modules = {
  sync: typeof import("@/lib/sync/storage-sync");
  practice: typeof import("@/lib/practice");
  outcome: typeof import("@/lib/quiz-outcome");
  engine: typeof import("@/lib/gamification/engine");
  modes: typeof import("@/lib/practice-modes");
};

export type Device = {
  name: string;
  storage: MemStorage;
  win: FakeWindow;
  /** Hur mycket enhetens klocka går fel, i ms. */
  skewMs: number;
  /** Sparad session: null = gäst. */
  userId: string | null;
  client: FakeClient;
  mods: Modules;
};

export type Hoisted = { client: unknown };

export class World {
  /** Den sanna tiden (serverns). Enheternas klockor är den plus sin skew. */
  trueMs: number;
  readonly server: FakeServer;

  constructor(
    private readonly hoisted: Hoisted,
    startMs: number,
  ) {
    this.trueMs = startMs;
    this.server = new FakeServer(() => this.trueMs);
  }

  device(name: string, skewMs = 0): Device {
    const storage = new MemStorage();
    const device = {
      name,
      storage,
      win: new FakeWindow(storage),
      skewMs,
      userId: null,
    } as Omit<Device, "client" | "mods"> as Device;
    device.client = this.server.client(() => device.userId);
    return device;
  }

  /** Låt sanna tiden gå (mellan steg, när ingen enhet arbetar). */
  advance(ms: number): void {
    this.trueMs += ms;
  }

  /** Gör enheten aktiv: dess localStorage, window, klocka och klient. */
  activate(device: Device): void {
    vi.stubGlobal("localStorage", device.storage);
    vi.stubGlobal("window", device.win);
    vi.setSystemTime(this.trueMs + device.skewMs);
    this.hoisted.client = device.client;
  }

  /** Laddar enhetens moduler på nytt, som en sidladdning. */
  async boot(device: Device): Promise<void> {
    this.activate(device);
    vi.resetModules();
    device.mods = {
      sync: await import("@/lib/sync/storage-sync"),
      practice: await import("@/lib/practice"),
      outcome: await import("@/lib/quiz-outcome"),
      engine: await import("@/lib/gamification/engine"),
      modes: await import("@/lib/practice-modes"),
    };
  }

  /** Som AuthProvider: getSession och INITIAL_SESSION anropar båda onAuthChanged. */
  private announceSession(device: Device): void {
    device.mods.sync.onAuthChanged(device.userId);
    device.mods.sync.onAuthChanged(device.userId);
  }

  /** Startar (eller startar om) appen på enheten med den sparade sessionen. */
  async openApp(device: Device): Promise<void> {
    await this.boot(device);
    this.announceSession(device);
    await this.settle(device);
  }

  async login(device: Device, userId: string): Promise<void> {
    this.activate(device);
    device.userId = userId;
    device.mods.sync.onAuthChanged(userId);
    await this.settle(device);
  }

  async logout(device: Device): Promise<void> {
    this.activate(device);
    device.userId = null;
    device.mods.sync.onAuthChanged(null);
    await this.settle(device);
  }

  /**
   * Låter enhetens väntande arbete bli klart: timers (minst 3 s, så att en
   * fördröjd synk hinner köras), nätanrop och omladdningar som appen begär.
   */
  async settle(device: Device): Promise<void> {
    this.activate(device);
    let reloads = 0;
    for (let round = 0; round < 60; round++) {
      await vi.advanceTimersByTimeAsync(250);
      this.trueMs += 250;
      if (device.win.reloadRequested) {
        device.win.reloadRequested = false;
        reloads += 1;
        if (reloads > 3) throw new Error(`${device.name} laddar om i en loop`);
        await this.boot(device);
        this.announceSession(device);
        continue;
      }
      if (round >= 12 && this.server.inflight === 0) return;
    }
  }

  /**
   * En övning på enheten: frågorna loggas som i appen (historik, felkort,
   * mastery, visade frågor) och ger XP. Varannan fråga besvaras fel.
   */
  practice(
    device: Device,
    kind: Exclude<PracticeKind, "reflect">,
    count: number,
    seed: string,
  ): { ids: string[]; wrongIds: string[] } {
    this.activate(device);
    const questions: ChoiceQuestion[] = device.mods.practice.buildQuiz(kind, seed, count);
    const answers: Record<string, number> = {};
    questions.forEach((q, i) => {
      answers[q.id] = i % 2 === 0 ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
    });
    device.mods.outcome.recordQuizOutcome({ source: "free", questions, answers });
    let correct = 0;
    for (const q of questions) {
      const ok = answers[q.id] === q.correctIndex;
      if (ok) correct += 1;
      device.mods.engine.recordEvent({ type: "question", correct: ok });
    }
    device.mods.engine.recordEvent({
      type: "practice_session_complete",
      correct,
      total: questions.length,
    });
    return {
      ids: questions.map((q) => q.id),
      wrongIds: questions.filter((q) => answers[q.id] !== q.correctIndex).map((q) => q.id),
    };
  }

  /** Molnets råa värde för en nyckel. */
  cloud(userId: string, key: string): string | null {
    return this.server.valuesFor(userId)[key] ?? null;
  }
}

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Antal besvarade frågor i en historik (hp-lift-history-v1). */
export function answered(raw: string | null): number {
  const events = parse(raw);
  if (!Array.isArray(events)) return 0;
  return events
    .filter((e) => (e as { type?: unknown })?.type === "quiz")
    .reduce((sum, e) => sum + (Number((e as { total?: unknown }).total) || 0), 0);
}

/** XP och antal besvarade frågor i gamification-state (hp-lift-gamification-v1). */
export function xpOf(raw: string | null): { xp: number; questionsAnswered: number } {
  const state = parse(raw) as { xp?: unknown; stats?: { questionsAnswered?: unknown } } | null;
  return {
    xp: Number(state?.xp) || 0,
    questionsAnswered: Number(state?.stats?.questionsAnswered) || 0,
  };
}

/** Id:n för felkorten (hp-lift-srs-v1). */
export function srsIds(raw: string | null): string[] {
  const map = parse(raw);
  return map && typeof map === "object" && !Array.isArray(map) ? Object.keys(map) : [];
}

/** Nycklarna i ett JSON-objekt, t.ex. { "3": true }. */
export function objectKeys(raw: string | null): string[] {
  return srsIds(raw);
}

/**
 * Frågebankens nedladdning (docs/KNOWN_ISSUES.md, "Question bank download has
 * no timeout"). Oavsett vad nätet gör ska övningen få frågor inom kort tid:
 * den bundlade banken om databasen inte svarar.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({
  fetch: (() => Promise.reject(new TypeError("fetch failed"))) as typeof fetch,
}));

vi.mock("@/lib/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  let client: ReturnType<typeof createClient> | null = null;
  return {
    isSupabaseConfigured: () => true,
    getSupabase: () =>
      (client ??= createClient("http://supabase.test", "anon-test", {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => hoisted.fetch(input, init) },
      })),
  };
});

/** Ett nät som tar emot anropet men aldrig svarar (bara en avbrytning hjälper). */
const hangingFetch: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
      { once: true },
    );
  });

/** Inget nät alls: anropet misslyckas direkt. */
const offlineFetch: typeof fetch = () => Promise.reject(new TypeError("fetch failed"));

async function startLoad() {
  vi.resetModules();
  const provider = await import("@/lib/content/questions-provider");
  let done = false;
  void provider.loadQuestions().then(() => {
    done = true;
  });
  return { provider, isDone: () => done };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("nedladdning av frågebanken", () => {
  it("T7a: hänger nätet används den bundlade banken inom 8 s", async () => {
    hoisted.fetch = hangingFetch;
    const { provider, isDone } = await startLoad();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(isDone()).toBe(true);
    expect(provider.isBankFromDatabase()).toBe(false);
    expect(provider.getQuestions().length).toBeGreaterThan(1000);
  });

  it("T7b: utan nät används den bundlade banken inom 0,5 s", async () => {
    hoisted.fetch = offlineFetch;
    const { provider, isDone } = await startLoad();
    await vi.advanceTimersByTimeAsync(500);
    expect(isDone()).toBe(true);
    expect(provider.isBankFromDatabase()).toBe(false);
  });
});

import app from "vinext/server/fetch-handler";

export * from "vinext/server/fetch-handler";

type WorkerEnv = { CRON_SECRET?: string };
type WorkerContext = { waitUntil(promise: Promise<unknown>): void };
type VinextApp = { fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> };

/**
 * Worker-ingången på Cloudflare: vinexts fetch-hanterare plus gallringsjobbet
 * för Studiehjälp, som på Vercel körs av Vercel Cron (vercel.json). Cron
 * Triggern i cloudflare.config.ts anropar scheduled(), som kör
 * /api/cron/studiehjalp-purge genom appen med CRON_SECRET som Bearer-token,
 * precis som Vercel Cron gör. Ett fel gör att körningen syns som misslyckad i
 * Cloudflares logg.
 */
const worker = {
  ...(app as object),
  async scheduled(_controller: unknown, env: WorkerEnv, ctx: WorkerContext) {
    const request = new Request("https://hp-lift.internal/api/cron/studiehjalp-purge", {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` },
    });
    const response = await (app as VinextApp).fetch(request, env, ctx);
    const body = await response.text();
    if (!response.ok) throw new Error(`Gallringen misslyckades (${response.status}): ${body}`);
    console.log("[gallring]", body);
  },
};

export default worker;

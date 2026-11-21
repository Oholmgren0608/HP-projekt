import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "hp-lift",
    // vinexts fetch-hanterare plus gallringsjobbet (scheduled), se src/worker.ts.
    entrypoint: "./src/worker.ts",
    compatibilityDate: "2026-11-20",
    // Workers Logs är avstängt, så att appens loggar inte sparas hos Cloudflare
    // (Oscars beslut 2026-11-21, docs/juridik/a6-personuppgiftsbitraden.md).
    // Slå inte på det utan att först uppdatera integritetspolicyn och DPIA:n.
    observability: { enabled: false },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    // Gallringen av Studiehjälps underlag, dagligen 03.30 UTC som i vercel.json.
    triggers: [triggers.scheduled({ schedule: "30 3 * * *" })],
    env: {
      ASSETS: bindings.assets(),
      // Profilbilderna kodas om med Cloudflare Images (src/lib/avatar/reencode.workers.ts).
      IMAGES: bindings.images(),
      // Hemligheterna läses via process.env i serverkoden. NEXT_PUBLIC_SUPABASE_*
      // behövs redan när appen byggs, och SUPABASE_URL faller tillbaka på
      // NEXT_PUBLIC_SUPABASE_URL.
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      ANTHROPIC_API_KEY: bindings.secret(),
      REVIEW_ALLOWED_EMAILS: bindings.secret(),
      CRON_SECRET: bindings.secret(),
    },
  }),
});

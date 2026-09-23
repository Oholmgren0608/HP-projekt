/**
 * Tunn omslutning runt Supabase CLI:t.
 *
 * Varför: CLI:t läser inte `.env.local` själv. `db push`/`db dump`/`gen types`
 * mot ett länkat projekt kräver att `SUPABASE_DB_PASSWORD` (och för `link`
 * även `SUPABASE_ACCESS_TOKEN`) finns i miljön. Det här skriptet läser
 * `.env.local`, sätter variablerna och skickar vidare alla argument.
 *
 * Exempel:
 *   npx tsx scripts/db.ts db push --dry-run
 *   npx tsx scripts/db.ts db push
 *   npx tsx scripts/db.ts db dump
 *   npx tsx scripts/db.ts link --project-ref jhrycfampkrouwtsqxhx
 *
 * Saknas `supabase/.temp/project-ref` (ny klon) måste projektet länkas först
 * - se `link` ovan. Körs kommandot utan länk kan `--db-url` användas direkt.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envFile = join(repoRoot, ".env.local");

function readEnv(): Record<string, string> {
  if (!existsSync(envFile)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

/** CLI:t finns sällan på PATH på Windows - leta på kända platser också. */
function findCli(): string {
  if (process.env.SUPABASE_CLI) return process.env.SUPABASE_CLI;
  const kandidater = [
    "supabase",
    join(homedir(), ".local", "bin", process.platform === "win32" ? "supabase.exe" : "supabase"),
  ];
  for (const kandidat of kandidater) {
    const probe = spawnSync(kandidat, ["--version"], { stdio: "ignore", shell: false });
    if (!probe.error) return kandidat;
  }
  console.error(
    "Hittar inte Supabase CLI. Installera det (https://supabase.com/docs/guides/cli) " +
      "eller sätt SUPABASE_CLI till sökvägen.",
  );
  process.exit(1);
}

const env = readEnv();
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Ange ett supabase-kommando, t.ex. `db push --dry-run` eller `db dump --schema-only`.");
  process.exit(1);
}
if (!env.SUPABASE_DB_PASSWORD) {
  console.error(`SUPABASE_DB_PASSWORD saknas i ${envFile} (behövs för att ansluta till databasen).`);
  process.exit(1);
}

// `supabase link` kräver en personlig access token (Management API). Utan den
// skriver vi samma länkfil som `link` hade gjort: CLI:t använder den för att
// välja IPv4-poolern i stället för den IPv6-bara direktanslutningen.
const tempDir = join(repoRoot, "supabase", ".temp");
const poolerFil = join(tempDir, "pooler-url");
if (env.SUPABASE_POOLER_URL) {
  mkdirSync(tempDir, { recursive: true });
  const nuvarande = existsSync(poolerFil) ? readFileSync(poolerFil, "utf8").trim() : "";
  if (nuvarande !== env.SUPABASE_POOLER_URL) writeFileSync(poolerFil, `${env.SUPABASE_POOLER_URL}\n`);
}

const result = spawnSync(findCli(), args, {
  stdio: "inherit",
  cwd: repoRoot,
  env: {
    ...process.env,
    SUPABASE_DB_PASSWORD: env.SUPABASE_DB_PASSWORD,
    // Krävs för `link` (Management API). Valfri - sätts bara om den finns.
    ...(env.SUPABASE_ACCESS_TOKEN ? { SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN } : {}),
  },
});
process.exit(result.status ?? 1);

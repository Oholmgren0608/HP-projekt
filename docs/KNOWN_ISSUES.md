# Known issues

Problems found in code review and browser tests on 2026-11-03. When one is
fixed, change its status to fixed and name the commit.

## Duel answers reach the browser

**Status:** fixed 2026-11-07 (migrations 0035–0037, step 1 of `docs/alla-mot-alla/steg-1-plan.md`).
Duel questions come from the closed question pool, which no client can read and which is not in the
offline copy. The server picks each match's questions, sends one at a time without `correct_index`,
measures the answer time and grades it; the answer and explanation arrive only in the reply to the
answer. Bot answers are simulated on the server (`duel_finish_bot(p_bot_correct)` and the browser bot
are gone), and starting a new bot match settles abandoned ones. Tests: `test-0035-0037.mjs` (61 checks,
PGlite harness) and a browser run of a bot duel and a private duel (no `correct_index` in any
`duel_next_question` response). Remaining, accepted in ADR 0001: answers are shown after each question,
so the pool leaks slowly and must be refilled.

The original problem:

Duel answers are graded on the server, against `duel_questions`, which clients
can't read. But the same questions are public with their answers. The
`questions_select_published` policy (migration 0017) lets anyone read every
published question in full, and the whole bank ships in the JavaScript bundle
(`src/lib/content/fallback-bank.json`). The duel screen also keeps each match's
questions and answers in `localStorage`, to show right and wrong
(`src/components/duel/duel-match.tsx`).

**Impact:** anyone can look up the right answer to each duel question and submit
it with the fastest allowed time. The server accepts it, so duel wins and ELO,
and with them the duel ranking, can be faked. This breaks the AGENTS.md rule that
duel-pool questions never reach the client with `correct_index`.

## Login sync can overwrite progress

**Status:** fixed in 36708c2 (migration 0032) and 6384103. Tests: T1–T6 and
T8–T10 in `src/lib/sync/storage-sync.test.ts`, plus `src/lib/sync/merge.test.ts`.

**Fix:** writes go through `user_state_put`, which only writes if the row still
has the version the device last saw, and the server sets `updated_at`. When both
sides have changed, the values are merged item by item (`src/lib/sync/merge.ts`)
instead of one replacing the other. Changed keys are uploaded 2 s after a write,
when the connection comes back and when the tab becomes visible.

**Limits:**

- Migration 0034 (applied 2026-11-06, after the new client was deployed) closed
  direct INSERT/UPDATE on `user_state`, so old open tabs can no longer overwrite
  merged values; their writes fail and are merged after a reload.
- A conflict found while the app is open is merged at the next app start, not
  immediately.
- Merging two devices' copies can pay a daily-quest reward twice.

The original problem:

`src/lib/sync/storage-sync.ts` merges guest data with the account one
`localStorage` key at a time. The whole value with the newer timestamp wins, and
the timestamps come from each device's clock. Nothing is merged item by item.

**Impact:** progress is lost, not duplicated. In a browser test, an account had
10 answered questions in the cloud. A new device answered 5 as a guest and then
logged in. Afterwards both the device and the cloud had 5, and the account's
history and XP were gone. When the cloud copy is newer, the guest's progress is
discarded instead. Two devices in use at the same time overwrite each other.
Progress made offline while logged in isn't uploaded when the connection comes
back, only at the next sync (in the test, the next app start).

## Question bank download has no timeout

**Status:** fixed in d370212. Tests: T7a and T7b in
`src/lib/content/questions-provider.test.ts`.

**Fix:** `loadQuestions()` gives the database at most 8 s, aborts the requests
and turns off the automatic retries, so the cache or the bundled copy is used
straight away when there is no network. The practice start screen shows
"Laddar frågor…" until the bank is ready.

The original problem:

`loadQuestions()` in `src/lib/content/questions-provider.ts` downloads the whole
published bank on every page load. It waits for the download without a timeout
before falling back to the `localStorage` cache or the bundled copy, and
supabase-js 2.115 retries failed reads three times (after 1, 2 and 4 s).

**Impact:** offline, every screen that needs questions (practice, flashcards,
nivåtest, prov) waits for the retries first. In a browser test, flashcards
appeared after about 9 s offline, against 4 s online. When the network hangs
instead of failing (weak signal, captive portal), the questions never load.
Flashcards were still loading after 90 s, and the practice start screen only
offered "1" question.

## Weekly XP leaderboard trusts client-reported XP

**Status:** fixed in cc637fd (migration 0033). The leaderboard was removed
(Oscar's decision on 2026-11-06, including deleting the `leaderboard_entries`
data). XP, levels and streaks are personal; duels with ELO are the only ranking.

The original problem:

XP is calculated in the browser (`src/lib/gamification/engine.ts`) and sent with
`leaderboard_submit`, which only caps it at 25,000 per week (migration 0016).
`leaderboard_get` can be called by anyone, including anonymous visitors, and
returns each entry's user id, display name and XP.

**Impact:** any logged-in user can put any value up to the cap on the weekly
ranking with a single call, and anyone can read the ranking through the API. No
screen in the app shows it today (`fetchLeaderboard` is unused).

## minimatch override under shadcn's ts-morph

**Status:** open, worked around on 2026-11-20 (PR #7) with an `overrides` entry in
`package.json`. Remove it when shadcn depends on ts-morph 28 or newer.

`shadcn` (latest 4.23.0) depends on `ts-morph` `^26.0.0`, which uses
`@ts-morph/common` 0.27 with `minimatch` 10. npm audit reports minimatch below
11.0.1 (GHSA-g3hv-75wg-m249, denial of service through crafted glob patterns), and
audit's own fix is a downgrade to shadcn 1.0.0. The override gives
`@ts-morph/common` minimatch `^11.0.1` instead. `@ts-morph/common` only calls
`minimatch(path, pattern)`, which minimatch 11 still has, and ts-morph's glob
matching gave the same results with minimatch 10 and 11.

**Impact:** none in the app. shadcn is a dev dependency, and the shadcn CLI never
calls ts-morph's glob functions.

**To remove it:** when `npm view shadcn dependencies.ts-morph` shows `^28` or
newer, delete the `overrides` entry, run `npm install` and check that
`npm audit` still finds nothing.

## fflate override under vinext's @vercel/og

**Status:** open, worked around on 2026-11-21 (PR #6) with an `overrides` entry in
`package.json`. Remove it when satori depends on fflate 0.7.5 or newer.

`vinext` depends on `@vercel/og`, whose `satori` pins `fflate` to exactly 0.7.3. npm
audit reports fflate below 0.7.5 (GHSA-px8p-9vwx-vf98, `unzipSync` can loop forever on
a malformed ZIP64 archive), and audit's own fix is a downgrade to vinext 0.2.1. The
override gives satori fflate `~0.7.5`, a patch release in the same 0.7 line.

**Impact:** none in the app. `@vercel/og` is only used for `next/og` images, which
HP Lift does not use.

**To remove it:** when the satori version that `@vercel/og` uses depends on fflate
0.7.5 or newer (`npm ls satori`, then `npm view satori@<version> dependencies.fflate`),
delete the `satori` entry from `overrides`, run `npm install` and check that
`npm audit` still finds nothing.

## npm 12 refuses `npm audit fix --dry-run`

**Status:** open, npm bug (seen with npm 12.0.2 on 2026-11-20).

`npm audit fix --dry-run` and `npm update --dry-run` stop with `EALLOWREMOTE`
("Fetching packages of type "remote" have been disabled") for
`@tailwindcss/oxide-wasm32-wasi`. A dry run makes npm build a complete dependency
tree, and for that it unpacks each package with bundled dependencies from its
tarball URL. npm 12 treats that URL as a remote dependency, which its default
`allow-remote=none` blocks, even though the tarball comes from the npm registry.

**Workaround:** run the command without `--dry-run`, which does not unpack the
tarball, and review the result with `git diff package.json package-lock.json`.
To undo it, run `git checkout -- package.json package-lock.json` and `npm ci`.

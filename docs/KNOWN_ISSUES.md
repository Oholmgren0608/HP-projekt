# Known issues

Open problems found in code review and browser tests on 2026-11-03. When one is
fixed, change its status to fixed and name the commit.

## Duel answers reach the browser

**Status:** open

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

**Status:** open

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

**Status:** open

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

**Status:** open

XP is calculated in the browser (`src/lib/gamification/engine.ts`) and sent with
`leaderboard_submit`, which only caps it at 25,000 per week (migration 0016).
`leaderboard_get` can be called by anyone, including anonymous visitors, and
returns each entry's user id, display name and XP.

**Impact:** any logged-in user can put any value up to the cap on the weekly
ranking with a single call, and anyone can read the ranking through the API. No
screen in the app shows it today (`fetchLeaderboard` is unused).

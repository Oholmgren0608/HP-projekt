# AGENTS.md — HP Lift

Read this before every task. If anything here conflicts with a task request, STOP and ask.

## 1. Non-negotiable rules (never break these)
1. **UHR questions are never shown to users.** UHR material is used only as a model for writing new questions.
   Never remove, weaken, or route around the database block. Every new query, API route or view that reads
   questions must keep the block in place.
2. **Staff-only stays staff-only.** The Studiehjälp pilot (expert applications, reviews, expert profiles, admin, audit log)
   must only be reachable by users with the staff/admin role. Check access on the server and in RLS, not only in the UI.
3. **Expert documents are private.** Only admins can read uploaded application documents. Never make the storage bucket public
   and never create public or long-lived URLs for these files.
4. **No secrets in client code.** The Supabase service-role key and other secrets must never be imported into a client component
   or a `NEXT_PUBLIC_*` variable.
5. **The app works without an account.** Guest data lives in the browser and syncs after login. Never make a core study feature
   require login unless the task explicitly says so. The one exception (Oscar's decision, 2026-11-06): the veckoplan's weeks and
   tasks require an account; guests see week 1 as a preview (`src/lib/plan-access.ts`). Practice, the nivåtest, results and the
   per-delprov priorities stay open. This gate is UI-only, because the plan is built in the browser; a paid gate must be checked
   on the server (§6).
6. **Don't change database security silently.** Any change to RLS policies, roles or storage rules goes in a migration,
   gets called out in your summary, and gets a test.
7. **Every audit-logged action stays audit-logged.** Admin and review actions write to the audit log.

## 2. Out of scope right now (do NOT build, even though the v2.0 spec mentions them)
- Payments and payouts (waiting for the company to be registered)
- Video / Creator Studio (no provider chosen yet)
- Subscription tiers and ads (decision pending). The veckoplan is meant to become a subscriber feature; until subscriptions
  leave this list it only requires an account (rule 5).
If a task seems to need one of these, stop and ask.

## 3. Stack
- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS
- Supabase: Postgres, Auth, Storage, RLS
- Hosted on Vercel
- UI language: **Swedish**. Code, comments and commit messages: comments and commits in **Swedish**
  (commits as `<type>(<scope>): …`, e.g. `feat(fragebank): …`); names in code in English, keeping Swedish domain words
  such as `delprov`, `veckoplan`, `nivatest` and `prov`.

## 4. Commands
- Dev server: `npm run dev` (http://127.0.0.1:43123)
- Build: `npm run build`; `npm run start` serves the built app on the same port
- Type check: `npx tsc --noEmit` (there is no `typecheck` script)
- Lint: `npm run lint`
- Tests: Vitest. `npm test` runs all tests once; `npm run test:watch` watches. Test files are `*.test.ts` next to the code
  they test, and shared helpers live in `src/test/` (an in-memory Supabase and simulated devices for sync tests). Tests run
  in the `node` environment. Type check, lint, `npm test` and `npm run build` are the checks, and your summary must say which
  tests you ran and whether they passed.
- DB migrations: add a new file `supabase/migrations/NNNN_<name>.sql` by hand, numbered after the highest one
  (not `supabase migration new`, which names files by timestamp). Never edit a migration that is already applied.
  Dry run: `npm run db:dry`. Apply: `npm run db:push`. See what is applied: `npm run db -- migration list`.
  These pass their arguments to the Supabase CLI through `scripts/db.ts`, which needs:
  - The Supabase CLI. It is not an npm dependency: install it (the script looks on `PATH` and in `~/.local/bin`) or set
    `SUPABASE_CLI` to its path.
  - `SUPABASE_DB_PASSWORD` in `.env.local`; the script stops without it. `SUPABASE_POOLER_URL` (optional) makes the CLI use
    the IPv4 pooler instead of the IPv6-only direct connection. Neither variable is in `.env.local.example`.
  - On a fresh clone, a one-time link: `npm run db -- link --project-ref <ref>`. The ref is in the comment at the top of
    `scripts/db.ts`, and `link` also needs `SUPABASE_ACCESS_TOKEN` in `.env.local`.
- Question bank: `npm run fragebank:validate` → `fragebank:kontroll` → `fragebank:upload` (as drafts) → `fragebank:export`
  (rewrites the offline copy); `fragebank:aldre` and `fragebank:balansera` handle the older questions. Code in `scripts/fragebank/`, steps in `README.md`.

## 5. Project map
- `src/app/` — routes and pages, with Swedish route names (`/plan`, `/ova`, `/prov`, `/nivatest`, `/resultat`, `/duell`, `/forum`, `/profil`, …).
  `/review` is where questions are spot-checked and published, `/studiehjalp` is the staff-only pilot, and
  `api/cron/studiehjalp-purge` is its cleanup job (scheduled in `vercel.json`).
- `src/components/` — shared UI. `ui/` holds the shadcn primitives; `app-shell.tsx` is the sidebar (desktop) and tab bar (mobile).
  Feature folders: `auth/`, `duel/`, `forum/`, `gamification/`, `quiz/`, `studiehjalp/`, `feedback/`.
- `src/lib/` — Supabase clients, scoring, plan logic:
  - `supabase/` — `client.ts` (browser client and the typed `Database`), `server.ts` (server-only, service-role key), `auth-context.tsx`
  - `content/` — question loading (`questions-provider.ts`), the offline copy `fallback-bank.json` (generated by `npm run fragebank:export`),
    DTK tables, charts and maps (`dtk-figures.ts`)
  - `sync/storage-sync.ts` — guest data in `localStorage`, merged into Supabase on login
  - `subtests.ts` — the eight delprov; `study-plan.ts` + `plan-generator.ts` — the week plan; `hp-scores.ts` + `progress-history.ts` —
    scores and forecast; `error-srs.ts` — error cards for "Dagens repetition"
  - `studiehjalp/`, `duel/`, `gamification/`, `feedback/` — feature logic
- `supabase/migrations/` — schema and RLS
- `supabase/manual/` — rollback and verification SQL run by hand, not migrations. `supabase/combined_migrations.sql` is an old copy of
  0001–0009 that is already applied; don't run it.
- `scripts/` — `db.ts` (Supabase CLI wrapper), `fragebank/` (question-bank pipeline), `import-prov/` (imports UHR exams, used only as models)
- `content/ovningsfragor/` — new practice questions per delprov (JSON) before upload; `content/aldre-fragor/` — second check of the older questions
- `docs/` — `studiehjalp/` (v2.0 spec and phase docs), `juridik/` (privacy policy, DPIA), `agents/` (issue tracker, labels, domain docs),
  `KNOWN_ISSUES.md` (open problems); `GLOSSARY.md` is at the root
- `future-changes/` — deferred follow-up work (mostly duels); `anteckningar/` — project notes; `.agents/agents/` — agent definitions;
  `.superdesign/` — the Lugn design system and drafts
- Question bank: lives in the database (about 1,600 questions, 8 subtests: ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK)

## 6. Domain rules
- Full test: 40 questions in 55 min (80 min with extended time). Quick test: 24 questions in 20 min.
- Every question has an explanation. DTK questions have real tables, charts and maps.
- New questions: automatic checks → solved by a second AI without the key → saved as **draft** → published only after a human spot check.
  Never publish questions directly.
- Missed questions become error cards in "Dagens repetition".
- Score forecast / normerad poäng: the conversion is in `src/lib/progress-history.ts`. `estimateNormFromPercent()` turns % correct into a
  rough 0,0–2,0 (not UHR's official normering table) and `prognosisFromExercises()` builds the forecast (a delprov counts from 10 answers);
  rounding and limits are in `clampNorm()` in `src/lib/hp-scores.ts`. Don't change this logic without being asked.
- Practice answers are public by design (offline/guest). Anything competitive or paid must never depend on secrets that exist in the public bank, bundle or localStorage.
- Duel answers are graded only on the server. Duel-pool questions never reach the client with correct_index.

## 7. Design system "Lugn"
Full reference: `DESIGN.md` (tokens, components, rules) with its sidecar `.impeccable/design.json`; product context in `PRODUCT.md`.
- Flat surfaces, no heavy shadows or gradients.
- One accent colour: blue `--brand` (`#2b4c7e` light, `#8da9d6` dark) in `src/app/globals.css`. Tailwind token: `primary`
  (`bg-primary`, `text-primary`; `ring` and `chart-1` also point to `--brand`); components also use `[var(--brand)]` directly.
  The shadcn `accent` token is only the pale tint `--accent-soft`, not the accent colour.
- Green and red are used **only** for right and wrong answers — never for buttons, badges or decoration.
- Font: IBM Plex Sans.
- Sidebar on desktop, tab bar on mobile.
- Every screen must work in both light and dark mode.

## 8. How to work
1. For anything bigger than a small fix: read the relevant files and **propose a plan first. Don't write code until I approve.**
2. Keep changes small and focused on the task. No drive-by refactors.
3. Reuse existing components and helpers before writing new ones.
4. Ask instead of guessing when requirements are unclear.

## 9. Definition of done
A task is done only when all of these hold:
- [ ] Type check, lint and tests pass
- [ ] New logic has tests; any security change has a test that tries to break it
- [ ] Works on a mobile width and in dark mode
- [ ] No rule in section 1 is weakened
- [ ] You give a short summary: what changed, which files, any migration or RLS changes, and what I should check by hand

## 10. Keep this file current
When a decision changes (for example, a feature leaves "out of scope"), update this file in the same change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

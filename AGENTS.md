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
   require login unless the task explicitly says so.
6. **Don't change database security silently.** Any change to RLS policies, roles or storage rules goes in a migration,
   gets called out in your summary, and gets a test.
7. **Every audit-logged action stays audit-logged.** Admin and review actions write to the audit log.

## 2. Out of scope right now (do NOT build, even though the v2.0 spec mentions them)
- Payments and payouts (waiting for the company to be registered)
- Video / Creator Studio (no provider chosen yet)
- Subscription tiers and ads (decision pending)
If a task seems to need one of these, stop and ask.

## 3. Stack
- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS
- Supabase: Postgres, Auth, Storage, RLS
- Hosted on Vercel
- UI language: **Swedish**. Code, comments and commit messages: TODO (English or Swedish — pick one).

## 4. Commands
<!-- TODO: replace with your real scripts from package.json -->
- Dev server: `npm run dev`
- Type check: `npm run typecheck`  (TODO: confirm this script exists)
- Lint: `npm run lint`
- Tests: `npm test`  (TODO)
- DB migrations: TODO (e.g. `supabase migration new <name>`, `supabase db push`)

## 5. Project map
<!-- TODO: fill in the real folders so the agent doesn't have to guess -->
- `app/` — routes and pages
- `components/` — shared UI
- `lib/` — Supabase clients, scoring, plan logic
- `supabase/migrations/` — schema and RLS
- Question bank: lives in the database (about 1,600 questions, 8 subtests: ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK)

## 6. Domain rules
- Full test: 40 questions in 55 min (80 min with extended time). Quick test: 24 questions in 20 min.
- Every question has an explanation. DTK questions have real tables, charts and maps.
- New questions: automatic checks → solved by a second AI without the key → saved as **draft** → published only after a human spot check.
  Never publish questions directly.
- Missed questions become error cards in "Dagens repetition".
- Score forecast / normerad poäng: TODO (point to the file holding the conversion logic, and don't change it without being asked).

## 7. Design system "Lugn"
- Flat surfaces, no heavy shadows or gradients.
- One accent colour: TODO (name the Tailwind token).
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

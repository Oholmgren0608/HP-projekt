# AGENTS.md - Repository Guidelines

You are an expert engineer working on **HP Lift**, a Swedish Högskoleprov (HP)
study-plan web app. It is a single Next.js application — there is no separate
frontend/backend split, Express server, or Prisma layer.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript (strict),
  Tailwind CSS v4, shadcn/ui (`base-nova` style on `@base-ui/react`),
  `lucide-react` icons, and `cva`/`clsx`/`tailwind-merge`.
- **Data & auth:** Supabase (Postgres + auth) via `@supabase/supabase-js` v2,
  with a typed client. Data lives in `localStorage` and optionally syncs to
  Supabase on login.
- **Layout:** routes in `src/app`, UI in `src/components`, logic in `src/lib`,
  SQL migrations in `supabase/migrations`.

## 🎨 Frontend

**Trigger:** Apply when editing files under `src/app` or `src/components`.

- Use React functional components only. Never use class components.
- Use Tailwind utility classes. Do not create new `.css` files or use inline
  `style={{}}` unless dynamically calculating dimensions.
- Use shadcn/ui components from `src/components/ui`; do not add dependencies.
- Fetch data with the typed Supabase client from `@/lib/supabase/client` and
  auth via `@/lib/supabase/auth-context`. Never use raw `fetch`, and do **not**
  add React Query.
- Add `"use client"` only when a component genuinely needs hooks, state, or
  browser APIs.
- Use the `@/*` path alias (maps to `./src/*`).
- Read `localStorage`/`window` only behind `@/lib/use-hydrated` to avoid
  hydration mismatches.

## ⚙️ Backend / Data (Supabase)

**Trigger:** Apply when editing `supabase/migrations` or `src/lib/supabase`.

- Make schema changes as new numbered SQL migrations in `supabase/migrations`
  (next is `0004_<name>.sql`). Never edit already-applied migrations
  (`0001`–`0003`).
- Enable Row Level Security on every table with least-privilege policies using
  `auth.uid()` / `auth.role()`.
- Put atomic/anti-cheat logic (e.g. ELO and stat updates) in `SECURITY DEFINER`
  functions so the client can never write those values directly. Set
  `search_path = public` and re-check `auth.uid()` inside.
- After a schema change, update the typed `Database` in
  `src/lib/supabase/client.ts`.
- `user_state` is a generic key/value `jsonb` sync table using "newest wins"
  (`updated_at`) semantics — do not add per-feature columns there.
- Never log sensitive user data or tokens.

## ✅ Verification

Run these checks after changes (there is **no** `npm run test` script):

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

The dev server runs on `http://127.0.0.1:43123` (`npm run dev`).

## Gotchas

- `src/lib/subtests.ts` is the single source of truth for the eight HP subtests
  (names, short labels, question counts, block, and pace).
- `src/lib/sync/storage-sync.ts` is a drop-in replacement for
  `localStorage.getItem/setItem` and handles the cloud merge on login.
- Swedish user-facing copy and identifiers (`delprov`, `veckoplan`, `nivatest`,
  `prov`) are intentional — do not "correct" them to English.

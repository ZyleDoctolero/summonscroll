# SummonScroll — Reconciling the two codebases

_Written after inspecting both `main` (local, Supabase era) and `origin/main` (the new
Express/Prisma rewrite pushed 2026-07-06)._

---

## 1. What actually happened

Your `origin/main` was **completely rewritten** in one commit
(`15a6c2a … replace old Lovable/Supabase codebase with new Express/Prisma fullstack`):
**755 files changed, +41k / −66k lines.** It is not a new version of the old app — it is a
different app with the same name.

| | **OLD** (my 8 commits, now on branch `supabase-era-backup`) | **NEW** (`origin/main`) |
|---|---|---|
| Frontend | React 19 + TanStack Router + Vite | React 19 + TanStack Router + Vite 8 (same family) |
| Frontend structure | `src/routes/_authenticated/*`, `src/lib/game/*` | `src/features/<feature>/{api,components,hooks,store}` |
| Data access | `@supabase/supabase-js` calls straight from the browser | `src/lib/api` → fetch → **Express** API |
| Backend | Supabase (RLS + Postgres RPCs + edge functions) | **Express 5 + Prisma 7** server (`server/`), JWT auth, WebSocket, node-cron |
| Database | Supabase Postgres (my migrations/seed/cron) | Any Postgres via `DATABASE_URL` (Prisma-managed) |
| Tasks model | one `tasks` table with a `type` column | **separate `Habit`, `Daily`, `Todo`** Prisma models |
| Auth | Supabase Auth | JWT (`bcryptjs`, access + refresh tokens) |

### Why "just merge and push" is not possible
My 8 commits edit files like `src/lib/game/tasks-client.ts`, `src/routes/_authenticated/index.tsx`,
and the Supabase migrations — **all of which were deleted in the rewrite.** A `git merge` would
either explode in conflicts or, worse, silently *resurrect the deleted Supabase app* on top of
the clean new one. Force-pushing would *destroy* the new rewrite. Neither is acceptable.

**So "merge both" really means: keep the NEW app as the foundation and re-apply the good ideas
from my work by hand.** "Run on Supabase" really means: point the NEW app's database at your
Supabase Postgres (Supabase *is* Postgres). Both are covered below.

---

## 2. Your three options

- **Option A — Adopt the new app, host its DB on Supabase. ✅ Recommended.**
  The rewrite is clearly a deliberate, production-grade effort (87-task spec, tests, rate
  limiting, deployment checklists). Make it your `main`, and keep using Supabase — but as a
  *plain Postgres host*, driven by Prisma, not by the old RLS/RPC/edge-function setup.

- **Option B — Adopt the new app, run its DB locally.**
  Same as A but the database is local Postgres (`start-postgres.ps1` ships with the repo).
  Simplest to get running; no cloud needed.

- **Option C — Stay on the old Supabase app.**
  Abandon the rewrite, `git reset --hard` main back to `supabase-era-backup`, force-push.
  Only sane if you decide the rewrite was a mistake. You'd throw away the Express/Prisma work.
  **Not recommended** — you lose a lot of finished production hardening.

The rest of this guide is **Option A** (with B as a one-line variation), plus how to port my
UI/UX improvements onto the new app.

---

## 3. Step 0 — Safety (already done)

Your Supabase-era work (all 8 commits) is preserved on the branch **`supabase-era-backup`**.
Nothing below can lose it. To look at it later: `git switch supabase-era-backup`.

---

## 4. Option A — Adopt the new app + run on Supabase

### 4.1 Switch local `main` to the new codebase
```bash
cd C:/Users/Zyle/Downloads/Portfolio/SummonScroll-Fresh
git fetch origin
git checkout main
git reset --hard origin/main      # main now == the new Express/Prisma app
```
(Your old work is still on `supabase-era-backup`, untouched.)

### 4.2 Install everything
```bash
npm install                 # frontend deps (root)
cd server && npm install    # backend deps
cd ..
```

### 4.3 Point Prisma at your Supabase database
Supabase gives you two connection strings (Dashboard → Project Settings → Database →
Connection string). Prisma needs **both** a pooled URL (for the app) and a direct URL (for
migrations). For your project (`nvqbbbcvyhqwqfutpnje`, region `ap-northeast-1`) they look like:

```
# Pooled (app runtime) — port 6543, pgbouncer
DATABASE_URL="postgresql://postgres.nvqbbbcvyhqwqfutpnje:<DB_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct (migrations) — port 5432
DIRECT_URL="postgresql://postgres.nvqbbbcvyhqwqfutpnje:<DB_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```
Get `<DB_PASSWORD>` from Supabase → Database → **Reset database password** (copy it once).

Put these in **`server/.env`** (copy from `server/.env.example`), and also set the JWT secrets:
```bash
# in server/.env
DATABASE_URL="...pooler...:6543/postgres?pgbouncer=true"
DIRECT_URL="...pooler...:5432/postgres"
JWT_SECRET="<run: openssl rand -hex 32>"
JWT_REFRESH_SECRET="<run: openssl rand -hex 32>"
PORT=3001
WS_PORT=3002
```

Then make sure `prisma/schema.prisma`'s datasource uses both (add `directUrl` if missing):
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

> ⚠️ **This creates fresh, Prisma-managed tables.** It will **not** reuse the old
> `tasks`/`profiles` tables I seeded — the new app has its own schema (`Habit`, `Daily`,
> `Todo`, `Monster`, …) and its own seed. The old tables can stay in the DB harmlessly or be
> dropped later. If you want a clean database, create a *new* Supabase project for the new app
> and keep the old one as an archive.

### 4.4 Create the schema + seed it
```bash
cd server
npm run db:generate                 # prisma generate
npx prisma migrate deploy --schema=../prisma/schema.prisma   # or: npm run db:migrate  (first time)
npm run db:seed                     # tsx ../prisma/seed.ts — seeds realms, monsters, banners, shop…
cd ..
node download_images.js             # pulls monster art referenced by the seed (if it fetches remote art)
```

### 4.5 Run it
```bash
# terminal 1 — API + WebSocket
cd server && npm run dev            # Express on :3001, WS on :3002

# terminal 2 — frontend
npm run dev                         # Vite dev server
```
Open the Vite URL. Check `server/` logs for DB connection success. The frontend talks to the
API through `src/lib/api` — if it 404s, confirm the API base URL / Vite proxy in
`vite.config.ts` points at `http://localhost:3001`.

### Option B variation (local DB instead of Supabase)
Skip 4.3's Supabase strings. Instead:
```bash
./start-postgres.ps1                 # boots local Postgres (Docker)
# server/.env: DATABASE_URL="postgresql://user:password@localhost:5432/summonscroll"
#              DIRECT_URL  ="postgresql://user:password@localhost:5432/summonscroll"
```
Then run 4.4 and 4.5 unchanged.

---

## 5. Re-applying my improvements onto the new app (the real "merge")

None of this is a git merge — it's porting ideas, file-by-file, because the new frontend is
still React + TanStack so the concepts transfer. Do these as **fresh commits on the new
`main`.** Priority order:

| My improvement (from `supabase-era-backup`) | Where it goes in the NEW app | Notes |
|---|---|---|
| **WCAG contrast tokens** (`--gold-ink`, `--violet-ink`, darkened stat/success/danger) | the new global CSS / `tailwind.config.ts` theme | Highest value, lowest risk. Pure color values. Compare against the new palette first. |
| **Auto-assign realm/element on create** (no micro-managing) | `server/src/routes/habits.ts` create handler | Server-side now: on create, if `realmAffinity` is null, set a random 1–12. Element lives on monsters, not habits, in the new schema — skip element. |
| **Quick-add + Today tab + due dates** | `src/features/habits/components/*` + `TodoList.tsx` | The new app already splits Habit/Daily/Todo; a "Today" view = dailies scheduled today + todos with `questDeadline` ≤ today. |
| **Hub layout: board first, quiet support row** | the new hub/dashboard route under `src/features` or `src/routes` | Rebuild against the new components (Card/Button/Modal already exist in `src/components/ui`). |
| **Parchment surfaces, no purple glow, sharp pixel borders** | new `Card`/`Modal`/global CSS | The new app has its own design system — decide whether to keep its look or re-skin to parchment. Don't blind-paste. |
| Supabase migrations / `daily-cron` / `run_daily_reset` fix | **Do not port.** | The new app uses Prisma + `server/src/lib/scheduler.ts` (node-cron) for the same job. Reference my logic if theirs is missing daily reset, but implement it their way. |

Compare the two files side by side without leaving git:
```bash
git show supabase-era-backup:src/routes/_authenticated/index.tsx   # my hub
git show main:src/features/... (the new hub file)                  # their hub
```

---

## 6. Committing & pushing (clean, no history rewrite)

Once you're on the new `main` and have made any port commits:
```bash
git add -A
git commit -m "feat(ui): port parchment theme + AA contrast + quick-add from supabase-era"
git push origin main            # fast-forward — no --force, no conflict
```
Because local `main` now descends from `origin/main`, this is a normal fast-forward push.

Keep `supabase-era-backup` around until you're happy. To publish it as an archive (optional):
```bash
git push origin supabase-era-backup
```

---

## 7. TL;DR

1. Your old work is safe on **`supabase-era-backup`**.
2. Don't merge/force-push — the two are different apps.
3. Adopt the new Express/Prisma app as `main` (`git reset --hard origin/main`).
4. To "keep Supabase": set the new app's `DATABASE_URL`/`DIRECT_URL` to your Supabase
   connection strings and run `prisma migrate deploy` + `db:seed` (fresh tables).
5. Re-apply my UI/UX wins (contrast tokens, auto-assign, quick-add, board-first hub) as new
   commits on the new codebase, then a normal `git push`.

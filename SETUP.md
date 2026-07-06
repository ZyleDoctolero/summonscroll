# SummonScroll — Setup & Deployment Guide

A habit-tracking gacha RPG. Complete real-world habits to earn currency and summon monsters.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Deploy to Production (Free Tier)](#deploy-to-production-free-tier)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Database Management](#database-management)
5. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **PostgreSQL 15+** — [postgresql.org](https://www.postgresql.org/download/) or use [Neon](https://neon.tech) free tier

### Step 1 — Clone and install

```bash
# Install frontend dependencies
cd SummonScroll
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2 — Configure environment

```bash
# Frontend — copy and leave as-is for local dev
cp .env.example .env

# Backend — copy and edit
cp server/.env.example server/.env
```

Open `server/.env` and set your database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/summonscroll"
```

Generate secure JWT secrets (run these in your terminal):

```bash
# On Mac/Linux:
openssl rand -hex 32   # use output for JWT_SECRET
openssl rand -hex 32   # use output for JWT_REFRESH_SECRET

# On Windows (PowerShell):
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Paste the generated values into `server/.env`:

```env
JWT_SECRET="paste-first-value-here"
JWT_REFRESH_SECRET="paste-second-value-here"
```

### Step 3 — Set up the database

```bash
# From SummonScroll/ root — run migration and seed
cd server
npx prisma generate --schema=../prisma/schema.prisma
cd ..
npx prisma migrate dev --name init --schema=prisma/schema.prisma
npx tsx prisma/seed.ts
```

This creates all tables and seeds:
- 12 realms (Ancient Vaults → Iron Dominion)
- 72 monsters (6 per realm, including all 12 EX monsters)
- 4 active banners (Standard, Featured, Streak, Event)
- 12 shop items
- Guild "Spectral Vanguard"

### Step 4 — Run the app

Open **two terminals**:

**Terminal 1 — Backend (port 3001):**
```bash
cd SummonScroll/server
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd SummonScroll
npm run dev
```

Open **http://localhost:5173** and create your account.

---

## Deploy to Production (Free Tier)

This stack is **completely free** for personal use:

| Service | What it hosts | Free tier |
|---------|--------------|-----------|
| [Neon](https://neon.tech) | PostgreSQL database | 0.5 GB storage, always free |
| [Railway](https://railway.app) | Node.js backend API | $5/month credit (covers personal use) |
| [Vercel](https://vercel.com) | React frontend | Unlimited personal projects, free |

Total cost: **$0–$5/month** depending on Railway usage.

---

### Step 1 — Set up the database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project — name it `summonscroll`
3. In the dashboard, go to **Connection Details**
4. Copy two connection strings:
   - **Pooled connection** (for the app) — looks like `postgresql://...@ep-xxx-pooler.neon.tech/...`
   - **Direct connection** (for migrations) — looks like `postgresql://...@ep-xxx.neon.tech/...`

> Keep both strings handy — you'll need them in the next steps.

---

### Step 2 — Run migrations and seed on Neon

From your local machine, run these once to set up the production database:

```bash
# From SummonScroll/ root

# 1. Run migrations (use the DIRECT connection string)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy --schema=prisma/schema.prisma

# 2. Seed the game data (use the DIRECT connection string)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" \
  npx tsx prisma/seed.ts
```

On Windows PowerShell:
```powershell
$env:DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
npx prisma migrate deploy --schema=prisma/schema.prisma
npx tsx prisma/seed.ts
```

---

### Step 3 — Deploy the backend (Railway)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository
4. Set the **Root Directory** to `SummonScroll/server`
5. Railway will detect the `Dockerfile` automatically

**Set these environment variables in Railway** (Settings → Variables):

```
DATABASE_URL        = <your Neon POOLED connection string>
JWT_SECRET          = <your generated secret>
JWT_REFRESH_SECRET  = <your generated secret>
PORT                = 3001
NODE_ENV            = production
CORS_ORIGIN         = https://your-app.vercel.app   ← fill in after Step 4
```

6. Deploy — Railway will build the Docker image and start the server
7. Copy your Railway URL (e.g. `https://summonscroll-server.up.railway.app`)

> **Health check:** Visit `https://your-railway-url/health` — you should see `{"status":"ok","db":"ok"}`

---

### Step 4 — Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your repository
4. Set the **Root Directory** to `SummonScroll`
5. Framework preset will auto-detect as **Vite**

**Set these environment variables in Vercel** (Settings → Environment Variables):

```
VITE_API_URL = https://your-railway-url.up.railway.app/api
```

6. Click **Deploy**
7. Copy your Vercel URL (e.g. `https://summonscroll.vercel.app`)

---

### Step 5 — Update CORS on Railway

Go back to Railway and update the `CORS_ORIGIN` variable to your Vercel URL:

```
CORS_ORIGIN = https://summonscroll.vercel.app
```

Railway will redeploy automatically.

---

### Step 6 — Verify everything works

1. Open your Vercel URL
2. Click **Create Account** and register
3. You start with 100 Spirit Crystals and 5 Void Shards
4. Go to **Directives** → add a habit → complete it → earn crystals
5. Go to **Altar** → pull on a banner → summon a monster
6. Go to **Compendium** → view your collection

---

## Environment Variables Reference

### Frontend (`SummonScroll/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL. Local: `http://localhost:3001/api` |
| `VITE_SENTRY_DSN` | ❌ | Sentry error tracking DSN (leave empty to disable) |

### Backend (`SummonScroll/server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (min 32 chars) |
| `PORT` | ❌ | Server port (default: `3001`) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `CORS_ORIGIN` | ✅ | Frontend URL allowed to call the API |
| `SENTRY_DSN` | ❌ | Sentry error tracking DSN (leave empty to disable) |

---

## Database Management

### Reset and re-seed (local only)

```bash
# From SummonScroll/ root — DESTROYS all data
cd server
npx prisma migrate reset --force --schema=../prisma/schema.prisma
cd ..
npx tsx prisma/seed.ts
```

### Open Prisma Studio (visual database browser)

```bash
# From SummonScroll/ root
DATABASE_URL="your-connection-string" npx prisma studio --schema=prisma/schema.prisma
```

### Regenerate Prisma client (after schema changes)

```bash
cd SummonScroll/server
npx prisma generate --schema=../prisma/schema.prisma
```

### Apply new migrations in production

```bash
# From SummonScroll/ root — use DIRECT Neon connection string
DATABASE_URL="postgresql://...direct..." \
  npx prisma migrate deploy --schema=prisma/schema.prisma
```

---

## Troubleshooting

**"Failed to fetch" on register/login**
→ The backend isn't running. Start it: `cd SummonScroll/server && npm run dev`

**"Cannot connect to database"**
→ Check `DATABASE_URL` in `server/.env`
→ Make sure PostgreSQL is running locally, or your Neon project is active

**"Prisma client not generated"**
```bash
cd SummonScroll/server
npx prisma generate --schema=../prisma/schema.prisma
```

**CORS error in browser console**
→ `CORS_ORIGIN` in your backend env must exactly match your frontend URL (no trailing slash)
→ Local: `http://localhost:5173` | Production: `https://your-app.vercel.app`

**Railway deploy fails**
→ Check that the root directory is set to `SummonScroll/server`
→ Check that all required environment variables are set in Railway dashboard
→ View build logs in Railway → Deployments

**Vercel build fails**
→ Check that the root directory is set to `SummonScroll`
→ Make sure `VITE_API_URL` is set in Vercel environment variables

**"Invalid or expired token" after page refresh**
→ This is normal if your JWT_SECRET changed. Log out and log back in.

**Daily habits not resetting**
→ The daily reset runs at midnight UTC automatically via the built-in cron job
→ No manual action needed — it runs inside the backend server process

# SummonScroll Production Setup Guide
## From Zero to Production-Ready Application

This guide will help you set up SummonScroll from scratch with a clean database, proper pgAdmin configuration, and real API connections.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [PostgreSQL & pgAdmin Setup](#postgresql--pgadmin-setup)
3. [Database Configuration](#database-configuration)
4. [Backend API Setup](#backend-api-setup)
5. [Frontend Setup](#frontend-setup)
6. [Testing the Connection](#testing-the-connection)
7. [Production Deployment](#production-deployment)

---

## 1. Prerequisites

### Required Software
- ✅ PostgreSQL 18 (already installed at `C:\Program Files\PostgreSQL\18`)
- ✅ pgAdmin 4 (comes with PostgreSQL)
- ✅ Node.js 18+ (for backend and frontend)
- ✅ npm or yarn (package manager)

### Check Your Installation
```powershell
# Check PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version

# Check Node.js
node --version

# Check npm
npm --version
```

---

## 2. PostgreSQL & pgAdmin Setup

### Step 1: Launch pgAdmin 4

1. **Open pgAdmin 4** from Start Menu
2. **Set Master Password** (first time only)
   - This password protects your saved database passwords
   - Choose something secure and memorable

### Step 2: Register a New Server

1. **Right-click "Servers"** in the left panel
2. **Select "Register" → "Server..."**

3. **General Tab:**
   - **Name**: `SummonScroll Local`
   - **Server Group**: Servers
   - **Comments**: Local development database for SummonScroll

4. **Connection Tab:**
   - **Host name/address**: `localhost`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `shirooalister` (your PostgreSQL user)
   - **Password**: `Junebride083111!`
   - ✅ **Save password**: Check this box

5. **SSL Tab:**
   - **SSL mode**: `Prefer`

6. **Advanced Tab:**
   - **DB restriction**: Leave empty
   - **Shared**: Unchecked

7. **Click "Save"**

### Step 3: Verify Connection

1. **Expand "Servers"** in left panel
2. **Expand "SummonScroll Local"**
3. **Expand "Databases"**
4. You should see the `postgres` database and `summonscroll` database

---

## 3. Database Configuration

### Step 1: Clean the Database (Start Fresh)

We'll drop the existing database and create a new one.

#### Option A: Using pgAdmin (GUI)

1. **In pgAdmin**, right-click on `summonscroll` database
2. **Select "Delete/Drop"**
3. **Confirm deletion**
4. **Right-click "Databases"**
5. **Select "Create" → "Database..."**
6. **Database name**: `summonscroll`
7. **Owner**: `shirooalister`
8. **Click "Save"**

#### Option B: Using PowerShell (Command Line)

```powershell
# Set password environment variable
$env:PGPASSWORD="Junebride083111!"

# Drop existing database
& "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" -U shirooalister summonscroll

# Create new database
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U shirooalister summonscroll

# Verify
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U shirooalister -d summonscroll -c "\dt"
```

### Step 2: Configure Database Connection String

The connection string format:
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

For your setup:
```
postgresql://shirooalister:Junebride083111!@localhost:5432/summonscroll
```

**Important**: Special characters in passwords must be URL-encoded:
- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `^` becomes `%5E`
- `&` becomes `%26`
- `*` becomes `%2A`

Your encoded connection string:
```
postgresql://shirooalister:Junebride083111%21@localhost:5432/summonscroll
```

---

## 4. Backend API Setup

### Step 1: Navigate to Backend Directory

```powershell
cd C:\Users\Zyle\Downloads\Portfolio\SummonScroll\server
```

### Step 2: Configure Environment Variables

Create/update `.env` file:

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://shirooalister:Junebride083111%21@localhost:5432/summonscroll"

# ── JWT Secrets ───────────────────────────────────────────────────────────────
# Generate new secrets with: openssl rand -hex 32
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ── Server ────────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV="development"

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"

# ── Monitoring (optional) ─────────────────────────────────────────────────────
SENTRY_DSN=""
```

### Step 3: Generate Secure JWT Secrets

```powershell
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and update your `.env` file.

### Step 4: Install Dependencies

```powershell
npm install
```

### Step 5: Run Database Migrations

```powershell
# Navigate to project root (where prisma folder is)
cd ..

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Or create a new migration
npx prisma migrate dev --name init
```

### Step 6: Verify Database Schema

In pgAdmin:
1. **Refresh the database**
2. **Expand "summonscroll" → "Schemas" → "public" → "Tables"**
3. You should see all tables: User, Monster, Banner, Realm, etc.

Or via command line:
```powershell
$env:PGPASSWORD="Junebride083111!"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U shirooalister -d summonscroll -c "\dt"
```

### Step 7: Seed Initial Data (Optional)

**Important**: Only run this if you want starter data. For a completely empty database, skip this step.

```powershell
# From SummonScroll root directory
npx prisma db seed
```

This will create:
- 12 Realms
- 72 Monsters (6 per realm)
- 4 Banners
- 1 Demo user
- 1 Guild
- 12 Shop items

### Step 8: Start Backend Server

```powershell
cd server
npm run dev
```

You should see:
```
🚀 SummonScroll API running on http://localhost:3001
   Environment: development
```

### Step 9: Test Backend Health

Open a new PowerShell window:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

Expected response:
```json
{
  "status": "ok",
  "db": "ok",
  "uptime": 5.123,
  "timestamp": "2026-05-08T..."
}
```

---

## 5. Frontend Setup

### Step 1: Navigate to Frontend Directory

```powershell
cd C:\Users\Zyle\Downloads\Portfolio\SummonScroll
```

### Step 2: Configure Environment Variables

Create/update `.env` file:

```env
# ── API Configuration ─────────────────────────────────────────────────────────
VITE_API_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000

# ── Environment ───────────────────────────────────────────────────────────────
VITE_ENV=development
```

### Step 3: Install Dependencies

```powershell
npm install
```

### Step 4: Start Frontend Server

```powershell
npm run dev
```

You should see:
```
VITE v8.0.10  ready in 2689 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 6. Testing the Connection

### Step 1: Open Browser

Navigate to: http://localhost:5173 (or 5174 if 5173 is in use)

### Step 2: Create a New Account

1. **Click "Sign Up"** or navigate to `/signup`
2. **Fill in the form**:
   - Username: Your choice
   - Email: Your email
   - Password: Strong password
3. **Click "Create Account"**

### Step 3: Verify in Database

In pgAdmin:
1. **Right-click "summonscroll" database**
2. **Select "Query Tool"**
3. **Run this query**:
```sql
SELECT id, username, email, level, "spiritCrystals", "voidShards"
FROM "User"
ORDER BY "createdAt" DESC;
```

You should see your newly created user!

### Step 4: Test API Endpoints

#### Test Login
```powershell
$body = @{
    email = "your-email@example.com"
    password = "your-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$response.data.user
```

#### Test Banners (with authentication)
```powershell
$token = $response.data.tokens.accessToken
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3001/api/banners" -Method GET -Headers $headers
```

---

## 7. Production Deployment

### Option A: Deploy to Neon (PostgreSQL) + Railway (Backend) + Vercel (Frontend)

#### 7.1 Database: Neon

1. **Go to**: https://neon.tech
2. **Sign up** for free account
3. **Create new project**: "SummonScroll"
4. **Copy connection string** (looks like):
   ```
   postgresql://user:password@ep-xxx.neon.tech/summonscroll?sslmode=require
   ```

#### 7.2 Backend: Railway

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: SummonScroll repository
5. **Root Directory**: `/server`
6. **Add Environment Variables**:
   ```
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<your-jwt-secret>
   JWT_REFRESH_SECRET=<your-refresh-secret>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
7. **Deploy**
8. **Copy your Railway URL**: `https://your-app.railway.app`

#### 7.3 Frontend: Vercel

1. **Go to**: https://vercel.com
2. **Sign up** with GitHub
3. **New Project** → **Import Git Repository**
4. **Select**: SummonScroll repository
5. **Root Directory**: `/` (project root)
6. **Framework Preset**: Vite
7. **Environment Variables**:
   ```
   VITE_API_URL=https://your-app.railway.app/api
   VITE_API_TIMEOUT=30000
   VITE_ENV=production
   ```
8. **Deploy**
9. **Your app is live**: `https://your-app.vercel.app`

### Option B: Deploy to Single VPS (DigitalOcean, AWS, etc.)

See separate deployment guide for VPS setup.

---

## 🔧 Troubleshooting

### Backend won't start
```powershell
# Check if port 3001 is in use
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# Kill process using port 3001
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -Force
```

### Database connection fails
```powershell
# Test PostgreSQL connection
$env:PGPASSWORD="Junebride083111!"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U shirooalister -d summonscroll -c "SELECT 1;"

# Check if PostgreSQL is running
Get-Service -Name postgresql-x64-18
```

### Frontend can't connect to backend
1. Check CORS settings in backend `.env`
2. Verify `VITE_API_URL` in frontend `.env`
3. Check browser console for errors (F12)

### Prisma errors
```powershell
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View current migrations
npx prisma migrate status
```

---

## 📚 Useful Commands

### Database Management
```powershell
# Connect to database
$env:PGPASSWORD="Junebride083111!"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U shirooalister -d summonscroll

# Backup database
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U shirooalister summonscroll > backup.sql

# Restore database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U shirooalister -d summonscroll < backup.sql
```

### Prisma Commands
```powershell
# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

### Backend Commands
```powershell
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

### Frontend Commands
```powershell
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## 🎯 Next Steps

1. ✅ Complete this setup guide
2. ✅ Create your first user account
3. ✅ Test all API endpoints
4. ✅ Customize the application
5. ✅ Deploy to production

---

**Last Updated**: May 8, 2026
**Version**: 1.0.0

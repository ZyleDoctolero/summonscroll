# SummonScroll Deployment Guide

This guide covers deploying SummonScroll to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services

- **Database:** PostgreSQL 14+ (recommended: managed service like Railway, Supabase, or AWS RDS)
- **Backend Hosting:** Node.js 18+ environment (Railway, Render, Fly.io, or AWS)
- **Frontend Hosting:** Static hosting (Vercel, Netlify, or Cloudflare Pages)
- **Error Tracking:** Sentry account (optional but recommended)

### Required Tools

- Node.js 18+
- npm or yarn
- Git
- PostgreSQL client (psql)

## Environment Configuration

### Backend Environment Variables

Create a `.env.production` file in `SummonScroll/server/`:

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Sentry Error Tracking (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Create a `.env.production` file in `SummonScroll/`:

```env
VITE_API_URL=https://your-backend-domain.com
```

## Database Setup

### 1. Create Production Database

#### Using Railway

1. Create a new project on [Railway](https://railway.app/)
2. Add a PostgreSQL database
3. Copy the `DATABASE_URL` from the connection string
4. Add `?sslmode=require` to the end of the URL

#### Using Supabase

1. Create a new project on [Supabase](https://supabase.com/)
2. Go to Settings → Database
3. Copy the connection string (use "Connection pooling" for better performance)
4. Use the "Transaction" mode connection string

### 2. Run Migrations

```bash
cd SummonScroll/server

# Set production database URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed production data (NO demo users)
npx prisma db seed
```

### 3. Verify Database

```bash
# Connect to production database
psql "your-production-database-url"

# Check tables
\dt

# Verify data
SELECT COUNT(*) FROM "Monster";
SELECT COUNT(*) FROM "Banner";
SELECT COUNT(*) FROM "CurrencyIcon";

# Exit
\q
```

## Backend Deployment

### Option 1: Railway

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Initialize project
   cd SummonScroll/server
   railway init
   ```

2. **Configure Environment Variables**
   - Go to Railway dashboard
   - Add all environment variables from `.env.production`
   - Railway will automatically provide `DATABASE_URL` if you added PostgreSQL

3. **Deploy**
   ```bash
   railway up
   ```

4. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Copy the domain (e.g., `your-app.up.railway.app`)

### Option 2: Render

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `SummonScroll/server` as root directory

2. **Configure Build Settings**
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

3. **Add Environment Variables**
   - Add all variables from `.env.production`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login and Initialize**
   ```bash
   fly auth login
   cd SummonScroll/server
   fly launch
   ```

3. **Configure fly.toml**
   ```toml
   app = "summonscroll-api"
   primary_region = "sea"

   [build]
     [build.args]
       NODE_VERSION = "18"

   [env]
     NODE_ENV = "production"
     PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

4. **Set Secrets**
   ```bash
   fly secrets set DATABASE_URL="your-database-url"
   fly secrets set JWT_SECRET="your-jwt-secret"
   fly secrets set JWT_REFRESH_SECRET="your-refresh-secret"
   fly secrets set CORS_ORIGIN="https://your-frontend.com"
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd SummonScroll
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add `VITE_API_URL` with your backend URL

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build**
   ```bash
   cd SummonScroll
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add `VITE_API_URL`

### Option 3: Cloudflare Pages

1. **Build**
   ```bash
   cd SummonScroll
   npm run build
   ```

2. **Deploy via Dashboard**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set build output directory: `dist`
   - Add environment variable: `VITE_API_URL`

## Post-Deployment

### 1. Verify Backend

```bash
# Health check
curl https://your-backend-domain.com/health

# Expected response:
# {"status":"ok","db":"ok","uptime":123,"timestamp":"2024-01-01T00:00:00.000Z"}

# Metrics
curl https://your-backend-domain.com/metrics

# Test WebSocket
wscat -c wss://your-backend-domain.com/ws?token=your-jwt-token
```

### 2. Verify Frontend

1. Open `https://your-frontend-domain.com`
2. Test login/registration
3. Test banner pulls
4. Verify real-time updates work
5. Check browser console for errors

### 3. Update CORS

Ensure your backend `CORS_ORIGIN` includes your frontend domain:

```env
CORS_ORIGIN=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### 4. SSL/TLS

- Vercel, Netlify, and Railway provide automatic SSL
- For custom domains, ensure SSL certificates are configured

## Monitoring

### Health Checks

Set up automated health checks:

```bash
# Using curl (run every 5 minutes)
*/5 * * * * curl -f https://your-backend-domain.com/health || echo "Health check failed"
```

### Sentry Integration

1. Create a Sentry project
2. Add `SENTRY_DSN` to backend environment variables
3. Errors will be automatically tracked

### Metrics Monitoring

Access metrics endpoint:
```bash
curl https://your-backend-domain.com/metrics
```

Response:
```json
{
  "requestCount": 1234,
  "errorCount": 5,
  "avgResponseMs": 45,
  "uptime": 86400,
  "memoryMb": 128,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Monitoring

- Monitor connection pool usage
- Set up alerts for slow queries
- Regular backups (daily recommended)

## Troubleshooting

### Backend Issues

#### 503 Service Unavailable

**Cause:** Database connection failed

**Solution:**
1. Check `DATABASE_URL` is correct
2. Verify database is running
3. Check connection pool settings
4. Review logs: `railway logs` or `fly logs`

#### CORS Errors

**Cause:** Frontend domain not in `CORS_ORIGIN`

**Solution:**
```bash
# Update CORS_ORIGIN
railway variables set CORS_ORIGIN=https://your-frontend.com

# Or for multiple domains
railway variables set CORS_ORIGIN=https://domain1.com,https://domain2.com
```

#### WebSocket Connection Failed

**Cause:** WebSocket not supported or blocked

**Solution:**
1. Ensure hosting provider supports WebSockets
2. Check firewall rules
3. Verify JWT token is valid
4. Test with: `wscat -c wss://your-backend.com/ws?token=TOKEN`

### Frontend Issues

#### API Requests Failing

**Cause:** Incorrect `VITE_API_URL`

**Solution:**
1. Verify `VITE_API_URL` in environment variables
2. Rebuild frontend: `npm run build`
3. Redeploy

#### Real-Time Updates Not Working

**Cause:** WebSocket connection failed

**Solution:**
1. Check browser console for WebSocket errors
2. Verify backend WebSocket server is running
3. Test WebSocket endpoint manually
4. Check if hosting provider supports WebSockets

## Backup and Recovery

### Database Backup

```bash
# Backup production database
pg_dump "your-production-database-url" > backup-$(date +%Y%m%d).sql

# Restore from backup
psql "your-production-database-url" < backup-20240101.sql
```

### Automated Backups

Set up daily backups:

```bash
# Add to crontab
0 2 * * * pg_dump "your-production-database-url" > /backups/summonscroll-$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

- Deploy multiple backend instances
- Use a load balancer (Railway/Render provide this automatically)
- Ensure WebSocket sticky sessions are enabled

### Database Scaling

- Use connection pooling (PgBouncer)
- Add read replicas for read-heavy workloads
- Consider database sharding for very large datasets

### CDN

- Use Cloudflare or similar CDN for frontend assets
- Cache static assets aggressively
- Enable Brotli compression

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database uses SSL/TLS
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are active
- [ ] Sentry error tracking is configured
- [ ] Regular database backups are scheduled
- [ ] SSL certificates are valid
- [ ] Demo data is removed from production

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

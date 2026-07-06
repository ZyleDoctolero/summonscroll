# SummonScroll Production Deployment Checklist

**Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** 2024

---

## Pre-Deployment Checklist

### 1. Environment Configuration ✅

#### Backend Environment Variables (Required)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/summonscroll"

# JWT Secrets (MUST be 32+ characters, unique per environment)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT="3001"
NODE_ENV="production"

# CORS (Your production frontend URL)
CORS_ORIGIN="https://your-domain.com"

# Monitoring (Optional but recommended)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"

# Database Pool
DB_POOL_MIN="2"
DB_POOL_MAX="20"
DB_CONNECTION_TIMEOUT="5000"
DB_IDLE_TIMEOUT="30000"

# Logging
LOG_LEVEL="info"
```

#### Frontend Environment Variables (Required)
```env
# API Configuration
VITE_API_URL="https://api.your-domain.com"
VITE_WS_URL="wss://api.your-domain.com"

# Monitoring (Optional)
VITE_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"
```

### 2. Database Setup ✅

- [ ] Create production PostgreSQL database
- [ ] Configure database user with appropriate permissions
- [ ] Enable SSL connections
- [ ] Run migrations: `npm run db:migrate`
- [ ] Run production seed: `npm run db:seed`
- [ ] Verify database connectivity
- [ ] Set up automated backups

### 3. Security Configuration ✅

- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Configure CORS_ORIGIN to production domain
- [ ] Enable HTTPS/SSL
- [ ] Verify Helmet security headers
- [ ] Test rate limiting
- [ ] Review and update allowed origins
- [ ] Ensure no demo data in production database

### 4. Build and Test ✅

#### Backend
```bash
cd SummonScroll/server
npm install
npm run build
npm test
```

#### Frontend
```bash
cd SummonScroll
npm install
npm run build
```

- [ ] Backend build successful
- [ ] Frontend build successful
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Bundle size acceptable (< 500 kB total)

### 5. Monitoring Setup ✅

- [ ] Configure Sentry DSN
- [ ] Test error reporting
- [ ] Verify health check endpoint: `GET /health`
- [ ] Verify metrics endpoint: `GET /metrics`
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation (optional)

---

## Deployment Steps

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd SummonScroll
vercel --prod
```

**Vercel Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: Add all VITE_* variables

#### Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd SummonScroll/server
railway login
railway up
```

**Railway Configuration:**
- Start Command: `npm start`
- Build Command: `npm run build`
- Environment Variables: Add all backend variables
- Add PostgreSQL service
- Configure DATABASE_URL

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Traditional VPS

1. Set up Node.js 20+ on server
2. Clone repository
3. Install dependencies
4. Build applications
5. Configure PM2 or systemd for process management
6. Set up Nginx as reverse proxy
7. Configure SSL with Let's Encrypt

---

## Post-Deployment Verification

### 1. Health Checks ✅

```bash
# Backend health
curl https://api.your-domain.com/health

# Expected response:
{
  "status": "ok",
  "db": "ok",
  "uptime": 123,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. API Endpoints ✅

Test critical endpoints:
```bash
# Register user
curl -X POST https://api.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get banners (requires auth token)
curl https://api.your-domain.com/api/banners \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. WebSocket Connection ✅

```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://api.your-domain.com/ws?token=YOUR_TOKEN')
ws.onopen = () => console.log('Connected')
ws.onmessage = (event) => console.log('Message:', event.data)
```

### 4. Frontend Verification ✅

- [ ] Application loads successfully
- [ ] Login/registration works
- [ ] API calls succeed
- [ ] WebSocket connects
- [ ] Real-time updates work
- [ ] Images load correctly
- [ ] No console errors
- [ ] Mobile responsive

### 5. Performance Verification ✅

- [ ] Initial page load < 3 seconds
- [ ] API response times < 200ms
- [ ] WebSocket latency < 100ms
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Monitoring and Maintenance

### Daily Checks
- [ ] Check error rates in Sentry
- [ ] Monitor API response times
- [ ] Verify database connectivity
- [ ] Check disk space

### Weekly Checks
- [ ] Review application logs
- [ ] Check database performance
- [ ] Monitor memory usage
- [ ] Review security alerts

### Monthly Checks
- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Database backup verification
- [ ] Performance optimization review

---

## Rollback Plan

### If Deployment Fails

1. **Immediate Actions:**
   - Revert to previous deployment
   - Check error logs
   - Verify environment variables
   - Test database connectivity

2. **Database Rollback:**
   ```bash
   # Rollback last migration
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```

3. **Application Rollback:**
   - Vercel: Revert to previous deployment in dashboard
   - Railway: Rollback to previous deployment
   - Docker: Deploy previous image tag

---

## Emergency Contacts

- **DevOps Lead:** [Contact Info]
- **Database Admin:** [Contact Info]
- **On-Call Engineer:** [Contact Info]

---

## Common Issues and Solutions

### Issue: Database Connection Timeout
**Solution:**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules
- Increase DB_CONNECTION_TIMEOUT

### Issue: CORS Errors
**Solution:**
- Verify CORS_ORIGIN matches frontend URL
- Check protocol (http vs https)
- Ensure no trailing slashes

### Issue: WebSocket Connection Fails
**Solution:**
- Verify WS_URL uses wss:// (not ws://)
- Check JWT token is valid
- Verify WebSocket port is open

### Issue: High Memory Usage
**Solution:**
- Check for memory leaks
- Verify database connection pool size
- Review caching configuration
- Restart application

---

## Success Criteria

Deployment is successful when:

- ✅ Health check returns 200 OK
- ✅ All API endpoints respond correctly
- ✅ WebSocket connections establish
- ✅ Frontend loads without errors
- ✅ User registration and login work
- ✅ Real-time updates function
- ✅ No critical errors in logs
- ✅ Performance metrics within targets

---

## Next Steps After Deployment

1. **Monitor for 24 hours:**
   - Watch error rates
   - Monitor performance
   - Check user feedback

2. **Optimize as needed:**
   - Adjust database pool size
   - Fine-tune caching
   - Optimize slow queries

3. **Document learnings:**
   - Update deployment guide
   - Document any issues encountered
   - Share knowledge with team

---

**Deployment Status:** READY ✅  
**Last Verified:** 2024  
**Version:** 1.0.0

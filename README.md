# SummonScroll - Habit Tracking Gacha RPG

A gamified habit tracking application that combines RPG mechanics with gacha summoning to make building habits fun and engaging.

## Features

- 🎮 **Gacha Summoning System** - Pull monsters from various banners with different rarities
- 📊 **Habit Tracking** - Track daily habits, todos, and streaks
- ⚔️ **Battle System** - Use your monsters in turn-based battles
- 🏆 **Achievement System** - Unlock achievements and earn rewards
- 🎯 **Pity System** - Guaranteed high-rarity pulls after certain thresholds
- 🔄 **Real-Time Updates** - WebSocket-powered live currency and banner updates
- 🎨 **Dynamic Icons** - Database-driven currency icons with fallback support
- 🌐 **Multi-Realm System** - Explore different realms with unique monsters

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** TanStack Router
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+ with Prisma ORM
- **Authentication:** JWT with refresh tokens
- **Real-Time:** WebSocket (ws library)
- **Logging:** Pino (structured JSON logging)
- **Error Tracking:** Sentry
- **Security:** Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn
- pgAdmin 4 (recommended for database management)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/summonscroll.git
cd summonscroll
```

### 2. Database Setup

Follow the [pgAdmin Setup Guide](./docs/PGADMIN_SETUP.md) for detailed instructions.

Quick setup:

```bash
# Create PostgreSQL user
psql -U postgres
CREATE USER shirooalister WITH PASSWORD 'your_password';
ALTER USER shirooalister CREATEDB;
\q

# Create database
psql -U shirooalister -d postgres
CREATE DATABASE summonscroll;
\q
```

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://shirooalister:your_password@localhost:5432/summonscroll
# JWT_SECRET=your-super-secret-jwt-key-min-32-chars
# JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (production - no demo users)
npx prisma db seed

# OR seed with demo data for development
npm run seed:demo

# Start development server
npm run dev
```

The backend will start on `http://localhost:3000`

### 4. Frontend Setup

```bash
cd ..  # Back to root directory

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# VITE_API_URL=http://localhost:3000

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Variables

### Backend (`server/.env`)

```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://shirooalister:password@localhost:5432/summonscroll

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Sentry Error Tracking (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (`.env`)

```env
# API URL
VITE_API_URL=http://localhost:3000
```

## Project Structure

```
SummonScroll/
├── server/                 # Backend API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── lib/           # Utilities (logger, cache, websocket)
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # Database migrations
│   │   ├── seed.ts        # Production seed
│   │   └── seed-demo.ts   # Development seed with demo data
│   └── public/
│       └── icons/         # Currency icon files
├── src/                   # Frontend application
│   ├── routes/            # Page components
│   ├── features/          # Feature-specific components
│   ├── components/        # Shared components
│   ├── stores/            # Zustand stores
│   ├── hooks/             # Custom React hooks
│   ├── api/               # API client functions
│   └── lib/               # Utilities
├── docs/                  # Documentation
│   ├── PGADMIN_SETUP.md  # Database setup guide
│   └── DEPLOYMENT.md      # Deployment guide
└── README.md              # This file
```

## Available Scripts

### Backend

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations in development
npx prisma migrate deploy # Run migrations in production
npx prisma db seed       # Seed production data
npm run seed:demo        # Seed with demo data

# Utilities
npm run clear-demo       # Remove demo users from database
```

### Frontend

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Banners
- `GET /api/banners` - Get all active banners
- `GET /api/banners/:id` - Get banner details
- `POST /api/banners/:id/pull` - Pull from banner (1 or 10)

### Monsters
- `GET /api/monsters` - Get all monsters (with filters)
- `GET /api/monsters/:id` - Get monster details
- `GET /api/user/monsters` - Get user's monster collection

### Icons
- `GET /api/icons` - Get all currency icons
- `GET /api/icons/:id` - Get specific icon
- `POST /api/icons/upload` - Upload new icon (admin)
- `PATCH /api/icons/:id` - Update icon (admin)
- `DELETE /api/icons/:id` - Delete icon (admin)

### Health & Metrics
- `GET /health` - Health check endpoint
- `GET /metrics` - Server metrics (request count, errors, etc.)

### WebSocket
- `ws://localhost:3000/ws?token=<jwt>` - WebSocket connection for real-time updates

## Real-Time Features

SummonScroll uses WebSockets for real-time updates:

- **Currency Updates** - Instant currency changes across all tabs
- **Banner Updates** - Live banner activation/deactivation
- **System Announcements** - Server-wide notifications

### WebSocket Events

**Client → Server:**
- `ping` - Heartbeat ping
- `subscribe` - Subscribe to specific channels

**Server → Client:**
- `connected` - Connection established
- `currency_update` - Currency changed
- `banner_update` - Banner changed
- `monster_obtained` - New monster obtained
- `announcement` - System announcement
- `server_shutdown` - Server shutting down

## Database Schema

Key tables:
- **User** - User accounts and currency
- **Monster** - Monster definitions
- **UserMonster** - User's monster collection
- **Banner** - Gacha banners
- **PityState** - Pity tracking per user per banner
- **CurrencyIcon** - Dynamic currency icons
- **Habit** - User habits and todos
- **Battle** - Battle records
- **Achievement** - Achievement definitions
- **Guild** - Guild system

See `server/prisma/schema.prisma` for full schema.

## API Documentation

Interactive API documentation is available in development mode via Swagger UI:

```
http://localhost:3001/api-docs
```

The documentation includes:
- All API endpoints with request/response examples
- Authentication requirements
- Rate limiting information
- Schema definitions
- Interactive testing interface

**Note:** API documentation is disabled in production for security. See `server/src/docs/README.md` for more details.

### Quick API Reference

- **Authentication:** `POST /api/auth/login`, `POST /api/auth/register`
- **Banners:** `GET /api/banners`, `POST /api/banners/{id}/pull`
- **Monsters:** `GET /api/monsters`, `GET /api/user/monsters`
- **Icons:** `GET /api/icons`
- **Health:** `GET /health`, `GET /metrics`

All protected endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Development Workflow

### Adding a New Feature

1. **Database Changes**
   ```bash
   # Edit schema.prisma
   npx prisma migrate dev --name feature-name
   ```

2. **Backend API**
   - Add route in `server/src/routes/`
   - Add service logic in `server/src/services/`
   - Add types if needed

3. **Frontend**
   - Add API client in `src/api/`
   - Create components in `src/features/`
   - Add routes in `src/routes/`

### Removing Demo Data

```bash
cd server
npm run clear-demo
```

This removes all demo users (CrimsonBlade, TestUser, DemoPlayer) while preserving game content.

## Testing

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:3000/health
   ```

2. **API Testing**
   ```bash
   # Register
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@example.com","password":"password123"}'

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

3. **WebSocket Testing**
   ```bash
   # Install wscat
   npm install -g wscat

   # Connect
   wscat -c ws://localhost:3000/ws?token=<your-jwt-token>
   ```

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment options:
- **Backend:** Railway, Render, Fly.io
- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Database:** Railway PostgreSQL, Supabase, AWS RDS

## Performance Optimizations

- ✅ Database indexes on frequently queried fields
- ✅ API response caching (60s for banners, 5min for monsters)
- ✅ Response compression (gzip)
- ✅ Connection pooling
- ✅ Rate limiting (100 req/15min global, 10 req/min for pulls)
- ✅ WebSocket heartbeat for connection health
- ✅ Graceful shutdown handling

## Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation with Zod
- ✅ XSS sanitization
- ✅ SQL injection protection (Prisma)
- ✅ Sensitive data redaction in logs

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -U shirooalister -d summonscroll

# Check if PostgreSQL is running
pg_isready

# View logs
tail -f /var/log/postgresql/postgresql-18-main.log
```

### Backend Not Starting

1. Check environment variables are set
2. Verify database is running
3. Check port 3000 is not in use
4. Review logs for errors

### Frontend API Errors

1. Verify `VITE_API_URL` is correct
2. Check backend is running
3. Verify CORS is configured correctly
4. Check browser console for errors

### WebSocket Connection Failed

1. Verify JWT token is valid
2. Check WebSocket server is running
3. Ensure hosting provider supports WebSockets
4. Test with wscat: `wscat -c ws://localhost:3000/ws?token=TOKEN`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [documentation](./docs/)
- Review the [deployment guide](./docs/DEPLOYMENT.md)

## Acknowledgments

- Monster sprites and assets from [source]
- Inspired by gacha games and habit tracking apps
- Built with modern web technologies

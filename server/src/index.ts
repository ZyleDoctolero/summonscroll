import 'dotenv/config'
// Validate environment variables before anything else
import './lib/env.js'
import * as Sentry from '@sentry/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { authRouter } from './routes/auth.js'
import { habitsRouter } from './routes/habits.js'
import { bannersRouter } from './routes/banners.js'
import { monstersRouter } from './routes/monsters.js'
import { fusionRouter } from './routes/fusion.js'
import { shopRouter } from './routes/shop.js'
import { guildRouter } from './routes/guild.js'
import { battlesRouter } from './routes/battles.js'
import { startScheduler } from './lib/scheduler.js'
import { globalRateLimiter } from './middleware/rateLimiter.js'
import { initPrisma, prisma, disconnectPrisma } from './lib/prisma.js'
import { logger } from './lib/logger.js'
import pinoHttp from 'pino-http'
import { metricsRouter, serverMetrics } from './routes/metrics.js'
import { userRouter } from './routes/user.js'
import { achievementsRouter } from './routes/achievements.js'
import { iconsRouter } from './routes/icons.js'
import { docsRouter } from './routes/docs.js'
import { env } from './lib/env.js'
import { databaseManager } from './lib/database.js'
import { initializeWebSocketServer } from './lib/websocket.js'
import { createServer } from 'http'

const app = express()
const httpServer = createServer(app)
const PORT = Number(env.PORT)

// ── Sentry initialisation ─────────────────────────────────────────────────────
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers?.['authorization']
      }
      return event
    },
  })
  logger.info('Sentry error tracking initialised')
}

// ── Middleware ────────────────────────────────────────────────────────────────
const isProd = env.NODE_ENV === 'production'

app.use(helmet({
  // Strict Transport Security — force HTTPS in production
  hsts: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // Content Security Policy — restrict resource origins
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", 'data:', 'https:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Prevent MIME sniffing
  noSniff: true,
  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// CORS — use environment variable for allowed origins
const allowedOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim())
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl in dev)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin '${origin}' not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '1mb' }))
app.use(globalRateLimiter)

// ── Response compression ──────────────────────────────────────────────────────
app.use(compression({
  // Compress responses larger than 1KB
  threshold: 1024,
  // Compression level (0-9, higher = better compression but slower)
  level: 6,
  // Only compress text-based responses
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  },
}))

// ── Serve static files ────────────────────────────────────────────────────────
app.use('/icons', express.static('public/icons'))

// ── Structured request logging ────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  // Don't log health check polls — they're noisy
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  // Increment metrics counters on each response
  customSuccessMessage: (req, res, responseTime) => {
    serverMetrics.requestCount++
    serverMetrics.totalResponseMs += responseTime
    serverMetrics.responseCount++
    if (res.statusCode >= 500) serverMetrics.errorCount++
    return `${req.method} ${req.url} ${res.statusCode} — ${responseTime}ms`
  },
  customErrorMessage: (req, res, err) => {
    serverMetrics.requestCount++
    serverMetrics.errorCount++
    return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`
  },
}))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    // Use database manager's health check with timeout
    const isHealthy = await Promise.race([
      databaseManager.healthCheck(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
    ])

    if (isHealthy) {
      res.json({
        status: 'ok',
        db: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    } else {
      res.status(503).json({
        status: 'degraded',
        db: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    }
  } catch (err) {
    logger.error({ err }, '[health] Database connectivity check failed')
    res.status(503).json({
      status: 'degraded',
      db: 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  }
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter)
app.use('/api/habits',   habitsRouter)
app.use('/api/dailies',  habitsRouter)
app.use('/api/todos',    habitsRouter)
app.use('/api/banners',  bannersRouter)
app.use('/api/monsters', monstersRouter)
app.use('/api/user',     monstersRouter)
app.use('/api/realms',   monstersRouter)
app.use('/api/fusion',   fusionRouter)
app.use('/api/shop',     shopRouter)
app.use('/api/guild',    guildRouter)
app.use('/api/battles',  battlesRouter)
app.use('/api/user',     userRouter)
app.use('/api/achievements', achievementsRouter)
app.use('/api/icons',    iconsRouter)
app.use('/metrics',      metricsRouter)

// ── API Documentation (development only) ──────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', docsRouter)
  logger.info('API documentation available at /api-docs')
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// ── Error handler ─────────────────────────────────────────────────────────────
// Sentry must capture errors before the generic handler
if (env.SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(Sentry.expressErrorHandler() as any)
}
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled server error')
  res.status(500).json({ message: 'Internal server error' })
})

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let isShuttingDown = false
let server: ReturnType<typeof httpServer.listen>

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`Received ${signal}, starting graceful shutdown...`)

  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed')
  })

  // Wait for in-flight requests (max 10 seconds)
  const shutdownTimeout = setTimeout(() => {
    logger.warn('Shutdown timeout reached, forcing exit')
    process.exit(1)
  }, 10000)

  try {
    // Close WebSocket connections
    const { getWebSocketServer } = await import('./lib/websocket.js')
    try {
      const wsServer = getWebSocketServer()
      await wsServer.close()
      logger.info('WebSocket server closed')
    } catch (err) {
      // WebSocket server might not be initialized
      logger.debug('WebSocket server not initialized or already closed')
    }

    // Close database connections
    await disconnectPrisma()
    logger.info('Database connections closed')

    clearTimeout(shutdownTimeout)
    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown')
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  await initPrisma()
  
  // Initialize WebSocket server
  const wsServer = initializeWebSocketServer(httpServer)
  logger.info('WebSocket server initialized at /ws')
  
  server = httpServer.listen(PORT, () => {
    logger.info(`🚀 SummonScroll API running on http://localhost:${PORT}`)
    logger.info(`   Environment: ${env.NODE_ENV}`)
    logger.info(`   CORS origins: ${allowedOrigins.join(', ')}`)
    logger.info(`   WebSocket: ws://localhost:${PORT}/ws`)
    if (env.NODE_ENV !== 'production') {
      logger.info(`   API Docs: http://localhost:${PORT}/api-docs`)
    }
    startScheduler()
  })
}

// Export app for testing
export { app }

// Only start server if not in test environment
if (env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })
}

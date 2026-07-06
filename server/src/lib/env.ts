import { z } from 'zod'

/**
 * Validates all required environment variables at server startup.
 * Throws a descriptive error listing every missing or invalid variable
 * so the server fails fast rather than crashing at runtime.
 */
const envSchema = z.object({
  // ── Database ────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // ── JWT Secrets ─────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // ── Server ──────────────────────────────────────────────────────────────────
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3001'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // ── CORS ────────────────────────────────────────────────────────────────────
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN must not be empty').default('http://localhost:5173'),
  
  // ── WebSocket (optional) ────────────────────────────────────────────────────
  WS_PORT: z.string().regex(/^\d+$/, 'WS_PORT must be a number').optional(),
  
  // ── Icon Storage (optional) ─────────────────────────────────────────────────
  ICON_STORAGE_PATH: z.string().optional(),
  ICON_STORAGE_URL: z.string().optional(),
  
  // ── Monitoring (optional) ───────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional().or(z.literal('')),
  
  // ── Database Connection Pool (optional) ─────────────────────────────────────
  DB_POOL_MIN: z.string().regex(/^\d+$/, 'DB_POOL_MIN must be a number').default('2'),
  DB_POOL_MAX: z.string().regex(/^\d+$/, 'DB_POOL_MAX must be a number').default('20'),
  DB_CONNECTION_TIMEOUT: z.string().regex(/^\d+$/, 'DB_CONNECTION_TIMEOUT must be a number').default('5000'),
  DB_IDLE_TIMEOUT: z.string().regex(/^\d+$/, 'DB_IDLE_TIMEOUT must be a number').default('30000'),
  
  // ── Logging (optional) ──────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type EnvConfig = z.infer<typeof envSchema>

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
    const lines = errors
      .map((err) => `  • ${err.path.join('.')}: ${err.message}`)
      .join('\n')

    throw new Error(
      `\n❌ Server startup failed — invalid environment configuration:\n${lines}\n\n` +
      `Copy .env.example to .env and fill in the required values.\n`,
    )
  }

  return result.data
}

export const env = validateEnv()

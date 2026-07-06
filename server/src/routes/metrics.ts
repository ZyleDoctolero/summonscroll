import { Router } from 'express'

export const metricsRouter = Router()

// ── In-memory counters ────────────────────────────────────────────────────────
// These are incremented by the pino-http middleware via the onResFinished hook
// and by the error handler. They reset on server restart — for persistent
// metrics, integrate a time-series store (e.g. Prometheus, Datadog).

interface Metrics {
  requestCount: number
  errorCount: number        // 5xx responses
  totalResponseMs: number   // sum of all response times
  responseCount: number     // responses with timing data
}

export const serverMetrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseMs: 0,
  responseCount: 0,
}

/**
 * GET /metrics
 * Returns current server health counters.
 * Restrict this endpoint to internal/admin access in production.
 */
metricsRouter.get('/', (_req, res) => {
  const avgResponseMs =
    serverMetrics.responseCount > 0
      ? Math.round(serverMetrics.totalResponseMs / serverMetrics.responseCount)
      : 0

  res.json({
    requestCount:  serverMetrics.requestCount,
    errorCount:    serverMetrics.errorCount,
    avgResponseMs,
    uptime:        Math.round(process.uptime()),
    memoryMb:      Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    timestamp:     new Date().toISOString(),
  })
})

import rateLimit from 'express-rate-limit'
import type { Request } from 'express'
import type { AuthRequest } from './auth.js'

/**
 * Global rate limiter — applied to all API endpoints to prevent abuse.
 * 100 requests per 15 minutes per IP address.
 * Uses standard keyGenerator to properly handle IPv6 addresses.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable the `X-RateLimit-*` headers
  
  // Use default keyGenerator which properly handles IPv6 addresses
  // by normalizing them (e.g., ::ffff:127.0.0.1 → 127.0.0.1)
  // This prevents IPv6 users from bypassing rate limits

  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP. Please try again later.',
    })
  },
})

/**
 * Rate limiter for the banner pull endpoint.
 * Limits to 10 requests per minute, keyed by authenticated userId (falling back to IP).
 * Returns 429 with a Retry-After header when the limit is exceeded.
 */
export const pullRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 pulls per minute per user
  standardHeaders: true,
  legacyHeaders: false,

  // Key by authenticated userId if available, otherwise fall back to IP
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest
    return authReq.userId ?? req.ip ?? 'anonymous'
  },

  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many pull requests. Please wait before pulling again.',
    })
  },
})


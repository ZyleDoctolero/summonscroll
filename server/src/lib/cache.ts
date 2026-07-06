import NodeCache from 'node-cache'
import { Request, Response, NextFunction } from 'express'
import { logger } from './logger.js'

// Create cache instance with default TTL of 60 seconds
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false, // Don't clone objects for better performance
})

/**
 * Cache middleware for GET requests
 * @param ttl Time to live in seconds (default: 60)
 */
export function cacheMiddleware(ttl: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Generate cache key from URL and query params
    const key = `${req.path}:${JSON.stringify(req.query)}`

    // Check if cached response exists
    const cachedResponse = cache.get(key)
    if (cachedResponse) {
      logger.debug({ key }, 'Cache hit')
      res.setHeader('X-Cache', 'HIT')
      return res.json(cachedResponse)
    }

    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to cache the response
    res.json = function (body: any) {
      cache.set(key, body, ttl)
      logger.debug({ key, ttl }, 'Cache miss - stored')
      res.setHeader('X-Cache', 'MISS')
      return originalJson(body)
    }

    next()
  }
}

/**
 * Invalidate cache by key pattern
 * @param pattern Regex pattern or exact key
 */
export function invalidateCache(pattern: string | RegExp): void {
  const keys = cache.keys()
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

  let invalidatedCount = 0
  keys.forEach((key) => {
    if (regex.test(key)) {
      cache.del(key)
      invalidatedCount++
    }
  })

  logger.debug({ pattern: pattern.toString(), invalidatedCount }, 'Cache invalidated')
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.flushAll()
  logger.info('All cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats()
}

export { cache }

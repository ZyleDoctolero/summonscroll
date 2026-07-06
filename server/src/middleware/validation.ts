import type { Request, Response, NextFunction } from 'express'
import { z, ZodError, ZodSchema } from 'zod'
import { logger } from '../lib/logger.js'

/**
 * Validation middleware factory using Zod schemas.
 * Validates request body, query parameters, or route parameters.
 */

interface ValidationOptions {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

export function validate(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (options.body) {
        req.body = await options.body.parseAsync(req.body)
      }

      // Validate query parameters
      if (options.query) {
        req.query = await options.query.parseAsync(req.query) as typeof req.query
      }

      // Validate route parameters
      if (options.params) {
        req.params = await options.params.parseAsync(req.params) as typeof req.params
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        logger.warn({ errors, path: req.path }, 'Validation error')

        return res.status(400).json({
          message: 'Validation failed',
          errors,
        })
      }

      logger.error({ err: error }, 'Unexpected validation error')
      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }
}

/**
 * Common validation schemas for reuse across routes.
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Pagination query parameters
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default(() => 1),
    limit: z.string().regex(/^\d+$/).transform(Number).default(() => 20),
  }),

  // Email validation
  email: z.string().email('Invalid email format').max(255, 'Email too long'),

  // Password validation (strong password requirements)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  // Username validation
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
}

/**
 * Sanitize string input to prevent XSS attacks.
 * Removes potentially dangerous HTML/script tags.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize object recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}

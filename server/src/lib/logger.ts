import pino from 'pino'
import { env } from './env.js'

/**
 * Shared Pino logger instance with structured JSON output.
 * In development: pretty-prints with colours (if pino-pretty is installed).
 * In production: outputs newline-delimited JSON for log aggregators.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  
  // Format level as string instead of number
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  
  // Serializers for common objects
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
      remoteAddress: req.remoteAddress || req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  
  // Redact sensitive fields from logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.token',
      'req.body.refreshToken',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
    ],
    remove: true, // Remove the fields entirely instead of replacing with [Redacted]
  },
})


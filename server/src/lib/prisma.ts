import { PrismaClient } from '@prisma/client'
import { databaseManager } from './database.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Singleton — reuse in development to avoid exhausting connections
let _prisma: PrismaClient | null = null

/**
 * Get the Prisma client instance using the DatabaseManager.
 * This provides connection pooling, retry logic, and health checks.
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  if (_prisma) return _prisma
  
  _prisma = await databaseManager.connect()
  
  if (process.env['NODE_ENV'] !== 'production') {
    globalForPrisma.prisma = _prisma
  }
  
  return _prisma
}

// Synchronous export for backwards compatibility — initialised at startup
// Routes that import `prisma` directly will use this after `initPrisma()` is called
export let prisma: PrismaClient = null as unknown as PrismaClient

/**
 * Initialize the Prisma client at server startup.
 * This establishes the database connection with retry logic.
 */
export async function initPrisma(): Promise<void> {
  prisma = await getPrisma()
}

/**
 * Gracefully disconnect from the database.
 * Should be called during server shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  await databaseManager.disconnect()
}

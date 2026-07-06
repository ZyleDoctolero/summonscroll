import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'
import { env } from './env.js'

/**
 * Database connection manager with retry logic and health checks.
 * Handles connection pooling, exponential backoff, and graceful disconnection.
 */

interface ConnectionConfig {
  maxRetries: number
  retryDelay: number
  maxRetryDelay: number
  connectionTimeout: number
}

const defaultConfig: ConnectionConfig = {
  maxRetries: 5,
  retryDelay: 1000,        // Start with 1 second
  maxRetryDelay: 30000,    // Max 30 seconds between retries
  connectionTimeout: 5000, // 5 second timeout for connection attempts
}

class DatabaseManager {
  private prisma: PrismaClient | null = null
  private retryCount = 0
  private config: ConnectionConfig
  private isConnected = false

  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Connect to the database with retry logic and exponential backoff.
   */
  async connect(): Promise<PrismaClient> {
    if (this.prisma && this.isConnected) {
      return this.prisma
    }

    try {
      this.prisma = await this.createPrismaClient()
      await this.testConnection()
      this.isConnected = true
      this.retryCount = 0
      logger.info('✓ Database connection established')
      return this.prisma
    } catch (error) {
      logger.error({ err: error }, 'Database connection failed')
      
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        const delay = this.calculateBackoff()
        logger.warn(
          `Retrying database connection in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`
        )
        await this.sleep(delay)
        return this.connect()
      }

      throw new Error(
        `Failed to connect to database after ${this.config.maxRetries} attempts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Create a new Prisma client with connection pooling configuration.
   */
  private async createPrismaClient(): Promise<PrismaClient> {
    const { PrismaPg } = await import('@prisma/adapter-pg')
    const { Pool } = await import('pg')

    let url = env.DATABASE_URL

    // In production, add PgBouncer-compatible params for Neon connection pooler
    if (env.NODE_ENV === 'production') {
      try {
        const parsed = new URL(url)
        parsed.searchParams.set('pgbouncer', 'true')
        parsed.searchParams.set('connection_limit', env.DB_POOL_MAX)
        parsed.searchParams.set('pool_timeout', '20')
        url = parsed.toString()
      } catch {
        logger.warn('Failed to parse DATABASE_URL for PgBouncer params')
      }
    }

    const pool = new Pool({
      connectionString: url,
      min: parseInt(env.DB_POOL_MIN, 10),
      max: parseInt(env.DB_POOL_MAX, 10),
      idleTimeoutMillis: parseInt(env.DB_IDLE_TIMEOUT, 10),
      connectionTimeoutMillis: parseInt(env.DB_CONNECTION_TIMEOUT, 10),
    })

    const adapter = new PrismaPg(pool)

    return new PrismaClient({
      adapter,
      log: env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    } as ConstructorParameters<typeof PrismaClient>[0])
  }

  /**
   * Test database connection with a simple query.
   */
  private async testConnection(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized')
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout')), this.config.connectionTimeout)
    })

    await Promise.race([
      this.prisma.$queryRaw`SELECT 1`,
      timeoutPromise,
    ])
  }

  /**
   * Calculate exponential backoff delay with jitter.
   */
  private calculateBackoff(): number {
    const exponentialDelay = this.config.retryDelay * Math.pow(2, this.retryCount - 1)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, this.config.maxRetryDelay)
  }

  /**
   * Sleep for a specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Perform a health check on the database connection.
   * Returns true if the connection is healthy, false otherwise.
   */
  async healthCheck(): Promise<boolean> {
    if (!this.prisma || !this.isConnected) {
      return false
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error({ err: error }, 'Database health check failed')
      this.isConnected = false
      return false
    }
  }

  /**
   * Retry a database operation with exponential backoff.
   */
  async retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt)
          logger.warn(
            { err: error },
            `Database operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`
          )
          await this.sleep(Math.min(delay, this.config.maxRetryDelay))
        }
      }
    }

    throw lastError
  }

  /**
   * Gracefully disconnect from the database.
   */
  async disconnect(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect()
        this.isConnected = false
        logger.info('✓ Database connection closed')
      } catch (error) {
        logger.error({ err: error }, 'Error disconnecting from database')
        throw error
      }
    }
  }

  /**
   * Get the current connection status.
   */
  getConnectionStatus(): { connected: boolean; retryCount: number } {
    return {
      connected: this.isConnected,
      retryCount: this.retryCount,
    }
  }

  /**
   * Get the Prisma client instance.
   */
  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.prisma
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager()

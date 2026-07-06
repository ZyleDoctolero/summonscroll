 

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = import.meta.env.DEV

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment && level === 'debug') {
      return false
    }
    return true
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  }
}

export const logger = new Logger()

import { logger } from './logger'

export interface WebSocketMessage {
  type: string
  payload: unknown
}

export type WebSocketEventHandler = (payload: unknown) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimeout: number | null = null
  private heartbeatInterval: number | null = null
  private isIntentionallyClosed = false
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map()

  constructor(url: string) {
    this.url = url
  }

  /**
   * Connect to WebSocket server with authentication token
   */
  public connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket already connected')
      return
    }

    this.token = token
    this.isIntentionallyClosed = false
    this.reconnectAttempts = 0

    this.createConnection()
  }

  private createConnection(): void {
    if (!this.token) {
      logger.error('Cannot connect: No authentication token provided')
      return
    }

    try {
      // Add token as query parameter
      const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)

      logger.debug('WebSocket connection initiated')
    } catch (error) {
      logger.error('Failed to create WebSocket connection', error)
      this.scheduleReconnect()
    }
  }

  private handleOpen(): void {
    logger.info('WebSocket connected')
    this.reconnectAttempts = 0
    this.startHeartbeat()

    // Emit connected event
    this.emit('connected', { timestamp: new Date().toISOString() })
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      logger.debug('WebSocket message received', { type: message.type })

      // Emit the message to registered handlers
      this.emit(message.type, message.payload)
    } catch (error) {
      logger.error('Failed to parse WebSocket message', error)
    }
  }

  private handleError(event: Event): void {
    logger.error('WebSocket error', event)
  }

  private handleClose(event: CloseEvent): void {
    logger.info('WebSocket disconnected', { code: event.code, reason: event.reason })

    this.stopHeartbeat()

    // Emit disconnected event
    this.emit('disconnected', { code: event.code, reason: event.reason })

    // Attempt to reconnect unless intentionally closed
    if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached')
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts })
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = window.setTimeout(() => {
      logger.info(`Reconnection attempt ${this.reconnectAttempts}`)
      this.createConnection()
    }, delay)
  }

  private startHeartbeat(): void {
    // Send ping every 25 seconds to keep connection alive
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {})
      }
    }, 25000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Send a message to the server
   */
  public send(type: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload }
      this.ws.send(JSON.stringify(message))
      logger.debug('WebSocket message sent', { type })
    } else {
      logger.warn('Cannot send message: WebSocket not connected', { type })
    }
  }

  /**
   * Subscribe to a specific channel
   */
  public subscribe(channel: string): void {
    this.send('subscribe', { channel })
  }

  /**
   * Register an event handler
   */
  public on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * Unregister an event handler
   */
  public off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  private emit(event: string, payload: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload)
        } catch (error) {
          logger.error('Error in event handler', { event, error })
        }
      })
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    logger.info('WebSocket disconnected by client')
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get current connection state
   */
  public getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'open'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'closed'
    }
  }
}

// Singleton instance
let wsClientInstance: WebSocketClient | null = null

export function getWebSocketClient(): WebSocketClient {
  if (!wsClientInstance) {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || window.location.host
    const wsUrl = `${protocol}//${host}/ws`
    
    wsClientInstance = new WebSocketClient(wsUrl)
  }
  return wsClientInstance
}

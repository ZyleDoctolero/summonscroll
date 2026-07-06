import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getWebSocketClient, WebSocketClient, type WebSocketEventHandler } from '../lib/websocket'
import { logger } from '../lib/logger'

interface CurrencyUpdate {
  spiritCrystals: number
  voidShards: number
  pactSeals: number
  change?: {
    spiritCrystals?: number
    voidShards?: number
    pactSeals?: number
  }
  timestamp: string
}

interface BannerUpdate {
  bannerId: number
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  banner?: unknown
  timestamp: string
}

interface WebSocketState {
  // Connection state
  isConnected: boolean
  connectionState: 'connecting' | 'open' | 'closing' | 'closed'
  reconnectAttempts: number

  // Latest updates
  latestCurrencyUpdate: CurrencyUpdate | null
  latestBannerUpdate: BannerUpdate | null

  // WebSocket client instance
  client: WebSocketClient | null

  // Actions
  connect: (token: string) => void
  disconnect: () => void
  subscribe: (channel: string) => void
  send: (type: string, payload: Record<string, unknown>) => void
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set) => {
      const client = getWebSocketClient()

      // Register event handlers
      client.on('connected', () => {
        logger.info('WebSocket connected')
        set({ isConnected: true, connectionState: 'open', reconnectAttempts: 0 }, false, 'ws/connected')
      })

      client.on('disconnected', () => {
        logger.info('WebSocket disconnected')
        set({ isConnected: false, connectionState: 'closed' }, false, 'ws/disconnected')
      })

      client.on('max_reconnect_attempts', ((payload: { attempts: number }) => {
        logger.error('Max reconnection attempts reached', payload)
        set({ reconnectAttempts: payload.attempts }, false, 'ws/maxReconnect')
      }) as WebSocketEventHandler)

      client.on('currency_update', ((payload: CurrencyUpdate) => {
        logger.debug('Currency update received', payload)
        set({ latestCurrencyUpdate: payload }, false, 'ws/currencyUpdate')
      }) as WebSocketEventHandler)

      client.on('banner_update', ((payload: BannerUpdate) => {
        logger.debug('Banner update received', payload)
        set({ latestBannerUpdate: payload }, false, 'ws/bannerUpdate')
      }) as WebSocketEventHandler)

      client.on('monster_obtained', (payload: unknown) => {
        logger.info('Monster obtained', payload)
      })

      client.on('announcement', (payload: unknown) => {
        logger.info('System announcement', payload)
      })

      client.on('server_shutdown', (payload: unknown) => {
        logger.warn('Server shutting down', payload)
      })

      return {
        isConnected: false,
        connectionState: 'closed',
        reconnectAttempts: 0,
        latestCurrencyUpdate: null,
        latestBannerUpdate: null,
        client,

        connect: (token: string) => {
          logger.info('Connecting to WebSocket...')
          client.connect(token)
          set({ connectionState: 'connecting' }, false, 'ws/connecting')
        },

        disconnect: () => {
          logger.info('Disconnecting from WebSocket...')
          client.disconnect()
          set({
            isConnected: false,
            connectionState: 'closed',
            latestCurrencyUpdate: null,
            latestBannerUpdate: null,
          }, false, 'ws/disconnect')
        },

        subscribe: (channel: string) => {
          client.subscribe(channel)
        },

        send: (type: string, payload: Record<string, unknown>) => {
          client.send(type, payload)
        },
      }
    },
    { name: 'WebSocketStore' },
  ),
)

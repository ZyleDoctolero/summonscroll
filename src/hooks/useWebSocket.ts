import { useEffect } from 'react'
import { useWebSocketStore } from '../stores/websocketStore'
import { useUserStore } from '../stores/userStore'

/**
 * Hook to automatically connect/disconnect WebSocket based on auth state
 */
export function useWebSocket() {
  const { connect, disconnect, isConnected, connectionState } = useWebSocketStore()
  const { accessToken, isAuthenticated } = useUserStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect(accessToken)
      return () => {
        disconnect()
      }
    } else {
      disconnect()
    }
  }, [isAuthenticated, accessToken, connect, disconnect])

  return {
    isConnected,
    connectionState,
  }
}

export interface CurrencyUpdatePayload {
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

export interface BannerUpdatePayload {
  bannerId: number
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  banner?: unknown
  timestamp: string
}

/**
 * Hook to listen for currency updates
 */
export function useCurrencyUpdates(callback: (update: CurrencyUpdatePayload) => void) {
  const latestUpdate = useWebSocketStore((state) => state.latestCurrencyUpdate)

  useEffect(() => {
    if (latestUpdate) {
      callback(latestUpdate)
    }
  }, [latestUpdate, callback])
}

/**
 * Hook to listen for banner updates
 */
export function useBannerUpdates(callback: (update: BannerUpdatePayload) => void) {
  const latestUpdate = useWebSocketStore((state) => state.latestBannerUpdate)

  useEffect(() => {
    if (latestUpdate) {
      callback(latestUpdate)
    }
  }, [latestUpdate, callback])
}

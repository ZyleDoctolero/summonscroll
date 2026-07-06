import { getIcons, type IconMetadata } from './api/icons.api'
import { logger } from '@/lib/logger'

interface IconCache {
  [key: string]: {
    url: string
    timestamp: number
  }
}

/**
 * IconManager - Manages currency and UI icon loading with caching
 * 
 * Features:
 * - Loads SVG icons from API with 5-minute TTL cache
 * - Provides fallback SVG icons when not found
 * - Singleton pattern for global access
 * - SVG-only format expected
 */
class IconManager {
  private cache: IconCache = {}
  private cacheTTL = 300000 // 5 minutes in milliseconds
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  /**
   * Load all icons from the API and populate cache
   */
  async loadIcons(): Promise<void> {
    // If already loading, return the existing promise
    if (this.loadPromise) {
      return this.loadPromise
    }

    // If already loaded and cache is still valid, skip
    if (this.isLoaded && this.isCacheValid()) {
      return
    }

    this.loadPromise = this._loadIconsInternal()
    
    try {
      await this.loadPromise
    } finally {
      this.loadPromise = null
    }
  }

  private async _loadIconsInternal(): Promise<void> {
    try {
      const response = await getIcons()
      const timestamp = Date.now()

      // Populate cache with all icons
      response.data.forEach((icon: IconMetadata) => {
        this.cache[icon.name] = {
          url: this.buildIconUrl(icon.url),
          timestamp,
        }
      })

      this.isLoaded = true
      logger.info(`[IconManager] Loaded ${response.data.length} icons`)
    } catch (error) {
      logger.error('[IconManager] Failed to load icons:', error)
      // Don't throw - allow fallback icons to be used
    }
  }

  /**
   * Get the URL for a specific icon by name
   * Returns fallback icon if not found
   */
  getIconUrl(name: string): string {
    const cached = this.cache[name]

    // Check if cache entry exists and is still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.url
    }

    // Return fallback icon
    return this.getFallbackIcon(name)
  }

  /**
   * Get fallback icon URL for a given icon name
   * All icons are expected to be in SVG format
   */
  getFallbackIcon(name: string): string {
    // Map common currency names to fallback SVG icons
    const fallbackMap: Record<string, string> = {
      spirit_crystals: '/icons/fallback-crystal.svg',
      void_shards: '/icons/fallback-shard.svg',
      pact_seals: '/icons/fallback-seal.svg',
    }

    return fallbackMap[name] || '/icons/fallback-default.svg'
  }

  /**
   * Clear the icon cache
   */
  clearCache(): void {
    this.cache = {}
    this.isLoaded = false
    logger.info('[IconManager] Cache cleared')
  }

  /**
   * Check if the cache is still valid
   */
  private isCacheValid(): boolean {
    const cacheKeys = Object.keys(this.cache)
    if (cacheKeys.length === 0) return false

    // Check if any cache entry is still valid
    const now = Date.now()
    return cacheKeys.some((key) => {
      const entry = this.cache[key]
      return now - entry.timestamp < this.cacheTTL
    })
  }

  /**
   * Build full icon URL from relative path
   */
  private buildIconUrl(url: string): string {
    // If URL is already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    // Build URL relative to API base
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${apiUrl}${url}`
  }

  /**
   * Preload icons for specific names
   * Useful for preloading critical icons
   */
  async preloadIcons(names: string[]): Promise<void> {
    await this.loadIcons()
    
    // Preload images in browser
    const promises = names.map((name) => {
      const url = this.getIconUrl(name)
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve() // Don't fail on error
        img.src = url
      })
    })

    await Promise.all(promises)
    logger.info(`[IconManager] Preloaded ${names.length} icons`)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; isValid: boolean; isLoaded: boolean } {
    return {
      size: Object.keys(this.cache).length,
      isValid: this.isCacheValid(),
      isLoaded: this.isLoaded,
    }
  }
}

// Export singleton instance
export const iconManager = new IconManager()

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import { CURRENCY_ICONS } from '@/lib/icons'
import { iconManager } from './IconManager'
import { logger } from '@/lib/logger'

interface CurrencyIconProps {
  /** Icon name (e.g., 'spirit_crystals', 'void_shards', 'pact_seals') */
  name: string
  /** Size in pixels (default: 24) */
  size?: 12 | 16 | 20 | 24 | 32 | 40 | 48
  /** Additional CSS classes */
  className?: string
  /** Alt text for accessibility */
  alt?: string
  /** Show loading state */
  showLoading?: boolean
}

/**
 * CurrencyIcon - Displays currency icons with loading and error states
 * 
 * Features:
 * - Uses Icon wrapper component for consistent rendering
 * - Loading state with skeleton
 * - Error state with fallback icon
 * - Integrates with IconManager for caching
 */
export function CurrencyIcon({
  name,
  size = 24,
  className = '',
  alt,
  showLoading = true,
}: CurrencyIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Check if we have a lucide icon for this currency
  const lucideIcon = CURRENCY_ICONS[name as keyof typeof CURRENCY_ICONS]

  useEffect(() => {
    // If we have a lucide icon, skip loading from IconManager
    if (typeof lucideIcon !== 'undefined') {
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadIcon() {
      try {
        setIsLoading(true)
        setHasError(false)

        // Load icons if not already loaded
        await iconManager.loadIcons()

        if (!mounted) return

        // Get icon URL from manager
        const url = iconManager.getIconUrl(name)
        setIconUrl(url)
      } catch (error) {
        logger.error(`[CurrencyIcon] Failed to load icon: ${name}`, error)
        if (mounted) {
          setHasError(true)
          // Use fallback icon
          setIconUrl(iconManager.getFallbackIcon(name))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadIcon()

    return () => {
      mounted = false
    }
  }, [name, lucideIcon])

  // Loading state
  if (isLoading && showLoading) {
    return (
      <div
        className={`inline-block bg-gray-700 animate-pulse rounded ${className}`}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Loading icon"
      />
    )
  }

  // Use lucide icon if available
  if (lucideIcon) {
    return (
      <Icon
        icon={lucideIcon}
        size={size}
        className={className}
        label={alt || name}
      />
    )
  }

  // Error state (fallback icon)
  if (hasError || !iconUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gray-800 rounded ${className}`}
        style={{ width: size, height: size }}
        title={`Icon not found: ${name}`}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    )
  }

  // Render SVG icon from IconManager
  return (
    <img
      src={iconUrl}
      alt={alt || name}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        logger.warn(`[CurrencyIcon] Failed to load image: ${iconUrl}`)
        setHasError(true)
        setIconUrl(iconManager.getFallbackIcon(name))
      }}
    />
  )
}

/**
 * CurrencyDisplay - Displays currency icon with amount
 */
interface CurrencyDisplayProps {
  /** Icon name */
  name: string
  /** Currency amount */
  amount: number
  /** Icon size in pixels (default: 20) */
  iconSize?: 12 | 16 | 20 | 24 | 32 | 40 | 48
  /** Additional CSS classes */
  className?: string
  /** Format amount with commas */
  formatAmount?: boolean
}

export function CurrencyDisplay({
  name,
  amount,
  iconSize = 20,
  className = '',
  formatAmount = true,
}: CurrencyDisplayProps) {
  const formattedAmount = formatAmount
    ? amount.toLocaleString()
    : amount.toString()

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <CurrencyIcon name={name} size={iconSize} />
      <span className="font-medium">{formattedAmount}</span>
    </div>
  )
}

import { useEffect, useState } from 'react'

/**
 * Returns `true` when the user has requested reduced motion via their OS
 * accessibility settings (`prefers-reduced-motion: reduce`).
 *
 * Use this hook to skip or shorten animations for accessibility compliance.
 *
 * @example
 * const reducedMotion = useReducedMotion()
 * <div style={{ transition: reducedMotion ? 'none' : 'transform 300ms ease' }} />
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

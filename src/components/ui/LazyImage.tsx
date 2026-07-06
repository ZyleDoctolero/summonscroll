import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  /** Show skeleton loading animation instead of empty space */
  showSkeleton?: boolean
  /** Responsive image sources for different screen sizes */
  srcSet?: string
  sizes?: string
}

export function LazyImage({
  src,
  alt,
  fallback,
  showSkeleton = true,
  srcSet,
  sizes,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const imageSrc = hasError && fallback ? fallback : src

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Skeleton loading placeholder */}
      {showSkeleton && !isLoaded && (
        <div
          className="absolute inset-0 skeleton"
          aria-hidden="true"
        />
      )}

      {/* Error state fallback */}
      {hasError && !fallback && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-bg-elevated text-text-disabled"
          role="img"
          aria-label="Image failed to load"
        >
          <svg
            className="w-1/3 h-1/3 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-400',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100',
          )}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  )
}

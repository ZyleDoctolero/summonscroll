import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleIn } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements?.[0] as HTMLElement
      firstElement?.focus()

      return () => {
        previousFocusRef.current?.focus()
      }
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            <motion.div
              ref={modalRef}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'relative w-full max-w-lg max-h-[90vh] overflow-y-auto',
                'bg-bg-elevated border border-border rounded-lg shadow-xl',
                'p-6',
                className,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-18 font-cinzel font-semibold text-text-primary"
                    >
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-md hover:bg-bg-secondary"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div>{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

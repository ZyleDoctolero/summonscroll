import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideInRight } from '@/lib/animations'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

const TOAST_ICONS = {
  success:     '✅',
  error:       '❌',
  achievement: '🏆',
  info:        'ℹ️',
}

const TOAST_COLORS = {
  success:     'border-success/30 bg-success/10',
  error:       'border-danger/30 bg-danger/10',
  achievement: 'border-gold/30 bg-gold/10',
  info:        'border-border bg-bg-elevated',
}

export function ToastContainer() {
  const { toasts } = useUiStore()

  return (
    <div
      className="fixed top-4 right-4 z-toast flex flex-col gap-2 max-w-xs w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} type={toast.type} title={toast.title} message={toast.message} duration={toast.duration} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  id: string
  type: 'success' | 'error' | 'achievement' | 'info'
  title: string
  message?: string
  duration?: number
}

function ToastItem({ id, type, title, message, duration = 3000 }: ToastItemProps) {
  const { removeToast } = useUiStore()

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, removeToast])

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-lg',
        TOAST_COLORS[type],
      )}
      role="alert"
      aria-live="assertive"
    >
      <span className="text-16 flex-shrink-0 mt-0.5" aria-hidden="true">
        {TOAST_ICONS[type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-13 font-medium text-text-primary">{title}</p>
        {message && (
          <p className="text-12 text-text-secondary mt-0.5">{message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors text-14 mt-0.5"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </motion.div>
  )
}

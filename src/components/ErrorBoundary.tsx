import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
  /** Optional custom fallback UI */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * Top-level error boundary that catches unhandled render errors,
 * reports them to Sentry, and shows a user-friendly fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Report to Sentry if initialised
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="min-h-dvh flex items-center justify-center bg-bg-deep px-4"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="bg-bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center space-y-4"
          >
            {/* Icon */}
            <div className="text-64" aria-hidden="true">💀</div>

            {/* Heading */}
            <h1 className="font-cinzel font-bold text-24 text-text-primary">
              Something went wrong
            </h1>

            {/* Message */}
            <p className="text-14 text-text-secondary">
              An unexpected error occurred. Your progress has been saved.
            </p>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.errorMessage && (
              <pre className="text-11 text-danger bg-bg-elevated rounded-md p-3 text-left overflow-auto max-h-32">
                {this.state.errorMessage}
              </pre>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg text-14 font-medium bg-bg-elevated text-text-secondary hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg text-14 font-medium bg-gold text-bg-deep hover:bg-gold-bright transition-colors focus:outline-none focus:ring-2 focus:ring-gold/60"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Comprehensive Error Handling & User Feedback System
 * 
 * This module provides:
 * 1. React Error Boundaries for catching component errors
 * 2. Global error handling for API calls  
 * 3. User-friendly error messages and feedback
 * 4. Loading states and retry mechanisms
 */

'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  resetOnPropsChange?: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service (implement based on your needs)
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error state when props change (useful for route changes)
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Implement error reporting to your preferred service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    
    try {
      // For now, just log to console
      console.error('Error reported:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    })
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1
      })

      // Auto-reset after a delay to prevent infinite retry loops
      this.resetTimeoutId = window.setTimeout(() => {
        this.setState({ retryCount: 0 })
      }, 5000)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportIssue = () => {
    // Navigate to support/chat page
    window.location.href = '/dashboard/chat'
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, maxRetries = 3 } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Xəta baş verdi
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 mb-6">
              Təəssüf ki, gözlənilməz bir xəta baş verdi. Lütfən səhifəni yeniləyin və ya yenidən cəhd edin.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                <summary className="font-medium text-gray-800 cursor-pointer mb-2">
                  Texniki məlumatlar
                </summary>
                <div className="text-sm text-gray-600 font-mono">
                  <p className="font-bold">Error:</p>
                  <p className="mb-2">{error.message}</p>
                  {error.stack && (
                    <>
                      <p className="font-bold">Stack Trace:</p>
                      <pre className="whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Retry Button */}
              {retryCount < maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Yenidən cəhd et ({maxRetries - retryCount} qalıb)
                </button>
              )}

              {/* Reload Button */}
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Səhifəni yenilə
              </button>

              {/* Go Home Button */}
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                Ana səhifəyə qayıt
              </button>

              {/* Report Issue Button */}
              <button
                onClick={this.handleReportIssue}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Problemi bildir
              </button>
            </div>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Cəhd sayı: {retryCount}/{maxRetries}
              </p>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

// Specific error boundaries for different parts of the app
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    maxRetries={2}
    resetOnPropsChange={true}
    onError={(error, errorInfo) => {
      console.error('Dashboard Error:', error, errorInfo)
    }}
  >
    {children}
  </ErrorBoundary>
)

export const FormErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    maxRetries={1}
    fallback={
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium mb-2">Form xətası</h3>
        <p className="text-red-600 text-sm">
          Forma göndərilərkən xəta baş verdi. Lütfən yenidən cəhd edin.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)

export const ChatErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    maxRetries={3}
    fallback={
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-medium mb-2">Chat sistemi xətası</h3>
        <p className="text-yellow-600 text-sm">
          Chat sistemi müvəqqəti olaraq əlçatan deyil. Lütfən bir neçə dəqiqə sonra yenidən cəhd edin.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Prevent the default browser behavior
    event.preventDefault()
    
    // You can show a user-friendly message here
    console.warn('An error occurred in the background. The application should continue working normally.')
  })

  // Global error handler for script errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Log additional context
    console.error('Error details:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })
}
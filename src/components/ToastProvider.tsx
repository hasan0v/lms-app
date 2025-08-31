/**
 * Toast Notification System
 * 
 * Provides user-friendly feedback for various actions:
 * - Success messages
 * - Error notifications  
 * - Warning alerts
 * - Info messages
 * - Loading states
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
  hideAllToasts: () => void
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<Toast>) => string
  error: (title: string, message?: string, options?: Partial<Toast>) => string
  warning: (title: string, message?: string, options?: Partial<Toast>) => string
  info: (title: string, message?: string, options?: Partial<Toast>) => string
  loading: (title: string, message?: string) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const hideAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : 5000)
    }

    setToasts(prev => [...prev, newToast])

    // Auto-hide toast after duration (unless persistent or loading)
    if (newToast.duration && newToast.duration > 0 && !newToast.persistent && newToast.type !== 'loading') {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }

    return id
  }, [hideToast])

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'success', title, message })
  }, [showToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'error', title, message, duration: options?.duration ?? 8000 })
  }, [showToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'warning', title, message })
  }, [showToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return showToast({ ...options, type: 'info', title, message })
  }, [showToast])

  const loading = useCallback((title: string, message?: string) => {
    return showToast({ type: 'loading', title, message, persistent: true })
  }, [showToast])

  const value: ToastContextValue = {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    success,
    error,
    warning,
    info,
    loading
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  )
}

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 150) // Match animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      case 'loading':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-150 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        ${getBgColor()}
        border rounded-lg shadow-lg p-4 w-full
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${getTextColor()}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
              {toast.message}
            </p>
          )}
          
          {/* Action Button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`
                mt-2 text-sm font-medium underline
                ${getTextColor()} hover:opacity-80 transition-opacity
              `}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        {toast.type !== 'loading' && (
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors
              ${getTextColor()}
            `}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Hook for API error handling
export const useApiError = () => {
  const { error } = useToast()

  const handleApiError = useCallback((err: unknown, context?: string) => {
    let title = 'Xəta baş verdi'
    let message = 'Gözlənilməz bir xəta baş verdi. Lütfən yenidən cəhd edin.'

    if (err instanceof Error) {
      if (err.message.includes('fetch')) {
        title = 'Şəbəkə xətası'
        message = 'İnternet bağlantınızı yoxlayın və yenidən cəhd edin.'
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        title = 'Giriş tələb olunur'
        message = 'Lütfən yenidən daxil olun.'
      } else if (err.message.includes('403') || err.message.includes('forbidden')) {
        title = 'İcazə verilmədi'
        message = 'Bu əməliyyat üçün icazəniz yoxdur.'
      } else if (err.message.includes('404')) {
        title = 'Tapılmadı'
        message = 'Axtardığınız məlumat tapılmadı.'
      } else if (err.message.includes('500')) {
        title = 'Server xətası'
        message = 'Serverdə xəta baş verdi. Lütfən bir neçə dəqiqə sonra yenidən cəhd edin.'
      } else {
        message = err.message
      }
    }

    if (context) {
      title = `${context} - ${title}`
    }

    error(title, message, {
      duration: 8000,
      action: {
        label: 'Yenidən cəhd et',
        onClick: () => window.location.reload()
      }
    })
  }, [error])

  return { handleApiError }
}

// Hook for form validation feedback
export const useFormFeedback = () => {
  const { success, error, warning } = useToast()

  const showValidationError = useCallback((field: string, message: string) => {
    error(`${field} xətası`, message)
  }, [error])

  const showSubmissionSuccess = useCallback((message: string = 'Məlumatlar uğurla yadda saxlanıldı') => {
    success('Uğurlu!', message)
  }, [success])

  const showSubmissionError = useCallback((message: string = 'Məlumatlar saxlanılarkən xəta baş verdi') => {
    error('Xəta!', message)
  }, [error])

  const showFieldWarning = useCallback((field: string, message: string) => {
    warning(`${field} xəbərdarlığı`, message)
  }, [warning])

  return {
    showValidationError,
    showSubmissionSuccess,
    showSubmissionError,
    showFieldWarning
  }
}

export default ToastProvider
'use client'

import { useNotifications } from './NotificationSystem'
import { useConfirmDialog } from './ConfirmDialog'

/**
 * Legacy alert replacement hooks
 * Use these to easily migrate from browser alerts to modern notifications
 */
export const useLegacyAlerts = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()
  const { showConfirm } = useConfirmDialog()

  // Drop-in replacement for alert()
  const alert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        showSuccess('Success', message)
        break
      case 'error':
        showError('Error', message)
        break
      case 'warning':
        showWarning('Warning', message)
        break
      default:
        showInfo('Information', message)
    }
  }

  // Drop-in replacement for confirm() but returns Promise<boolean>
  const confirm = (message: string, title: string = 'Confirm Action'): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirm({
        title,
        message,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
  }

  return {
    alert,
    confirm,
    // Direct access to notification methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  }
}

// Global replacements (use sparingly, prefer the hook above)
export const modernAlert = {
  success: (message: string) => {
    // This requires the NotificationProvider to be available
    console.log('✅ Success:', message)
  },
  error: (message: string) => {
    console.log('❌ Error:', message)
  },
  warning: (message: string) => {
    console.log('⚠️ Warning:', message)
  },
  info: (message: string) => {
    console.log('ℹ️ Info:', message)
  }
}

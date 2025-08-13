'use client'

import React, { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogData {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmDialogContextType {
  showConfirm: (data: ConfirmDialogData) => void
  hideConfirm: () => void
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined)

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider')
  }
  return context
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogData, setDialogData] = useState<ConfirmDialogData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const showConfirm = (data: ConfirmDialogData) => {
    setDialogData(data)
  }

  const hideConfirm = () => {
    setDialogData(null)
    setIsLoading(false)
  }

  const handleConfirm = async () => {
    if (!dialogData) return
    
    setIsLoading(true)
    try {
      await dialogData.onConfirm()
      hideConfirm()
    } catch (error) {
      console.error('Error in confirm action:', error)
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (dialogData?.onCancel) {
      dialogData.onCancel()
    }
    hideConfirm()
  }

  const getIcon = () => {
    switch (dialogData?.type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      default:
        return <AlertTriangle className="h-6 w-6 text-blue-500" />
    }
  }

  const getButtonColors = () => {
    switch (dialogData?.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm, hideConfirm }}>
      {children}
      
      {/* Dialog Overlay */}
      <AnimatePresence>
        {dialogData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCancel}
            />
            
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-md w-full"
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  {getIcon()}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {dialogData.title}
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-600 mb-6">
                  {dialogData.message}
                </p>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    {dialogData.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${getButtonColors()}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      dialogData.confirmText || 'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  )
}

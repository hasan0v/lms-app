/**
 * Progressive Web App (PWA) Registration and Management
 * 
 * Handles:
 * - Service worker registration
 * - PWA install prompts
 * - Offline status detection
 * - Background sync registration
 * - Push notification setup
 */

'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ToastProvider'

interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isServiceWorkerSupported: boolean
  isRegistered: boolean
  updateAvailable: boolean
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isServiceWorkerSupported: false,
    isRegistered: false,
    updateAvailable: false
  })
  
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null)
  const { success, info, warning } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if running as PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as { standalone?: boolean }).standalone === true

    // Check service worker support
    const isServiceWorkerSupported = 'serviceWorker' in navigator

    setPwaState(prev => ({
      ...prev,
      isInstalled,
      isServiceWorkerSupported,
      isOnline: navigator.onLine
    }))

    // Register service worker function
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        setPwaState(prev => ({ ...prev, isRegistered: true }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPwaState(prev => ({ ...prev, updateAvailable: true }))
              info('Yenilənmə mövcuddur', 'Səhifəni yeniləyərək ən son versiyaya keçin.')
            }
          })
        })

        console.log('[PWA] Service Worker registered successfully')
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }

    // Register service worker
    if (isServiceWorkerSupported) {
      registerServiceWorker()
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as PWAInstallPrompt)
      setPwaState(prev => ({ ...prev, isInstallable: true }))
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setDeferredPrompt(null)
      success('Tətbiq uğurla quraşdırıldı!', 'İndi offline rejimdə də istifadə edə bilərsiniz.')
    }

    // Listen for online/offline status
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }))
      info('İnternet bağlantısı bərpa oldu', 'Bütün funksiyalar aktivdir.')
    }

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }))
      warning('Offline rejimdəsiniz', 'Bəzi funksiyalar məhdud ola bilər.')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [success, info, warning])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        success('Tətbiq quraşdırılır...', 'Qısa müddətdə hazır olacaq.')
      }
      
      setDeferredPrompt(null)
      setPwaState(prev => ({ ...prev, isInstallable: false }))
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('[PWA] Install failed:', error)
      return false
    }
  }

  const updateApp = async () => {
    if (!navigator.serviceWorker.controller) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      console.error('[PWA] Update failed:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      warning('Bildirişlər dəstəklənmir', 'Brauzeriniz push bildirişləri dəstəkləmir.')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      warning('Bildirişlər bloklanıb', 'Brauzer ayarlarından bildirişləri aktivləşdirin.')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        success('Bildirişlər aktivləşdirildi!', 'Yeni mesajlar və tapşırıqlar haqqında bildiriş alacaqsınız.')
        return true
      } else {
        info('Bildirişlər aktivləşdirilmədi', 'İstədiyiniz zaman ayarlardan dəyişə bilərsiniz.')
        return false
      }
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error)
      return false
    }
  }

  const registerBackgroundSync = async (tag: string) => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Background sync not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      // Background sync is experimental, so we use unknown type
      const syncManager = (registration as { sync?: { register: (tag: string) => Promise<void> } }).sync
      if (syncManager) {
        await syncManager.register(tag)
        console.log(`[PWA] Background sync registered: ${tag}`)
        return true
      } else {
        console.warn('[PWA] Background sync not available')
        return false
      }
    } catch (error) {
      console.error(`[PWA] Background sync registration failed for ${tag}:`, error)
      return false
    }
  }

  const subscribeToPushNotifications = async () => {
    if (!navigator.serviceWorker) return null

    try {
      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY // You'll need to set this
      })

      // Send subscription to your backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })

      success('Push bildirişləri aktivləşdirildi!', 'Yeniliklər haqqında bildiriş alacaqsınız.')
      return subscription
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error)
      return null
    }
  }

  return {
    ...pwaState,
    installApp,
    updateApp,
    requestNotificationPermission,
    registerBackgroundSync,
    subscribeToPushNotifications
  }
}

// PWA Install Button Component
export const PWAInstallButton: React.FC<{
  className?: string
  children?: React.ReactNode
}> = ({ className = '', children }) => {
  const { isInstallable, isInstalled, installApp } = usePWA()

  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <button
      onClick={installApp}
      className={`
        bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
        transition-colors duration-200 flex items-center space-x-2
        ${className}
      `}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>{children || 'Tətbiqi quraşdır'}</span>
    </button>
  )
}

// Offline Status Indicator
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium">Offline rejimindəsiniz</span>
      </div>
    </div>
  )
}

// PWA Update Banner
export const PWAUpdateBanner: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!updateAvailable || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
        <h4 className="font-medium mb-2">Yenilənmə mövcuddur</h4>
        <p className="text-sm mb-3">Ən son xüsusiyyətləri əldə etmək üçün tətbiqi yeniləyin.</p>
        <div className="flex space-x-2">
          <button
            onClick={updateApp}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Yenilə
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="bg-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-800 transition-colors"
          >
            Sonra
          </button>
        </div>
      </div>
    </div>
  )
}

const PWAManager = {
  usePWA,
  PWAInstallButton,
  OfflineIndicator,
  PWAUpdateBanner
}

export default PWAManager
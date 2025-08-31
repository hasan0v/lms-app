'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/components/ui/NotificationSystem'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ToastProvider from '@/components/ToastProvider'
import { OfflineIndicator, PWAUpdateBanner } from '@/components/PWAManager'
import PerformanceTracker from '@/components/PerformanceTracker'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="az" style={{ backgroundColor: '#ffffff' }}>
      <head>
        {/* Critical performance optimizations */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Viewport and device optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Süni İntellekt" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/favicon.png" as="image" />
        <link rel="preload" href="/logo.png" as="image" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
        
        {/* Prefetch likely next pages */}
        <link rel="prefetch" href="/dashboard" />
        <link rel="prefetch" href="/auth/signin" />
        
        {/* Critical inline CSS for FOUC prevention and blazing fast rendering */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body { 
              background-color: #ffffff !important; 
              color: #171717 !important;
              margin: 0;
              padding: 0;
              font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Loading optimization for blazing fast perceived performance */
            .loading-skeleton {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            
            /* Prevent layout shift for stable performance */
            .container-fixed {
              min-height: 100vh;
              width: 100%;
            }
            
            /* Optimized transitions */
            * {
              box-sizing: border-box;
            }
            
            img {
              max-width: 100%;
              height: auto;
            }
            
            /* Loading indicator for instant feedback */
            .global-loading {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              z-index: 9999;
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            
            .global-loading.active {
              opacity: 1;
            }
          `
        }} />
      </head>
      <body
        className={`${inter.className} antialiased bg-white container-fixed`}
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Global loading indicator */}
        <div id="global-loading" className="global-loading" />
        
        <ErrorBoundary resetOnPropsChange={true}>
          <AuthProvider>
            <ToastProvider>
              <NotificationProvider>
                <ConfirmDialogProvider>
                  {children}
                  <OfflineIndicator />
                  <PWAUpdateBanner />
                  <PerformanceTracker />
                </ConfirmDialogProvider>
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGateProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'admin'
  // Optional: show a fallback while loading instead of default spinner
  fallback?: React.ReactNode
}

export function AuthGate({ children, requiredRole, fallback }: AuthGateProps) {
  const { user, profile, loading, authError, refreshingProfile, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect logic
  useEffect(() => {
    if (loading) return
    if (!user) {
      if (!pathname?.startsWith('/auth')) {
        router.replace('/auth/signin')
      }
      return
    }
    if (requiredRole) {
      if (!profile) return // wait until profile resolves
      if (profile.role !== requiredRole) {
        if (pathname !== '/unauthorized') {
          router.replace('/unauthorized')
        }
      }
    }
  }, [user, profile, loading, requiredRole, router, pathname])

  // Global loading (session) or waiting for profile for role
  if (loading || (user && requiredRole && !profile)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-secondary-500" />
        </div>
      )
    )
  }

  if (!user) return null

  if (requiredRole && profile && profile.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this resource.</p>
          <button
            onClick={() => router.replace('/dashboard')}
            className="btn btn-primary px-4 py-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Profile error fallback (user logged in but profile failed to load)
  if (user && authError && authError.type === 'PROFILE' && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md glass-card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Load Error</h2>
            <p className="text-gray-600 mb-4">We couldn&apos;t load your profile. You can retry or sign out.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => refreshProfile()}
                disabled={refreshingProfile}
                className="btn btn-secondary px-4 py-2 disabled:opacity-60"
              >
                {refreshingProfile ? 'Retrying...' : 'Retry'}
              </button>
              <button
                onClick={() => router.replace('/auth/signin')}
                className="btn px-4 py-2"
                style={{ background: 'linear-gradient(135deg,var(--secondary-500),var(--secondary-600))', color: '#fff' }}
              >
                Sign In Again
              </button>
            </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

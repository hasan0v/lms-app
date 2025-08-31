'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'admin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldShowLoading, setShouldShowLoading] = useState(true)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Set up loading timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        setShouldShowLoading(false)
        console.warn('Loading timeout reached, proceeding without full auth state')
      }, 5000) // 5 second maximum loading time
      
      loadingTimeoutRef.current = timeout
      setShouldShowLoading(true)
    } else {
      // Clear timeout when loading is complete
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setShouldShowLoading(false)
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [loading]) // No longer depends on timeout ref, preventing infinite loop

  useEffect(() => {
    // Still determining session or profile - but respect timeout
    if (loading && shouldShowLoading) return

    // Not authenticated: send to sign in, but avoid redirect loop if already on auth pages
    if (!user) {
      if (!pathname?.startsWith('/auth')) {
        router.replace('/auth/signin')
      }
      return
    }

    // If we require a role but profile not yet loaded, wait (avoid premature unauthorized)
    if (requiredRole && !profile && shouldShowLoading) return

    // Role-gated access (only after profile available)
    if (requiredRole && profile && profile.role !== requiredRole) {
      if (pathname !== '/unauthorized') {
        router.replace('/unauthorized')
      }
      return
    }
  }, [user, profile, loading, requiredRole, router, pathname, shouldShowLoading])

  // Show loading only if actually loading and within timeout
  if (loading && shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

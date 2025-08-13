'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    // Still determining session or profile
    if (loading) return

    // Not authenticated: send to sign in, but avoid redirect loop if already on auth pages
    if (!user) {
      if (!pathname?.startsWith('/auth')) {
        router.replace('/auth/signin')
      }
      return
    }

    // If we require a role but profile not yet loaded, wait (avoid premature unauthorized)
    if (requiredRole && !profile) return

    // Role-gated access (only after profile available)
    if (requiredRole && profile && profile.role !== requiredRole) {
      if (pathname !== '/unauthorized') {
        router.replace('/unauthorized')
      }
      return
    }
  }, [user, profile, loading, requiredRole, router, pathname])

  if (loading || (user && requiredRole && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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

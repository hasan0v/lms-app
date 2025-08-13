'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from './Logo'
import ClientOnly from './ClientOnly'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <DashboardContent>{children}</DashboardContent>
    </ClientOnly>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      if (!pathname?.startsWith('/auth')) {
        router.replace('/auth/signin')
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Courses', href: '/dashboard/courses', icon: '📚' },
    { name: 'Tasks', href: '/dashboard/tasks', icon: '📝' },
    { name: 'Chat', href: '/dashboard/chat', icon: '💬' },
    { name: 'My Grades', href: '/dashboard/grades', icon: '🎯' },
  ]

  const adminNavigation = [
    { name: 'Admin Panel', href: '/dashboard/admin', icon: '⚙️' },
    { name: 'Manage Courses', href: '/dashboard/admin/courses', icon: '📚' },
    { name: 'Manage Tasks', href: '/dashboard/admin/tasks', icon: '📋' },
    { name: 'Grading Queue', href: '/dashboard/grading', icon: '✏️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex h-full min-h-0 w-64 flex-col bg-white shadow-xl">
            <div className="flex-shrink-0 flex items-center justify-center px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-white/20">
              <div className="flex items-center justify-center w-full">
                <Logo href="/dashboard" uppercase size="md" showText className="justify-center" />
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-gray-600 hover:text-gray-800 hover:bg-white/50 p-2 rounded-lg transition-all duration-200"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 pr-3 space-y-2 nice-scroll">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="group-hover:translate-x-1 transition-transform">{item.name}</span>
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-6" />
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin Panel
                  </div>
                  {adminNavigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-4 py-3 text-sm font-medium text-indigo-700 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${(navigation.length + index) * 0.1}s` }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="group-hover:translate-x-1 transition-transform">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>
            
            {/* Mobile Profile Section */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <Link href="/dashboard/profile" onClick={() => setSidebarOpen(false)}>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                      {profile.profile_image_url ? (
                        <Image
                          src={profile.profile_image_url}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{profile.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              </Link>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={signOut}
                  className="w-full text-left px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex h-full min-h-0 flex-col bg-white shadow-xl">
          <div className="flex-shrink-0 flex items-center justify-center px-4 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-white/20">
            <Logo href="/dashboard" uppercase size="md" showText className="justify-center" />
          </div>
          <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 pr-3 space-y-2 nice-scroll">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="group-hover:translate-x-1 transition-transform">{item.name}</span>
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-6" />
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Panel
                </div>
                {adminNavigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-4 py-3 text-sm font-medium text-indigo-700 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${(navigation.length + index) * 0.1}s` }}
                  >
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="group-hover:translate-x-1 transition-transform">{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <Link href="/dashboard/profile" className="block">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                    {profile.profile_image_url ? (
                      <Image
                        src={profile.profile_image_url}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </div>
            </Link>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={signOut}
                className="w-full text-left px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <div className="flex items-center justify-center flex-1">
            <Logo href="/dashboard" size="sm" showText uppercase={false} className="" />
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/profile" className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                {profile.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-xs">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{profile.full_name?.split(' ')[0] || 'User'}</span>
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Global styles for a subtle, nice-looking scrollbar on scrollable sidebar areas
// Uses styled-jsx to keep it self-contained without requiring a global CSS file
// Applied via the `nice-scroll` class above
<style jsx global>{`
  .nice-scroll {
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #c7d2fe #f8fafc; /* thumb, track */
  }
  .nice-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .nice-scroll::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 8px;
  }
  .nice-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #a78bfa, #8b5cf6); /* violet-400 -> violet-500 */
    border-radius: 8px;
  }
  .nice-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #8b5cf6, #7c3aed); /* violet-500 -> violet-600 */
  }
`}</style>

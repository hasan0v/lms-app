'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { DashboardSkeleton } from '@/components/OptimizedLoader'
import { cache, generateCacheKey } from '@/lib/cache'

interface DashboardStats {
  totalCourses: number
  enrolledCourses: number
  completedSubmissions: number
  pendingSubmissions: number
  totalTasks: number
  pendingGrading: number
  totalStudents: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Enhanced icon components
const BookIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const CheckIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
)

const ClockIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUpIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const EditIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const ClipboardIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const ArrowRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    enrolledCourses: 0,
    completedSubmissions: 0,
    pendingSubmissions: 0,
    totalTasks: 0,
    pendingGrading: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!profile) return

      try {
        // Generate cache key based on user role and ID
        const cacheKey = generateCacheKey('dashboard_stats', {
          userId: profile.id,
          role: profile.role
        })

        // Try cache first
        const cachedStats = cache.get(cacheKey) as DashboardStats | undefined
        if (cachedStats) {
          setStats(cachedStats)
          setLoading(false)
          return
        }

        // Fetch total courses
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })

        // For now, assume all courses are "enrolled" - we can implement enrollment later
        const enrolledCourses = totalCourses || 0

        // Initialize admin stats
        let totalTasks = 0
        let pendingGrading = 0
        let totalStudents = 0

        // Fetch submission stats for students
        let completedSubmissions = 0
        let pendingSubmissions = 0

        if (profile.role === 'student') {
          const { data: submissions } = await supabase
            .from('submissions')
            .select('status')
            .eq('student_id', profile.id)

          completedSubmissions = submissions?.filter(s => s.status === 'graded').length || 0
          pendingSubmissions = submissions?.filter(s => s.status === 'submitted').length || 0
        } else if (profile.role === 'admin') {
          // Fetch admin stats in parallel for better performance
          const [tasksRes, pendingRes, studentsRes] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }),
            supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
            supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
          ])

          totalTasks = tasksRes.count || 0
          pendingGrading = pendingRes.count || 0
          totalStudents = studentsRes.count || 0
        }

        const dashboardStats: DashboardStats = {
          totalCourses: totalCourses || 0,
          enrolledCourses,
          completedSubmissions,
          pendingSubmissions,
          totalTasks,
          pendingGrading,
          totalStudents,
        }

        // Cache the results
        cache.set(cacheKey, dashboardStats, CACHE_DURATION)
        setStats(dashboardStats)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        
        // Set fallback stats to prevent empty state
        setStats({
          totalCourses: 0,
          enrolledCourses: 0,
          completedSubmissions: 0,
          pendingSubmissions: 0,
          totalTasks: 0,
          pendingGrading: 0,
          totalStudents: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [profile])

  const isAdmin = profile?.role === 'admin'

  // Memoize greeting to prevent recalculation
  const userGreeting = useMemo(() => {
    if (!profile?.full_name) return 'User'
    return profile.full_name.split(' ')[0] || 'User'
  }, [profile?.full_name])

  const StatCard = useCallback(({ title, value, icon, gradient, delay = 0 }: {
    title: string
    value: number | string
    icon: React.ReactNode
    gradient: string
    delay?: number
  }) => (
    <div 
      className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 count-up">{value}</p>
        </div>
        <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  ), [])

  const QuickActionCard = useCallback(({ title, description, href, icon, delay = 0 }: {
    title: string
    description: string
    href: string
    icon: React.ReactNode
    delay?: number
  }) => (
    <Link
      href={href}
      className="quick-action-card group glass-card hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6 block w-full"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className="course-icon-container w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 truncate">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" />
      </div>
    </Link>
  ), [])

  // Show optimized loading state
  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Header Section */}
        <div className="text-center">
          <div className="course-icon-container inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl">
            <TrendingUpIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Welcome back, {userGreeting}! <span className="text-yellow-400">👋</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {isAdmin 
              ? "Manage your platform and monitor student progress from your administrative dashboard." 
              : "Continue your learning journey and track your progress across all courses."
            }
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={isAdmin ? 'Total Courses' : 'Available Courses'}
              value={stats.totalCourses}
              icon={<BookIcon />}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0.1}
            />
            
            {!isAdmin ? (
              <>
                <StatCard
                  title="Completed"
                  value={stats.completedSubmissions}
                  icon={<CheckIcon />}
                  gradient="bg-gradient-to-br from-green-500 to-green-600"
                  delay={0.2}
                />
                
                <StatCard
                  title="Pending Review"
                  value={stats.pendingSubmissions}
                  icon={<ClockIcon />}
                  gradient="bg-gradient-to-br from-orange-500 to-orange-600"
                  delay={0.3}
                />
                
                <StatCard
                  title="Progress"
                  value={`${stats.totalCourses > 0 
                    ? Math.round((stats.completedSubmissions / stats.totalCourses) * 100) 
                    : 0}%`}
                  icon={<TrendingUpIcon />}
                  gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                  delay={0.4}
                />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Tasks"
                  value={stats.totalTasks}
                  icon={<ClipboardIcon />}
                  gradient="bg-gradient-to-br from-green-500 to-green-600"
                  delay={0.2}
                />
                <StatCard
                  title="Pending Grading"
                  value={stats.pendingGrading}
                  icon={<ClockIcon />}
                  gradient="bg-gradient-to-br from-orange-500 to-orange-600"
                  delay={0.3}
                />
                <StatCard
                  title="Total Students"
                  value={stats.totalStudents}
                  icon={<EditIcon />}
                  gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                  delay={0.4}
                />
              </>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Quick Actions */}
          <div className="dashboard-section space-y-6">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isAdmin ? 'Administrative Tools' : 'Continue Learning'}
              </h2>
              <p className="text-gray-600">
                {isAdmin ? 'Access powerful tools to manage your platform' : 'Explore courses and track your progress'}
              </p>
            </div>
            
            <div className="space-y-4">
              {isAdmin ? (
                <>
                  <QuickActionCard
                    title="Manage Courses"
                    description="Create, edit, and organize course content and materials"
                    href="/dashboard/admin/courses"
                    icon={<EditIcon />}
                    delay={0.5}
                  />
                  <QuickActionCard
                    title="Review Submissions"
                    description="Grade student assignments and provide feedback"
                    href="/dashboard/grading"
                    icon={<ClipboardIcon />}
                    delay={0.6}
                  />
                  <QuickActionCard
                    title="Manage Users"
                    description="Add and manage student accounts and permissions"
                    href="/dashboard/admin/users"
                    icon={<EditIcon />}
                    delay={0.7}
                  />
                </>
              ) : (
                <>
                  <QuickActionCard
                    title="Browse Courses"
                    description="Explore available learning materials and start new courses"
                    href="/dashboard/courses"
                    icon={<BookIcon />}
                    delay={0.5}
                  />
                  <QuickActionCard
                    title="My Tasks"
                    description="View and complete assignments across all your courses"
                    href="/dashboard/tasks"
                    icon={<ClipboardIcon />}
                    delay={0.6}
                  />
                  <QuickActionCard
                    title="My Grades"
                    description="Check your progress, scores, and instructor feedback"
                    href="/dashboard/grades"
                    icon={<TrendingUpIcon />}
                    delay={0.7}
                  />
                </>
              )}
            </div>
          </div>

          {/* Recent Activity / System Overview */}
          <div className="dashboard-section space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isAdmin ? 'System Status' : 'Recent Activity'}
              </h2>
              <p className="text-gray-600">
                {isAdmin ? 'Monitor platform health and performance' : 'Your latest learning activities'}
              </p>
            </div>
            
            <div className="glass-card p-8" style={{ animationDelay: '0.8s' }}>
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  <ClockIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {isAdmin ? 'system alerts' : 'recent activity'} at this time
                </h3>
                <p className="text-gray-500 mb-4">
                  {isAdmin 
                    ? 'All systems are running smoothly. Platform performance is optimal.'
                    : 'Start exploring courses to see your activity timeline here.'
                  }
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>System Online</span>
                  </div>
                  {!isAdmin && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Ready to Learn</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        {!isAdmin && (
          <div className="glass-card bg-gradient-to-r from-blue-50 to-purple-50 p-8 text-center" style={{ animationDelay: '1s' }}>
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start Learning?
              </h3>
              <p className="text-gray-600 mb-6">
                Explore our comprehensive course library and begin your journey towards mastering new skills in artificial intelligence and technology.
              </p>
              <Link
                href="/dashboard/courses"
                className="course-start-button inline-flex items-center px-8 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
              >
                Browse Courses
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface AdminStats {
  totalCourses: number
  totalTasks: number
  totalSubmissions: number
  pendingSubmissions: number
  totalStudents: number
}

// Enhanced Icon Components
const AdminIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const CoursesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const TasksIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const GradingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

// Animated Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  loading, 
  delay = 0 
}: { 
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  loading: boolean
  delay?: number
}) => (
  <div 
    className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-600 truncate">{title}</dt>
          <dd className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              <span className="count-up">{value}</span>
            )}
          </dd>
        </div>
      </div>
    </div>
  </div>
)

// Loading Skeleton Component
const ActionCardSkeleton = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalCourses: 0,
    totalTasks: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalStudents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchAdminStats()
    }
  }, [profile?.id])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)

      const [coursesRes, tasksRes, submissionsRes, pendingRes, studentsRes] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      ])

      setStats({
        totalCourses: coursesRes.count || 0,
        totalTasks: tasksRes.count || 0,
        totalSubmissions: submissionsRes.count || 0,
        pendingSubmissions: pendingRes.count || 0,
        totalStudents: studentsRes.count || 0,
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const adminActions = [
    {
      title: 'Manage Courses',
      description: 'Create, edit, and organize comprehensive course content and materials',
      href: '/dashboard/admin/courses',
      icon: CoursesIcon,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      stat: `${stats.totalCourses} courses`,
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Manage Tasks',
      description: 'Create and organize assignments, projects, and learning activities',
      href: '/dashboard/admin/tasks',
      icon: TasksIcon,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      stat: `${stats.totalTasks} tasks`,
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Grading Queue',
      description: 'Review, evaluate, and provide feedback on student submissions',
      href: '/dashboard/grading',
      icon: GradingIcon,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      stat: `${stats.pendingSubmissions} pending`,
      bgColor: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-600'
    },
    {
      title: 'User Management',
      description: 'Monitor student progress and manage user accounts and permissions',
      href: '/dashboard/admin/users',
      icon: UsersIcon,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      stat: `${stats.totalStudents} students`,
      bgColor: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-600'
    }
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-6 shadow-xl">
              <AdminIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              Welcome back, <span className="font-semibold text-primary-600">{profile.full_name || 'Admin'}</span>! 
              Manage your Süni İntellekt platform with powerful administrative tools.
            </p>
          </div>

          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={CoursesIcon}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              loading={loading}
              delay={0}
            />
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={TasksIcon}
              color="bg-gradient-to-br from-green-500 to-green-600"
              loading={loading}
              delay={100}
            />
            <StatCard
              title="Total Submissions"
              value={stats.totalSubmissions}
              icon={() => <span className="text-white">📝</span>}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              loading={loading}
              delay={200}
            />
            <StatCard
              title="Pending Grading"
              value={stats.pendingSubmissions}
              icon={GradingIcon}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              loading={loading}
              delay={300}
            />
            <StatCard
              title="Students"
              value={stats.totalStudents}
              icon={UsersIcon}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              loading={loading}
              delay={400}
            />
          </div>

          {/* Enhanced Quick Actions */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
              <p className="text-gray-600">Access the most important administrative functions</p>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <ActionCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="group glass-card p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {action.description}
                        </p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${action.bgColor} ${action.textColor}`}>
                          {action.stat}
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-primary-600 transition-all duration-200 group-hover:translate-x-1">
                        <ArrowRightIcon />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Recent Activity Section */}
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Overview</h2>
              <p className="text-gray-600">Monitor platform activity and performance</p>
            </div>
            
            <div className="glass-card p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Comprehensive analytics and activity tracking features are being developed to provide detailed insights into platform usage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Real-time monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Performance metrics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>User engagement data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

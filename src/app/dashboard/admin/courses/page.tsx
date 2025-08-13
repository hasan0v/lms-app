'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { AuthGate } from '@/components/AuthGate'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase, Course } from '@/lib/supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

type AdminCourseListItem = Pick<Course, 'id' | 'title' | 'description' | 'created_at'>

export default function AdminCoursesPage() {
  const { profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [courses, setCourses] = useState<AdminCourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const userId = profile?.id
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest')

  // Fetch once when auth is ready; avoid depending on router (can be unstable across renders)
  useEffect(() => {
    if (!userId) return

    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        if (!cancelled) setCourses(data || [])
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Note: fetchCourses inlined into effect above to keep stable deps

  const deleteCourse = useCallback((courseId: string) => {
    showConfirm({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This will also delete all modules, topics, and tasks within it.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId)

          if (error) throw error

          setCourses(prev => prev.filter(course => course.id !== courseId))
          showSuccess('Course Deleted', 'Course has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting course:', error)
          showError('Delete Failed', 'Error deleting course')
        }
      }
    })
  }, [showConfirm, showSuccess, showError])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = !q
      ? courses
      : courses.filter(c =>
          (c.title || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        )

    list = [...list]
    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title-asc':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'title-desc':
        list.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
        break
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    return list
  }, [courses, search, sort])

  const formatDate = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return ''
    }
  }, [])

  // Role gating handled by ProtectedRoute wrapper below

  return (
  <AuthGate requiredRole="admin">
      <DashboardLayout>
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold gradient-text">Manage Courses</h1>
              <p className="text-gray-600 mt-1">Create, organize, and maintain your course catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="pr-10 min-w-[240px] rounded-xl border-2 border-neutral-200 bg-white/90 text-gray-900 placeholder-gray-400 shadow-sm focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 focus:outline-none transition-colors"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500 group-focus-within:text-secondary-600 transition-colors">🔍</span>
            </div>
            <div className="relative min-w-[190px]">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as 'newest' | 'oldest' | 'title-asc' | 'title-desc')}
                className="appearance-none w-full rounded-xl border-2 border-neutral-200 bg-white/90 py-2 pl-3 pr-10 text-gray-900 shadow-sm focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 focus:outline-none transition-colors"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title-asc">Title A–Z</option>
                <option value="title-desc">Title Z–A</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">▾</span>
            </div>
            <Link
              href="/dashboard/admin/courses/new"
              className="btn btn-primary px-4 py-2"
            >
              + New Course
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded mb-2" />
              <div className="h-4 w-5/6 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="text-6xl mb-3">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-6">{courses.length === 0 ? 'Get started by creating your first course.' : 'Try adjusting your search or sort options.'}</p>
          <Link href="/dashboard/admin/courses/new" className="btn btn-primary px-4 py-2">Create Course</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSorted.map((course) => (
            <div key={course.id} className="glass-card p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title || 'Untitled Course'}</h3>
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(course.created_at)}</span>
              </div>
              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              )}
              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/dashboard/admin/courses/${course.id}`}
                  className="btn btn-secondary px-3 py-2 text-sm"
                >
                  Edit
                </Link>
                {/* Modules link removed as requested */}
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="ml-auto text-sm text-red-600 hover:text-red-700 px-2 py-2 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  </AuthGate>
  )
}

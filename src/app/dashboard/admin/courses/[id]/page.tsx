'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { supabase, Course, Module } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CourseWithModules extends Course {
  modules: Module[]
}

export default function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { showConfirm } = useConfirmDialog()
  const { showSuccess, showError } = useNotifications()
  const [course, setCourse] = useState<CourseWithModules | null>(null)
  const [loading, setLoading] = useState(true)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [showAddModule, setShowAddModule] = useState(false)
  const [addingModule, setAddingModule] = useState(false)

  useEffect(() => {
    if (!courseId || !profile) return
    fetchCourseWithModules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, profile])

  const fetchCourseWithModules = async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, author_id, created_at')
          .eq('id', courseId)
          .single(),
        supabase
          .from('modules')
          .select('id, title, position, course_id, created_at')
          .eq('course_id', courseId)
          .order('position')
      ])

      if (courseRes.error) throw courseRes.error
      if (modulesRes.error) throw modulesRes.error

      setCourse({
        ...(courseRes.data as Course),
        modules: (modulesRes.data as Module[]) || []
      })
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModuleTitle.trim()) return

    setAddingModule(true)
    try {
      const nextPosition = (course?.modules.length || 0) + 1

      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: newModuleTitle,
          position: nextPosition
        })
        .select()
        .single()

      if (error) throw error

      setCourse(prev => prev ? {
        ...prev,
        modules: [...prev.modules, data]
      } : null)

      setNewModuleTitle('')
      setShowAddModule(false)
    } catch (error) {
      console.error('Error adding module:', error)
    } finally {
      setAddingModule(false)
    }
  }

  const deleteModule = async (moduleId: string) => {
    showConfirm({
      title: 'Delete Module',
      message: 'Are you sure you want to delete this module? This will also delete all topics and tasks within it.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', moduleId)

          if (error) throw error

          setCourse(prev => prev ? {
            ...prev,
            modules: prev.modules.filter(m => m.id !== moduleId)
          } : null)

          showSuccess('Module Deleted', 'Module has been deleted successfully.')
        } catch (error) {
          console.error('Error deleting module:', error)
          showError('Delete Failed', 'Failed to delete module. Please try again.')
        }
      }
    })
  }

  const reorderModules = async (moduleId: string, direction: 'up' | 'down') => {
    if (!course) return

    const currentIndex = course.modules.findIndex(m => m.id === moduleId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= course.modules.length) return

    const newModules = [...course.modules]
    const [movedModule] = newModules.splice(currentIndex, 1)
    newModules.splice(targetIndex, 0, movedModule)

    // Update positions in parallel
    const updates = newModules.map((module, index) => ({ id: module.id, position: index + 1 }))

    try {
      const updatePromises = updates.map(update =>
        supabase
          .from('modules')
          .update({ position: update.position })
          .eq('id', update.id)
      )
      const results = await Promise.all(updatePromises)
      const failed = results.find(r => r.error)
      if (failed && failed.error) throw failed.error

      setCourse(prev => prev ? {
        ...prev,
        modules: newModules.map((m, i) => ({ ...m, position: i + 1 }))
      } : null)
    } catch (error) {
      console.error('Error reordering modules:', error)
    }
  }

  if (!courseId || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Role gating handled by ProtectedRoute wrapper below

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
          <Link href="/dashboard/admin/courses" className="text-indigo-600 hover:text-indigo-500">
            ← Back to courses
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-gray-900">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/admin/courses" className="hover:text-gray-700">
              Courses
            </Link>
            <span>›</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500">{course.description}</p>
          )}
        </div>

        {/* Modules */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Modules</h2>
              <button
                onClick={() => setShowAddModule(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Module
              </button>
            </div>

            {/* Add Module Form */}
            {showAddModule && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <form onSubmit={handleAddModule}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module Title
                    </label>
                    <input
                      type="text"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Enter module title..."
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModule(false)
                        setNewModuleTitle('')
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingModule}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {addingModule ? 'Adding...' : 'Add Module'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modules List */}
            {course.modules.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {course.modules.map((module, index) => (
                  <li key={module.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/admin/courses/${course.id}/modules/${module.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {index + 1}. {module.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(module.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => reorderModules(module.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => reorderModules(module.id, 'down')}
                          disabled={index === course.modules.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => deleteModule(module.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete module"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
                <p className="text-gray-500">Add your first module to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  )
}

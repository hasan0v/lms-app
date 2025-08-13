'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { uploadTaskFile } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface TaskWithDetails {
  id: string
  title: string
  description: string
  content: string
  instructions: string
  topics: string[]
  due_date: string | null
  attachments: Array<{
    name: string
    url: string
    size: number
  }>
  created_by: string
  is_published: boolean
  max_score: number
  created_at: string
  updated_at: string
  topic: {
    id: string
    title: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
      }
    }
  } | null
  _count?: {
    submissions: number
  }
}

interface Course {
  id: string
  title: string
  modules: {
    id: string
    title: string
    topics: {
      id: string
      title: string
    }[]
  }[]
}

export default function AdminTasksPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    instructions: '',
    topics: [] as string[],
    due_date: '',
    topic_id: '',
    max_score: 100,
    is_published: false
  })
  const [attachments, setAttachments] = useState<File[]>([])
  // const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (!profile) return
    fetchTasks()
    fetchCourses()
  }, [profile, router])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          content,
          instructions,
          topics,
          due_date,
          attachments,
          created_by,
          is_published,
          max_score,
          created_at,
          updated_at,
          topic:topics(
            id,
            title,
            module:modules(
              id,
              title,
              course:courses(
                id,
                title
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksData = (data || []).map(item => {
        const topic = Array.isArray(item.topic) ? item.topic[0] : item.topic
        const topicModule = Array.isArray(topic.module) ? topic.module[0] : topic.module
        const course = Array.isArray(topicModule.course) ? topicModule.course[0] : topicModule.course

        return {
          ...item,
          topic: {
            ...topic,
            module: {
              ...topicModule,
              course
            }
          }
        }
      }) || []

      // Get submission counts for each task
      const tasksWithCounts = await Promise.all(
        tasksData.map(async (task) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
          
          return {
            ...task,
            _count: { submissions: count || 0 }
          }
        })
      )

      setTasks(tasksWithCounts)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          modules:modules(
            id,
            title,
            topics:topics(
              id,
              title
            )
          )
        `)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title || !formData.content || !formData.instructions || !user) return

    setCreating(true)
    try {
      // Upload attachments first
      const uploadedAttachments = []
      for (const file of attachments) {
        const result = await uploadTaskFile(file, user.id, 'task-attachments')
        if (result.url) {
          uploadedAttachments.push({
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type
          })
        }
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        instructions: formData.instructions,
        topics: formData.topics,
        due_date: formData.due_date || null,
        topic_id: formData.topic_id || null,
        max_score: formData.max_score,
        is_published: formData.is_published,
        attachments: uploadedAttachments,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()

      if (error) throw error

      await fetchTasks()
      resetForm()
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating task:', error)
      showError('Creation Failed', 'Error creating task. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title || !formData.content || !formData.instructions) return

    setCreating(true)
    try {
      // Upload new attachments
      const uploadedAttachments = []
      for (const file of attachments) {
        const result = await uploadTaskFile(file, user!.id, 'task-attachments')
        if (result.url) {
          uploadedAttachments.push({
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type
          })
        }
      }

      const existingAttachments = editingTask.attachments || []
      const allAttachments = [...existingAttachments, ...uploadedAttachments]

      const taskData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        instructions: formData.instructions,
        topics: formData.topics,
        due_date: formData.due_date || null,
        topic_id: formData.topic_id || null,
        max_score: formData.max_score,
        is_published: formData.is_published,
        attachments: allAttachments,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id)

      if (error) throw error

      await fetchTasks()
      resetForm()
      setEditingTask(null)
      
    } catch (error) {
      console.error('Error updating task:', error)
      showError('Update Failed', 'Error updating task. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    showConfirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This will also delete all submissions.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

          if (error) throw error
          await fetchTasks()
          showSuccess('Task Deleted', 'Task has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting task:', error)
          showError('Delete Failed', 'Error deleting task. Please try again.')
        }
      }
    })
  }

  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task)
    setFormData({
      title: task.title || '',
      description: task.description || '',
      content: task.content || '',
      instructions: task.instructions || '',
      topics: task.topics || [],
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      topic_id: task.topic?.id || '',
      max_score: task.max_score || 100,
      is_published: task.is_published || false
    })
    setAttachments([])
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      instructions: '',
      topics: [],
      due_date: '',
      topic_id: '',
      max_score: 100,
      is_published: false
    })
    setAttachments([])
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'published') return task.is_published
    if (filter === 'draft') return !task.is_published
    return true
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const removeAttachment = (index: number, isExisting: boolean = false) => {
    if (isExisting && editingTask) {
      const updatedAttachments = [...(editingTask.attachments || [])]
      updatedAttachments.splice(index, 1)
      setEditingTask({
        ...editingTask,
        attachments: updatedAttachments
      })
    } else {
      const updatedFiles = [...attachments]
      updatedFiles.splice(index, 1)
      setAttachments(updatedFiles)
    }
  }

  // Role gating handled by ProtectedRoute wrapper below

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage assignments for your courses
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="mr-2">✏️</span>
            Create Task
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                    <dd className="text-lg font-medium text-gray-900">{tasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tasks.filter(t => t.is_published).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📄</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Drafts</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tasks.filter(t => !t.is_published).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tasks.reduce((sum, task) => sum + (task._count?.submissions || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex space-x-4">
            {['all', 'published', 'draft'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as 'all' | 'published' | 'draft')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === filterOption
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <span className="ml-2 text-xs">
                  ({filteredTasks.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredTasks.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.is_published ? 'Published' : 'Draft'}
                          </span>
                          {task.topics && task.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.topics.slice(0, 2).map((topic, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                                >
                                  {topic}
                                </span>
                              ))}
                              {task.topics.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                                  +{task.topics.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {task._count?.submissions || 0} submissions
                          </span>
                          <span className="text-sm text-gray-500">
                            Max: {task.max_score} pts
                          </span>
                        </div>
                      </div>

                      {task.topic && (
                        <p className="text-sm text-gray-600 mb-2">
                          📚 {task.topic.module.course.title} › {task.topic.module.title} › {task.topic.title}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {task.description || task.content}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>📅 Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.due_date && (
                            <span>⏰ Due: {new Date(task.due_date).toLocaleString()}</span>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <span>📎 {task.attachments.length} attachment(s)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditTask(task)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        ✏️ Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteTask(task.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                      >
                        🗑️ Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">Create your first task to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ✏️ Create Task
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Task Modal */}
        <AnimatePresence>
          {(showCreateModal || editingTask) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowCreateModal(false)
                setEditingTask(null)
                resetForm()
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        placeholder="Enter task title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Score
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.max_score}
                        onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Brief task description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Content *
                    </label>
                    <textarea
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="General task overview and context..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions *
                    </label>
                    <textarea
                      rows={8}
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Detailed step-by-step instructions and requirements..."
                    />
                  </div>

                  {/* Topics and Course Assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Related Topics (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.topics.join(', ')}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          topics: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                        placeholder="JavaScript, React, Node.js"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Course Topic (optional)
                      </label>
                      <select
                        value={formData.topic_id}
                        onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      >
                        <option value="">Select a topic</option>
                        {courses.map(course => (
                          <optgroup key={course.id} label={course.title}>
                            {course.modules.map(module => (
                              module.topics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                  {module.title} › {topic.title}
                                </option>
                              ))
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    />
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    
                    {/* Existing attachments */}
                    {editingTask && editingTask.attachments && editingTask.attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Attachments:</p>
                        <div className="space-y-2">
                          {editingTask.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📎</span>
                                <span className="text-sm text-gray-700">{attachment.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index, true)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">New Attachments:</p>
                        <div className="space-y-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📎</span>
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publishing Options */}
                  <div className="flex items-center">
                    <input
                      id="is_published"
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                      Publish immediately (students can see and submit)
                    </label>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingTask(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={editingTask ? handleUpdateTask : handleCreateTask}
                    disabled={!formData.title || !formData.content || creating}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        {editingTask ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingTask ? '💾 Update Task' : '✏️ Create Task'}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  </DashboardLayout>
  </ProtectedRoute>
  )
}

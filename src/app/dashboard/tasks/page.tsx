'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { uploadTaskFile } from '@/lib/storage'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardIcon, Check as CheckIcon, Clock as ClockIcon, TrendingUp as TrendingUpIcon, ArrowRight as ArrowRightIcon } from 'lucide-react'

interface TaskAttachment {
  name: string
  url: string
  size: number
  type: string
}

interface TaskWithDetails {
  id: string
  title: string
  description: string
  content: string
  instructions?: string
  topics: string[]
  due_date: string | null
  attachments: TaskAttachment[]
  max_score: number
  created_at: string
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
  submission?: {
    id: string
    status: string
    submitted_at: string
    points: number | null
    feedback: string | null
    graded_at: string | null
    content?: string | null
    file_url?: string | null
    file_path?: string | null
    file_attachments?: Array<{
      name: string
      url: string
      size: number
    }> | null
  }
}

type FilterType = 'all' | 'available' | 'submitted' | 'graded'

export default function UserTasksPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  // Submission form state
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchTasks = useCallback(async () => {
    if (!user) return

    try {
      // Get all published tasks with user submissions
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
          max_score,
          created_at,
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
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksData = (data || []).map(item => {
        // Handle nested relations properly
        let processedTopic = null
        if (item.topic) {
          const topicData = Array.isArray(item.topic) ? item.topic[0] : item.topic
          if (topicData) {
            const moduleData = Array.isArray(topicData.module) ? topicData.module[0] : topicData.module
            const courseData = moduleData && Array.isArray(moduleData.course) ? moduleData.course[0] : moduleData?.course
            
            processedTopic = {
              id: topicData.id,
              title: topicData.title,
              module: {
                id: moduleData?.id || '',
                title: moduleData?.title || '',
                course: {
                  id: courseData?.id || '',
                  title: courseData?.title || ''
                }
              }
            }
          }
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          content: item.content,
          instructions: item.instructions,
          topics: item.topics || [],
          due_date: item.due_date,
          attachments: item.attachments || [],
          max_score: item.max_score,
          created_at: item.created_at,
          topic: processedTopic
        }
      }) as TaskWithDetails[]

      // Get submissions for these tasks
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('task_id', tasksData.map(t => t.id))

      if (submissionsError) throw submissionsError

      // Merge tasks with submissions
      const tasksWithSubmissions: TaskWithDetails[] = tasksData.map(task => {
        const submission = submissions?.find(s => s.task_id === task.id)
        return {
          ...task,
          submission: submission || undefined
        }
      })

      setTasks(tasksWithSubmissions)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, fetchTasks])

  const handleSubmitTask = async () => {
    if (!selectedTask || (!submissionContent && submissionFiles.length === 0) || !user) return

    setSubmitting(true)
    setUploadProgress(0)

    try {
      // Upload files if any
      const uploadedFiles = []
      if (submissionFiles.length > 0) {
        for (let i = 0; i < submissionFiles.length; i++) {
          const file = submissionFiles[i]
          setUploadProgress((i / submissionFiles.length) * 100)
          
          const result = await uploadTaskFile(file, user.id, selectedTask.id)
          if (result.url) {
            uploadedFiles.push({
              name: file.name,
              url: result.url,
              size: file.size,
              type: file.type
            })
          }
        }
      }

      if (isEditMode && selectedTask.submission) {
        // Update existing submission
        const updateData = {
          content: submissionContent.trim() || null,
          file_attachments: uploadedFiles.length > 0 ? uploadedFiles : selectedTask.submission.file_attachments || null,
          file_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : selectedTask.submission.file_url,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }

        const { error } = await supabase
          .from('submissions')
          .update(updateData)
          .eq('id', selectedTask.submission.id)

        if (error) throw error

        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? {
                ...task,
                submission: {
                  ...task.submission!,
                  ...updateData,
                  id: task.submission!.id
                }
              }
            : task
        ))

        showSuccess('Assignment Updated', 'Your assignment has been updated successfully!')
      } else {
        // Create new submission
        const submissionData = {
          task_id: selectedTask.id,
          student_id: user.id,
          content: submissionContent.trim() || null,
          file_attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
          file_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }

        const { data, error } = await supabase
          .from('submissions')
          .insert([submissionData])
          .select()

        if (error) throw error

        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? {
                ...task,
                submission: {
                  id: data[0].id,
                  status: 'submitted',
                  submitted_at: data[0].submitted_at,
                  points: null,
                  feedback: null,
                  graded_at: null
                }
              }
            : task
        ))

        showSuccess('Assignment Submitted', 'Your assignment has been submitted successfully!')
      }

      // Reset form and close modal
      setSubmissionContent('')
      setSubmissionFiles([])
      setShowSubmissionModal(false)
      setSelectedTask(null)
      setIsEditMode(false)
      setUploadProgress(0)
    } catch (error) {
      console.error('Error submitting task:', error)
      showError('Submission Failed', 'Error submitting assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmission = (task: TaskWithDetails) => {
    if (!task.submission || task.submission.status === 'graded') return

    setSelectedTask(task)
    setIsEditMode(true)
    setSubmissionContent(task.submission.content || '')
    setShowSubmissionModal(true)
  }

  const handleDeleteSubmission = async (task: TaskWithDetails) => {
    if (!task.submission || task.submission.status === 'graded') return

    showConfirm({
      title: 'Delete Submission',
      message: 'Are you sure you want to delete this submission? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          // First, delete the associated files from storage if they exist
          if (task.submission?.file_attachments && Array.isArray(task.submission.file_attachments)) {
            for (const fileAttachment of task.submission.file_attachments) {
              if (fileAttachment.url && fileAttachment.url.includes('task-submissions')) {
                // Extract file path from URL to delete it
                const urlParts = fileAttachment.url.split('/storage/v1/object/public/task-submissions/')
                if (urlParts.length > 1) {
                  const filePath = urlParts[1]
                  try {
                    const { error: storageError } = await supabase.storage
                  .from('task-submissions')
                  .remove([filePath])
                
                if (storageError) {
                  console.warn('Could not delete file from storage:', storageError)
                }
              } catch (storageDeleteError) {
                console.warn('Error deleting file from storage:', storageDeleteError)
              }
            }
          }
        }
      }

      // Then delete the submission record from the database
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', task.submission!.id)

      if (error) {
        console.error('Database error deleting submission:', error)
        throw error
      }

          // Refresh tasks from database to ensure consistency
          await fetchTasks()

          showSuccess('Submission Deleted', 'Your submission has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting submission:', error)
          showError('Delete Failed', 'Error deleting submission. Please try again.')
        }
      }
    })
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'available') return !task.submission
    if (filter === 'submitted') return task.submission && task.submission.status === 'submitted'
    if (filter === 'graded') return task.submission && task.submission.status === 'graded'
    return true
  })

  const getTaskStatus = (task: TaskWithDetails) => {
    if (!task.submission) {
      const isOverdue = task.due_date && new Date(task.due_date) < new Date()
      return {
        label: isOverdue ? 'Overdue' : 'Available',
        color: isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800',
        icon: isOverdue ? '⚠️' : '✅'
      }
    }

    if (task.submission.status === 'graded') {
      return {
        label: 'Graded',
        color: 'bg-blue-100 text-blue-800',
        icon: '📊'
      }
    }

    return {
      label: 'Submitted',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '📝'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days left`
  }

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header Section */}
        <div className="text-center mb-8">
          <div className="course-icon-container inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl">
            <ClipboardIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            My Tasks 📝
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            View and submit your assignments across all courses. Stay on top of your learning journey.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ClipboardIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Available</p>
                <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => !t.submission).length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Submitted</p>
                <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.submission && t.submission.status === 'submitted').length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Graded</p>
                <p className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.submission && t.submission.status === 'graded').length}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Tabs */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Tasks</h3>
            <div className="text-sm text-gray-500">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} shown
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['all', 'available', 'submitted', 'graded'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  filter === filterOption
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  filter === filterOption 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter === filterOption ? filteredTasks.length : tasks.filter(t => {
                    if (filterOption === 'available') return !t.submission
                    if (filterOption === 'submitted') return t.submission && t.submission.status === 'submitted'
                    if (filterOption === 'graded') return t.submission && t.submission.status === 'graded'
                    return true
                  }).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task)
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border border-gray-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            Max: {task.max_score} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Info */}
                    {task.topic && (
                      <div className="mb-3">
                        <p className="text-sm text-indigo-600 font-medium">
                          📚 {task.topic.module.course.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.topic.module.title} › {task.topic.title}
                        </p>
                      </div>
                    )}

                    {/* Topics */}
                    {task.topics && task.topics.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {task.topics.slice(0, 3).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                            >
                              {topic}
                            </span>
                          ))}
                          {task.topics.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                              +{task.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {task.description || task.content}
                    </p>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="mb-4">
                        <div className={`text-sm flex items-center space-x-1 ${
                          new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <span>⏰</span>
                          <span>Due: {new Date(task.due_date).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getDaysUntilDue(task.due_date)}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">📎 Attachments:</p>
                        <div className="space-y-1">
                          {task.attachments.slice(0, 2).map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-indigo-600 hover:text-indigo-800 truncate"
                            >
                              📄 {attachment.name}
                            </a>
                          ))}
                          {task.attachments.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{task.attachments.length - 2} more attachments
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submission Info */}
                    {task.submission && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Your Submission</span>
                          {task.submission.status === 'graded' && task.submission.points !== null && (
                            <span className="text-sm font-semibold text-green-600">
                              {task.submission.points}/{task.max_score} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          Submitted: {new Date(task.submission.submitted_at).toLocaleString()}
                        </p>
                        {task.submission.graded_at && (
                          <p className="text-xs text-gray-600">
                            Graded: {new Date(task.submission.graded_at).toLocaleString()}
                          </p>
                        )}
                        {task.submission.feedback && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Feedback:</p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {task.submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedTask(task)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        📖 View Details
                      </motion.button>
                      
                      {!task.submission && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTask(task)
                            setShowSubmissionModal(true)
                          }}
                          className="flex-1 px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                          ✏️ Submit Work
                        </motion.button>
                      )}
                      
                      {task.submission && task.submission.status === 'submitted' && (
                        <div className="flex gap-2 flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditSubmission(task)}
                            className="flex-1 px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                          >
                            ✏️ Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteSubmission(task)}
                            className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            🗑️ Delete
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <ClipboardIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {filter === 'all' ? 'No tasks available' : `No ${filter} tasks`}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Check back later for new assignments from your instructors'
                : `You don't have any ${filter} tasks at the moment`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="course-start-button inline-flex items-center px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] group"
              >
                View All Tasks
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        )}

        {/* Task Details Modal */}
        <AnimatePresence>
          {selectedTask && !showSubmissionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedTask(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedTask.title || `Task from ${selectedTask.topic?.title || 'Unknown Topic'}`}
                    </h3>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedTask.topic && (
                    <p className="text-sm text-gray-600 mt-1">
                      📚 {selectedTask.topic.module?.course?.title} › {selectedTask.topic.module?.title} › {selectedTask.topic.title}
                    </p>
                  )}
                </div>

                <div className="px-6 py-4">
                  {/* Task Info */}
                  <div className="space-y-6">
                    {/* Course Information */}
                    {selectedTask.topic && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Course Information</h4>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            📚 {selectedTask.topic.module?.course?.title || 'Course'} › 
                            {selectedTask.topic.module?.title || 'Module'} › 
                            {selectedTask.topic.title || 'Topic'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Max Score</h4>
                        <p className="text-lg font-semibold text-indigo-600">{selectedTask.max_score} points</p>
                      </div>
                      {selectedTask.due_date && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Due Date</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedTask.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedTask.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedTask.description}</p>
                      </div>
                    )}

                    {/* Content */}
                    {selectedTask.content && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Content</h4>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4">
                            {selectedTask.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {selectedTask.instructions && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                            {selectedTask.instructions}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback when no content is available */}
                    {!selectedTask.description && !selectedTask.content && !selectedTask.instructions && (
                      <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-yellow-600 text-3xl mb-2">⚠️</div>
                        <h4 className="text-lg font-medium text-yellow-800 mb-1">Task Content Not Available</h4>
                        <p className="text-yellow-700 mb-3">
                          This task appears to be missing detailed instructions or content.
                        </p>
                        <p className="text-sm text-yellow-600">
                          Please contact your instructor for the task requirements.
                        </p>
                      </div>
                    )}

                    {/* Submission Status */}
                    {selectedTask.submission && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Your Submission</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              selectedTask.submission.status === 'graded' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedTask.submission.status === 'graded' ? '✅ Graded' : '⏳ Submitted'}
                            </span>
                            {selectedTask.submission.points !== null && (
                              <span className="text-lg font-semibold text-indigo-600">
                                {selectedTask.submission.points}/{selectedTask.max_score} points
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            📅 Submitted: {new Date(selectedTask.submission.submitted_at).toLocaleString()}
                          </p>
                          {selectedTask.submission.graded_at && (
                            <p className="text-sm text-gray-600 mb-2">
                              ✅ Graded: {new Date(selectedTask.submission.graded_at).toLocaleString()}
                            </p>
                          )}
                          {selectedTask.submission.feedback && (
                            <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                              <p className="text-sm font-medium text-gray-700 mb-1">Instructor Feedback:</p>
                              <p className="text-sm text-gray-600">{selectedTask.submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">📎 Attachments</h4>
                      <div className="space-y-2">
                        {selectedTask.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-indigo-600">📄</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                              <p className="text-xs text-gray-500">
                                {((attachment.size || 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <span className="text-sm text-indigo-600">Download</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {!selectedTask.submission && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSubmissionModal(true)}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      ✏️ Submit Work
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submission Modal */}
        <AnimatePresence>
          {showSubmissionModal && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowSubmissionModal(false)
                setSubmissionContent('')
                setSubmissionFiles([])
                setIsEditMode(false)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Edit Submission' : 'Submit'}: {selectedTask.title}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Written Response / Notes
                    </label>
                    <textarea
                      rows={8}
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Enter your response, notes, or explanation here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setSubmissionFiles(Array.from(e.target.files))
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    
                    {submissionFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                        <div className="space-y-2">
                          {submissionFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📎</span>
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedFiles = [...submissionFiles]
                                  updatedFiles.splice(index, 1)
                                  setSubmissionFiles(updatedFiles)
                                }}
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

                  {submitting && uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading files...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowSubmissionModal(false)
                      setSubmissionContent('')
                      setSubmissionFiles([])
                      setIsEditMode(false)
                    }}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: submitting ? 1 : 1.05 }}
                    whileTap={{ scale: submitting ? 1 : 0.95 }}
                    onClick={handleSubmitTask}
                    disabled={(!submissionContent && submissionFiles.length === 0) || submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        {isEditMode ? '💾 Update Submission' : '📤 Submit Assignment'}
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
  )
}

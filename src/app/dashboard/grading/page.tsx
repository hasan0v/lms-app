'use client'

import DashboardLayout from '@/components/DashboardLayout'
import FileAttachmentLink from '@/components/FileAttachmentLink'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// Utility function to extract file path from public URL
function extractFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    const bucketPath = `/storage/v1/object/public/${bucket}/`
    const pathIndex = url.indexOf(bucketPath)
    if (pathIndex !== -1) {
      return url.substring(pathIndex + bucketPath.length)
    }
    return null
  } catch {
    return null
  }
}

interface SubmissionWithDetails {
  id: string
  file_url: string | null
  file_path?: string | null
  file_attachments?: Array<{
    name: string
    url: string
    size: number
  }>
  content?: string | null
  submitted_at: string
  graded_at?: string | null
  status: string
  points: number | null
  feedback: string | null
  student: {
    id: string
    full_name: string
  }
  task: {
    id: string
    title: string
    instructions: string
    max_score: number
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
    }
  }
}

type FilterType = 'all' | 'pending' | 'graded'

export default function AdminGradingPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Form states for grading
  const [points, setPoints] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!profile) return
    fetchSubmissions()
  }, [profile, router])

  const fetchSubmissions = async () => {
    try {
      // Start with a completely simple query to debug
      console.log('Starting fetchSubmissions...')
      
      const simpleResult = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50)
      
      if (simpleResult.error) {
        console.error('Simple submissions query failed:', simpleResult.error)
        throw simpleResult.error
      }
      
      let data = simpleResult.data
      
      if (data && data.length > 0) {
        // Fetch user profiles separately - using student_id instead of user_id
        const userIds = [...new Set(data.map(sub => sub.student_id).filter(id => id != null))]
        
        let users: Array<{id: string, full_name: string}> = []
        if (userIds.length > 0) {
          // Query for user profiles
          const userResult = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', userIds)
          
          if (userResult.data && userResult.data.length > 0) {
            // Map existing users
            users = userResult.data.map(user => ({
              id: user.id,
              full_name: user.full_name || 'No Name'
            }))
            
            // Check for missing users and create fallbacks only for those
            const foundUserIds = new Set(userResult.data.map(u => u.id))
            const missingUserIds = userIds.filter(id => !foundUserIds.has(id))
            
            if (missingUserIds.length > 0) {
              console.log(`Note: Some student profiles not found in database:`, missingUserIds)
              // Add fallback users only for missing ones
              const fallbackUsers = missingUserIds.map(id => ({
                id: id,
                full_name: 'Unknown Student'
              }))
              users = [...users, ...fallbackUsers]
            }
          } else {
            // No users found at all - create fallbacks for all
            users = userIds.map(id => ({
              id: id,
              full_name: 'Unknown Student'
            }))
            console.log(`Note: No student profiles found in database for:`, userIds)
          }
        }
        
        // Fetch tasks separately
        const taskIds = [...new Set(data.map(sub => sub.task_id).filter(id => id != null))]
        
        let tasks: Array<{id: string, title: string, instructions: string, max_score: number}> = []
        if (taskIds.length > 0) {
          const taskResult = await supabase
            .from('tasks')
            .select('id, title, instructions, max_score')
            .in('id', taskIds)
          
          tasks = taskResult.data || []
        }
        
        // Combine the data manually - using student_id
        data = data.map(submission => {
          const matchedUser = users?.find(u => u.id === submission.student_id)
          return {
            ...submission,
            user_profiles: matchedUser,
            tasks: tasks?.find(t => t.id === submission.task_id)
          }
        })
      }

      console.log('Fetched submissions:', data?.length || 0)

      if (!data || data.length === 0) {
        setSubmissions([])
        return
      }

      // Process the data to match our interface
      const processedSubmissions = data.map(submission => {
        return {
          ...submission,
          student: submission.user_profiles || { id: '', full_name: 'Unknown Student' },
          task: submission.tasks ? {
            ...submission.tasks,
            topic: {
              id: '',
              title: 'Unknown Topic',
              module: {
                id: '',
                title: 'Unknown Module',
                course: {
                  id: '',
                  title: 'Unknown Course'
                }
              }
            }
          } : {
            id: '',
            title: 'Unknown Task',
            instructions: 'No instructions available',
            max_score: 0,
            topic: {
              id: '',
              title: 'Unknown Topic',
              module: {
                id: '',
                title: 'Unknown Module',
                course: {
                  id: '',
                  title: 'Unknown Course'
                }
              }
            }
          }
        }
      })

      setSubmissions(processedSubmissions)
    } catch (error) {
      console.error('Error fetching submissions - all methods failed:', error)
      // Set empty array on error so the UI still works
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async () => {
    if (!selectedSubmission || !points) return

    setGrading(true)
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          points: parseInt(points),
          feedback: feedback.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id
        })
        .eq('id', selectedSubmission.id)

      if (error) throw error

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? {
              ...sub,
              points: parseInt(points),
              feedback: feedback.trim() || null,
              status: 'graded',
              graded_at: new Date().toISOString()
            }
          : sub
      ))

      setSelectedSubmission({
        ...selectedSubmission,
        points: parseInt(points),
        feedback: feedback.trim() || null,
        status: 'graded',
        graded_at: new Date().toISOString()
      })

      showSuccess('Grade Submitted', 'Grade has been submitted successfully!')
    } catch (error) {
      console.error('Error grading submission:', error)
      showError('Grading Failed', 'Error submitting grade. Please try again.')
    } finally {
      setGrading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = 
      filter === 'pending' ? sub.status === 'submitted' :
      filter === 'graded' ? sub.status === 'graded' :
      true

    const matchesSearch = !searchTerm || (
      (sub.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.task?.topic?.module?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      // Also search by submission ID
      (sub.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    )

    return matchesFilter && matchesSearch
  })

  const selectSubmission = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission)
    if (submission.status === 'graded') {
      setPoints(submission.points !== null ? submission.points.toString() : '')
      setFeedback(submission.feedback || '')
    } else {
      setPoints('')
      setFeedback('')
    }
  }

  const stats = useMemo(() => {
    const total = submissions.length
    const pending = submissions.filter(s => s.status === 'submitted').length
    const graded = submissions.filter(s => s.status === 'graded').length
    const avgScore = graded > 0 
      ? submissions
          .filter(s => s.status === 'graded' && s.points !== null)
          .reduce((sum, s) => sum + (s.points || 0), 0) / graded
      : 0

    return { total, pending, graded, avgScore }
  }, [submissions])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grading Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and grade student submissions
            </p>
          </div>
          
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="inline-flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
            title={sidebarVisible ? 'Hide topics sidebar' : 'Show topics sidebar'}
          >
            <svg 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {sidebarVisible ? (
                // Hide sidebar icon (panel close)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                // Show sidebar icon (panel open)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Graded</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.graded}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.avgScore.toFixed(1)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filter Tabs */}
            <div className="flex space-x-4">
              {(['all', 'pending', 'graded'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === filterOption
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  <span className="ml-2 text-xs">
                    ({
                      filterOption === 'all' ? submissions.length :
                      filterOption === 'pending' ? submissions.filter(sub => sub.status === 'submitted').length :
                      submissions.filter(sub => sub.status === 'graded').length
                    })
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students, tasks, or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-20rem)] gap-6">
          {/* Submissions and Grading Panel */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 ${
            sidebarVisible ? 'flex-1' : 'w-full'
          }`}>
            {/* Submissions List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Submissions ({filteredSubmissions.length})
                </h3>
                
                {filteredSubmissions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredSubmissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => selectSubmission(submission)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedSubmission?.id === submission.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {submission.student.full_name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              submission.status === 'graded'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {submission.status === 'graded' ? '✅ Graded' : '⏳ Pending'}
                            </span>
                            {submission.status === 'graded' && (
                              <span className="text-sm font-medium text-green-600">
                                {submission.points}/{submission.task.max_score}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 mb-1">{submission.task.title}</p>
                          <p className="text-gray-600 text-xs mb-2">
                            📚 {submission.task.topic.module.course.title} › {submission.task.topic.module.title} › {submission.task.topic.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            📅 Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-500">
                      {searchTerm ? 'No submissions match your search' : 'No submissions found'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Panel */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {selectedSubmission ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Student Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {selectedSubmission.student?.full_name || 'Unknown Student'}
                        </h3>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedSubmission.status === 'graded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedSubmission.status === 'graded' ? '✅ Graded' : '⏳ Pending Review'}
                        </span>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {selectedSubmission.task?.title || 'Task title not available'}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          📚 {selectedSubmission.task?.topic?.module?.course?.title || 'Course'} › {selectedSubmission.task?.topic?.module?.title || 'Module'} › {selectedSubmission.task?.topic?.title || 'Topic'}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          {selectedSubmission.task?.instructions || 'No instructions available'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Max Score: {selectedSubmission.task?.max_score || 'N/A'} points
                        </p>
                      </div>
                    </div>

                    {/* Submission Content */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Submission</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <p className="text-xs text-gray-500">
                          📅 Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        </p>
                        {selectedSubmission.graded_at && (
                          <p className="text-xs text-gray-500">
                            ✅ Graded: {new Date(selectedSubmission.graded_at).toLocaleString()}
                          </p>
                        )}

                        {/* Written Content */}
                        {selectedSubmission.content && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Written Response:</p>
                            <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedSubmission.content}
                            </div>
                          </div>
                        )}

                        {/* File Attachments */}
                        {selectedSubmission.file_attachments && Array.isArray(selectedSubmission.file_attachments) && selectedSubmission.file_attachments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">📎 Attachments:</p>
                            <div className="space-y-2">
                              {selectedSubmission.file_attachments.map((attachment, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <FileAttachmentLink
                                    bucket="task-submissions"
                                    filePath={extractFilePathFromUrl(attachment?.url || '', 'task-submissions')}
                                    fileName={attachment?.name}
                                  >
                                    {attachment?.name || `Attachment ${index + 1}`}
                                  </FileAttachmentLink>
                                  <span className="text-xs text-gray-500">
                                    ({((attachment?.size || 0) / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Legacy file_url support */}
                        {selectedSubmission.file_url && !selectedSubmission.file_attachments && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">📎 Submitted file:</p>
                            <FileAttachmentLink
                              bucket="task-submissions"
                              filePath={extractFilePathFromUrl(selectedSubmission.file_url, 'task-submissions')}
                              fileName="Submitted File"
                            >
                              View File
                            </FileAttachmentLink>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grading Form */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">
                        {selectedSubmission.status === 'graded' ? 'Update Grade' : 'Grade Assignment'}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points * (Max: {selectedSubmission.task.max_score})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={selectedSubmission.task.max_score}
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                            placeholder={`Enter points (0-${selectedSubmission.task.max_score})`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback
                          </label>
                          <textarea
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                            placeholder="Provide feedback to the student..."
                          />
                        </div>

                        <div className="flex justify-end">
                          <motion.button
                            whileHover={{ scale: grading ? 1 : 1.05 }}
                            whileTap={{ scale: grading ? 1 : 0.95 }}
                            onClick={handleGrade}
                            disabled={!points || grading}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                          >
                            {grading ? (
                              <>
                                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                {selectedSubmission.status === 'graded' ? 'Updating...' : 'Grading...'}
                              </>
                            ) : (
                              <>
                                {selectedSubmission.status === 'graded' ? '💾 Update Grade' : '✅ Submit Grade'}
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Current Grade Display */}
                    {selectedSubmission.status === 'graded' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4"
                      >
                        <h5 className="text-sm font-medium text-green-900 mb-2">✅ Current Grade</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Points:</span>
                            <span className="text-sm font-medium text-green-900">
                              {selectedSubmission.points}/{selectedSubmission.task.max_score}
                            </span>
                          </div>
                          {selectedSubmission.feedback && (
                            <div>
                              <span className="text-sm text-green-700">Feedback:</span>
                              <p className="text-sm text-green-900 mt-1 whitespace-pre-wrap">
                                {selectedSubmission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">✏️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a submission to grade
                      </h3>
                      <p className="text-gray-500">
                        Choose a submission from the left panel to start grading
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Topics Sidebar */}
          {sidebarVisible && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-80 bg-white border border-gray-200 rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Course Topics</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSubmission 
                    ? `${selectedSubmission.task.topic.module.course.title}`
                    : 'Select a submission to view course topics'
                  }
                </p>
              </div>

              <div className="p-4 overflow-y-auto max-h-96">
                {selectedSubmission ? (
                  <div className="space-y-4">
                    {/* Current Module */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-indigo-900 mb-1">
                        📚 {selectedSubmission.task.topic.module.title}
                      </h4>
                      <div className="bg-indigo-100 rounded p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-indigo-800">
                            📝 {selectedSubmission.task.topic.title}
                          </span>
                          <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                            Current
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Topics Structure */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Other Topics in Course
                      </h5>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                          1.1 Python&apos;a Giriş ve Quraşdırma
                        </div>
                        <div className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                          1.2 Dəyişənlər və məlumat növləri
                        </div>
                        <div className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                          1.3 Əsas operatorlar
                        </div>
                        <div className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                          2.1 Şərtli struktur
                        </div>
                        <div className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">
                          2.2 Dövrə strukturları  
                        </div>
                      </div>
                    </div>

                    {/* Assignment Stats */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Assignment Info
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Score:</span>
                          <span className="font-medium text-gray-900">{selectedSubmission.task.max_score} pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${
                            selectedSubmission.status === 'graded' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {selectedSubmission.status === 'graded' ? 'Graded' : 'Pending'}
                          </span>
                        </div>
                        {selectedSubmission.status === 'graded' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-medium text-green-600">
                              {selectedSubmission.points}/{selectedSubmission.task.max_score}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📖</div>
                    <p className="text-sm text-gray-500">
                      Select a submission to view course topics
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
  </DashboardLayout>
  </ProtectedRoute>
  )
}

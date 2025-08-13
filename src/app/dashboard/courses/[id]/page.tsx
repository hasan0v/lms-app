'use client'

import DashboardLayout from '@/components/DashboardLayout'
import YouTubeVideoManager from '@/components/YouTubeVideoManager'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { supabase, Course, Module, Topic, Task, Submission } from '@/lib/supabase'
import { uploadTaskFile } from '@/lib/storage'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import FileAttachmentLink from '@/components/FileAttachmentLink'
import { useParams } from 'next/navigation'

interface TaskWithSubmission extends Task {
  submission?: Submission
}

interface TopicWithTask extends Topic {
  tasks: TaskWithSubmission[]
}

interface ModuleWithTopics extends Module { topics: TopicWithTask[] }

interface CourseWithContent extends Course {
  modules: ModuleWithTopics[]
}

export default function StudentCoursePage() {
  const { id } = useParams<{ id: string }>()
  return <StudentCourseContent courseId={id} />
}

function StudentCourseContent({ courseId }: { courseId: string }) {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const [course, setCourse] = useState<CourseWithContent | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  
  // Step 1: Fetch course and modules as soon as courseId is available (no user dependency)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!courseId) return
      try {
        type DBTaskRaw = {
          id: string
          topic_id: string
          instructions: string
          created_at: string
          title?: string
          description?: string
          content?: string
          attachments?: Array<{ name: string; url: string; size: number; type?: string }>
          due_date?: string | null
          max_score?: number
          topics?: string[]
          is_published?: boolean
        }
        type DBTopicRaw = {
          id: string
          title: string
          content: string
          youtube_links?: string[] | null
          position: number
          module_id: string
          created_at: string
          tasks?: DBTaskRaw[]
        }
        type DBModuleRaw = {
          id: string
          title: string
          position: number
          course_id: string
          created_at: string
          topics?: DBTopicRaw[]
        }

        const [courseRes, modulesRes] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title, description, author_id, created_at')
            .eq('id', courseId)
            .single(),
          supabase
            .from('modules')
            .select(`
              id,
              title,
              position,
              course_id,
              created_at,
              topics(
                id,
                title,
                content,
                youtube_links,
                position,
                module_id,
                created_at,
                tasks(
                  id,
                  topic_id,
                  instructions,
                  created_at,
                  title,
                  description,
                  content,
                  attachments,
                  due_date,
                  max_score,
                  topics,
                  is_published
                )
              )
            `)
            .eq('course_id', courseId)
            .order('position')
        ])

        if (courseRes.error) throw courseRes.error
        if (modulesRes.error) throw modulesRes.error

        const modulesData = modulesRes.data as DBModuleRaw[] | null
        const processedModules: ModuleWithTopics[] = (modulesData ?? []).map((module) => {
          const topics: TopicWithTask[] = (module.topics ?? [])
            .sort((a, b) => a.position - b.position)
            .map((t) => ({
              id: t.id,
              module_id: t.module_id,
              title: t.title,
              content: t.content,
              position: t.position,
              created_at: t.created_at,
              youtube_links: t.youtube_links ?? undefined,
              tasks: (t.tasks || []).filter(tsk => tsk.is_published !== false).map(task => ({
                ...task,
                submission: undefined
              })),
            }))

          return {
            id: module.id,
            course_id: module.course_id,
            title: module.title,
            position: module.position,
            created_at: module.created_at,
            topics
          }
        })

        const baseCourse: CourseWithContent = {
          id: courseRes.data.id,
          title: courseRes.data.title,
          description: courseRes.data.description,
          author_id: courseRes.data.author_id,
          created_at: courseRes.data.created_at,
          modules: processedModules
        }

        if (!cancelled) {
          setCourse(baseCourse)
          if (processedModules.length > 0 && processedModules[0].topics.length > 0) {
            setSelectedTopic(processedModules[0].topics[0])
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching course/modules:', error)
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [courseId])

  // Step 2: Once user is available, fetch submissions in parallel and merge
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!user || !course) return
      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select('id, task_id, student_id, file_url, file_path, status, submitted_at, points, feedback')
          .eq('student_id', user.id)
        if (submissionsError) throw submissionsError

        if (!cancelled && submissionsData) {
          setCourse(prev => {
            if (!prev) return prev
            return {
              ...prev,
              modules: prev.modules.map(m => ({
                ...m,
                topics: m.topics.map(t => ({
                  ...t,
                  tasks: t.tasks.map(task => ({
                    ...task,
                    submission: submissionsData.find(sub => sub.task_id === task.id)
                  }))
                }))
              }))
            }
          })
          // Also update selectedTopic if it exists
          setSelectedTopic(prev => {
            if (!prev) return prev
            return {
              ...prev,
              tasks: prev.tasks.map(task => ({
                ...task,
                submission: submissionsData.find(sub => sub.task_id === task.id)
              }))
            }
          })
        }
      } catch (error) {
        console.error('Error fetching submissions:', error)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user, course])

  const handleFileUpload = async (taskId: string, file: File) => {
    if (!user || !file) return

    setUploadingFile(taskId)
    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadTaskFile(file, user.id, taskId)
      
      if (uploadResult.error) {
        throw new Error(uploadResult.error)
      }

      // Create submission record with the uploaded file URL
      const { data, error } = await supabase
        .from('submissions')
        .upsert({
          task_id: taskId,
          student_id: user.id,
          file_url: uploadResult.url,
          file_path: uploadResult.path, // Store the storage path for potential deletion
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      setCourse(prev => {
        if (!prev) return prev
        return {
          ...prev,
          modules: prev.modules.map(module => ({
            ...module,
            topics: module.topics.map(topic => ({
              ...topic,
              tasks: topic.tasks.map(task => task.id === taskId ? { ...task, submission: data } : task)
            }))
          }))
        }
      })

      if (selectedTopic) {
        setSelectedTopic(prev => prev ? {
          ...prev,
          tasks: prev.tasks.map(task => task.id === taskId ? { ...task, submission: data } : task)
        } : null)
      }

      showSuccess('Assignment Submitted', 'Your assignment has been submitted successfully!')
    } catch (error: unknown) {
      console.error('Error uploading file:', error)
      const message = error instanceof Error ? error.message : 'Please try again.'
      showError('Submission Failed', `Error submitting assignment: ${message}`)
    } finally {
      setUploadingFile(null)
    }
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

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
          <Link href="/dashboard/courses" className="text-indigo-600 hover:text-indigo-500">
            ← Back to courses
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link href="/dashboard/courses" className="hover:text-gray-700">
                Courses
              </Link>
              <span>›</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{course.title}</h1>
            {course.description && (
              <p className="text-sm text-gray-600 mt-1">{course.description}</p>
            )}
          </div>

          <div className="p-4">
            {course.modules.map((module, moduleIndex) => (
              <div key={module.id} className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {moduleIndex + 1}. {module.title}
                </h3>
                <div className="space-y-1">
                  {module.topics.map((topic, topicIndex) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedTopic?.id === topic.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{moduleIndex + 1}.{topicIndex + 1} {topic.title}</span>
                        <div className="flex items-center space-x-1">
                          {topic.tasks.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-orange-400" title="Has assignment(s)" />
                          )}
                          {(() => {
                            const submissionTask = topic.tasks.find(tsk => tsk.submission)
                            if (!submissionTask) return null
                            const graded = submissionTask.submission!.status === 'graded'
                            return (
                              <span
                                className={`w-2 h-2 rounded-full ${graded ? 'bg-green-400' : 'bg-blue-400'}`}
                                title={graded ? 'Graded' : 'Submitted'}
                              />
                            )
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedTopic ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedTopic.title}
                </h1>

                {/* Topic Content */}
                {selectedTopic.content && (
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      📚 Google Colab Tutorial
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.9 12c0 .8-.2 1.54-.54 2.18l-4.36-4.36V7.64c2.06.42 3.6 2.25 3.6 4.36h1.3zm-8.36 0c0-2.11 1.54-3.94 3.6-4.36v2.18l-4.36 4.36c-.32-.64-.54-1.38-.54-2.18H7.64zm8.36 0c0 4.08-3.32 7.4-7.4 7.4s-7.4-3.32-7.4-7.4 3.32-7.4 7.4-7.4c.76 0 1.5.12 2.18.32l1.04-1.04C14.4 4.32 13.24 4 12 4 7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8c0-1.24-.32-2.4-.88-3.42l-1.04 1.04c.2.68.32 1.42.32 2.18z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Google Colab Notebook</h3>
                          <p className="text-sm text-gray-600">Interactive Python programming tutorial</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
                        <p className="text-sm text-gray-700 mb-3">
                          Click the button below to open the Google Colab notebook in a new tab. 
                          You can run code, modify examples, and experiment with Python directly in your browser.
                        </p>
                        <div className="flex items-center space-x-3">
                          <a 
                            href={selectedTopic.content} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                            Open in Google Colab
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(selectedTopic.content)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="font-medium text-blue-700 mb-1">How to use:</p>
                            <ul className="text-blue-600 space-y-1">
                              <li>• Click &quot;Open in Google Colab&quot; to start the tutorial</li>
                              <li>• You may need to sign in with your Google account</li>
                              <li>• Run code cells by clicking the play button or pressing Shift+Enter</li>
                              <li>• Feel free to modify and experiment with the code</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube Videos */}
                {selectedTopic.youtube_links && selectedTopic.youtube_links.length > 0 && (
                  <div className="mb-8">
                    <YouTubeVideoManager
                      videoLinks={selectedTopic.youtube_links}
                      onUpdate={() => {}} // Read-only for students
                      isEditing={false}
                    />
                  </div>
                )}

                {/* Task / Assignment Card Section */}
                {selectedTopic.tasks && selectedTopic.tasks.length > 0 && (
                  <div className="space-y-10 mb-10">
                    {selectedTopic.tasks.map((task, idx) => (
                      <div key={task.id} className="relative group">
                      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-indigo-300/40 via-purple-300/40 to-pink-300/40 blur opacity-0 group-hover:opacity-60 transition duration-500" />
                      <div className="relative glass-card rounded-2xl p-6 md:p-7 border border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm hover:shadow-xl transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg ring-1 ring-black/5">
                                <span className="text-2xl">📝</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                  {task.title || `Assignment ${idx + 1}`}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  Required
                                </span>
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                  {task.description || 'Complete and upload your work to receive feedback and grading.'}
                                </p>
                            </div>
                          </div>
                            {task.submission && (
                            <div className="flex flex-col items-start sm:items-end gap-2 min-w-[140px]">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm border ${
                                  task.submission.status === 'graded'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                  {task.submission.status === 'graded' ? 'Graded' : 'Pending Review'}
                              </span>
                                <span className="text-[11px] text-gray-500">Submitted {new Date(task.submission.submitted_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                          <div className="prose prose-sm max-w-none mb-6 text-gray-800 leading-relaxed">
                            {task.content && (
                              <div className="mb-4 whitespace-pre-line bg-white/60 rounded-lg p-4 border border-gray-200">
                                {task.content}
                              </div>
                            )}
                            <div className="whitespace-pre-line bg-indigo-50/60 rounded-lg p-4 border border-indigo-100">
                              {task.instructions}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mb-6 text-xs">
                            {task.max_score && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 border border-gray-200 text-gray-700">
                                🏅 Max: {task.max_score} pts
                              </span>
                            )}
                            {task.due_date && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 border border-gray-200 text-gray-700">
                                ⏰ Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {task.attachments && task.attachments.length > 0 && (
                            <div className="mb-8">
                              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">📎</span>
                                Resources
                                <span className="text-[10px] font-medium text-gray-400">{task.attachments.length}</span>
                              </h3>
                              <ul className="space-y-2">
                                {task.attachments.map((att, i) => (
                                  <li key={i}>
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group flex items-center gap-3 p-3 rounded-lg bg-white/70 border border-gray-200 hover:bg-white transition shadow-sm"
                                    >
                                      <span className="text-indigo-500">📄</span>
                                      <span className="flex-1 text-sm text-gray-700 truncate group-hover:text-indigo-600">
                                        {att.name || `Attachment ${i + 1}`}
                                      </span>
                                      {att.size && (
                                        <span className="text-[10px] text-gray-400">
                                          {(att.size / 1024).toFixed(1)} KB
                                        </span>
                                      )}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* Submission Area */}
            {task.submission ? (
                          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4 4-4M12 4v12" /></svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Your Submission</p>
                  <p className="text-xs text-gray-500">{new Date(task.submission.submitted_at).toLocaleString()}</p>
                                </div>
                              </div>
                {task.submission.status === 'graded' && (
                                <div className="flex items-center gap-3">
                                  <div className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-semibold border border-green-200 shadow-sm">
                  {task.submission.points || 0} pts
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mb-4">
                              <FileAttachmentLink
                                bucket="task-submissions"
                filePath={task.submission.file_path || null}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium border border-indigo-200 transition shadow-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L21 6.828M8 17l-4 4m0 0l-4-4m4 4V3" /></svg>
                                View Submitted File
                              </FileAttachmentLink>
                            </div>
              {task.submission.status === 'graded' && (
                              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">Feedback</span>
                                  <span className="text-xs text-gray-500">Instructor Review</span>
                                </div>
                {task.submission.feedback ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{task.submission.feedback}</p>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">No written feedback provided.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-white/70 backdrop-blur-sm p-6 flex flex-col gap-4 items-start">
                            <div className="flex items-center gap-3 text-indigo-600">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4 4-4M12 4v12" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Upload Your Answer</p>
                                <p className="text-xs text-gray-500">PDF, DOCX, or ZIP (max 10MB)</p>
                              </div>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(task.id, file)
                                  }
                                }}
                                disabled={uploadingFile === task.id}
                              />
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              {uploadingFile === task.id ? 'Uploading...' : 'Select File'}
                            </label>
                            {uploadingFile === task.id && (
                              <p className="text-xs text-indigo-600 animate-pulse">Uploading file, please wait…</p>
                            )}
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                              Once submitted, you can still view your file while it awaits review. Graded results will appear here automatically.
                            </p>
                          </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-gray-500">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 border border-gray-200">
                            <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                            Auto-saves after upload
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 border border-gray-200">
                            <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Secure storage
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 border border-gray-200">
                            <svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                            Instructor review
                          </span>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📖</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a topic to start learning
                </h3>
                <p className="text-gray-500">
                  Choose a topic from the sidebar to view its content
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

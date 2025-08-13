'use client'

import DashboardLayout from '@/components/DashboardLayout'
import RichTextEditor from '@/components/RichTextEditor'
import YouTubeVideoManager from '@/components/YouTubeVideoManager'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Module, Topic, Task } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TopicWithTask extends Topic {
  task?: Task
}

interface ModuleWithTopics extends Module {
  topics: TopicWithTask[]
  course: {
    id: string
    title: string
  }
}

export default function ModuleDetailPage() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>()
  return (
    <ProtectedRoute requiredRole="admin">
      <ModuleDetailContent id={id} moduleId={moduleId} />
    </ProtectedRoute>
  )
}

function ModuleDetailContent({ id, moduleId }: { id: string; moduleId: string }) {
  const { profile } = useAuth()
  const router = useRouter()
  const [module, setModule] = useState<ModuleWithTopics | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    taskInstructions: '',
    youtubeLinks: [] as string[]
  })

  useEffect(() => {
    fetchModuleWithTopics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, profile, router])

  const fetchModuleWithTopics = async () => {
    try {
      // Fetch module with course info
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          position,
          course_id,
          created_at,
          courses!inner(id, title)
        `)
  .eq('id', moduleId)
        .single()

      if (moduleError) throw moduleError

      // Fetch topics with tasks
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`
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
            created_at
          )
        `)
  .eq('module_id', moduleId)
        .order('position')

      if (topicsError) throw topicsError

      const topicsWithTasks = topicsData?.map(topic => ({
        id: topic.id,
        title: topic.title,
        content: topic.content,
        position: topic.position,
        module_id: topic.module_id,
        created_at: topic.created_at,
        task: (topic as Topic & { tasks?: Task[] }).tasks?.[0] ? {
          id: (topic as Topic & { tasks?: Task[] }).tasks![0].id,
          topic_id: (topic as Topic & { tasks?: Task[] }).tasks![0].topic_id,
          instructions: (topic as Topic & { tasks?: Task[] }).tasks![0].instructions,
          created_at: (topic as Topic & { tasks?: Task[] }).tasks![0].created_at
        } : undefined
      })) || []

      setModule({
        id: moduleData.id,
        title: moduleData.title,
        position: moduleData.position,
        course_id: moduleData.course_id,
        created_at: moduleData.created_at,
        course: {
          id: (moduleData.courses as { id: string; title: string }[])[0]?.id || '',
          title: (moduleData.courses as { id: string; title: string }[])[0]?.title || ''
        },
        topics: topicsWithTasks
      })
    } catch (error) {
      console.error('Error fetching module:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopic.title.trim()) return

    try {
      const nextPosition = (module?.topics.length || 0) + 1

      // Create topic
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert({
          module_id: moduleId,
          title: newTopic.title,
          content: newTopic.content || '',
          youtube_links: newTopic.youtubeLinks,
          position: nextPosition
        })
        .select()
        .single()

      if (topicError) throw topicError

      // Create task if instructions provided
      let taskData = null
      if (newTopic.taskInstructions.trim()) {
        const { data, error: taskError } = await supabase
          .from('tasks')
          .insert({
            topic_id: topicData.id,
            instructions: newTopic.taskInstructions
          })
          .select()
          .single()

        if (taskError) throw taskError
        taskData = data
      }

      // Update local state
      setModule(prev => prev ? {
        ...prev,
        topics: [...prev.topics, {
          ...topicData,
          task: taskData
        }]
      } : null)

      // Reset form
      setNewTopic({
        title: '',
        content: '',
        taskInstructions: '',
        youtubeLinks: []
      })
      setShowAddTopic(false)

    } catch (error) {
      console.error('Error adding topic:', error)
    }
  }

  const handleUpdateTopic = async (topicId: string, updates: { title?: string; content?: string; taskInstructions?: string; youtubeLinks?: string[] }) => {
    try {
      // Update topic
      const { error: topicError } = await supabase
        .from('topics')
        .update({
          title: updates.title,
          content: updates.content,
          youtube_links: updates.youtubeLinks
        })
        .eq('id', topicId)

      if (topicError) throw topicError

      // Update task if exists
      const topic = module?.topics.find(t => t.id === topicId)
      if (topic?.task && updates.taskInstructions !== undefined) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            instructions: updates.taskInstructions
          })
          .eq('id', topic.task.id)

        if (taskError) throw taskError
      } else if (!topic?.task && updates.taskInstructions?.trim()) {
        // Create new task
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            topic_id: topicId,
            instructions: updates.taskInstructions
          })
          .select()
          .single()

        if (taskError) throw taskError
      }

      // Refresh data
      fetchModuleWithTopics()
      setEditingTopic(null)

    } catch (error) {
      console.error('Error updating topic:', error)
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return

    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error

      setModule(prev => prev ? {
        ...prev,
        topics: prev.topics.filter(t => t.id !== topicId)
      } : null)

    } catch (error) {
      console.error('Error deleting topic:', error)
    }
  }

  // Role gating handled by ProtectedRoute wrapper above

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!module) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Module not found</h3>
          <Link href={`/dashboard/admin/courses/${id}`} className="text-indigo-600 hover:text-indigo-500">
            ← Back to course
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/admin/courses" className="hover:text-gray-700">
              Courses
            </Link>
            <span>›</span>
            <Link href={`/dashboard/admin/courses/${id}`} className="hover:text-gray-700">
              {module.course.title}
            </Link>
            <span>›</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
        </div>

        {/* Topics */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Topics</h2>
              <button
                onClick={() => setShowAddTopic(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Topic
              </button>
            </div>

            {/* Add Topic Form */}
            {showAddTopic && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <form onSubmit={handleAddTopic}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic Title *
                      </label>
                      <input
                        type="text"
                        value={newTopic.title}
                        onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <RichTextEditor
                        content={newTopic.content}
                        onChange={(content) => setNewTopic(prev => ({ ...prev, content }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Instructions (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={newTopic.taskInstructions}
                        onChange={(e) => setNewTopic(prev => ({ ...prev, taskInstructions: e.target.value }))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter assignment instructions..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Resources (Optional)
                      </label>
                      <YouTubeVideoManager
                        videoLinks={newTopic.youtubeLinks}
                        onUpdate={(links) => setNewTopic(prev => ({ ...prev, youtubeLinks: links }))}
                        isEditing={true}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTopic(false)
                        setNewTopic({ title: '', content: '', taskInstructions: '', youtubeLinks: [] })
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                    >
                      Add Topic
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Topics List */}
            {module.topics.length > 0 ? (
              <div className="space-y-4">
                {module.topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                    {editingTopic === topic.id ? (
                      <TopicEditForm
                        topic={topic}
                        onSave={(updates) => handleUpdateTopic(topic.id, updates)}
                        onCancel={() => setEditingTopic(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {index + 1}. {topic.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingTopic(topic.id)}
                              className="text-indigo-600 hover:text-indigo-500 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTopic(topic.id)}
                              className="text-red-600 hover:text-red-500 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {topic.content && (
                          <div
                            className="prose prose-sm max-w-none mb-3"
                            dangerouslySetInnerHTML={{ __html: topic.content }}
                          />
                        )}

                        {topic.youtube_links && topic.youtube_links.length > 0 && (
                          <div className="mb-4">
                            <YouTubeVideoManager
                              videoLinks={topic.youtube_links}
                              onUpdate={() => {}} // Read-only for display
                              isEditing={false}
                            />
                          </div>
                        )}

                        {topic.task && (
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-blue-900 mb-1">Assignment:</p>
                            <p className="text-sm text-blue-800">{topic.task.instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
                <p className="text-gray-500">Add your first topic to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Topic Edit Form Component
function TopicEditForm({ 
  topic, 
  onSave, 
  onCancel 
}: { 
  topic: TopicWithTask
  onSave: (updates: { title: string; content: string; taskInstructions: string; youtubeLinks: string[] }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(topic.title)
  const [content, setContent] = useState(topic.content || '')
  const [taskInstructions, setTaskInstructions] = useState(topic.task?.instructions || '')
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(topic.youtube_links || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ title, content, taskInstructions, youtubeLinks })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignment Instructions
          </label>
          <textarea
            rows={3}
            value={taskInstructions}
            onChange={(e) => setTaskInstructions(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter assignment instructions..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Resources (Optional)
          </label>
          <YouTubeVideoManager
            videoLinks={youtubeLinks}
            onUpdate={setYoutubeLinks}
            isEditing={true}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}

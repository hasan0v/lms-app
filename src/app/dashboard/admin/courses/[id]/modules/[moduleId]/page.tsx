'use client'

import DashboardLayout from '@/components/DashboardLayout'
import YouTubeVideoManager from '@/components/YouTubeVideoManager'
import { supabase, Module, Topic, Task } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [module, setModule] = useState<ModuleWithTopics | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: '',
    colab_link: '',
    youtubeLinks: [] as string[]
  })

  const fetchModuleWithTopics = useCallback(async () => {
    try {
      // Fetch module with course info and topics with tasks in parallel
      const [moduleRes, topicsRes] = await Promise.all([
        supabase
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
          .single(),
        supabase
          .from('topics')
          .select(`
            id,
            title,
            content,
            position,
            module_id,
            created_at,
            youtube_links,
            tasks(
              id,
              topic_id,
              instructions,
              created_at
            )
          `)
          .eq('module_id', moduleId)
          .order('position')
      ])

      if (moduleRes.error) throw moduleRes.error
      if (topicsRes.error) throw topicsRes.error

      const topicsWithTasks = topicsRes.data?.map(topic => ({
        id: topic.id,
        title: topic.title,
        content: topic.content,
        position: topic.position,
        module_id: topic.module_id,
        created_at: topic.created_at,
        youtube_links: topic.youtube_links,
        task: (topic as Topic & { tasks?: Task[] }).tasks?.[0] ? {
          id: (topic as Topic & { tasks?: Task[] }).tasks![0].id,
          topic_id: (topic as Topic & { tasks?: Task[] }).tasks![0].topic_id,
          instructions: (topic as Topic & { tasks?: Task[] }).tasks![0].instructions,
          created_at: (topic as Topic & { tasks?: Task[] }).tasks![0].created_at
        } : undefined
      })) || []

      setModule({
        id: moduleRes.data.id,
        title: moduleRes.data.title,
        position: moduleRes.data.position,
        course_id: moduleRes.data.course_id,
        created_at: moduleRes.data.created_at,
        course: {
          id: (moduleRes.data.courses as { id: string; title: string }[])[0]?.id || '',
          title: (moduleRes.data.courses as { id: string; title: string }[])[0]?.title || ''
        },
        topics: topicsWithTasks
      })
    } catch (error) {
      console.error('Error fetching module:', error)
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    fetchModuleWithTopics()
  }, [fetchModuleWithTopics])

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopic.title.trim()) return

    console.log('Attempting to add topic:', newTopic)

    try {
      const nextPosition = (module?.topics.length || 0) + 1

      // Create topic with colab_link instead of content
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert({
          module_id: moduleId,
          title: newTopic.title,
          content: newTopic.colab_link, // Store Colab link in content field
          position: nextPosition,
          youtube_links: newTopic.youtubeLinks
        })
        .select()
        .single()

      if (topicError) {
        console.error('Topic creation error:', topicError)
        throw topicError
      }

      console.log('Topic created successfully:', topicData)

      // Update local state
      setModule(prev => prev ? {
        ...prev,
        topics: [...prev.topics, {
          ...topicData,
          task: undefined // No tasks for now
        }]
      } : null)

      // Reset form
      setNewTopic({
        title: '',
        colab_link: '',
        youtubeLinks: []
      })
      setShowAddTopic(false)

      console.log('Topic added successfully to module')

    } catch (error) {
      console.error('Error adding topic:', error)
      showError('Add Topic Failed', 'Failed to add topic. Please check the console for details.')
    }
  }

  const handleUpdateTopic = async (topicId: string, updates: { title?: string; colab_link?: string; youtubeLinks?: string[] }) => {
    console.log('Attempting to update topic:', topicId, updates)
    
    try {
      // Update topic
      const { error: topicError } = await supabase
        .from('topics')
        .update({
          title: updates.title,
          content: updates.colab_link, // Store Colab link in content field
          youtube_links: updates.youtubeLinks
        })
        .eq('id', topicId)

      if (topicError) {
        console.error('Topic update error:', topicError)
        throw topicError
      }

      console.log('Topic updated successfully')

      // Refresh data
      fetchModuleWithTopics()
      setEditingTopic(null)

      console.log('Topic update completed successfully')

    } catch (error) {
      console.error('Error updating topic:', error)
      showError('Update Topic Failed', 'Failed to update topic. Please check the console for details.')
    }
  }

  const deleteTopic = async (topicId: string) => {
    showConfirm({
      title: 'Delete Topic',
      message: 'Are you sure you want to delete this topic? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
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

          showSuccess('Topic Deleted', 'Topic has been deleted successfully.')
        } catch (error) {
          console.error('Error deleting topic:', error)
          showError('Delete Failed', 'Failed to delete topic. Please try again.')
        }
      }
    })
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
                        className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Colab Link *
                      </label>
                      <input
                        type="url"
                        value={newTopic.colab_link}
                        onChange={(e) => setNewTopic(prev => ({ ...prev, colab_link: e.target.value }))}
                        className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="https://colab.research.google.com/drive/..."
                        required
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
                        setNewTopic({ title: '', colab_link: '', youtubeLinks: [] })
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
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Google Colab Link:</p>
                            <a 
                              href={topic.content} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                            >
                              {topic.content}
                            </a>
                          </div>
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
  onSave: (updates: { title: string; colab_link: string; youtubeLinks: string[] }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(topic.title)
  const [colab_link, setColab_link] = useState(topic.content || '')
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(topic.youtube_links || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Edit form submitted manually via Save Changes button')
    onSave({ title, colab_link, youtubeLinks })
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
            className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Colab Link *
          </label>
          <input
            type="url"
            value={colab_link}
            onChange={(e) => setColab_link(e.target.value)}
            className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="https://colab.research.google.com/drive/..."
            required
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

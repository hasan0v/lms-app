'use client'

import { useState } from 'react'
import { useNotifications } from './ui/NotificationSystem'
import YouTubeVideoPlayer from './YouTubeVideoPlayer'

interface YouTubeVideoManagerProps {
  videoLinks: string[]
  onUpdate: (links: string[]) => void
  isEditing?: boolean
  className?: string
}

export default function YouTubeVideoManager({ 
  videoLinks, 
  onUpdate, 
  isEditing = false, 
  className = '' 
}: YouTubeVideoManagerProps) {
  const { showWarning } = useNotifications()
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return
    
    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+/
    if (!youtubeRegex.test(newVideoUrl)) {
      showWarning('Invalid URL', 'Please enter a valid YouTube URL')
      return
    }

    const updatedLinks = [...videoLinks, newVideoUrl.trim()]
    onUpdate(updatedLinks)
    setNewVideoUrl('')
    setShowAddForm(false)
  }

  const handleRemoveVideo = (index: number) => {
    const updatedLinks = videoLinks.filter((_, i) => i !== index)
    onUpdate(updatedLinks)
  }

  const handleMoveVideo = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === videoLinks.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newLinks = [...videoLinks]
    const [movedVideo] = newLinks.splice(index, 1)
    newLinks.splice(newIndex, 0, movedVideo)
    onUpdate(newLinks)
  }

  if (!isEditing && videoLinks.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(videoLinks.length > 0 || isEditing) && (
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-900">Video Resources</h4>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Add a YouTube video link"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Video
            </button>
          )}
        </div>
      )}

      {/* Add Video Form */}
      {isEditing && showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddVideo()
                  }
                }}
                aria-label="YouTube video URL"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewVideoUrl('')
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                aria-label="Cancel adding video"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddVideo}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                aria-label="Confirm add video"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {videoLinks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoLinks.map((videoUrl, index) => (
            <div key={index} className="relative group">
              {isEditing && (
                <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Move up */}
                  <button
                    onClick={() => handleMoveVideo(index, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                    type="button"
                    aria-label={`Move video ${index + 1} up`}
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  
                  {/* Move down */}
                  <button
                    onClick={() => handleMoveVideo(index, 'down')}
                    disabled={index === videoLinks.length - 1}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                    type="button"
                    aria-label={`Move video ${index + 1} down`}
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600"
                    title="Remove video"
                    type="button"
                    aria-label={`Remove video ${index + 1}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <YouTubeVideoPlayer
                videoUrl={videoUrl}
                title={`Video ${index + 1}`}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state for editing mode */}
      {isEditing && videoLinks.length === 0 && !showAddForm && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No videos added yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            Add your first video
          </button>
        </div>
      )}
    </div>
  )
}

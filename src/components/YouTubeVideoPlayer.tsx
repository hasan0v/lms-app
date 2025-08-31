'use client'

import { useState } from 'react'

interface YouTubeVideoPlayerProps {
  videoUrl: string
  title?: string
  className?: string
}

// Function to extract YouTube video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export default function YouTubeVideoPlayer({ videoUrl, title, className = '' }: YouTubeVideoPlayerProps) {
  const [hasError, setHasError] = useState(false)
  
  const videoId = getYouTubeVideoId(videoUrl)

  if (!videoId || hasError) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Invalid YouTube URL</p>
          {title && <p className="text-xs text-gray-400 mt-1">{title}</p>}
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=1&cc_load_policy=0&hl=en&autohide=0&theme=dark`

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        </div>
      )}
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title || 'YouTube Video'}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  )
}

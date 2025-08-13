import React from 'react'
import { useSignedUrl } from '@/hooks/useSignedUrl'

interface FileAttachmentLinkProps {
  bucket: string
  filePath: string | null
  fileName?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Component that generates signed URLs for file attachments and renders them as download links
 */
export default function FileAttachmentLink({ 
  bucket, 
  filePath, 
  fileName, 
  className = '',
  children 
}: FileAttachmentLinkProps) {
  const { signedUrl, loading, error } = useSignedUrl(bucket, filePath || '')

  if (!filePath) {
    return null
  }

  if (loading) {
    return (
      <span className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed ${className}`}>
        <span className="mr-2">⏳</span>
        Loading...
      </span>
    )
  }

  if (error || !signedUrl) {
    return (
      <span className={`inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 ${className}`}>
        <span className="mr-2">❌</span>
        Error loading file
      </span>
    )
  }

  const displayName = fileName || filePath.split('/').pop() || 'Download File'

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors ${className}`}
    >
      <span className="mr-2">📄</span>
      {children || displayName}
    </a>
  )
}

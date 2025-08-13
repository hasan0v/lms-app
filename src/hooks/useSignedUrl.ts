import { useState, useEffect } from 'react'
import { getSignedFileUrl } from '@/lib/storage'

/**
 * Hook to generate and manage signed URLs for private storage files
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file
 * @returns Object with signedUrl, loading state, and error
 */
export function useSignedUrl(bucket: string, filePath: string) {
  const [signedUrl, setSignedUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const generateSignedUrl = async () => {
      if (!bucket || !filePath) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const url = await getSignedFileUrl(bucket, filePath, 3600) // 1 hour expiry
        
        if (isMounted) {
          setSignedUrl(url)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate signed URL')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    generateSignedUrl()

    return () => {
      isMounted = false
    }
  }, [bucket, filePath])

  return { signedUrl, loading, error }
}

/**
 * Hook to generate multiple signed URLs for an array of file paths
 * @param bucket - Storage bucket name
 * @param filePaths - Array of file paths
 * @returns Object with signedUrls array, loading state, and error
 */
export function useMultipleSignedUrls(bucket: string, filePaths: string[]) {
  const [signedUrls, setSignedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const generateSignedUrls = async () => {
      if (!bucket || !filePaths || filePaths.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const urls = await Promise.all(
          filePaths.map(filePath => getSignedFileUrl(bucket, filePath, 3600))
        )
        
        if (isMounted) {
          setSignedUrls(urls)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate signed URLs')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    generateSignedUrls()

    return () => {
      isMounted = false
    }
  }, [bucket, filePaths])

  return { signedUrls, loading, error }
}

import { supabase } from './supabase'

export interface FileUploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Folder path in the bucket
 * @param fileName - Custom file name (optional)
 * @returns Promise<FileUploadResult>
 */
export async function uploadFile(
  file: File, 
  bucket: string, 
  folder: string, 
  fileName?: string,
  allowOverwrite: boolean = false
): Promise<FileUploadResult> {
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}_${randomSuffix}.${fileExtension}`
    
    const filePath = `${folder}/${finalFileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: allowOverwrite
      })

    if (error) {
      throw error
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    console.error('File upload error:', error)
    return {
      url: '',
      path: '',
      error: errorMessage
    }
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file in the bucket
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('File deletion error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('File deletion error:', error)
    return false
  }
}

/**
 * Upload profile image
 * @param file - Image file to upload
 * @param userId - User ID for folder organization
 * @returns Promise<FileUploadResult>
 */
export async function uploadProfileImage(file: File, userId: string): Promise<FileUploadResult> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return {
      url: '',
      path: '',
      error: 'File must be an image'
    }
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return {
      url: '',
      path: '',
      error: 'Image size must be less than 5MB'
    }
  }

  // Use fixed filename for profile image and allow overwrite
  const fileName = `profile.${file.name.split('.').pop()}`
  return uploadFile(file, 'profile-images', `users/${userId}`, fileName, true)
}

/**
 * Upload task submission file
 * @param file - File to upload
 * @param userId - Student ID
 * @param taskId - Task ID
 * @returns Promise<FileUploadResult>
 */
export async function uploadTaskFile(file: File, userId: string, taskId: string): Promise<FileUploadResult> {
  // Validate file size (50MB limit for task files)
  if (file.size > 50 * 1024 * 1024) {
    return {
      url: '',
      path: '',
      error: 'File size must be less than 50MB'
    }
  }

  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()
  const fileName = `${userId}_${taskId}_${timestamp}.${fileExtension}`

  return uploadFile(file, 'task-submissions', `submissions/${taskId}`, fileName)
}

/**
 * Get file URL from Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file
 * @param signedUrl - Whether to generate a signed URL for private buckets
 * @returns Public URL string or Promise<string> for signed URLs
 */
export function getFileUrl(bucket: string, filePath: string): string {
  // For public buckets, use public URL
  if (bucket === 'profile-images') {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
  
  // For private buckets, we need to use the signed URL approach
  // This function will return a placeholder - use getSignedFileUrl for private buckets
  return ''
}

/**
 * Get signed URL for private storage files (task-submissions)
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise<string> - Signed URL
 */
export async function getSignedFileUrl(bucket: string, filePath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return ''
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return ''
  }
}

/**
 * Check if storage buckets exist - buckets should be created via database migrations
 * This function verifies buckets exist without attempting to create them
 */
export async function ensureStorageBuckets(): Promise<void> {
  try {
    // Just verify buckets exist - they should be created via migrations
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Error listing buckets:', error)
      return
    }

    const existingBuckets = buckets.map(bucket => bucket.name)
    const requiredBuckets = ['profile-images', 'task-submissions']
    
    for (const bucketName of requiredBuckets) {
      if (existingBuckets.includes(bucketName)) {
        console.log(`Storage bucket exists: ${bucketName}`)
      } else {
        console.warn(`Storage bucket missing: ${bucketName} - should be created via migrations`)
      }
    }
  } catch (error) {
    console.error('Error checking storage buckets:', error)
  }
}

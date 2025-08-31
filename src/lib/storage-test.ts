// Test file to verify Supabase Storage integration
// Run this in your browser console after authentication to test storage functionality

import { supabase } from '@/lib/supabase'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { uploadProfileImage, uploadTaskFile, ensureStorageBuckets } from '@/lib/storage'

export async function testStorageIntegration() {
  console.log('🧪 Testing Supabase Storage Integration...')
  
  try {
    // Test 1: Check if buckets exist
    console.log('1. Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }
    
    const bucketNames = buckets.map(b => b.name)
    console.log('📦 Available buckets:', bucketNames)
    
    const requiredBuckets = ['profile-images', 'task-submissions']
    const missingBuckets = requiredBuckets.filter(bucket => !bucketNames.includes(bucket))
    
    if (missingBuckets.length > 0) {
      console.log('⚠️ Missing buckets:', missingBuckets)
      console.log('🔧 Attempting to create missing buckets...')
      await ensureStorageBuckets()
    } else {
      console.log('✅ All required buckets exist')
    }
    
    // Test 2: Check authentication
    console.log('2. Checking authentication...')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ User not authenticated. Please log in first.')
      return
    }
    
    console.log('✅ User authenticated:', user.email)
    
    // Test 3: Test profile images bucket access
    console.log('3. Testing profile images bucket access...')
    try {
      const { data: profileFiles, error: profileError } = await supabase.storage
        .from('profile-images')
        .list(`users/${user.id}`)
        
      if (profileError && !profileError.message.includes('not found')) {
        console.error('❌ Profile images bucket access error:', profileError)
      } else {
        console.log('✅ Profile images bucket accessible')
        console.log('📁 User profile files:', profileFiles?.length || 0)
      }
    } catch (error) {
      console.error('❌ Profile bucket test failed:', error)
    }
    
    // Test 4: Test task submissions bucket access
    console.log('4. Testing task submissions bucket access...')
    try {
      const { data: taskFiles, error: taskError } = await supabase.storage
        .from('task-submissions')
        .list('submissions')
        
      if (taskError && !taskError.message.includes('not found')) {
        console.error('❌ Task submissions bucket access error:', taskError)
      } else {
        console.log('✅ Task submissions bucket accessible')
        console.log('📁 Submission folders:', taskFiles?.length || 0)
      }
    } catch (error) {
      console.error('❌ Task submissions bucket test failed:', error)
    }
    
    console.log('✅ Storage integration test completed!')
    console.log('💡 If you see any errors, check the DATABASE_MIGRATION.md file for setup instructions.')
    
  } catch (error) {
    console.error('❌ Storage integration test failed:', error)
  }
}

// Helper function to test file upload (for development only)
export async function testFileUpload() {
  console.log('🧪 Testing file upload functionality...')
  
  // Create a test blob (small text file)
  const testContent = 'This is a test file for storage integration'
  const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('❌ Please log in first')
    return
  }
  
  try {
    // Test uploading a fake task file
    const result = await uploadTaskFile(testFile, user.id, 'test-task-id')
    
    if (result.error) {
      console.error('❌ Upload failed:', result.error)
    } else {
      console.log('✅ Test upload successful!')
      console.log('📁 File URL:', result.url)
      console.log('📍 File Path:', result.path)
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('task-submissions')
        .remove([result.path])
        
      if (deleteError) {
        console.warn('⚠️ Could not clean up test file:', deleteError)
      } else {
        console.log('🧹 Test file cleaned up')
      }
    }
  } catch (error) {
    console.error('❌ Upload test failed:', error)
  }
}

// Run basic test automatically in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only run if explicitly called
  // testStorageIntegration()
}

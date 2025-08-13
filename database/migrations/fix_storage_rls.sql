-- Quick Fix for Storage RLS Policy Violations
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Step 1: Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload task submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage task submissions" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "temp_allow_all_storage" ON storage.objects;

-- Step 3: Apply simplified, working policies
-- Profile Images - Allow all authenticated users to manage their files
CREATE POLICY "Authenticated users can manage profile images" ON storage.objects
FOR ALL USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Task Submissions - Allow all authenticated users to manage their files
CREATE POLICY "Authenticated users can manage task submissions" ON storage.objects
FOR ALL USING (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
);

-- Public access for profile images (since bucket is public)
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Step 4: Verify the policies were created
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Step 5: Test your authentication (should return your user ID and 'authenticated')
SELECT auth.uid() as user_id, auth.role() as role;

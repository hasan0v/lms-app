# Database Migration Instructions

## Setting Up Supabase Storage for Profile Images and Task Files

This guide will help you set up Supabase Storage integration for handling profile images and task file submissions.

### Step 1: Database Schema Updates

Run the following SQL in your Supabase Dashboard > SQL Editor:

```sql
-- Update submissions table to add file_path column for Supabase Storage
-- Add bio and phone_number columns to user_profiles table

-- Add file_path column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add graded_at column to submissions if it doesn't exist
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE;

-- Add comments to describe the columns
COMMENT ON COLUMN submissions.file_path IS 'Storage path for the uploaded file in Supabase Storage';
COMMENT ON COLUMN submissions.graded_at IS 'Timestamp when the submission was graded';
COMMENT ON COLUMN user_profiles.phone_number IS 'User phone number (optional)';
COMMENT ON COLUMN user_profiles.bio IS 'User biography/description (optional, max 500 characters)';
```

### Step 2: Create Storage Buckets

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Create two buckets:

#### Bucket 1: `profile-images` (Public)
- Name: `profile-images`
- Public: ✅ **Enabled**
- File size limit: 5MB
- Allowed MIME types: `image/*`

#### Bucket 2: `task-submissions` (Private)  
- Name: `task-submissions`
- Public: ❌ **Disabled**
- File size limit: 50MB
- Allowed MIME types: All file types

### Step 3: Storage Policies (RLS)

**IMPORTANT:** You need to enable RLS on the storage.objects table first, then add the policies.

Run the following SQL to set up Row Level Security policies for the storage buckets:

```sql
-- First, ensure RLS is enabled on storage.objects (this might already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload task submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all task submissions" ON storage.objects;

-- Profile Images Bucket Policies (Public bucket)
-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Allow everyone to view profile images (since it's a public bucket)
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-images'
);

-- Task Submissions Bucket Policies (Private bucket)
-- Allow authenticated users to upload task submissions
CREATE POLICY "Users can upload task submissions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
);

-- Allow users to view their own submissions and admins to view all
CREATE POLICY "Users can view accessible submissions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-submissions' AND
  (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  )
);

-- Allow users to update their own submissions (for resubmission)
CREATE POLICY "Users can update their own submissions" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own submissions (for resubmission)
CREATE POLICY "Users can delete their own submissions" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-submissions' AND
  auth.role() = 'authenticated'
);
```

### Step 3.1: Alternative Simplified Policies (If the above doesn't work)

If you're still getting RLS errors, try these more permissive policies first:

```sql
-- Remove all existing policies
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload task submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON storage.objects;

-- Simplified policies for testing
-- Profile Images - Allow all authenticated users
CREATE POLICY "Authenticated users can manage profile images" ON storage.objects
FOR ALL USING (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

-- Task Submissions - Allow all authenticated users
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
```

### Step 4: Test the Integration

After completing the above steps:

1. **Profile Images:**
   - Go to `/dashboard/profile`
   - Click the camera icon to upload a profile picture
   - Images will be stored in `profile-images/users/{userId}/profile.{ext}`

2. **Task Submissions:**
   - Go to any course with assignments
   - Upload files for task submissions
   - Files will be stored in `task-submissions/submissions/{taskId}/{filename}`

3. **Admin Grading:**
   - Go to `/dashboard/grading` (admin only)
   - View submitted files with preview for images
   - Download submitted files directly

### Features Included

✅ **Profile Image Upload:**
- 5MB file size limit
- Image format validation
- Automatic file replacement
- Public access for display

✅ **Task File Submissions:**
- 50MB file size limit
- All file types supported
- Private storage with RLS
- Download links for admins

✅ **File Management:**
- Automatic file cleanup
- Unique file naming
- Error handling
- Progress indicators

✅ **Security:**
- Row Level Security (RLS) policies
- User-specific access control
- Admin privilege verification
- Secure file paths

### Troubleshooting

**Storage Buckets Not Found:**

- Ensure both buckets are created in Supabase Dashboard
- Check bucket names match exactly: `profile-images` and `task-submissions`

**Upload Errors / RLS Policy Violations:**

If you're getting "StorageApiError: new row violates row-level security policy", follow these steps:

1. **Check if RLS is enabled on storage.objects:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

2. **Verify your authentication:**
   - Make sure you're logged in
   - Check that `auth.uid()` returns your user ID
   - Run this query to test: `SELECT auth.uid(), auth.role();`

3. **Check existing policies:**
   ```sql
   SELECT policyname, tablename, cmd, qual, with_check 
   FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

4. **Test with simplified policies first:**
   - Use the "Alternative Simplified Policies" from Step 3.1 above
   - Once upload works, you can tighten the security

5. **Verify bucket settings:**
   - Go to Supabase Dashboard > Storage
   - Check that `profile-images` is set to **Public**
   - Check that `task-submissions` is set to **Private**

6. **Clear and recreate policies:**
   ```sql
   -- Remove ALL storage policies
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

   -- Then apply the simplified policies from Step 3.1
   ```

**Still Having Issues?**

Try this minimal policy to test uploads:

```sql
-- TEMPORARY: Very permissive policy for testing (NOT for production)
CREATE POLICY "temp_allow_all_storage" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

Once uploads work with this policy, you can remove it and apply the proper policies from Step 3.

**Permission Denied:**

- Run the storage policy SQL commands
- Verify user roles in `user_profiles` table
- Check bucket public/private settings

### File Structure

```
supabase-storage/
├── profile-images/ (public)
│   └── users/
│       └── {userId}/
│           └── profile.{ext}
└── task-submissions/ (private)
    └── submissions/
        └── {taskId}/
            └── {userId}_{taskId}_{timestamp}.{ext}
```

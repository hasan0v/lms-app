-- Update submissions table to add file_path column for Supabase Storage
-- Add bio and phone_number columns to user_profiles table
-- Run this in your Supabase SQL Editor

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

-- Create storage buckets (these commands need to be run by an admin or via the dashboard)
-- You can create these in the Supabase Dashboard under Storage
-- 1. profile-images (public bucket)
-- 2. task-submissions (private bucket)

-- Add YouTube links support to topics table
-- This migration adds support for storing multiple YouTube video URLs for each topic

-- Check if column exists and add it if it doesn't
DO $$ 
BEGIN
    -- Add youtube_links column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' 
        AND column_name = 'youtube_links'
    ) THEN
        ALTER TABLE topics ADD COLUMN youtube_links text[];
    END IF;
END $$;

-- Update RLS policy to allow reading youtube_links
CREATE OR REPLACE POLICY "Allow authenticated users to view topics"
ON topics FOR SELECT
TO authenticated
USING (true);

-- Update RLS policy for updating topics to include youtube_links
CREATE OR REPLACE POLICY "Allow admin users to update topics"
ON topics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Update RLS policy for inserting topics to include youtube_links
CREATE OR REPLACE POLICY "Allow admin users to insert topics"
ON topics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

COMMENT ON COLUMN topics.youtube_links IS 'Array of YouTube video URLs for the topic';

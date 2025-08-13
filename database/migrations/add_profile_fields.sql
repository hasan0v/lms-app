-- Add bio and phone_number columns to user_profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN user_profiles.phone_number IS 'User phone number (optional)';
COMMENT ON COLUMN user_profiles.bio IS 'User biography/description (optional, max 500 characters)';

-- Update RLS policies if needed (they should already allow users to update their own profiles)
-- The existing policies should cover these new columns automatically

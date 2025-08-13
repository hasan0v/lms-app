# Chat Profile Visibility Fix

## Problem
Users were unable to see admin names and profile images in the chat system. The chat would only show "Unknown User" for admin messages when viewed by students.

## Root Cause
The issue was caused by overly restrictive Row Level Security (RLS) policies on the `user_profiles` table. The previous policy only allowed:

1. Users to view their own profile (`auth.uid() = id`)
2. Admins to view all profiles (`is_admin()`)

This meant that regular users (students) could not see admin profiles in the chat, causing profile information to be unavailable.

## Solution Applied
Updated the RLS policy for the `user_profiles` table to allow all authenticated users to view all profiles:

```sql
-- Dropped the restrictive policy
DROP POLICY IF EXISTS "Users and admins can view profiles" ON user_profiles;

-- Created new policy allowing all authenticated users to view profiles
CREATE POLICY "All authenticated users can view profiles" ON user_profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');
```

## Security Considerations
- **Write Protection**: Insert/Update policies remain unchanged - users can only modify their own profiles
- **Read Access**: All authenticated users can now view all profiles, which is necessary for chat functionality
- **Anonymous Access**: Anonymous users still cannot access any profile data
- **Principle**: This follows the common chat application pattern where participants need to see each other's basic profile information

## Testing Results
After applying the fix:

✅ **Chat Messages**: Both admin and student profiles now display correctly in chat messages
✅ **Online Users**: All user profiles are visible in the online users list  
✅ **Profile Join**: The LEFT JOIN between `chat_messages` and `user_profiles` works correctly
✅ **Bidirectional**: Both students can see admin profiles and admins can see student profiles

## Database State After Fix
- **Admin User**: Ali Hasanov (role: admin) - Profile visible to all authenticated users
- **Student User**: Ali H (role: student) - Profile visible to all authenticated users
- **Chat Messages**: Both admin and student messages display with proper profile information

## Files Modified
- Database: Applied migration `fix_user_profiles_chat_visibility`
- No application code changes were needed

## Final Policy Structure
```sql
-- Current RLS policies on user_profiles table:
1. "All authenticated users can view profiles" (SELECT) - NEW
2. "Users can insert own profile" (INSERT) - Existing  
3. "Users can update own profile" (UPDATE) - Existing
```

This fix ensures that the chat system works as expected while maintaining appropriate security boundaries.

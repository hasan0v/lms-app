# Chat System Implementation

## Overview
The chat system provides real-time messaging functionality for all users in the LMS. It includes:
- Real-time messaging with live updates
- User presence indicators (online/offline status)
- Modern, responsive UI design
- Profile image support with fallback initials
- Message timestamps and status indicators

## Features

### 1. Real-time Messaging
- **Live Updates**: Messages appear instantly using Supabase real-time subscriptions
- **Auto-scroll**: Automatically scrolls to newest messages
- **Message Status**: Shows sending status and timestamps
- **Multi-line Support**: Support for longer messages with auto-resizing textarea

### 2. User Presence System
- **Online Status**: Shows who's currently active (within last 5 minutes)
- **Last Seen**: Displays when users were last active
- **Auto-presence**: Updates user presence every 30 seconds
- **Online Counter**: Shows total number of online users

### 3. User Interface
- **Modern Design**: Gradient backgrounds, rounded corners, smooth animations
- **Responsive Layout**: Works on desktop and mobile devices
- **Profile Images**: Shows user avatars with fallback to initials
- **Visual Indicators**: Online status dots, message bubbles, typing indicators

### 4. Security & Permissions
- **Row Level Security**: Users can only insert their own messages
- **Authentication Required**: Must be logged in to access chat
- **Profile Integration**: Uses existing user profile system

## Database Schema

### New Tables

#### `chat_messages`
```sql
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Modified Tables

#### `user_profiles` (added column)
```sql
ALTER TABLE user_profiles 
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### Indexes
- `idx_chat_messages_created_at`: For efficient message ordering
- `idx_chat_messages_user_id`: For user-specific queries
- `idx_user_profiles_last_seen`: For online user queries

## Component Structure

### Main Chat Component (`/dashboard/chat/page.tsx`)
- **Message Display**: Shows conversation history with user avatars
- **Message Input**: Auto-resizing textarea with send button
- **Online Users Sidebar**: Shows currently active users
- **Real-time Updates**: Subscribes to message and presence changes

### Key Functions
- `fetchMessages()`: Loads chat history with user profiles
- `fetchOnlineUsers()`: Gets list of recently active users
- `sendMessage()`: Sends new message to chat
- `updateUserPresence()`: Updates user's last seen timestamp

## Real-time Features

### Supabase Subscriptions
1. **Message Subscription**: Listens for new chat messages
2. **Presence Subscription**: Listens for user profile updates
3. **Auto-refresh**: Automatically updates UI when changes occur

### Presence System
- Updates user's `last_seen` timestamp every 30 seconds
- Shows users as "online" if active within last 5 minutes
- Displays relative time for last activity

## UI/UX Features

### Message Display
- **Bubble Layout**: Messages appear as chat bubbles
- **User Grouping**: Consecutive messages from same user are grouped
- **Timestamp**: Shows relative time for each message
- **Avatar Display**: Shows user profile image or initials

### Modern Styling
- **Gradient Backgrounds**: Blue to indigo gradients for primary actions
- **Smooth Animations**: Framer Motion animations for messages
- **Responsive Design**: Adapts to different screen sizes
- **Visual Feedback**: Loading states, hover effects, focus states

### Accessibility
- **Keyboard Navigation**: Enter to send, Shift+Enter for new line
- **Screen Reader Support**: Proper ARIA labels and alt text
- **Focus Management**: Clear focus indicators
- **Color Contrast**: Meets accessibility standards

## Installation & Setup

### 1. Database Migration
Run the migration file to create necessary tables:
```bash
# Apply the migration in Supabase Dashboard SQL Editor
# File: database/migrations/add_chat_system.sql
```

### 2. Dependencies
The chat system uses existing dependencies:
- `framer-motion`: For smooth animations
- `@supabase/supabase-js`: For real-time functionality
- `react`: Core React hooks

### 3. Navigation
Chat link is automatically added to the main navigation menu.

## Usage

### For Users
1. Click "Chat" in the sidebar navigation
2. View conversation history and online users
3. Type message in the input field
4. Press Enter to send (Shift+Enter for new line)
5. See real-time updates from other users

### For Administrators
- Same functionality as regular users
- No additional admin-specific chat features
- All users have equal chat permissions

## Performance Considerations

### Optimizations
- **Message Limit**: Loads only last 100 messages initially
- **Efficient Queries**: Indexed database queries for fast loading
- **Real-time Only**: Uses subscriptions instead of polling
- **Image Optimization**: Could be enhanced with Next.js Image component

### Scalability
- **Database Indexes**: Optimized for large message volumes
- **RLS Policies**: Secure and efficient data access
- **Presence Cleanup**: Automatic online status management

## Future Enhancements

### Potential Features
1. **Direct Messages**: Private messaging between users
2. **File Sharing**: Upload and share files in chat
3. **Emoji Reactions**: React to messages with emojis
4. **Message Search**: Search through chat history
5. **Typing Indicators**: Show when someone is typing
6. **Message Editing**: Edit sent messages
7. **Thread Replies**: Reply to specific messages
8. **Chat Rooms**: Separate chat rooms for different courses
9. **Message Notifications**: Push notifications for new messages
10. **Message Formatting**: Rich text formatting options

### Technical Improvements
1. **Virtual Scrolling**: For very large chat histories
2. **Image Optimization**: Use Next.js Image component
3. **Offline Support**: Queue messages when offline
4. **Message Persistence**: Local storage for better UX
5. **Performance Monitoring**: Track chat performance metrics

## Troubleshooting

### Common Issues
1. **Messages not appearing**: Check Supabase real-time connection
2. **Users not showing online**: Verify presence update interval
3. **Profile images not loading**: Check image URLs and CORS settings
4. **Permission errors**: Verify RLS policies are correctly applied

### Debug Tips
- Check browser console for error messages
- Verify database connections in Supabase dashboard
- Test real-time subscriptions manually
- Check user authentication status

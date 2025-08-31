-- Database Performance Optimization Migration
-- Add indexes for frequently queried columns to improve performance

-- User Profiles table optimization
-- Index for looking up profiles by user ID (most common query)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Index for role-based queries (e.g., finding all admins)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Composite index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;

-- Tasks table optimization
-- Index for topic-based task queries
CREATE INDEX IF NOT EXISTS idx_tasks_topic_id ON tasks(topic_id);

-- Index for published tasks only (common query)
CREATE INDEX IF NOT EXISTS idx_tasks_published ON tasks(is_published) WHERE is_published = true;

-- Index for tasks by creator
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Composite index for task ordering by creation date
CREATE INDEX IF NOT EXISTS idx_tasks_topic_created ON tasks(topic_id, created_at);

-- Submissions table optimization
-- Index for student submissions lookup
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);

-- Index for task submissions lookup
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);

-- Composite index for student task submissions (prevents duplicate submissions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_student_task ON submissions(student_id, task_id);

-- Index for grading queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Index for submissions by date
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- Chat Messages table optimization (if exists)
-- Index for user messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Index for message ordering by date
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Courses table optimization
-- Index for course author queries
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON courses(author_id);

-- Index for course ordering
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Modules table optimization
-- Index for course modules
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

-- Composite index for module ordering within courses
CREATE INDEX IF NOT EXISTS idx_modules_course_position ON modules(course_id, position);

-- Topics table optimization
-- Index for module topics
CREATE INDEX IF NOT EXISTS idx_topics_module_id ON topics(module_id);

-- Composite index for topic ordering within modules
CREATE INDEX IF NOT EXISTS idx_topics_module_position ON topics(module_id, position);

-- Performance improvements for RLS (Row Level Security)
-- Ensure RLS policies are optimized for indexed columns

-- Add explain analyze examples for common queries:
/*
-- Example 1: Check user profile lookup performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_profiles WHERE id = 'user-uuid';

-- Example 2: Check tasks by topic performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM tasks WHERE topic_id = 'topic-uuid' AND is_published = true ORDER BY created_at;

-- Example 3: Check student submissions performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM submissions WHERE student_id = 'student-uuid' ORDER BY submitted_at DESC;

-- Example 4: Check chat messages performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT cm.*, up.full_name 
FROM chat_messages cm 
LEFT JOIN user_profiles up ON cm.user_id = up.id 
ORDER BY cm.created_at DESC LIMIT 50;
*/

-- Performance monitoring queries:
/*
-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
-- Performance indexes for chat and topics

-- Index chat_messages by created_at for faster ordering
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages (created_at DESC);

-- Index chat_messages by user_id
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages (user_id);

-- Index topics by module_id and position
CREATE INDEX IF NOT EXISTS topics_module_position_idx ON topics (module_id, position);

-- Index modules by course_id and position
CREATE INDEX IF NOT EXISTS modules_course_position_idx ON modules (course_id, position);

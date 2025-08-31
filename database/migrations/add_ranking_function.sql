-- Optimized PostgreSQL function for student rankings
-- This function calculates student rankings in a single query instead of N+1 queries

CREATE OR REPLACE FUNCTION get_student_rankings()
RETURNS TABLE(
  student_id UUID,
  full_name TEXT,
  total_points NUMERIC,
  total_submissions BIGINT,
  graded_submissions BIGINT,
  average_grade NUMERIC,
  completion_rate NUMERIC,
  last_submission TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    up.id as student_id,
    up.full_name,
    COALESCE(SUM(s.points), 0) as total_points,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as graded_submissions,
    CASE 
      WHEN COUNT(CASE WHEN s.status = 'graded' THEN 1 END) > 0 
      THEN ROUND(
        (COALESCE(SUM(s.points), 0) / 
         COALESCE(SUM(CASE WHEN s.status = 'graded' THEN t.max_score ELSE 0 END), 1)) * 100, 
        1
      )
      ELSE 0
    END as average_grade,
    CASE 
      WHEN COUNT(s.id) > 0 
      THEN ROUND((COUNT(CASE WHEN s.status = 'graded' THEN 1 END)::NUMERIC / COUNT(s.id)) * 100, 1)
      ELSE 0
    END as completion_rate,
    MAX(s.submitted_at) as last_submission
  FROM user_profiles up
  LEFT JOIN submissions s ON up.id = s.student_id
  LEFT JOIN tasks t ON s.task_id = t.id
  WHERE up.role = 'student'
  GROUP BY up.id, up.full_name
  ORDER BY total_points DESC, graded_submissions DESC, full_name;
$$;
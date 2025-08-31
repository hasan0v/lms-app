import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'graded', or null for all
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        id,
        student_id,
        task_id,
        file_url,
        file_path,
        submitted_at,
        graded_at,
        status,
        points,
        feedback,
        student:user_profiles!student_id (
          id,
          full_name,
          profile_image_url
        ),
        task:tasks (
          id,
          title,
          instructions,
          max_score,
          topic:topics (
            id,
            title,
            module:modules (
              id,
              title,
              course:courses (
                id,
                title
              )
            )
          )
        )
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    // Transform the nested data to handle arrays from Supabase
    const transformedSubmissions = (submissions || []).map(submission => {
      const student = Array.isArray(submission.student) 
        ? submission.student[0] 
        : submission.student

      const task = Array.isArray(submission.task) 
        ? submission.task[0] 
        : submission.task

      let topic = null
      if (task?.topic) {
        const topicData = Array.isArray(task.topic) ? task.topic[0] : task.topic
        if (topicData) {
          const moduleData = Array.isArray(topicData.module) 
            ? topicData.module[0] 
            : topicData.module
          const courseData = moduleData && Array.isArray(moduleData.course)
            ? moduleData.course[0]
            : moduleData?.course

          topic = {
            ...topicData,
            module: moduleData ? {
              ...moduleData,
              course: courseData
            } : null
          }
        }
      }

      return {
        ...submission,
        student,
        task: task ? { ...task, topic } : null
      }
    })

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq(status ? 'status' : 'id', status || 'id') // Use proper filter for count

    return NextResponse.json({
      data: transformedSubmissions,
      count: transformedSubmissions.length,
      total: count || 0
    })

  } catch (error) {
    console.error('Unexpected error in submissions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
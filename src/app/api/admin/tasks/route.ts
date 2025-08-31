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
    const includeSubmissionCounts = searchParams.get('include_counts') === 'true'

    // Optimized query to get tasks with nested relationships
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        id,
        title,
        description,
        content,
        instructions,
        topics,
        due_date,
        attachments,
        created_by,
        is_published,
        max_score,
        created_at,
        updated_at,
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
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Transform nested data to handle Supabase array responses
    const transformedTasks = (tasks || []).map(task => {
      const topic = Array.isArray(task.topic) ? task.topic[0] : task.topic
      let processedTopic = null

      if (topic) {
        const moduleData = Array.isArray(topic.module) ? topic.module[0] : topic.module
        const course = moduleData && Array.isArray(moduleData.course) 
          ? moduleData.course[0] 
          : moduleData?.course

        processedTopic = {
          ...topic,
          module: moduleData ? {
            ...moduleData,
            course
          } : null
        }
      }

      return {
        ...task,
        topic: processedTopic
      }
    })

    // If submission counts are needed, fetch them separately
    if (includeSubmissionCounts) {
      const tasksWithCounts = await Promise.all(
        transformedTasks.map(async (task) => {
          const { count } = await supabaseAdmin
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
          
          return {
            ...task,
            _count: { submissions: count || 0 }
          }
        })
      )
      
      return NextResponse.json({
        data: tasksWithCounts,
        count: tasksWithCounts.length
      })
    }

    return NextResponse.json({
      data: transformedTasks,
      count: transformedTasks.length
    })

  } catch (error) {
    console.error('Unexpected error in tasks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
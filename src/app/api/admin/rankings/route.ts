import { NextResponse } from 'next/server'
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

interface RankingData {
  student_id: string
  full_name: string
  total_points: number
  total_submissions: number
  graded_submissions: number
  average_grade: number
  completion_rate: number
  last_submission: string | null
}

export async function GET() {
  try {
    // Use a single optimized query with PostgreSQL aggregation functions
    const { data: rankings, error } = await supabaseAdmin.rpc('get_student_rankings')

    if (error) {
      console.error('Error fetching rankings:', error)
      // Fallback to manual calculation if RPC function doesn't exist
      return fallbackRankingsCalculation()
    }

    // Calculate overall stats
    const stats = calculateRankingStats(rankings || [])

    return NextResponse.json({
      data: rankings || [],
      stats
    })

  } catch (error) {
    console.error('Unexpected error in rankings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fallbackRankingsCalculation() {
  try {
    // Optimized single query approach using JSON aggregation
    const { data: rankingData, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        full_name,
        submissions:submissions (
          id,
          points,
          status,
          submitted_at,
          task:tasks (
            id,
            max_score
          )
        )
      `)
      .eq('role', 'student')

    if (error) throw error

    // Process the data to calculate rankings
    const rankings: RankingData[] = (rankingData || []).map(student => {
      const submissions = student.submissions || []
      const gradedSubmissions = submissions.filter(s => s.status === 'graded')
      
      const totalPoints = gradedSubmissions.reduce((sum, sub) => {
        return sum + (sub.points || 0)
      }, 0)
      
      const totalPossiblePoints = gradedSubmissions.reduce((sum, sub) => {
        const task = Array.isArray(sub.task) ? sub.task[0] : sub.task
        return sum + (task?.max_score || 100)
      }, 0)
      
      const averageGrade = totalPossiblePoints > 0 
        ? (totalPoints / totalPossiblePoints) * 100 
        : 0
      
      const completionRate = submissions.length > 0 
        ? (gradedSubmissions.length / submissions.length) * 100 
        : 0

      const lastSubmission = submissions.length > 0 
        ? submissions.sort((a, b) => 
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          )[0]?.submitted_at
        : null

      return {
        student_id: student.id,
        full_name: student.full_name,
        total_points: totalPoints,
        total_submissions: submissions.length,
        graded_submissions: gradedSubmissions.length,
        average_grade: Math.round(averageGrade * 10) / 10,
        completion_rate: Math.round(completionRate * 10) / 10,
        last_submission: lastSubmission
      }
    })

    // Sort by total points descending
    rankings.sort((a, b) => b.total_points - a.total_points)

    const stats = calculateRankingStats(rankings)

    return NextResponse.json({
      data: rankings,
      stats
    })

  } catch (error) {
    console.error('Error in fallback rankings calculation:', error)
    return NextResponse.json(
      { error: 'Failed to calculate rankings' },
      { status: 500 }
    )
  }
}

function calculateRankingStats(rankings: RankingData[]) {
  if (rankings.length === 0) {
    return {
      totalActiveStudents: 0,
      averageClassGrade: 0,
      totalSubmissions: 0,
      completionRate: 0,
      topPerformer: 'N/A',
      mostImproved: 'N/A'
    }
  }

  const totalActiveStudents = rankings.filter(r => r.total_submissions > 0).length
  const averageClassGrade = rankings.reduce((sum, r) => sum + r.average_grade, 0) / rankings.length
  const totalSubmissions = rankings.reduce((sum, r) => sum + r.total_submissions, 0)
  const totalCompletionRate = rankings.reduce((sum, r) => sum + r.completion_rate, 0) / rankings.length
  
  const topPerformer = rankings.length > 0 ? rankings[0].full_name : 'N/A'
  
  // Most improved could be calculated based on recent vs older submissions
  // For now, we'll use the student with highest completion rate
  const mostImproved = rankings.length > 0 
    ? rankings.sort((a, b) => b.completion_rate - a.completion_rate)[0].full_name 
    : 'N/A'

  return {
    totalActiveStudents,
    averageClassGrade: Math.round(averageClassGrade * 10) / 10,
    totalSubmissions,
    completionRate: Math.round(totalCompletionRate * 10) / 10,
    topPerformer,
    mostImproved
  }
}
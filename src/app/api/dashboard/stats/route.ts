import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cache, generateCacheKey } from '@/lib/cache'

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  role?: string
  created_at: string
  updated_at: string
}

interface DashboardStats {
  profile: UserProfile | null
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalCourses: number
  recentMessages: number
  timestamp: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first for blazing fast performance
    const cacheKey = generateCacheKey('dashboard_stats', {})
    const cachedStats = cache.get<DashboardStats>(cacheKey)
    
    if (cachedStats) {
      return NextResponse.json({
        ...cachedStats,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch dashboard stats with optimized queries
    const [
      profileResponse,
      tasksResponse,
      coursesResponse,
      messagesResponse
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('tasks')
        .select('id, status')
        .eq('user_id', user.id),
      supabase
        .from('courses')
        .select('id, title'),
      supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const stats = {
      profile: profileResponse.data,
      totalTasks: tasksResponse.data?.length || 0,
      completedTasks: tasksResponse.data?.filter(t => t.status === 'completed').length || 0,
      pendingTasks: tasksResponse.data?.filter(t => t.status === 'pending').length || 0,
      totalCourses: coursesResponse.data?.length || 0,
      recentMessages: messagesResponse.data?.length || 0,
      timestamp: new Date().toISOString()
    }

    // Cache for 5 minutes
    cache.set(cacheKey, stats, 300000)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in /api/dashboard/stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest) {
  // Quick health check for dashboard stats
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse(null, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return new NextResponse(null, { status: 401 })
    }

    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
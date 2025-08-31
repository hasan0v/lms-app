import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cache, generateCacheKey } from '@/lib/cache'

// Create admin client for server-side operations
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Generate cache key for this request
    const cacheKey = generateCacheKey('chat_messages', { limit, offset })
    
    // Try to get from cache first
    const cachedMessages = cache.get(cacheKey) as { data: unknown[], count: number } | undefined
    if (cachedMessages) {
      return NextResponse.json({
        data: cachedMessages.data,
        count: cachedMessages.count,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    // Optimized query: Get messages with user profiles in a single query
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        user_profiles!inner (
          id,
          full_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const transformedMessages = (messages || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      user_id: msg.user_id,
      user_profiles: Array.isArray(msg.user_profiles) 
        ? msg.user_profiles[0] 
        : msg.user_profiles
    }))

    const responseData = {
      data: transformedMessages,
      count: transformedMessages.length
    }

    // Cache the result for 2 minutes (chat messages update frequently)
    cache.set(cacheKey, responseData, 2 * 60 * 1000)

    return NextResponse.json({
      ...responseData,
      cached: false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in messages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
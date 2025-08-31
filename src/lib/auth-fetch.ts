/**
 * 🚀 Blazing Fast Authenticated HTTP Client
 * Automatically handles authorization headers for Supabase API calls
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Enhanced fetch that automatically includes authentication headers
 */
export async function authenticatedFetch(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers = {}, ...otherOptions } = options

  // Get the current session token
  let authHeaders = {}
  if (requireAuth) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      authHeaders = {
        'Authorization': `Bearer ${session.access_token}`,
      }
    } catch (error) {
      console.error('[AuthFetch] Failed to get session:', error)
      throw new Error('Authentication required')
    }
  }

  // Merge headers
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...headers,
  }

  // Make the request
  return fetch(url, {
    ...otherOptions,
    headers: finalHeaders,
  })
}

/**
 * Authenticated GET request
 */
export async function authGet(url: string, options: Omit<RequestOptions, 'method'> = {}) {
  return authenticatedFetch(url, { ...options, method: 'GET' })
}

/**
 * Authenticated POST request
 */
export async function authPost(url: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Authenticated PUT request
 */
export async function authPut(url: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Authenticated DELETE request
 */
export async function authDelete(url: string, options: Omit<RequestOptions, 'method'> = {}) {
  return authenticatedFetch(url, { ...options, method: 'DELETE' })
}

/**
 * Get current user via API with proper authentication
 */
export async function getCurrentUser() {
  try {
    const response = await authGet('/api/auth/user')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[AuthFetch] Failed to get current user:', error)
    throw error
  }
}

/**
 * Get dashboard stats with proper authentication
 */
export async function getDashboardStats() {
  try {
    const response = await authGet('/api/dashboard/stats')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('[AuthFetch] Failed to get dashboard stats:', error)
    throw error
  }
}
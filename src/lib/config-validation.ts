import { supabase } from './supabase'

interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates Supabase configuration and connectivity
 */
export async function validateSupabaseConfig(): Promise<ConfigValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured or using placeholder value')
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder') {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured or using placeholder value')
  }

  // If basic config is missing, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings }
  }

  try {
    // Test database connectivity
    const { error: dbError } = await supabase.from('user_profiles').select('id').limit(1)
    if (dbError) {
      errors.push(`Database connectivity test failed: ${dbError.message}`)
    }

    // Test storage connectivity
    const { error: storageError } = await supabase.storage.listBuckets()
    if (storageError) {
      warnings.push(`Storage connectivity test failed: ${storageError.message}`)
    }

    // Test auth service
    const { error: authError } = await supabase.auth.getSession()
    if (authError) {
      warnings.push(`Auth service test failed: ${authError.message}`)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Supabase service test failed: ${errorMessage}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Health check endpoint data
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: { status: 'up' | 'down', responseTime?: number, error?: string }
    storage: { status: 'up' | 'down', responseTime?: number, error?: string }
    auth: { status: 'up' | 'down', responseTime?: number, error?: string }
  }
  environment: {
    nodeEnv: string
    configured: boolean
  }
}

/**
 * Performs comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'down' },
      storage: { status: 'down' },
      auth: { status: 'down' }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder'
      )
    }
  }

  if (!result.environment.configured) {
    result.status = 'unhealthy'
    return result
  }

  const services = ['database', 'storage', 'auth'] as const

  await Promise.allSettled([
    // Database check
    (async () => {
      const serviceStartTime = Date.now()
      try {
        const { error } = await supabase.from('user_profiles').select('id').limit(1)
        if (error) throw error
        result.services.database = {
          status: 'up',
          responseTime: Date.now() - serviceStartTime
        }
      } catch (error) {
        result.services.database = {
          status: 'down',
          responseTime: Date.now() - serviceStartTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })(),

    // Storage check
    (async () => {
      const serviceStartTime = Date.now()
      try {
        const { error } = await supabase.storage.listBuckets()
        if (error) throw error
        result.services.storage = {
          status: 'up',
          responseTime: Date.now() - serviceStartTime
        }
      } catch (error) {
        result.services.storage = {
          status: 'down',
          responseTime: Date.now() - serviceStartTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })(),

    // Auth check
    (async () => {
      const serviceStartTime = Date.now()
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        result.services.auth = {
          status: 'up',
          responseTime: Date.now() - serviceStartTime
        }
      } catch (error) {
        result.services.auth = {
          status: 'down',
          responseTime: Date.now() - serviceStartTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })()
  ])

  // Determine overall status
  const downServices = services.filter(service => result.services[service].status === 'down')
  
  if (downServices.length === 0) {
    result.status = 'healthy'
  } else if (downServices.length === services.length) {
    result.status = 'unhealthy'
  } else {
    result.status = 'degraded'
  }

  return result
}

/**
 * Runtime configuration validation for use in components
 */
export function validateRuntimeConfig(): { isValid: boolean; error?: string } {
  if (typeof window === 'undefined') {
    // Server-side validation
    return { isValid: true } // Assume valid on server
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return { 
      isValid: false, 
      error: 'Supabase URL not configured. Please check your environment variables.' 
    }
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder') {
    return { 
      isValid: false, 
      error: 'Supabase API key not configured. Please check your environment variables.' 
    }
  }

  return { isValid: true }
}
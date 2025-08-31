import { NextResponse } from 'next/server'
import { performHealthCheck } from '@/lib/config-validation'

export async function GET() {
  try {
    const healthCheck = await performHealthCheck()
    
    // Return appropriate HTTP status based on health
    const statusCode = healthCheck.status === 'healthy' ? 200 
                      : healthCheck.status === 'degraded' ? 200 
                      : 503

    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      services: {
        database: { status: 'down' },
        storage: { status: 'down' },
        auth: { status: 'down' }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        configured: false
      }
    }, { status: 503 })
  }
}
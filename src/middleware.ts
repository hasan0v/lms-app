import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Fix MIME types for JavaScript files in development
  if (pathname.includes('/_next/static/chunks/') && pathname.endsWith('.js')) {
    const response = NextResponse.next()
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8')
    return response
  }
  
  // Handle service worker requests
  if (pathname === '/sw.js') {
    const response = NextResponse.next()
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8')
    response.headers.set('Service-Worker-Allowed', '/')
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/_next/static/chunks/:path*',
    '/sw.js'
  ]
}
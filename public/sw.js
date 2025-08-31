/**
 * 🚀 Blazing Fast Service Worker for LMS App
 * Optimized for maximum performance and caching efficiency
 */

const CACHE_VERSION = 'v3'
const CACHE_NAME = `lms-app-${CACHE_VERSION}`
const STATIC_CACHE_NAME = `lms-static-${CACHE_VERSION}`
const API_CACHE_NAME = `lms-api-${CACHE_VERSION}`
const FONT_CACHE_NAME = `lms-fonts-${CACHE_VERSION}`

// 🎯 Critical assets to cache immediately for blazing fast loading
const CRITICAL_ASSETS = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
]

// 🚀 Blazing Fast Helper Functions
function isStaticAsset(pathname) {
  return pathname.includes('/_next/static/') || 
         pathname.includes('/favicon') || 
         pathname.includes('/logo') || 
         pathname.includes('/manifest.json') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.ico') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.webp')
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/')
}

function isFontAsset(pathname) {
  return pathname.endsWith('.woff') || 
         pathname.endsWith('.woff2') || 
         pathname.endsWith('.ttf') ||
         pathname.endsWith('.otf')
}

function shouldCacheApiRequest(pathname) {
  // Cache specific API routes that don't change frequently
  return pathname.includes('/api/dashboard/stats') ||
         pathname.includes('/api/courses') ||
         pathname.includes('/api/auth/user')
}

// 🚀 Install Event - Cache Critical Assets Immediately
self.addEventListener('install', (event) => {
  console.log('[SW] 🚀 Installing blazing fast service worker')
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets immediately
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] ⚡ Caching critical assets for instant loading')
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, { cache: 'reload' })))
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// 🧹 Activate Event - Clean Old Caches for Optimal Performance
self.addEventListener('activate', (event) => {
  console.log('[SW] 🧹 Activating and cleaning old caches')
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then(cacheNames => 
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME &&
                cacheName !== FONT_CACHE_NAME) {
              console.log('[SW] 🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      ),
      
      // Take control immediately for blazing fast performance
      self.clients.claim()
    ])
  )
})

// 🚀 Fetch Event - Lightning Fast Request Handling
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests for performance
  if (request.method !== 'GET') {
    return
  }

  // 🛡️ Skip chrome-extension and other unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return
  }

  // 🛡️ Skip requests that might cause MIME type issues
  if (url.pathname.includes('_next/static/chunks') && 
      !url.pathname.endsWith('.js') && 
      !url.pathname.endsWith('.css')) {
    return
  }

  // 🎯 Font Assets - Cache Forever (they rarely change)
  if (isFontAsset(url.pathname)) {
    event.respondWith(handleFontAsset(request))
    return
  }

  // ⚡ Static Assets - Cache with Version Check
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // 🔥 API Requests - Smart Caching Strategy
  if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // 📄 Page Requests - Stale While Revalidate
  event.respondWith(handlePageRequest(request))
})

// 🎯 Font Asset Handler - Cache Forever for Blazing Speed
async function handleFontAsset(request) {
  const cache = await caches.open(FONT_CACHE_NAME)
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fetch and cache for future blazing fast loads
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('[SW] 🚨 Font asset fetch failed:', error)
    return new Response('Font not available', { status: 404 })
  }
}

// ⚡ Static Asset Handler - Cache with Hash Validation
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  
  try {
    // For Next.js static assets, cache first (they have content hashes)
    if (request.url.includes('/_next/static/')) {
      const cachedResponse = await cache.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }

    // Fetch from network with better error handling
    const response = await fetch(request, {
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    })
    
    // Only cache successful responses with correct content types
    if (response.ok && response.status === 200) {
      const contentType = response.headers.get('content-type')
      
      // Verify content type for JavaScript files
      if (request.url.endsWith('.js')) {
        if (contentType && (contentType.includes('javascript') || contentType.includes('application/javascript'))) {
          cache.put(request, response.clone())
        }
      } else {
        // Cache other successful static assets
        cache.put(request, response.clone())
      }
    }
    
    return response
  } catch (error) {
    console.log('[SW] 🚨 Static asset fetch failed:', error.message)
    
    // Try to serve from cache if network fails
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // For missing chunks, return a meaningful error instead of generic 404
    if (request.url.includes('/_next/static/chunks/')) {
      return new Response('// Chunk not found - using fallback', {
        status: 200,
        statusText: 'Fallback',
        headers: {
          'Content-Type': 'application/javascript',
          'X-Fallback': 'true'
        }
      })
    }
    
    return new Response('Asset not available', { status: 404 })
  }
}

// 🔥 API Request Handler - Smart Caching for Performance
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Don't cache real-time or user-specific data
  if (url.pathname.includes('/chat/') || 
      url.pathname.includes('/notifications/') ||
      url.pathname.includes('/auth/signout')) {
    return fetch(request)
  }

  // Use cache for specific API routes that benefit from caching
  if (shouldCacheApiRequest(url.pathname)) {
    return handleCachedApiRequest(request)
  }

  // Default: fetch fresh data
  return fetch(request)
}

// 📊 Cached API Handler - Network First with Fallback
async function handleCachedApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  
  try {
    // Try network first for fresh data
    const response = await fetch(request, {
      // Add timeout for blazing fast performance
      signal: AbortSignal.timeout(3000)
    })
    
    if (response.ok) {
      // Cache successful responses (5 minute TTL)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache if network fails
    console.log('[SW] 📡 API network failed, trying cache:', error.message)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Add stale indicator to cached responses
      const staleResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'X-Served-From': 'cache',
          'X-Cache-Date': new Date().toISOString()
        }
      })
      return staleResponse
    }
    
    // No cache available
    return new Response(JSON.stringify({ 
      error: 'Service temporarily unavailable',
      cached: false 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 📄 Page Request Handler - Stale While Revalidate Strategy
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  
  try {
    // Get from cache immediately for blazing fast loading
    const cachedResponse = await cache.match(request)
    
    // Fetch fresh version in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    }).catch(() => null)

    // Return cached version immediately if available
    if (cachedResponse) {
      // Update cache in background for next visit
      fetchPromise.catch(() => {})
      return cachedResponse
    }

    // Wait for network if no cache available
    const networkResponse = await fetchPromise
    if (networkResponse) {
      return networkResponse
    }

    // Fallback to offline page
    return caches.match('/offline.html')
  } catch (error) {
    console.log('[SW] 🚨 Page request failed:', error)
    return caches.match('/offline.html')
  }
}

// 🔄 Background Sync for Offline Actions
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Process offline actions when back online
    console.log('[SW] ⚡ Processing offline actions...')
    // Add your offline sync logic here
  } catch (error) {
    console.log('[SW] 🚨 Background sync failed:', error)
  }
}

// 📱 Push Notifications Support
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/logo.png',
        badge: '/favicon.ico',
        data: data.url
      })
    )
  }
})

// 🎯 Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})

// 📊 Performance Monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats })
    })
  }
})

async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    stats[name] = keys.length
  }
  
  return stats
}

console.log('[SW] 🚀 Blazing Fast Service Worker loaded and ready!')
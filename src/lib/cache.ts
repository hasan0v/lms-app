/**
 * Enhanced Caching System for LMS Application
 * 
 * This module provides a multi-layered caching strategy:
 * 1. In-memory cache for frequently accessed data
 * 2. Browser cache for static resources
 * 3. API response caching with intelligent invalidation
 * 4. Database query result caching
 */

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of items in cache
}

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private config: CacheConfig

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config
    
    // Clean up expired items every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const actualTtl = ttl || this.config.ttl
    
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
      key
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      defaultTtl: this.config.ttl
    }
  }
}

// Global cache instances
export const userCache = new MemoryCache({ ttl: 10 * 60 * 1000, maxSize: 50 }) // 10 minutes for user data
export const courseCache = new MemoryCache({ ttl: 30 * 60 * 1000, maxSize: 100 }) // 30 minutes for course data
export const taskCache = new MemoryCache({ ttl: 15 * 60 * 1000, maxSize: 200 }) // 15 minutes for tasks
export const submissionCache = new MemoryCache({ ttl: 5 * 60 * 1000, maxSize: 500 }) // 5 minutes for submissions

// Default cache instance for general use
export const cache = new MemoryCache({ ttl: 5 * 60 * 1000, maxSize: 100 })

// Generate cache key utility
export const generateCacheKey = (prefix: string, params: Record<string, unknown> = {}): string => {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  
  return paramString ? `${prefix}:${paramString}` : prefix
}

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  course: (id: string) => `course:${id}`,
  coursesAll: () => 'courses:all',
  courseModules: (courseId: string) => `course:${courseId}:modules`,
  task: (id: string) => `task:${id}`,
  tasksForTopic: (topicId: string) => `tasks:topic:${topicId}`,
  submission: (id: string) => `submission:${id}`,
  submissionsForStudent: (studentId: string) => `submissions:student:${studentId}`,
  submissionsForTask: (taskId: string) => `submissions:task:${taskId}`,
  chatMessages: () => 'chat:messages:recent',
  adminStats: () => 'admin:stats',
  studentRankings: () => 'students:rankings'
}

// Cached data fetcher with automatic cache management
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: MemoryCache = userCache,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, data, ttl)
  
  return data
}

// Cache invalidation utilities
export const CacheInvalidation = {
  // Invalidate user-related caches
  invalidateUser: (userId: string) => {
    userCache.delete(CacheKeys.user(userId))
    userCache.delete(CacheKeys.userProfile(userId))
    submissionCache.invalidatePattern(`submissions:student:${userId}`)
    // Invalidate rankings when user data changes
    userCache.delete(CacheKeys.studentRankings())
  },

  // Invalidate course-related caches
  invalidateCourse: (courseId: string) => {
    courseCache.delete(CacheKeys.course(courseId))
    courseCache.delete(CacheKeys.coursesAll())
    courseCache.delete(CacheKeys.courseModules(courseId))
  },

  // Invalidate task-related caches
  invalidateTask: (taskId: string, topicId?: string) => {
    taskCache.delete(CacheKeys.task(taskId))
    if (topicId) {
      taskCache.delete(CacheKeys.tasksForTopic(topicId))
    }
    submissionCache.invalidatePattern(`submissions:task:${taskId}`)
  },

  // Invalidate submission-related caches
  invalidateSubmission: (submissionId: string, studentId?: string, taskId?: string) => {
    submissionCache.delete(CacheKeys.submission(submissionId))
    if (studentId) {
      submissionCache.delete(CacheKeys.submissionsForStudent(studentId))
    }
    if (taskId) {
      submissionCache.delete(CacheKeys.submissionsForTask(taskId))
    }
    // Invalidate rankings when submissions change
    userCache.delete(CacheKeys.studentRankings())
    userCache.delete(CacheKeys.adminStats())
  },

  // Invalidate chat caches
  invalidateChat: () => {
    userCache.delete(CacheKeys.chatMessages())
  },

  // Clear all caches (use sparingly)
  clearAll: () => {
    userCache.clear()
    courseCache.clear()
    taskCache.clear()
    submissionCache.clear()
  }
}

// Browser storage cache for offline capabilities
export const BrowserCache = {
  set: (key: string, data: unknown, ttl: number = 24 * 60 * 60 * 1000) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(`lms_cache_${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to set browser cache:', error)
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const stored = localStorage.getItem(`lms_cache_${key}`)
      if (!stored) return null

      const item = JSON.parse(stored)
      
      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(`lms_cache_${key}`)
        return null
      }

      return item.data as T
    } catch (error) {
      console.warn('Failed to get browser cache:', error)
      return null
    }
  },

  delete: (key: string) => {
    localStorage.removeItem(`lms_cache_${key}`)
  },

  clear: () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('lms_cache_'))
    keys.forEach(key => localStorage.removeItem(key))
  }
}

// Performance monitoring
export const CacheMetrics = {
  getAll: () => ({
    userCache: userCache.getStats(),
    courseCache: courseCache.getStats(),
    taskCache: taskCache.getStats(),
    submissionCache: submissionCache.getStats()
  }),

  logPerformance: (operation: string, duration: number, cacheHit: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] ${operation}: ${duration}ms (${cacheHit ? 'HIT' : 'MISS'})`)
    }
  }
}
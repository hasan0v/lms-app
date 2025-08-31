/**
 * 🚀 Blazing Fast Request Management Utilities
 * Advanced throttling, debouncing, and circuit breaker patterns
 */

interface RequestManager {
  pendingRequests: Map<string, Promise<unknown>>
  lastRequestTime: Map<string, number>
  failureCounts: Map<string, number>
  circuitBreakers: Map<string, { isOpen: boolean; openTime: number }>
}

class BlazingFastRequestManager {
  private static instance: BlazingFastRequestManager
  private managers: Map<string, RequestManager> = new Map()
  
  private readonly DEFAULT_THROTTLE_DELAY = 1000
  private readonly DEFAULT_MAX_FAILURES = 3
  private readonly DEFAULT_CIRCUIT_TIMEOUT = 30000
  
  static getInstance(): BlazingFastRequestManager {
    if (!BlazingFastRequestManager.instance) {
      BlazingFastRequestManager.instance = new BlazingFastRequestManager()
    }
    return BlazingFastRequestManager.instance
  }
  
  private getManager(context: string): RequestManager {
    if (!this.managers.has(context)) {
      this.managers.set(context, {
        pendingRequests: new Map(),
        lastRequestTime: new Map(),
        failureCounts: new Map(),
        circuitBreakers: new Map()
      })
    }
    return this.managers.get(context)!
  }
  
  /**
   * 🚀 Blazing Fast Request Deduplication
   * Prevents multiple identical requests from running simultaneously
   */
  async deduplicateRequest<T>(
    context: string,
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const manager = this.getManager(context)
    
    // Check if request is already in progress
    if (manager.pendingRequests.has(key)) {
      console.log(`[RequestManager] Deduplicating request: ${context}:${key}`)
      return manager.pendingRequests.get(key) as Promise<T>
    }
    
    // Create new request
    const request = requestFn()
    manager.pendingRequests.set(key, request)
    
    try {
      const result = await request
      return result
    } finally {
      // Clean up completed request
      manager.pendingRequests.delete(key)
    }
  }
  
  /**
   * ⚡ Throttle Requests for Performance
   * Ensures minimum delay between requests
   */
  shouldThrottleRequest(
    context: string,
    key: string,
    delay: number = this.DEFAULT_THROTTLE_DELAY
  ): boolean {
    const manager = this.getManager(context)
    const now = Date.now()
    const lastTime = manager.lastRequestTime.get(key) || 0
    
    if (now - lastTime < delay) {
      console.log(`[RequestManager] Throttling request: ${context}:${key}`)
      return true
    }
    
    manager.lastRequestTime.set(key, now)
    return false
  }
  
  /**
   * 🔥 Circuit Breaker Pattern
   * Prevents cascading failures and resource exhaustion
   */
  isCircuitBreakerOpen(
    context: string,
    key: string,
    timeout: number = this.DEFAULT_CIRCUIT_TIMEOUT
  ): boolean {
    const manager = this.getManager(context)
    const breaker = manager.circuitBreakers.get(key)
    
    if (!breaker) return false
    
    // Check if circuit breaker should be closed due to timeout
    if (breaker.isOpen && Date.now() - breaker.openTime > timeout) {
      console.log(`[RequestManager] Circuit breaker timeout expired: ${context}:${key}`)
      manager.circuitBreakers.delete(key)
      manager.failureCounts.delete(key)
      return false
    }
    
    return breaker.isOpen
  }
  
  /**
   * 📊 Record Request Success
   * Resets failure count and closes circuit breaker
   */
  recordSuccess(context: string, key: string): void {
    const manager = this.getManager(context)
    manager.failureCounts.delete(key)
    manager.circuitBreakers.delete(key)
  }
  
  /**
   * 🚨 Record Request Failure
   * Increments failure count and may open circuit breaker
   */
  recordFailure(
    context: string,
    key: string,
    maxFailures: number = this.DEFAULT_MAX_FAILURES
  ): boolean {
    const manager = this.getManager(context)
    const currentFailures = (manager.failureCounts.get(key) || 0) + 1
    manager.failureCounts.set(key, currentFailures)
    
    if (currentFailures >= maxFailures) {
      console.warn(`[RequestManager] Opening circuit breaker: ${context}:${key}`)
      manager.circuitBreakers.set(key, {
        isOpen: true,
        openTime: Date.now()
      })
      return true
    }
    
    return false
  }
  
  /**
   * 🧹 Cleanup Old Entries
   * Prevents memory leaks in long-running applications
   */
  cleanup(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now()
    
    this.managers.forEach((manager) => {
      // Clean up old request times
      manager.lastRequestTime.forEach((time, key) => {
        if (now - time > maxAge) {
          manager.lastRequestTime.delete(key)
        }
      })
      
      // Clean up old circuit breakers
      manager.circuitBreakers.forEach((breaker, key) => {
        if (now - breaker.openTime > maxAge) {
          manager.circuitBreakers.delete(key)
          manager.failureCounts.delete(key)
        }
      })
    })
  }
  
  /**
   * 📈 Get Performance Stats
   * Useful for monitoring and debugging
   */
  getStats(context: string): {
    pendingRequests: number
    failureCounts: Record<string, number>
    openCircuitBreakers: string[]
  } {
    const manager = this.getManager(context)
    
    return {
      pendingRequests: manager.pendingRequests.size,
      failureCounts: Object.fromEntries(manager.failureCounts),
      openCircuitBreakers: Array.from(manager.circuitBreakers.entries())
        .filter(([, breaker]) => breaker.isOpen)
        .map(([key]) => key)
    }
  }
}

/**
 * 🚀 Blazing Fast Debouncer
 * Delays function execution until after wait time has elapsed
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * ⚡ Blazing Fast Throttle
 * Limits function execution to once per time period
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 🔄 Exponential Backoff
 * Implements exponential backoff for retries
 */
export function exponentialBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  factor: number = 2
): number {
  const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay)
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * delay * 0.1
  return Math.floor(delay + jitter)
}

/**
 * 🎯 Resource Pool Manager
 * Manages concurrent resource usage
 */
export class ResourcePool {
  private activeRequests = 0
  private queue: Array<() => void> = []
  
  constructor(private maxConcurrent: number = 5) {}
  
  async acquire<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      await new Promise<void>(resolve => {
        this.queue.push(resolve)
      })
    }
    
    this.activeRequests++
    
    try {
      return await operation()
    } finally {
      this.activeRequests--
      
      if (this.queue.length > 0) {
        const next = this.queue.shift()!
        next()
      }
    }
  }
  
  getStats() {
    return {
      active: this.activeRequests,
      queued: this.queue.length,
      utilization: (this.activeRequests / this.maxConcurrent) * 100
    }
  }
}

// Export singleton instance
export const requestManager = BlazingFastRequestManager.getInstance()

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestManager.cleanup()
  }, 300000)
}
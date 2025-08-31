/**
 * Performance Monitor for Blazing Fast Loading Analytics
 * 
 * Tracks and reports performance metrics to ensure
 * the app maintains blazing fast loading speeds
 */

import React from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  timeToInteractive: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  cacheHitRate: number
  networkLatency: number
  resourceLoadTimes: Record<string, number>
}

interface LoadingEvent {
  type: 'page-load' | 'route-change' | 'api-call' | 'cache-hit' | 'cache-miss'
  url: string
  duration: number
  timestamp: number
  cacheStatus?: 'hit' | 'miss' | 'stale'
  size?: number
}

interface LCPEntry extends PerformanceEntry {
  startTime: number
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number
  startTime: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private events: LoadingEvent[] = []
  private observer: PerformanceObserver | null = null
  private startTime: number = performance.now()

  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      cacheHitRate: 0,
      networkLatency: 0,
      resourceLoadTimes: {}
    }

    this.initializeObserver()
    this.setupEventListeners()
    this.trackPageLoad()
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry)
        }
      })

      // Observe different types of performance entries
      try {
        this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] })
      } catch (error) {
        console.warn('[PerformanceMonitor] Some performance metrics not supported:', error)
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'paint':
        this.handlePaintEntry(entry as PerformancePaintTiming)
        break
      case 'largest-contentful-paint':
        this.handleLCPEntry(entry as LCPEntry)
        break
      case 'layout-shift':
        this.handleLayoutShiftEntry(entry as LayoutShiftEntry)
        break
      case 'first-input':
        this.handleFirstInputEntry(entry as FirstInputEntry)
        break
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming) {
    this.metrics.pageLoadTime = entry.loadEventEnd - entry.fetchStart
    this.metrics.networkLatency = entry.responseStart - entry.requestStart
    
    this.addEvent({
      type: 'page-load',
      url: window.location.href,
      duration: this.metrics.pageLoadTime,
      timestamp: Date.now()
    })
  }

  private handlePaintEntry(entry: PerformancePaintTiming) {
    if (entry.name === 'first-contentful-paint') {
      this.metrics.firstContentfulPaint = entry.startTime
    }
  }

  private handleLCPEntry(entry: LCPEntry) {
    this.metrics.largestContentfulPaint = entry.startTime
  }

  private handleLayoutShiftEntry(entry: LayoutShiftEntry) {
    if (!entry.hadRecentInput) {
      this.metrics.cumulativeLayoutShift += entry.value
    }
  }

  private handleFirstInputEntry(entry: FirstInputEntry) {
    this.metrics.firstInputDelay = entry.processingStart - entry.startTime
  }

  private setupEventListeners() {
    // Track route changes (for SPAs)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      window.dispatchEvent(new Event('routechange'))
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      window.dispatchEvent(new Event('routechange'))
    }

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('routechange'))
    })

    window.addEventListener('routechange', () => {
      this.trackRouteChange()
    })

    // Track API calls
    this.interceptFetch()
    
    // Track Service Worker cache events
    this.trackServiceWorkerEvents()
  }

  private trackPageLoad() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkPerformanceThresholds()
      })
    } else {
      setTimeout(() => this.checkPerformanceThresholds(), 0)
    }

    window.addEventListener('load', () => {
      setTimeout(() => this.generatePerformanceReport(), 100)
    })
  }

  private trackRouteChange() {
    const routeStartTime = performance.now()
    
    // Use requestIdleCallback to measure when route is fully loaded
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const routeEndTime = performance.now()
        this.addEvent({
          type: 'route-change',
          url: window.location.href,
          duration: routeEndTime - routeStartTime,
          timestamp: Date.now()
        })
      })
    }
  }

  private interceptFetch() {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const startTime = performance.now()
      const request = args[0]
      const url = typeof request === 'string' ? request : 
                  request instanceof Request ? request.url : 
                  request.toString()
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Check if response came from cache
        const cacheStatus = this.determineCacheStatus(response)
        
        this.addEvent({
          type: 'api-call',
          url,
          duration,
          timestamp: Date.now(),
          cacheStatus,
          size: this.getResponseSize(response)
        })

        // Update cache hit rate
        this.updateCacheHitRate()

        return response
      } catch (error) {
        const endTime = performance.now()
        this.addEvent({
          type: 'api-call',
          url,
          duration: endTime - startTime,
          timestamp: Date.now(),
          cacheStatus: 'miss'
        })
        throw error
      }
    }
  }

  private determineCacheStatus(response: Response): 'hit' | 'miss' | 'stale' {
    const cacheControl = response.headers.get('cache-control')
    const servedBy = response.headers.get('x-served-by')
    const swCacheDate = response.headers.get('sw-cache-date')
    
    if (servedBy === 'service-worker-cache' || swCacheDate) {
      return 'hit'
    }
    
    if (cacheControl?.includes('max-age=0') || cacheControl?.includes('no-cache')) {
      return 'miss'
    }
    
    return response.ok ? 'hit' : 'miss'
  }

  private getResponseSize(response: Response): number {
    const contentLength = response.headers.get('content-length')
    return contentLength ? parseInt(contentLength, 10) : 0
  }

  private updateCacheHitRate() {
    const totalRequests = this.events.filter(e => e.type === 'api-call').length
    const cacheHits = this.events.filter(e => e.type === 'api-call' && e.cacheStatus === 'hit').length
    
    this.metrics.cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0
  }

  private trackServiceWorkerEvents() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_PERFORMANCE') {
          this.addEvent({
            type: event.data.cacheHit ? 'cache-hit' : 'cache-miss',
            url: event.data.url,
            duration: 0,
            timestamp: event.data.timestamp
          })
        }
      })
    }
  }

  private addEvent(event: LoadingEvent) {
    this.events.push(event)
    
    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events.shift()
    }
  }

  private checkPerformanceThresholds() {
    const thresholds = {
      pageLoadTime: 3000, // 3 seconds
      firstContentfulPaint: 1500, // 1.5 seconds
      largestContentfulPaint: 2500, // 2.5 seconds
      cumulativeLayoutShift: 0.1, // 0.1 CLS score
      firstInputDelay: 100 // 100ms
    }

    const issues: string[] = []

    if (this.metrics.pageLoadTime > thresholds.pageLoadTime) {
      issues.push(`Slow page load: ${Math.round(this.metrics.pageLoadTime)}ms`)
    }

    if (this.metrics.firstContentfulPaint > thresholds.firstContentfulPaint) {
      issues.push(`Slow FCP: ${Math.round(this.metrics.firstContentfulPaint)}ms`)
    }

    if (this.metrics.largestContentfulPaint > thresholds.largestContentfulPaint) {
      issues.push(`Slow LCP: ${Math.round(this.metrics.largestContentfulPaint)}ms`)
    }

    if (this.metrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift) {
      issues.push(`High CLS: ${this.metrics.cumulativeLayoutShift.toFixed(3)}`)
    }

    if (this.metrics.firstInputDelay > thresholds.firstInputDelay) {
      issues.push(`Slow FID: ${Math.round(this.metrics.firstInputDelay)}ms`)
    }

    if (issues.length > 0) {
      console.warn('[PerformanceMonitor] Performance issues detected:', issues)
      this.reportPerformanceIssues(issues)
    } else {
      console.log('[PerformanceMonitor] ✅ Blazing fast performance maintained!')
    }
  }

  private generatePerformanceReport() {
    const report = {
      metrics: this.metrics,
      summary: {
        totalEvents: this.events.length,
        averageApiCallTime: this.getAverageApiCallTime(),
        routeChangeCount: this.events.filter(e => e.type === 'route-change').length,
        cacheEfficiency: `${Math.round(this.metrics.cacheHitRate)}%`,
        performanceGrade: this.calculatePerformanceGrade()
      },
      recommendations: this.generateRecommendations()
    }

    console.groupCollapsed('[PerformanceMonitor] 📊 Performance Report')
    console.table(report.metrics)
    console.log('Summary:', report.summary)
    console.log('Recommendations:', report.recommendations)
    console.groupEnd()

    return report
  }

  private getAverageApiCallTime(): number {
    const apiCalls = this.events.filter(e => e.type === 'api-call')
    if (apiCalls.length === 0) return 0
    
    const totalTime = apiCalls.reduce((sum, call) => sum + call.duration, 0)
    return Math.round(totalTime / apiCalls.length)
  }

  private calculatePerformanceGrade(): string {
    let score = 100

    // Deduct points for poor metrics
    if (this.metrics.pageLoadTime > 3000) score -= 20
    if (this.metrics.firstContentfulPaint > 1500) score -= 15
    if (this.metrics.largestContentfulPaint > 2500) score -= 15
    if (this.metrics.cumulativeLayoutShift > 0.1) score -= 20
    if (this.metrics.firstInputDelay > 100) score -= 10
    if (this.metrics.cacheHitRate < 70) score -= 20

    if (score >= 90) return '🚀 Blazing Fast (A+)'
    if (score >= 80) return '⚡ Fast (A)'
    if (score >= 70) return '🟢 Good (B)'
    if (score >= 60) return '🟡 Fair (C)'
    return '🔴 Needs Improvement (D)'
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.pageLoadTime > 3000) {
      recommendations.push('Enable more aggressive caching strategies')
      recommendations.push('Optimize bundle size and code splitting')
    }

    if (this.metrics.firstContentfulPaint > 1500) {
      recommendations.push('Preload critical resources')
      recommendations.push('Optimize font loading with font-display: swap')
    }

    if (this.metrics.cacheHitRate < 70) {
      recommendations.push('Improve service worker caching strategies')
      recommendations.push('Cache more static assets')
    }

    if (this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reserve space for images and ads')
      recommendations.push('Use size attributes on media elements')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is excellent! Keep up the good work! 🎉')
    }

    return recommendations
  }

  private reportPerformanceIssues(issues: string[]) {
    // In production, you might want to send this to an analytics service
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PerformanceMonitor] Issues to address:', issues)
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getEvents(): LoadingEvent[] {
    return [...this.events]
  }

  public generateReport() {
    return this.generatePerformanceReport()
  }

  public trackCustomEvent(name: string, duration: number) {
    this.addEvent({
      type: 'api-call',
      url: `custom:${name}`,
      duration,
      timestamp: Date.now()
    })
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Initialize performance monitoring
let performanceMonitor: PerformanceMonitor | null = null

export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
    
    // Make it available globally for debugging
    if (process.env.NODE_ENV === 'development') {
      ;(window as unknown as Record<string, unknown>).performanceMonitor = performanceMonitor
    }
  }
  
  return performanceMonitor
}

export function getPerformanceMonitor() {
  return performanceMonitor
}

export function trackPagePerformance(pageName: string) {
  if (performanceMonitor) {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      performanceMonitor?.trackCustomEvent(`${pageName}-render`, endTime - startTime)
    }
  }
  
  return () => {}
}

// Hook for React components
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    const endTracking = trackPagePerformance(componentName)
    return endTracking
  }, [componentName])
}

export default PerformanceMonitor
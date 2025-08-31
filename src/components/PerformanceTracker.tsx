'use client'

import { useEffect } from 'react'

export default function PerformanceTracker() {
  useEffect(() => {
    // Track page load performance for blazing fast optimization
    const performanceStart = Date.now()
    
    // Enhanced Service Worker registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(function() {
            console.log('Enhanced SW registered for blazing fast caching')
          })
          .catch(function(error) {
            console.log('SW registration failed:', error)
          })
      })
    }
    
    // Global loading indicator management
    const loadingIndicator = document.getElementById('global-loading')
    let loadingTimeout: NodeJS.Timeout
    let isNavigating = false
    
    function showLoading() {
      if (loadingIndicator && !isNavigating) {
        isNavigating = true
        loadingIndicator.classList.add('active')
        
        // Auto-hide after 5 seconds to prevent stuck indicators
        loadingTimeout = setTimeout(hideLoading, 5000)
      }
    }
    
    function hideLoading() {
      if (loadingIndicator && isNavigating) {
        clearTimeout(loadingTimeout)
        setTimeout(() => {
          loadingIndicator.classList.remove('active')
          isNavigating = false
        }, 100)
      }
    }
    
    // Track navigation events for instant feedback
    window.addEventListener('beforeunload', showLoading)
    window.addEventListener('load', hideLoading)
    window.addEventListener('pageshow', hideLoading)
    
    // Track fetch requests for blazing fast API feedback
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      let url = ''
      if (typeof args[0] === 'string') {
        url = args[0]
      } else if (args[0] instanceof Request) {
        url = args[0].url
      } else if (args[0] instanceof URL) {
        url = args[0].toString()
      }
      
      // Only show loading for user-initiated requests
      if (!url.includes('/api/auth/session') && !url.includes('HEAD')) {
        showLoading()
      }
      
      return originalFetch.apply(this, args).finally(() => {
        setTimeout(hideLoading, 100)
      })
    }
    
    // Optimize image loading for blazing fast visuals
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[data-src]')
      images.forEach(img => {
        const imgElement = img as HTMLImageElement
        imgElement.src = imgElement.dataset.src || ''
      })
    } else {
      // Fallback for older browsers
      const script = document.createElement('script')
      script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver'
      document.head.appendChild(script)
    }
    
    // Track performance metrics
    const loadTime = Date.now() - performanceStart
    console.log('Component loaded in', loadTime, 'ms')
    
    if (loadTime < 1000) {
      console.log('Blazing fast component loading achieved!')
    } else if (loadTime > 2000) {
      console.warn('Component loading could be faster. Check critical resources.')
    }
    
    const handleLoad = () => {
      const totalLoadTime = Date.now() - performanceStart
      console.log('Page fully loaded in', totalLoadTime, 'ms')
      
      if (totalLoadTime < 2000) {
        console.log('Blazing fast page load achieved!')
      } else if (totalLoadTime > 3000) {
        console.warn('Page load could be faster. Optimize resources and caching.')
      }
    }
    
    window.addEventListener('load', handleLoad)
    
    // Predictive loading on hover for blazing fast navigation
    const handleMouseover = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' && (target as HTMLAnchorElement).href && !target.dataset.prefetched) {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = (target as HTMLAnchorElement).href
        document.head.appendChild(link)
        target.dataset.prefetched = 'true'
      }
    }
    
    document.addEventListener('mouseover', handleMouseover)
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', showLoading)
      window.removeEventListener('load', hideLoading)
      window.removeEventListener('pageshow', hideLoading)
      window.removeEventListener('load', handleLoad)
      document.removeEventListener('mouseover', handleMouseover)
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, [])

  return null // This component doesn't render anything
}
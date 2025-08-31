'use client'

import React, { useEffect, useState } from 'react'
import { Logo } from './Logo'

interface OptimizedLoaderProps {
  text?: string
  showLogo?: boolean
  minimal?: boolean
  timeout?: number
}

export const OptimizedLoader: React.FC<OptimizedLoaderProps> = ({ 
  text = 'Yüklənir...', 
  showLogo = true,
  minimal = false,
  timeout = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-hide loader after timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  if (!isVisible) {
    return null
  }

  if (minimal) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        {/* Logo with optimized loading */}
        {showLogo && (
          <div className="mb-8 animate-pulse">
            <Logo size="lg" showText={true} />
          </div>
        )}
        
        {/* Optimized spinner */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          
          {/* Loading dots */}
          <div className="flex justify-center items-center space-x-1 mt-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">{text}</p>
          <p className="text-sm text-gray-600">
            Xahiş olunur bir az gözləyin...
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

// Skeleton loaders for different content types
export const PageSkeleton = () => (
  <div className="min-h-screen bg-white">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 mb-6" />
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          
          {/* Card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="animate-pulse">
      {/* Sidebar skeleton */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-200" />
      
      {/* Main content skeleton */}
      <div className="pl-64">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 mb-6" />
        
        {/* Dashboard content */}
        <div className="px-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
    <div className="mt-4 h-8 bg-gray-200 rounded w-1/3" />
  </div>
)

export const TableSkeleton = () => (
  <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/6" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default OptimizedLoader
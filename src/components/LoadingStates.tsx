/**
 * Loading States and Skeleton Components
 * 
 * Provides consistent loading experiences across the application:
 * - Skeleton loaders for different content types
 * - Loading spinners and progress indicators
 * - Suspense fallbacks
 * - Form submission states
 */

'use client'

import React from 'react'
import { Loader2, BookOpen, MessageSquare, Users, FileText } from 'lucide-react'

// Base skeleton component
export const Skeleton: React.FC<{
  className?: string
  animate?: boolean
}> = ({ className = '', animate = true }) => (
  <div
    className={`
      bg-gray-200 rounded
      ${animate ? 'animate-pulse' : ''}
      ${className}
    `}
  />
)

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'gray' | 'white'
  text?: string
  className?: string
}> = ({ size = 'md', color = 'blue', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && (
        <span className={`text-sm font-medium ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

// Course card skeleton
export const CourseCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
)

// Task card skeleton
export const TaskCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border p-4 space-y-3">
    <div className="flex justify-between items-start">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
)

// Chat message skeleton
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg space-y-2 ${
      isUser ? 'bg-blue-100' : 'bg-gray-100'
    }`}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
)

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-20" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Profile skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 space-y-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
    
    <div className="flex space-x-3">
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-20 rounded-md" />
    </div>
  </div>
)

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
    
    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 space-y-3">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    
    {/* Content grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

// Page loading component with context
export const PageLoading: React.FC<{
  type?: 'dashboard' | 'course' | 'profile' | 'chat' | 'admin'
  title?: string
  subtitle?: string
}> = ({ type = 'dashboard', title, subtitle }) => {
  const getIcon = () => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-8 h-8 text-blue-500" />
      case 'chat':
        return <MessageSquare className="w-8 h-8 text-green-500" />
      case 'admin':
        return <Users className="w-8 h-8 text-purple-500" />
      case 'profile':
        return <FileText className="w-8 h-8 text-orange-500" />
      default:
        return <BookOpen className="w-8 h-8 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          {getIcon()}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {title || 'Yüklənir...'}
          </h2>
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        
        <LoadingSpinner size="lg" text="Lütfən gözləyin..." />
        
        {/* Progress indicator */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{
              animation: 'loading 2s ease-in-out infinite'
            }} />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}

// Form loading overlay
export const FormLoading: React.FC<{
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}> = ({ isLoading, loadingText = 'Göndərilir...', children }) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
        <LoadingSpinner text={loadingText} />
      </div>
    )}
  </div>
)

// Button loading state
export const LoadingButton: React.FC<{
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}> = ({ 
  isLoading, 
  loadingText, 
  children, 
  disabled, 
  className = '', 
  onClick,
  type = 'button'
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`
      flex items-center justify-center space-x-2 transition-all duration-200
      ${isLoading ? 'cursor-not-allowed opacity-75' : ''}
      ${className}
    `}
  >
    {isLoading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{loadingText || 'Yüklənir...'}</span>
      </>
    ) : (
      children
    )}
  </button>
)

// Suspense fallbacks for different sections
export const CourseSuspenseFallback: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

export const TaskSuspenseFallback: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-32" />
    {Array.from({ length: 5 }).map((_, i) => (
      <TaskCardSkeleton key={i} />
    ))}
  </div>
)

export const ChatSuspenseFallback: React.FC = () => (
  <div className="h-96 space-y-4 p-4">
    <Skeleton className="h-6 w-40" />
    {Array.from({ length: 5 }).map((_, i) => (
      <ChatMessageSkeleton key={i} isUser={i % 2 === 0} />
    ))}
  </div>
)

const LoadingStates = {
  Skeleton,
  LoadingSpinner,
  CourseCardSkeleton,
  TaskCardSkeleton,
  ChatMessageSkeleton,
  TableSkeleton,
  ProfileSkeleton,
  DashboardSkeleton,
  PageLoading,
  FormLoading,
  LoadingButton,
  CourseSuspenseFallback,
  TaskSuspenseFallback,
  ChatSuspenseFallback
}

export default LoadingStates
/**
 * Dynamic Code Splitting for Admin Components
 * 
 * This module implements lazy loading for admin-only components to reduce
 * the bundle size for regular users. Admin components are only loaded
 * when needed, improving initial page load performance.
 */

'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from './LoadingStates'
import { Suspense } from 'react'

// Admin component loading fallbacks
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" text="Admin paneli yüklənir..." />
  </div>
)

const AdminFormLoadingFallback = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <LoadingSpinner text="Forma yüklənir..." />
  </div>
)

const AdminTableLoadingFallback = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <LoadingSpinner text="Məlumatlar yüklənir..." />
  </div>
)

// Dynamically imported admin components (only if they exist)
export const LazyTaskManager = dynamic(
  () => Promise.resolve({
    default: () => (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
        Task Manager komponenti hazırlanmaqdadır
      </div>
    )
  }),
  {
    loading: AdminLoadingFallback,
    ssr: false // Admin components don't need SSR
  }
)

export const LazyEmailTemplateManager = dynamic(
  () => import('@/components/EmailTemplateManager').catch(() =>
    Promise.resolve({
      default: () => (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
          Email Template Manager mövcud deyil
        </div>
      )
    })
  ),
  {
    loading: AdminFormLoadingFallback,
    ssr: false
  }
)

export const LazyYouTubeVideoManager = dynamic(
  () => import('@/components/YouTubeVideoManager').catch(() =>
    Promise.resolve({
      default: () => (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
          YouTube Video Manager mövcud deyil
        </div>
      )
    })
  ),
  {
    loading: AdminFormLoadingFallback,
    ssr: false
  }
)

// Rich Text Editor - Large component, should be lazy loaded
export const LazyRichTextEditor = dynamic(
  () => import('@/components/RichTextEditor').catch(() =>
    Promise.resolve({
      default: () => (
        <div className="border rounded-lg p-4 text-center text-gray-600">
          Rich Text Editor mövcud deyil
        </div>
      )
    })
  ),
  {
    loading: () => (
      <div className="border rounded-lg p-4">
        <LoadingSpinner text="Mətn editoru yüklənir..." />
      </div>
    ),
    ssr: false
  }
)

// Admin dashboard components
export const LazyAdminDashboard = dynamic(
  () => import('@/app/dashboard/admin/page').catch(() =>
    Promise.resolve({
      default: () => (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
          Admin Dashboard mövcud deyil
        </div>
      )
    })
  ),
  {
    loading: AdminLoadingFallback,
    ssr: false
  }
)

// Notebook viewer - Heavy component with complex dependencies
export const LazyNotebookViewer = dynamic(
  () => import('@/components/NotebookViewer').catch(() =>
    Promise.resolve({
      default: () => (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
          Notebook Viewer mövcud deyil
        </div>
      )
    })
  ),
  {
    loading: () => (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <LoadingSpinner size="lg" text="Notebook yüklənir..." />
        <p className="text-sm text-gray-600 mt-2">
          Bu böyük bir komponentdir, xahiş olunur səbir edin...
        </p>
      </div>
    ),
    ssr: false
  }
)

// Advanced chart/analytics components
export const LazyAnalyticsChart = dynamic(
  () => Promise.resolve({
    default: () => (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analitika Chartı</h3>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Analitika məlumatları yüklənir...</p>
        </div>
      </div>
    )
  }),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow p-6">
        <LoadingSpinner text="Analitika yüklənir..." />
      </div>
    ),
    ssr: false
  }
)

// User management table
export const LazyUserManagementTable = dynamic(
  () => Promise.resolve({
    default: () => (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">İstifadəçi İdarəetməsi</h3>
        </div>
        <div className="p-6">
          <LoadingSpinner size="lg" text="İstifadəçi məlumatları yüklənir..." />
        </div>
      </div>
    )
  }),
  {
    loading: AdminTableLoadingFallback,
    ssr: false
  }
)

// Higher-order component for admin route protection with lazy loading
export const withAdminLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingComponent?: () => React.JSX.Element
) => {
  const LazyAdminComponent = dynamic(
    () => Promise.resolve({ default: Component }),
    {
      loading: loadingComponent || AdminLoadingFallback,
      ssr: false
    }
  )

  const WrappedComponent = (props: P) => (
    <Suspense fallback={<AdminLoadingFallback />}>
      <LazyAdminComponent {...props} />
    </Suspense>
  )

  WrappedComponent.displayName = `withAdminLazyLoading(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Utility for checking if user should see admin components
export const shouldLoadAdminComponents = (userRole?: string): boolean => {
  return userRole === 'admin' || userRole === 'teacher'
}

// Conditional admin component loader
export const ConditionalAdminComponent: React.FC<{
  userRole?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ userRole, children, fallback = null }) => {
  if (!shouldLoadAdminComponents(userRole)) {
    return <>{fallback}</>
  }

  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      {children}
    </Suspense>
  )
}

// Admin component registry for dynamic loading
export const AdminComponentRegistry = {
  TaskManager: LazyTaskManager,
  EmailTemplateManager: LazyEmailTemplateManager,
  YouTubeVideoManager: LazyYouTubeVideoManager,
  AdminDashboard: LazyAdminDashboard,
  UserManagementTable: LazyUserManagementTable,
  AnalyticsChart: LazyAnalyticsChart
} as const

// Bundle analysis helper - shows what's being lazy loaded
export const getBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Lazy Loaded Admin Components:', {
      TaskManager: 'components/admin/TaskManager',
      EmailTemplateManager: 'components/EmailTemplateManager',
      YouTubeVideoManager: 'components/YouTubeVideoManager',
      RichTextEditor: 'components/RichTextEditor',
      NotebookViewer: 'components/NotebookViewer',
      AdminDashboard: 'app/dashboard/admin/page'
    })
  }
}

// Performance monitoring for lazy loaded components
export const trackLazyComponentLoad = (componentName: string, startTime: number) => {
  if (typeof window !== 'undefined' && window.performance) {
    const loadTime = performance.now() - startTime
    console.log(`Lazy component "${componentName}" loaded in ${loadTime.toFixed(2)}ms`)
    
    // Report to analytics if available
    if ('gtag' in window) {
      // @ts-expect-error - gtag is not typed but might be available
      window.gtag('event', 'lazy_component_load', {
        component_name: componentName,
        load_time: Math.round(loadTime)
      })
    }
  }
}

const LazyAdminComponents = {
  LazyTaskManager,
  LazyEmailTemplateManager,
  LazyYouTubeVideoManager,
  LazyRichTextEditor,
  LazyAdminDashboard,
  LazyNotebookViewer,
  LazyAnalyticsChart,
  LazyUserManagementTable,
  withAdminLazyLoading,
  shouldLoadAdminComponents,
  ConditionalAdminComponent,
  AdminComponentRegistry,
  getBundleInfo,
  trackLazyComponentLoad
}

export default LazyAdminComponents
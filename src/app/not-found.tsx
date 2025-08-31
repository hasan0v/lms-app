import Link from 'next/link'
import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        
        {/* 404 Content */}
        <div className="space-y-6">
          {/* 404 Number */}
          <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Səhifə tapılmadı
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            Axtardığınız səhifə mövcud deyil və ya köçürülüb.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
            >
              Ana səhifəyə qayıt
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
            >
              Dashboard
            </Link>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Köməyə ehtiyacınız varsa{' '}
              <Link 
                href="/dashboard/chat" 
                className="text-blue-600 hover:text-blue-500 font-medium underline"
              >
                chat
              </Link>
              {' '}bölməsinə müraciət edə bilərsiniz.
            </p>
          </div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-50 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-50 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    </div>
  )
}
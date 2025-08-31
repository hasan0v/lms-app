'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  sizes?: string
  fill?: boolean
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  sizes,
  fill = false
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }, [onError])

  // Generate blur data URL if not provided
  const getBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  // Default dimensions when not specified
  const defaultWidth = width || (fill ? undefined : 200)
  const defaultHeight = height || (fill ? undefined : 200)

  // Fallback image component
  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ 
          width: fill ? '100%' : defaultWidth, 
          height: fill ? '100%' : defaultHeight 
        }}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ 
            width: fill ? '100%' : defaultWidth, 
            height: fill ? '100%' : defaultHeight 
          }}
        />
      )}
      
      {/* Optimized Next.js Image */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : defaultWidth}
        height={fill ? undefined : defaultHeight}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (placeholder === 'blur' ? getBlurDataURL(20, 20) : undefined)}
        sizes={sizes || (fill ? '100vw' : `${defaultWidth}px`)}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectFit: 'cover'
        }}
      />
    </div>
  )
}

// Pre-built optimized images for common use cases
export const ProfileImage: React.FC<{
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  }
  
  const dimension = sizeMap[size]

  if (!src) {
    return (
      <div 
        className={`bg-gray-300 rounded-full flex items-center justify-center ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <svg 
          className="w-1/2 h-1/2 text-gray-500" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={`rounded-full ${className}`}
      quality={90}
    />
  )
}

export const LogoImage: React.FC<{
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ src = '/logo.png', alt, size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 }
  }
  
  const { width, height } = sizeMap[size]

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={true} // Logo should load with high priority
      quality={95}
    />
  )
}

export const CoverImage: React.FC<{
  src: string
  alt: string
  className?: string
  aspectRatio?: 'video' | 'square' | 'portrait' | 'landscape'
}> = ({ src, alt, className = '', aspectRatio = 'landscape' }) => {
  const aspectMap = {
    video: 'aspect-video',
    square: 'aspect-square', 
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  }

  return (
    <div className={`relative ${aspectMap[aspectRatio]} ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill={true}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={80}
        placeholder="blur"
        className="rounded-lg"
      />
    </div>
  )
}

// Lazy loading image with intersection observer
export const LazyImage: React.FC<OptimizedImageProps & {
  rootMargin?: string
  threshold?: number
}> = ({ 
  rootMargin = '50px',
  threshold = 0.1,
  ...props 
}) => {
  const [isInView, setIsInView] = useState(false)
  const imgRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return (
    <div ref={imgRef}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <div 
          className={`bg-gray-200 ${props.className}`}
          style={{ 
            width: props.fill ? '100%' : props.width, 
            height: props.fill ? '100%' : props.height 
          }}
        />
      )}
    </div>
  )
}

export default OptimizedImage
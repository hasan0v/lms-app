'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Course } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Enhanced Course Icon Component
const CourseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// Loading Skeleton Component
const CourseCardSkeleton = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-200 rounded mb-3"></div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="flex items-center justify-between text-xs mb-4">
      <div className="h-3 bg-gray-200 rounded w-24"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded-xl"></div>
  </div>
)

export default function StudentCoursesPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchCourses()
  }, [profile])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched courses:', data)
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="text-center">
          <div className="course-icon-container inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg">
            <CourseIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Available Courses
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Explore our comprehensive catalog of courses designed to accelerate your learning journey
          </p>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No courses available yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our course catalog is being prepared. Check back soon for exciting new learning opportunities!
            </p>
            <div className="inline-flex items-center text-sm text-primary-600 font-medium">
              <span className="animate-pulse">🔄</span>
              <span className="ml-2">Coming soon...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Banner */}
            <div className="glass-card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Available Courses</p>
                  <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
                </div>
                <div className="course-icon-container w-12 h-12 rounded-xl flex items-center justify-center">
                  <CourseIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div 
                  key={course.id} 
                  className="glass-card group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="course-icon-container w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <CourseIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          Course
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {course.description || 'Comprehensive course content designed to enhance your skills and knowledge in this subject area.'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span>ID: {course.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{new Date(course.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="course-start-button w-full inline-flex items-center justify-center py-3 px-4 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl group-hover:scale-[1.02]"
                    >
                      <span>Start Learning</span>
                      <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

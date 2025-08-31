'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle, Star, Calendar, MessageSquare, TrendingUp, Users } from 'lucide-react'

interface GradeWithDetails {
  id: string
  points: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  status: string
  task: {
    id: string
    instructions: string
    topic: {
      id: string
      title: string
      module: {
        id: string
        title: string
        course: {
          id: string
          title: string
        }
      }
    }
  }
}

interface ClassPerformanceData {
  studentId: string
  averageGrade: number
  isCurrentUser: boolean
  rank: number
}

interface DatabaseStudentPerformance {
  average_grade: number
  is_current_user: boolean
  rank: number
}

interface LineChartProps {
  data: ClassPerformanceData[]
  currentUserAverage: number
  className?: string
}

interface LineChartProps {
  data: ClassPerformanceData[]
  currentUserAverage: number
  className?: string
}

// Simple Line Chart Component
function ClassPerformanceChart({ data, currentUserAverage, className = '' }: LineChartProps) {
  const [animated, setAnimated] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  if (!data || data.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Not enough class data available yet</p>
      </div>
    )
  }
  
  const maxGrade = Math.max(...data.map(d => d.averageGrade), 100)
  const minGrade = Math.min(...data.map(d => d.averageGrade), 0)
  const range = maxGrade - minGrade || 1
  
  const chartWidth = 400
  const chartHeight = 200
  const padding = 40
  
  const getX = (index: number) => padding + (index / (data.length - 1)) * (chartWidth - 2 * padding)
  const getY = (grade: number) => chartHeight - padding - ((grade - minGrade) / range) * (chartHeight - 2 * padding)
  
  const pathData = data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point.averageGrade)}`).join(' ')
  
  const currentUserIndex = data.findIndex(d => d.isCurrentUser)
  const currentUserRank = data.find(d => d.isCurrentUser)?.rank || 0
  
  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Class Performance Comparison
          </h3>
          <p className="text-sm text-gray-600 mt-1">Your exact position among all students (anonymized & privacy-protected)</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">#{currentUserRank}</div>
          <div className="text-xs text-gray-500">Your rank</div>
        </div>
      </div>
      
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 overflow-visible"
          style={{ maxHeight: '200px' }}
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(grade => {
            const y = getY(grade)
            return (
              <line
                key={grade}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
            )
          })}
          
          {/* Area under curve */}
          <path
            d={`${pathData} L ${getX(data.length - 1)} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
            fill="url(#areaGradient)"
            opacity={animated ? "1" : "0"}
            style={{ transition: 'opacity 1s ease-out' }}
          />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={animated ? "none" : "1000"}
            strokeDashoffset={animated ? "0" : "1000"}
            style={{ transition: 'stroke-dashoffset 2s ease-out' }}
          />
          
          {/* Data points */}
          {data.map((point, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(point.averageGrade)}
                r={point.isCurrentUser ? "8" : "4"}
                fill={point.isCurrentUser ? "#f59e0b" : "#6366f1"}
                stroke={point.isCurrentUser ? "#ffffff" : "none"}
                strokeWidth={point.isCurrentUser ? "3" : "0"}
                opacity={animated ? "1" : "0"}
                style={{ 
                  transition: `opacity 1s ease-out ${i * 0.1}s`,
                  filter: point.isCurrentUser ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' : 'none'
                }}
              />
              {/* Grade value label for each point */}
              {!point.isCurrentUser && (
                <text
                  x={getX(i)}
                  y={getY(point.averageGrade) - 12}
                  textAnchor="middle"
                  className="fill-gray-600 text-xs font-medium"
                  opacity={animated ? "0.8" : "0"}
                  style={{ transition: `opacity 1s ease-out ${i * 0.1 + 0.5}s` }}
                >
                  {point.averageGrade.toFixed(1)}
                </text>
              )}
            </g>
          ))}
          
          {/* Current user label with exact grade */}
          {currentUserIndex >= 0 && (
            <g opacity={animated ? "1" : "0"} style={{ transition: 'opacity 1s ease-out 1s' }}>
              <rect
                x={getX(currentUserIndex) - 25}
                y={getY(currentUserAverage) - 40}
                width="50"
                height="25"
                rx="12"
                fill="#f59e0b"
              />
              <text
                x={getX(currentUserIndex)}
                y={getY(currentUserAverage) - 30}
                textAnchor="middle"
                className="fill-white text-xs font-semibold"
              >
                You
              </text>
              <text
                x={getX(currentUserIndex)}
                y={getY(currentUserAverage) - 18}
                textAnchor="middle"
                className="fill-white text-xs font-bold"
              >
                {currentUserAverage.toFixed(1)}
              </text>
            </g>
          )}
          
          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map(grade => (
            <text
              key={grade}
              x={padding - 10}
              y={getY(grade) + 4}
              textAnchor="end"
              className="fill-gray-500 text-xs"
            >
              {grade}
            </text>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-gray-600">Other Students (Anonymized)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 ring-2 ring-white"></div>
            <span className="text-gray-600">Your Performance</span>
          </div>
        </div>
        
        {/* Privacy Notice */}
        <div className="mt-3 text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-2">
          🔒 Privacy Protected: Other students&apos; names are not visible. This chart shows exact grade positions.
        </div>
        
        {/* Performance insights */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{data.length}</div>
            <div className="text-xs text-blue-600">Total Students</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">
              {((data.length - currentUserRank + 1) / data.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-green-600">Better Than</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">
              {(data.reduce((sum, d) => sum + d.averageGrade, 0) / data.length).toFixed(1)}
            </div>
            <div className="text-xs text-purple-600">Class Average</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentGradesPage() {
  const { user } = useAuth()
  const [grades, setGrades] = useState<GradeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [classPerformanceData, setClassPerformanceData] = useState<ClassPerformanceData[]>([])
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    gradedSubmissions: 0,
    totalPoints: 0,
    averageGrade: 0
  })

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return

      try {
        // First, let's check if there are any submissions at all for this user
        const { data: submissionsCheck, error: submissionsError } = await supabase
          .from('submissions')
          .select('id, status, submitted_at, student_id')
          .eq('student_id', user.id)

        console.log('Submissions check:', submissionsCheck)
        console.log('User ID:', user.id)

        if (submissionsError) {
          console.error('Error checking submissions:', submissionsError)
          throw submissionsError
        }

        if (!submissionsCheck || submissionsCheck.length === 0) {
          console.log('No submissions found for user')
          setGrades([])
          setStats({
            totalSubmissions: 0,
            gradedSubmissions: 0,
            totalPoints: 0,
            averageGrade: 0
          })
          setClassPerformanceData([])
          return
        }

        // If we have submissions, proceed with the full query
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            id,
            points,
            feedback,
            submitted_at,
            graded_at,
            status,
            task:tasks!inner(
              id,
              instructions,
              topic:topics!inner(
                id,
                title,
                module:modules!inner(
                  id,
                  title,
                  course:courses!inner(
                    id,
                    title
                  )
                )
              )
            )
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false })

        if (error) throw error

        console.log('Submissions data:', data)

        const gradesData = data?.map(item => {
          const task = Array.isArray(item.task) ? item.task[0] : item.task
          const topic = Array.isArray(task?.topic) ? task.topic[0] : task?.topic
          const moduleData = Array.isArray(topic?.module) ? topic.module[0] : topic?.module
          const course = Array.isArray(moduleData?.course) ? moduleData.course[0] : moduleData?.course

          return {
            id: item.id,
            points: item.points,
            feedback: item.feedback,
            submitted_at: item.submitted_at,
            graded_at: item.graded_at,
            status: item.status,
            task: {
              id: task?.id || '',
              instructions: task?.instructions || '',
              topic: {
                id: topic?.id || '',
                title: topic?.title || '',
                module: {
                  id: moduleData?.id || '',
                  title: moduleData?.title || '',
                  course: {
                    id: course?.id || '',
                    title: course?.title || ''
                  }
                }
              }
            }
          }
        }) || []
        
        setGrades(gradesData)

        // Calculate stats
        const totalSubmissions = gradesData.length
        const gradedSubmissions = gradesData.filter(g => g.status === 'graded').length
        const totalPoints = gradesData
          .filter(g => g.points !== null)
          .reduce((sum, g) => sum + (g.points || 0), 0)
        const averageGrade = gradedSubmissions > 0 ? totalPoints / gradedSubmissions : 0

        setStats({
          totalSubmissions,
          gradedSubmissions,
          totalPoints,
          averageGrade
        })

        // Fetch class performance data (anonymized)
        await fetchClassPerformanceData()
      } catch (error) {
        console.error('Error fetching grades:', error)
        
        // If there are no submissions, show a helpful message
        if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
          console.log('No submissions found for this user')
          setGrades([])
        }
      } finally {
        setLoading(false)
      }
    }

    const fetchClassPerformanceData = async () => {
      try {
        // Use secure function to get anonymized class performance data
        const { data: classPerformanceResult, error } = await supabase
          .rpc('get_anonymized_class_performance')

        if (error) {
          console.error('Error fetching class performance:', error)
          setClassPerformanceData([])
          return
        }

        if (!classPerformanceResult || classPerformanceResult.length === 0) {
          console.log('No class performance data available')
          setClassPerformanceData([])
          return
        }

        // Transform the exact anonymized data from the database
        const anonymizedData: ClassPerformanceData[] = classPerformanceResult.map((student: DatabaseStudentPerformance, index: number) => ({
          studentId: student.is_current_user ? user?.id || 'current' : `student-${index + 1}`,
          averageGrade: student.average_grade,
          isCurrentUser: student.is_current_user,
          rank: student.rank
        }))

        // Sort by rank for proper display
        anonymizedData.sort((a, b) => a.rank - b.rank)
        
        setClassPerformanceData(anonymizedData)
      } catch (error) {
        console.error('Error fetching class performance data:', error)
        setClassPerformanceData([])
      }
    }

    if (user) {
      fetchGrades()
    }
  }, [user])

  const getGradeBadgeColor = (points: number | null) => {
    if (points === null) return 'bg-gray-100 text-gray-800'
    if (points >= 90) return 'bg-green-100 text-green-800'
    if (points >= 80) return 'bg-blue-100 text-blue-800'
    if (points >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-10">
          <div className="text-center pt-4">
            <div className="course-icon-container inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-xl animate-pulse bg-gradient-to-br from-indigo-500/30 to-purple-500/30" />
            <div className="h-8 w-60 mx-auto rounded-lg bg-gray-200/60 animate-pulse" />
            <div className="h-4 w-96 mx-auto mt-4 rounded bg-gray-200/50 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden">
                <div className="h-36 bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-6 flex flex-col justify-between animate-pulse" />
              </div>
            ))}
          </div>
          <div className="mb-8 px-2">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/40 animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-6 w-64 bg-gray-200/60 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-200/50 rounded" />
                </div>
                <div className="text-right">
                  <div className="h-8 w-12 bg-gray-200/60 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-200/50 rounded" />
                </div>
              </div>
              <div className="h-48 bg-gray-200/40 rounded-lg mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-100/60 rounded-lg p-3">
                    <div className="h-6 w-8 bg-gray-200/60 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-200/50 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="relative rounded-2xl border border-white/40 bg-white/60 backdrop-blur animate-pulse p-6">
                <div className="h-5 w-80 bg-gray-200/60 rounded mb-3" />
                <div className="h-4 w-56 bg-gray-200/50 rounded mb-4" />
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200/40 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm">
        {/* Enhanced Header Section */}
        <div className="text-center">
          <div className="course-icon-container inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            My Grades <span className="text-blue-500">📊</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Track your progress and see feedback from instructors across all your courses.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-md ring-2 ring-blue-100/40">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
            </div>
          </div>
          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-lg ring-4 ring-green-100/40">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Graded</p>
                <p className="text-2xl font-bold text-gray-900">{stats.gradedSubmissions}</p>
              </div>
            </div>
            </div>
          </div>
          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-purple-400/10 via-fuchsia-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg ring-4 ring-purple-100/40">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
              </div>
            </div>
            </div>
          </div>
          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-orange-400/10 via-amber-400/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
              <div className="flex items-center space-x-5">
                <div className="relative w-20 h-20">
                  {(() => {
                    const percent = Math.min(100, Math.max(0, stats.averageGrade))
                    const r = 32
                    const c = 2 * Math.PI * r
                    const offset = c - (percent / 100) * c
                    return (
                      <svg className="w-20 h-20" viewBox="0 0 80 80" role="img" aria-label={`Average grade ${percent.toFixed(0)} percent`}>
                        <defs>
                          <linearGradient id="avgGrad" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        <g transform="rotate(-90 40 40)">
                          <circle cx="40" cy="40" r={r} stroke="rgba(0,0,0,0.07)" strokeWidth="8" fill="transparent" />
                          <circle
                            cx="40"
                            cy="40"
                            r={r}
                            stroke="url(#avgGrad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="transparent"
                            strokeDasharray={c}
                            strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                          />
                        </g>
                        <text
                          x="50%"
                          y="50%"
                          dominantBaseline="middle"
                          textAnchor="middle"
                          className="fill-gray-800 font-semibold text-sm select-none"
                        >
                          {percent.toFixed(0)}%
                        </text>
                      </svg>
                    )
                  })()}
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageGrade.toFixed(1)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Based on graded submissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Class Performance Comparison Chart */}
        {classPerformanceData.length > 0 && stats.gradedSubmissions > 0 && (
          <ClassPerformanceChart
            data={classPerformanceData}
            currentUserAverage={stats.averageGrade}
            className="mb-8"
          />
        )}

        {/* Grades List */}
        {grades.length > 0 ? (
          <div className="space-y-6">
            {grades.map((grade) => (
              <div key={grade.id} className="relative group">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-300/30 via-purple-300/30 to-pink-300/30 opacity-0 group-hover:opacity-100 blur-md transition" />
                <div className="relative rounded-2xl bg-white/65 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-400 ease-out hover:-translate-y-0.5 hover:bg-white/80">
                  <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div>
                      {grade.task.topic?.module?.course ? (
                        <>
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            <Link 
                              href={`/dashboard/courses/${grade.task.topic.module.course.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {grade.task.topic.module.course.title}
                            </Link>
                          </p>
                          <p className="text-sm text-gray-500">
                            {grade.task.topic.module.title} › {grade.task.topic.title}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            Assignment Task
                          </p>
                          <p className="text-sm text-gray-500">
                            No course assignment
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      grade.status === 'graded' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {grade.status === 'graded' ? 'Graded' : 'Pending'}
                    </span>
                    {grade.status === 'graded' && (
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getGradeBadgeColor(grade.points)}`}>
                        {grade.points || 0} points
                      </span>
                    )}
                  </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent mb-4" />
                    <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {grade.task.instructions}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-6">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Submitted: {new Date(grade.submitted_at).toLocaleDateString()}
                    </span>
                    {grade.graded_at && (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Graded: {new Date(grade.graded_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {grade.feedback && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Instructor Feedback:
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{grade.feedback}</p>
                  </div>
                )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative group text-center py-16 rounded-3xl overflow-hidden">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-300/30 via-purple-300/30 to-pink-300/30 opacity-70 blur" />
            <div className="relative bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl max-w-3xl mx-auto shadow-sm p-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl text-white">
                <Star className="h-12 w-12" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No grades yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Complete your assignments to see your grades and feedback from instructors here.
            </p>
            <Link 
              href="/dashboard/courses"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Browse Courses
            </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

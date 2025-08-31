'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Trophy, Users, TrendingUp, Calendar, FileText, Award, Target, BarChart3, Download, Search, Filter } from 'lucide-react'

interface StudentRankingData {
  studentId: string
  studentName: string
  email: string
  totalSubmissions: number
  gradedSubmissions: number
  pendingSubmissions: number
  averageGrade: number
  totalPoints: number
  maxPossiblePoints: number
  completionRate: number
  lastSubmissionDate: string | null
  rank: number
  coursesEnrolled: number
  bestGrade: number
  worstGrade: number
  gradeDistribution: {
    excellent: number // 90-100
    good: number      // 80-89
    fair: number      // 70-79
    poor: number      // 0-69
  }
  recentActivity: {
    submissionsLast7Days: number
    submissionsLast30Days: number
  }
}

interface RankingStats {
  totalActiveStudents: number
  averageClassGrade: number
  totalSubmissions: number
  completionRate: number
  topPerformer: string
  mostImproved: string
}

export default function AdminStudentRankingsPage() {
  const { user, profile } = useAuth()
  const [rankings, setRankings] = useState<StudentRankingData[]>([])
  const [stats, setStats] = useState<RankingStats>({
    totalActiveStudents: 0,
    averageClassGrade: 0,
    totalSubmissions: 0,
    completionRate: 0,
    topPerformer: '',
    mostImproved: ''
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'average' | 'submissions' | 'completion'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Check if user is admin
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (user && isAdmin) {
      fetchRankingsData()
    }
  }, [user, isAdmin])

  const fetchRankingsData = async () => {
    try {
      setLoading(true)
      console.log('🚀 Starting fetchRankingsData...')

      // Fetch all user profiles (students only)
      console.log('📋 Fetching user profiles...')
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, role')
        .eq('role', 'student')

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError)
        throw new Error(`Profiles fetch failed: ${profilesError.message}`)
      }

      console.log(`✅ Profiles fetched: ${profiles?.length || 0} students`)

      if (!profiles || profiles.length === 0) {
        console.log('⚠️ No student profiles found')
        setRankings([])
        setStats({
          totalActiveStudents: 0,
          averageClassGrade: 0,
          totalSubmissions: 0,
          completionRate: 0,
          topPerformer: 'N/A',
          mostImproved: 'N/A'
        })
        return
      }

      // Fetch all submissions
      console.log('📝 Fetching submissions...')
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          student_id,
          points,
          status,
          submitted_at,
          graded_at,
          task_id
        `)

      if (submissionsError) {
        console.error('❌ Error fetching submissions:', submissionsError)
        throw new Error(`Submissions fetch failed: ${submissionsError.message}`)
      }

      console.log(`✅ Submissions fetched: ${submissions?.length || 0} submissions`)

      // Fetch all tasks separately to avoid join issues
      console.log('📋 Fetching tasks...')
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, max_score')

      if (tasksError) {
        console.error('❌ Error fetching tasks:', tasksError)
        throw new Error(`Tasks fetch failed: ${tasksError.message}`)
      }

      console.log(`✅ Tasks fetched: ${tasks?.length || 0} tasks`)

      // Create a map of task_id to max_score for quick lookup
      const taskScoreMap = new Map()
      tasks?.forEach(task => {
        taskScoreMap.set(task.id, task.max_score || 100)
      })
      console.log(`📊 Task score map created with ${taskScoreMap.size} entries`)

      // Fetch course enrollments (optional - don't fail if this doesn't work)
      console.log('🎓 Fetching course enrollments...')
      let enrollments: { student_id: string; course_id: string }[] = []
      try {
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('student_id, course_id')

        if (enrollmentsError) {
          console.warn('⚠️ Course enrollments table not found (non-critical):', enrollmentsError)
          enrollments = []
        } else {
          enrollments = enrollmentsData || []
          console.log(`✅ Enrollments fetched: ${enrollments.length} enrollments`)
        }
      } catch (enrollmentError) {
        console.warn('⚠️ Enrollment fetch failed (continuing without):', enrollmentError)
        enrollments = []
      }

      // Process data for each student
      console.log('🔄 Processing student data...')
      const rankingData: StudentRankingData[] = []

      for (let i = 0; i < (profiles?.length || 0); i++) {
        const profile = profiles[i]
        console.log(`👤 Processing student ${i + 1}/${profiles.length}: ${profile.full_name || `User ${profile.id}`}`)
        const studentSubmissions = submissions?.filter(s => s.student_id === profile.id) || []
        const studentEnrollments = enrollments?.filter(e => e.student_id === profile.id) || []

        if (studentSubmissions.length === 0) continue // Skip students with no submissions

        const gradedSubmissions = studentSubmissions.filter(s => s.status === 'graded' && s.points !== null)
        const pendingSubmissions = studentSubmissions.filter(s => s.status === 'submitted')

        // Calculate grades and points
        const grades = gradedSubmissions.map(s => s.points || 0)
        const totalPoints = grades.reduce((sum, points) => sum + points, 0)
        const averageGrade = grades.length > 0 ? totalPoints / grades.length : 0
        const bestGrade = grades.length > 0 ? Math.max(...grades) : 0
        const worstGrade = grades.length > 0 ? Math.min(...grades) : 0

        // Calculate max possible points using our task score map
        const maxPossiblePoints = gradedSubmissions.reduce((sum, sub) => {
          const maxScore = taskScoreMap.get(sub.task_id) || 100
          return sum + maxScore
        }, 0)

        // Calculate completion rate
        const completionRate = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0

        // Grade distribution
        const gradeDistribution = {
          excellent: grades.filter(g => g >= 90).length,
          good: grades.filter(g => g >= 80 && g < 90).length,
          fair: grades.filter(g => g >= 70 && g < 80).length,
          poor: grades.filter(g => g < 70).length
        }

        // Recent activity
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const submissionsLast7Days = studentSubmissions.filter(s => 
          new Date(s.submitted_at) >= sevenDaysAgo
        ).length

        const submissionsLast30Days = studentSubmissions.filter(s => 
          new Date(s.submitted_at) >= thirtyDaysAgo
        ).length

        const lastSubmissionDate = studentSubmissions.length > 0 
          ? studentSubmissions.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0].submitted_at
          : null

        // Only add students with submissions to avoid empty rows
        if (studentSubmissions.length > 0) {
          rankingData.push({
            studentId: profile.id,
            studentName: profile.full_name || 'Unknown',
            email: `${profile.id}@student.local`, // Placeholder since email isn't in user_profiles
            totalSubmissions: studentSubmissions.length,
            gradedSubmissions: gradedSubmissions.length,
            pendingSubmissions: pendingSubmissions.length,
            averageGrade,
            totalPoints,
            maxPossiblePoints,
            completionRate,
            lastSubmissionDate,
            rank: 0, // Will be assigned after sorting
            coursesEnrolled: studentEnrollments.length,
            bestGrade,
            worstGrade,
            gradeDistribution,
            recentActivity: {
              submissionsLast7Days,
              submissionsLast30Days
            }
          })
        }
      }

      console.log(`✅ Processed ${rankingData.length} students with submissions`)

      // Sort by average grade and assign ranks
      rankingData.sort((a, b) => b.averageGrade - a.averageGrade)
      rankingData.forEach((student, index) => {
        student.rank = index + 1
      })

      setRankings(rankingData)
      console.log(`📊 Rankings set with ${rankingData.length} students`)

      // Calculate overall stats
      if (rankingData.length > 0) {
        const totalActiveStudents = rankingData.length
        const averageClassGrade = rankingData.reduce((sum, s) => sum + s.averageGrade, 0) / totalActiveStudents
        const totalSubmissions = rankingData.reduce((sum, s) => sum + s.totalSubmissions, 0)
        const overallCompletionRate = rankingData.reduce((sum, s) => sum + s.completionRate, 0) / totalActiveStudents
        const topPerformer = rankingData[0]?.studentName || 'N/A'
        
        // Find most improved (student with best recent performance vs overall)
        const mostImprovedStudent = rankingData.length > 1 ? rankingData.reduce((prev, current) => {
          const prevImprovement = prev.recentActivity.submissionsLast7Days - (prev.averageGrade / 100)
          const currentImprovement = current.recentActivity.submissionsLast7Days - (current.averageGrade / 100)
          return currentImprovement > prevImprovement ? current : prev
        }, rankingData[0]) : rankingData[0]

        setStats({
          totalActiveStudents,
          averageClassGrade,
          totalSubmissions,
          completionRate: overallCompletionRate,
          topPerformer,
          mostImproved: mostImprovedStudent?.studentName || 'N/A'
        })
      } else {
        // Set default stats when no data
        setStats({
          totalActiveStudents: 0,
          averageClassGrade: 0,
          totalSubmissions: 0,
          completionRate: 0,
          topPerformer: 'N/A',
          mostImproved: 'N/A'
        })
      }

      console.log('🎉 Rankings data fetch completed successfully')

    } catch (error) {
      console.error('💥 Error fetching rankings data:', error)
      if (error instanceof Error) {
        console.error('📋 Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      } else {
        console.error('📋 Unknown error type:', error)
      }
      
      // Set empty data on error to prevent UI crashes
      setRankings([])
      setStats({
        totalActiveStudents: 0,
        averageClassGrade: 0,
        totalSubmissions: 0,
        completionRate: 0,
        topPerformer: 'N/A',
        mostImproved: 'N/A'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedRankings = rankings
    .filter(student => 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'name':
          aVal = a.studentName
          bVal = b.studentName
          break
        case 'average':
          aVal = a.averageGrade
          bVal = b.averageGrade
          break
        case 'submissions':
          aVal = a.totalSubmissions
          bVal = b.totalSubmissions
          break
        case 'completion':
          aVal = a.completionRate
          bVal = b.completionRate
          break
        default:
          aVal = a.rank
          bVal = b.rank
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

  const exportToCSV = () => {
    const csvContent = [
      ['Rank', 'Name', 'Email', 'Average Grade', 'Total Submissions', 'Completion Rate', 'Total Points', 'Last Submission'],
      ...filteredAndSortedRankings.map(student => [
        student.rank,
        student.studentName,
        student.email,
        student.averageGrade.toFixed(1),
        student.totalSubmissions,
        student.completionRate.toFixed(1) + '%',
        student.totalPoints,
        student.lastSubmissionDate ? new Date(student.lastSubmissionDate).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-rankings.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="text-center">
            <div className="animate-pulse bg-gradient-to-br from-indigo-500/30 to-purple-500/30 w-20 h-20 rounded-3xl mx-auto mb-4" />
            <div className="h-8 w-64 bg-gray-200/60 rounded-lg mx-auto animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200/50 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/70 rounded-3xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/70 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Student Rankings <span className="text-amber-500">🏆</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Comprehensive overview of student performance, engagement, and progress metrics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-md">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalActiveStudents}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-green-400/10 via-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-md">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Class Average</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageClassGrade.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-purple-400/10 via-fuchsia-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl text-white shadow-md">
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
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 blur-md transition" />
            <div className="relative bg-white/65 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 ease-out hover:bg-white/75 hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-md">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-900">Top Performer</h3>
            </div>
            <p className="text-2xl font-bold text-amber-800">{stats.topPerformer}</p>
            <p className="text-sm text-amber-600">Highest average grade</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Most Active</h3>
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.mostImproved}</p>
            <p className="text-sm text-green-600">Highest recent activity</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rank' | 'name' | 'average' | 'submissions' | 'completion')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="rank">Sort by Rank</option>
                <option value="name">Sort by Name</option>
                <option value="average">Sort by Average</option>
                <option value="submissions">Sort by Submissions</option>
                <option value="completion">Sort by Completion</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Rankings Table */}
        <div className="space-y-4">
          {filteredAndSortedRankings.map((student) => (
            <div key={student.studentId} className="relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-300/30 via-purple-300/30 to-pink-300/30 opacity-0 group-hover:opacity-100 blur-md transition" />
              <div className="relative rounded-2xl bg-white/65 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-400 ease-out hover:-translate-y-0.5 hover:bg-white/80">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                        student.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        student.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        student.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                        'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                        #{student.rank}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{student.studentName}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{student.averageGrade.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">Average Grade</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent mb-4" />

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{student.totalSubmissions}</div>
                      <div className="text-xs text-blue-600">Total Submissions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{student.gradedSubmissions}</div>
                      <div className="text-xs text-green-600">Graded</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">{student.pendingSubmissions}</div>
                      <div className="text-xs text-yellow-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{student.completionRate.toFixed(1)}%</div>
                      <div className="text-xs text-purple-600">Completion</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-lg font-bold text-indigo-600">{student.coursesEnrolled}</div>
                      <div className="text-xs text-indigo-600">Courses</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-600">{student.recentActivity.submissionsLast7Days}</div>
                      <div className="text-xs text-gray-600">Last 7 Days</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Best: {student.bestGrade}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Worst: {student.worstGrade}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last: {student.lastSubmissionDate 
                          ? new Date(student.lastSubmissionDate).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {student.gradeDistribution.excellent} A&apos;s
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {student.gradeDistribution.good} B&apos;s
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {student.gradeDistribution.fair} C&apos;s
                      </span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {student.gradeDistribution.poor} D&apos;s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedRankings.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

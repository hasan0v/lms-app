'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// Icon Components
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
)

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const { signIn } = useAuth()

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setTouchedFields(prev => new Set([...prev, 'email']))
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setTouchedFields(prev => new Set([...prev, 'password']))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      }
      // Navigation will be handled by AuthContext
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/15 to-indigo-400/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-2xl animate-pulse-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-indigo-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-5 h-5 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header aligned with main page */}
      <header className="relative z-20">
        <nav className="glass backdrop-blur-xl border-0 shadow-xl bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="logo-container group inline-flex items-center gap-2">
                <h1 className="logo-text logo-text-medium group-hover:opacity-90 transition">SÜNİ İNTELLEKT</h1>
              </Link>
              <div className="flex items-center gap-3">
                <Link href="/auth/signin" className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-700 transition">Daxil ol</Link>
                <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white text-sm font-bold shadow hover:shadow-md transition">
                  <span className="text-yellow-300">⚡</span> Qeydiyyat
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-10 mt-4">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-40 animate-pulse-gentle"></div>
                <div className="relative glass-card p-6 rounded-3xl border-2 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500">
                  <div className="logo-container">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Süni İntellekt
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-4">
              Yenidən Xoş Gəldiniz! <span className="text-yellow-400">👋</span>
            </h2>
            <p className="text-gray-700 text-lg font-medium">
              Öyrənmə səyahətinə davam etmək üçün daxil olun
            </p>
            <p className="mt-6 text-gray-500 text-lg">
              Hesabınız yoxdur?{' '}
              <Link href="/auth/signup" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
                Burada yaradın
              </Link>
            </p>
          </div>
          
          {/* Enhanced Form */}
          <div className="glass-card p-10 animate-fade-in-up border border-white/25 shadow-xl hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '0.2s' }}>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200/50 text-red-700 px-6 py-4 rounded-2xl animate-fade-in-scale shadow-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Enhanced Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Email Ünvanı
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MailIcon />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full pl-14 pr-4 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('email') && !validateEmail(email) && email
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Email ünvanınızı daxil edin"
                    />
                  </div>
                  {touchedFields.has('email') && !validateEmail(email) && email && (
                    <p className="mt-3 text-red-600 animate-fade-in-up font-semibold">Please enter a valid email address</p>
                  )}
                </div>
                
                {/* Enhanced Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Şifrə
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockIcon />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
            className={`w-full pl-14 pr-14 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('password') && !password.trim()
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Şifrənizi daxil edin"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {touchedFields.has('password') && !password.trim() && (
                    <p className="mt-3 text-red-600 animate-fade-in-up font-semibold">Şifrə tələb olunur</p>
                  )}
                </div>
              </div>

              {/* Enhanced Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      <span>Daxil edilirsiniz...</span>
                    </div>
                  ) : (
                    <>
                      <span>Daxil ol və Davam et</span>
                      <svg className="w-6 h-6 ml-3 inline transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Enhanced Forgot Password Link */}
              <div className="text-center">
                <a href="#" className="text-lg text-indigo-600 hover:text-indigo-500 font-bold transition-colors hover:underline">
                  Şifrəni unutmusunuz? 🔐
                </a>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-gray-500">
              Kömək lazımdır? {' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                dəstək komandasına yazın
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ValidationState {
  isValid: boolean
  message: string
}

interface PasswordValidation {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  overall: boolean
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailValidation, setEmailValidation] = useState<ValidationState>({ isValid: true, message: '' })
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    overall: false
  })
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const { signUp } = useAuth()
  const router = useRouter()

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation function
  const validatePassword = (password: string): PasswordValidation => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      overall: false
    }
    
    validation.overall = validation.length && validation.uppercase && validation.lowercase && validation.number
    return validation
  }

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value)
    setTouchedFields(prev => new Set([...prev, 'email']))
    
    if (!value) {
      setEmailValidation({ isValid: true, message: '' })
      return
    }
    
    if (!validateEmail(value)) {
      setEmailValidation({ isValid: false, message: 'Please enter a valid email address' })
      return
    }
    
    setEmailValidation({ isValid: true, message: 'Email format is valid' })
  }

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setTouchedFields(prev => new Set([...prev, 'password']))
    const validation = validatePassword(value)
    setPasswordValidation(validation)
  }

  // Handle full name change
  const handleFullNameChange = (value: string) => {
    setFullName(value)
    setTouchedFields(prev => new Set([...prev, 'fullName']))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!passwordValidation.overall) {
      setError('Password does not meet the required criteria')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        if (error.includes('already registered') || error.includes('already exists') || error.includes('User already registered')) {
          setError('This email is already associated with an existing account')
        } else {
          setError(error)
        }
        return
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.replace('/auth/signin')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/15 to-indigo-400/15 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-2xl animate-pulse-gentle"></div>
          <div className="absolute top-20 left-20 w-4 h-4 bg-indigo-400/40 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 right-32 w-6 h-6 bg-purple-400/40 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-5 h-5 bg-blue-400/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Header */}
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

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center animate-fade-in-up">
            <div className="glass-card bg-green-50/80 border border-green-200/50 text-green-800 px-8 py-8 rounded-2xl backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              </div>
              <h3 className="font-bold text-xl mb-3">Hesab Uğurla Yaradıldı!</h3>
              <p className="text-sm font-medium">Hesabınızı təsdiqləmək və quraşdırmanı tamamlamaq üçün emailinizi yoxlayın.</p>
            </div>
          </div>
        </div>
      </div>
    )
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
              İnqilaba Qoşul <span className="text-yellow-400">✨</span>
            </h2>
            <p className="text-gray-600 text-xl font-light mb-6">
              Hesab yaradın və AI dəstəklı öyrənmə səyahətinə başlayın
            </p>
            <p className="text-gray-500 text-lg">
              Artıq hesabınız var?{' '}
              <Link href="/auth/signin" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
                Buradan daxil olun
              </Link>
            </p>
          </div>

          {/* Enhanced Form */}
          <div className="glass-card p-10 relative z-10 border border-white/25 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200/50 text-red-700 px-6 py-4 rounded-2xl animate-fade-in-scale shadow-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-3 text-xl">⚠️</span>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Enhanced Full Name Field */}
                <div className="form-group">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Tam Ad
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('fullName') && !fullName.trim() 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                          : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
                      } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Tam adınızı daxil edin"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xl">👤</span>
                    </div>
                  </div>
                  {touchedFields.has('fullName') && !fullName.trim() && (
                    <p className="mt-3 text-red-600 font-semibold flex items-center animate-fade-in-up">
                      <span className="mr-2">⚠️</span>
                      Tam ad tələb olunur
                    </p>
                  )}
                </div>
                
                {/* Enhanced Email Field */}
                <div className="form-group">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Email Ünvanı
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('email') && !emailValidation.isValid
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : touchedFields.has('email') && emailValidation.isValid && email
              ? 'border-green-300 focus:border-green-500 bg-green-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Email ünvanınızı daxil edin"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xl">📧</span>
                    </div>
                    {touchedFields.has('email') && email && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <span className={`text-2xl ${emailValidation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {emailValidation.isValid ? '✅' : '❌'}
                        </span>
                      </div>
                    )}
                  </div>
                  {touchedFields.has('email') && emailValidation.message && (
                    <p className={`mt-3 font-semibold ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'} flex items-center animate-fade-in-up`}>
                      <span className="mr-2">{emailValidation.isValid ? '✅' : '⚠️'}</span>
                      {emailValidation.message}
                    </p>
                  )}
                </div>
                
                {/* Enhanced Password Field */}
                <div className="form-group">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Şifrə
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('password') && !passwordValidation.overall && password
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : touchedFields.has('password') && passwordValidation.overall
              ? 'border-green-300 focus:border-green-500 bg-green-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Güclü şifrə yaradın"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xl">🔒</span>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl">
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    </button>
                  </div>
                  
                  {/* Enhanced Password Requirements */}
                  {touchedFields.has('password') && password && (
                    <div className="mt-4 p-6 glass-card rounded-2xl animate-fade-in-up border border-white/30">
                      <p className="text-lg font-bold text-gray-700 mb-4">Şifrə Tələbləri:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.length ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.length ? '✅' : '❌'}</span>
                          <span className="font-semibold">Ən azı 8 simvol</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.uppercase ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir böyük hərf</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.lowercase ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir kiçik hərf</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.number ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.number ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir rəqəm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Submit Button */}
        <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !emailValidation.isValid || !passwordValidation.overall || !fullName.trim()}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      <span>Hesabınız yaradılır...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-3 text-2xl">🚀</span>
                      <span>Hesab Yarat</span>
                    </div>
                  )}
                </button>
                {(!emailValidation.isValid || !passwordValidation.overall || !fullName.trim()) && (
          <p className="mt-4 text-gray-500 text-center text-sm font-medium">
                    Davam etmək üçün bütün sahələri düzgün doldurun
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

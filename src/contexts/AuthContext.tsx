'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'
import { ensureStorageBuckets } from '@/lib/storage'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean              // overall initial auth loading (session + first profile fetch)
  profileError: string | null   // profile-specific error state
  refreshingProfile: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearProfileCache: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [refreshingProfile, setRefreshingProfile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const PROFILE_CACHE_VERSION = 1
  const PROFILE_CACHE_KEY = `profile-cache-v${PROFILE_CACHE_VERSION}`

  const loadCachedProfile = useCallback((uid: string) => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.profile?.id === uid) {
        setProfile(parsed.profile)
      }
    } catch (e) {
      console.warn('Failed to parse cached profile', e)
    }
  }, [PROFILE_CACHE_KEY])

  const writeCachedProfile = useCallback((data: UserProfile | null) => {
    if (typeof window === 'undefined') return
    try {
      if (!data) {
        localStorage.removeItem(PROFILE_CACHE_KEY)
        return
      }
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile: data, updatedAt: Date.now(), version: PROFILE_CACHE_VERSION }))
    } catch (e) {
      console.warn('Failed to write cached profile', e)
    }
  }, [PROFILE_CACHE_KEY, PROFILE_CACHE_VERSION])

  const clearProfileCache = useCallback(() => {
    if (typeof window === 'undefined') return
    try { localStorage.removeItem(PROFILE_CACHE_KEY) } catch {}
  }, [PROFILE_CACHE_KEY])

  useEffect(() => {
    setIsClient(true)

    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      console.warn('Supabase not configured properly')
      setLoading(false)
      return
    }
    
    // Initialize storage buckets when app starts
    ensureStorageBuckets().catch(console.error)
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(null)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('No profile found for user:', userId)
          setProfile(null)
          writeCachedProfile(null)
          return
        }
        setProfileError(error.message)
        throw error
      }
      setProfile(data)
      writeCachedProfile(data)
    } catch (error: unknown) {
      console.error('Error in fetchProfile:', error)
      if (!profileError) {
        setProfileError('Failed to load profile')
      }
    }
  }, [profileError, writeCachedProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    setRefreshingProfile(true)
    try {
      await fetchProfile(user.id)
    } finally {
      setRefreshingProfile(false)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isClient) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Optimistic: load cached profile immediately if present
        loadCachedProfile(session.user.id)
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        loadCachedProfile(session.user.id)
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        clearProfileCache()
      }

      setLoading(false)

      // Only redirect on client side, and avoid ping-pong by checking current path
      if (typeof window !== 'undefined') {
        if (event === 'SIGNED_IN') {
          // If coming from any /auth/* page, send to dashboard
          if (pathname?.startsWith('/auth')) {
            router.replace('/dashboard')
          }
        } else if (event === 'SIGNED_OUT') {
          if (!pathname?.startsWith('/auth')) {
            router.replace('/auth/signin')
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname, isClient, fetchProfile, loadCachedProfile, clearProfileCache])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: 'Authentication service not configured' }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error: error?.message }
  }

  const signIn = async (email: string, password: string) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: 'Authentication service not configured' }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error?.message }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearProfileCache()
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    profileError,
    refreshingProfile,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    clearProfileCache,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

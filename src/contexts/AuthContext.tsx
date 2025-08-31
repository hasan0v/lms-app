'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'
import { ensureStorageBuckets } from '@/lib/storage'
import { requestManager } from '@/lib/request-manager'

type AuthState = 'INITIALIZING' | 'AUTHENTICATING' | 'FETCHING_PROFILE' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR'

interface AuthError {
  type: 'SESSION' | 'PROFILE' | 'NETWORK'
  message: string
  retryable?: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  authState: AuthState
  authError: AuthError | null
  loading: boolean
  refreshingProfile: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authState, setAuthState] = useState<AuthState>('INITIALIZING')
  const [authError, setAuthError] = useState<AuthError | null>(null)
  const [refreshingProfile, setRefreshingProfile] = useState(false)
  
  const isFetchingProfile = useRef(false)
  const lastFetchTimeRef = useRef<number>(0)
  
  const loading = authState === 'INITIALIZING' || authState === 'FETCHING_PROFILE'

  const PROFILE_CACHE_KEY = 'profile-cache-v1'

  const writeToCache = (data: UserProfile) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ profile: data, timestamp: Date.now() }))
    } catch (e) {
      console.warn('Failed to write to profile cache', e)
    }
  }

  const loadFromCache = (userId: string): UserProfile | null => {
    try {
      const item = localStorage.getItem(PROFILE_CACHE_KEY)
      if (!item) return null
      const { profile, timestamp } = JSON.parse(item)
      if (profile.id !== userId) {
        localStorage.removeItem(PROFILE_CACHE_KEY)
        return null
      }
      // Cache is valid for 5 minutes
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        localStorage.removeItem(PROFILE_CACHE_KEY)
        return null
      }
      return profile
    } catch (e) {
      console.warn('Failed to read from profile cache', e)
      return null
    }
  }
  
  const clearCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    } catch (e) {
      console.warn('Failed to clear profile cache', e)
    }
  }

  const fetchProfile = useCallback(async (userId: string, isRetry = false) => {
    if (isFetchingProfile.current && !isRetry) {
      console.log('[Auth] Profile fetch already in progress.')
      return
    }

    const now = Date.now()
    if (now - lastFetchTimeRef.current < 5000 && !isRetry) {
      console.log('[Auth] Profile fetch throttled.')
      return
    }

    isFetchingProfile.current = true
    lastFetchTimeRef.current = now
    setAuthState('FETCHING_PROFILE')

    const context = 'auth-profile'
    const key = `profile-${userId}`

    if (requestManager.isCircuitBreakerOpen(context, key)) {
      setAuthError({ type: 'PROFILE', message: 'Service temporarily unavailable.', retryable: false })
      isFetchingProfile.current = false
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
      writeToCache(data)
      setAuthState('AUTHENTICATED')
      setAuthError(null)
      requestManager.recordSuccess(context, key)
    } catch (error: unknown) {
      console.error('[Auth] Error fetching profile:', error)
      setAuthError({ type: 'PROFILE', message: 'Failed to load profile.', retryable: true })
      setAuthState('ERROR')
      requestManager.recordFailure(context, key)
    } finally {
      isFetchingProfile.current = false
    }
  }, [])

  useEffect(() => {
    ensureStorageBuckets().catch(console.error)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const cachedProfile = loadFromCache(session.user.id)
        if (cachedProfile) {
          setProfile(cachedProfile)
          setAuthState('AUTHENTICATED')
        } else {
          fetchProfile(session.user.id)
        }
      } else {
        setAuthState('UNAUTHENTICATED')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN') {
        if (session?.user) {
          fetchProfile(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        clearCache()
        setAuthState('UNAUTHENTICATED')
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    return { error: error?.message }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    clearCache()
  }

  const refreshProfile = useCallback(() => {
    if (!user) return
    setRefreshingProfile(true)
    fetchProfile(user.id, true).finally(() => setRefreshingProfile(false))
  }, [user, fetchProfile])

  const value: AuthContextType = {
    user,
    profile,
    session,
    authState,
    authError,
    loading,
    refreshingProfile,
    signUp,
    signIn,
    signOut,
    refreshProfile,
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

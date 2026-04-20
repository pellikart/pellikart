import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export type AppRole = 'couple' | 'vendor'

export interface Profile {
  id: string
  role: AppRole
  subscription_tier: 'free' | 'silver' | 'gold'
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  /** Update the role in the profiles table (called after role selection during signup) */
  updateRole: (role: AppRole) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, subscription_tier')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[auth] Failed to fetch profile:', error.message)
      return null
    }
    return data as Profile
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Safety timeout — never stay on loading screen forever
    const timeout = setTimeout(() => {
      console.warn('[auth] Timed out — clearing loading state')
      setLoading(false)
    }, 4000)

    // Listen for auth changes (catches OAuth callback + initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        console.log('[auth] event:', event, s?.user?.email ?? 'no user')
        setSession(s)
        setUser(s?.user ?? null)

        if (s?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }

        clearTimeout(timeout)
        setLoading(false)
      }
    )

    // Also check for existing session directly
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      console.log('[auth] getSession:', s?.user?.email ?? 'no session')
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        setProfile(p)
      }
      clearTimeout(timeout)
      setLoading(false)
    }).catch((err) => {
      console.error('[auth] getSession error:', err)
      clearTimeout(timeout)
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  async function updateRole(role: AppRole) {
    if (!supabase || !user) return
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    if (error) {
      console.error('[auth] Failed to update role:', error.message)
      return
    }
    setProfile(prev => prev ? { ...prev, role } : null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, updateRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, subscription_tier')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('[auth] Failed to fetch profile:', error.message)
        return null
      }

      // If profile doesn't exist (trigger didn't fire or row was deleted), create it
      if (!data) {
        console.log('[auth] Profile missing — creating one')
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({ id: userId, role: 'couple' })
          .select('id, role, subscription_tier')
          .maybeSingle()
        if (insertErr) {
          console.error('[auth] Failed to create profile:', insertErr.message)
          return null
        }
        return newProfile as Profile
      }

      console.log('[auth] Profile loaded:', data)
      return data as Profile
    } catch (err) {
      console.error('[auth] Profile fetch threw:', err)
      return null
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Listen for auth changes (catches OAuth callback + initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        console.log('[auth] event:', event, s?.user?.email ?? 'no user')
        setSession(s)
        setUser(s?.user ?? null)

        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }

        // Clear loading immediately when we know the auth state.
        // Profile is fetched in the background — the app can render
        // without it (we have the user object).
        setLoading(false)

        // Fetch profile in background (non-blocking)
        if (s?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          fetchProfile(s.user.id).then(p => {
            console.log('[auth] Profile result:', p ? `role=${p.role}` : 'NULL — profile not found in DB')
            setProfile(p)
          })
        }
      }
    )

    return () => subscription.unsubscribe()
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

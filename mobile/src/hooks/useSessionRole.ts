// Session role resolution — a port of the `LiveApp` component in the web app's
// src/App.tsx (lines 95-187). The rules are subtle and were arrived at by
// fixing real bugs ("the vendor's pick got wiped and they became a couple"), so
// this deliberately reproduces them rather than inventing a simpler scheme:
//
//   1. A role picked during this registration wins.
//   2. Otherwise the role saved on the profile wins — it is authoritative,
//      because every deliberate switch is persisted.
//   3. Otherwise a completed vendor record implies 'vendor' (safety net for a
//      profile whose role somehow never got written).
//   4. Otherwise the account is undecided and must choose.
//
// Once a role is committed for a session it is locked in a ref: later renders
// (a profile finishing loading, say) must never flip it mid-session.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, type AppRole } from '@shared/auth-context'
import { fetchVendor, fetchProfileRole } from '@shared/supabase-db'
import { useStore } from '@shared/store'
import { useVendorStore } from '@shared/vendor-store'
import { clearPendingRole, readPendingRole } from '@/lib/auth'

export type SessionState =
  /** Auth or the per-user lookups are still resolving — show the splash. */
  | { status: 'loading' }
  /** No session. */
  | { status: 'signed-out' }
  /** Signed in, but the account has never chosen couple vs vendor. */
  | { status: 'needs-role'; commitRole: (role: AppRole) => void }
  /** Signed in with a committed role and both stores initialised in live mode. */
  | { status: 'ready'; role: AppRole }

export function useSessionRole(): SessionState {
  const { user, loading, updateRole } = useAuth()
  const initStore = useStore((s) => s.initLiveMode)
  const initVendorStore = useVendorStore((s) => s.initLiveMode)

  // undefined = not fetched yet, null = fetched but undecided, 'couple' |
  // 'vendor' = a real saved choice. The three-state distinction is what stops
  // the app flashing the wrong flow before we know where to send the user.
  const [dbRole, setDbRole] = useState<AppRole | null | undefined>(undefined)
  const [hasCompletedVendor, setHasCompletedVendor] = useState<boolean | null>(null)
  const [pendingRole, setPendingRoleState] = useState<AppRole | null | undefined>(undefined)
  const [initialized, setInitialized] = useState(false)
  const [needsRoleChoice, setNeedsRoleChoice] = useState(false)

  const committedRoleRef = useRef<AppRole | null>(null)

  // One-shot lookup per user.
  useEffect(() => {
    setInitialized(false)
    setNeedsRoleChoice(false)
    committedRoleRef.current = null

    if (!user) {
      setHasCompletedVendor(null)
      setDbRole(undefined)
      setPendingRoleState(undefined)
      return
    }

    let cancelled = false
    fetchVendor(user.id).then((v) => {
      if (!cancelled) setHasCompletedVendor(!!(v && v.onboarding_complete))
    })
    fetchProfileRole(user.id).then((r) => {
      if (!cancelled) setDbRole(r)
    })
    // On the web this is a synchronous localStorage read; AsyncStorage makes it
    // one more thing to wait on before resolving.
    readPendingRole().then((r) => {
      if (!cancelled) setPendingRoleState(r)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const commitRole = useCallback(
    (role: AppRole, persist = true) => {
      if (!user) return
      committedRoleRef.current = role
      setDbRole(role)
      setNeedsRoleChoice(false)
      // Persist so every future login uses it. Skipped when the DB already
      // matches, to avoid a needless write on each returning-user login.
      if (persist) void updateRole(role)
      setPendingRoleState(null)
      void clearPendingRole()
      void initStore(user.id, role)
      if (role === 'vendor') void initVendorStore(user.id)
      setInitialized(true)
    },
    [user, updateRole, initStore, initVendorStore]
  )

  // Resolve once everything we need has loaded.
  useEffect(() => {
    if (!user || hasCompletedVendor === null || dbRole === undefined || pendingRole === undefined) {
      return
    }
    if (committedRoleRef.current) return

    let role: AppRole | null
    if (pendingRole === 'couple' || pendingRole === 'vendor') role = pendingRole
    else if (dbRole === 'couple' || dbRole === 'vendor') role = dbRole
    else if (hasCompletedVendor) role = 'vendor'
    else role = null

    if (!role) {
      setNeedsRoleChoice(true)
      return
    }
    commitRole(role, dbRole !== role)
  }, [user, hasCompletedVendor, dbRole, pendingRole, commitRole])

  if (loading) return { status: 'loading' }
  if (!user) return { status: 'signed-out' }
  if (hasCompletedVendor === null || dbRole === undefined || pendingRole === undefined) {
    return { status: 'loading' }
  }
  if (needsRoleChoice) return { status: 'needs-role', commitRole: (r) => commitRole(r) }
  if (!initialized || !committedRoleRef.current) return { status: 'loading' }
  return { status: 'ready', role: committedRoleRef.current }
}

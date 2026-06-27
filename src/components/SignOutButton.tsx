import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Sign out of the live app. Calls supabase signOut directly (NOT useAuth, which
 * only exists inside AuthProvider / the live app — this component is also used on
 * shared pages that render in demo mode). A hard reload then drops all in-memory
 * store state and lands the user on the auth screen.
 */
export default function SignOutButton({ className = '' }: { className?: string }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function doSignOut() {
    setBusy(true)
    try { await supabase?.auth.signOut() } catch { /* ignore — we reload regardless */ }
    window.location.reload()
  }

  if (confirming) {
    return (
      <div className={className}>
        <p className="text-[12px] text-gray-600 mb-2">Sign out of Pellikart?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-card-border text-gray-600 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={doSignOut}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={className || 'w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold active:bg-red-50 transition-colors'}
    >
      Sign out
    </button>
  )
}

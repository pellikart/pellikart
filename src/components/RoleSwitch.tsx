import { useState } from 'react'
import { useOptionalAuth } from '@/lib/auth-context'

/** The escape hatch: lets a signed-in user move to the other side of the app.
 *  Persists the new role (so it sticks on every future login) and reloads so the
 *  app re-resolves cleanly into the target flow. `to` is the role to switch to.
 *
 *  This is what rescues anyone who was silently defaulted to the wrong side. */
export default function RoleSwitch({
  to,
  className = '',
}: {
  to: 'couple' | 'vendor'
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const auth = useOptionalAuth()
  // Demo mode (no auth provider) or logged-out — nothing to switch.
  if (!auth || !auth.user) return null
  const { updateRole } = auth

  const label = to === 'vendor' ? "I'm a vendor" : "I'm planning a wedding"
  const hint = to === 'vendor' ? 'Switch to the vendor side' : 'Switch to the couple side'

  async function handleSwitch() {
    if (busy) return
    if (!window.confirm(`${hint}? You can switch back anytime.`)) return
    setBusy(true)
    try {
      await updateRole(to)
      // Full reload so LiveApp re-resolves the role from the DB into the new flow.
      window.location.assign('/app')
    } catch {
      setBusy(false)
      window.alert("Couldn't switch right now. Please try again.")
    }
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={busy}
      className={className || 'text-[12px] font-medium text-magenta hover:underline disabled:opacity-60'}
      title={hint}
    >
      {busy ? 'Switching…' : `${label} →`}
    </button>
  )
}

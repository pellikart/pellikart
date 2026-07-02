import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAdminUser } from '@/lib/supabase-db'

/** Renders a link into the admin panel, but only for allowlisted admins. Safe
 *  to drop anywhere in the app — it self-checks and renders nothing otherwise
 *  (including in demo mode, where the RPC returns false). */
export default function AdminLink({ className = '' }: { className?: string }) {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    let cancelled = false
    isAdminUser().then(ok => { if (!cancelled) setIsAdmin(ok) })
    return () => { cancelled = true }
  }, [])

  if (!isAdmin) return null
  return (
    <Link
      to="/admin"
      className={className || 'block text-[13px] font-semibold text-magenta hover:underline'}
    >
      Admin panel →
    </Link>
  )
}

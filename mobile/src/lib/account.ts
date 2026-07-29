// Account deletion (Apple requirement — must be doable in-app).
//
// Calls the delete-account edge function, which admin-deletes the auth user and
// cascades their data. Returns a discriminated result so the UI can show a real
// error but treat an unconfigured backend (demo) as a no-op leave.

import { supabase } from '@/lib/supabase.native'

export type DeleteResult = { ok: true } | { ok: false; configured: boolean; error: string }

export async function deleteAccount(): Promise<DeleteResult> {
  if (!supabase) return { ok: false, configured: false, error: 'Not configured' }
  const { data, error } = await supabase.functions.invoke('delete-account')
  if (error || data?.error) {
    return { ok: false, configured: true, error: error?.message || data?.error || 'Delete failed' }
  }
  return { ok: true }
}

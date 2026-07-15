import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { claimVendor } from '@/lib/supabase-db'

/** Vendor-side: a person Pellikart pre-onboarded logs in with Google, then
 *  enters the claim code and/or phone we gave them to take ownership of the
 *  profile we built. On success the whole vendor dashboard "just works" because
 *  the vendor row's user_id now points at their account. */
export default function ClaimPage() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function signInWithGoogle() {
    if (!supabase) return
    // Redirect to the allowlisted /app callback and let the stamped intent route
    // back here after login — /app/claim as a direct OAuth target is dropped
    // unless separately allowlisted in Supabase.
    localStorage.setItem('pellikart_post_login', 'claim')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    })
  }

  async function handleClaim() {
    if (!code.trim() && !phone.trim()) {
      setError('Enter the code we sent you, or your phone number.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await claimVendor(code, phone)
      setDone(true)
      // Full reload so the app re-detects the now-owned vendor and routes into
      // the vendor dashboard with all the pre-entered data.
      setTimeout(() => window.location.assign('/app'), 900)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  // Must be logged in first — the claim is tied to their account.
  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white text-center">
        <img src="/logo.png" alt="Pellikart" className="w-16 h-16 rounded-2xl object-cover mb-5" />
        <h1 className="text-[20px] font-bold text-dark">Claim your vendor profile</h1>
        <p className="text-[13px] text-gray-500 mt-2 max-w-xs">Sign in first, then enter the code Pellikart sent you.</p>
        <button onClick={signInWithGoogle} className="w-full max-w-sm mt-7 py-3 rounded-xl border border-card-border bg-white text-dark font-medium text-[14px] flex items-center justify-center gap-3 hover:bg-gray-50">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h1 className="text-[18px] font-bold text-dark">You're all set!</h1>
        <p className="text-[13px] text-gray-500 mt-2">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <img src="/logo.png" alt="Pellikart" className="w-16 h-16 rounded-2xl object-cover mb-5" />
      <h1 className="text-[20px] font-bold text-dark text-center">Claim your vendor profile</h1>
      <p className="text-[13px] text-gray-500 mt-2 text-center max-w-xs">
        Pellikart already set up your listing. Enter your code and/or phone number to make it yours.
      </p>

      <div className="w-full max-w-sm mt-7">
        <label className="block text-[12px] font-semibold text-dark">Claim code</label>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="PK-XXXX"
          autoCapitalize="characters"
          className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-card-border text-[15px] font-mono tracking-wide focus:border-magenta outline-none"
        />

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-card-border" />
          <span className="text-[11px] text-gray-400">and / or</span>
          <div className="flex-1 h-px bg-card-border" />
        </div>

        <label className="block text-[12px] font-semibold text-dark">Phone number</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+91…"
          inputMode="tel"
          className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-card-border text-[15px] focus:border-magenta outline-none"
        />

        {error && <p className="mt-4 text-[13px] text-red-500 text-center">{error}</p>}

        <button
          onClick={handleClaim}
          disabled={busy}
          className="w-full mt-6 py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] disabled:opacity-60 active:scale-[0.99]"
        >
          {busy ? 'Claiming…' : 'Claim my profile'}
        </button>
      </div>
    </div>
  )
}

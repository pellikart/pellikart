import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { type AppRole } from '@/lib/auth-context'

type Step = 'choice' | 'role' | 'login'

export default function AuthPage() {
  const [step, setStep] = useState<Step>('choice')
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Returning users log in without picking a role — their role is already on
  // their account. New users register and choose a role first.
  function startLogin() { setSelectedRole(null); setError(null); setStep('login') }
  function startRegister() { setSelectedRole(null); setError(null); setStep('role') }

  function handleRoleSelect(role: AppRole) {
    setSelectedRole(role)
    setStep('login')
  }

  // Invited-vendor entry: sign in, then land on the claim screen instead of the
  // normal role routing, so a pre-onboarded vendor can take ownership.
  async function handleClaimSignIn() {
    if (!supabase) return
    setError(null)
    localStorage.removeItem('pellikart_pending_role')
    // Redirect to /app (the allowlisted callback) and let the app route us to
    // the claim screen from this stamped intent — deep redirect targets like
    // /app/claim are silently dropped unless separately allowlisted in Supabase.
    localStorage.setItem('pellikart_post_login', 'claim')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    })
    if (err) setError(err.message)
  }

  // Staff entry: sign in and go straight to the admin panel. Access is enforced
  // by the admins allowlist (RLS) — this button just skips the role routing.
  async function handleAdminSignIn() {
    if (!supabase) return
    setError(null)
    localStorage.removeItem('pellikart_pending_role')
    // Same as claim: land on /app, then route to /admin from the stamped intent.
    localStorage.setItem('pellikart_post_login', 'admin')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    })
    if (err) setError(err.message)
  }

  async function handleGoogleSignIn() {
    if (!supabase) return
    setError(null)

    // Normal login/registration is not a claim/admin entry — drop any stale
    // intent so it can't divert this user to the claim or admin screen.
    localStorage.removeItem('pellikart_post_login')

    // Only stamp a pending role when registering; logins inherit the role
    // stored on the existing account.
    if (selectedRole) {
      localStorage.setItem('pellikart_pending_role', selectedRole)
    } else {
      localStorage.removeItem('pellikart_pending_role')
    }

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app',
      },
    })

    if (err) {
      setError(err.message)
    }
  }

  if (!supabase) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 bg-white">
        <p className="text-gray-500 text-center">Authentication is not available. Please check the configuration.</p>
      </div>
    )
  }

  // Step 1: Log in or register
  if (step === 'choice') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
        <img src="/logo.png" alt="Pellikart" className="w-20 h-20 object-cover rounded-2xl mb-6" />
        <h1 className="text-[22px] font-bold text-dark text-center leading-tight">Welcome to Pellikart</h1>
        <p className="text-[13px] text-gray-500 mt-2 text-center">Log in or create an account to continue</p>

        <div className="w-full max-w-sm mt-8 space-y-3">
          <button
            onClick={startLogin}
            className="w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] active:scale-[0.99] transition-transform"
          >
            Log in
          </button>
          <button
            onClick={startRegister}
            className="w-full py-3.5 rounded-xl border-2 border-card-border text-dark font-semibold text-[15px] active:bg-gray-50 transition-colors"
          >
            Create an account
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-6 text-center">Already a vendor or planning a wedding? Just log in.</p>

        <button
          onClick={handleClaimSignIn}
          className="mt-4 text-[12px] text-magenta font-medium hover:underline"
        >
          Invited by Pellikart? Claim your vendor profile
        </button>

        <button
          onClick={handleAdminSignIn}
          className="mt-6 text-[11px] text-gray-400 hover:text-gray-600"
        >
          Admin
        </button>
        {error && <p className="mt-3 text-[12px] text-red-500 text-center">{error}</p>}
      </div>
    )
  }

  // Step 2 (register only): Role selection
  if (step === 'role') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
        <img src="/logo.png" alt="Pellikart" className="w-20 h-20 object-cover rounded-2xl mb-6" />
        <h1 className="text-[22px] font-bold text-dark text-center leading-tight">Create your account</h1>
        <p className="text-[13px] text-gray-500 mt-2 text-center">How would you like to use the app?</p>

        <div className="w-full max-w-sm mt-8 space-y-3">
          <button
            onClick={() => handleRoleSelect('couple')}
            className="w-full p-5 rounded-2xl border-2 border-card-border bg-white text-left active:border-magenta active:bg-magenta-light/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <img src="/user-logo.png" alt="Couple" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-dark">I'm planning a wedding</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Browse vendors, plan events, book slots</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('vendor')}
            className="w-full p-5 rounded-2xl border-2 border-card-border bg-white text-left active:border-mustard active:bg-mustard-light/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <img src="/vendor-logo.png" alt="Vendor" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-dark">I'm a vendor</p>
                <p className="text-[11px] text-gray-400 mt-0.5">List your services, manage bookings, get leads</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => { setStep('choice'); setError(null) }}
          className="mt-6 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
      </div>
    )
  }

  // Step 3: Google sign-in
  const registering = selectedRole !== null
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <img src="/logo.png" alt="Pellikart" className="w-16 h-16 object-cover rounded-2xl mb-5" />

      <h1 className="text-[20px] font-bold text-dark text-center leading-tight">
        {registering ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="text-[13px] text-gray-500 mt-2 text-center">
        {registering
          ? `Signing up as ${selectedRole === 'couple' ? 'a couple' : 'a vendor'}`
          : 'Log in to your account'}
      </p>

      <div className="w-full max-w-sm mt-8">
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 rounded-xl border border-card-border bg-white text-dark font-medium text-[14px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => { setStep(registering ? 'role' : 'choice'); setError(null) }}
          className="w-full mt-4 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>

        {error && (
          <p className="mt-4 text-[13px] text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}

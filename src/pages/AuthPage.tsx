import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth, type AppRole } from '@/lib/auth-context'

type Step = 'role' | 'login' | 'otp'

export default function AuthPage() {
  const { updateRole } = useAuth()
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleRoleSelect(role: AppRole) {
    setSelectedRole(role)
    setStep('login')
  }

  async function handleSendOtp() {
    if (!supabase || phone.length < 10) return
    setSending(true)
    setError(null)

    const { error: err } = await supabase.auth.signInWithOtp({
      phone: '+91' + phone.replace(/\D/g, '').slice(-10),
    })

    setSending(false)
    if (err) {
      setError(err.message)
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp() {
    if (!supabase || otpCode.length < 4) return
    setVerifying(true)
    setError(null)

    const { error: err } = await supabase.auth.verifyOtp({
      phone: '+91' + phone.replace(/\D/g, '').slice(-10),
      token: otpCode,
      type: 'sms',
    })

    setVerifying(false)
    if (err) {
      setError(err.message)
      return
    }

    // Update role after successful auth
    if (selectedRole) {
      await updateRole(selectedRole)
    }
  }

  async function handleGoogleSignIn() {
    if (!supabase) return
    setError(null)

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app',
      },
    })

    if (err) {
      setError(err.message)
    }
    // For Google OAuth, we store the selected role in localStorage
    // so we can apply it after the redirect
    if (selectedRole) {
      localStorage.setItem('pellikart_pending_role', selectedRole)
    }
  }

  if (!supabase) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 bg-white">
        <p className="text-gray-500 text-center">Authentication is not available. Please check the configuration.</p>
      </div>
    )
  }

  // Step 1: Role selection
  if (step === 'role') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
        <img src="/logo.png" alt="Pellikart" className="w-20 h-20 object-cover rounded-2xl mb-6" />
        <h1 className="text-[22px] font-bold text-dark text-center leading-tight">Welcome to Pellikart</h1>
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
      </div>
    )
  }

  // Step 2: Login (phone + Google)
  // Step 3: OTP verification (shown inline)
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <img src="/logo.png" alt="Pellikart" className="w-16 h-16 object-cover rounded-2xl mb-5" />

      <h1 className="text-[20px] font-bold text-dark text-center leading-tight">
        {step === 'otp' ? 'Enter verification code' : 'Sign in to continue'}
      </h1>
      <p className="text-[13px] text-gray-500 mt-2 text-center">
        {step === 'otp'
          ? `We sent a code to +91 ${phone}`
          : `Signing in as ${selectedRole === 'couple' ? 'a couple' : 'a vendor'}`}
      </p>

      <div className="w-full max-w-sm mt-8">
        {step === 'login' && (
          <>
            {/* Phone input */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[14px] text-gray-500 bg-empty-bg px-3 py-3 rounded-xl font-medium">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 px-4 py-3 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || sending}
              className="w-full py-3 rounded-xl bg-magenta text-white font-semibold text-[14px] disabled:opacity-40 transition-opacity"
            >
              {sending ? 'Sending...' : 'Send OTP'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-card-border" />
              <span className="text-[12px] text-gray-400">or</span>
              <div className="flex-1 h-px bg-card-border" />
            </div>

            {/* Google sign in */}
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

            {/* Back button */}
            <button
              onClick={() => { setStep('role'); setError(null) }}
              className="w-full mt-4 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Change role
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 rounded-xl border border-card-border text-[14px] text-dark text-center tracking-[8px] font-mono outline-none focus:border-magenta transition-colors mb-3"
              autoFocus
            />

            <button
              onClick={handleVerifyOtp}
              disabled={otpCode.length < 6 || verifying}
              className="w-full py-3 rounded-xl bg-magenta text-white font-semibold text-[14px] disabled:opacity-40 transition-opacity"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>

            <button
              onClick={() => { setStep('login'); setOtpCode(''); setError(null) }}
              className="w-full mt-4 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Use a different number
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-[13px] text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}

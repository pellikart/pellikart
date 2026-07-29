// Native sign-in.
//
// The web app calls `supabase.auth.signInWithOAuth({ redirectTo: origin })` and
// lets the browser navigate away and come back. A phone app has no page to
// navigate, so the same handshake is done in three explicit steps:
//
//   1. Ask Supabase for the provider URL but stop it opening anything
//      (`skipBrowserRedirect`).
//   2. Open that URL in the system auth session — SFAuthenticationSession on
//      iOS, Custom Tabs on Android — which hands control back to us on redirect.
//   3. Exchange the `?code=` from the redirect for a session. `onAuthStateChange`
//      in the shared auth-context then fires exactly as it does on the web.
//
// SETUP: the redirect URI printed by `getRedirectUri()` (pellikart://auth-callback
// in a release build, an exp://… URL under Expo Go) must be added to
// Supabase → Authentication → URL Configuration → Redirect URLs.

import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase.native'
import type { AppRole } from '@shared/auth-context'

/** Mirrors the web app's `localStorage.setItem('pellikart_pending_role', …)`:
 *  a role picked during registration, read once after sign-in completes. */
const PENDING_ROLE_KEY = 'pellikart_pending_role'

export function getRedirectUri() {
  return Linking.createURL('auth-callback')
}

export async function setPendingRole(role: AppRole | null) {
  if (role) await AsyncStorage.setItem(PENDING_ROLE_KEY, role)
  else await AsyncStorage.removeItem(PENDING_ROLE_KEY)
}

export async function readPendingRole(): Promise<AppRole | null> {
  const v = await AsyncStorage.getItem(PENDING_ROLE_KEY)
  return v === 'couple' || v === 'vendor' ? v : null
}

export async function clearPendingRole() {
  await AsyncStorage.removeItem(PENDING_ROLE_KEY)
}

export type SignInResult = { ok: true } | { ok: false; error: string }

/**
 * Google sign-in. `role` is stamped only when registering — an existing account
 * keeps whatever role is stored on its profile, exactly as on the web.
 */
export async function signInWithGoogle(role: AppRole | null): Promise<SignInResult> {
  if (!supabase) return { ok: false, error: 'Authentication is not configured.' }

  await setPendingRole(role)

  const redirectTo = getRedirectUri()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.url) return { ok: false, error: 'Could not start Google sign-in.' }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  // The user backed out of the browser sheet — not an error worth showing.
  if (result.type !== 'success') {
    await clearPendingRole()
    return { ok: false, error: '' }
  }

  const code = new URL(result.url).searchParams.get('code')
  if (!code) {
    await clearPendingRole()
    return { ok: false, error: 'Sign-in did not return a session. Please try again.' }
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    await clearPendingRole()
    return { ok: false, error: exchangeError.message }
  }

  return { ok: true }
}

// ─── Phone / WhatsApp OTP ───────────────────
// Supabase manages the OTP; a Send-SMS auth hook (supabase/functions/send-sms-otp)
// delivers it via MSG91 (WhatsApp first, SMS fallback). `role` is stamped only
// when registering, exactly like Google — a returning phone keeps its saved role.

/** Normalise a typed phone to E.164. Defaults a bare 10-digit number to +91 (India). */
export function toE164(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) {
    const digits = '+' + trimmed.slice(1).replace(/\D/g, '')
    return digits.length >= 11 ? digits : null
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return null
}

export async function sendPhoneOtp(phoneE164: string, role: AppRole | null): Promise<SignInResult> {
  if (!supabase) return { ok: false, error: 'Authentication is not configured.' }
  await setPendingRole(role)
  const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 })
  if (error) {
    await clearPendingRole()
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function verifyPhoneOtp(phoneE164: string, token: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, error: 'Authentication is not configured.' }
  const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token, type: 'sms' })
  if (error) return { ok: false, error: error.message }
  // On success onAuthStateChange fires and useSessionRole resolves the role.
  return { ok: true }
}

export async function signOut() {
  await clearPendingRole()
  if (supabase) await supabase.auth.signOut()
}

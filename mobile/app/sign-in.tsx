// Port of the web app's AuthPage: the same three steps (choice → role → Google)
// and the same copy.
//
// Two entries from the web version are deliberately absent. "Claim your vendor
// profile" and "Admin" both exist to route a signed-in user into flows that
// stay web-only under this plan — the admin panel is not being rebuilt for
// mobile, and vendor claiming happens on an invite link. Adding them here would
// mean shipping dead ends.
//
// Phone/WhatsApp OTP (plan §2.1) replaces this screen in a later phase; Google
// is what the shared backend authenticates with today, so it is what works
// against real data now.

import { useState } from 'react'
import { Image } from 'expo-image'
import { Redirect, router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, Screen, Text } from '@/components/ui'
import { signInWithGoogle } from '@/lib/auth'
import { enterCoupleDemo, enterVendorDemo } from '@/lib/demo'
import { colors } from '@/theme/tokens'
import { useAuth, type AppRole } from '@shared/auth-context'
import { supabase } from '@/lib/supabase.native'

type Step = 'choice' | 'role' | 'login'

export default function SignIn() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState<Step>('choice')
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // A session restored from AsyncStorage on cold start lands here first; bounce
  // it back to the gate so it can resolve a role.
  if (!loading && user) return <Redirect href="/" />

  if (!supabase) {
    return (
      <Screen center scroll background={colors.white}>
        <Text variant="body" color={colors.gray500} align="center">
          Authentication is not available. Please check the configuration.
        </Text>
        {/* Without a backend, real sign-in can't run — but the dev preview still
            can, so it stays reachable here (it renders only in __DEV__). */}
        <DemoEntry />
      </Screen>
    )
  }

  async function handleGoogleSignIn() {
    setError(null)
    setBusy(true)
    const result = await signInWithGoogle(selectedRole)
    setBusy(false)
    if (result.ok) router.replace('/')
    // An empty message means the user dismissed the browser sheet themselves.
    else if (result.error) setError(result.error)
  }

  if (step === 'choice') {
    return (
      <Screen center scroll background={colors.white}>
        <Image source={require('../assets/logo.png')} style={styles.logo} contentFit="cover" />
        <Text variant="h1" align="center">
          Welcome to Pellikart
        </Text>
        <Text variant="body" color={colors.gray500} align="center" style={styles.subtitle}>
          Log in or create an account to continue
        </Text>

        <View style={styles.actions}>
          <Button
            label="Log in"
            variant="primary"
            onPress={() => {
              setSelectedRole(null)
              setError(null)
              setStep('login')
            }}
          />
          <Button
            label="Create an account"
            variant="secondary"
            onPress={() => {
              setSelectedRole(null)
              setError(null)
              setStep('role')
            }}
          />
        </View>

        <Text variant="caption" align="center" style={styles.footnote}>
          Already a vendor or planning a wedding? Just log in.
        </Text>
        {!!error && (
          <Text variant="small" color={colors.danger} align="center" style={styles.error}>
            {error}
          </Text>
        )}

        <DemoEntry />
      </Screen>
    )
  }

  if (step === 'role') {
    return (
      <Screen center scroll background={colors.white}>
        <Image source={require('../assets/logo.png')} style={styles.logo} contentFit="cover" />
        <Text variant="h1" align="center">
          Create your account
        </Text>
        <Text variant="body" color={colors.gray500} align="center" style={styles.subtitle}>
          How would you like to use the app?
        </Text>

        <View style={styles.actions}>
          <Button
            label="I'm planning a wedding"
            variant="primary"
            onPress={() => {
              setSelectedRole('couple')
              setStep('login')
            }}
          />
          <Button
            label="I'm a vendor"
            variant="vendor"
            onPress={() => {
              setSelectedRole('vendor')
              setStep('login')
            }}
          />
        </View>

        <Button
          label="← Back"
          variant="ghost"
          style={styles.back}
          onPress={() => {
            setStep('choice')
            setError(null)
          }}
        />
      </Screen>
    )
  }

  const registering = selectedRole !== null
  return (
    <Screen center scroll background={colors.white}>
      <Image source={require('../assets/logo.png')} style={styles.logoSm} contentFit="cover" />
      <Text variant="h2" align="center">
        {registering ? 'Create your account' : 'Welcome back'}
      </Text>
      <Text variant="body" color={colors.gray500} align="center" style={styles.subtitle}>
        {registering
          ? `Signing up as ${selectedRole === 'couple' ? 'a couple' : 'a vendor'}`
          : 'Log in to your account'}
      </Text>

      <View style={styles.actions}>
        <Button
          label="Continue with Google"
          variant="secondary"
          loading={busy}
          onPress={handleGoogleSignIn}
        />
        <Button
          label="← Back"
          variant="ghost"
          onPress={() => {
            setStep(registering ? 'role' : 'choice')
            setError(null)
          }}
        />
      </View>

      {!!error && (
        <Text variant="body" color={colors.danger} align="center" style={styles.error}>
          {error}
        </Text>
      )}
    </Screen>
  )
}

/**
 * Dev-only shortcut into the app with mock data — no Supabase, no Google.
 * Renders nothing in a release build, so it can never reach real users.
 */
function DemoEntry() {
  if (!__DEV__) return null
  return (
    <View style={styles.demo}>
      <Text variant="micro" color={colors.gray400} align="center" style={styles.demoLabel}>
        DEV PREVIEW — MOCK DATA
      </Text>
      <Button
        label="Browse couple app (locked)"
        variant="secondary"
        onPress={() => {
          enterCoupleDemo(false)
          router.replace('/(couple)')
        }}
      />
      <Button
        label="Browse couple app (unlocked)"
        variant="secondary"
        onPress={() => {
          enterCoupleDemo(true)
          router.replace('/(couple)')
        }}
      />
      <Button
        label="Browse vendor app"
        variant="secondary"
        onPress={() => {
          enterVendorDemo()
          router.replace('/(vendor)')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 24 },
  logoSm: { width: 64, height: 64, borderRadius: 20, marginBottom: 20 },
  subtitle: { marginTop: 8 },
  actions: { width: '100%', marginTop: 32, gap: 12 },
  footnote: { marginTop: 24 },
  back: { marginTop: 24 },
  error: { marginTop: 16 },
  demo: { width: '100%', marginTop: 32, gap: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 16 },
  demoLabel: { marginBottom: 4 },
})

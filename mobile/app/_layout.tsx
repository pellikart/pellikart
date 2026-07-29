// Root layout. Mirrors the web app's provider stack: an AuthProvider around
// everything, then role-dependent routing underneath.
//
// The shared AuthProvider is imported verbatim from the web app — it only ever
// touches React and the Supabase client (which Metro has already swapped for
// the native one), so there is nothing web-specific left in it to replace.

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@shared/auth-context'
import { registerForPush } from '@/lib/push'
import { useEntitlementSync } from '@/lib/useEntitlementSync'
import { initSentry, Sentry } from '@/lib/sentry'
import { OfflineBanner } from '@/components/OfflineBanner'
import { colors } from '@/theme/tokens'

// Start crash reporting before anything renders (no-op without a DSN).
initSentry()

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PushRegistrar />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.screenBg },
            }}
          />
          <OfflineBanner />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

// Sentry.wrap adds the error boundary + touch/navigation breadcrumbs. It's a
// passthrough when Sentry isn't initialised, so this is safe unconfigured.
export default Sentry.wrap(RootLayout)

/** Registers the device for push once a user is signed in. No-op in the web
 *  preview and in Expo Go (see registerForPush). */
function PushRegistrar() {
  const { user } = useAuth()
  useEntitlementSync()
  useEffect(() => {
    if (user) void registerForPush(user.id)
  }, [user])
  return null
}

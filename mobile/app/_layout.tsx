// Root layout. Mirrors the web app's provider stack: an AuthProvider around
// everything, then role-dependent routing underneath.
//
// The shared AuthProvider is imported verbatim from the web app — it only ever
// touches React and the Supabase client (which Metro has already swapped for
// the native one), so there is nothing web-specific left in it to replace.

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@shared/auth-context'
import { colors } from '@/theme/tokens'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.screenBg },
            }}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

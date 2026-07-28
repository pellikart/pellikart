// Sign out, available from both apps.
//
// Signing out has to reset the shared stores as well as the Supabase session:
// they hold the previous user's boards, listings and vendor profile in memory,
// and expo-router keeps the mounted tree alive across the redirect.

import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button } from '@/components/ui'
import { signOut } from '@/lib/auth'
import { useStore } from '@shared/store'
import { useVendorStore } from '@shared/vendor-store'

export function SignOutRow() {
  async function handleSignOut() {
    await signOut()
    useStore.setState({ role: 'none', onboardingComplete: false, ritualBoards: [], vendors: {} })
    useVendorStore.setState({ vendorOnboardingComplete: false, vendorProfile: null })
    router.replace('/sign-in')
  }

  return (
    <View style={styles.wrap}>
      <Button label="Sign out" variant="ghost" onPress={handleSignOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32, width: '100%' },
})

// Account actions, shown on the couple/vendor home + vendor profile.
//
// Sign out, plus in-app "Delete account" — Apple requires account deletion to be
// reachable inside the app, behind a clear confirmation. Both reset the shared
// stores (they hold the previous user's data and the tree stays mounted across
// the redirect); delete additionally calls the delete-account edge function.

import { useState } from 'react'
import { router } from 'expo-router'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Button, Text } from '@/components/ui'
import { signOut } from '@/lib/auth'
import { deleteAccount } from '@/lib/account'
import { useStore } from '@shared/store'
import { useVendorStore } from '@shared/vendor-store'
import { colors, radius } from '@/theme/tokens'

function resetStores() {
  useStore.setState({ role: 'none', onboardingComplete: false, ritualBoards: [], vendors: {} })
  useVendorStore.setState({ vendorOnboardingComplete: false, vendorProfile: null })
}

export function SignOutRow() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    await signOut()
    resetStores()
    router.replace('/sign-in')
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    const res = await deleteAccount()
    setDeleting(false)
    // A real backend error (not the demo "unconfigured" case) stays on screen.
    if (!res.ok && res.configured) {
      setError(res.error)
      return
    }
    // Deleted, or nothing to delete (demo) — clear local session and leave.
    await signOut()
    resetStores()
    setConfirming(false)
    router.replace('/sign-in')
  }

  return (
    <View style={styles.wrap}>
      <Button label="Sign out" variant="ghost" onPress={handleSignOut} />
      <Pressable onPress={() => { setError(null); setConfirming(true) }} hitSlop={6} style={styles.deleteLink}>
        <Text variant="small" color={colors.danger}>
          Delete account
        </Text>
      </Pressable>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text variant="title">Delete your account?</Text>
            <Text variant="small" color={colors.gray600} style={styles.body}>
              This permanently deletes your Pellikart account and all your data — boards, bookings,
              listings and messages. This cannot be undone.
            </Text>
            {!!error && (
              <Text variant="small" color={colors.danger} style={styles.error}>
                {error}
              </Text>
            )}
            <View style={styles.actions}>
              <Button label="Keep account" variant="secondary" onPress={() => setConfirming(false)} style={styles.grow} />
              <Button label="Delete" variant="primary" loading={deleting} onPress={handleDelete} style={styles.grow} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 32, width: '100%', alignItems: 'center', gap: 12 },
  deleteLink: { paddingVertical: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: radius.lg, padding: 20 },
  body: { marginTop: 8, lineHeight: 18 },
  error: { marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  grow: { flex: 1 },
})

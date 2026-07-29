// A slim app-wide banner shown while the device is offline, so users understand
// why data isn't loading rather than staring at a spinner. Sits below the status
// bar; renders nothing when online.

import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import { useNetwork } from '@/lib/useNetwork'
import { colors } from '@/theme/tokens'

export function OfflineBanner() {
  const { isOnline } = useNetwork()
  const insets = useSafeAreaInsets()
  if (isOnline) return null
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Text variant="small" weight="600" color={colors.white} align="center">
        You&apos;re offline — some things won&apos;t update until you reconnect.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.dark,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
})

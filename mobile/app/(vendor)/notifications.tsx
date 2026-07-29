// Vendor notifications — port of the web VendorNotifications.
// Reads the vendor store's notifications (seeded in demo; live-synced in live
// mode) and marks them read. New leads, booking updates and visit requests all
// land here — a major reason vendors prefer the app (plan §2.2).

import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import { Text } from '@/components/ui'
import { SubHeader } from '@/components/SubHeader'
import { NotificationList, type NotifItem } from '@/components/NotificationList'
import { colors } from '@/theme/tokens'

export default function VendorNotifications() {
  const notifications = useVendorStore((s) => s.vendorNotifications)
  const markRead = useVendorStore((s) => s.markNotificationRead)
  const markAllRead = useVendorStore((s) => s.markAllNotificationsRead)

  const items: NotifItem[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    at: n.timestamp,
    read: n.read,
  }))
  const unread = items.filter((n) => !n.read).length

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.headerRow}>
        <SubHeader title="Notifications" />
        {unread > 0 && (
          <Pressable onPress={markAllRead} hitSlop={8} style={styles.markAll}>
            <Text variant="micro" weight="500" color={colors.mustard}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>
      <NotificationList
        items={items}
        accent={colors.mustard}
        accentLight={colors.mustardLight}
        onPress={(n) => markRead(n.id)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markAll: { position: 'absolute', right: 16, top: 14 },
})

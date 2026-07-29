// Couple notifications — booking confirmations, milestone updates, and
// visit-request responses (plan §2.1).
//
// In live mode this reads the shared `notifications` table (the same rows the
// push backend fans out on). In demo mode there's no signed-in user, so a small
// illustrative set stands in so the screen is previewable.

import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@shared/auth-context'
import { fetchNotifications, markNotificationReadDb } from '@shared/supabase-db'
import { Text } from '@/components/ui'
import { NotificationList, type NotifItem } from '@/components/NotificationList'
import { colors } from '@/theme/tokens'

const DEMO_ITEMS: NotifItem[] = [
  { id: 'd1', type: 'booking', title: 'Booking confirmed', body: 'Your Wedding photographer slot is locked. ₹9,000 paid.', at: new Date(Date.now() - 3_600_000).toISOString(), read: false },
  { id: 'd2', type: 'milestone', title: 'Milestone update', body: 'Planning started for your Reception venue.', at: new Date(Date.now() - 26_000_000).toISOString(), read: false },
  { id: 'd3', type: 'trial', title: 'Visit confirmed', body: 'Muhurtham Films accepted your visit for Sat, 3:00 PM.', at: new Date(Date.now() - 90_000_000).toISOString(), read: true },
]

export default function CoupleNotifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<NotifItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setItems(DEMO_ITEMS)
      setLoaded(true)
      return
    }
    fetchNotifications(user.id).then((rows) => {
      if (cancelled) return
      setItems(
        (rows as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          type: r.type as string,
          title: r.title as string,
          body: r.body as string,
          at: r.created_at as string,
          read: !!r.is_read,
        }))
      )
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  function handlePress(n: NotifItem) {
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    if (user) void markNotificationReadDb(n.id)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text variant="title">←</Text>
        </Pressable>
        <Text variant="title">Notifications</Text>
      </View>
      {loaded && <NotificationList items={items} onPress={handlePress} />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
})

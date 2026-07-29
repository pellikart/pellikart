// Shared notification list UI for both roles. Each side maps its own data shape
// (the vendor store's VendorNotification, or the DB notifications row) onto this
// normalized item, so the row rendering lives in one place.

import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { colors } from '@/theme/tokens'

export interface NotifItem {
  id: string
  type: string
  title: string
  body: string
  /** ISO timestamp. */
  at: string
  read: boolean
}

const TYPE_ICON: Record<string, string> = {
  booking: '📋',
  trial: '🧪',
  visit: '🧪',
  bid: '🎨',
  milestone: '✅',
  payment: '💰',
  review: '⭐',
  cancelled: '❌',
  system: '🔔',
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return (
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  )
}

export function NotificationList({
  items,
  accent = colors.magenta,
  accentLight = colors.magentaLight,
  onPress,
  emptyText = 'No notifications yet',
}: {
  items: NotifItem[]
  accent?: string
  accentLight?: string
  onPress?: (item: NotifItem) => void
  emptyText?: string
}) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="small" color={colors.gray400}>
          {emptyText}
        </Text>
      </View>
    )
  }
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {items.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => onPress?.(n)}
          style={[styles.row, !n.read && { backgroundColor: `${accentLight}66` }]}
        >
          <Text variant="bodyLg" style={styles.icon}>
            {TYPE_ICON[n.type] || '🔔'}
          </Text>
          <View style={styles.copy}>
            <Text variant="small" weight={n.read ? '500' : '600'} color={n.read ? colors.gray600 : colors.dark}>
              {n.title}
            </Text>
            <Text variant="micro" color={colors.gray500} style={styles.body}>
              {n.body}
            </Text>
            <Text variant="micro" color={colors.gray400} style={styles.when}>
              {formatWhen(n.at)}
            </Text>
          </View>
          {!n.read && <View style={[styles.dot, { backgroundColor: accent }]} />}
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  empty: { padding: 48, alignItems: 'center' },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  icon: { marginTop: 1 },
  copy: { flex: 1 },
  body: { marginTop: 2 },
  when: { marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
})

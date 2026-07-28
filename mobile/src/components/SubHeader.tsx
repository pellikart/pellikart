// Shared header for the vendor sub-screens (bookings, leads, trials, reviews):
// a back arrow + title, matching the sticky header the web pages use.

import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { colors } from '@/theme/tokens'

export function SubHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Text variant="title" color={colors.dark}>
          ←
        </Text>
      </Pressable>
      <View>
        <Text variant="title">{title}</Text>
        {!!subtitle && (
          <Text variant="caption" color={colors.gray400}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  back: { paddingRight: 2 },
})

// Port of the web app's RoleSelectPage — same copy, same two cards, same
// magenta/mustard accent split between couple and vendor.

import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'
import { Card, Screen, Text } from '@/components/ui'
import { colors } from '@/theme/tokens'
import type { AppRole } from '@shared/auth-context'

export function RoleSelectScreen({ onSelect }: { onSelect: (role: AppRole) => void }) {
  return (
    <Screen center background={colors.white}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="cover" />

      <Text variant="h1" align="center">
        Welcome to Pellikart
      </Text>
      <Text variant="body" color={colors.gray500} align="center" style={styles.subtitle}>
        How would you like to use the app?
      </Text>

      <View style={styles.cards}>
        <Card onPress={() => onSelect('couple')} accent={colors.magenta}>
          <View style={styles.row}>
            <Image
              source={require('../../assets/user-logo.png')}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.copy}>
              <Text variant="title">I&apos;m planning a wedding</Text>
              <Text variant="caption" style={styles.cardCaption}>
                Browse vendors, plan events, book slots
              </Text>
            </View>
          </View>
        </Card>

        <Card onPress={() => onSelect('vendor')} accent={colors.mustard}>
          <View style={styles.row}>
            <Image
              source={require('../../assets/vendor-logo.png')}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.copy}>
              <Text variant="title">I&apos;m a vendor</Text>
              <Text variant="caption" style={styles.cardCaption}>
                List your services, manage bookings, get leads
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 24 },
  subtitle: { marginTop: 8 },
  cards: { width: '100%', marginTop: 32, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 12 },
  copy: { flex: 1 },
  cardCaption: { marginTop: 2 },
})

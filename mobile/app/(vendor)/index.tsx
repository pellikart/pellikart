// Vendor dashboard — the foundation slice of the web app's VendorDashboard.
//
// Like the couple home, this reads entirely from the SHARED vendor store, which
// `useSessionRole` initialises in live mode. Real counts here mean the vendor
// half of the data layer resolved through Metro too.
//
// Listings management, analytics, leads, trials, bids, earnings and reviews are
// Phase 3.

import { StyleSheet, View } from 'react-native'
import { useVendorStore } from '@shared/vendor-store'
import { Card, Screen, Text } from '@/components/ui'
import { SignOutRow } from '@/components/SignOutRow'
import { colors } from '@/theme/tokens'

export default function VendorDashboard() {
  const profile = useVendorStore((s) => s.vendorProfile)
  const listings = useVendorStore((s) => s.vendorListings)
  const leads = useVendorStore((s) => s.vendorLeads)
  const bookings = useVendorStore((s) => s.vendorBookings)
  const onboardingComplete = useVendorStore((s) => s.vendorOnboardingComplete)

  if (!onboardingComplete) {
    return (
      <Screen center scroll>
        <Text variant="h1" align="center">
          Finish setting up your business
        </Text>
        <Text variant="body" color={colors.gray500} align="center" style={styles.subtitle}>
          Your profile goes to the Pellikart team for review, and you appear to couples once
          it&apos;s approved.
        </Text>
        <Text variant="caption" align="center" style={styles.subtitle}>
          Vendor onboarding arrives in the next phase — complete it on pellikart.com and it will
          sync here.
        </Text>
        <SignOutRow />
      </Screen>
    )
  }

  const activeBookings = bookings.filter((b) => b.status === 'active').length

  return (
    <Screen scroll contentStyle={styles.page}>
      <Text variant="h1">{profile?.businessName ?? 'Your business'}</Text>
      {!!profile?.category && (
        <Text variant="small" style={styles.category}>
          {profile.category}
          {profile.area ? ` · ${profile.area}` : ''}
        </Text>
      )}

      <View style={styles.stats}>
        <Stat label="Listings" value={listings.length} />
        <Stat label="Leads" value={leads.length} />
        <Stat label="Active bookings" value={activeBookings} />
      </View>

      <SignOutRow />
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <Text variant="h2" color={colors.mustard}>
        {value}
      </Text>
      <Text variant="caption" style={styles.statLabel}>
        {label}
      </Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  page: { paddingTop: 8, paddingBottom: 32 },
  subtitle: { marginTop: 8 },
  category: { marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 24 },
  stat: { flex: 1, padding: 16, alignItems: 'center' },
  statLabel: { marginTop: 4, textAlign: 'center' },
})

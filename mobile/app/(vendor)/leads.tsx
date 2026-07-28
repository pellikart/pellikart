// Vendor leads — port of the web VendorLeads.
//
// Couples who added one of this vendor's listings to their board, grouped by
// listing, showing the plate package or rental tier they picked. Couples stay
// anonymous until they request a visit or book — no contact here, by design.

import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useVendorStore } from '@shared/vendor-store'
import { formatDate, formatINR } from '@shared/helpers'
import type { VendorLead } from '@shared/vendor-types'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import { SubHeader } from '@/components/SubHeader'
import { colors, radius } from '@/theme/tokens'

export default function VendorLeads() {
  const vendorLeads = useVendorStore((s) => s.vendorLeads)

  const groups = useMemo(() => {
    const byListing = new Map<string, VendorLead[]>()
    for (const lead of vendorLeads) {
      const arr = byListing.get(lead.listingId) || []
      arr.push(lead)
      byListing.set(lead.listingId, arr)
    }
    return [...byListing.values()]
  }, [vendorLeads])

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SubHeader title="Leads" subtitle="Couples who picked your listings" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {vendorLeads.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" weight="600" align="center">
              No leads yet
            </Text>
            <Text variant="small" color={colors.gray400} align="center" style={styles.emptySub}>
              When a couple adds one of your listings to their board, it shows up here — including
              which package they picked.
            </Text>
          </View>
        ) : (
          <>
            <Text variant="small" color={colors.gray400} style={styles.intro}>
              {vendorLeads.length} {vendorLeads.length === 1 ? 'couple has' : 'couples have'} picked
              your listings. Couples stay anonymous until they request a visit or book.
            </Text>
            {groups.map((leads) => (
              <View key={leads[0].listingId} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text variant="small" weight="600" numberOfLines={1} style={styles.grow}>
                    {leads[0].listingName}
                  </Text>
                  <Text variant="micro" color={colors.gray400}>
                    {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
                  </Text>
                </View>
                {leads.map((lead) => (
                  <View key={lead.id} style={styles.leadCard}>
                    <View style={styles.grow}>
                      <Text variant="small" weight="500">
                        {lead.boardName}
                        {lead.categoryLabel && lead.categoryLabel !== lead.boardName ? (
                          <Text variant="micro" color={colors.gray400}>
                            {'  '}· {lead.categoryLabel}
                          </Text>
                        ) : null}
                      </Text>
                      {!!lead.eventDate && (
                        <Text variant="micro" color={colors.gray400}>
                          Event · {formatDate(lead.eventDate)}
                        </Text>
                      )}
                    </View>
                    {lead.packageName ? (
                      <View style={styles.tagCol}>
                        <View style={styles.tag}>
                          <Text variant="micro" weight="600" color={colors.mustard}>
                            {lead.packageName}
                          </Text>
                        </View>
                        {!!lead.packagePrice && (
                          <Text variant="micro" color={colors.gray400}>
                            {formatINR(lead.packagePrice)}/plate
                          </Text>
                        )}
                      </View>
                    ) : lead.tierHours ? (
                      <View style={styles.tag}>
                        <Text variant="micro" weight="600" color={colors.mustard}>
                          {lead.tierHours} hr rental
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  body: { padding: 16, paddingBottom: 32 },
  grow: { flex: 1 },
  empty: { paddingVertical: 64, alignItems: 'center' },
  emptySub: { marginTop: 6, maxWidth: 260 },
  intro: { marginBottom: 12 },
  group: { marginBottom: 16 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  leadCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, marginBottom: 8 },
  tagCol: { alignItems: 'flex-end', gap: 2 },
  tag: { backgroundColor: colors.mustardLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
})

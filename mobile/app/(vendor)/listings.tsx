// Vendor listings — list + entry points to create and edit.
//
// Tapping a listing opens the edit flow; the header button opens create. Both
// route to the shared ListingForm. Categories whose authoring is web-only
// (Decor, and the single-listing categories done in onboarding) show a note
// instead of a create button.

import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import { formatINR } from '@shared/helpers'
import { Text } from '@/components/ui'
import { listingCreateSupported } from '@/lib/listing-form'
import { colors, radius } from '@/theme/tokens'

export default function VendorListings() {
  const listings = useVendorStore((s) => s.vendorListings)
  const category = useVendorStore((s) => s.vendorProfile?.category) ?? ''
  const support = listingCreateSupported(category)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Listings</Text>
        {support.ok && (
          <Pressable onPress={() => router.push('/(vendor)/listing-new')} style={styles.newBtn}>
            <Text variant="small" weight="600" color={colors.white}>
              + New
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!support.ok && (
          <View style={styles.note}>
            <Text variant="small" color={colors.gray600}>
              {support.reason}
            </Text>
          </View>
        )}

        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.gray500} align="center">
              No listings yet.
            </Text>
            {support.ok && (
              <Text variant="small" color={colors.gray400} align="center" style={styles.emptySub}>
                Tap “+ New” to create your first one.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {listings.map((listing) => (
              <Pressable
                key={listing.id}
                style={styles.item}
                onPress={() => router.push({ pathname: '/(vendor)/listing-edit', params: { listingId: listing.id } })}
              >
                {listing.photos?.[0] ? (
                  <Image source={{ uri: listing.photos[0] }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.itemCopy}>
                  <Text variant="small" weight="600" numberOfLines={1}>
                    {listing.name}
                  </Text>
                  <Text variant="micro" color={colors.gray400}>
                    {listing.category}
                    {listing.price ? ` · from ${formatINR(listing.price)}` : ''}
                  </Text>
                  {(listing.rituals?.length ?? 0) > 0 && (
                    <Text variant="micro" color={colors.gray400} numberOfLines={1}>
                      {listing.rituals!.join(', ')}
                    </Text>
                  )}
                </View>
                <Text variant="body" color={colors.gray300}>
                  ›
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  newBtn: { backgroundColor: colors.mustard, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  body: { padding: 16 },
  note: { padding: 12, borderRadius: radius.md, backgroundColor: colors.mustardLight, marginBottom: 16 },
  empty: { paddingVertical: 64, alignItems: 'center' },
  emptySub: { marginTop: 6 },
  list: { gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.emptyBg },
  itemCopy: { flex: 1, gap: 1 },
})

// Category board — vendor discovery for one board category.
//
// A focused port of the web app's CategoryBoardPage. It surfaces the vendors
// matched to this category (the shared store has already done the matching and
// keyed the vendor map by listing), rendered as paywalled cards. From here the
// couple can shortlist, like, open the detail sheet, and select a vendor for
// the event.
//
// The web page also carries an Explore filter bar, a Compare tab, Decor briefs
// and the venue plate-package picker. Those are layered features deferred to a
// later pass; the core discover → shortlist → select → visit journey is here.

import { useMemo, useState } from 'react'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useStore } from '@shared/store'
import { formatINR } from '@shared/helpers'
import type { Category, Vendor } from '@shared/types'
import { Screen, Text } from '@/components/ui'
import { VendorName } from '@/components/VendorName'
import { VendorDetailSheet } from '@/components/VendorDetailSheet'
import { colors, radius } from '@/theme/tokens'

export default function CategoryBoard() {
  const { ritualId, categoryId } = useLocalSearchParams<{ ritualId: string; categoryId: string }>()

  const ritualBoards = useStore((s) => s.ritualBoards)
  const vendors = useStore((s) => s.vendors)
  const subscription = useStore((s) => s.subscription)
  const addToShortlist = useStore((s) => s.addToShortlist)
  const removeFromShortlist = useStore((s) => s.removeFromShortlist)

  const unlocked = subscription !== 'free'
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null)

  const board = ritualBoards.find((b) => b.id === ritualId)
  const category = board?.categories.find((c) => c.id === categoryId)

  // Explore feed: every vendor in the map whose listing belongs to this
  // category. The store keys the vendor map by listing id and stamps
  // `code` as "Category NNN", which is how the web page matches too.
  const exploreVendors = useMemo(() => {
    if (!category) return []
    const label = category.label.toLowerCase()
    return Object.values(vendors).filter(
      (v) => (v.category?.toLowerCase() === label) || v.code.toLowerCase().startsWith(label)
    )
  }, [vendors, category])

  if (!board || !category) {
    return (
      <Screen center>
        <Text variant="body" color={colors.gray500}>
          Board not found.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text variant="body" color={colors.magenta}>
            ← Go back
          </Text>
        </Pressable>
      </Screen>
    )
  }

  const shortlistedIds = new Set(category.shortlistedVendorIds)
  const detailVendor = detailVendorId ? vendors[detailVendorId] : null

  return (
    <Screen scroll padded={false} contentStyle={styles.page} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text variant="body" color={colors.gray500}>
            ←
          </Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text variant="title">{category.label}</Text>
          <Text variant="caption" color={colors.gray400}>
            {board.name} · {category.shortlistedVendorIds.length} shortlisted
          </Text>
        </View>
      </View>

      {exploreVendors.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={colors.gray500} align="center">
            No {category.label.toLowerCase()} vendors match your event yet.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {exploreVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              category={category}
              unlocked={unlocked}
              shortlisted={shortlistedIds.has(vendor.id)}
              selected={category.selectedVendorId === vendor.id}
              onTap={() => setDetailVendorId(vendor.id)}
              onToggleShortlist={() =>
                shortlistedIds.has(vendor.id)
                  ? removeFromShortlist(board.id, category.id, vendor.id)
                  : addToShortlist(board.id, category.id, vendor.id)
              }
            />
          ))}
        </View>
      )}

      {detailVendor && (
        <VendorDetailSheet
          vendor={detailVendor}
          category={category}
          ritualId={board.id}
          unlocked={unlocked}
          onClose={() => setDetailVendorId(null)}
        />
      )}
    </Screen>
  )
}

function VendorCard({
  vendor,
  category,
  unlocked,
  shortlisted,
  selected,
  onTap,
  onToggleShortlist,
}: {
  vendor: Vendor
  category: Category
  unlocked: boolean
  shortlisted: boolean
  selected: boolean
  onTap: () => void
  onToggleShortlist: () => void
}) {
  const perPlate =
    vendor.category === 'Venue' &&
    vendor.venuePricingModels?.includes('perPlate') &&
    !vendor.venuePricingModels?.includes('rent')

  return (
    <Pressable style={styles.card} onPress={onTap}>
      {vendor.photo ? (
        <Image source={{ uri: vendor.photo }} style={styles.cardImg} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.cardImg, styles.cardPlaceholder]} />
      )}
      <View style={styles.cardOverlay} />

      {selected && (
        <View style={styles.selectedBadge}>
          <Text variant="micro" weight="600" color={colors.white}>
            ✓ Selected
          </Text>
        </View>
      )}

      <Pressable onPress={onToggleShortlist} hitSlop={8} style={styles.heart}>
        <Text variant="body">{shortlisted ? '♥' : '♡'}</Text>
      </Pressable>

      <View style={styles.cardBody}>
        <VendorName vendor={vendor} unlocked={unlocked} variant="title" color={colors.white} numberOfLines={1} />
        <View style={styles.cardMeta}>
          {!!vendor.style && (
            <Text variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1}>
              {vendor.style}
            </Text>
          )}
          <Text variant="body" weight="700" color={colors.white}>
            {vendor.eventPackages?.length ? 'from ' : ''}
            {formatINR(vendor.price)}
            {perPlate ? '/plate' : ''}
          </Text>
        </View>
        {vendor.rating > 0 && (
          <Text variant="caption" color="rgba(255,255,255,0.85)">
            ★ {vendor.rating.toFixed(1)}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  page: { paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerCopy: { flex: 1 },
  backLink: { marginTop: 16 },
  empty: { padding: 40 },
  list: { paddingHorizontal: 16, gap: 14 },
  card: { height: 220, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  cardImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, },
  cardPlaceholder: { backgroundColor: colors.emptyBg },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)' },
  selectedBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: colors.magenta, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  heart: { position: 'absolute', top: 10, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
})

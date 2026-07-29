// Couple home — port of the web app's HomePage + RitualBoard.
//
// Reads ritualBoards, vendors and subscription from the SHARED store (already
// initialised in live mode by useSessionRole). Layout mirrors the web:
//   • a horizontal strip of event-board tabs (the web shows these on mobile;
//     the desktop sidebar has no phone equivalent),
//   • the active board's header (filled/total + running total),
//   • a grid of category tiles — filled ones show the selected vendor, and a
//     trailing "+ N more" tile opens the category picker.
//
// Tapping a filled tile opens its vendor detail; the swap glyph and the add
// tile both route into the category board for discovery.

import { useEffect, useMemo, useState } from 'react'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useStore } from '@shared/store'
import { formatDateRange, formatINR, getCategorySelectionTotal } from '@shared/helpers'
import type { Category, RitualBoard, Vendor } from '@shared/types'
import { Screen, Text } from '@/components/ui'
import { VendorName } from '@/components/VendorName'
import { SignOutRow } from '@/components/SignOutRow'
import { VendorDetailSheet } from '@/components/VendorDetailSheet'
import { colors, radius } from '@/theme/tokens'

export default function CoupleHome() {
  const ritualBoards = useStore((s) => s.ritualBoards)
  const vendors = useStore((s) => s.vendors)
  const subscription = useStore((s) => s.subscription)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const setActiveBoardId = useStore((s) => s.setActiveBoardId)
  const onboardingData = useStore((s) => s.onboardingData)

  const unlocked = subscription !== 'free'
  const [detailVendor, setDetailVendor] = useState<{ vendor: Vendor; category: Category } | null>(null)

  // Keep the active tab valid as boards load or change.
  useEffect(() => {
    if (ritualBoards.length === 0) {
      if (activeBoardId !== null) setActiveBoardId(null)
      return
    }
    if (!activeBoardId || !ritualBoards.some((b) => b.id === activeBoardId)) {
      setActiveBoardId(ritualBoards[0].id)
    }
  }, [ritualBoards, activeBoardId, setActiveBoardId])

  const activeBoard = ritualBoards.find((b) => b.id === activeBoardId) ?? ritualBoards[0]

  const names = onboardingData
    ? [onboardingData.partner1, onboardingData.partner2].filter(Boolean).join(' & ')
    : ''

  return (
    <Screen scroll padded={false} contentStyle={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text variant="h2">{names || 'Your wedding'}</Text>
          {!!onboardingData?.budget && (
            <Text variant="small" color={colors.gray500}>
              Total budget {formatINR(onboardingData.budget)}
            </Text>
          )}
        </View>
        <Pressable onPress={() => router.push('/(couple)/notifications')} hitSlop={8} style={styles.bell}>
          <Text variant="h2">🔔</Text>
        </Pressable>
      </View>

      {ritualBoards.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {ritualBoards.map((b) => {
            const active = b.id === activeBoard?.id
            const activeCats = b.categories.filter((c) => !c.removed)
            const filled = activeCats.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId]).length
            return (
              <Pressable
                key={b.id}
                onPress={() => setActiveBoardId(b.id)}
                style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
              >
                <Text variant="caption" weight="500" color={active ? colors.white : colors.gray600}>
                  {b.name} · {filled}/{activeCats.length}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}

      {activeBoard ? (
        <BoardView board={activeBoard} vendors={vendors} unlocked={unlocked} onOpenDetail={setDetailVendor} />
      ) : (
        <View style={styles.empty}>
          <Text variant="body" color={colors.gray500} align="center">
            No events yet.
          </Text>
        </View>
      )}

      <SignOutRow />

      {detailVendor && (
        <VendorDetailSheet
          vendor={detailVendor.vendor}
          category={detailVendor.category}
          ritualId={activeBoard!.id}
          unlocked={unlocked}
          onClose={() => setDetailVendor(null)}
        />
      )}
    </Screen>
  )
}

function BoardView({
  board,
  vendors,
  unlocked,
  onOpenDetail,
}: {
  board: RitualBoard
  vendors: Record<string, Vendor>
  unlocked: boolean
  onOpenDetail: (v: { vendor: Vendor; category: Category }) => void
}) {
  const activeCategories = board.categories.filter((c) => !c.removed)
  const filledCategories = activeCategories.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId!])
  const emptyCount = activeCategories.length - filledCategories.length

  const ritualTotal = useMemo(() => {
    let total = 0
    for (const cat of filledCategories) {
      const v = vendors[cat.selectedVendorId!]
      const sel = getCategorySelectionTotal(v, cat)
      total += sel != null ? sel : v.price
    }
    return total
  }, [filledCategories, vendors])

  const dateStr = formatDateRange(board.dateStart, board.dateEnd)

  return (
    <View style={styles.board}>
      <View style={styles.boardHeader}>
        <View style={styles.boardHeaderLeft}>
          <Text variant="title">{board.name}</Text>
          <Text variant="caption" color={colors.gray400}>
            {filledCategories.length}/{activeCategories.length}
          </Text>
        </View>
        <View style={styles.boardHeaderRight}>
          {!!dateStr && (
            <Text variant="caption" color={colors.gray500}>
              {dateStr}
            </Text>
          )}
          <Text variant="small" weight="600" color={colors.magenta}>
            {formatINR(ritualTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {filledCategories.map((cat) => (
          <CategoryTile
            key={cat.id}
            category={cat}
            vendor={vendors[cat.selectedVendorId!]}
            unlocked={unlocked}
            onOpenDetail={() => onOpenDetail({ vendor: vendors[cat.selectedVendorId!], category: cat })}
            onSwap={() => router.push(`/(couple)/category/${board.id}/${cat.id}`)}
          />
        ))}

        {emptyCount > 0 && (
          <Pressable
            style={styles.addTile}
            onPress={() => {
              // Route to the first empty category's board to start picking.
              const firstEmpty = activeCategories.find((c) => !c.selectedVendorId || !vendors[c.selectedVendorId])
              if (firstEmpty) router.push(`/(couple)/category/${board.id}/${firstEmpty.id}`)
            }}
          >
            <View style={styles.addCircle}>
              <Text variant="title" color={colors.magenta}>
                +
              </Text>
            </View>
            <Text variant="caption" color={colors.gray500}>
              {emptyCount} more
            </Text>
          </Pressable>
        )}
      </View>

      {/* All empty categories, listed so the couple can jump straight in. */}
      {activeCategories.filter((c) => !c.selectedVendorId || !vendors[c.selectedVendorId]).length > 0 && (
        <View style={styles.pending}>
          <Text variant="caption" color={colors.gray400} style={styles.pendingLabel}>
            STILL PICKING
          </Text>
          <View style={styles.pendingChips}>
            {activeCategories
              .filter((c) => !c.selectedVendorId || !vendors[c.selectedVendorId])
              .map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.pendingChip}
                  onPress={() => router.push(`/(couple)/category/${board.id}/${cat.id}`)}
                >
                  <Text variant="small" weight="500" color={colors.dark}>
                    {cat.label} ›
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
      )}

      {/* Booking entry. Shown only when unlocked — a locked couple has no
          in-app path to pay (the paywall lives on the web; iOS §3). */}
      {unlocked && filledCategories.length > 0 && (
        <Pressable style={styles.bookBtn} onPress={() => router.push(`/(couple)/booking/${board.id}`)}>
          <Text variant="title" color={colors.white}>
            Book slots →
          </Text>
        </Pressable>
      )}
    </View>
  )
}

function CategoryTile({
  category,
  vendor,
  unlocked,
  onOpenDetail,
  onSwap,
}: {
  category: Category
  vendor: Vendor
  unlocked: boolean
  onOpenDetail: () => void
  onSwap: () => void
}) {
  const sel = getCategorySelectionTotal(vendor, category)
  const price = sel != null ? sel : vendor.price
  const perPlate =
    vendor.category === 'Venue' &&
    (!!category.selectedPlatePackageId ||
      (vendor.venuePricingModels?.includes('perPlate') && !vendor.venuePricingModels?.includes('rent')))

  return (
    <Pressable style={styles.tile} onPress={onOpenDetail}>
      {vendor.photo ? (
        <Image source={{ uri: vendor.photo }} style={styles.tileImg} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.tileImg, styles.tilePlaceholder]} />
      )}
      <View style={styles.tileOverlay} />

      {vendor.booked && (
        <View style={styles.bookedBadge}>
          <Text variant="micro" color={colors.white} weight="600">
            Booked ✓
          </Text>
        </View>
      )}

      <View style={styles.tileTop}>
        <View style={styles.catBadge}>
          <Text variant="micro" weight="500" color={colors.dark}>
            {category.label}
          </Text>
        </View>
        <Pressable onPress={onSwap} hitSlop={8} style={styles.swapBtn}>
          <Text variant="micro" color={colors.white}>
            ⇄
          </Text>
        </Pressable>
      </View>

      <View style={styles.tileBottom}>
        <VendorName vendor={vendor} unlocked={unlocked} variant="small" color={colors.white} numberOfLines={1} />
        <Text variant="body" weight="700" color={colors.white}>
          {vendor.eventPackages?.length ? 'from ' : ''}
          {formatINR(price)}
          {perPlate ? '/plate' : ''}
        </Text>
      </View>
    </Pressable>
  )
}

const TILE_GAP = 10

const styles = StyleSheet.create({
  page: { paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerCopy: { flex: 1 },
  bell: { paddingTop: 2 },
  tabs: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  tabActive: { backgroundColor: colors.magenta },
  tabIdle: { backgroundColor: colors.emptyBg },
  empty: { padding: 32 },
  board: { paddingHorizontal: 16 },
  boardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  boardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tile: {
    // Two columns: flexBasis just under half leaves room for the row gap.
    flexBasis: '47%',
    flexGrow: 0,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  tileImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, },
  tilePlaceholder: { backgroundColor: colors.emptyBg },
  tileOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 8 },
  catBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  swapBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  bookedBadge: { position: 'absolute', top: 6, alignSelf: 'center', backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, zIndex: 2 },
  tileBottom: { padding: 8 },
  addTile: {
    flexBasis: '47%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.emptyBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: { marginTop: 20 },
  pendingLabel: { marginBottom: 8 },
  pendingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pendingChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white },
  bookBtn: { marginTop: 20, backgroundColor: colors.magenta, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
})

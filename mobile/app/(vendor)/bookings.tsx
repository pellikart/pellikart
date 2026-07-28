// Vendor bookings — port of the web VendorBookings.
//
// Upcoming / completed / cancelled tabs, expandable cards showing the payment
// breakdown and the milestone timeline. "Mark next done" advances a milestone
// through the SHARED completeBookingMilestone — the two-way milestone tracking
// the plan calls for, from the vendor's side.

import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import { formatINR, formatDate } from '@shared/helpers'
import { getMilestones } from '@shared/milestones'
import type { VendorBooking } from '@shared/vendor-types'
import { Text } from '@/components/ui'
import { SubHeader } from '@/components/SubHeader'
import { colors, radius } from '@/theme/tokens'

type Tab = 'active' | 'completed' | 'cancelled'
const TAB_LABEL: Record<Tab, string> = { active: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' }

export default function VendorBookings() {
  const vendorBookings = useVendorStore((s) => s.vendorBookings)
  const completeBookingMilestone = useVendorStore((s) => s.completeBookingMilestone)
  const [tab, setTab] = useState<Tab>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = vendorBookings.filter((b) => b.status === tab)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SubHeader title="Bookings" />

      <View style={styles.tabs}>
        {(['active', 'completed', 'cancelled'] as Tab[]).map((t) => {
          const count = vendorBookings.filter((b) => b.status === t).length
          const active = tab === t
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}>
              <Text variant="caption" weight="500" color={active ? colors.white : colors.gray500}>
                {TAB_LABEL[t]} ({count})
              </Text>
            </Pressable>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text variant="small" color={colors.gray400} align="center" style={styles.empty}>
            No {tab === 'active' ? 'upcoming' : tab} bookings
          </Text>
        ) : (
          filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              expanded={expandedId === b.id}
              onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
              onMarkNext={() => completeBookingMilestone(b.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function BookingCard({
  booking: b,
  expanded,
  onToggle,
  onMarkNext,
}: {
  booking: VendorBooking
  expanded: boolean
  onToggle: () => void
  onMarkNext: () => void
}) {
  const milestones = getMilestones(b.category)
  const canMarkNext = b.status === 'active' && b.milestoneProgress < b.totalMilestones
  const statusColor = b.status === 'active' ? colors.mustard : b.status === 'completed' ? colors.success : colors.danger

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle} style={styles.cardHead}>
        <View style={styles.cardTitleRow}>
          <Text variant="small" weight="600">
            {b.coupleNames}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text variant="micro" weight="500" color={statusColor}>
              {b.status === 'active' ? 'Upcoming' : b.status === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
        </View>
        <Text variant="micro" color={colors.gray500}>
          {b.eventName} · {formatDate(b.eventDate)} · {b.packageTier}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text variant="small" weight="700">
            {formatINR(b.totalValue)}{' '}
            <Text variant="micro" color={colors.gray400}>
              {formatINR(b.totalPaid)} paid
            </Text>
          </Text>
          {b.status === 'active' && (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(b.milestoneProgress / b.totalMilestones) * 100}%` }]} />
              </View>
              <Text variant="micro" color={colors.gray400}>
                {b.milestoneProgress}/{b.totalMilestones}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.cardDetail}>
          <Text variant="micro" weight="600" color={colors.gray500} style={styles.detailLabel}>
            PAYMENT
          </Text>
          <DetailRow label="Slot amount" value={formatINR(b.slotAmountPaid)} />
          <DetailRow label="Total paid" value={formatINR(b.totalPaid)} />
          {b.remainingBalance > 0 && <DetailRow label="Remaining" value={formatINR(b.remainingBalance)} accent />}

          {b.status !== 'cancelled' && (
            <>
              <View style={styles.milestoneHead}>
                <Text variant="micro" weight="600" color={colors.gray500}>
                  MILESTONES
                </Text>
                {canMarkNext && (
                  <Pressable onPress={onMarkNext} hitSlop={6}>
                    <Text variant="small" weight="600" color={colors.mustard}>
                      Mark next done →
                    </Text>
                  </Pressable>
                )}
              </View>
              {milestones.map((m, i) => {
                const isDone = i < b.milestoneProgress
                const isCurrent = i === b.milestoneProgress
                return (
                  <View key={m.label} style={styles.milestoneRow}>
                    <View
                      style={[
                        styles.milestoneDot,
                        isDone
                          ? { backgroundColor: colors.mustard }
                          : isCurrent
                            ? { borderWidth: 2, borderColor: colors.mustard }
                            : { borderWidth: 1, borderColor: colors.cardBorder },
                      ]}
                    />
                    <Text
                      variant="small"
                      weight={isDone || isCurrent ? '500' : '400'}
                      color={isDone ? colors.mustard : isCurrent ? colors.dark : colors.gray300}
                    >
                      {m.label}
                    </Text>
                  </View>
                )
              })}
            </>
          )}

          {b.status === 'cancelled' && (
            <Text variant="micro" color={colors.danger} style={styles.cancelNote}>
              Slot amount of {formatINR(b.slotAmountPaid)} forfeited to you.
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="small" color={colors.gray500}>
        {label}
      </Text>
      <Text variant="small" weight={accent ? '700' : '500'} color={accent ? colors.mustard : colors.dark}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.mustard },
  tabIdle: { backgroundColor: colors.emptyBg },
  body: { padding: 16 },
  empty: { paddingVertical: 48 },
  card: { marginBottom: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white, overflow: 'hidden' },
  cardHead: { padding: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTrack: { width: 56, height: 6, borderRadius: 999, backgroundColor: colors.emptyBg, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: colors.mustard },
  cardDetail: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  detailLabel: { marginBottom: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  milestoneHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5 },
  cancelNote: { marginTop: 8 },
})

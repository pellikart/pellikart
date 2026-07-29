// Couple booking flow — port of the web BookingPage.
//
// Lists the vendors selected on a board, each with its booking amount (the
// upfront fee: 5% booking one vendor, 4% booking all together — matching the
// web app's math and its "book together, pay less upfront" incentive). Payment
// goes through payBookingAmount() (the Razorpay seam) before the shared store
// records the booking. Booked vendors show contact actions and the two-way
// milestone tracker; cancelling forfeits the non-refundable amount.

import { useState } from 'react'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@shared/store'
import { formatINR, getCategorySelectionTotal } from '@shared/helpers'
import { Button, Text } from '@/components/ui'
import { VendorName } from '@/components/VendorName'
import { MilestoneTracker } from '@/components/MilestoneTracker'
import { payBookingAmount } from '@/lib/payments'
import { colors, radius } from '@/theme/tokens'

export default function BookingScreen() {
  const { ritualId } = useLocalSearchParams<{ ritualId: string }>()
  const ritualBoards = useStore((s) => s.ritualBoards)
  const vendors = useStore((s) => s.vendors)
  const subscription = useStore((s) => s.subscription)
  const bookVendor = useStore((s) => s.bookVendor)
  const bookAllVendors = useStore((s) => s.bookAllVendors)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const trialSessions = useStore((s) => s.trialSessions)
  // listing id → vendors.id, so Route transfers target the vendor's linked
  // account. Empty in demo (no gateway), which is fine — payment is simulated.
  const listingVendorMap = useStore((s) => s._listingVendorMap)

  const unlocked = subscription !== 'free'
  const [busy, setBusy] = useState(false)
  const [cancelDialog, setCancelDialog] = useState<{ vendorId: string; name: string; amount: number } | null>(null)

  const board = ritualBoards.find((b) => b.id === ritualId)
  if (!board) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text variant="body" color={colors.gray500}>
            Board not found.
          </Text>
          <Button label="← Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    )
  }

  const vendorList = board.categories
    .filter((c) => !c.removed && c.selectedVendorId)
    .map((cat) => {
      const vendor = vendors[cat.selectedVendorId!]
      const effectivePrice = getCategorySelectionTotal(vendor, cat) ?? vendor?.price ?? 0
      return { cat, vendor, effectivePrice }
    })
    .filter((x) => x.vendor)

  const unbooked = vendorList.filter((x) => !x.vendor.booked)
  const booked = vendorList.filter((x) => x.vendor.booked)
  const unbookedTotal = unbooked.reduce((s, x) => s + x.effectivePrice, 0)
  const bookAllAmount = Math.round(unbookedTotal * 0.04)
  const separateTotal = Math.round(unbookedTotal * 0.05)
  const savings = separateTotal - bookAllAmount
  const allBooked = unbooked.length === 0

  async function pay(
    amount: number,
    description: string,
    commit: () => void,
    splits?: { vendorId: string; amount: number }[]
  ) {
    if (busy) return
    setBusy(true)
    const res = await payBookingAmount({ amount, description, splits })
    setBusy(false)
    if (res.ok) commit()
  }

  function contact(scheme: 'tel' | 'whatsapp', number: string) {
    const digits = number.replace(/[^0-9]/g, '')
    const url = scheme === 'tel' ? `tel:${number}` : `https://wa.me/${digits}`
    Linking.openURL(url).catch(() => {})
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text variant="title">←</Text>
        </Pressable>
        <Text variant="title">
          {board.name} <Text variant="caption" color={colors.gray400}>Booking</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {vendorList.map(({ cat, vendor, effectivePrice }) => {
          const amount = Math.round(effectivePrice * 0.05)
          const trialDone = trialSessions[`${ritualId}-${cat.id}-${vendor.id}`]?.status === 'done'
          return (
            <View key={vendor.id} style={styles.row}>
              <View style={styles.rowTop}>
                {vendor.photo ? (
                  <Image source={{ uri: vendor.photo }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.rowCopy}>
                  <View style={styles.badgeRow}>
                    <View style={styles.catBadge}>
                      <Text variant="micro" weight="500" color={colors.magenta}>
                        {cat.label}
                      </Text>
                    </View>
                    <VendorName vendor={vendor} unlocked={unlocked} variant="small" numberOfLines={1} style={styles.grow} />
                    {vendor.booked && (
                      <View style={styles.bookedBadge}>
                        <Text variant="micro" weight="600" color={colors.success}>
                          Booked ✓
                        </Text>
                      </View>
                    )}
                    {!vendor.booked && trialDone && (
                      <View style={styles.bookedBadge}>
                        <Text variant="micro" weight="500" color={colors.success}>
                          Visit ✓
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text variant="small" weight="600">
                    {formatINR(effectivePrice)}
                  </Text>
                  {vendor.booked && (
                    <Text variant="micro" color={colors.success}>
                      {formatINR(vendor.amountPaid)} paid
                    </Text>
                  )}
                </View>

                {!vendor.booked ? (
                  <Button
                    label={`Book · ${formatINR(amount)}`}
                    variant="primary"
                    onPress={() =>
                      pay(
                        amount,
                        `${vendor.name || vendor.code} · ${board.name}`,
                        () => bookVendor(vendor.id, amount),
                        [{ vendorId: listingVendorMap[vendor.id], amount }]
                      )
                    }
                    style={styles.bookBtn}
                  />
                ) : (
                  <View style={styles.bookedActions}>
                    {unlocked && !!vendor.phone && (
                      <Pressable onPress={() => contact('tel', vendor.phone!)} style={styles.iconBtn}>
                        <Text variant="small">📞</Text>
                      </Pressable>
                    )}
                    {unlocked && !!(vendor.whatsapp || vendor.phone) && (
                      <Pressable onPress={() => contact('whatsapp', vendor.whatsapp || vendor.phone!)} style={styles.iconBtn}>
                        <Text variant="small">💬</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => setCancelDialog({ vendorId: vendor.id, name: vendor.name || vendor.code, amount: vendor.amountPaid })}
                      hitSlop={6}
                    >
                      <Text variant="micro" weight="500" color={colors.danger}>
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {vendor.booked && <MilestoneTracker categoryLabel={cat.label} vendorId={vendor.id} />}
            </View>
          )
        })}

        {!allBooked && unbooked.length > 1 && (
          <View style={styles.savings}>
            <Text variant="small" color={colors.dark}>
              <Text variant="small" weight="600">Book together:</Text> {formatINR(bookAllAmount)}.{' '}
              <Text variant="small" weight="600">Separately:</Text> {formatINR(separateTotal)}.{' '}
              <Text variant="small" weight="700" color={colors.magenta}>Save {formatINR(savings)}</Text> upfront.
            </Text>
          </View>
        )}

        {allBooked && vendorList.length > 0 && (
          <View style={styles.done}>
            <Text variant="h2" align="center">
              🎉
            </Text>
            <Text variant="title" align="center">
              All vendors booked!
            </Text>
            <Text variant="small" color={colors.gray500} align="center" style={styles.doneSub}>
              Total paid: {formatINR(booked.reduce((s, x) => s + x.vendor.amountPaid, 0))}
            </Text>
          </View>
        )}

        <Text variant="micro" color={colors.gray400} align="center" style={styles.warn}>
          ★ Slot bookings are non-refundable. Swapping a vendor after booking forfeits the amount.
        </Text>
      </ScrollView>

      {!allBooked && unbooked.length > 0 && (
        <View style={styles.footer}>
          <Button
            label={`${booked.length > 0 ? `Book remaining ${unbooked.length}` : 'Book all slots'} — ${formatINR(bookAllAmount)}`}
            variant="primary"
            loading={busy}
            onPress={() =>
              pay(
                bookAllAmount,
                `${board.name} · all vendors`,
                () => bookAllVendors(ritualId!),
                // Each vendor's booking amount (4% of their price) → their account.
                unbooked.map((x) => ({
                  vendorId: listingVendorMap[x.vendor.id],
                  amount: Math.round(x.effectivePrice * 0.04),
                }))
              )
            }
          />
        </View>
      )}

      <Modal visible={!!cancelDialog} transparent animationType="fade" onRequestClose={() => setCancelDialog(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="title">Cancel this booking?</Text>
            <Text variant="small" color={colors.gray600} style={styles.modalBody}>
              You&apos;ve paid {formatINR(cancelDialog?.amount ?? 0)} to lock {cancelDialog?.name}&apos;s slot. This amount
              is non-refundable — cancelling forfeits it.
            </Text>
            <View style={styles.modalActions}>
              <Button label="Keep booking" variant="secondary" onPress={() => setCancelDialog(null)} style={styles.grow} />
              <Button
                label="Cancel & forfeit"
                variant="primary"
                onPress={() => {
                  if (cancelDialog) cancelBooking(cancelDialog.vendorId)
                  setCancelDialog(null)
                }}
                style={styles.grow}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  body: { padding: 16, paddingBottom: 24 },
  grow: { flex: 1 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.emptyBg },
  rowCopy: { flex: 1, gap: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { backgroundColor: colors.magentaLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  bookedBadge: { backgroundColor: 'rgba(22,163,74,0.12)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  bookBtn: { width: 128 },
  bookedActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.emptyBg, alignItems: 'center', justifyContent: 'center' },
  savings: { marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.mustardLight, borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)' },
  done: { marginTop: 16, alignItems: 'center', gap: 2 },
  doneSub: { marginTop: 2 },
  warn: { marginTop: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: colors.white, borderRadius: radius.lg, padding: 20 },
  modalBody: { marginTop: 8, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
})

// Vendor detail — the couple's read/act sheet for one listing.
//
// A focused port of the web app's ListingDetailSheet. It reproduces the parts
// every category shares — photos, the paywalled identity, price, rating,
// description, what's included, and (only once unlocked) contact details — plus
// the two primary actions: add this vendor to the event, and request a visit /
// tasting.
//
// The web sheet also hosts large per-category *selection editors* (the mehendi
// coverage matrix, makeup looks, the catering menu picker, venue plate
// packages). Those are a sizable sub-project of their own and are deferred; the
// sheet shows the vendor's "from" price and notes where a detailed selection
// will live. Selecting still records the pick, so the board and totals work.
//
// Paywall + store compliance (plan §3): contact details and the visit action
// only appear when `unlocked`. Nothing here links to buying an unlock.

import { useMemo, useState } from 'react'
import { Image } from 'expo-image'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@shared/store'
import { formatINR } from '@shared/helpers'
import type { Category, Vendor } from '@shared/types'
import { Button, Text } from '@/components/ui'
import { Chip } from '@/components/inputs'
import { DateField } from '@/components/DateField'
import { VendorName } from '@/components/VendorName'
import { colors, radius } from '@/theme/tokens'

const VISIT_TIMES = ['10:00', '12:00', '15:00', '17:00', '19:00']

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

export function VendorDetailSheet({
  vendor,
  category,
  ritualId,
  unlocked,
  onClose,
}: {
  vendor: Vendor
  category: Category
  ritualId: string
  unlocked: boolean
  onClose: () => void
}) {
  const selectVendor = useStore((s) => s.selectVendor)
  const requestTrial = useStore((s) => s.requestTrial)
  const getMaxTrials = useStore((s) => s.getMaxTrials)
  const trialSessions = useStore((s) => s.trialSessions)
  const trialsUsed = useStore((s) => s.trialsUsed)

  const [expanded, setExpanded] = useState(false)
  const [showVisit, setShowVisit] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')

  const photos = useMemo(() => {
    const all = [
      ...(vendor.listingPhotos ?? []),
      ...(vendor.portfolioPhotos ?? []),
      vendor.photo,
    ].filter(Boolean)
    return [...new Set(all)]
  }, [vendor])

  const isSelected = category.selectedVendorId === vendor.id
  const trialKey = `${ritualId}-${category.id}-${vendor.id}`
  const existingTrial = trialSessions[trialKey]
  const catKey = `${ritualId}-${category.id}`
  const trialsLeft = getMaxTrials() - (trialsUsed[catKey] || 0)

  function handleSelect() {
    selectVendor(ritualId, category.id, vendor.id)
    onClose()
  }

  function handleRequestVisit() {
    if (!visitDate || !visitTime) return
    requestTrial(ritualId, category.id, vendor.id, visitDate, visitTime)
    setShowVisit(false)
  }

  const description = (vendor.description ?? '').trim()
  const showMore = description.length > 180
  const shownDescription = expanded || !showMore ? description : `${description.slice(0, 180)}…`

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <VendorName vendor={vendor} unlocked={unlocked} variant="title" numberOfLines={1} style={styles.headerName} />
          <Pressable onPress={onClose} hitSlop={10}>
            <Text variant="title" color={colors.gray500}>
              ✕
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Photos */}
          {photos.length > 0 && (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {photos.map((uri, i) => (
                <Image key={`${uri}-${i}`} source={{ uri }} style={styles.photo} contentFit="cover" transition={150} />
              ))}
            </ScrollView>
          )}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              {!!vendor.style && (
                <Text variant="small" color={colors.gray500}>
                  {vendor.style}
                </Text>
              )}
              {!!vendor.area && (
                <Text variant="caption" color={colors.gray400}>
                  {vendor.area}
                </Text>
              )}
            </View>
            <View style={styles.metaRight}>
              <Text variant="title" color={colors.magenta}>
                {vendor.eventPackages?.length ? 'from ' : ''}
                {formatINR(vendor.price)}
              </Text>
              {vendor.rating > 0 && (
                <Text variant="caption" color={colors.gray500}>
                  ★ {vendor.rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>

          {vendor.booked && (
            <View style={styles.bookedRow}>
              <Text variant="small" weight="600" color={colors.success}>
                ✓ Booked for this event
              </Text>
            </View>
          )}

          {/* Description */}
          {!!description && (
            <View style={styles.section}>
              <Text variant="body" color={colors.gray600} style={styles.descText}>
                {shownDescription}
              </Text>
              {showMore && (
                <Pressable onPress={() => setExpanded((v) => !v)}>
                  <Text variant="small" weight="600" color={colors.magenta}>
                    {expanded ? 'See less' : 'See more'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Includes */}
          {!!vendor.includes?.length && (
            <View style={styles.section}>
              <Text variant="caption" color={colors.gray400} style={styles.sectionLabel}>
                WHAT&apos;S INCLUDED
              </Text>
              <View style={styles.includeWrap}>
                {vendor.includes.map((inc) => (
                  <View key={inc} style={styles.includePill}>
                    <Text variant="small" color={colors.dark}>
                      {inc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact — unlocked only (paywall). */}
          {unlocked && (vendor.phone || vendor.whatsapp || vendor.instagram) && (
            <View style={styles.section}>
              <Text variant="caption" color={colors.gray400} style={styles.sectionLabel}>
                CONTACT
              </Text>
              {!!vendor.phone && (
                <Text variant="body" color={colors.dark}>
                  📞 {vendor.phone}
                </Text>
              )}
              {!!vendor.whatsapp && (
                <Text variant="body" color={colors.dark}>
                  💬 {vendor.whatsapp}
                </Text>
              )}
              {!!vendor.instagram && (
                <Text variant="body" color={colors.dark}>
                  📷 {vendor.instagram}
                </Text>
              )}
            </View>
          )}

          {!unlocked && (
            <View style={styles.lockedNote}>
              <Text variant="small" color={colors.gray500} align="center">
                This vendor is locked. Names, contact details and visits unlock with a plan.
              </Text>
            </View>
          )}

          {/* Visit / tasting request — unlocked only. */}
          {unlocked && showVisit && (
            <View style={styles.section}>
              <Text variant="caption" color={colors.gray400} style={styles.sectionLabel}>
                REQUEST A VISIT / TASTING
              </Text>
              <DateField label="Preferred date" value={visitDate} onChange={setVisitDate} minimumDate={todayISO()} />
              <View style={styles.timeRow}>
                {VISIT_TIMES.map((t) => (
                  <Chip key={t} label={fmtTime(t)} selected={visitTime === t} onPress={() => setVisitTime(t)} style={styles.timeChip} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky actions */}
        <View style={styles.footer}>
          {existingTrial ? (
            <View style={styles.trialStatus}>
              <Text variant="small" weight="600" color={colors.magenta}>
                Visit {existingTrial.status === 'requested' ? 'requested' : existingTrial.status} · {existingTrial.requestedDate}
              </Text>
            </View>
          ) : unlocked && showVisit ? (
            <Button
              label="Send visit request"
              variant="secondary"
              disabled={!visitDate || !visitTime}
              onPress={handleRequestVisit}
            />
          ) : unlocked && trialsLeft > 0 ? (
            <Button label={`Request a visit (${trialsLeft} left)`} variant="secondary" onPress={() => setShowVisit(true)} />
          ) : null}

          <Button
            label={isSelected ? '✓ Added to this event' : 'Add to this event'}
            variant="primary"
            disabled={isSelected}
            onPress={handleSelect}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  headerName: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  gallery: { marginHorizontal: -20 },
  photo: { width: 320, height: 220, borderRadius: radius.md, marginLeft: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16 },
  metaLeft: { flex: 1, gap: 2 },
  metaRight: { alignItems: 'flex-end', gap: 2 },
  bookedRow: { marginTop: 12 },
  section: { marginTop: 20 },
  sectionLabel: { marginBottom: 8 },
  descText: { lineHeight: 20, marginBottom: 4 },
  includeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  includePill: { backgroundColor: colors.emptyBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  lockedNote: { marginTop: 20, padding: 12, borderRadius: radius.md, backgroundColor: colors.magentaLight },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  timeChip: { paddingHorizontal: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder, gap: 10 },
  trialStatus: { alignItems: 'center', paddingVertical: 8 },
})

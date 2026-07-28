// Vendor availability calendar — interactive port of the web VendorCalendar.
//
// One of the plan's two heaviest items. A month grid where the vendor taps an
// available date to block it (whole day or a time range, all listings or
// specific ones) and taps a blocked date to clear it. Booked dates are locked.
// Everything persists through the SHARED `toggleDateBlock`, so the block a
// vendor sets here is the same block that hides the listing from couples on the
// web — enforced in one place, never drifting between platforms.

import { useState } from 'react'
import { Image } from 'expo-image'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import type { BlockedTimeRange } from '@shared/vendor-types'
import { Button, Text } from '@/components/ui'
import { colors, radius } from '@/theme/tokens'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const AMBER = '#f59e0b'
const MAX_MONTH_OFFSET = 5

// 06:00 … 23:30 in 30-min steps, matching the web's time options.
const TIME_OPTIONS: string[] = []
for (let h = 6; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function formatTime(t: string) {
  const [hStr, m] = t.split(':')
  const h = parseInt(hStr, 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${suffix}`
}

function isoFor(year: number, monthIndex0: number, day: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function VendorCalendar() {
  const vendorAvailability = useVendorStore((s) => s.vendorAvailability)
  const toggleDateBlock = useVendorStore((s) => s.toggleDateBlock)
  const vendorListings = useVendorStore((s) => s.vendorListings)

  const [monthOffset, setMonthOffset] = useState(0)
  const [blockSheet, setBlockSheet] = useState<string | null>(null)
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const [blockAll, setBlockAll] = useState(true)
  const [blockFullDay, setBlockFullDay] = useState(true)
  const [fromTime, setFromTime] = useState('09:00')
  const [toTime, setToTime] = useState('17:00')

  const today = new Date()
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = viewMonth.getDay()
  const monthName = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const todayStr = isoFor(today.getFullYear(), today.getMonth(), today.getDate())

  function handleDateTap(dateStr: string) {
    const current = vendorAvailability[dateStr]
    if (current?.status === 'booked') return
    if (current?.status === 'blocked') {
      toggleDateBlock(dateStr, [], []) // toggling a blocked date clears it
      return
    }
    setBlockSheet(dateStr)
    setSelectedListingIds([])
    setBlockAll(true)
    setBlockFullDay(true)
    setFromTime('09:00')
    setToTime('17:00')
  }

  function confirmBlock() {
    if (!blockSheet) return
    const ranges: BlockedTimeRange[] = blockFullDay ? [] : [{ from: fromTime, to: toTime }]
    toggleDateBlock(blockSheet, blockAll ? [] : selectedListingIds, ranges)
    setBlockSheet(null)
  }

  const timeValid = blockFullDay || fromTime < toTime
  const canConfirm = timeValid && (blockAll || selectedListingIds.length > 0)

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.headerBar}>
        <Text variant="title">Availability Calendar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => setMonthOffset((m) => Math.max(m - 1, 0))}
            disabled={monthOffset === 0}
            hitSlop={8}
          >
            <Text variant="small" weight="500" color={monthOffset === 0 ? colors.gray300 : colors.dark}>
              ← Prev
            </Text>
          </Pressable>
          <Text variant="body" weight="600">
            {monthName}
          </Text>
          <Pressable
            onPress={() => setMonthOffset((m) => Math.min(m + 1, MAX_MONTH_OFFSET))}
            disabled={monthOffset >= MAX_MONTH_OFFSET}
            hitSlop={8}
          >
            <Text
              variant="small"
              weight="500"
              color={monthOffset >= MAX_MONTH_OFFSET ? colors.gray300 : colors.dark}
            >
              Next →
            </Text>
          </Pressable>
        </View>

        {/* Grid */}
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} variant="micro" color={colors.gray400} align="center" style={styles.cell}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`e-${i}`} style={styles.cell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dateStr = isoFor(viewMonth.getFullYear(), viewMonth.getMonth(), d)
              const entry = vendorAvailability[dateStr]
              const status = entry?.status || 'available'
              const isPast = dateStr < todayStr
              const isToday = dateStr === todayStr
              const isPartial =
                status === 'blocked' &&
                ((entry?.listingIds?.length ?? 0) > 0 || (entry?.blockedRanges?.length ?? 0) > 0)

              const bg =
                status === 'booked'
                  ? colors.magenta
                  : status === 'blocked'
                    ? isPartial
                      ? AMBER
                      : colors.gray400
                    : colors.white
              const fg =
                isPast
                  ? colors.gray300
                  : status === 'available'
                    ? colors.dark
                    : colors.white

              return (
                <Pressable
                  key={d}
                  onPress={() => !isPast && handleDateTap(dateStr)}
                  disabled={isPast || status === 'booked'}
                  style={[
                    styles.day,
                    { backgroundColor: bg },
                    isToday && status === 'available' && styles.today,
                  ]}
                >
                  <Text variant="small" weight="500" color={fg}>
                    {d}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <LegendDot color={colors.white} border label="Available" />
          <LegendDot color={colors.gray400} label="Blocked (full day)" />
          <LegendDot color={AMBER} label="Blocked (partial)" />
          <LegendDot color={colors.magenta} label="Booked" />
        </View>
        <Text variant="caption" color={colors.gray400} align="center" style={styles.hint}>
          Tap available dates to block. Tap blocked dates to unblock.
        </Text>
      </ScrollView>

      {/* Block sheet */}
      <Modal visible={!!blockSheet} transparent animationType="slide" onRequestClose={() => setBlockSheet(null)}>
        <Pressable style={styles.backdrop} onPress={() => setBlockSheet(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="title">Block {blockSheet}</Text>
              <Text variant="caption" color={colors.gray400} style={styles.sheetSub}>
                Choose how much of this day to block.
              </Text>

              <Text variant="caption" weight="600" color={colors.dark} style={styles.groupLabel}>
                TIME
              </Text>
              <OptionRow label="Full day" selected={blockFullDay} onPress={() => setBlockFullDay(true)} />
              <OptionRow label="Custom time range" selected={!blockFullDay} onPress={() => setBlockFullDay(false)} />

              {!blockFullDay && (
                <View style={styles.timeBox}>
                  <Text variant="caption" color={colors.gray400}>
                    From
                  </Text>
                  <TimeScroller value={fromTime} options={TIME_OPTIONS} onSelect={setFromTime} />
                  <Text variant="caption" color={colors.gray400} style={styles.toLabel}>
                    To
                  </Text>
                  <TimeScroller
                    value={toTime}
                    options={TIME_OPTIONS.filter((t) => t > fromTime)}
                    onSelect={setToTime}
                  />
                  {!timeValid && (
                    <Text variant="caption" color={colors.danger} style={styles.timeError}>
                      End time must be after start time.
                    </Text>
                  )}
                </View>
              )}

              {vendorListings.length > 0 && (
                <>
                  <Text variant="caption" weight="600" color={colors.dark} style={styles.groupLabel}>
                    LISTINGS
                  </Text>
                  <OptionRow
                    label="Block all listings"
                    selected={blockAll}
                    onPress={() => {
                      setBlockAll(true)
                      setSelectedListingIds([])
                    }}
                  />
                  <OptionRow
                    label="Block specific listings only"
                    selected={!blockAll}
                    onPress={() => setBlockAll(false)}
                  />

                  {!blockAll && (
                    <View style={styles.listingList}>
                      {vendorListings.map((l) => {
                        const selected = selectedListingIds.includes(l.id)
                        return (
                          <Pressable
                            key={l.id}
                            onPress={() =>
                              setSelectedListingIds((prev) =>
                                prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id]
                              )
                            }
                            style={[styles.listingRow, selected && styles.listingRowSelected]}
                          >
                            {l.photos?.[0] ? (
                              <Image source={{ uri: l.photos[0] }} style={styles.listingThumb} contentFit="cover" />
                            ) : (
                              <View style={[styles.listingThumb, styles.thumbPlaceholder]} />
                            )}
                            <View style={styles.listingCopy}>
                              <Text variant="small" weight="500" numberOfLines={1}>
                                {l.name}
                              </Text>
                              {!!l.style && (
                                <Text variant="micro" color={colors.gray400}>
                                  {l.style}
                                </Text>
                              )}
                            </View>
                            {selected && (
                              <Text variant="body" color={colors.mustard}>
                                ✓
                              </Text>
                            )}
                          </Pressable>
                        )
                      })}
                    </View>
                  )}
                </>
              )}

              <Button
                label={blockFullDay ? 'Block full day' : `Block ${formatTime(fromTime)} – ${formatTime(toTime)}`}
                variant="vendor"
                disabled={!canConfirm}
                onPress={confirmBlock}
                style={styles.confirmBtn}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function LegendDot({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }, border && styles.legendDotBorder]} />
      <Text variant="micro" color={colors.gray500}>
        {label}
      </Text>
    </View>
  )
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.optionRow, selected ? styles.optionSelected : styles.optionIdle]}>
      <Text variant="small" weight="500" color={selected ? colors.mustard : colors.gray600}>
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  )
}

function TimeScroller({
  value,
  options,
  onSelect,
}: {
  value: string
  options: string[]
  onSelect: (t: string) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
      {options.map((t) => (
        <Pressable
          key={t}
          onPress={() => onSelect(t)}
          style={[styles.timeChip, value === t ? styles.timeChipActive : styles.timeChipIdle]}
        >
          <Text variant="small" weight="500" color={value === t ? colors.white : colors.dark}>
            {formatTime(t)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  headerBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  body: { padding: 16, paddingBottom: 32 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calendar: { backgroundColor: colors.emptyBg, borderRadius: radius.lg, padding: 12 },
  weekRow: { flexDirection: 'row' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, paddingVertical: 4 },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginVertical: 2,
  },
  today: { borderWidth: 2, borderColor: colors.mustard },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendDotBorder: { borderWidth: 1, borderColor: colors.cardBorder },
  hint: { marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28, maxHeight: '85%' },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: 12 },
  sheetSub: { marginTop: 4, marginBottom: 8 },
  groupLabel: { marginTop: 14, marginBottom: 8 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.md, marginBottom: 8 },
  optionSelected: { borderWidth: 2, borderColor: colors.mustard, backgroundColor: colors.mustardLight },
  optionIdle: { borderWidth: 1, borderColor: colors.cardBorder },
  timeBox: { backgroundColor: colors.emptyBg, borderRadius: radius.md, padding: 12, marginBottom: 4 },
  toLabel: { marginTop: 10 },
  timeError: { marginTop: 8 },
  timeScroller: { gap: 6, paddingVertical: 6 },
  timeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  timeChipActive: { backgroundColor: colors.mustard },
  timeChipIdle: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder },
  listingList: { gap: 6, marginBottom: 4 },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  listingRowSelected: { borderWidth: 2, borderColor: colors.mustard, backgroundColor: colors.mustardLight },
  listingThumb: { width: 32, height: 32, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.emptyBg },
  listingCopy: { flex: 1 },
  confirmBtn: { marginTop: 16 },
})

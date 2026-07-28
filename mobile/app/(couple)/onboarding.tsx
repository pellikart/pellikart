// Couple onboarding — port of the web app's OnboardingPage.
//
// Same seven screens, same copy, same validation gates, same per-event budget
// defaults. It calls the SHARED store's completeOnboarding(data), which is the
// single source of truth for board generation and the Supabase write — so web
// and mobile produce identical boards from identical answers.
//
// Two web-only bits are adapted, not dropped:
//   • navigator.geolocation + a fetch reverse-geocode → expo-location (see
//     useCurrentLocation).
//   • <input type="date"> / <input type="range"> → native picker + slider.

import { useMemo, useState } from 'react'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Slider from '@react-native-community/slider'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '@shared/store'
import { formatINR } from '@shared/helpers'
import type { OnboardingData } from '@shared/types'
import { Button, Text } from '@/components/ui'
import { Field, Chip, ProgressBar } from '@/components/inputs'
import { DateField } from '@/components/DateField'
import { useCurrentLocation } from '@/lib/useCurrentLocation'
import { colors, spacing } from '@/theme/tokens'

const PRESET_EVENTS = [
  'Engagement',
  'Pelli Choopulu',
  'Bottu',
  'Haldi',
  'Mehendi',
  'Sangeeth',
  'Pelli Koduku/Pellikuthuru Function',
  'Pelli (Wedding)',
  'Reception',
]
const GUEST_OPTIONS = ['100-200', '200-500', '500-1000', '1000+']
const EVENT_BUDGET_MIN = 25000
const EVENT_BUDGET_MAX = 5000000
const EVENT_BUDGET_STEP = 25000
const TOTAL_STEPS = 7

// Copied verbatim from OnboardingPage so the starting budgets line up with web.
function defaultBudgetFor(event: string): number {
  const lower = event.toLowerCase()
  if (lower.includes('pelli') && lower.includes('wedding')) return 1000000
  if (lower === 'reception') return 600000
  if (lower === 'sangeeth' || lower === 'mehendi') return 300000
  if (lower.includes('pre-wedding') || lower.includes('pre wedding')) return 75000
  return 200000
}

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const { detect, locating, error: geoError, setError: setGeoError } = useCurrentLocation()

  const [step, setStep] = useState(1)
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [customEvent, setCustomEvent] = useState('')
  const [customEvents, setCustomEvents] = useState<string[]>([])
  const [eventDates, setEventDates] = useState<Record<string, { start: string; end: string } | null>>({})
  const [tbdDates, setTbdDates] = useState<Record<string, boolean>>({})
  const [eventGuests, setEventGuests] = useState<Record<string, string>>({})
  const [eventBudgets, setEventBudgets] = useState<Record<string, number>>({})

  const allEvents = useMemo(() => [...selectedEvents, ...customEvents], [selectedEvents, customEvents])
  const totalBudget = allEvents.reduce((sum, e) => sum + (eventBudgets[e] ?? defaultBudgetFor(e)), 0)

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  function toggleEvent(e: string) {
    setSelectedEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))
  }
  function addCustomEvent() {
    const t = customEvent.trim()
    if (t && !customEvents.includes(t) && !selectedEvents.includes(t)) {
      setCustomEvents((prev) => [...prev, t])
      setCustomEvent('')
    }
  }

  async function handleDetectLocation() {
    const r = await detect()
    if (r) {
      setLocation(r.label)
      setCoords({ lat: r.lat, lng: r.lng })
    }
  }

  function handleComplete() {
    const finalEventBudgets: Record<string, number> = {}
    for (const e of allEvents) finalEventBudgets[e] = eventBudgets[e] ?? defaultBudgetFor(e)
    const data: OnboardingData = {
      partner1: partner1.trim(),
      partner2: partner2.trim(),
      events: selectedEvents,
      customEvents,
      eventDates,
      eventGuests,
      budget: totalBudget,
      eventBudgets: finalEventBudgets,
      style: null,
      location: location.trim() || null,
      locationLat: coords?.lat ?? null,
      locationLng: coords?.lng ?? null,
    }
    completeOnboarding(data)
    router.replace('/(couple)')
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {step > 1 && step < 7 && <ProgressBar value={step / TOTAL_STEPS} />}
      {step > 1 && (
        <Pressable onPress={back} style={styles.backBtn} accessibilityRole="button">
          <Text variant="small" color={colors.gray500}>
            ← Back
          </Text>
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.centerStep}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="cover" />
            <Text variant="h1" align="center">
              Let&apos;s plan your{'\n'}dream wedding
            </Text>
            <Text variant="body" color={colors.gray500} align="center" style={styles.lead}>
              A few quick questions and your personalized wedding board will be ready.
            </Text>
            <View style={styles.cta}>
              <Button label="Let's go" variant="primary" onPress={next} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepBody}>
            <Text variant="h1">Who&apos;s getting married?</Text>
            <View style={styles.fields}>
              <Field label="Partner 1" value={partner1} onChangeText={setPartner1} placeholder="Enter name" autoCapitalize="words" />
              <Field label="Partner 2" value={partner2} onChangeText={setPartner2} placeholder="Enter name" autoCapitalize="words" />
              <View>
                <Field
                  label="Where do you live?"
                  optional
                  value={location}
                  onChangeText={(v) => {
                    setLocation(v)
                    setCoords(null)
                  }}
                  placeholder="Locality or home address"
                />
                <Pressable onPress={handleDetectLocation} disabled={locating} style={styles.locBtn}>
                  <Text variant="small" weight="500" color={locating ? colors.gray400 : colors.magenta}>
                    📍 {locating ? 'Locating…' : 'Use current location'}
                  </Text>
                </Pressable>
                {!!geoError && (
                  <Text variant="caption" color={colors.danger} style={styles.tight}>
                    {geoError}
                  </Text>
                )}
                <Text variant="small" color={colors.gray400} style={styles.tight}>
                  Sharing your location helps us show venues and vendors near you.
                </Text>
              </View>
            </View>
            <Button
              label="Next"
              variant="primary"
              disabled={!partner1.trim() || !partner2.trim()}
              onPress={() => {
                setGeoError(null)
                next()
              }}
              style={styles.stepCta}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepBody}>
            <Text variant="h1">Which events are you planning?</Text>
            <View style={styles.eventGrid}>
              {PRESET_EVENTS.map((e) => (
                <Chip
                  key={e}
                  label={e}
                  selected={selectedEvents.includes(e)}
                  onPress={() => toggleEvent(e)}
                  style={styles.eventChip}
                />
              ))}
            </View>
            {customEvents.map((e) => (
              <View key={e} style={styles.customRow}>
                <Chip label={e} selected onPress={() => {}} style={styles.customChip} />
                <Pressable onPress={() => setCustomEvents((prev) => prev.filter((x) => x !== e))}>
                  <Text variant="small" color={colors.gray400}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            ))}
            <View style={styles.customAddRow}>
              <View style={styles.grow}>
                <Field value={customEvent} onChangeText={setCustomEvent} placeholder="+ Add custom event" onSubmitEditing={addCustomEvent} />
              </View>
              {!!customEvent.trim() && <Button label="Add" variant="primary" onPress={addCustomEvent} style={styles.addBtn} />}
            </View>
            <Text variant="small" color={colors.gray400} style={styles.note}>
              We&apos;ll create a dedicated planning board for each event you select.
            </Text>
            <Button label="Next" variant="primary" disabled={allEvents.length === 0} onPress={next} style={styles.stepCta} />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepBody}>
            <Text variant="h1">When are your events?</Text>
            <Text variant="small" color={colors.gray400} style={styles.subhead}>
              Dates help vendors check availability and lock your slots.
            </Text>
            {allEvents.map((e) => {
              const tbd = tbdDates[e]
              return (
                <View key={e} style={styles.dateRow}>
                  <View style={styles.dateHead}>
                    <Text variant="body" weight="500">
                      {e}
                    </Text>
                    <Chip
                      label="Not decided yet"
                      selected={!!tbd}
                      onPress={() => {
                        setTbdDates((prev) => ({ ...prev, [e]: !prev[e] }))
                        if (!tbd) setEventDates((prev) => ({ ...prev, [e]: null }))
                      }}
                      style={styles.tbdChip}
                    />
                  </View>
                  {tbd ? (
                    <Text variant="caption" color={colors.gray400}>
                      Dates TBD — you can set this later
                    </Text>
                  ) : (
                    <View style={styles.dateFields}>
                      <DateField
                        label="Start date"
                        value={eventDates[e]?.start}
                        onChange={(iso) =>
                          setEventDates((prev) => ({ ...prev, [e]: { start: iso, end: prev[e]?.end || iso } }))
                        }
                      />
                      <Text variant="body" color={colors.gray300} style={styles.arrow}>
                        →
                      </Text>
                      <DateField
                        label="End date"
                        value={eventDates[e]?.end || eventDates[e]?.start}
                        minimumDate={eventDates[e]?.start}
                        onChange={(iso) =>
                          setEventDates((prev) => ({ ...prev, [e]: { start: prev[e]?.start || iso, end: iso } }))
                        }
                      />
                    </View>
                  )}
                </View>
              )
            })}
            <Button
              label="Next"
              variant="primary"
              disabled={!allEvents.every((e) => tbdDates[e] || eventDates[e]?.start)}
              onPress={next}
              style={styles.stepCta}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepBody}>
            <Text variant="h1">How many guests per event?</Text>
            <Text variant="small" color={colors.gray400} style={styles.subhead}>
              Guest count shapes venue options, catering packages, and pricing.
            </Text>
            {allEvents.map((e) => (
              <View key={e} style={styles.guestRow}>
                <Text variant="body" weight="500" style={styles.guestLabel}>
                  {e}
                </Text>
                <View style={styles.guestOpts}>
                  {GUEST_OPTIONS.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      selected={eventGuests[e] === g}
                      onPress={() => setEventGuests((prev) => ({ ...prev, [e]: g }))}
                      style={styles.guestChip}
                    />
                  ))}
                </View>
              </View>
            ))}
            <Button
              label="Next"
              variant="primary"
              disabled={!allEvents.every((e) => eventGuests[e])}
              onPress={next}
              style={styles.stepCta}
            />
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepBody}>
            <Text variant="h1">Budget for each event?</Text>
            <Text variant="small" color={colors.gray400} style={styles.subhead}>
              Set what you&apos;d like to spend on each event. We&apos;ll suggest vendors that fit.
            </Text>

            <View style={styles.totalCard}>
              <Text variant="micro" color={colors.gray400}>
                TOTAL BUDGET
              </Text>
              <Text variant="h1" color={colors.magenta} style={styles.totalAmount}>
                {formatINR(totalBudget)}
              </Text>
            </View>

            {allEvents.map((e) => {
              const v = eventBudgets[e] ?? defaultBudgetFor(e)
              return (
                <View key={e} style={styles.budgetRow}>
                  <View style={styles.budgetHead}>
                    <Text variant="body" weight="500">
                      {e}
                    </Text>
                    <Text variant="body" weight="600" color={colors.magenta}>
                      {formatINR(v)}
                    </Text>
                  </View>
                  <Slider
                    minimumValue={EVENT_BUDGET_MIN}
                    maximumValue={EVENT_BUDGET_MAX}
                    step={EVENT_BUDGET_STEP}
                    value={v}
                    onValueChange={(val) => setEventBudgets((prev) => ({ ...prev, [e]: val }))}
                    minimumTrackTintColor={colors.magenta}
                    maximumTrackTintColor={colors.cardBorder}
                    thumbTintColor={colors.magenta}
                  />
                  <View style={styles.budgetScale}>
                    <Text variant="micro" color={colors.gray400}>
                      ₹25K
                    </Text>
                    <Text variant="micro" color={colors.gray400}>
                      ₹50L
                    </Text>
                  </View>
                </View>
              )
            })}
            <Button label="Next" variant="primary" onPress={next} style={styles.stepCta} />
          </View>
        )}

        {step === 7 && (
          <View style={styles.centerStep}>
            <Text variant="h1" align="center">
              🎉
            </Text>
            <Text variant="h1" align="center" style={styles.readyTitle}>
              {partner1 || 'Partner 1'} & {partner2 || 'Partner 2'},{'\n'}your wedding board is ready!
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCell}>
                  <Text variant="micro" color={colors.gray400}>
                    EVENTS
                  </Text>
                  <Text variant="body" weight="600">
                    {allEvents.length} events
                  </Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text variant="micro" color={colors.gray400}>
                    GUESTS
                  </Text>
                  <Text variant="body" weight="600">
                    {Object.keys(eventGuests).length > 0 ? `${Object.keys(eventGuests).length} events set` : 'TBD'}
                  </Text>
                </View>
                <View style={styles.summaryCell}>
                  <Text variant="micro" color={colors.gray400}>
                    BUDGET
                  </Text>
                  <Text variant="body" weight="600">
                    {formatINR(totalBudget)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.eventPills}>
              {allEvents.map((e) => (
                <View key={e} style={styles.pill}>
                  <Text variant="micro" color={colors.magenta} weight="500">
                    {e}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.cta}>
              <Button label="Start planning" variant="primary" onPress={handleComplete} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingTop: 12 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24, justifyContent: 'center' },
  centerStep: { alignItems: 'center' },
  stepBody: { width: '100%' },
  logo: { width: 96, height: 96, borderRadius: 24, marginBottom: 24 },
  lead: { marginTop: 12, maxWidth: 280 },
  cta: { width: '100%', marginTop: 32 },
  stepCta: { marginTop: 24 },
  fields: { marginTop: 24, gap: 16 },
  locBtn: { marginTop: 8 },
  tight: { marginTop: 6 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  eventChip: { width: '47%', alignItems: 'flex-start' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  customChip: { flex: 1, alignItems: 'flex-start' },
  customAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  grow: { flex: 1 },
  addBtn: { width: 72 },
  note: { marginTop: 16 },
  subhead: { marginTop: 4, marginBottom: 16 },
  dateRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dateHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tbdChip: { paddingVertical: 4, paddingHorizontal: 10 },
  dateFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  arrow: { marginBottom: 8 },
  guestRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  guestLabel: { marginBottom: 8 },
  guestOpts: { flexDirection: 'row', gap: 6 },
  guestChip: { flex: 1, paddingHorizontal: 4 },
  totalCard: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.emptyBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  totalAmount: { marginTop: 2 },
  budgetRow: { paddingVertical: 6 },
  budgetHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  budgetScale: { flexDirection: 'row', justifyContent: 'space-between' },
  readyTitle: { marginTop: 8 },
  summaryCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.emptyBg,
    width: '100%',
  },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryCell: { width: '45%' },
  eventPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 16 },
  pill: { backgroundColor: colors.magentaLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
})

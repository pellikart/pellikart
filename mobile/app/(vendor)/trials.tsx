// Vendor visit / tasting requests — port of the web VendorTrials (vendor-trial path).
//
// Groups the vendor's requests by status and lets them accept a proposed time,
// propose a new one, or decline with a reason — the vendor half of the visit
// flow the couple starts from the detail sheet. All three actions persist
// through the SHARED vendor store (scheduleTrial / proposeTrialNewTime /
// declineTrial).
//
// The web page also merges in couple-store trialSessions with fragile key
// parsing; that path is live-mode plumbing and is omitted here in favour of the
// vendorTrials list, which is what the store exposes cleanly.

import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useVendorStore } from '@shared/vendor-store'
import { formatDate } from '@shared/helpers'
import type { VendorTrial } from '@shared/vendor-types'
import { Button, Text } from '@/components/ui'
import { Field, Chip } from '@/components/inputs'
import { DateField } from '@/components/DateField'
import { SubHeader } from '@/components/SubHeader'
import { colors, radius } from '@/theme/tokens'

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function VendorTrials() {
  const vendorTrials = useVendorStore((s) => s.vendorTrials)
  const scheduleTrial = useVendorStore((s) => s.scheduleTrial)
  const proposeTrialNewTime = useVendorStore((s) => s.proposeTrialNewTime)
  const declineTrial = useVendorStore((s) => s.declineTrial)

  const [proposeId, setProposeId] = useState<string | null>(null)
  const [proposeDate, setProposeDate] = useState('')
  const [proposeTime, setProposeTime] = useState('')
  const [declineId, setDeclineId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const pending = vendorTrials.filter((t) => t.status === 'pending')
  const scheduled = vendorTrials.filter((t) => t.status === 'scheduled')
  const completed = vendorTrials.filter((t) => t.status === 'completed')
  const declined = vendorTrials.filter((t) => t.status === 'declined')

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SubHeader title="Visit Requests" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {vendorTrials.length === 0 && (
          <Text variant="small" color={colors.gray400} align="center" style={styles.empty}>
            No visit requests yet
          </Text>
        )}

        <Section title="NEW REQUESTS" count={pending.length} color={colors.magenta}>
          {pending.map((t) => (
            <TrialCard key={t.id} trial={t} highlight>
              <Text variant="micro" color={colors.gray400} style={styles.reqLine}>
                Requested: {formatDate(t.requestedDate)}
              </Text>
              <View style={styles.actions}>
                <Button label="Accept" variant="primary" onPress={() => scheduleTrial(t.id, t.requestedDate)} style={styles.grow} />
                <Button
                  label="New time"
                  variant="secondary"
                  onPress={() => {
                    setProposeId(t.id)
                    setProposeDate('')
                    setProposeTime('')
                  }}
                  style={styles.grow}
                />
                <Button label="Decline" variant="ghost" onPress={() => { setDeclineId(t.id); setDeclineReason('') }} style={styles.declineBtn} />
              </View>
            </TrialCard>
          ))}
        </Section>

        <Section title="SCHEDULED" count={scheduled.length} color={colors.success}>
          {scheduled.map((t) => (
            <TrialCard key={t.id} trial={t}>
              <Text variant="micro" color={colors.success} style={styles.reqLine}>
                Scheduled: {formatDate(t.scheduledDate || t.requestedDate)}
              </Text>
            </TrialCard>
          ))}
        </Section>

        <Section title="COMPLETED" count={completed.length} color={colors.gray500}>
          {completed.map((t) => (
            <TrialCard key={t.id} trial={t} dim>
              <View style={styles.donePill}>
                <Text variant="micro" weight="500" color={colors.success}>
                  Done ✓
                </Text>
              </View>
            </TrialCard>
          ))}
        </Section>

        <Section title="DECLINED" count={declined.length} color={colors.danger}>
          {declined.map((t) => (
            <TrialCard key={t.id} trial={t} dim>
              {!!t.declineReason && (
                <Text variant="micro" color={colors.danger} style={styles.reqLine}>
                  Reason: {t.declineReason}
                </Text>
              )}
            </TrialCard>
          ))}
        </Section>
      </ScrollView>

      {/* Propose new time */}
      <Modal visible={!!proposeId} transparent animationType="slide" onRequestClose={() => setProposeId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setProposeId(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text variant="title">Propose a new time</Text>
            <Text variant="caption" color={colors.gray400} style={styles.sheetSub}>
              The couple will be notified and can accept your proposed slot.
            </Text>
            <DateField label="Date" value={proposeDate} onChange={setProposeDate} minimumDate={todayISO()} />
            <Text variant="body" weight="500" style={styles.slotsLabel}>
              Time
            </Text>
            <View style={styles.slots}>
              {TIME_SLOTS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={proposeTime === t}
                  onPress={() => setProposeTime(t)}
                  accent={colors.mustard}
                  accentLight={colors.mustardLight}
                  style={styles.slotChip}
                />
              ))}
            </View>
            <Button
              label="Send proposal"
              variant="vendor"
              disabled={!proposeDate || !proposeTime}
              onPress={() => {
                if (proposeId && proposeDate && proposeTime) proposeTrialNewTime(proposeId, proposeDate, proposeTime)
                setProposeId(null)
              }}
              style={styles.sheetCta}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Decline */}
      <Modal visible={!!declineId} transparent animationType="slide" onRequestClose={() => setDeclineId(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDeclineId(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text variant="title">Decline this request?</Text>
            <Text variant="caption" color={colors.gray400} style={styles.sheetSub}>
              The couple will be notified. A reason helps them understand.
            </Text>
            <Field
              multiline
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Reason (optional) — e.g. fully booked that day"
            />
            <View style={styles.declineActions}>
              <Button label="Keep" variant="secondary" onPress={() => setDeclineId(null)} style={styles.grow} />
              <Button
                label="Decline"
                variant="primary"
                onPress={() => {
                  if (declineId) declineTrial(declineId, declineReason.trim())
                  setDeclineId(null)
                }}
                style={styles.grow}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function Section({
  title,
  count,
  color,
  children,
}: {
  title: string
  count: number
  color: string
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <View style={styles.section}>
      <Text variant="micro" weight="600" color={color} style={styles.sectionTitle}>
        {title} ({count})
      </Text>
      {children}
    </View>
  )
}

function TrialCard({
  trial,
  highlight,
  dim,
  children,
}: {
  trial: VendorTrial
  highlight?: boolean
  dim?: boolean
  children?: React.ReactNode
}) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight, dim && styles.cardDim]}>
      <Text variant="small" weight="600">
        {trial.coupleNames}
      </Text>
      <Text variant="micro" color={colors.gray500}>
        {trial.eventName} · {trial.category}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  body: { padding: 16, paddingBottom: 32 },
  empty: { paddingVertical: 48 },
  grow: { flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8 },
  card: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8 },
  cardHighlight: { borderWidth: 2, borderColor: 'rgba(233,30,120,0.2)', backgroundColor: 'rgba(233,30,120,0.05)' },
  cardDim: { opacity: 0.75 },
  reqLine: { marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  declineBtn: { width: 84 },
  donePill: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(22,163,74,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: 12 },
  sheetSub: { marginTop: 4, marginBottom: 12 },
  slotsLabel: { marginTop: 12, marginBottom: 8 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { width: '22%' },
  sheetCta: { marginTop: 16 },
  declineActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
})

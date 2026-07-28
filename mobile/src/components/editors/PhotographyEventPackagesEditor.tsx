// Photography event-package editor — port of the web
// PhotographyEventPackagesEditor. Each card is a flat price sheet for a group of
// events: pick the events it covers (RITUALS + custom), set a flat price per
// service, add custom services, and note duration / cinematic trailer / delivery.
// Produces PhotographyEventPackage[].

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
  PHOTOGRAPHY_EVENT_SERVICES,
  RITUALS,
  type PhotographyEventPackage,
  type PhotographyEventCustomService,
  type PhotographyEventServiceKey,
} from '@shared/vendor-category-config'
import { Text } from '@/components/ui'
import { Chip } from '@/components/inputs'
import { PriceField, MiniStepper, YesNoToggle, LineInput } from '@/components/editors/primitives'
import { colors, radius } from '@/theme/tokens'

let cardSeq = 0
const newCardId = () => `epk-${(cardSeq += 1)}-${Math.round(Math.abs(Math.sin(cardSeq)) * 1e6)}`
let svcSeq = 0
const newSvcId = () => `svc-${(svcSeq += 1)}-${Math.round(Math.abs(Math.sin(svcSeq)) * 1e6)}`
const emptyCard = (): PhotographyEventPackage => ({ id: newCardId(), events: [], prices: {} })

export function PhotographyEventPackagesEditor({
  value,
  onChange,
}: {
  value: PhotographyEventPackage[]
  onChange: (next: PhotographyEventPackage[]) => void
}) {
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({})

  const updateCard = (id: string, patch: Partial<PhotographyEventPackage>) =>
    onChange(value.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  function toggleEvent(card: PhotographyEventPackage, event: string) {
    const events = card.events.includes(event)
      ? card.events.filter((e) => e !== event)
      : [...card.events, event]
    updateCard(card.id, { events })
  }

  function addCustomEvent(card: PhotographyEventPackage) {
    const draft = (customDrafts[card.id] || '').trim()
    if (!draft) return
    if (!card.events.some((e) => e.toLowerCase() === draft.toLowerCase())) {
      updateCard(card.id, { events: [...card.events, draft] })
    }
    setCustomDrafts((prev) => ({ ...prev, [card.id]: '' }))
  }

  function setPrice(card: PhotographyEventPackage, key: PhotographyEventServiceKey, price: number) {
    const prices = { ...card.prices }
    if (price > 0) prices[key] = price
    else delete prices[key]
    updateCard(card.id, { prices })
  }

  const addCustomService = (card: PhotographyEventPackage) => {
    const next: PhotographyEventCustomService = { id: newSvcId(), label: '', price: 0 }
    updateCard(card.id, { customServices: [...(card.customServices || []), next] })
  }
  const updateCustomService = (card: PhotographyEventPackage, id: string, patch: Partial<PhotographyEventCustomService>) =>
    updateCard(card.id, { customServices: (card.customServices || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const removeCustomService = (card: PhotographyEventPackage, id: string) =>
    updateCard(card.id, { customServices: (card.customServices || []).filter((s) => s.id !== id) })
  const removeCard = (id: string) => onChange(value.filter((c) => c.id !== id))

  return (
    <View style={styles.wrap}>
      {value.map((card, idx) => {
        const customEvents = card.events.filter((e) => !RITUALS.includes(e))
        return (
          <View key={card.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text variant="small" weight="600">
                Pricing card {idx + 1}
              </Text>
              <Pressable onPress={() => removeCard(card.id)} hitSlop={6}>
                <Text variant="small" color={colors.gray400}>
                  Remove
                </Text>
              </Pressable>
            </View>

            <Text variant="caption" weight="500">
              Which events does this cover?
            </Text>
            <Text variant="micro" color={colors.gray400} style={styles.hint}>
              Select all that share this pricing. Add your own if it&apos;s not listed.
            </Text>
            <View style={styles.chipWrap}>
              {RITUALS.map((event) => (
                <Chip
                  key={event}
                  label={event}
                  selected={card.events.includes(event)}
                  onPress={() => toggleEvent(card, event)}
                  accent={colors.mustard}
                  accentLight={colors.mustardLight}
                />
              ))}
              {customEvents.map((event) => (
                <Chip
                  key={event}
                  label={event}
                  selected
                  onPress={() => toggleEvent(card, event)}
                  accent={colors.mustard}
                  accentLight={colors.mustardLight}
                />
              ))}
            </View>

            <View style={styles.addRow}>
              <View style={styles.grow}>
                <LineInput
                  value={customDrafts[card.id] || ''}
                  onChangeText={(t) => setCustomDrafts((prev) => ({ ...prev, [card.id]: t }))}
                  placeholder="Add a custom event…"
                  onSubmitEditing={() => addCustomEvent(card)}
                />
              </View>
              <Pressable onPress={() => addCustomEvent(card)} style={styles.addBtn}>
                <Text variant="small" weight="500">
                  Add
                </Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text variant="caption" weight="500">
                Price per service
              </Text>
              <Text variant="micro" color={colors.gray400} style={styles.hint}>
                Flat price for the whole event. Leave blank if you don&apos;t offer it.
              </Text>
              <View style={styles.priceList}>
                {PHOTOGRAPHY_EVENT_SERVICES.map((service, i) => (
                  <View key={service.key} style={[styles.priceRow, i > 0 && styles.rowDivider]}>
                    <Text variant="small" style={styles.grow}>
                      {service.label}
                    </Text>
                    <PriceField value={card.prices[service.key] || 0} onChange={(n) => setPrice(card, service.key, n)} />
                  </View>
                ))}
                {(card.customServices || []).map((service) => (
                  <View key={service.id} style={[styles.priceRow, styles.rowDivider]}>
                    <Pressable onPress={() => removeCustomService(card, service.id)} hitSlop={6}>
                      <Text variant="body" color={colors.gray300}>
                        ×
                      </Text>
                    </Pressable>
                    <View style={styles.grow}>
                      <LineInput
                        value={service.label}
                        onChangeText={(t) => updateCustomService(card, service.id, { label: t })}
                        placeholder="Custom service name…"
                      />
                    </View>
                    <PriceField value={service.price || 0} onChange={(n) => updateCustomService(card, service.id, { price: n })} width={100} />
                  </View>
                ))}
              </View>
              <Pressable onPress={() => addCustomService(card)} style={styles.dashedBtn}>
                <Text variant="caption" weight="600" color={colors.gray500}>
                  + Add custom service
                </Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text variant="caption" weight="500" style={styles.hint}>
                Package details
              </Text>
              <View style={styles.detailRow}>
                <Text variant="small">
                  Event duration <Text variant="small" color={colors.gray400}>(hours)</Text>
                </Text>
                <MiniStepper value={card.durationHours ?? 0} onChange={(n) => updateCard(card.id, { durationHours: n || undefined })} unit="hr" />
              </View>
              <View style={styles.detailRow}>
                <Text variant="small">Cinematic trailer included</Text>
                <YesNoToggle value={!!card.cinematicTrailer} onChange={(v) => updateCard(card.id, { cinematicTrailer: v })} />
              </View>
              <View style={styles.detailRow}>
                <Text variant="small">
                  Approx delivery <Text variant="small" color={colors.gray400}>(days)</Text>
                </Text>
                <MiniStepper value={card.deliveryDays ?? 0} onChange={(n) => updateCard(card.id, { deliveryDays: n || undefined })} unit="days" />
              </View>
            </View>
          </View>
        )
      })}

      <Pressable onPress={() => onChange([...value, emptyCard()])} style={styles.createBtn}>
        <Text variant="small" weight="600" color={colors.mustard}>
          + Create pricing card
        </Text>
      </Pressable>

      {value.length > 0 && (
        <Text variant="micro" color={colors.gray400}>
          Only cards with at least one event and one price are shown to couples.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  card: { padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.white },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  hint: { marginTop: 2, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  grow: { flex: 1 },
  addBtn: { paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.emptyBg, borderWidth: 1, borderColor: colors.cardBorder },
  section: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  priceList: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, overflow: 'hidden' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  dashedBtn: { marginTop: 8, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cardBorder, alignItems: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  createBtn: { paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(212,160,23,0.6)', alignItems: 'center' },
})

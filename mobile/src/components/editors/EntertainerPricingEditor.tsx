// Hosts/Entertainers pricing editor — port of the web EntertainerPricingEditor.
// A flat price per event (default set + custom-added events), shared duration,
// an additional-hour charge, and languages. Produces EntertainerPricing.

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
  ENTERTAINER_DEFAULT_EVENTS,
  ENTERTAINER_LANGUAGES,
  type EntertainerPricing,
  type EntertainerEventRate,
} from '@shared/vendor-category-config'
import { Text } from '@/components/ui'
import { Chip } from '@/components/inputs'
import { PriceField, MiniStepper, LineInput } from '@/components/editors/primitives'
import { colors, radius } from '@/theme/tokens'

const DEFAULT_SET = new Set<string>(ENTERTAINER_DEFAULT_EVENTS)

// Ids can't use Date.now() at module scope safely; a simple counter is fine and
// deterministic within a session.
let rateSeq = 0
function newRateId() {
  rateSeq += 1
  return `ent-${rateSeq}-${Math.round(Math.abs(Math.sin(rateSeq)) * 1e6)}`
}

export function EntertainerPricingEditor({
  value,
  onChange,
}: {
  value: EntertainerPricing
  onChange: (next: EntertainerPricing) => void
}) {
  const [customDraft, setCustomDraft] = useState('')
  const rates = value.eventRates || []

  const patch = (p: Partial<EntertainerPricing>) => onChange({ ...value, ...p })
  const setRate = (id: string, price: number) =>
    patch({ eventRates: rates.map((r) => (r.id === id ? { ...r, price } : r)) })
  const removeRate = (id: string) => patch({ eventRates: rates.filter((r) => r.id !== id) })

  function addCustomEvent() {
    const event = customDraft.trim()
    if (!event) return
    if (!rates.some((r) => r.event.toLowerCase() === event.toLowerCase())) {
      const next: EntertainerEventRate = { id: newRateId(), event, price: 0 }
      patch({ eventRates: [...rates, next] })
    }
    setCustomDraft('')
  }

  function toggleLanguage(lang: string) {
    const langs = value.languages || []
    patch({ languages: langs.includes(lang) ? langs.filter((l) => l !== lang) : [...langs, lang] })
  }

  return (
    <View style={styles.wrap}>
      <View>
        <Text variant="small" weight="600">
          Price per event
        </Text>
        <Text variant="micro" color={colors.gray400} style={styles.hint}>
          Set your flat price for each event. Leave blank if you don&apos;t perform at it.
        </Text>
        <View style={styles.card}>
          {rates.map((rate, i) => {
            const isCustom = !DEFAULT_SET.has(rate.event)
            return (
              <View key={rate.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                <Text variant="small" style={styles.rowLabel} numberOfLines={1}>
                  {rate.event}
                </Text>
                <PriceField value={rate.price} onChange={(n) => setRate(rate.id, n)} />
                {isCustom ? (
                  <Pressable onPress={() => removeRate(rate.id)} hitSlop={8} style={styles.removeBtn}>
                    <Text variant="small" color={colors.gray400}>
                      ✕
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.removeSpacer} />
                )}
              </View>
            )
          })}
        </View>

        <View style={styles.addRow}>
          <View style={styles.grow}>
            <LineInput
              value={customDraft}
              onChangeText={setCustomDraft}
              placeholder="Add another event…"
              onSubmitEditing={addCustomEvent}
            />
          </View>
          <Pressable onPress={addCustomEvent} style={styles.addBtn}>
            <Text variant="small" weight="500">
              Add
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.inlineRow}>
        <Text variant="small" weight="500">
          Event duration <Text variant="small" color={colors.gray400}>(hours)</Text>
        </Text>
        <MiniStepper
          value={value.durationHours ?? 0}
          onChange={(n) => patch({ durationHours: n || undefined })}
          unit="hr"
        />
      </View>

      <View style={styles.inlineRow}>
        <Text variant="small" weight="500">
          Additional-hour charge
        </Text>
        <PriceField
          value={value.additionalHourCharge ?? 0}
          onChange={(n) => patch({ additionalHourCharge: n || undefined })}
        />
      </View>

      <View>
        <Text variant="small" weight="500" style={styles.hint}>
          Languages
        </Text>
        <View style={styles.chipWrap}>
          {ENTERTAINER_LANGUAGES.map((lang) => (
            <Chip
              key={lang}
              label={lang}
              selected={(value.languages || []).includes(lang)}
              onPress={() => toggleLanguage(lang)}
              accent={colors.mustard}
              accentLight={colors.mustardLight}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  hint: { marginTop: 2, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  rowLabel: { flex: 1 },
  removeBtn: { width: 14, alignItems: 'center' },
  removeSpacer: { width: 14 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  grow: { flex: 1 },
  addBtn: { paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.emptyBg, borderWidth: 1, borderColor: colors.cardBorder },
  inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})

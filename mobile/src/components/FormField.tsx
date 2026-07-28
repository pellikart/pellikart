// Generic renderer for a config-driven SelectField — the heart of the plan's
// "configuration-driven forms so categories and questions can change without an
// app update." Every listing step and the category onboarding fields feed
// through this, so a new question added to vendor-category-config.ts appears on
// mobile with no code change here.
//
// Value shapes match exactly what the web stores in categoryFields
// (Record<string, string | string[]>):
//   single  → string (the option)
//   multi   → string[]
//   slider  → string (numeric, stringified)
//   number  → string (numeric, stringified)
//   range   → [lo, hi] as string[]
//   toggle  → string (one of toggleLabels) — unused by listing configs today,
//             handled defensively
//
// Vendor accent (mustard) throughout, matching the web listing forms.

import Slider from '@react-native-community/slider'
import { Pressable, StyleSheet, View } from 'react-native'
import type { SelectField } from '@shared/vendor-category-config'
import { Text } from '@/components/ui'
import { Chip } from '@/components/inputs'
import { colors, radius } from '@/theme/tokens'

export type FieldValue = string | string[] | undefined
export type FieldValues = Record<string, string | string[]>

/** Port of VendorAddListing's isFieldVisible — evaluates a field's visibleWhen. */
export function isFieldVisible(field: SelectField, values: FieldValues): boolean {
  if (!field.visibleWhen) return true
  const dep = values[field.visibleWhen.key]
  const { notEquals, equals } = field.visibleWhen
  if (equals !== undefined) {
    const list = Array.isArray(equals) ? equals : [equals]
    return typeof dep === 'string' && list.includes(dep)
  }
  if (notEquals !== undefined) {
    const list = Array.isArray(notEquals) ? notEquals : [notEquals]
    return typeof dep === 'string' ? !list.includes(dep) : true
  }
  return true
}

export function FormField({
  field,
  value,
  onChange,
}: {
  field: SelectField
  value: FieldValue
  onChange: (value: string | string[]) => void
}) {
  if (field.type === 'single' || field.type === 'toggle') {
    const options = field.type === 'toggle' ? field.toggleLabels ?? ['Yes', 'No'] : field.options ?? []
    const selected = typeof value === 'string' ? value : ''
    return (
      <Field label={field.label}>
        <View style={styles.chipWrap}>
          {options.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={selected === opt}
              onPress={() => onChange(opt)}
              accent={colors.mustard}
              accentLight={colors.mustardLight}
            />
          ))}
        </View>
      </Field>
    )
  }

  if (field.type === 'multi') {
    const selected = Array.isArray(value) ? value : []
    return (
      <Field label={field.label}>
        <View style={styles.chipWrap}>
          {(field.options ?? []).map((opt) => {
            const on = selected.includes(opt)
            return (
              <Chip
                key={opt}
                label={opt}
                selected={on}
                onPress={() => onChange(on ? selected.filter((v) => v !== opt) : [...selected, opt])}
                accent={colors.mustard}
                accentLight={colors.mustardLight}
              />
            )
          })}
        </View>
        {selected.length > 0 && (
          <Text variant="micro" color={colors.gray400} style={styles.count}>
            {selected.length} selected
          </Text>
        )}
      </Field>
    )
  }

  if (field.type === 'slider') {
    const min = field.sliderMin ?? 0
    const max = field.sliderMax ?? 100
    const step = field.sliderStep ?? 1
    const numVal = typeof value === 'string' ? parseInt(value, 10) || min : min
    return (
      <Field label={field.label}>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.grow}
            minimumValue={min}
            maximumValue={max}
            step={step}
            value={numVal}
            onValueChange={(v) => onChange(String(v))}
            minimumTrackTintColor={colors.mustard}
            maximumTrackTintColor={colors.cardBorder}
            thumbTintColor={colors.mustard}
          />
          <Text variant="body" weight="700" style={styles.sliderValue}>
            {numVal} {field.sliderUnit ?? ''}
          </Text>
        </View>
      </Field>
    )
  }

  if (field.type === 'number') {
    const min = field.numberMin ?? 0
    const max = field.numberMax ?? 999
    const step = field.numberStep ?? 1
    const numVal = typeof value === 'string' ? parseInt(value, 10) || min : min
    return (
      <Field label={field.label}>
        <Stepper
          value={numVal}
          min={min}
          max={max}
          step={step}
          unit={field.numberUnit}
          onChange={(n) => onChange(String(n))}
        />
      </Field>
    )
  }

  if (field.type === 'range') {
    const min = field.numberMin ?? 0
    const max = field.numberMax ?? 9999
    const step = field.numberStep ?? 1
    const [loRaw, hiRaw] = Array.isArray(value)
      ? value
      : typeof value === 'string' && value
        ? [String(min), value]
        : [String(min), String(max)]
    const lo = parseInt(loRaw, 10) || min
    const hi = parseInt(hiRaw, 10) || max
    const setLo = (n: number) => {
      let v = Math.max(min, Math.min(max, n))
      if (v > hi) v = hi
      onChange([String(v), String(hi)])
    }
    const setHi = (n: number) => {
      let v = Math.max(min, Math.min(max, n))
      if (v < lo) v = lo
      onChange([String(lo), String(v)])
    }
    return (
      <Field label={field.label}>
        <View style={styles.rangeRow}>
          <View style={styles.grow}>
            <Text variant="micro" color={colors.gray400} style={styles.rangeLabel}>
              Min {field.numberUnit ?? ''}
            </Text>
            <Stepper value={lo} min={min} max={max} step={step} onChange={setLo} />
          </View>
          <View style={styles.grow}>
            <Text variant="micro" color={colors.gray400} style={styles.rangeLabel}>
              Max {field.numberUnit ?? ''}
            </Text>
            <Stepper value={hi} min={min} max={max} step={step} onChange={setHi} />
          </View>
        </View>
      </Field>
    )
  }

  return null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="small" weight="500" style={styles.fieldLabel}>
        {label}
      </Text>
      {children}
    </View>
  )
}

/** A −/value/+ stepper matching the web's number/range inputs. */
export function Stepper({
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (n: number) => void
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
      >
        <Text variant="h2" color={colors.dark}>
          −
        </Text>
      </Pressable>
      <View style={styles.stepValue}>
        <Text variant="body" weight="600">
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
      >
        <Text variant="h2" color={colors.dark}>
          +
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 4 },
  fieldLabel: { marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: { marginTop: 4 },
  grow: { flex: 1 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderValue: { width: 90, textAlign: 'right' },
  rangeRow: { flexDirection: 'row', gap: 12 },
  rangeLabel: { marginBottom: 4 },
  stepper: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md, alignSelf: 'flex-start', overflow: 'hidden' },
  stepBtn: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  stepBtnDisabled: { opacity: 0.3 },
  stepValue: { minWidth: 60, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
})

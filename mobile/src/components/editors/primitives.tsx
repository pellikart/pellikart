// Small building blocks shared by the category pricing editors. On the web
// these are copy-pasted across EntertainerPricingEditor,
// PhotographyEventPackagesEditor and others; extracting them once keeps the RN
// ports short and consistent. Vendor accent (mustard) throughout.

import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Text } from '@/components/ui'
import { colors, radius } from '@/theme/tokens'

/** A ₹-prefixed numeric input. Emits 0 for empty. */
export function PriceField({
  value,
  onChange,
  width = 130,
  placeholder = '0',
}: {
  value: number
  onChange: (n: number) => void
  width?: number
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[styles.priceWrap, { width }, focused && styles.focused]}>
      <Text variant="small" color={colors.gray400} style={styles.rupee}>
        ₹
      </Text>
      <TextInput
        value={value ? String(value) : ''}
        onChangeText={(t) => onChange(Math.max(0, parseInt(t.replace(/[^0-9]/g, ''), 10) || 0))}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.priceInput}
      />
    </View>
  )
}

/** A −/value/+ stepper where 0 renders as "—" (not specified). */
export function MiniStepper({
  value,
  onChange,
  unit,
  step = 1,
}: {
  value: number
  onChange: (n: number) => void
  unit: string
  step?: number
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - step))}
        disabled={value <= 0}
        style={[styles.stepBtn, value <= 0 && styles.disabled]}
      >
        <Text variant="bodyLg">−</Text>
      </Pressable>
      <View style={styles.stepValue}>
        <Text variant="small" weight="600">
          {value > 0 ? `${value} ${unit}` : '—'}
        </Text>
      </View>
      <Pressable onPress={() => onChange(value + step)} style={styles.stepBtn}>
        <Text variant="bodyLg">+</Text>
      </Pressable>
    </View>
  )
}

/** A Yes/No segmented toggle. */
export function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      {([['Yes', true], ['No', false]] as const).map(([label, v]) => {
        const on = value === v
        return (
          <Pressable key={label} onPress={() => onChange(v)} style={[styles.toggleBtn, on && styles.toggleOn]}>
            <Text variant="small" weight={on ? '600' : '400'} color={on ? colors.dark : colors.gray500}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** A bordered text input row used for custom-service names etc. */
export function LineInput({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  style,
}: {
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  onSubmitEditing?: () => void
  style?: object
}) {
  const [focused, setFocused] = useState(false)
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray400}
      onSubmitEditing={onSubmitEditing}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.lineInput, focused && styles.focused, style]}
    />
  )
}

const styles = StyleSheet.create({
  priceWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, paddingHorizontal: 8, backgroundColor: colors.white },
  rupee: { marginRight: 2 },
  priceInput: { flex: 1, paddingVertical: 8, fontSize: 12, color: colors.dark },
  focused: { borderColor: colors.mustard },
  stepper: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.white },
  stepBtn: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.3 },
  stepValue: { minWidth: 62, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', backgroundColor: colors.emptyBg, borderRadius: radius.sm, padding: 3 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm - 2 },
  toggleOn: { backgroundColor: colors.white },
  lineInput: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: colors.dark, backgroundColor: colors.white },
})

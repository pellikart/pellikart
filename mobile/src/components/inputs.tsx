// Form input primitives, kept separate from the display primitives in ui.tsx.
//
// These reproduce the exact input treatments the web onboarding and board
// screens use: a labelled text field with a magenta focus border, a selectable
// chip, and a thin progress bar. The visuals are copied so a ported screen
// matches pellikart.com rather than approximating it.

import { useState, type ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { Text } from '@/components/ui'
import { colors, radius } from '@/theme/tokens'

// ─── Field ──────────────────────────────────
// `<label> + <input class="border focus:border-magenta">` from the web.

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  optional,
  keyboardType,
  autoCapitalize,
  onSubmitEditing,
  helper,
  multiline,
  accent = colors.magenta,
}: {
  label?: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  optional?: boolean
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words'
  onSubmitEditing?: () => void
  helper?: string
  multiline?: boolean
  /** Focus-border colour. Magenta (couple) by default; pass mustard on the vendor side. */
  accent?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.fieldWrap}>
      {!!label && (
        <Text variant="body" weight="500" style={styles.fieldLabel}>
          {label}
          {optional && (
            <Text variant="body" color={colors.gray400} weight="400">
              {'  '}(optional)
            </Text>
          )}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && { borderColor: accent },
        ]}
      />
      {!!helper && (
        <Text variant="small" color={colors.gray400} style={styles.helper}>
          {helper}
        </Text>
      )}
    </View>
  )
}

// ─── Chip ───────────────────────────────────
// The selectable pill used for events, guest counts, filters. Two accents:
// magenta (couple) is the default; mustard is available for the vendor side.

export function Chip({
  label,
  selected,
  onPress,
  accent = colors.magenta,
  accentLight = colors.magentaLight,
  style,
}: {
  label: string
  selected: boolean
  onPress: () => void
  accent?: string
  accentLight?: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { borderColor: accent, backgroundColor: accentLight, borderWidth: 2 }
          : { borderColor: colors.cardBorder, borderWidth: 1 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text
        variant="small"
        weight={selected ? '600' : '500'}
        color={selected ? accent : colors.dark}
      >
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  )
}

// ─── ProgressBar ────────────────────────────

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, value)) * 100}%` }]} />
    </View>
  )
}

// ─── Row ────────────────────────────────────
// A labelled horizontal group, e.g. a field pair. Thin convenience wrapper.

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>
}

const styles = StyleSheet.create({
  fieldWrap: { width: '100%' },
  fieldLabel: { marginBottom: 6 } as TextStyle,
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 14,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  inputFocused: { borderColor: colors.magenta },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  helper: { marginTop: 6 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: { height: 4, backgroundColor: '#f3f4f6', width: '100%' },
  progressFill: { height: 4, backgroundColor: colors.magenta },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})

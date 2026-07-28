// A tappable date field backed by the native date picker. Replaces the web's
// <input type="date">. Stores and emits ISO yyyy-mm-dd strings, which is what
// the shared store and Supabase expect.

import { useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { Text } from '@/components/ui'
import { colors, radius } from '@/theme/tokens'

/** yyyy-mm-dd → Date (local), or undefined. */
function parseISO(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

/** Date → yyyy-mm-dd (local, no timezone shift). */
function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function labelFor(value: string | undefined): string {
  const d = parseISO(value)
  if (!d) return 'Select date'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
}: {
  label?: string
  value: string | undefined
  onChange: (iso: string) => void
  minimumDate?: string
}) {
  const [open, setOpen] = useState(false)

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    // Android fires 'dismissed' on cancel; only Android needs manual close.
    if (Platform.OS !== 'ios') setOpen(false)
    if (event.type === 'dismissed' || !selected) return
    onChange(toISO(selected))
  }

  return (
    <View style={styles.wrap}>
      {!!label && (
        <Text variant="micro" color={colors.gray400} style={styles.label}>
          {label}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && { opacity: 0.85 }]}
      >
        <Text variant="small" color={value ? colors.dark : colors.gray400}>
          {labelFor(value)}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          value={parseISO(value) ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={parseISO(minimumDate)}
          onChange={handleChange}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  label: { marginBottom: 2 },
  field: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})

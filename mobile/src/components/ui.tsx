// Core UI primitives shared by every screen.
//
// Each one mirrors a Tailwind class combination the web app repeats often, so
// porting a screen is mostly a matter of swapping <button className="w-full
// py-3.5 rounded-xl bg-magenta …"> for <Button variant="primary" />.

import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { colors, radius } from '@/theme/tokens'
import { text } from '@/theme/type'

// ─── Screen ─────────────────────────────────
// Replaces the web's `min-h-dvh` page wrapper plus `.app-container` column.

export function Screen({
  children,
  scroll = false,
  center = false,
  padded = true,
  background = colors.screenBg,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: ReactNode
  /** Wrap content in a ScrollView. Off by default so fixed layouts stay fixed. */
  scroll?: boolean
  /** Vertically + horizontally centre the content (auth, splash, empty states). */
  center?: boolean
  padded?: boolean
  background?: string
  edges?: Edge[]
  contentStyle?: StyleProp<ViewStyle>
}) {
  const inner: StyleProp<ViewStyle> = [
    padded && styles.screenPadding,
    center && styles.center,
    contentStyle,
  ]

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, center && styles.growCenter]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner]}>{children}</View>
      )}
    </SafeAreaView>
  )
}

// ─── Text ───────────────────────────────────

type TextVariant = keyof typeof text

export function Text({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  numberOfLines,
}: {
  variant?: TextVariant
  color?: string
  weight?: TextStyle['fontWeight']
  align?: TextStyle['textAlign']
  style?: StyleProp<TextStyle>
  children: ReactNode
  numberOfLines?: number
}) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        text[variant],
        color ? { color } : null,
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  )
}

// ─── Button ─────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'vendor' | 'ghost'

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonVariants[variant].container,
        // The web uses `active:scale-[0.99]`; a subtle opacity dip reads the
        // same on touch without pulling in an animation dependency.
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={buttonVariants[variant].label.color} />
      ) : (
        <>
          {icon}
          <RNText style={[styles.buttonLabel, buttonVariants[variant].label]}>{label}</RNText>
        </>
      )}
    </Pressable>
  )
}

const buttonVariants: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.magenta },
    label: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.cardBorder },
    label: { color: colors.dark },
  },
  // The vendor side of the web app is mustard-accented rather than magenta.
  vendor: {
    container: { backgroundColor: colors.mustard },
    label: { color: colors.white },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.gray500, fontWeight: '400' },
  },
}

// ─── Card ───────────────────────────────────
// `rounded-2xl border-2 border-card-border bg-white` — the selectable card the
// role picker and most list rows use.

export function Card({
  children,
  onPress,
  accent,
  style,
}: {
  children: ReactNode
  onPress?: () => void
  /** Border colour applied while pressed (magenta for couple, mustard for vendor). */
  accent?: string
  style?: StyleProp<ViewStyle>
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && accent ? { borderColor: accent } : null,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}

// ─── Loading splash ─────────────────────────
// Mirrors the `splash` element in the web App.tsx: logo + "Loading…".

export function Splash({ message = 'Loading…' }: { message?: string }) {
  return (
    <Screen center background={colors.white} edges={['top', 'bottom']}>
      <ActivityIndicator color={colors.magenta} />
      <Text variant="body" color={colors.gray400} style={{ marginTop: 12 }}>
        {message}
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  screenPadding: { paddingHorizontal: 24 },
  center: { alignItems: 'center', justifyContent: 'center' },
  growCenter: { flexGrow: 1 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    width: '100%',
  },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  card: {
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    width: '100%',
  },
})

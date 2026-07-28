// Type scale ported from the web app.
//
// The site sets `body { font-size: 13px }` and then reaches for explicit
// bracket sizes — text-[11px], text-[15px], text-[22px] — rather than Tailwind's
// named scale. Those exact sizes are reproduced here so a ported screen can be
// diffed against its web counterpart line by line.

import { Platform, type TextStyle } from 'react-native'
import { colors } from './tokens'

/** The web loads Inter for body and Playfair Display for headings. Until those
 *  are bundled as assets, fall back to each platform's system face — which is
 *  what the web app itself falls back to (`font-family: 'Inter', system-ui, …`). */
export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
}

export const text = {
  /** text-[9px] — bottom-nav labels */
  micro: { fontSize: 9, color: colors.gray400 } satisfies TextStyle,
  /** text-[11px] — captions, helper copy */
  caption: { fontSize: 11, color: colors.gray400 } satisfies TextStyle,
  /** text-[12px] */
  small: { fontSize: 12, color: colors.gray500 } satisfies TextStyle,
  /** text-[13px] — the app's default body size */
  body: { fontSize: 13, color: colors.dark } satisfies TextStyle,
  /** text-[14px] */
  bodyLg: { fontSize: 14, color: colors.dark } satisfies TextStyle,
  /** text-[15px] font-semibold — card titles, primary buttons */
  title: { fontSize: 15, fontWeight: '600', color: colors.dark } satisfies TextStyle,
  /** text-[20px] font-bold */
  h2: { fontSize: 20, fontWeight: '700', color: colors.dark } satisfies TextStyle,
  /** text-[22px] font-bold — screen headings */
  h1: { fontSize: 22, fontWeight: '700', color: colors.dark } satisfies TextStyle,
} as const

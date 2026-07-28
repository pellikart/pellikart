// Design tokens ported 1:1 from the web app's `src/index.css` @theme block.
//
// The plan calls for the apps to look identical to pellikart.com, so these
// values are copied, not reinterpreted. If a token changes on the web it must
// change here too — that duplication is deliberate: Tailwind's CSS custom
// properties cannot be imported into React Native, and a build step to generate
// them would be more machinery than five colours justify.

export const colors = {
  magenta: '#E91E78',
  magentaLight: '#FDE7F1',
  mustard: '#D4A017',
  mustardLight: '#FFF8E7',
  dark: '#1A1A2E',
  cardBorder: '#eeeeee',
  emptyBg: '#f5f5f5',
  cream: '#FAF8F5',
  white: '#ffffff',
  /** body background — `body { background: #fafafa }` on the web */
  screenBg: '#fafafa',
  danger: '#ef4444',
  success: '#16a34a',

  // Tailwind greys the web app leans on (text-gray-400/500/600 etc.), inlined
  // so RN screens can reach for the same neutrals by name.
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
} as const

/** The web app renders the couple/vendor apps in a 480px-wide centred column
 *  (`#root > .app-container { max-width: 480px }`). On a phone that column IS
 *  the screen; the constant is kept so tablet layouts can reproduce it. */
export const APP_MAX_WIDTH = 480

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

/** Matches the web's `shadow-sm`-ish card elevation without going heavier than
 *  the flat, border-led look the site uses. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const

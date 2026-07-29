// Crash + error reporting (plan Phase 5).
//
// Initialised only when EXPO_PUBLIC_SENTRY_DSN is set, so demo / web preview /
// unconfigured builds send nothing. Call initSentry() once before the app
// renders, and wrap the root component with Sentry.wrap (see app/_layout.tsx)
// so unhandled JS errors, native crashes, and navigation breadcrumbs are
// captured.

import * as Sentry from '@sentry/react-native'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN

export function initSentry() {
  if (!dsn) return
  Sentry.init({
    dsn,
    // Performance tracing — a light sample in production; tune as traffic grows.
    tracesSampleRate: 0.2,
    // Attach a breadcrumb trail; PII is off by default.
    enableAutoSessionTracking: true,
    // In development, log to the console instead of shipping noise to Sentry.
    enabled: !__DEV__,
  })
}

export { Sentry }

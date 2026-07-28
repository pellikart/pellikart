// React Native replacement for the web app's `src/lib/supabase.ts`.
//
// metro.config.js rewrites every import of the shared client to this file, so
// the ~90 data functions in `@shared/lib/supabase-db` run unchanged on device.
// Two things have to differ from the web client:
//
//   1. Config comes from EXPO_PUBLIC_* env vars, not Vite's `import.meta.env`
//      (Hermes cannot parse `import.meta` at all).
//   2. Sessions persist in AsyncStorage instead of localStorage, and token
//      refresh is tied to app foreground/background rather than a live tab.
//
// The exported shape — `supabase: SupabaseClient | null` — is identical to the
// web module's, including the null-when-unconfigured contract that shared code
// guards on with `if (!supabase) return`.

import 'react-native-url-polyfill/auto'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // There is no URL bar on a phone — OAuth callbacks arrive as deep
          // links and are exchanged for a session explicitly (see auth.ts).
          detectSessionInUrl: false,
          // PKCE is the flow that is safe without a confidential client, and it
          // returns a `?code=` we can exchange after the deep link fires. The
          // web app uses the implicit flow, which relies on a URL fragment the
          // browser keeps in the address bar — there is no equivalent here.
          flowType: 'pkce',
        },
      })
    : null

if (!supabase) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — ' +
      'the app will run but every backend call will no-op. Copy .env.example to .env.'
  )
}

// On the web, Supabase refreshes tokens on a timer that only ticks while the tab
// is alive. A backgrounded phone app suspends those timers, so we drive the
// refresh loop off the foreground state instead — otherwise a user returning
// after a few hours lands on an expired session.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}

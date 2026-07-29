// Paywall entitlement sync (plan §3).
//
// Unlock tiers are purchased on pellikart.com, never in the app (iOS/Google
// classify that as a digital unlock). The apps only *reflect* what the user
// already owns. initLiveMode loads the subscription tier once at sign-in; this
// re-reads it whenever the app returns to the foreground, so a purchase made on
// the web shows up here within a tab-switch — the "purchases sync to the app
// instantly via the shared backend" the plan describes.
//
// No-op without a signed-in user (demo mode).

import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '@shared/auth-context'
import { fetchSubscriptionTier } from '@shared/supabase-db'
import { useStore } from '@shared/store'

export function useEntitlementSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    async function refresh() {
      const tier = await fetchSubscriptionTier(user!.id)
      // Only write when it actually changed, to avoid needless re-renders.
      if (useStore.getState().subscription !== tier) {
        useStore.setState({ subscription: tier })
      }
    }

    // Refresh now and on every foreground.
    void refresh()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh()
    })
    return () => sub.remove()
  }, [user])
}

// Expo push registration.
//
// Registers the device for the Expo push service and stores the token in the
// shared `push_tokens` table, keyed by user. The push backend (a Supabase edge
// function on `notifications` insert — see supabase/functions/send-push) reads
// that table to fan a notification out to the user's devices.
//
// Real caveats, handled here rather than crashing:
//   • Push only works on a physical device, never a simulator.
//   • Remote push does NOT work in Expo Go on SDK 53+ — it needs a development
//     build. getExpoPushTokenAsync throws there; we catch and no-op.
//   • On web there is no native push token.
// So this is a no-op in the web preview and in Expo Go; it comes alive in a dev
// or production build.

import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase.native'

// Show incoming notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

let lastRegisteredFor: string | null = null

/** Register this device's push token for a user. Safe to call repeatedly. */
export async function registerForPush(userId: string): Promise<void> {
  if (!supabase) return
  if (Platform.OS === 'web') return
  if (!Device.isDevice) return // simulators can't receive push
  if (lastRegisteredFor === userId) return

  try {
    const existing = await Notifications.getPermissionsAsync()
    let status = existing.status
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== 'granted') return

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
    const token = tokenResponse.data

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: 'token' }
      )
    lastRegisteredFor = userId
  } catch (e) {
    // Expo Go on SDK 53+, missing projectId, offline, etc. — never fatal.
    console.warn('[push] registration skipped:', e instanceof Error ? e.message : e)
  }
}

/** Clear the cached registration marker (call on sign-out). */
export function resetPushRegistration() {
  lastRegisteredFor = null
}

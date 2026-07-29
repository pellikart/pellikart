// Connectivity state (plan Phase 5 — offline / poor-network handling).
//
// Wraps NetInfo so screens and the app-wide banner can react to going offline.
// `isOnline` is true until proven otherwise, so a momentary "unknown" at startup
// never flashes an offline banner.

import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useNetwork(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` can be null (unknown) — only treat an explicit
      // false, or a lost connection, as offline.
      const offline = state.isConnected === false || state.isInternetReachable === false
      setIsOnline(!offline)
    })
    return () => unsubscribe()
  }, [])

  return { isOnline }
}

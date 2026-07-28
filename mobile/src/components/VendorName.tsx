// Renders a vendor's display identity under the tiered paywall.
//
// This is the one place the plan's payments rule (§3) is enforced on the client:
// when the couple has not unlocked (subscription === 'free'), the real name is
// never shown — the anonymous public code (e.g. "PK-PHO-0042-1") stands in.
// `unlocked` is derived from the entitlement synced off the shared backend.
//
// Crucially, nothing here — or anywhere reachable from a locked vendor — links
// to or mentions buying an unlock. Apple and Google classify that purchase as a
// digital unlock; the mobile apps only *reflect* what was bought on the web.
// A locked vendor simply appears locked.

import type { Vendor } from '@shared/types'
import { makePublicCode } from '@shared/helpers'
import { Text } from '@/components/ui'
import type { TextStyle } from 'react-native'
import type { StyleProp } from 'react-native'

/** The paywalled display string: real name when unlocked, public code when not. */
export function vendorDisplayName(vendor: Pick<Vendor, 'name' | 'code' | 'publicCode' | 'category' | 'id'>, unlocked: boolean): string {
  if (unlocked) return vendor.name || vendor.code
  return vendor.publicCode || vendor.code || makePublicCode(vendor.category || '', vendor.id)
}

export function VendorName({
  vendor,
  unlocked,
  variant = 'title',
  color,
  numberOfLines,
  style,
}: {
  vendor: Pick<Vendor, 'name' | 'code' | 'publicCode' | 'category' | 'id'>
  unlocked: boolean
  variant?: 'title' | 'body' | 'small' | 'caption'
  color?: string
  numberOfLines?: number
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text variant={variant} color={color} numberOfLines={numberOfLines} style={style}>
      {!unlocked && '🔒 '}
      {vendorDisplayName(vendor, unlocked)}
    </Text>
  )
}

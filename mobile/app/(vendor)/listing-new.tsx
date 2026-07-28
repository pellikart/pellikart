// Create a listing. Thin wrapper over ListingForm: seed an empty draft for the
// vendor's category, then on publish upload photos, assemble the VendorListing,
// and hand it to the shared addListing.

import { router } from 'expo-router'
import { useVendorStore } from '@shared/vendor-store'
import {
  emptyPhotographyEventPackages,
  emptyEntertainerPricing,
} from '@shared/vendor-category-config'
import { Screen, Text } from '@/components/ui'
import { Button } from '@/components/ui'
import { ListingForm } from '@/components/ListingForm'
import { buildListingPayload, listingCreateSupported, type ListingDraft } from '@/lib/listing-form'
import { uploadListingMedia } from '@/lib/media'
import { colors } from '@/theme/tokens'

export default function ListingNew() {
  const category = useVendorStore((s) => s.vendorProfile?.category) ?? ''
  const addListing = useVendorStore((s) => s.addListing)
  const liveMode = useVendorStore((s) => s._liveMode)
  const vendorDbId = useVendorStore((s) => s._vendorDbId)

  const support = listingCreateSupported(category)
  if (!support.ok) {
    return (
      <Screen center>
        <Text variant="h2" align="center">
          Add on the web app
        </Text>
        <Text variant="body" color={colors.gray500} align="center" style={{ marginTop: 8 }}>
          {support.reason}
        </Text>
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </Screen>
    )
  }

  const initial: ListingDraft = {
    rituals: [],
    categoryFields: {},
    includes: [],
    photos: [],
    price: 0,
    eventPackages: category === 'Photography' ? emptyPhotographyEventPackages() : [],
    entertainerPricing: category === 'Hosts / Entertainers' ? emptyEntertainerPricing() : null,
  }

  async function handleSubmit(draft: ListingDraft, photoUris: string[]): Promise<string | null> {
    const urls = await uploadListingMedia(vendorDbId, photoUris, liveMode)
    const listing = buildListingPayload(category, draft, urls, {
      id: `vl-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    })
    const ok = await addListing(listing)
    if (!ok) return "We couldn't publish your listing. Please check your connection and try again."
    router.back()
    return null
  }

  return (
    <ListingForm
      category={category}
      title="New listing"
      submitLabel="Publish listing"
      initial={initial}
      onSubmit={handleSubmit}
    />
  )
}

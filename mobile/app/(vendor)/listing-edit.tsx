// Edit a listing. Reads ?listingId, seeds the ListingForm from the existing row,
// and on save re-uploads any newly-picked photos and calls updateListing.

import { router, useLocalSearchParams } from 'expo-router'
import { useVendorStore } from '@shared/vendor-store'
import { emptyPhotographyEventPackages, emptyEntertainerPricing } from '@shared/vendor-category-config'
import { Button, Screen, Text } from '@/components/ui'
import { ListingForm } from '@/components/ListingForm'
import { buildListingPayload, type ListingDraft } from '@/lib/listing-form'
import { uploadListingMedia } from '@/lib/media'
import { colors } from '@/theme/tokens'

export default function ListingEdit() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>()
  const listings = useVendorStore((s) => s.vendorListings)
  const updateListing = useVendorStore((s) => s.updateListing)
  const liveMode = useVendorStore((s) => s._liveMode)
  const vendorDbId = useVendorStore((s) => s._vendorDbId)

  const existing = listings.find((l) => l.id === listingId)

  if (!existing) {
    return (
      <Screen center>
        <Text variant="body" color={colors.gray500}>
          Listing not found.
        </Text>
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </Screen>
    )
  }

  const category = existing.category
  const initial: ListingDraft = {
    rituals: existing.rituals ?? [],
    categoryFields: existing.categoryFields ?? {},
    includes: existing.includes ?? [],
    photos: existing.photos ?? [],
    price: existing.price,
    eventPackages: existing.eventPackages ?? (category === 'Photography' ? emptyPhotographyEventPackages() : []),
    entertainerPricing:
      existing.entertainerPricing ?? (category === 'Hosts / Entertainers' ? emptyEntertainerPricing() : null),
  }

  async function handleSubmit(draft: ListingDraft, photoUris: string[]): Promise<string | null> {
    // Only URIs that aren't already https URLs need uploading (in live mode).
    const urls = await uploadListingMedia(vendorDbId, photoUris, liveMode)
    const listing = buildListingPayload(category, draft, urls, existing!)
    updateListing(listing)
    router.back()
    return null
  }

  return (
    <ListingForm
      category={category}
      title="Edit listing"
      submitLabel="Save changes"
      initial={initial}
      onSubmit={handleSubmit}
    />
  )
}

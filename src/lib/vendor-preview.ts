import type { Vendor } from './types'
import type { VendorListing, VendorProfile } from './vendor-types'

/**
 * Map a vendor's own listing + profile into the couple-facing `Vendor` shape,
 * so the vendor can preview exactly what a couple sees in ListingDetailSheet.
 *
 * Mirrors buildLiveVendorMap's field mapping, but sourced from the vendor store
 * (app shapes) rather than raw DB rows. Rendered WITHOUT a board context
 * (no ritualId/categoryId), so the couple-only "Add to my board" actions — which
 * are all gated on that context — don't appear; the vendor just sees the
 * presentation and interactive pricing.
 */
export function vendorListingToPreviewVendor(
  listing: VendorListing,
  profile: VendorProfile | null,
): Vendor {
  const cover = listing.photos?.[listing.coverPhotoIndex ?? 0] || listing.photos?.[0] || ''
  return {
    id: listing.id,
    code: `${listing.category} preview`,
    name: profile?.businessName || listing.name,
    photo: cover,
    style: listing.style || '',
    area: profile?.area || '',
    price: listing.price,
    rating: profile?.rating || 0,
    packageTier: (listing.includes || []).slice(0, 4).join(' · '),
    likes: [],
    booked: false,
    amountPaid: 0,
    description: profile?.description || '',
    portfolioPhotos: profile?.portfolioPhotos || [],
    portfolioVideos: profile?.portfolioVideos || [],
    listingPhotos: listing.photos || [],
    listingVideos: listing.videos || [],
    venueLocation: listing.venueLocation,
    venuePricingModels: listing.venuePricingModels,
    hourlyPricing: listing.hourlyPricing,
    platePackages: listing.platePackages,
    slots: listing.slots,
    sizes: listing.sizes,
    paidRooms: listing.paidRooms,
    inHouseDecor: listing.inHouseDecor,
    menu: listing.menu,
    menuPhotos: listing.menuPhotos,
    menuMode: listing.menuMode,
    rateCard: listing.rateCard,
    availableHours: listing.availableHours,
    photographyPricingModels: listing.photographyPricingModels,
    guestPackages: listing.guestPackages,
    guestPackagePhotographers: listing.guestPackagePhotographers,
    guestPackageVideographers: listing.guestPackageVideographers,
    eventPackages: listing.eventPackages,
    mehendiPricing: listing.mehendiPricing,
    makeupPricing: listing.makeupPricing,
    sareeDrapingPricing: listing.sareeDrapingPricing,
    hairStylingPricing: listing.hairStylingPricing,
    rituals: listing.rituals,
    transportIncluded: listing.transportIncluded,
    transportExtra: listing.transportExtra,
    categoryFields: listing.categoryFields,
    includes: listing.includes || [],
    phone: profile?.phone,
    secondaryPhone: profile?.secondaryPhone,
    whatsapp: profile?.whatsapp,
    email: profile?.email,
    instagram: profile?.instagram,
    experience: profile?.experience,
    teamSize: profile?.teamSize,
    category: listing.category,
    bundledListings: listing.bundledListings,
    bundleMandatory: listing.bundleMandatory,
  }
}

// Shared model + helpers for the listing create/edit flows.
//
// The web VendorAddListing computes step positions from a tangle of has*Step
// booleans and a single integer `step`. This restates the same flow as an
// explicit ordered list of step keys per category — the identical sequence, far
// easier to read and to reuse between create and edit.

import {
  getListingConfig,
  isSingleListingCategory,
  photographyPackageHasPrice,
} from '@shared/vendor-category-config'
import { getPhotographyEventFromPrice, getEntertainerFromPrice } from '@shared/helpers'
import type { FieldValues } from '@/components/FormField'
import type { PhotographyEventPackage, EntertainerPricing } from '@shared/vendor-category-config'
import type { VendorListing } from '@shared/vendor-types'

export type StepKey =
  | 'rituals'
  | `config:${number}`
  | 'pricing'
  | 'inclusions'
  | 'photos'
  | 'review'

export interface ListingDraft {
  rituals: string[]
  categoryFields: FieldValues
  includes: string[]
  photos: string[]
  price: number
  eventPackages: PhotographyEventPackage[]
  entertainerPricing: EntertainerPricing | null
}

const NO_RITUALS = new Set(['Photography', 'Hosts / Entertainers'])
const NO_INCLUSIONS = new Set(['Decor', 'Photography', 'Catering', 'Hosts / Entertainers'])
const NO_PHOTOS = new Set(['Decor'])

/**
 * The ordered steps for a category, mirroring VendorAddListing's flow:
 * rituals → category-config steps → pricing → inclusions → photos → review.
 */
export function stepsFor(category: string): StepKey[] {
  const steps: StepKey[] = []
  if (!NO_RITUALS.has(category)) steps.push('rituals')
  const config = getListingConfig(category)
  config.steps.forEach((_, i) => steps.push(`config:${i}` as StepKey))
  steps.push('pricing')
  if (!NO_INCLUSIONS.has(category)) steps.push('inclusions')
  if (!NO_PHOTOS.has(category)) steps.push('photos')
  steps.push('review')
  return steps
}

/** Categories whose full authoring isn't on mobile yet (heavy web-only editors). */
export function listingCreateSupported(category: string): { ok: boolean; reason?: string } {
  if (isSingleListingCategory(category)) {
    return { ok: false, reason: 'This category authors its single listing during vendor onboarding.' }
  }
  if (category === 'Decor') {
    return { ok: false, reason: 'Decor designs (with per-design media and sizes) are authored on the web app for now.' }
  }
  return { ok: true }
}

/** Advanced pricing/menu editors deferred to web, shown as a note on the pricing step. */
export function webOnlyPricingNote(category: string): string | null {
  if (category === 'Venue')
    return 'Per-plate packages, service slots, paid rooms and in-house decor are managed on the web app. Set a starting price here.'
  if (category === 'Catering')
    return 'The interactive menu builder is on the web app. Set your per-plate price here; add the menu later on the web.'
  return null
}

/** Photography cards with at least one event and one price — what couples see. */
export function validEventPackages(pkgs: PhotographyEventPackage[]): PhotographyEventPackage[] {
  return pkgs.filter((p) => p.events.length > 0 && photographyPackageHasPrice(p))
}

/**
 * Assemble the VendorListing sent to addListing/updateListing, mirroring the
 * effective-price and per-category field rules in VendorAddListing.handlePublish.
 * `base` carries the id/createdAt (new for create, the existing row for edit).
 */
export function buildListingPayload(
  category: string,
  draft: ListingDraft,
  photoUrls: string[],
  base: Pick<VendorListing, 'id' | 'createdAt'> & Partial<VendorListing>
): VendorListing {
  const pkgs = validEventPackages(draft.eventPackages)
  const effectivePrice =
    category === 'Photography'
      ? getPhotographyEventFromPrice(pkgs)
      : category === 'Hosts / Entertainers'
        ? getEntertainerFromPrice(draft.entertainerPricing ?? undefined)
        : draft.price

  return {
    ...base,
    name: base.name || `${category} package`,
    photos: photoUrls,
    coverPhotoIndex: 0,
    category,
    price: effectivePrice,
    style: base.style ?? '',
    rituals: draft.rituals,
    categoryFields: draft.categoryFields,
    includes: draft.includes,
    photographyPricingModels: category === 'Photography' ? ['eventBased'] : undefined,
    eventPackages: category === 'Photography' && pkgs.length > 0 ? pkgs : undefined,
    entertainerPricing:
      category === 'Hosts / Entertainers' && draft.entertainerPricing ? draft.entertainerPricing : undefined,
  }
}

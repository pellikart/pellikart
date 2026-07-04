/**
 * Supabase database helpers for the live app.
 * Each function handles one read or write operation.
 * All writes are fire-and-forget (non-blocking) — the store updates
 * optimistically and these persist in the background.
 */
import { supabase } from './supabase'
import type { VendorProfile, VendorListing, BlockedTimeRange } from './vendor-types'
import type { OnboardingData, RitualBoard, Category } from './types'

// ─── VENDOR ─────────────────────────────────

export async function fetchVendor(userId: string) {
  if (!supabase) return null
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

/** The committed role for this account: 'couple' | 'vendor' | null (undecided).
 *  Returned separately from auth-context so callers get a definite "loaded"
 *  signal (undefined = not fetched yet) rather than racing the profile state. */
export async function fetchProfileRole(userId: string): Promise<'couple' | 'vendor' | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  const r = data?.role
  return r === 'couple' || r === 'vendor' ? r : null
}

export async function upsertVendor(userId: string, profile: VendorProfile, isLive: boolean) {
  if (!supabase) { console.error('[db] No supabase client'); return null }
  console.log('[db] upsertVendor for user:', userId)
  const { data, error } = await supabase
    .from('vendors')
    .upsert({
      user_id: userId,
      business_name: profile.businessName,
      category: profile.category,
      city: profile.city,
      area: profile.area,
      phone: profile.phone,
      secondary_phone: profile.secondaryPhone || null,
      whatsapp: profile.whatsapp,
      email: profile.email,
      instagram: profile.instagram || null,
      description: profile.description,
      years_experience: String(profile.experience),
      team_size: profile.teamSize,
      category_fields: profile.categoryFields || {},
      portfolio_photos: profile.portfolioPhotos || [],
      portfolio_videos: profile.portfolioVideos || [],
      is_live: isLive,
      // A vendor is only "done" once they're discoverable. For multi-listing
      // categories isLive starts false and is flipped true (along with this
      // flag) by setVendorLive() once their first listing row is confirmed.
      onboarding_complete: isLive,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  if (error) console.error('[db] upsertVendor failed:', error.message, error.details, error.hint)
  return data
}

/** Flip a vendor live + onboarding-complete once their first listing row is
 *  confirmed saved. Keeps `is_live` truthful: a vendor is never advertised to
 *  couples until at least one listing actually exists in the DB. */
export async function setVendorLive(userId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('vendors')
    .update({ is_live: true, onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) console.error('[db] setVendorLive failed:', error.message)
}

/** Same as setVendorLive but keyed by the vendor's DB id. Called right after a
 *  listing insert succeeds, so "has a saved listing ⇒ discoverable" holds no
 *  matter which flow created the listing or whether the onboarding-level
 *  setVendorLive call lands. Idempotent — a no-op for already-live vendors. */
export async function setVendorLiveById(vendorId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('vendors')
    .update({ is_live: true, onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
  if (error) console.error('[db] setVendorLiveById failed:', error.message)
}

export async function updateVendorFields(userId: string, updates: Partial<VendorProfile>) {
  if (!supabase) return
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.businessName !== undefined) mapped.business_name = updates.businessName
  if (updates.category !== undefined) mapped.category = updates.category
  if (updates.area !== undefined) mapped.area = updates.area
  if (updates.phone !== undefined) mapped.phone = updates.phone
  if (updates.secondaryPhone !== undefined) mapped.secondary_phone = updates.secondaryPhone || null
  if (updates.whatsapp !== undefined) mapped.whatsapp = updates.whatsapp
  if (updates.email !== undefined) mapped.email = updates.email
  if (updates.instagram !== undefined) mapped.instagram = updates.instagram || null
  if (updates.description !== undefined) mapped.description = updates.description
  if (updates.experience !== undefined) mapped.years_experience = String(updates.experience)
  if (updates.teamSize !== undefined) mapped.team_size = updates.teamSize
  if (updates.categoryFields !== undefined) mapped.category_fields = updates.categoryFields
  if (updates.portfolioPhotos !== undefined) mapped.portfolio_photos = updates.portfolioPhotos
  if (updates.portfolioVideos !== undefined) mapped.portfolio_videos = updates.portfolioVideos

  await supabase.from('vendors').update(mapped).eq('user_id', userId)
}

// ─── ADMIN ONBOARDING + CLAIM ───────────────
// Staff pre-build real, live vendor rows from quotations we already hold. Such
// rows have user_id = NULL until the real vendor claims them. Because the whole
// vendor app keys off the vendors row id (not user_id), everything downstream —
// listings, packages, availability, photos — reuses the normal write paths; the
// only writes that must be re-keyed are the vendors-row profile writes below.

/** True when the signed-in user's email is in the `admins` allowlist. */
export async function isAdminUser(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) { console.error('[db] is_admin failed:', error.message); return false }
  return data === true
}

/** Generate a short, human-friendly claim code (e.g. "PK-7QK4"). Avoids
 *  ambiguous chars (0/O, 1/I). Uniqueness is enforced by a DB unique index —
 *  createAdminVendor retries on the rare collision. */
function generateClaimCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `PK-${s}`
}

/** Fetch a vendor by its row id (admin editing path). */
export async function fetchVendorById(vendorId: string) {
  if (!supabase) return null
  const { data } = await supabase.from('vendors').select('*').eq('id', vendorId).maybeSingle()
  return data
}

/** All admin-created vendor rows, newest first (admin dashboard). */
export async function fetchAdminVendors() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_admin_created', true)
    .order('created_at', { ascending: false })
  if (error) console.error('[db] fetchAdminVendors failed:', error.message)
  return data || []
}

/** Create the shell vendor row an admin will then fill in via the normal
 *  onboarding flow. Starts not-live (flipped live once a listing is saved) and
 *  unowned (user_id NULL) with a unique claim code. */
export async function createAdminVendor(
  businessName: string,
  category: string,
  claimPhone: string | null,
): Promise<{ id: string; claim_code: string } | null> {
  if (!supabase) { console.error('[db] No supabase client'); return null }
  // Retry a couple of times on the (rare) claim-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const claimCode = generateClaimCode()
    const { data, error } = await supabase
      .from('vendors')
      .insert({
        user_id: null,
        business_name: businessName,
        category,
        claim_code: claimCode,
        claim_phone: claimPhone || null,
        phone: claimPhone || null,
        is_admin_created: true,
        is_live: false,
        onboarding_complete: false,
      })
      .select('id, claim_code')
      .maybeSingle()
    if (!error && data) return data as { id: string; claim_code: string }
    // 23505 = unique_violation (claim_code clash) — regenerate and retry.
    if (error && error.code !== '23505') {
      console.error('[db] createAdminVendor failed:', error.message, error.details, error.hint)
      return null
    }
  }
  console.error('[db] createAdminVendor: exhausted claim-code retries')
  return null
}

/** Update a vendor's profile fields keyed by row id (admin edit mode). Mirrors
 *  upsertVendor's field mapping but never touches user_id / claim / live flags. */
export async function upsertVendorById(vendorId: string, profile: VendorProfile) {
  if (!supabase) { console.error('[db] No supabase client'); return null }
  const { data, error } = await supabase
    .from('vendors')
    .update({
      business_name: profile.businessName,
      category: profile.category,
      city: profile.city,
      area: profile.area,
      phone: profile.phone,
      secondary_phone: profile.secondaryPhone || null,
      whatsapp: profile.whatsapp,
      email: profile.email,
      instagram: profile.instagram || null,
      description: profile.description,
      years_experience: String(profile.experience),
      team_size: profile.teamSize,
      category_fields: profile.categoryFields || {},
      portfolio_photos: profile.portfolioPhotos || [],
      portfolio_videos: profile.portfolioVideos || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .maybeSingle()
  if (error) console.error('[db] upsertVendorById failed:', error.message, error.details, error.hint)
  return data
}

/** Partial profile update keyed by row id (admin edit mode twin of updateVendorFields). */
export async function updateVendorFieldsById(vendorId: string, updates: Partial<VendorProfile>) {
  if (!supabase) return
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.businessName !== undefined) mapped.business_name = updates.businessName
  if (updates.category !== undefined) mapped.category = updates.category
  if (updates.area !== undefined) mapped.area = updates.area
  if (updates.phone !== undefined) mapped.phone = updates.phone
  if (updates.secondaryPhone !== undefined) mapped.secondary_phone = updates.secondaryPhone || null
  if (updates.whatsapp !== undefined) mapped.whatsapp = updates.whatsapp
  if (updates.email !== undefined) mapped.email = updates.email
  if (updates.instagram !== undefined) mapped.instagram = updates.instagram || null
  if (updates.description !== undefined) mapped.description = updates.description
  if (updates.experience !== undefined) mapped.years_experience = String(updates.experience)
  if (updates.teamSize !== undefined) mapped.team_size = updates.teamSize
  if (updates.categoryFields !== undefined) mapped.category_fields = updates.categoryFields
  if (updates.portfolioPhotos !== undefined) mapped.portfolio_photos = updates.portfolioPhotos
  if (updates.portfolioVideos !== undefined) mapped.portfolio_videos = updates.portfolioVideos

  await supabase.from('vendors').update(mapped).eq('id', vendorId)
}

/** Delete an admin-created vendor and its data. Listings / availability /
 *  packages cascade via FK; photos are removed from storage best-effort. */
export async function deleteAdminVendor(vendorId: string): Promise<boolean> {
  if (!supabase) return false
  // Best-effort storage cleanup (orphaned files are harmless if this fails).
  try {
    const { data: files } = await supabase.storage.from('vendor-photos').list(vendorId)
    if (files && files.length) {
      await supabase.storage.from('vendor-photos').remove(files.map(f => `${vendorId}/${f.name}`))
    }
  } catch { /* non-fatal */ }
  const { error } = await supabase.from('vendors').delete().eq('id', vendorId)
  if (error) { console.error('[db] deleteAdminVendor failed:', error.message); return false }
  return true
}

/** Vendor-side: claim a pre-built profile by code and/or phone. Returns the
 *  claimed vendor id, or throws with a user-facing message on failure. */
export async function claimVendor(code: string, phone: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data, error } = await supabase.rpc('claim_vendor', {
    p_code: code.trim(),
    p_phone: phone.trim(),
  })
  if (error) throw new Error(error.message)
  return data as string
}

// ─── VENDOR LISTINGS ────────────────────────

export async function fetchVendorListings(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('vendor_listings')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function insertListing(vendorId: string, listing: VendorListing) {
  if (!supabase) { console.error('[db] No supabase client'); return null }
  console.log('[db] insertListing for vendor:', vendorId)
  const { data, error } = await supabase
    .from('vendor_listings')
    .insert({
      vendor_id: vendorId,
      name: listing.name,
      photos: listing.photos,
      videos: listing.videos || [],
      cover_photo_index: listing.coverPhotoIndex ?? 0,
      category: listing.category,
      price: listing.price,
      style: listing.style,
      rituals: listing.rituals || [],
      category_fields: listing.categoryFields || {},
      includes: listing.includes,
      bundled_listings: listing.bundledListings || [],
      bundle_mandatory: listing.bundleMandatory || false,
      venue_location: listing.venueLocation || {},
      venue_pricing_models: listing.venuePricingModels || [],
      hourly_pricing: listing.hourlyPricing || [],
      plate_packages: listing.platePackages || [],
      paid_rooms: listing.paidRooms || [],
      in_house_decor: listing.inHouseDecor || {},
      menu: listing.menu || [],
      menu_photos: listing.menuPhotos || [],
      menu_mode: listing.menuMode || 'items',
      sizes: listing.sizes || [],
      rate_card: listing.rateCard || {},
      available_hours: listing.availableHours || [],
      photography_pricing_models: listing.photographyPricingModels || [],
      guest_packages: listing.guestPackages || {},
      guest_package_photographers: listing.guestPackagePhotographers || {},
      guest_package_videographers: listing.guestPackageVideographers || {},
      mehendi_pricing: listing.mehendiPricing || {},
      makeup_pricing: listing.makeupPricing || {},
      saree_draping_pricing: listing.sareeDrapingPricing || {},
      hair_styling_pricing: listing.hairStylingPricing || {},
      transport_included: listing.transportIncluded ?? null,
      transport_extra: listing.transportExtra ?? null,
    })
    .select()
    .maybeSingle()
  if (error) console.error('[db] insertListing failed:', error.message, error.details, error.hint)
  return data
}

export async function updateListingDb(listingDbId: string, listing: VendorListing) {
  if (!supabase) return
  await supabase
    .from('vendor_listings')
    .update({
      name: listing.name,
      photos: listing.photos,
      videos: listing.videos || [],
      cover_photo_index: listing.coverPhotoIndex ?? 0,
      category: listing.category,
      price: listing.price,
      style: listing.style,
      rituals: listing.rituals || [],
      category_fields: listing.categoryFields || {},
      includes: listing.includes,
      bundled_listings: listing.bundledListings || [],
      bundle_mandatory: listing.bundleMandatory || false,
      venue_location: listing.venueLocation || {},
      venue_pricing_models: listing.venuePricingModels || [],
      hourly_pricing: listing.hourlyPricing || [],
      plate_packages: listing.platePackages || [],
      paid_rooms: listing.paidRooms || [],
      in_house_decor: listing.inHouseDecor || {},
      menu: listing.menu || [],
      menu_photos: listing.menuPhotos || [],
      menu_mode: listing.menuMode || 'items',
      sizes: listing.sizes || [],
      rate_card: listing.rateCard || {},
      available_hours: listing.availableHours || [],
      photography_pricing_models: listing.photographyPricingModels || [],
      guest_packages: listing.guestPackages || {},
      guest_package_photographers: listing.guestPackagePhotographers || {},
      guest_package_videographers: listing.guestPackageVideographers || {},
      mehendi_pricing: listing.mehendiPricing || {},
      makeup_pricing: listing.makeupPricing || {},
      saree_draping_pricing: listing.sareeDrapingPricing || {},
      hair_styling_pricing: listing.hairStylingPricing || {},
      transport_included: listing.transportIncluded ?? null,
      transport_extra: listing.transportExtra ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingDbId)
}

export async function deleteListingDb(listingDbId: string) {
  if (!supabase) return
  const { error } = await supabase.from('vendor_listings').delete().eq('id', listingDbId)
  if (error) console.error('[db] deleteListingDb failed:', error.message)
}

// ─── VENDOR PACKAGES ────────────────────────

export interface VendorPackageRow {
  id: string
  vendor_id: string
  name: string
  price: number
  capacity: string | null
  features: string[]
  sort_order: number
}

export async function fetchVendorPackages(vendorId: string): Promise<VendorPackageRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('vendor_packages').select('*').eq('vendor_id', vendorId).order('sort_order')
  return (data || []) as VendorPackageRow[]
}

export async function insertPackage(vendorId: string, pkg: { id?: string; name: string; price: number; features: string[]; capacity: string }, sortOrder: number) {
  if (!supabase) return null
  const { data, error } = await supabase.from('vendor_packages').insert({
    vendor_id: vendorId,
    name: pkg.name,
    price: pkg.price,
    capacity: pkg.capacity,
    features: pkg.features,
    sort_order: sortOrder,
  }).select().maybeSingle()
  if (error) console.error('[db] insertPackage failed:', error.message)
  return data as VendorPackageRow | null
}

export async function updatePackageDb(packageId: string, pkg: { name: string; price: number; features: string[]; capacity: string }) {
  if (!supabase) return
  const { error } = await supabase.from('vendor_packages').update({
    name: pkg.name,
    price: pkg.price,
    capacity: pkg.capacity,
    features: pkg.features,
    updated_at: new Date().toISOString(),
  }).eq('id', packageId)
  if (error) console.error('[db] updatePackageDb failed:', error.message)
}

export async function deletePackageDb(packageId: string) {
  if (!supabase) return
  await supabase.from('vendor_packages').delete().eq('id', packageId)
}

// ─── LIKES ──────────────────────────────────

export async function addLikeDb(userId: string, vendorId: string, likerName: string, likerUserId: string) {
  if (!supabase) return
  await supabase.from('vendor_likes').upsert({
    user_id: userId, vendor_id: vendorId, liker_name: likerName, liker_user_id: likerUserId,
  }, { onConflict: 'user_id,vendor_id,liker_user_id' })
}

export async function removeLikeDb(userId: string, vendorId: string, likerUserId: string) {
  if (!supabase) return
  await supabase.from('vendor_likes').delete()
    .eq('user_id', userId).eq('vendor_id', vendorId).eq('liker_user_id', likerUserId)
}

export interface LikeRow {
  user_id: string
  vendor_id: string
  liker_name: string
  liker_user_id: string
}

/** Fetch all likes for a couple (so heart state survives refresh) */
export async function fetchUserLikes(userId: string): Promise<LikeRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('vendor_likes').select('*').eq('user_id', userId)
  return (data || []) as LikeRow[]
}

// ─── SUBSCRIPTION ───────────────────────────

export async function updateSubscriptionDb(userId: string, tier: 'free' | 'silver' | 'gold') {
  if (!supabase) return
  await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId)
}

export async function fetchSubscriptionTier(userId: string): Promise<'free' | 'silver' | 'gold'> {
  if (!supabase) return 'free'
  const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle()
  return (data?.subscription_tier as 'free' | 'silver' | 'gold') || 'free'
}

// ─── VENDOR AVAILABILITY ────────────────────

export async function fetchVendorAvailability(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('vendor_availability')
    .select('*')
    .eq('vendor_id', vendorId)
  return data || []
}

export async function upsertAvailability(
  vendorId: string,
  date: string,
  status: 'available' | 'blocked' | 'booked',
  listingIds: string[],
  blockedRanges: BlockedTimeRange[]
) {
  if (!supabase) return
  if (status === 'available') {
    // Remove the row — available is the default (no row)
    await supabase
      .from('vendor_availability')
      .delete()
      .eq('vendor_id', vendorId)
      .eq('date', date)
  } else {
    await supabase
      .from('vendor_availability')
      .upsert({
        vendor_id: vendorId,
        date,
        status,
        listing_ids: listingIds,
        blocked_ranges: blockedRanges,
      }, { onConflict: 'vendor_id,date' })
  }
}

// ─── COUPLES ────────────────────────────────

export async function fetchCouple(userId: string) {
  if (!supabase) return null
  const { data } = await supabase
    .from('couples')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function upsertCouple(userId: string, onboarding: OnboardingData) {
  if (!supabase) return null
  const { data } = await supabase
    .from('couples')
    .upsert({
      user_id: userId,
      partner1_name: onboarding.partner1,
      partner2_name: onboarding.partner2,
      events: onboarding.events,
      custom_events: onboarding.customEvents,
      event_dates: onboarding.eventDates,
      event_guests: onboarding.eventGuests,
      budget: onboarding.budget,
      style_preference: onboarding.style,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  return data
}

// ─── RITUAL BOARDS ──────────────────────────

/** Public: fetch a board + its categories by board ID (no auth required) */
export async function fetchSharedBoard(boardId: string) {
  if (!supabase) return null
  const { data: board, error: boardError } = await supabase
    .from('ritual_boards')
    .select('*')
    .eq('id', boardId)
    .maybeSingle()
  if (boardError || !board) {
    if (boardError) console.error('[db] fetchSharedBoard board failed:', boardError.message)
    return null
  }
  const { data: categories } = await supabase
    .from('board_categories')
    .select('*')
    .eq('ritual_board_id', boardId)
  return { board, categories: categories || [] }
}

/** Public: append a vendor suggestion to a category and notify the owner */
export async function addBoardSuggestion(categoryId: string, vendorId: string, suggestedBy: string) {
  if (!supabase) return { ok: false, error: 'No supabase client' }
  const { error } = await supabase.rpc('add_board_suggestion', {
    p_category_id: categoryId,
    p_vendor_id: vendorId,
    p_suggested_by: suggestedBy,
  })
  if (error) {
    console.error('[db] addBoardSuggestion failed:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function fetchRitualBoards(coupleId: string) {
  if (!supabase) return []
  const { data: boards } = await supabase
    .from('ritual_boards')
    .select('*')
    .eq('couple_id', coupleId)
    .order('sort_order')

  if (!boards || boards.length === 0) return []

  // Fetch categories for all boards
  const boardIds = boards.map(b => b.id)
  const { data: categories } = await supabase
    .from('board_categories')
    .select('*')
    .in('ritual_board_id', boardIds)

  // Map to app format
  return boards.map(b => ({
    id: b.id,
    name: b.name,
    dateStart: b.date_start,
    dateEnd: b.date_end,
    categories: (categories || [])
      .filter(c => c.ritual_board_id === b.id)
      .map(c => ({
        id: c.id,
        label: c.label,
        selectedVendorId: c.selected_vendor_id,
        shortlistedVendorIds: c.shortlisted_vendor_ids || [],
        suggestedVendors: c.suggested_vendors || [],
        removed: c.is_removed || false,
        decorBrief: c.decor_brief || null,
        selectedTierHours: c.selected_tier_hours ?? undefined,
        photographyTeam: (c.photography_team as { counts: Record<string, number>; hours: number } | null) ?? undefined,
        photographyPackage: (c.photography_package as { bucket: string; hours: number } | null) ?? undefined,
        mehendiSelection: (c.mehendi_selection as { coverage?: string; design?: string; groom?: boolean; guests?: number } | null) ?? undefined,
        makeupSelection: (c.makeup_selection as { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] } | null) ?? undefined,
        sareeSelection: (c.saree_selection as { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number } | null) ?? undefined,
        hairSelection: (c.hair_selection as { bridalLooks?: number; groomLooks?: number; guests?: number } | null) ?? undefined,
        menuSelection: (c.menu_selection as import('./types').MenuSelection | null) ?? undefined,
      })),
  })) as RitualBoard[]
}

/** Save / clear the decor brief for a category */
export async function saveDecorBriefDb(categoryId: string, brief: import('./types').DecorBrief | null) {
  if (!supabase) return
  const { error } = await supabase
    .from('board_categories')
    .update({ decor_brief: brief })
    .eq('id', categoryId)
  if (error) console.error('[db] saveDecorBriefDb failed:', error.message)
}

export async function insertRitualBoard(coupleId: string, board: RitualBoard, sortOrder: number) {
  if (!supabase) return null
  const { data: dbBoard } = await supabase
    .from('ritual_boards')
    .insert({
      couple_id: coupleId,
      name: board.name,
      date_start: board.dateStart || null,
      date_end: board.dateEnd || null,
      sort_order: sortOrder,
    })
    .select()
    .maybeSingle()

  if (!dbBoard) return null

  // Insert categories
  if (board.categories.length > 0) {
    await supabase
      .from('board_categories')
      .insert(board.categories.map(c => ({
        ritual_board_id: dbBoard.id,
        label: c.label,
        selected_vendor_id: c.selectedVendorId,
        shortlisted_vendor_ids: c.shortlistedVendorIds,
        suggested_vendors: c.suggestedVendors,
        is_removed: c.removed,
      })))
  }

  return dbBoard
}

/** Insert a single new board_category row (used when couple adds a category
 *  to an existing board via the picker). Returns the row with its real UUID. */
export async function insertBoardCategory(boardId: string, label: string) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('board_categories')
    .insert({
      ritual_board_id: boardId,
      label,
      selected_vendor_id: null,
      shortlisted_vendor_ids: [],
      suggested_vendors: [],
      is_removed: false,
    })
    .select()
    .maybeSingle()
  if (error) console.error('[db] insertBoardCategory failed:', error.message)
  return data
}

export async function updateBoardCategory(categoryId: string, updates: Partial<Category>) {
  if (!supabase) return
  const mapped: Record<string, unknown> = {}
  if (updates.selectedVendorId !== undefined) mapped.selected_vendor_id = updates.selectedVendorId
  if (updates.shortlistedVendorIds !== undefined) mapped.shortlisted_vendor_ids = updates.shortlistedVendorIds
  if (updates.suggestedVendors !== undefined) mapped.suggested_vendors = updates.suggestedVendors
  if (updates.removed !== undefined) mapped.is_removed = updates.removed
  if (updates.selectedTierHours !== undefined) mapped.selected_tier_hours = updates.selectedTierHours ?? null
  // Photography fields use an `in` check (not !== undefined) so a model switch that
  // passes `photographyPackage: undefined` / `photographyTeam: undefined` actively
  // clears the sibling column rather than silently leaving it set.
  if ('photographyTeam' in updates) mapped.photography_team = updates.photographyTeam ?? null
  if ('photographyPackage' in updates) mapped.photography_package = updates.photographyPackage ?? null
  if (updates.mehendiSelection !== undefined) mapped.mehendi_selection = updates.mehendiSelection ?? null
  if (updates.makeupSelection !== undefined) mapped.makeup_selection = updates.makeupSelection ?? null
  if (updates.sareeSelection !== undefined) mapped.saree_selection = updates.sareeSelection ?? null
  if (updates.hairSelection !== undefined) mapped.hair_selection = updates.hairSelection ?? null
  if (updates.menuSelection !== undefined) mapped.menu_selection = updates.menuSelection ?? null

  await supabase.from('board_categories').update(mapped).eq('id', categoryId)
}

export async function updateBoardDatesDb(boardId: string, dateStart: string, dateEnd: string) {
  if (!supabase) return
  await supabase
    .from('ritual_boards')
    .update({ date_start: dateStart, date_end: dateEnd })
    .eq('id', boardId)
}

// ─── PHOTO UPLOADS ─────────────────────────

/**
 * Upload a photo to Supabase Storage.
 * Returns the public URL, or null on failure.
 * Path: vendor-photos/{vendorId}/{type}/{timestamp}-{filename}
 */
/** Cap the longest edge of uploaded images. Phone originals can be 60+ MP /
 *  tens of MB, which exceed browser image-decode limits — they upload fine but
 *  then render as "can't load this content" for couples. We downscale + re-encode
 *  to JPEG before upload. Falls back to the original on any error or for
 *  non-images (e.g. videos, which also flow through this function). */
const MAX_IMAGE_DIM = 2000
async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(width, height))
    // Already within limits and not heavy — leave it untouched.
    if (scale >= 1 && file.size < 1_500_000) { bitmap.close?.(); return file }
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch (e) {
    console.warn('[storage] downscale failed, uploading original:', e)
    return file
  }
}

export async function uploadPhoto(
  vendorId: string,
  file: File,
  type: 'portfolio' | 'listing'
): Promise<string | null> {
  if (!supabase) return null

  const f = await downscaleImage(file)
  const ext = f.name.split('.').pop() || 'jpg'
  const path = `${vendorId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('vendor-photos')
    .upload(path, f, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[storage] Upload failed:', error.message)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('vendor-photos')
    .getPublicUrl(path)

  return urlData.publicUrl
}

/**
 * Upload multiple photos. Returns array of public URLs (skips failures).
 */
export async function uploadPhotos(
  vendorId: string,
  files: File[],
  type: 'portfolio' | 'listing'
): Promise<string[]> {
  const results = await Promise.all(
    files.map(f => uploadPhoto(vendorId, f, type))
  )
  return results.filter((url): url is string => url !== null)
}

/**
 * Delete a photo from Supabase Storage by its full URL.
 */
export async function deletePhoto(publicUrl: string): Promise<void> {
  if (!supabase) return
  // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/vendor-photos/PATH
  const match = publicUrl.match(/vendor-photos\/(.+)$/)
  if (!match) return
  await supabase.storage.from('vendor-photos').remove([match[1]])
}

// ─── ANALYTICS TRACKING ─────────────────────

export type AnalyticsEventType =
  | 'explore_impression' | 'detail_view' | 'profile_view' | 'compare_view'
  | 'shortlist_add' | 'shortlist_remove' | 'like' | 'unlike'
  | 'suggest' | 'trial_request' | 'vendor_select' | 'booking'

/**
 * Fire-and-forget analytics event. Never blocks UI.
 * vendorId = the vendors table UUID (not a listing ID).
 */
export function trackEvent(
  vendorId: string,
  eventType: AnalyticsEventType,
  actorId?: string | null,
  listingId?: string | null,
  metadata?: Record<string, unknown>
) {
  if (!supabase) return
  supabase
    .from('analytics_events')
    .insert({
      vendor_id: vendorId,
      listing_id: listingId || null,
      actor_id: actorId || null,
      event_type: eventType,
      metadata: metadata || {},
    })
    .then(({ error }) => {
      if (error) console.warn('[analytics] event failed:', error.message)
    })
}

/** Batch-track impressions for multiple vendors at once */
export function trackImpressions(
  vendorIds: string[],
  actorId?: string | null,
  metadata?: Record<string, unknown>
) {
  if (!supabase || vendorIds.length === 0) return
  const rows = vendorIds.map(vid => ({
    vendor_id: vid,
    actor_id: actorId || null,
    event_type: 'explore_impression' as const,
    metadata: metadata || {},
  }))
  supabase.from('analytics_events').insert(rows).then(({ error }) => {
    if (error) console.warn('[analytics] batch impression failed:', error.message)
  })
}

// ─── ANALYTICS QUERIES (for vendor dashboard) ─

export interface AnalyticsSummary {
  totalImpressions: number
  totalDetailViews: number
  totalProfileViews: number
  totalCompareViews: number
  totalShortlists: number
  totalLikes: number
  totalTrialRequests: number
  totalSelections: number
  totalBookings: number
}

export interface DailyCount {
  date: string
  impressions: number
  detailViews: number
}

export interface ListingPerformance {
  listingId: string
  listingName: string
  views: number
  shortlists: number
}

export async function fetchAnalyticsSummary(vendorId: string): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    totalImpressions: 0, totalDetailViews: 0, totalProfileViews: 0,
    totalCompareViews: 0, totalShortlists: 0, totalLikes: 0,
    totalTrialRequests: 0, totalSelections: 0, totalBookings: 0,
  }
  if (!supabase) return empty

  const { data } = await supabase
    .from('analytics_events')
    .select('event_type')
    .eq('vendor_id', vendorId)

  if (!data) return empty

  for (const row of data) {
    switch (row.event_type) {
      case 'explore_impression': empty.totalImpressions++; break
      case 'detail_view': empty.totalDetailViews++; break
      case 'profile_view': empty.totalProfileViews++; break
      case 'compare_view': empty.totalCompareViews++; break
      case 'shortlist_add': empty.totalShortlists++; break
      case 'like': empty.totalLikes++; break
      case 'trial_request': empty.totalTrialRequests++; break
      case 'vendor_select': empty.totalSelections++; break
      case 'booking': empty.totalBookings++; break
    }
  }
  return empty
}

/** Get daily impression + detail view counts for the last N days */
export async function fetchDailyViews(vendorId: string, days: number = 30): Promise<DailyCount[]> {
  if (!supabase) return []

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data } = await supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .eq('vendor_id', vendorId)
    .in('event_type', ['explore_impression', 'detail_view'])
    .gte('created_at', since.toISOString())
    .order('created_at')

  if (!data) return []

  // Group by date
  const map: Record<string, DailyCount> = {}
  for (let d = 0; d < days; d++) {
    const date = new Date(since)
    date.setDate(date.getDate() + d)
    const key = date.toISOString().split('T')[0]
    map[key] = { date: key, impressions: 0, detailViews: 0 }
  }

  for (const row of data) {
    const key = (row.created_at as string).split('T')[0]
    if (!map[key]) map[key] = { date: key, impressions: 0, detailViews: 0 }
    if (row.event_type === 'explore_impression') map[key].impressions++
    else if (row.event_type === 'detail_view') map[key].detailViews++
  }

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

/** Get view counts per listing */
export async function fetchListingPerformance(vendorId: string): Promise<ListingPerformance[]> {
  if (!supabase) return []

  const { data: events } = await supabase
    .from('analytics_events')
    .select('listing_id, event_type')
    .eq('vendor_id', vendorId)
    .not('listing_id', 'is', null)
    .in('event_type', ['detail_view', 'shortlist_add'])

  const { data: listings } = await supabase
    .from('vendor_listings')
    .select('id, name')
    .eq('vendor_id', vendorId)

  if (!events || !listings) return []

  const nameMap: Record<string, string> = {}
  for (const l of listings) nameMap[l.id] = l.name

  const perfMap: Record<string, ListingPerformance> = {}
  for (const l of listings) {
    perfMap[l.id] = { listingId: l.id, listingName: l.name, views: 0, shortlists: 0 }
  }

  for (const e of events) {
    const lid = e.listing_id as string
    if (!perfMap[lid]) perfMap[lid] = { listingId: lid, listingName: nameMap[lid] || 'Unknown', views: 0, shortlists: 0 }
    if (e.event_type === 'detail_view') perfMap[lid].views++
    else if (e.event_type === 'shortlist_add') perfMap[lid].shortlists++
  }

  return Object.values(perfMap)
}

// ─── ALL LIVE VENDORS (for couple explore) ──

export async function fetchAllLiveVendors() {
  if (!supabase) return []
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_live', true)
  return data || []
}

export async function fetchAllListings() {
  if (!supabase) return []
  const { data } = await supabase
    .from('vendor_listings')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

/** Fetch blocked/booked dates for all live vendors (for couple availability display) */
export async function fetchAllAvailability() {
  if (!supabase) return []
  const { data } = await supabase
    .from('vendor_availability')
    .select('vendor_id, date, status')
    .in('status', ['blocked', 'booked'])
  return data || []
}

// ─── TRIALS ─────────────────────────────────

export interface TrialRow {
  id: string
  couple_id: string
  vendor_id: string
  listing_id: string | null
  ritual_name: string
  category_label: string
  status: 'requested' | 'accepted' | 'rescheduled' | 'confirmed' | 'done'
  requested_date: string
  requested_time: string
  scheduled_date: string
  scheduled_time: string
  vendor_proposed_date: string | null
  vendor_proposed_time: string | null
}

/** Couple creates a trial request */
export async function createTrial(
  coupleId: string, vendorId: string, listingId: string | null,
  ritualName: string, categoryLabel: string, date: string, time: string
): Promise<TrialRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('trials')
    .insert({
      couple_id: coupleId,
      vendor_id: vendorId,
      listing_id: listingId,
      ritual_name: ritualName,
      category_label: categoryLabel,
      requested_date: date,
      requested_time: time,
      scheduled_date: date,
      scheduled_time: time,
    })
    .select()
    .maybeSingle()
  if (error) console.error('[db] createTrial failed:', error.message)
  return data as TrialRow | null
}

/** Fetch trials for a couple */
export async function fetchCoupleTrials(coupleId: string): Promise<TrialRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('trials').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
  return (data || []) as TrialRow[]
}

/** Fetch trials for a vendor */
export async function fetchVendorTrials(vendorId: string): Promise<TrialRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('trials').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
  return (data || []) as TrialRow[]
}

/** Vendor accepts a trial (keeps the couple's proposed time) */
export async function acceptTrialDb(trialId: string) {
  if (!supabase) return
  await supabase.from('trials').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', trialId)
}

/** Vendor proposes a new time */
export async function proposeNewTrialTimeDb(trialId: string, date: string, time: string) {
  if (!supabase) return
  await supabase.from('trials').update({
    status: 'rescheduled',
    vendor_proposed_date: date,
    vendor_proposed_time: time,
    updated_at: new Date().toISOString(),
  }).eq('id', trialId)
}

/** Couple confirms the vendor's proposed time */
export async function confirmTrialDb(trialId: string) {
  if (!supabase) return
  // Get the proposed time first
  const { data } = await supabase.from('trials').select('vendor_proposed_date, vendor_proposed_time').eq('id', trialId).maybeSingle()
  if (!data) return
  await supabase.from('trials').update({
    status: 'confirmed',
    scheduled_date: data.vendor_proposed_date || '',
    scheduled_time: data.vendor_proposed_time || '',
    updated_at: new Date().toISOString(),
  }).eq('id', trialId)
}

/** Mark trial as done */
export async function markTrialDoneDb(trialId: string) {
  if (!supabase) return
  await supabase.from('trials').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', trialId)
}

/** Vendor declines a trial */
export async function declineTrialDb(trialId: string, reason: string) {
  if (!supabase) return
  const { error } = await supabase.from('trials').update({
    status: 'declined',
    decline_reason: reason || null,
    updated_at: new Date().toISOString(),
  }).eq('id', trialId)
  if (error) console.error('[db] declineTrialDb failed:', error.message)
}

// ─── BIDS ───────────────────────────────────

export interface BidRow {
  id: string
  couple_id: string
  vendor_id: string
  ritual_name: string
  category_label: string
  uploaded_image: string
  status: 'pending' | 'submitted' | 'selected' | 'not_selected'
  bid_price: number | null
  bid_note: string | null
  category_id: string | null
  /** Joined from board_categories — only present when fetched with the brief join */
  decor_brief?: import('./types').DecorBrief | null
  /** Joined from vendor_listings — only present when fetched with vendor join */
  vendor_name?: string | null
}

/** Couple creates bid requests for all vendors in a category */
export async function createBids(
  coupleId: string, vendorIds: string[], ritualName: string,
  categoryLabel: string, imageUrl: string, categoryId?: string,
): Promise<BidRow[]> {
  if (!supabase) return []
  const rows = vendorIds.map(vid => ({
    couple_id: coupleId,
    vendor_id: vid,
    ritual_name: ritualName,
    category_label: categoryLabel,
    uploaded_image: imageUrl,
    category_id: categoryId || null,
  }))
  const { data, error } = await supabase.from('bids').insert(rows).select()
  if (error) console.error('[db] createBids failed:', error.message)
  return (data || []) as BidRow[]
}

/** Fetch bids for a couple */
export async function fetchCoupleBids(coupleId: string): Promise<BidRow[]> {
  if (!supabase) return []
  // Join the category to recover the decor_brief snapshot the couple submitted.
  const { data } = await supabase
    .from('bids')
    .select('*, board_categories!category_id(decor_brief)')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  return ((data || []) as unknown as (BidRow & { board_categories?: { decor_brief: import('./types').DecorBrief | null } | null })[]).map(b => ({
    ...b,
    decor_brief: b.board_categories?.decor_brief ?? null,
  })) as BidRow[]
}

/** Fetch bids for a vendor — also joins the decor brief and the listing name */
export async function fetchVendorBidsDb(vendorId: string): Promise<BidRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('bids')
    .select('*, board_categories!category_id(decor_brief)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  return ((data || []) as unknown as (BidRow & { board_categories?: { decor_brief: import('./types').DecorBrief | null } | null })[]).map(b => ({
    ...b,
    decor_brief: b.board_categories?.decor_brief ?? null,
  })) as BidRow[]
}

/** Vendor submits a bid response */
export async function submitBidDb(bidId: string, price: number, note: string) {
  if (!supabase) return
  const { error } = await supabase.from('bids').update({
    status: 'submitted',
    bid_price: price,
    bid_note: note,
    updated_at: new Date().toISOString(),
  }).eq('id', bidId)
  if (error) console.error('[db] submitBid failed:', error.message)
}

/** Couple selects a bid winner */
export async function selectBidDb(bidId: string) {
  if (!supabase) return
  await supabase.from('bids').update({ status: 'selected', updated_at: new Date().toISOString() }).eq('id', bidId)
}

// ─── BOOKINGS ───────────────────────────────

export async function createBooking(
  coupleId: string, vendorId: string, listingId: string,
  ritualBoardId: string, categoryLabel: string,
  totalValue: number, slotAmount: number, slotPercentage: number
) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      couple_id: coupleId, vendor_id: vendorId, listing_id: listingId,
      ritual_board_id: ritualBoardId, category_label: categoryLabel,
      total_value: totalValue, slot_amount: slotAmount, slot_percentage: slotPercentage,
    })
    .select().maybeSingle()
  if (error) console.error('[db] createBooking failed:', error.message)
  return data
}

export async function fetchCoupleBookings(coupleId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('bookings').select('*').eq('couple_id', coupleId).order('booked_at', { ascending: false })
  return data || []
}

export async function fetchVendorBookingsDb(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('bookings').select('*').eq('vendor_id', vendorId).order('booked_at', { ascending: false })
  return data || []
}

/** Mark a couple's active booking for a listing as cancelled. */
export async function cancelBookingDb(coupleId: string, listingId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('couple_id', coupleId)
    .eq('listing_id', listingId)
    .eq('status', 'active')
  if (error) console.error('[db] cancelBookingDb failed:', error.message)
}

// ─── MILESTONES ─────────────────────────────

export interface MilestoneRow {
  id: string
  booking_id: string
  title: string
  sort_order: number
  is_complete: boolean
  completed_at: string | null
}

export async function createMilestones(bookingId: string, titles: string[]): Promise<MilestoneRow[]> {
  if (!supabase) return []
  const rows = titles.map((title, i) => ({ booking_id: bookingId, title, sort_order: i }))
  const { data, error } = await supabase.from('milestones').insert(rows).select()
  if (error) console.error('[db] createMilestones failed:', error.message)
  return (data || []) as MilestoneRow[]
}

export async function fetchMilestones(bookingId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('milestones').select('*').eq('booking_id', bookingId).order('sort_order')
  return data || []
}

export async function completeMilestoneDb(milestoneId: string) {
  if (!supabase) return
  await supabase.from('milestones').update({ is_complete: true, completed_at: new Date().toISOString() }).eq('id', milestoneId)
}

// ─── NOTIFICATIONS ──────────────────────────

export async function createNotification(
  userId: string, title: string, body: string,
  type: 'booking' | 'trial' | 'bid' | 'milestone' | 'review' | 'system',
  deepLink?: string
) {
  if (!supabase) return
  await supabase.from('notifications').insert({ user_id: userId, title, body, type, deep_link: deepLink })
}

export async function fetchNotifications(userId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  return data || []
}

export async function markNotificationReadDb(notificationId: string) {
  if (!supabase) return
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
}

export async function markAllNotificationsReadDb(userId: string) {
  if (!supabase) return
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}

// ─── REVIEWS ────────────────────────────────

export async function createReview(
  coupleId: string, vendorId: string, bookingId: string | null,
  coupleNames: string, eventName: string, eventDate: string,
  rating: number, text: string
) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('reviews')
    .insert({ couple_id: coupleId, vendor_id: vendorId, booking_id: bookingId, couple_names: coupleNames, event_name: eventName, event_date: eventDate, rating, text })
    .select().maybeSingle()
  if (error) console.error('[db] createReview failed:', error.message)
  return data
}

export async function fetchVendorReviewsDb(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
  return data || []
}

export async function respondToReviewDb(reviewId: string, response: string) {
  if (!supabase) return
  const { error } = await supabase.from('reviews').update({
    vendor_response: response || null,
    vendor_responded_at: response ? new Date().toISOString() : null,
  }).eq('id', reviewId)
  if (error) console.error('[db] respondToReviewDb failed:', error.message)
}

// ─── EARNINGS ───────────────────────────────

export async function createEarning(
  vendorId: string, bookingId: string | null,
  coupleNames: string, eventName: string,
  amount: number, type: 'slot' | 'milestone' | 'final'
) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('earnings')
    .insert({ vendor_id: vendorId, booking_id: bookingId, couple_names: coupleNames, event_name: eventName, amount, type })
    .select()
    .maybeSingle()
  if (error) console.error('[db] createEarning failed:', error.message)
  return data
}

export async function fetchVendorEarningsDb(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('earnings').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
  return data || []
}

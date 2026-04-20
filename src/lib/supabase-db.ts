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
    .single()
  return data
}

export async function upsertVendor(userId: string, profile: VendorProfile, isLive: boolean) {
  if (!supabase) return null
  const { data } = await supabase
    .from('vendors')
    .upsert({
      user_id: userId,
      business_name: profile.businessName,
      category: profile.category,
      city: profile.city,
      area: profile.area,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      email: profile.email,
      description: profile.description,
      years_experience: String(profile.experience),
      team_size: profile.teamSize,
      category_fields: profile.categoryFields || {},
      is_live: isLive,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()
  return data
}

export async function updateVendorFields(userId: string, updates: Partial<VendorProfile>) {
  if (!supabase) return
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.businessName !== undefined) mapped.business_name = updates.businessName
  if (updates.category !== undefined) mapped.category = updates.category
  if (updates.area !== undefined) mapped.area = updates.area
  if (updates.phone !== undefined) mapped.phone = updates.phone
  if (updates.whatsapp !== undefined) mapped.whatsapp = updates.whatsapp
  if (updates.email !== undefined) mapped.email = updates.email
  if (updates.description !== undefined) mapped.description = updates.description
  if (updates.experience !== undefined) mapped.years_experience = String(updates.experience)
  if (updates.teamSize !== undefined) mapped.team_size = updates.teamSize
  if (updates.categoryFields !== undefined) mapped.category_fields = updates.categoryFields

  await supabase.from('vendors').update(mapped).eq('user_id', userId)
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
  if (!supabase) return null
  const { data } = await supabase
    .from('vendor_listings')
    .insert({
      vendor_id: vendorId,
      name: listing.name,
      photos: listing.photos,
      category: listing.category,
      price: listing.price,
      style: listing.style,
      rituals: listing.rituals || [],
      category_fields: listing.categoryFields || {},
      includes: listing.includes,
    })
    .select()
    .single()
  return data
}

export async function updateListingDb(listingDbId: string, listing: VendorListing) {
  if (!supabase) return
  await supabase
    .from('vendor_listings')
    .update({
      name: listing.name,
      photos: listing.photos,
      price: listing.price,
      style: listing.style,
      rituals: listing.rituals || [],
      category_fields: listing.categoryFields || {},
      includes: listing.includes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingDbId)
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
    .single()
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
    .single()
  return data
}

// ─── RITUAL BOARDS ──────────────────────────

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
      })),
  })) as RitualBoard[]
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
    .single()

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

export async function updateBoardCategory(categoryId: string, updates: Partial<Category>) {
  if (!supabase) return
  const mapped: Record<string, unknown> = {}
  if (updates.selectedVendorId !== undefined) mapped.selected_vendor_id = updates.selectedVendorId
  if (updates.shortlistedVendorIds !== undefined) mapped.shortlisted_vendor_ids = updates.shortlistedVendorIds
  if (updates.suggestedVendors !== undefined) mapped.suggested_vendors = updates.suggestedVendors
  if (updates.removed !== undefined) mapped.is_removed = updates.removed

  await supabase.from('board_categories').update(mapped).eq('id', categoryId)
}

export async function updateBoardDatesDb(boardId: string, dateStart: string, dateEnd: string) {
  if (!supabase) return
  await supabase
    .from('ritual_boards')
    .update({ date_start: dateStart, date_end: dateEnd })
    .eq('id', boardId)
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

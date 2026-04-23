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
      whatsapp: profile.whatsapp,
      email: profile.email,
      description: profile.description,
      years_experience: String(profile.experience),
      team_size: profile.teamSize,
      category_fields: profile.categoryFields || {},
      portfolio_photos: profile.portfolioPhotos || [],
      is_live: isLive,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .maybeSingle()
  if (error) console.error('[db] upsertVendor failed:', error.message, error.details, error.hint)
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
  if (updates.portfolioPhotos !== undefined) mapped.portfolio_photos = updates.portfolioPhotos

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
  if (!supabase) { console.error('[db] No supabase client'); return null }
  console.log('[db] insertListing for vendor:', vendorId)
  const { data, error } = await supabase
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
      price: listing.price,
      style: listing.style,
      rituals: listing.rituals || [],
      category_fields: listing.categoryFields || {},
      includes: listing.includes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingDbId)
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

// ─── PHOTO UPLOADS ─────────────────────────

/**
 * Upload a photo to Supabase Storage.
 * Returns the public URL, or null on failure.
 * Path: vendor-photos/{vendorId}/{type}/{timestamp}-{filename}
 */
export async function uploadPhoto(
  vendorId: string,
  file: File,
  type: 'portfolio' | 'listing'
): Promise<string | null> {
  if (!supabase) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${vendorId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('vendor-photos')
    .upload(path, file, {
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
}

/** Couple creates bid requests for all vendors in a category */
export async function createBids(
  coupleId: string, vendorIds: string[], ritualName: string,
  categoryLabel: string, imageUrl: string
): Promise<BidRow[]> {
  if (!supabase) return []
  const rows = vendorIds.map(vid => ({
    couple_id: coupleId,
    vendor_id: vid,
    ritual_name: ritualName,
    category_label: categoryLabel,
    uploaded_image: imageUrl,
  }))
  const { data, error } = await supabase.from('bids').insert(rows).select()
  if (error) console.error('[db] createBids failed:', error.message)
  return (data || []) as BidRow[]
}

/** Fetch bids for a couple */
export async function fetchCoupleBids(coupleId: string): Promise<BidRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('bids').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
  return (data || []) as BidRow[]
}

/** Fetch bids for a vendor */
export async function fetchVendorBidsDb(vendorId: string): Promise<BidRow[]> {
  if (!supabase) return []
  const { data } = await supabase.from('bids').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
  return (data || []) as BidRow[]
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

// ─── MILESTONES ─────────────────────────────

export async function createMilestones(bookingId: string, titles: string[]) {
  if (!supabase) return
  const rows = titles.map((title, i) => ({ booking_id: bookingId, title, sort_order: i }))
  await supabase.from('milestones').insert(rows)
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

// ─── EARNINGS ───────────────────────────────

export async function createEarning(
  vendorId: string, bookingId: string | null,
  coupleNames: string, eventName: string,
  amount: number, type: 'slot' | 'milestone' | 'final'
) {
  if (!supabase) return
  await supabase.from('earnings').insert({ vendor_id: vendorId, booking_id: bookingId, couple_names: coupleNames, event_name: eventName, amount, type })
}

export async function fetchVendorEarningsDb(vendorId: string) {
  if (!supabase) return []
  const { data } = await supabase.from('earnings').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
  return data || []
}

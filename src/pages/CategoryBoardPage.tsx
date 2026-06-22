import { useStore } from '@/lib/store'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { formatINR, bgStyle, getEffectivePrice, getListingTotal, getCategorySelectionTotal } from '@/lib/helpers'
import { Vendor, Design, DecorBrief, SizeUnit } from '@/lib/types'
import { mockVendors, designCategories, getDesignsForCategory, mockDesigns } from '@/lib/mock-data'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import ExploreFilterBar, { buildFilterDefs, applyExploreFilters, type FilterValues } from '@/components/ExploreFilterBar'
import { trackEvent, trackImpressions, selectBidDb, createBids, fetchCoupleBids } from '@/lib/supabase-db'
import { getListingConfig, type SelectField } from '@/lib/vendor-category-config'
import { shouldShowBundlePopup, buildBundleEntries, planBundleApplication } from '@/lib/bundle'

const SETTING_OPTIONS = ['Indoor', 'Outdoor', 'Both']
const COVERAGE_OPTIONS = ['Mandap only', 'Stage only', 'Entrance + Stage', 'Full venue', 'Specific area']
const FLOWER_OPTIONS = ['Fresh flowers', 'Artificial', 'Mix of both', 'No preference']
const SIZE_UNITS: SizeUnit[] = ['ft', 'm', 'cm']

function formatSize(size: DecorBrief['size']): string {
  if (!size.width.trim() && !size.height.trim()) return ''
  const w = size.width.trim() || '?'
  const h = size.height.trim() || '?'
  return `${w} × ${h} ${size.unit}`
}

export default function CategoryBoardPage() {
  const { ritualId, categoryId } = useParams<{ ritualId: string; categoryId: string }>()
  const navigate = useNavigate()

  const {
    ritualBoards, vendors, subscription,
    selectVendor, addToShortlist, removeFromShortlist, toggleLike,
    trialSessions, trialsUsed, requestTrial, markTrialDone, confirmReschedule,
    addDesignAsVendor, setDecorBrief, restoreCategory,
  } = useStore()
  const unlocked = subscription !== 'free'
  const maxTrials = subscription === 'gold' ? 3 : subscription === 'silver' ? 1 : 0

  const [activeTab, setActiveTab] = useState<'visual' | 'compare'>('visual')
  // Customize tab state (Decor only — couples brief vendors on what they want)
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [customImageFile, setCustomImageFile] = useState<File | null>(null)
  const [customBids, setCustomBids] = useState<{ vendorId: string; price: number; note: string }[]>([])
  const [bidsGenerated, setBidsGenerated] = useState(false)
  // Restored from category.decorBrief on first render; debounced save below.
  const EMPTY_BRIEF: DecorBrief = {
    setting: '', coverage: '', size: { width: '', height: '', unit: 'ft' }, flowers: '', notes: '',
  }
  const initialBrief = ritualBoards.find(b => b.id === ritualId)?.categories.find(c => c.id === categoryId)?.decorBrief
  const [customBrief, setCustomBrief] = useState<DecorBrief>(initialBrief ?? EMPTY_BRIEF)
  // If the user previously uploaded a reference photo, restore its URL too
  useEffect(() => {
    if (initialBrief?.referenceImage && !customImage) setCustomImage(initialBrief.referenceImage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [feedTab, setFeedTab] = useState<'explore' | 'suggestions' | 'customize'>('explore')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null)
  const [trialPickerVendorId, setTrialPickerVendorId] = useState<string | null>(null)
  const [trialDate, setTrialDate] = useState('')
  const [trialTime, setTrialTime] = useState('')
  const [priceChange, setPriceChange] = useState<{
    oldName: string; oldPrice: number; newName: string; newPrice: number
  } | null>(null)
  // Shown when the user picks a venue that mandates its in-house decor / catering.
  const [bundlePopup, setBundlePopup] = useState<{
    venueId: string; venueName: string
    bundles: { id: string; name: string; category: string; price: number }[]
  } | null>(null)

  const board = ritualBoards.find((b) => b.id === ritualId)
  const category = board?.categories.find((c) => c.id === categoryId)

  if (!board || !category) {
    return (
      <div className="p-8 text-center text-gray-500">
        Board not found.
        <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-magenta">← Go back</button>
      </div>
    )
  }

  const { _liveMode, _userId, _listingVendorMap } = useStore()
  const impressionsFired = useRef(false)

  const shortlisted = category.shortlistedVendorIds
    .map((id) => vendors[id])
    .filter(Boolean)

  // Explore feed: use live vendors in live mode, mock designs in demo.
  // In demo mode the vendor map already holds scaled prices for every
  // design — read price from there so explore matches the board.
  const allDesigns = _liveMode
    ? Object.values(vendors)
        .filter(v => {
          // In live mode, vendor IDs are listing UUIDs. Match by checking
          // if the vendor's style/packageTier/category matches this board category.
          // The vendor map is keyed by listing ID, and the "code" field contains "Category NNN"
          return v.code.toLowerCase().startsWith(category.label.toLowerCase())
        })
        .map(v => ({ id: v.id, vendorId: v.id, name: v.name, photo: v.photo, style: v.style, price: v.price, rating: v.rating, description: v.packageTier }))
    : getDesignsForCategory(category.label).map(d => {
        const v = vendors[d.id]
        return v ? { ...d, price: v.price } : d
      })
  const exploreDesigns = allDesigns.filter((d) => !category.shortlistedVendorIds.includes(d.id))

  // Category-aware Explore filters. Join each explore item to the vendor that
  // actually carries categoryFields/includes, derive the available filters from
  // those vendors, and apply the current selections.
  const getExploreVendor = (d: { id: string; vendorId: string }): Vendor | undefined => {
    const cands = [vendors[d.id], mockVendors[d.vendorId], vendors[d.vendorId], mockVendors[d.id]]
    return cands.find((c) => c && (c.categoryFields || c.includes)) || cands.find(Boolean)
  }
  const exploreFilterDefs = buildFilterDefs(category.label, exploreDesigns.map(getExploreVendor).filter(Boolean) as Vendor[])
  const filteredExplore = applyExploreFilters(exploreDesigns, filterValues, exploreFilterDefs, getExploreVendor)
  // Customization (couple briefs vendors → bids) is currently only meaningful for Decor.
  // Other categories have predefined listings; couples just pick from the explore feed.
  const supportsCustomize = category.label === 'Decor'

  // If a non-Decor category somehow has 'customize' as the active feed tab, fall back.
  useEffect(() => {
    if (!supportsCustomize && feedTab === 'customize') setFeedTab('explore')
  }, [supportsCustomize, feedTab])

  // Reset Explore filters when switching to a different category.
  useEffect(() => { setFilterValues({}) }, [categoryId])

  // Persist the Decor brief (debounced 600ms after the last edit). Only fires
  // for Decor and only when the brief actually differs from what's in the store.
  useEffect(() => {
    if (!supportsCustomize) return
    const persisted = category.decorBrief
    const hasContent = customBrief.setting || customBrief.coverage || customBrief.flowers
      || customBrief.size.width || customBrief.size.height || customBrief.notes
      || customBrief.referenceImage
    if (!hasContent && !persisted) return
    if (JSON.stringify(customBrief) === JSON.stringify(persisted)) return
    const t = setTimeout(() => {
      setDecorBrief(ritualId!, categoryId!, hasContent ? customBrief : null)
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customBrief, supportsCustomize])

  const suggestedVendors = category.suggestedVendors
    .map((s) => ({ ...(vendors[s.vendorId] || mockVendors[s.vendorId]), suggestedBy: s.suggestedBy }))
    .filter((s) => s.id)

  // Track explore impressions (fire once per page load)
  useEffect(() => {
    if (!_liveMode || impressionsFired.current) return
    const allVendorIds = [...shortlisted.map(v => v.id), ...exploreDesigns.map(d => d.id)]
    const vendorDbIds = allVendorIds
      .map(id => _listingVendorMap[id])
      .filter(Boolean)
    if (vendorDbIds.length > 0) {
      trackImpressions([...new Set(vendorDbIds)], _userId, { category: category.label, ritual: board.name })
      impressionsFired.current = true
    }
  }, [_liveMode, shortlisted, exploreDesigns, _listingVendorMap, _userId, category.label, board.name])

  // Track detail view when a vendor detail is opened
  useEffect(() => {
    if (!_liveMode || !detailVendorId) return
    const vid = _listingVendorMap[detailVendorId]
    if (vid) trackEvent(vid, 'detail_view', _userId, detailVendorId, { category: category.label })
  }, [detailVendorId, _liveMode, _listingVendorMap, _userId, category.label])

  let ritualTotal = 0
  for (const cat of board.categories) {
    if (!cat.removed && cat.selectedVendorId && vendors[cat.selectedVendorId]) {
      const selVendor = vendors[cat.selectedVendorId]
      const sel = getCategorySelectionTotal(selVendor, cat)
      ritualTotal += sel != null ? sel : getListingTotal(selVendor, cat.selectedTierHours)
    }
  }
  const bookingAmount = Math.round(ritualTotal * 0.04)

  function handleSwap(newVendorId: string) {
    const prevId = category!.selectedVendorId
    const prev = prevId ? vendors[prevId] : null
    const next = vendors[newVendorId]

    // Intercept: if this is a venue with a mandatory bundle, show the popup first.
    if (shouldShowBundlePopup(next)) {
      const bundles = buildBundleEntries(next!.bundledListings!, vendors)
      if (bundles.length > 0) {
        setBundlePopup({ venueId: newVendorId, venueName: next!.name || next!.code, bundles })
        return
      }
    }

    doSwap(newVendorId, prev, next, prevId)
  }

  function doSwap(newVendorId: string, prev: Vendor | null, next: Vendor | undefined, prevId: string | null | undefined) {
    selectVendor(ritualId!, categoryId!, newVendorId)
    if (prev && next && prevId !== newVendorId && prev.price !== next.price) {
      setPriceChange({
        oldName: unlocked ? (prev.name || prev.code) : prev.code,
        oldPrice: prev.price,
        newName: unlocked ? (next.name || next.code) : next.code,
        newPrice: next.price,
      })
    }
  }

  function acceptBundle() {
    if (!bundlePopup || !board) return
    const venueVendor = vendors[bundlePopup.venueId]
    const prevId = category!.selectedVendorId
    const prev = prevId ? vendors[prevId] : null
    // Apply the venue swap (with price-change popup wiring intact)
    doSwap(bundlePopup.venueId, prev, venueVendor, prevId)
    // Apply each bundled listing into its matching category on this same ritual
    for (const step of planBundleApplication(board, bundlePopup.bundles)) {
      if (step.needsRestore) restoreCategory(ritualId!, step.categoryId)
      selectVendor(ritualId!, step.categoryId, step.listingId)
    }
    setBundlePopup(null)
  }

  return (
    <div className="flex flex-col h-dvh page-enter">
      {/* Top Bar */}
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <div className="min-w-0">
          <p className="font-semibold text-dark text-[13px] leading-tight truncate">{category.label}</p>
          <p className="text-gray-400 text-[10px] mt-0.5 truncate">
            {board.name} · {shortlisted.length} shortlisted
          </p>
        </div>
      </div>

      {/* Trial Counter */}
      {unlocked && (
        <div className="mx-4 mt-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            Trials: <span className="font-semibold text-dark">{trialsUsed[`${ritualId}-${categoryId}`] || 0}/{maxTrials}</span> used
          </span>
          {subscription === 'silver' && (trialsUsed[`${ritualId}-${categoryId}`] || 0) >= maxTrials && (
            <button onClick={() => useStore.getState().subscribe('gold')} className="text-[9px] text-magenta font-semibold">
              Upgrade to Gold for 2 more →
            </button>
          )}
        </div>
      )}

      {/* Visual / Compare Toggle */}
      <div className="mx-4 mt-3">
        <div className="bg-empty-bg rounded-lg p-[3px] flex">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex-1 py-1.5 text-xs rounded-md transition-all ${activeTab === 'visual' ? 'bg-white font-bold shadow-sm' : 'text-gray-500'}`}
          >
            Visual
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex-1 py-1.5 text-xs rounded-md transition-all ${activeTab === 'compare' ? 'bg-white font-bold shadow-sm' : 'text-gray-500'}`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {!sheetExpanded && (
          <div className="mx-4 mt-3 border border-card-border rounded-[14px] bg-white p-2">
            {shortlisted.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No vendors shortlisted yet. Add from below.
              </div>
            ) : activeTab === 'visual' ? (
              <VisualGrid
                vendors={shortlisted}
                selectedId={category.selectedVendorId}
                unlocked={unlocked}
                onSelect={handleSwap}
                onLike={(id) => toggleLike(id, 'You', 'u-user')}
                onRemove={(id) => removeFromShortlist(ritualId!, categoryId!, id)}
                onTap={(id) => setDetailVendorId(id)}
                trialSessions={trialSessions}
                ritualId={ritualId!}
                categoryId={categoryId!}
                category={category}
              />
            ) : (
              <CompareTable
                vendors={shortlisted}
                selectedId={category.selectedVendorId}
                unlocked={unlocked}
                categoryLabel={category.label}
                onSelect={handleSwap}
              />
            )}
          </div>
        )}

        {/* Trial Actions — below shortlist */}
        {unlocked && shortlisted.length > 0 && !sheetExpanded && (
          <div className="mx-4 mt-2 border border-card-border rounded-xl bg-white p-2.5">
            <p className="text-[10px] font-semibold text-dark mb-2">Request Trials</p>
            <div className="flex flex-col gap-1.5">
              {shortlisted.map((v) => {
                const trialKey = `${ritualId}-${categoryId}-${v.id}`
                const trial = trialSessions[trialKey]
                const status = trial ? trial.status : 'none'
                const exhausted = (trialsUsed[`${ritualId}-${categoryId}`] || 0) >= maxTrials

                return (
                  <div key={v.id} className="py-2 border-b border-card-border/30 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md shrink-0" style={bgStyle(v.photo)} />
                        <span className="text-[10px] text-dark truncate">{unlocked ? v.name : v.code}</span>
                      </div>
                      {status === 'none' && (
                        exhausted ? (
                          <span className="text-[8px] text-gray-400 shrink-0">No trials left</span>
                        ) : (
                          <button
                            onClick={() => { setTrialPickerVendorId(v.id); setTrialDate(''); setTrialTime('') }}
                            className="shrink-0 bg-mustard text-white text-[9px] font-semibold px-2.5 py-1 rounded-md active:scale-[0.97] transition-transform"
                          >
                            Request Trial
                          </button>
                        )
                      )}
                      {status === 'requested' && (
                        <span className="shrink-0 bg-mustard-light text-mustard text-[8px] font-medium px-2 py-0.5 rounded-full">Awaiting vendor</span>
                      )}
                      {status === 'accepted' && (
                        <span className="shrink-0 bg-green-100 text-green-600 text-[8px] font-medium px-2 py-0.5 rounded-full">Accepted</span>
                      )}
                      {status === 'rescheduled' && (
                        <button
                          onClick={() => confirmReschedule(ritualId!, categoryId!, v.id)}
                          className="shrink-0 bg-mustard text-white text-[9px] font-semibold px-2.5 py-1 rounded-md active:scale-[0.97] transition-transform"
                        >
                          Accept new time
                        </button>
                      )}
                      {(status === 'confirmed' || status === 'accepted') && (
                        <button
                          onClick={() => markTrialDone(ritualId!, categoryId!, v.id)}
                          className="shrink-0 bg-green-500 text-white text-[9px] font-semibold px-2.5 py-1 rounded-md active:scale-[0.97] transition-transform"
                        >
                          Mark Done
                        </button>
                      )}
                      {status === 'done' && (
                        <span className="shrink-0 bg-green-100 text-green-600 text-[9px] font-medium px-2 py-0.5 rounded-full">Trial ✓</span>
                      )}
                    </div>
                    {/* Trial details row */}
                    {trial && status !== 'none' && status !== 'done' && (
                      <div className="ml-9 mt-1">
                        {status === 'requested' && (
                          <p className="text-[8px] text-gray-400">Proposed: {trial.scheduledDate} at {trial.scheduledTime}</p>
                        )}
                        {status === 'rescheduled' && (
                          <p className="text-[8px] text-mustard">Vendor proposed: {trial.vendorProposedDate} at {trial.vendorProposedTime}</p>
                        )}
                        {(status === 'accepted' || status === 'confirmed') && (
                          <p className="text-[8px] text-green-600">Scheduled: {trial.scheduledDate} at {trial.scheduledTime}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {subscription === 'silver' && (trialsUsed[`${ritualId}-${categoryId}`] || 0) >= maxTrials && (
              <button onClick={() => useStore.getState().subscribe('gold')} className="w-full mt-2 text-[9px] text-magenta font-semibold text-center">
                Upgrade to Gold for 2 more trials →
              </button>
            )}
          </div>
        )}

        {/* Drag Handle */}
        <div className="flex flex-col items-center py-3 cursor-pointer" onClick={() => setSheetExpanded(!sheetExpanded)}>
          <div className="w-8 h-1 rounded-full bg-gray-300 mb-1" />
          <span className="text-[10px] text-gray-400">
            {sheetExpanded ? 'Show shortlist' : 'Pull up to browse'}
          </span>
        </div>

        {/* Explore / Suggestions Feed */}
        <div className="mx-4 mb-6">
          <div className="flex gap-4 mb-3 border-b border-card-border">
            <button
              onClick={() => setFeedTab('explore')}
              className={`pb-2 text-xs font-medium transition-colors ${feedTab === 'explore' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-400'}`}
            >
              Explore
            </button>
            <button
              onClick={() => setFeedTab('suggestions')}
              className={`pb-2 text-xs font-medium transition-colors relative ${feedTab === 'suggestions' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-400'}`}
            >
              Suggestions
              {suggestedVendors.length > 0 && (
                <span className="absolute -top-1 -right-3 bg-magenta text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {suggestedVendors.length}
                </span>
              )}
            </button>
            {supportsCustomize && (
              <button
                onClick={() => setFeedTab('customize')}
                className={`pb-2 text-xs font-medium transition-colors relative ${feedTab === 'customize' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-400'}`}
              >
                Customize
                {(customImage || customBrief.setting || customBrief.size.width) && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-mustard rounded-full" />}
              </button>
            )}
          </div>

          {feedTab === 'explore' && (
            <>
              {exploreDesigns.length > 0 && (
                <div className="-mx-4 mb-3">
                  <ExploreFilterBar defs={exploreFilterDefs} values={filterValues} onChange={setFilterValues} />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {exploreDesigns.length === 0 ? (
                  <p className="col-span-full text-center text-gray-400 text-xs py-8">All listings are already shortlisted!</p>
                ) : filteredExplore.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-400 text-xs">No listings match your filters.</p>
                    <button onClick={() => setFilterValues({})} className="mt-2 text-magenta text-xs font-medium">Clear filters</button>
                  </div>
                ) : (
                  filteredExplore.map((d) => (
                    <DesignFeedCard
                      key={d.id}
                      design={d}
                      vendorName={unlocked ? (mockVendors[d.vendorId]?.name || d.vendorId) : mockVendors[d.vendorId]?.code || d.vendorId}
                      onAdd={() => { addDesignAsVendor(d); addToShortlist(ritualId!, categoryId!, d.id) }}
                      onTap={() => { addDesignAsVendor(d); setDetailVendorId(d.id) }}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {feedTab === 'suggestions' && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {suggestedVendors.length === 0 ? (
                <p className="col-span-full text-center text-gray-400 text-xs py-8">No suggestions yet. Share this event board from the home screen to get family's picks.</p>
              ) : (
                suggestedVendors.map((v) => {
                  const vendor = vendors[v.id] || v
                  return (
                    <div key={v.id} className="flex flex-col">
                      <span className="text-[10px] text-mustard font-medium mb-1 px-1">Suggested by {v.suggestedBy}</span>
                      <div className="rounded-xl overflow-hidden relative aspect-square cursor-pointer" style={bgStyle(vendor.photo)} onClick={() => setDetailVendorId(v.id)}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="relative z-10 h-full flex flex-col justify-between p-2">
                          <span className="bg-dark/40 text-white text-[9px] px-1.5 py-0.5 rounded-full self-end">★ {vendor.rating}</span>
                          <div>
                            <p className="text-white/80 text-[9px]">{unlocked ? vendor.name : vendor.code}</p>
                            <p className="text-white font-bold text-xs">{formatINR(vendor.price)}{vendor.rateCard ? <span className="font-normal text-[10px]">/hr</span> : ''}</p>
                            <button onClick={(e) => { e.stopPropagation(); addToShortlist(ritualId!, categoryId!, v.id) }} className="mt-1.5 w-full bg-white text-magenta text-[10px] font-semibold py-1.5 rounded-lg active:scale-[0.97] transition-transform">+ Add</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {feedTab === 'customize' && (
            <CustomizeTab
              customImage={customImage}
              brief={customBrief}
              boardName={board.name}
              onBriefChange={(b) => { setCustomBrief(b); if (bidsGenerated) { setBidsGenerated(false); setCustomBids([]) } }}
              bids={customBids}
              bidsGenerated={bidsGenerated}
              unlocked={unlocked}
              onUpload={(file) => {
                const url = URL.createObjectURL(file)
                setCustomImage(url)
                setCustomImageFile(file)
                setCustomBrief({ ...customBrief, referenceImage: url })
                setBidsGenerated(false)
                setCustomBids([])
              }}
              onGetBids={() => {
                // Demo mode: synthesize bids so the user sees instant responses.
                if (!_liveMode) {
                  const categoryVendors = Object.values(mockVendors).filter((v) =>
                    v.id.startsWith(category.label === 'Venue' ? 'v-venue' : 'v-decor')
                  )
                  const bids = categoryVendors.map((v) => ({
                    vendorId: v.id,
                    price: Math.round(v.price * (0.8 + Math.random() * 0.4)),
                    note: ['Can do this exact design', 'Similar setup possible, minor tweaks needed', 'Available with premium materials', 'Custom version ready in 2 weeks'][Math.floor(Math.random() * 4)],
                  })).sort((a, b) => a.price - b.price)
                  setCustomBids(bids)
                  setBidsGenerated(true)
                  return
                }
                // Live mode: persist the brief immediately (flushes any pending debounce),
                // then create real bid rows for vendors in this category. Vendors will
                // see the request in their VendorBids page and submit a real response.
                setDecorBrief(ritualId!, categoryId!, customBrief)
                const candidateVendorDbIds = exploreDesigns
                  .map(d => _listingVendorMap[d.id])
                  .filter((v): v is string => !!v)
                if (candidateVendorDbIds.length === 0 || !_userId) {
                  // No live vendors found — show empty state
                  setCustomBids([])
                  setBidsGenerated(true)
                  return
                }
                createBids(_userId, [...new Set(candidateVendorDbIds)], board.name, category.label, customImage || '', categoryId!)
                  .then(() => fetchCoupleBids(_userId))
                  .then(rows => {
                    // Show only bids relevant to this category (submitted by vendors who've responded)
                    const relevant = rows.filter(b => b.category_id === categoryId && b.status === 'submitted')
                    setCustomBids(relevant.map(b => ({
                      vendorId: b.vendor_id, price: b.bid_price || 0, note: b.bid_note || ''
                    })))
                    setBidsGenerated(true)
                  })
              }}
              onSelectBid={(vendorId, price) => {
                // Persist bid selection to DB if in live mode
                if (_liveMode) {
                  const bid = customBids.find(b => b.vendorId === vendorId)
                  if (bid && (bid as Record<string, unknown>).id) selectBidDb((bid as Record<string, unknown>).id as string)
                }
                // Create a custom vendor entry from the uploaded image
                const id = `custom-${Date.now()}`
                const vendor = vendors[vendorId] || mockVendors[vendorId]
                useStore.getState().addDesignAsVendor({
                  id,
                  vendorId,
                  name: `Custom ${category.label} Design`,
                  photo: customImage!,
                  style: 'Custom',
                  price,
                  rating: vendor?.rating || 4.5,
                  description: `Custom design by ${vendor?.name || 'vendor'}`,
                })
                // Override the photo to be the uploaded image URL
                useStore.setState((s) => ({
                  vendors: {
                    ...s.vendors,
                    [id]: { ...s.vendors[id], photo: `url(${customImage})` },
                  },
                }))
                addToShortlist(ritualId!, categoryId!, id)
                selectVendor(ritualId!, categoryId!, id)
              }}
              vendors={vendors}
            />
          )}
        </div>
      </div>

      {/* Sticky Booking CTA */}
      {ritualTotal > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-card-border px-4 py-2.5 z-20">
          {unlocked ? (
            <Link
              to={`/booking/${ritualId}`}
              className="block w-full py-2.5 rounded-xl bg-magenta text-white text-[11px] font-semibold text-center active:opacity-90 transition-opacity"
            >
              Book {board.name} slots — {formatINR(bookingAmount)}
            </Link>
          ) : (
            <button className="w-full py-2.5 rounded-xl bg-gray-400 text-white text-[11px] font-medium cursor-not-allowed">
              Unlock to book
            </button>
          )}
        </div>
      )}

      {/* Trial Date+Time Picker */}
      {trialPickerVendorId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setTrialPickerVendorId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Schedule a trial</p>
            <p className="text-[11px] text-gray-400 mb-4">Pick a date and time — the vendor will confirm or propose a new slot.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Date</label>
                <input
                  type="date" value={trialDate} onChange={(e) => setTrialDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Time</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((t) => (
                    <button
                      key={t} onClick={() => setTrialTime(t)}
                      className={`py-2 rounded-lg text-[10px] font-medium transition-all ${trialTime === t ? 'bg-mustard text-white' : 'border border-card-border text-gray-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (trialDate && trialTime) {
                  requestTrial(ritualId!, categoryId!, trialPickerVendorId, trialDate, trialTime)
                  setTrialPickerVendorId(null)
                }
              }}
              disabled={!trialDate || !trialTime}
              className={`mt-5 w-full py-2.5 rounded-xl font-semibold text-[13px] active:scale-[0.98] transition-transform ${
                trialDate && trialTime ? 'bg-mustard text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              Send trial request
            </button>
          </div>
        </div>
      )}

      {/* Listing Detail Sheet */}
      {detailVendorId && vendors[detailVendorId] && (
        <ListingDetailSheet
          vendor={vendors[detailVendorId]}
          unlocked={unlocked}
          onClose={() => setDetailVendorId(null)}
          onSwitchListing={(id) => { addDesignAsVendor(mockDesigns.find((d) => d.id === id)!); setDetailVendorId(id) }}
          ritualId={ritualId}
          categoryId={categoryId}
          selectedTierHours={category.selectedTierHours}
        />
      )}

      {/* Price-change toast on swap */}
      {priceChange && (() => {
        const diff = priceChange.newPrice - priceChange.oldPrice
        const isIncrease = diff > 0
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setPriceChange(null)}>
            <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
              <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-dark">{category.label} price updated</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Switched from {priceChange.oldName} to {priceChange.newName}.
              </p>

              <div className="mt-4 rounded-xl border border-card-border bg-empty-bg p-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500 line-through">{priceChange.oldName}</span>
                  <span className="text-gray-500 line-through">{formatINR(priceChange.oldPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-semibold">
                  <span className="text-dark">{priceChange.newName}</span>
                  <span className="text-magenta">{formatINR(priceChange.newPrice)}</span>
                </div>
                <div className={`flex items-center justify-between pt-2 mt-2 border-t border-card-border text-[11px] font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                  <span>{isIncrease ? 'You\'re paying more' : 'You\'re saving'}</span>
                  <span>{isIncrease ? '+' : '−'}{formatINR(Math.abs(diff))}</span>
                </div>
              </div>

              <button
                onClick={() => setPriceChange(null)}
                className="mt-5 w-full py-2.5 rounded-xl bg-magenta text-white text-[13px] font-semibold active:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </div>
          </div>
        )
      })()}

      {/* Mandatory bundle popup — fires when a venue requires its own decor/catering */}
      {bundlePopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBundlePopup(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-dark mb-1">In-house bundle required</p>
            <p className="text-[11px] text-gray-600 mb-3">
              <span className="font-semibold">{bundlePopup.venueName}</span> requires you to use their in-house services. Picking this venue will also add:
            </p>
            <div className="space-y-1.5 mb-4">
              {bundlePopup.bundles.map(b => (
                <div key={b.id} className="flex items-center justify-between text-[12px] bg-empty-bg rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium text-dark truncate">{b.name}</p>
                    <p className="text-[10px] text-gray-400">{b.category}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-magenta shrink-0">{formatINR(b.price)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mb-4">These will replace any existing picks for {bundlePopup.bundles.map(b => b.category).join(' and ')} on {board.name}.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setBundlePopup(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={acceptBundle}
                className="flex-1 py-2.5 rounded-lg bg-magenta text-white text-xs font-semibold active:opacity-90"
              >
                Accept bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function VisualGridCard({
  v, isSelected, unlocked, onSelect, onLike, onRemove, onTap, trialStatus, selectionTotal,
}: {
  v: Vendor; isSelected: boolean; unlocked: boolean;
  onSelect: () => void; onLike: () => void; onRemove: () => void; onTap: () => void;
  trialStatus: 'none' | 'requested' | 'done';
  selectionTotal?: number | null;
}) {
  const likeNames = v.likes.map((l) => l.name)
  const userLiked = v.likes.some((l) => l.userId === 'u-user')

  return (
    <div className="relative rounded-xl overflow-hidden min-h-[130px] cursor-pointer" style={bgStyle(v.photo)} onClick={onTap}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-between p-2 min-h-[130px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {isSelected && <span className="bg-magenta text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">Added</span>}
            {trialStatus === 'done' && <span className="bg-green-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full">Trial ✓</span>}
            {trialStatus === 'requested' && <span className="bg-mustard text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full">Trial Pending</span>}
          </div>
        </div>
        <div>
          <p className="text-white/80 text-[9px]">
            {unlocked ? v.name : v.code} · {v.style}
            {v.category && <> · {v.category}</>}
          </p>
          {selectionTotal != null ? (
            <p className="text-white font-bold text-xs">{formatINR(selectionTotal)}</p>
          ) : (
            <p className="text-white font-bold text-xs">{formatINR(v.price)}{v.rateCard ? <span className="font-normal text-[10px]">/hr</span> : ''}</p>
          )}
          {v.includes && v.includes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {v.includes.slice(0, 3).map((inc, i) => (
                <span key={i} className="bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">{inc}</span>
              ))}
              {v.includes.length > 3 && <span className="text-white/70 text-[8px] pt-0.5">+{v.includes.length - 3} more</span>}
            </div>
          )}
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={(e) => { e.stopPropagation(); onLike() }} className={`px-2 py-1 rounded-md text-[10px] font-medium ${userLiked ? 'bg-magenta text-white' : 'bg-white/25 text-white'}`}>
              ♥{v.likes.length > 0 ? ` ${v.likes.length}` : ''}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onSelect() }} className="bg-white text-magenta px-2 py-1 rounded-md text-[10px] font-medium">
              {isSelected ? 'Added' : 'Add to Board'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="bg-white/20 text-white px-2 py-1 rounded-md text-[10px]">✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VisualGrid({
  vendors, selectedId, unlocked, onSelect, onLike, onRemove, onTap,
  trialSessions, ritualId, categoryId, category,
}: {
  vendors: Vendor[]; selectedId: string | null; unlocked: boolean;
  onSelect: (id: string) => void; onLike: (id: string) => void; onRemove: (id: string) => void; onTap: (id: string) => void;
  trialSessions: Record<string, { status: string }>; ritualId: string; categoryId: string;
  category: import('@/lib/types').Category;
}) {
  return (
    <div className="masonry-grid">
      {vendors.map((v, i) => {
        const trialKey = `${ritualId}-${categoryId}-${v.id}`
        const trial = trialSessions[trialKey]
        const trialStatus: 'none' | 'requested' | 'done' = trial ? (trial.status === 'done' ? 'done' : 'requested') : 'none'
        return (
          <div key={v.id} className={i === 0 && vendors.length > 2 ? 'span-2' : ''}>
            <VisualGridCard
              v={v} isSelected={v.id === selectedId} unlocked={unlocked}
              onSelect={() => onSelect(v.id)} onLike={() => onLike(v.id)} onRemove={() => onRemove(v.id)} onTap={() => onTap(v.id)}
              trialStatus={trialStatus}
              selectionTotal={v.id === selectedId ? getCategorySelectionTotal(v, category) : null}
            />
          </div>
        )
      })}
    </div>
  )
}

function CompareTable({
  vendors, selectedId, unlocked, categoryLabel, onSelect,
}: {
  vendors: Vendor[]; selectedId: string | null; unlocked: boolean; categoryLabel: string; onSelect: (id: string) => void;
}) {
  const [includesExpanded, setIncludesExpanded] = useState(false)
  const listingConfig = getListingConfig(categoryLabel)
  // Flatten all category-specific fields from the listing creation flow
  const categoryFields = listingConfig.steps.flatMap(s => s.fields)
  // Hide rows where every vendor has no value — they add noise without signal.
  const usefulCategoryFields = categoryFields.filter(f =>
    vendors.some(v => {
      const val = v.categoryFields?.[f.key]
      return Array.isArray(val) ? val.length > 0 : !!val
    })
  )
  // Inclusions: one row per inclusion that at least one vendor offers.
  const usefulInclusions = listingConfig.inclusions.filter(inc =>
    vendors.some(v => v.includes?.includes(inc))
  )

  const bestPrice = Math.min(...vendors.map((v) => v.price))
  const bestRating = Math.max(...vendors.map((v) => v.rating))
  const bestLikes = Math.max(...vendors.map((v) => v.likes.length))

  function renderValue(value: string | string[] | undefined | number): string {
    if (value === undefined || value === null || value === '') return '—'
    if (Array.isArray(value)) return value.length > 0 ? value.join(' · ') : '—'
    return String(value)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-card-border">
            <th className="text-left py-2 px-2 w-[110px] text-gray-500 font-medium sticky left-0 bg-white z-10">Parameter</th>
            {vendors.map((v) => (
              <th key={v.id} className="py-2 px-2 text-center min-w-[100px]">
                <span className="font-medium text-dark">{unlocked ? v.name : v.code}</span>
                {v.id === selectedId && <span className="block text-magenta bg-magenta-light text-[9px] rounded-full px-1.5 mt-0.5 mx-auto w-fit">Added</span>}
                {v.likes.length > 0 && <span className="block text-magenta text-[9px] mt-0.5">♥ {v.likes.length} likes</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Generic rows */}
          <tr className="border-b border-card-border/50">
            <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">Price</td>
            {vendors.map((v) => (
              <td key={v.id} className={`py-2 px-2 text-center ${v.price === bestPrice ? 'text-magenta font-bold' : 'text-dark'}`}>{formatINR(v.price)}</td>
            ))}
          </tr>
          <tr className="border-b border-card-border/50">
            <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">Style</td>
            {vendors.map((v) => (
              <td key={v.id} className="py-2 px-2 text-center text-dark">{v.style || '—'}</td>
            ))}
          </tr>
          <tr className="border-b border-card-border/50">
            <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">Area</td>
            {vendors.map((v) => (
              <td key={v.id} className="py-2 px-2 text-center text-dark">{v.area || '—'}</td>
            ))}
          </tr>
          <tr className="border-b border-card-border/50">
            <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">Rating</td>
            {vendors.map((v) => (
              <td key={v.id} className={`py-2 px-2 text-center ${v.rating === bestRating ? 'text-magenta font-bold' : 'text-dark'}`}>★ {v.rating}</td>
            ))}
          </tr>
          <tr className="border-b border-card-border/50">
            <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">Likes</td>
            {vendors.map((v) => (
              <td key={v.id} className={`py-2 px-2 text-center ${v.likes.length === bestLikes && bestLikes > 0 ? 'text-magenta font-bold' : 'text-dark'}`}>♥ {v.likes.length}</td>
            ))}
          </tr>

          {/* Category-specific rows — pulled from the same questions the vendor fills out per listing */}
          {usefulCategoryFields.length > 0 && (
            <tr className="border-b border-card-border">
              <td className="py-2 px-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-white" colSpan={vendors.length + 1}>
                {categoryLabel} details
              </td>
            </tr>
          )}
          {usefulCategoryFields.map(field => (
            <tr key={field.key} className="border-b border-card-border/50">
              <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">{field.label}</td>
              {vendors.map(v => (
                <td key={v.id} className="py-2 px-2 text-center text-dark">
                  {renderValue(v.categoryFields?.[field.key])}
                </td>
              ))}
            </tr>
          ))}

          {/* What's included — collapsible. Default closed to keep the table compact. */}
          {usefulInclusions.length > 0 && (
            <tr className="border-b border-card-border">
              <td className="p-0 sticky left-0 bg-white" colSpan={vendors.length + 1}>
                <button
                  type="button"
                  onClick={() => setIncludesExpanded(v => !v)}
                  className="w-full flex items-center justify-between py-2 px-2 text-[9px] font-semibold text-gray-400 uppercase tracking-wider active:bg-empty-bg"
                >
                  <span>What's included <span className="text-gray-300">({usefulInclusions.length})</span></span>
                  <span className={`text-dark text-[11px] transition-transform ${includesExpanded ? 'rotate-180' : ''}`}>▾</span>
                </button>
              </td>
            </tr>
          )}
          {includesExpanded && usefulInclusions.map(inc => (
            <tr key={inc} className="border-b border-card-border/50">
              <td className="py-2 px-2 text-gray-500 sticky left-0 bg-white">{inc}</td>
              {vendors.map(v => {
                const has = v.includes?.includes(inc)
                return (
                  <td key={v.id} className={`py-2 px-2 text-center ${has ? 'text-green-600' : 'text-gray-300'}`}>
                    {has ? '✓' : '—'}
                  </td>
                )
              })}
            </tr>
          ))}

          <tr>
            <td className="py-2 px-2 sticky left-0 bg-white" />
            {vendors.map((v) => (
              <td key={v.id} className="py-2 px-2 text-center">
                <button onClick={() => onSelect(v.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${v.id === selectedId ? 'bg-magenta text-white' : 'border border-magenta text-magenta'}`}>
                  {v.id === selectedId ? 'Added' : 'Add to Board'}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DesignFeedCard({ design, vendorName, onAdd, onTap }: { design: Design; vendorName: string; onAdd: () => void; onTap?: () => void }) {
  return (
    <div className="rounded-xl overflow-hidden relative aspect-square cursor-pointer" style={bgStyle(design.photo)} onClick={onTap}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-between p-2">
        <div className="flex items-start justify-end">
          <span className="bg-dark/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">★ {design.rating}</span>
        </div>
        <div>
          <p className="text-white font-semibold text-[11px] leading-tight">{design.name}</p>
          <p className="text-white/60 text-[8px] mt-0.5">by {vendorName}</p>
          <p className="text-white/50 text-[8px] mt-0.5">{design.style}</p>
          <p className="text-white font-bold text-xs mt-0.5">{formatINR(design.price)}</p>
          <button onClick={(e) => { e.stopPropagation(); onAdd() }} className="mt-1.5 w-full bg-white text-magenta text-[10px] font-semibold py-1.5 rounded-lg active:scale-[0.97] transition-transform">
            + Add design
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomizeTab({
  customImage, brief, boardName, onBriefChange, bids, bidsGenerated, unlocked,
  onUpload, onGetBids, onSelectBid, vendors,
}: {
  customImage: string | null
  brief: DecorBrief
  boardName: string
  onBriefChange: (next: DecorBrief) => void
  bids: { vendorId: string; price: number; note: string }[]
  bidsGenerated: boolean
  unlocked: boolean
  onUpload: (file: File) => void
  onGetBids: () => void
  onSelectBid: (vendorId: string, price: number) => void
  vendors: Record<string, Vendor>
}) {
  // All fields are required so vendors get a complete brief.
  // The event is implied by the board context.
  const sizeFilled = brief.size.width.trim().length > 0 && brief.size.height.trim().length > 0
  const hasImage = !!customImage
  const hasNotes = brief.notes.trim().length > 0
  const isValid = !!brief.setting && !!brief.coverage && sizeFilled && !!brief.flowers && hasImage && hasNotes

  function patch(p: Partial<DecorBrief>) { onBriefChange({ ...brief, ...p }) }

  // After bids are generated, show a compact brief summary + the bid list.
  if (bidsGenerated) {
    return (
      <div>
        <div className="mb-3 p-3 rounded-xl bg-empty-bg border border-card-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-dark uppercase tracking-wider">Your brief</p>
            <button onClick={() => onBriefChange({ ...brief })} className="text-[10px] text-magenta font-medium">Edit</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BriefChip>{boardName}</BriefChip>
            {brief.setting && <BriefChip>{brief.setting}</BriefChip>}
            {brief.coverage && <BriefChip>{brief.coverage}</BriefChip>}
            {formatSize(brief.size) && <BriefChip>{formatSize(brief.size)}</BriefChip>}
            {brief.flowers && <BriefChip>{brief.flowers}</BriefChip>}
          </div>
          {brief.notes && <p className="text-[10px] text-gray-500 mt-2 italic">"{brief.notes}"</p>}
          {customImage && (
            <img src={customImage} alt="Reference" className="w-full h-24 object-cover rounded-lg mt-2" />
          )}
        </div>

        <p className="text-[11px] font-semibold text-dark mb-2">{bids.length} vendors responded</p>
        <div className="flex flex-col gap-2">
          {bids.map((bid, i) => {
            const vendor = vendors[bid.vendorId] || mockVendors[bid.vendorId]
            if (!vendor) return null
            return (
              <div key={bid.vendorId} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-card-border bg-white">
                <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden" style={bgStyle(vendor.photo)}>
                  {i === 0 && <div className="w-full h-full bg-mustard/20 flex items-center justify-center"><span className="text-mustard text-[8px] font-bold">BEST</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-dark truncate">{unlocked ? vendor.name : vendor.code}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{bid.note}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-magenta">{formatINR(bid.price)}</span>
                    <span className="text-[9px] text-gray-400">★ {vendor.rating}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectBid(bid.vendorId, bid.price)}
                  className="shrink-0 bg-magenta text-white text-[9px] font-semibold px-3 py-1.5 rounded-lg active:scale-[0.97] transition-transform"
                >
                  Select
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Brief form
  return (
    <div className="space-y-4 pb-4">
      <div className="p-3 rounded-xl bg-magenta-light/40 border border-magenta/20">
        <p className="text-[12px] font-semibold text-dark">Have a design in mind for {boardName}?</p>
        <p className="text-[10px] text-gray-500 mt-0.5">Get custom bids from decorators to replicate it.</p>
      </div>

      <BriefField label="Reference photo">
        {customImage ? (
          <div className="rounded-xl overflow-hidden relative">
            <img src={customImage} alt="Reference" className="w-full h-40 object-cover" />
            <label className="absolute bottom-2 right-2 bg-white/90 text-[9px] text-dark font-medium px-2 py-1 rounded-full cursor-pointer">
              Change
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }} />
            </label>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-magenta/30 rounded-xl bg-magenta-light/20 cursor-pointer active:bg-magenta-light/40 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E91E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-[11px] font-medium text-dark mt-1.5">Upload an inspiration photo</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Pinterest, Instagram screenshot, anything</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }} />
          </label>
        )}
      </BriefField>

      <BriefField label="Setting">
        <ChipRow options={SETTING_OPTIONS} selected={brief.setting} onSelect={v => patch({ setting: v })} />
      </BriefField>

      <BriefField label="Coverage">
        <ChipRow options={COVERAGE_OPTIONS} selected={brief.coverage} onSelect={v => patch({ coverage: v })} />
      </BriefField>

      <BriefField label="Approximate size">
        <div className="flex items-center gap-2">
          <input
            type="number" inputMode="decimal" min={0}
            value={brief.size.width}
            onChange={(e) => patch({ size: { ...brief.size, width: e.target.value } })}
            placeholder="Width"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-magenta"
          />
          <span className="text-gray-400 text-[11px]">×</span>
          <input
            type="number" inputMode="decimal" min={0}
            value={brief.size.height}
            onChange={(e) => patch({ size: { ...brief.size, height: e.target.value } })}
            placeholder="Height"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-magenta"
          />
          <select
            value={brief.size.unit}
            onChange={(e) => patch({ size: { ...brief.size, unit: e.target.value as SizeUnit } })}
            className="px-2 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-magenta bg-white"
          >
            {SIZE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </BriefField>

      <BriefField label="Flowers">
        <ChipRow options={FLOWER_OPTIONS} selected={brief.flowers} onSelect={v => patch({ flowers: v })} />
      </BriefField>

      <BriefField label="Anything else?">
        <textarea
          value={brief.notes} onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Specific colors, family customs, things to avoid…"
          maxLength={500} rows={3}
          className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-magenta resize-none"
        />
      </BriefField>

      <button
        onClick={onGetBids}
        disabled={!isValid}
        className={`w-full py-2.5 rounded-xl text-[12px] font-semibold transition-transform ${
          isValid ? 'bg-magenta text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400'
        }`}
      >
        {isValid ? 'Get bids from decorators' : 'Fill all fields above to continue'}
      </button>
    </div>
  )
}

function BriefField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function BriefChip({ children }: { children: React.ReactNode }) {
  return <span className="bg-white text-gray-700 text-[9px] font-medium px-2 py-0.5 rounded-full border border-card-border">{children}</span>
}

function ChipRow({ options, selected, multi, onSelect }: {
  options: string[]
  selected: string | string[]
  multi?: boolean
  onSelect: (value: string) => void
}) {
  const isSelected = (opt: string) =>
    multi ? (selected as string[]).includes(opt) : selected === opt
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt} onClick={() => onSelect(opt)}
          className={`py-1.5 px-2.5 rounded-full text-[10px] font-medium transition-all ${
            isSelected(opt) ? 'bg-magenta text-white' : 'bg-empty-bg text-gray-600 active:bg-magenta-light'
          }`}
        >
          {multi && isSelected(opt) && <span className="mr-0.5">✓ </span>}{opt}
        </button>
      ))}
    </div>
  )
}

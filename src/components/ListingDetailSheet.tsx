import { useState } from 'react'
import { Vendor } from '@/lib/types'
import { useStore } from '@/lib/store'
import { mockVendors, mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle, getEffectivePrice, getRateCardTotal, getMehendiFromPrice, getMehendiSelectionTotal, getMakeupFromPrice, getMakeupSelectionTotal, getSareeDrapingFromPrice, getSareeSelectionTotal, getHairStylingFromPrice, getHairSelectionTotal } from '@/lib/helpers'
import { getListingConfig, PHOTOGRAPHY_RATE_ROLES, MEHENDI_COVERAGES, MEHENDI_DESIGNS, MAKEUP_EVENTS } from '@/lib/vendor-category-config'
import { buildBundleEntries } from '@/lib/bundle'
import VendorPortfolioSheet from './VendorPortfolioSheet'
import MenuPicker from './MenuPicker'

/** Per-look/guest stepper rows (bridal/groom/guest), shared by Saree Draping and
 *  Hair Styling — both standalone listings and Makeup add-on sections. */
function PerLookGuestRows({ p, sel, onUpdate, labels }: {
  p: { bridalPricePerLook?: number; groomPricePerLook?: number; guestPricePerPerson?: number }
  sel: { bridalLooks?: number; groomLooks?: number; guests?: number }
  onUpdate: (patch: { bridalLooks?: number; groomLooks?: number; guests?: number }) => void
  labels: { bridal: string; groom: string; guest: string }
}) {
  const rows: { key: 'bridalLooks' | 'groomLooks' | 'guests'; label: string; price: number; unit: string }[] = []
  if ((p.bridalPricePerLook ?? 0) > 0) rows.push({ key: 'bridalLooks', label: labels.bridal, price: p.bridalPricePerLook!, unit: '/ look' })
  if ((p.groomPricePerLook ?? 0) > 0) rows.push({ key: 'groomLooks', label: labels.groom, price: p.groomPricePerLook!, unit: '/ look' })
  if ((p.guestPricePerPerson ?? 0) > 0) rows.push({ key: 'guests', label: labels.guest, price: p.guestPricePerPerson!, unit: '/ guest' })
  return (
    <div className="space-y-1.5">
      {rows.map(r => {
        const value = sel[r.key] || 0
        return (
          <div key={r.key} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg transition-all ${value > 0 ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-dark truncate">{r.label}</p>
              <p className="text-[10px] text-gray-500">{formatINR(r.price)} {r.unit}</p>
            </div>
            <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
              <button type="button" onClick={() => onUpdate({ [r.key]: Math.max(0, value - 1) })} disabled={value <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
              <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{value}</span>
              <button type="button" onClick={() => onUpdate({ [r.key]: value + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  vendor: Vendor
  onClose: () => void
  unlocked: boolean
  onSwitchListing?: (id: string) => void
  ritualId?: string
  categoryId?: string
  selectedTierHours?: number
}


export default function ListingDetailSheet({ vendor, onClose, unlocked, onSwitchListing, ritualId, categoryId, selectedTierHours }: Props) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  const { _liveMode, _listingVendorMap, vendors: allVendors, selectVendorTier, selectPhotographyTeam, selectMehendiOptions, selectMakeupOptions, selectSareeOptions, selectHairOptions, selectVendor, ritualBoards } = useStore()
  // The board category this sheet was opened from (reactive — re-reads on each render).
  const currentCategory = (ritualId && categoryId)
    ? ritualBoards.find(b => b.id === ritualId)?.categories.find(c => c.id === categoryId)
    : undefined
  // Existing saved team selection (persists across opens, drives the board card price).
  const savedTeam = currentCategory?.photographyTeam
  // Whether this exact vendor is the one currently added to the board for this category.
  const isAddedToBoard = !!currentCategory && currentCategory.selectedVendorId === vendor.id
  // Local mock-up state: how many of each paid room the couple is interested in.
  // Not persisted — only here to visualize the inventory cap + a separate subtotal.
  const [roomSelections, setRoomSelections] = useState<Record<string, number>>({})
  const [roomsExpanded, setRoomsExpanded] = useState(false)
  // Photography rate card: how many people the couple wants per role + shared hours.
  // Not persisted — drives the live subtotal preview only.
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>(() => savedTeam?.counts ?? {})
  const [teamHours, setTeamHours] = useState<number>(() => {
    if (savedTeam) return savedTeam.hours
    const hrs = vendor.availableHours
    if (hrs && hrs.length > 0) return hrs.includes(8) ? 8 : Math.max(...hrs)
    return 8
  })

  // Persist the team selection onto the board category so the card price + ritual
  // total react to it. No-op when opened outside a board (e.g. portfolio browsing).
  function persistTeam(counts: Record<string, number>, hours: number) {
    if (ritualId && categoryId) selectPhotographyTeam(ritualId, categoryId, counts, hours)
  }
  function changeCount(key: string, value: number) {
    const next = { ...teamCounts, [key]: Math.max(0, value) }
    setTeamCounts(next)
    persistTeam(next, teamHours)
  }
  function changeHours(h: number) {
    setTeamHours(h)
    persistTeam(teamCounts, h)
  }
  // Add (select) this photographer for the board category, locking in the current team.
  function addPhotographer() {
    if (!ritualId || !categoryId) return
    persistTeam(teamCounts, teamHours)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Mehendi selection (bridal coverage + design, groom, guests) ──
  const savedMehendi = currentCategory?.mehendiSelection
  const [mehendiSel, setMehendiSel] = useState<{ coverage?: string; design?: string; groom?: boolean; guests?: number }>(
    () => savedMehendi ?? {},
  )
  function updateMehendi(patch: Partial<typeof mehendiSel>) {
    const next = { ...mehendiSel, ...patch }
    setMehendiSel(next)
    if (ritualId && categoryId) selectMehendiOptions(ritualId, categoryId, next)
  }
  function addMehendi() {
    if (!ritualId || !categoryId) return
    selectMehendiOptions(ritualId, categoryId, mehendiSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Makeup selection (looks per bridal event, groom, guests) ──
  const savedMakeup = currentCategory?.makeupSelection
  const [makeupSel, setMakeupSel] = useState<{ eventLooks?: Record<string, number>; groom?: boolean; guests?: number }>(
    () => savedMakeup ?? {},
  )
  function updateMakeup(patch: Partial<typeof makeupSel>) {
    const next = { ...makeupSel, ...patch }
    setMakeupSel(next)
    if (ritualId && categoryId) selectMakeupOptions(ritualId, categoryId, next)
  }
  function setEventLooks(event: string, looks: number) {
    updateMakeup({ eventLooks: { ...makeupSel.eventLooks, [event]: Math.max(0, looks) } })
  }
  function addMakeup() {
    if (!ritualId || !categoryId) return
    selectMakeupOptions(ritualId, categoryId, makeupSel)
    // Makeup artists can also offer saree draping / hairstyling — persist those too.
    if (vendor.sareeDrapingPricing) selectSareeOptions(ritualId, categoryId, sareeSel)
    if (vendor.hairStylingPricing) selectHairOptions(ritualId, categoryId, hairSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Saree Draping selection (bridal looks, groom looks, guests) ──
  const savedSaree = currentCategory?.sareeSelection
  const [sareeSel, setSareeSel] = useState<{ bridalLooks?: number; groomLooks?: number; guests?: number }>(
    () => savedSaree ?? {},
  )
  function updateSaree(patch: Partial<typeof sareeSel>) {
    const next = { ...sareeSel, ...patch }
    setSareeSel(next)
    if (ritualId && categoryId) selectSareeOptions(ritualId, categoryId, next)
  }
  function addSaree() {
    if (!ritualId || !categoryId) return
    selectSareeOptions(ritualId, categoryId, sareeSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Hair Styling selection (bridal looks, groom looks, guests) ──
  const savedHair = currentCategory?.hairSelection
  const [hairSel, setHairSel] = useState<{ bridalLooks?: number; groomLooks?: number; guests?: number }>(
    () => savedHair ?? {},
  )
  function updateHair(patch: Partial<typeof hairSel>) {
    const next = { ...hairSel, ...patch }
    setHairSel(next)
    if (ritualId && categoryId) selectHairOptions(ritualId, categoryId, next)
  }
  function addHair() {
    if (!ritualId || !categoryId) return
    selectHairOptions(ritualId, categoryId, hairSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // In live mode, the vendor object has all the data. In demo mode, look up parent vendor.
  const parentVendor = _liveMode ? null : (() => {
    const design = mockDesigns.find((d) => d.id === vendor.id)
    return design ? mockVendors[design.vendorId] || null : null
  })()

  // In live mode, find sibling listings from the same vendor
  const vendorDbId = _liveMode ? _listingVendorMap[vendor.id] : null
  const siblingListings = _liveMode && vendorDbId
    ? Object.values(allVendors).filter(v => _listingVendorMap[v.id] === vendorDbId)
    : []
  const hasVendorProfile = parentVendor || siblingListings.length > 0

  // Gallery: use only listing photos
  const gallery = (vendor.listingPhotos || []).filter(Boolean)
  const videos = (vendor.listingVideos || []).filter(Boolean)

  const likeNames = vendor.likes.map((l) => l.name)

  // Category-specific fields to display, paired with proper labels from the listing config.
  const categoryFields = vendor.categoryFields || {}
  // Fall back to parsing the category from vendor.code ("Decor 001" → "Decor") for mock
  // data entries that don't carry an explicit category field.
  const derivedCategory = vendor.category || vendor.code?.split(' ')[0]
  const labeledFields: { label: string; value: string }[] = (() => {
    const config = derivedCategory ? getListingConfig(derivedCategory) : null
    if (!config) return []
    const out: { label: string; value: string }[] = []
    for (const step of config.steps) {
      for (const field of step.fields) {
        const raw = categoryFields[field.key]
        if (raw === undefined || raw === null || raw === '') continue
        if (Array.isArray(raw) && raw.length === 0) continue
        let display: string
        if (Array.isArray(raw)) {
          display = raw.join(', ')
        } else if (field.type === 'slider' && field.sliderUnit) {
          display = `${raw} ${field.sliderUnit}`
        } else if (field.type === 'number' && field.numberUnit) {
          display = `${raw} ${field.numberUnit}`
        } else {
          display = raw
        }
        out.push({ label: field.label, value: display })
      }
    }
    return out
  })()

  // Availability check for couple's event dates
  const { onboardingData } = useStore()
  const eventDates = onboardingData?.eventDates || {}
  const allDates = Object.values(eventDates).filter(Boolean).map(d => d!.start)
  const blockedDates = vendor.blockedDates || []
  const conflictDates = allDates.filter(d => blockedDates.includes(d))
  const isAvailable = conflictDates.length === 0

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Hero */}
          <div className="h-44 relative" style={bgStyle(vendor.photo)}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-sm">✕</span>
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-bold text-lg">{unlocked ? vendor.name : vendor.code}</p>
              {parentVendor && (
                <p className="text-white/70 text-[10px] mt-0.5">by {unlocked ? parentVendor.name : parentVendor.code}</p>
              )}
            </div>
          </div>

          <div className="p-4">
            {/* Rating + Likes + Availability */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="bg-dark/10 text-dark text-[11px] font-medium px-2 py-1 rounded-full">★ {vendor.rating}</span>
              <span className="bg-empty-bg text-gray-500 text-[10px] px-2 py-1 rounded-full">{vendor.style}</span>
              {likeNames.length > 0 && (
                <span className="bg-magenta-light text-magenta text-[10px] px-2 py-1 rounded-full">♥ {vendor.likes.length}</span>
              )}
              {vendor.booked && (
                <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-2 py-1 rounded-full">Booked ✓</span>
              )}
              {_liveMode && allDates.length > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                  {isAvailable ? 'Available on your dates' : 'Not available'}
                </span>
              )}
            </div>

            {/* Photography rate card — per-role team picker + shared hours + live total */}
            {vendor.rateCard && (() => {
              const offered = PHOTOGRAPHY_RATE_ROLES.filter(r => (vendor.rateCard![r.key] ?? 0) > 0)
              const baseHourly = offered.reduce((s, r) => s + (vendor.rateCard![r.key] ?? 0), 0)
              const perHourSelected = offered.reduce((s, r) => s + (vendor.rateCard![r.key] ?? 0) * (teamCounts[r.key] || 0), 0)
              const transport = vendor.transportIncluded === false ? (vendor.transportExtra || 0) : 0
              const total = getRateCardTotal(vendor.rateCard, teamCounts, teamHours) + transport
              const anyPicked = perHourSelected > 0
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">{formatINR(baseHourly)} <span className="text-[12px] font-normal text-gray-400">/hr</span></p>
                  <p className="text-[10px] text-gray-400 mb-3">Per-hour rate for 1 of each role · build your team below</p>

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                    <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Build your team</p>
                    <div className="space-y-2">
                      {offered.map(role => {
                        const rate = vendor.rateCard![role.key] ?? 0
                        const count = teamCounts[role.key] || 0
                        return (
                          <div key={role.key} className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-dark truncate">{role.label}</p>
                              <p className="text-[10px] text-gray-500">{formatINR(rate)}/hr each</p>
                            </div>
                            <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                              <button
                                type="button"
                                onClick={() => changeCount(role.key, count - 1)}
                                disabled={count <= 0}
                                className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                              >−</button>
                              <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{count}</span>
                              <button
                                type="button"
                                onClick={() => changeCount(role.key, count + 1)}
                                className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40"
                              >+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Shared hours for the whole booking */}
                    <div className="mt-3 pt-3 border-t border-mustard/20">
                      <p className="text-[12px] font-medium text-dark mb-2">Hours of coverage</p>
                      {vendor.availableHours && vendor.availableHours.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {[...vendor.availableHours].sort((a, b) => a - b).map(h => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => changeHours(h)}
                              className={`py-1.5 px-3.5 rounded-full text-[11px] font-medium transition-all ${teamHours === h ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light/40'}`}
                            >
                              {h} hrs
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                          <button
                            type="button"
                            onClick={() => changeHours(Math.max(1, teamHours - 1))}
                            disabled={teamHours <= 1}
                            className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                          >−</button>
                          <span className="w-10 flex items-center justify-center text-[12px] font-semibold text-dark">{teamHours} hr</span>
                          <button
                            type="button"
                            onClick={() => changeHours(teamHours + 1)}
                            className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40"
                          >+</button>
                        </div>
                      )}
                    </div>

                    {anyPicked && (
                      <div className="mt-3 pt-3 border-t border-mustard/20 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-600">
                          <span>{formatINR(perHourSelected)}/hr × {teamHours} hr</span>
                          <span className="font-medium text-dark">{formatINR(perHourSelected * teamHours)}</span>
                        </div>
                        {transport > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>Transport &amp; logistics</span>
                            <span className="font-medium text-dark">+{formatINR(transport)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                          <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                        </div>
                      </div>
                    )}

                    {/* Add to board — lock in this photographer + team for the category */}
                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addPhotographer}
                        className={`mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : anyPicked ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Mehendi — interactive pricing picker (bridal coverage+design, groom, guests) */}
            {vendor.mehendiPricing && (() => {
              const p = vendor.mehendiPricing
              const fromPrice = getMehendiFromPrice(p)
              const offeredCoverages = MEHENDI_COVERAGES.filter(cov => MEHENDI_DESIGNS.some(d => (p.bridal?.[cov]?.[d] ?? 0) > 0))
              const designsFor = (cov?: string) => cov ? MEHENDI_DESIGNS.filter(d => (p.bridal?.[cov]?.[d] ?? 0) > 0) : []
              const groomOK = (p.groomPrice ?? 0) > 0
              const guestOK = (p.guestPricePerPerson ?? 0) > 0
              const total = getMehendiSelectionTotal(vendor, mehendiSel)
              const guests = mehendiSel.guests || 0
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-2">Pick what you need — your price updates live</p>
                  {p.conesIncluded !== undefined && (
                    <span className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full mb-3 ${p.conesIncluded ? 'bg-green-100 text-green-700' : 'bg-empty-bg text-gray-500'}`}>
                      {p.conesIncluded ? '✓ Mehendi cones included' : 'Mehendi cones not included'}
                    </span>
                  )}

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-3">
                    {/* Bridal coverage + design */}
                    {p.bridalOffered && offeredCoverages.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Bridal mehendi</p>
                        <p className="text-[10px] text-gray-500 mb-1">Coverage</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {offeredCoverages.map(cov => (
                            <button
                              key={cov}
                              type="button"
                              onClick={() => updateMehendi({ coverage: cov, design: (designsFor(cov) as string[]).includes(mehendiSel.design || '') ? mehendiSel.design : undefined })}
                              className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${mehendiSel.coverage === cov ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600'}`}
                            >{cov}</button>
                          ))}
                        </div>
                        {mehendiSel.coverage && (
                          <>
                            <p className="text-[10px] text-gray-500 mb-1">Design</p>
                            <div className="flex flex-wrap gap-1.5">
                              {designsFor(mehendiSel.coverage).map(d => {
                                const price = p.bridal?.[mehendiSel.coverage!]?.[d] ?? 0
                                const sel = mehendiSel.design === d
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => updateMehendi({ design: d })}
                                    className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${sel ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600'}`}
                                  >{d} · {formatINR(price)}</button>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Groom */}
                    {groomOK && (
                      <button
                        type="button"
                        onClick={() => updateMehendi({ groom: !mehendiSel.groom })}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${mehendiSel.groom ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}
                      >
                        <span className="text-[12px] font-medium text-dark">{mehendiSel.groom ? '✓ ' : ''}Groom mehendi</span>
                        <span className="text-[12px] font-semibold text-magenta">{formatINR(p.groomPrice!)}</span>
                      </button>
                    )}

                    {/* Guests */}
                    {guestOK && (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-medium text-dark">Guest mehendi</p>
                          <p className="text-[10px] text-gray-500">{formatINR(p.guestPricePerPerson!)} / guest</p>
                        </div>
                        <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                          <button type="button" onClick={() => updateMehendi({ guests: Math.max(0, guests - 1) })} disabled={guests <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                          <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{guests}</span>
                          <button type="button" onClick={() => updateMehendi({ guests: guests + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                        <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                      </div>
                    )}

                    {/* Add to board */}
                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addMehendi}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Makeup — interactive pricing picker (bridal events, groom, guests) */}
            {vendor.makeupPricing && (() => {
              const p = vendor.makeupPricing
              const fromPrice = getMakeupFromPrice(p)
              const offeredEvents = MAKEUP_EVENTS.filter(e => (p.bridalByEvent?.[e] ?? 0) > 0)
              const groomOK = (p.groomPrice ?? 0) > 0
              const guestOK = (p.guestPricePerPerson ?? 0) > 0
              const makeupTotal = getMakeupSelectionTotal(vendor, makeupSel)
              const guests = makeupSel.guests || 0
              // Optional add-ons (some makeup artists also offer saree draping / hairstyling).
              const sp = vendor.sareeDrapingPricing
              const hp = vendor.hairStylingPricing
              const sareeTotal = sp ? getSareeSelectionTotal(vendor, sareeSel) : null
              const hairTotal = hp ? getHairSelectionTotal(vendor, hairSel) : null
              const total = makeupTotal != null || sareeTotal != null || hairTotal != null
                ? (makeupTotal ?? 0) + (sareeTotal ?? 0) + (hairTotal ?? 0) : null
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many looks per event — your price updates live</p>

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-3">
                    {/* Bridal looks per event */}
                    {offeredEvents.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Bridal makeup · looks per event</p>
                        <div className="space-y-1.5">
                          {offeredEvents.map(e => {
                            const looks = makeupSel.eventLooks?.[e] || 0
                            return (
                              <div key={e} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg transition-all ${looks > 0 ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}>
                                <div className="min-w-0">
                                  <p className="text-[12px] font-medium text-dark truncate">{e}</p>
                                  <p className="text-[10px] text-gray-500">{formatINR(p.bridalByEvent[e])} / look</p>
                                </div>
                                <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                                  <button type="button" onClick={() => setEventLooks(e, looks - 1)} disabled={looks <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                                  <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{looks}</span>
                                  <button type="button" onClick={() => setEventLooks(e, looks + 1)} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Groom */}
                    {groomOK && (
                      <button
                        type="button"
                        onClick={() => updateMakeup({ groom: !makeupSel.groom })}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${makeupSel.groom ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}
                      >
                        <span className="text-[12px] font-medium text-dark">{makeupSel.groom ? '✓ ' : ''}Groom makeup</span>
                        <span className="text-[12px] font-semibold text-magenta">{formatINR(p.groomPrice!)}</span>
                      </button>
                    )}

                    {/* Guests */}
                    {guestOK && (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-medium text-dark">Guest makeup</p>
                          <p className="text-[10px] text-gray-500">{formatINR(p.guestPricePerPerson!)} / guest</p>
                        </div>
                        <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                          <button type="button" onClick={() => updateMakeup({ guests: Math.max(0, guests - 1) })} disabled={guests <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                          <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{guests}</span>
                          <button type="button" onClick={() => updateMakeup({ guests: guests + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
                        </div>
                      </div>
                    )}

                    {/* Saree draping add-on (this makeup artist also offers it) */}
                    {sp && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Saree draping <span className="text-gray-400 font-normal normal-case">· add-on</span></p>
                        <PerLookGuestRows p={sp} sel={sareeSel} onUpdate={updateSaree} labels={{ bridal: 'Bridal saree draping', groom: 'Groom panche draping', guest: 'Guest saree draping' }} />
                      </div>
                    )}

                    {/* Hairstyling add-on (this makeup artist also offers it) */}
                    {hp && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Hairstyling <span className="text-gray-400 font-normal normal-case">· add-on</span></p>
                        <PerLookGuestRows p={hp} sel={hairSel} onUpdate={updateHair} labels={{ bridal: 'Bridal hairstyling', groom: 'Groom hairstyling', guest: 'Guest hairstyling' }} />
                      </div>
                    )}

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                        <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addMakeup}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Saree Draping — standalone listing (a Makeup listing folds saree into its block above) */}
            {vendor.sareeDrapingPricing && !vendor.makeupPricing && (() => {
              const p = vendor.sareeDrapingPricing
              const fromPrice = getSareeDrapingFromPrice(p)
              const total = getSareeSelectionTotal(vendor, sareeSel)
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many you need — your price updates live</p>
                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-2">
                    <PerLookGuestRows p={p} sel={sareeSel} onUpdate={updateSaree} labels={{ bridal: 'Bridal saree draping', groom: 'Groom panche draping', guest: 'Guest saree draping' }} />

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                        <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addSaree}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Hair Styling — standalone listing (a Makeup listing folds hair into its block above) */}
            {vendor.hairStylingPricing && !vendor.makeupPricing && (() => {
              const p = vendor.hairStylingPricing
              const fromPrice = getHairStylingFromPrice(p)
              const total = getHairSelectionTotal(vendor, hairSel)
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many you need — your price updates live</p>
                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-2">
                    <PerLookGuestRows p={p} sel={hairSel} onUpdate={updateHair} labels={{ bridal: 'Bridal hairstyling', groom: 'Groom hairstyling', guest: 'Guest hairstyling' }} />

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                        <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addHair}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Price (non rate-card / non-mehendi / non-makeup / non-saree / non-hair listings) */}
            {!vendor.rateCard && !vendor.mehendiPricing && !vendor.makeupPricing && !vendor.sareeDrapingPricing && !vendor.hairStylingPricing && (
            <p className="text-[20px] font-bold text-magenta">{formatINR(getEffectivePrice(vendor, selectedTierHours))}</p>
            )}
            {!vendor.rateCard && vendor.hourlyPricing && vendor.hourlyPricing.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {selectedTierHours ? `For ${selectedTierHours} hr rental` : `Default rate`}
              </p>
            )}
            {vendor.sizes && vendor.sizes.length > 0 && (
              <p className="text-[10px] text-gray-400">Starting price · varies by size below</p>
            )}
            {/* Transport & logistics sub-line (rate-card listings fold this into their own total) */}
            {!vendor.rateCard && (vendor.transportIncluded === false && vendor.transportExtra && vendor.transportExtra > 0 ? (
              <>
                <p className="text-[11px] text-gray-600 mt-1 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                  Transport &amp; logistics: <span className="font-semibold text-dark">+{formatINR(vendor.transportExtra)}</span>
                </p>
                <p className="text-[12px] font-semibold text-dark mt-1 pt-1 border-t border-card-border/50">
                  Total: <span className="text-magenta">{formatINR(getEffectivePrice(vendor, selectedTierHours) + vendor.transportExtra)}</span>
                </p>
                <div className="mb-3" />
              </>
            ) : vendor.transportIncluded === true ? (
              <>
                <p className="text-[10px] text-green-600 mt-1 pl-3 relative before:content-['•'] before:absolute before:left-0">
                  Transport &amp; logistics included
                </p>
                <div className="mb-3" />
              </>
            ) : (
              <div className="mb-3" />
            ))}

            {/* Size & pricing options — decor designs with size variants */}
            {vendor.sizes && vendor.sizes.length > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Available sizes</p>
                <div className="flex flex-col gap-1.5">
                  {vendor.sizes.map((sz, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-card-border"
                    >
                      <span className="text-[12px] font-medium text-dark">
                        {sz.widthFt} ft × {sz.heightFt} ft
                      </span>
                      <span className="text-[12px] font-semibold text-magenta">{formatINR(sz.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly tier picker — only when vendor has tiers */}
            {vendor.hourlyPricing && vendor.hourlyPricing.length > 0 && ritualId && categoryId && (
              <div className="mb-4 p-2.5 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Pick rental duration</p>
                <div className="flex flex-col gap-1.5">
                  {vendor.hourlyPricing.map((tier) => {
                    const isSelected = selectedTierHours === tier.hours
                    return (
                      <button
                        key={tier.hours}
                        onClick={() => selectVendorTier(ritualId, categoryId, tier.hours)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${isSelected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-mustard' : 'border-gray-300'}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-mustard" />}
                          </span>
                          <span className="text-[12px] font-medium text-dark">{tier.hours} hr rental</span>
                        </span>
                        <span className="text-[12px] font-semibold text-magenta">{formatINR(tier.price)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Style</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.style}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Area</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.area || 'Hyderabad'}</p>
              </div>
              {vendor.capacity && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Capacity</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.capacity} guests</p>
                </div>
              )}
              {vendor.experience && vendor.experience > 0 && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Experience</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.experience} years</p>
                </div>
              )}
              {vendor.teamSize && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Team Size</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.teamSize}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Package</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.packageTier || '—'}</p>
              </div>
            </div>

            {/* Description */}
            {vendor.description && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1">About</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{vendor.description}</p>
              </div>
            )}

            {/* Mandatory bundle prices — for venues that require in-house catering/decor */}
            {vendor.category === 'Venue' && vendor.bundleMandatory && vendor.bundledListings && vendor.bundledListings.length > 0 && (() => {
              const bundles = buildBundleEntries(vendor.bundledListings, allVendors)
              if (bundles.length === 0) return null
              const venuePrice = getEffectivePrice(vendor, selectedTierHours)
              const bundleTotal = bundles.reduce((s, b) => s + b.price, 0)
              return (
                <div className="mb-4 p-3 rounded-xl bg-magenta-light/40 border border-magenta/20">
                  <p className="text-[11px] font-semibold text-dark">Required add-ons</p>
                  <p className="text-[10px] text-gray-600 mb-2">This venue mandates the following in-house services. They're added automatically when you select the venue.</p>
                  <div className="space-y-1.5 mb-2">
                    {bundles.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-dark truncate">{b.name}</p>
                          <p className="text-[9px] text-gray-400">{b.category}</p>
                        </div>
                        <p className="text-[11px] font-semibold text-magenta shrink-0">{formatINR(b.price)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-magenta/20 space-y-0.5">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Venue</span><span>{formatINR(venuePrice)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Required add-ons</span><span>{formatINR(bundleTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-bold text-dark pt-1">
                      <span>Total commitment</span><span className="text-magenta">{formatINR(venuePrice + bundleTotal)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Rituals / events this listing is suitable for */}
            {vendor.rituals && vendor.rituals.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Good for</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.rituals.map((r, i) => (
                    <span key={i} className="bg-magenta-light text-magenta text-[9px] font-medium px-2 py-1 rounded-full">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Category-Specific Details — labeled */}
            {labeledFields.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Details</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-card-border p-3">
                  {labeledFields.map((f, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{f.label}</p>
                      <p className="text-[11px] font-medium text-dark mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Includes */}
            {vendor.includes && vendor.includes.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">What's Included</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.includes.map((item, i) => (
                    <span key={i} className="bg-empty-bg text-gray-600 text-[9px] px-2 py-1 rounded-full">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details (behind paywall) */}
            {unlocked && (vendor.phone || vendor.whatsapp || vendor.email) && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Contact</p>
                {vendor.phone && <p className="text-[11px] text-gray-700">Phone: {vendor.phone}</p>}
                {vendor.whatsapp && <p className="text-[11px] text-gray-700">WhatsApp: {vendor.whatsapp}</p>}
                {vendor.email && <p className="text-[11px] text-gray-700">Email: {vendor.email}</p>}
              </div>
            )}
            {!unlocked && _liveMode && (
              <div className="mb-4 p-3 rounded-xl bg-magenta-light border border-magenta/10 text-center">
                <p className="text-[10px] text-magenta font-medium">Subscribe to see contact details and vendor name</p>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Gallery</p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {gallery.slice(0, 9).map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Videos</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {videos.slice(0, 6).map((src, i) => (
                    <video
                      key={i}
                      src={src}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full aspect-video rounded-lg bg-black object-cover"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Catering menu — interactive picker per section */}
            {vendor.menu && vendor.menu.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Menu</p>
                <MenuPicker menu={vendor.menu} />
              </div>
            )}

            {/* Paid rooms (Venue) — collapsible interactive mock-up */}
            {vendor.paidRooms && vendor.paidRooms.length > 0 && (() => {
              const roomsSubtotal = vendor.paidRooms.reduce((sum, r) => sum + (roomSelections[r.id] || 0) * r.price, 0)
              const totalRoomCount = vendor.paidRooms.reduce((sum, r) => sum + r.count, 0)
              const pickedCount = Object.values(roomSelections).reduce((s, n) => s + n, 0)
              return (
                <div className="mb-4 rounded-xl border border-card-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRoomsExpanded(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 active:bg-empty-bg"
                  >
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-dark">Rooms available</p>
                      <p className="text-[10px] text-gray-500">
                        {vendor.paidRooms.length} {vendor.paidRooms.length === 1 ? 'option' : 'options'} · {totalRoomCount} total {totalRoomCount === 1 ? 'room' : 'rooms'}
                        {pickedCount > 0 && <span className="text-magenta font-medium"> · {pickedCount} picked</span>}
                      </p>
                    </div>
                    <span className={`text-dark text-[12px] transition-transform ${roomsExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {roomsExpanded && (<>
                  <p className="text-[9px] text-gray-400 italic px-3 pb-2">Charged separately — not included in venue price.</p>
                  <div className="space-y-2 px-3 pb-3 border-t border-card-border pt-2">
                    {vendor.paidRooms.map((room) => {
                      const picked = roomSelections[room.id] || 0
                      const atMax = picked >= room.count
                      const atMin = picked <= 0
                      return (
                        <div key={room.id} className="rounded-xl border border-card-border overflow-hidden">
                          {room.photos.length > 0 && (
                            <div className="flex gap-1 overflow-x-auto">
                              {room.photos.slice(0, 6).map((p, i) => (
                                <img key={i} src={p} alt="" className="h-20 w-28 object-cover flex-shrink-0" />
                              ))}
                            </div>
                          )}
                          <div className="p-2.5">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-[12px] font-semibold text-dark">{room.sharing} sharing</p>
                                <p className="text-[10px] text-gray-500">{room.count} {room.count === 1 ? 'room' : 'rooms'} available</p>
                              </div>
                              <p className="text-[12px] font-bold text-magenta">{formatINR(room.price)}</p>
                            </div>
                            {room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {room.amenities.map((a, i) => (
                                  <span key={i} className="bg-empty-bg text-[9px] text-gray-600 px-1.5 py-0.5 rounded-full">{a}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-card-border/50">
                              <span className="text-[10px] text-gray-500">How many?</span>
                              <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setRoomSelections(prev => ({ ...prev, [room.id]: Math.max(0, picked - 1) }))}
                                  disabled={atMin}
                                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                                >−</button>
                                <span className="w-10 flex items-center justify-center text-[12px] font-semibold text-dark">{picked}</span>
                                <button
                                  type="button"
                                  onClick={() => setRoomSelections(prev => ({ ...prev, [room.id]: Math.min(room.count, picked + 1) }))}
                                  disabled={atMax}
                                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                                >+</button>
                              </div>
                            </div>
                            {atMax && <p className="text-[9px] text-mustard mt-1 text-right">Max available</p>}
                            {picked > 0 && (
                              <p className="text-[10px] text-gray-500 mt-1 text-right">
                                {formatINR(room.price)} × {picked} = <span className="font-semibold text-dark">{formatINR(room.price * picked)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {roomsSubtotal > 0 && (
                    <div className="mx-3 mb-3 p-2.5 rounded-xl bg-mustard-light/40 border border-mustard/30 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-dark">Rooms subtotal</span>
                      <span className="text-[14px] font-bold text-magenta">{formatINR(roomsSubtotal)}</span>
                    </div>
                  )}
                  </>)}
                </div>
              )
            })()}

            {/* Liked by */}
            {likeNames.length > 0 && (
              <p className="text-[10px] text-gray-400 mb-4">Liked by {likeNames.join(', ')}</p>
            )}

            {/* View Vendor Portfolio — shows all listings by this vendor */}
            {hasVendorProfile && (
              <button
                onClick={() => setShowPortfolio(true)}
                className="w-full py-2.5 rounded-xl border border-mustard text-mustard text-[11px] font-semibold mb-3 active:bg-mustard-light transition-colors"
              >
                View Vendor Portfolio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Portfolio Sheet */}
      {showPortfolio && (parentVendor || siblingListings.length > 0) && (
        <VendorPortfolioSheet
          vendor={parentVendor || vendor}
          unlocked={unlocked}
          onClose={() => setShowPortfolio(false)}
          onViewListing={(id) => {
            setShowPortfolio(false)
            if (onSwitchListing) onSwitchListing(id)
          }}
          liveListings={siblingListings.length > 0 ? siblingListings : undefined}
        />
      )}
    </>
  )
}

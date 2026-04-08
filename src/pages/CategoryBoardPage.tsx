import { useStore } from '@/lib/store'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { formatINR, bgStyle } from '@/lib/helpers'
import { Vendor, Design } from '@/lib/types'
import { mockVendors, designCategories, getDesignsForCategory, mockDesigns } from '@/lib/mock-data'
import ListingDetailSheet from '@/components/ListingDetailSheet'

export default function CategoryBoardPage() {
  const { ritualId, categoryId } = useParams<{ ritualId: string; categoryId: string }>()
  const navigate = useNavigate()

  const {
    ritualBoards, vendors, subscription,
    selectVendor, addToShortlist, removeFromShortlist, toggleLike,
    trialSessions, trialsUsed, requestTrial, markTrialDone, confirmReschedule,
    addDesignAsVendor,
  } = useStore()
  const unlocked = subscription !== 'free'
  const maxTrials = subscription === 'gold' ? 3 : subscription === 'silver' ? 1 : 0

  const [activeTab, setActiveTab] = useState<'visual' | 'compare'>('visual')
  // Customize tab state
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [customImageFile, setCustomImageFile] = useState<File | null>(null)
  const [customBids, setCustomBids] = useState<{ vendorId: string; price: number; note: string }[]>([])
  const [bidsGenerated, setBidsGenerated] = useState(false)
  const [feedTab, setFeedTab] = useState<'explore' | 'suggestions' | 'customize'>('explore')
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [detailVendorId, setDetailVendorId] = useState<string | null>(null)
  const [trialPickerVendorId, setTrialPickerVendorId] = useState<string | null>(null)
  const [trialDate, setTrialDate] = useState('')
  const [trialTime, setTrialTime] = useState('')

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

  const shortlisted = category.shortlistedVendorIds
    .map((id) => vendors[id])
    .filter(Boolean)

  // All categories use listing-based explore feed
  const allDesigns = getDesignsForCategory(category.label)
  const exploreDesigns = allDesigns.filter((d) => !category.shortlistedVendorIds.includes(d.id))
  const isDesignCategory = true

  const suggestedVendors = category.suggestedVendors
    .map((s) => ({ ...(vendors[s.vendorId] || mockVendors[s.vendorId]), suggestedBy: s.suggestedBy }))
    .filter((s) => s.id)

  let ritualTotal = 0
  for (const cat of board.categories) {
    if (!cat.removed && cat.selectedVendorId && vendors[cat.selectedVendorId]) {
      ritualTotal += vendors[cat.selectedVendorId].price
    }
  }
  const bookingAmount = Math.round(ritualTotal * 0.04)

  return (
    <div className="flex flex-col h-dvh page-enter">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm">←</button>
          <div>
            <span className="font-semibold text-dark text-[13px]">{category.label}</span>
            <span className="text-gray-400 text-[11px] ml-1.5">{board.name}</span>
            <span className="text-gray-400 text-[10px] ml-1.5">({shortlisted.length} shortlisted)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Shared with 4</span>
          <button className="border border-magenta text-magenta px-1.5 py-0.5 rounded-md text-[10px]">Share</button>
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
                onSelect={(id) => selectVendor(ritualId!, categoryId!, id)}
                onLike={(id) => toggleLike(id, 'You', 'u-user')}
                onRemove={(id) => removeFromShortlist(ritualId!, categoryId!, id)}
                onTap={(id) => setDetailVendorId(id)}
                trialSessions={trialSessions}
                ritualId={ritualId!}
                categoryId={categoryId!}
                onRequestTrial={(id) => requestTrial(ritualId!, categoryId!, id)}
                onMarkTrialDone={(id) => markTrialDone(ritualId!, categoryId!, id)}
                trialsExhausted={(trialsUsed[`${ritualId}-${categoryId}`] || 0) >= maxTrials}
                subscription={subscription}
              />
            ) : (
              <CompareTable
                vendors={shortlisted}
                selectedId={category.selectedVendorId}
                unlocked={unlocked}
                onSelect={(id) => selectVendor(ritualId!, categoryId!, id)}
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
                      {(status === 'confirmed' || status === 'accepted') && status !== 'done' && (
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
            {isDesignCategory && (
              <button
                onClick={() => setFeedTab('customize')}
                className={`pb-2 text-xs font-medium transition-colors relative ${feedTab === 'customize' ? 'text-magenta border-b-2 border-magenta' : 'text-gray-400'}`}
              >
                Customize
                {customImage && <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-mustard rounded-full" />}
              </button>
            )}
          </div>

          {feedTab === 'explore' && (
            <div className="grid grid-cols-2 gap-2">
              {exploreDesigns.length === 0 ? (
                <p className="col-span-2 text-center text-gray-400 text-xs py-8">All listings are already shortlisted!</p>
              ) : (
                exploreDesigns.map((d) => (
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
          )}

          {feedTab === 'suggestions' && (
            <div className="grid grid-cols-2 gap-2">
              {suggestedVendors.length === 0 ? (
                <p className="col-span-2 text-center text-gray-400 text-xs py-8">No suggestions yet. Share your board with family to get their picks.</p>
              ) : (
                suggestedVendors.map((v) => {
                  const vendor = vendors[v.id] || v
                  return (
                    <div key={v.id} className="flex flex-col">
                      <span className="text-[10px] text-mustard font-medium mb-1 px-1">Suggested by {v.suggestedBy}</span>
                      <div className="rounded-xl overflow-hidden relative min-h-[120px] cursor-pointer" style={bgStyle(vendor.photo)} onClick={() => setDetailVendorId(v.id)}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="relative z-10 h-full flex flex-col justify-between p-2 min-h-[120px]">
                          <span className="bg-dark/40 text-white text-[9px] px-1.5 py-0.5 rounded-full self-end">★ {vendor.rating}</span>
                          <div>
                            <p className="text-white/80 text-[9px]">{unlocked ? vendor.name : vendor.code}</p>
                            <p className="text-white font-bold text-xs">{formatINR(vendor.price)}</p>
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
              bids={customBids}
              bidsGenerated={bidsGenerated}
              unlocked={unlocked}
              onUpload={(file) => {
                const url = URL.createObjectURL(file)
                setCustomImage(url)
                setCustomImageFile(file)
                setBidsGenerated(false)
                setCustomBids([])
              }}
              onGetBids={() => {
                // Mock: generate bids from vendors in this category
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
              }}
              onSelectBid={(vendorId, price) => {
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
        />
      )}
    </div>
  )
}

// --- Sub-components ---

function VisualGridCard({
  v, isSelected, unlocked, onSelect, onLike, onRemove, onTap,
  trialStatus, onRequestTrial, onMarkTrialDone, trialsExhausted, subscription,
}: {
  v: Vendor; isSelected: boolean; unlocked: boolean;
  onSelect: () => void; onLike: () => void; onRemove: () => void; onTap: () => void;
  trialStatus: 'none' | 'requested' | 'done';
  onRequestTrial: () => void; onMarkTrialDone: () => void;
  trialsExhausted: boolean; subscription: string;
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
          <p className="text-white/80 text-[9px]">{unlocked ? v.name : v.code} · {v.style}</p>
          <p className="text-white font-bold text-xs">{formatINR(v.price)}</p>
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
  trialSessions, ritualId, categoryId, onRequestTrial, onMarkTrialDone, trialsExhausted, subscription,
}: {
  vendors: Vendor[]; selectedId: string | null; unlocked: boolean;
  onSelect: (id: string) => void; onLike: (id: string) => void; onRemove: (id: string) => void; onTap: (id: string) => void;
  trialSessions: Record<string, { status: string }>; ritualId: string; categoryId: string;
  onRequestTrial: (id: string) => void; onMarkTrialDone: (id: string) => void;
  trialsExhausted: boolean; subscription: string;
}) {
  return (
    <div className="masonry-grid">
      {vendors.map((v, i) => {
        const trialKey = `${ritualId}-${categoryId}-${v.id}`
        const trial = trialSessions[trialKey]
        const trialStatus = trial ? trial.status as 'requested' | 'done' : 'none'
        return (
          <div key={v.id} className={i === 0 && vendors.length > 2 ? 'span-2' : ''}>
            <VisualGridCard
              v={v} isSelected={v.id === selectedId} unlocked={unlocked}
              onSelect={() => onSelect(v.id)} onLike={() => onLike(v.id)} onRemove={() => onRemove(v.id)} onTap={() => onTap(v.id)}
              trialStatus={trialStatus} onRequestTrial={() => onRequestTrial(v.id)} onMarkTrialDone={() => onMarkTrialDone(v.id)}
              trialsExhausted={trialsExhausted} subscription={subscription}
            />
          </div>
        )
      })}
    </div>
  )
}

function CompareTable({
  vendors, selectedId, unlocked, onSelect,
}: {
  vendors: Vendor[]; selectedId: string | null; unlocked: boolean; onSelect: (id: string) => void;
}) {
  const params = ['Price', 'Style', 'Capacity', 'Area', 'Rating', 'Likes']
  const bestPrice = Math.min(...vendors.map((v) => v.price))
  const bestRating = Math.max(...vendors.map((v) => v.rating))
  const bestLikes = Math.max(...vendors.map((v) => v.likes.length))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-card-border">
            <th className="text-left py-2 px-2 w-[80px] text-gray-500 font-medium">Parameter</th>
            {vendors.map((v) => (
              <th key={v.id} className="py-2 px-2 text-center">
                <span className="font-medium text-dark">{unlocked ? v.name : v.code}</span>
                {v.id === selectedId && <span className="block text-magenta bg-magenta-light text-[9px] rounded-full px-1.5 mt-0.5 mx-auto w-fit">Added</span>}
                {v.likes.length > 0 && <span className="block text-magenta text-[9px] mt-0.5">♥ {v.likes.length} likes</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param} className="border-b border-card-border/50">
              <td className="py-2 px-2 text-gray-500">{param}</td>
              {vendors.map((v) => {
                let value = ''
                let highlight = false
                switch (param) {
                  case 'Price': value = formatINR(v.price); highlight = v.price === bestPrice; break
                  case 'Style': value = v.style; break
                  case 'Capacity': value = v.capacity ? v.capacity.toString() : '—'; break
                  case 'Area': value = v.area; break
                  case 'Rating': value = `★ ${v.rating}`; highlight = v.rating === bestRating; break
                  case 'Likes': value = `♥ ${v.likes.length}`; highlight = v.likes.length === bestLikes && bestLikes > 0; break
                }
                return <td key={v.id} className={`py-2 px-2 text-center ${highlight ? 'text-magenta font-bold' : 'text-dark'}`}>{value}</td>
              })}
            </tr>
          ))}
          <tr>
            <td className="py-2 px-2" />
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
    <div className="rounded-xl overflow-hidden relative min-h-[150px] cursor-pointer" style={bgStyle(design.photo)} onClick={onTap}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-between p-2 min-h-[150px]">
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
  customImage, bids, bidsGenerated, unlocked, onUpload, onGetBids, onSelectBid, vendors,
}: {
  customImage: string | null
  bids: { vendorId: string; price: number; note: string }[]
  bidsGenerated: boolean
  unlocked: boolean
  onUpload: (file: File) => void
  onGetBids: () => void
  onSelectBid: (vendorId: string, price: number) => void
  vendors: Record<string, Vendor>
}) {
  return (
    <div>
      {/* Upload area */}
      {!customImage ? (
        <label className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-magenta/30 rounded-2xl bg-magenta-light/20 cursor-pointer active:bg-magenta-light/40 transition-colors">
          <div className="w-12 h-12 rounded-full bg-magenta-light flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E91E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-[12px] font-medium text-dark">Upload your design</p>
          <p className="text-[10px] text-gray-400 mt-1">Share an image of the look you want</p>
          <input
            type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }}
          />
        </label>
      ) : (
        <div>
          {/* Uploaded image preview */}
          <div className="rounded-xl overflow-hidden relative mb-3">
            <img src={customImage} alt="Your design" className="w-full h-48 object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] px-2 py-1 rounded-full backdrop-blur-sm">
              Your uploaded design
            </div>
          </div>

          {/* Get bids button */}
          {!bidsGenerated && (
            <button
              onClick={onGetBids}
              className="w-full py-2.5 rounded-xl bg-mustard text-white text-[11px] font-semibold active:scale-[0.98] transition-transform"
            >
              Get bids from vendors
            </button>
          )}

          {/* Bids list */}
          {bidsGenerated && (
            <div>
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
          )}

          {/* Re-upload */}
          <label className="block mt-3 text-center text-[10px] text-gray-400 underline cursor-pointer">
            Upload a different image
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]) }}
            />
          </label>
        </div>
      )}
    </div>
  )
}

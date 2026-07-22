import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchSharedBoard, fetchAllListings, fetchAllLiveVendors, addBoardSuggestion } from '@/lib/supabase-db'
import { expandEventPackageListings } from '@/lib/store'
import { formatINR, formatDateRange, bgStyle } from '@/lib/helpers'

interface SharedCategory {
  id: string
  label: string
  selected_vendor_id: string | null
  shortlisted_vendor_ids: string[]
  suggested_vendors: { vendorId: string; suggestedBy: string }[]
  is_removed: boolean
}

interface SharedBoardData {
  id: string
  name: string
  date_start: string | null
  date_end: string | null
  categories: SharedCategory[]
}

interface ListingLite {
  id: string
  name: string
  category: string
  price: number
  style: string
  photo: string
  vendorName: string  // anonymized to a code for non-owners
}

const NAME_STORAGE_KEY = 'pellikart_suggester_name'

export default function SharedBoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<SharedBoardData | null>(null)
  const [listings, setListings] = useState<ListingLite[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pickCategory, setPickCategory] = useState<SharedCategory | null>(null)
  const [suggesterName, setSuggesterName] = useState(() => localStorage.getItem(NAME_STORAGE_KEY) || '')
  const [namePromptVendor, setNamePromptVendor] = useState<ListingLite | null>(null)
  const [tempName, setTempName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!boardId) return
    let cancelled = false
    ;(async () => {
      const [data, allListings, allVendors] = await Promise.all([
        fetchSharedBoard(boardId),
        fetchAllListings(),
        fetchAllLiveVendors(),
      ])
      if (cancelled) return
      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      // Anonymize vendor names to codes (recipient is unauthenticated/not the owner)
      const vendorById: Record<string, Record<string, unknown>> = {}
      for (const v of allVendors) vendorById[(v as Record<string, unknown>).id as string] = v as Record<string, unknown>
      // Expand Photography event packages so a shared board's per-package picks resolve.
      const mapped: ListingLite[] = expandEventPackageListings(allListings as Record<string, unknown>[]).map((l, i) => {
        const row = l as Record<string, unknown>
        const vendorRow = vendorById[row.vendor_id as string]
        const photos = (row.photos as string[]) || []
        const code = `V${String(i + 1).padStart(3, '0')}`
        return {
          id: row.id as string,
          name: (row.name as string) || '',
          category: (row.category as string) || '',
          price: (row.price as number) || 0,
          style: (row.style as string) || '',
          photo: photos[(row.cover_photo_index as number) || 0] || photos[0] || '',
          vendorName: vendorRow ? code : code,
        }
      })
      setBoard({
        id: data.board.id,
        name: data.board.name,
        date_start: data.board.date_start,
        date_end: data.board.date_end,
        categories: (data.categories || []).map((c) => ({
          id: c.id,
          label: c.label,
          selected_vendor_id: c.selected_vendor_id,
          shortlisted_vendor_ids: c.shortlisted_vendor_ids || [],
          suggested_vendors: c.suggested_vendors || [],
          is_removed: !!c.is_removed,
        })),
      })
      setListings(mapped)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [boardId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function listingById(id: string | null): ListingLite | undefined {
    if (!id) return undefined
    return listings.find(l => l.id === id)
  }

  async function submitSuggestion(name: string, vendor: ListingLite, category: SharedCategory) {
    setSubmitting(true)
    const cleanName = name.trim()
    localStorage.setItem(NAME_STORAGE_KEY, cleanName)
    setSuggesterName(cleanName)
    const result = await addBoardSuggestion(category.id, vendor.id, cleanName)
    setSubmitting(false)
    if (result.ok) {
      // Optimistically update local state so the user sees their suggestion stick
      setBoard(b => b ? {
        ...b,
        categories: b.categories.map(c =>
          c.id === category.id
            ? { ...c, suggested_vendors: [...c.suggested_vendors, { vendorId: vendor.id, suggestedBy: cleanName }] }
            : c
        ),
      } : b)
      showToast(`Suggested ${vendor.name} for ${category.label}`)
    } else {
      showToast('Could not send suggestion — try again')
    }
  }

  function onSuggestClick(vendor: ListingLite, category: SharedCategory) {
    if (suggesterName) {
      submitSuggestion(suggesterName, vendor, category)
    } else {
      setNamePromptVendor(vendor)
      setTempName('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Pellikart" className="w-14 h-14 rounded-xl object-cover animate-pulse" />
          <p className="text-[13px] text-gray-400">Loading board...</p>
        </div>
      </div>
    )
  }

  if (notFound || !board) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white p-6 text-center">
        <div>
          <p className="text-2xl mb-2">😔</p>
          <p className="text-[14px] font-semibold text-dark">Board not found</p>
          <p className="text-[11px] text-gray-400 mt-1">This link may have expired or been removed.</p>
          <a href="/" className="inline-block mt-5 text-[12px] text-magenta font-medium">Visit Pellikart →</a>
        </div>
      </div>
    )
  }

  const activeCategories = board.categories.filter(c => !c.is_removed)
  const filled = activeCategories.filter(c => c.selected_vendor_id && listingById(c.selected_vendor_id))
  const total = filled.reduce((s, c) => s + (listingById(c.selected_vendor_id!)?.price || 0), 0)
  const dateStr = formatDateRange(board.date_start || undefined, board.date_end || undefined)

  // When the modal is open, filter listings to that category
  const modalListings = pickCategory
    ? listings.filter(l => l.category === pickCategory.label)
    : []

  return (
    <div className="min-h-dvh bg-white pb-12 page-enter">
      {/* Header */}
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border sticky top-0 z-20">
        <p className="text-[9px] text-magenta uppercase tracking-[2px] font-semibold">Shared via Pellikart</p>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-[16px] font-bold text-dark">{board.name}</p>
          {dateStr && <p className="text-[10px] text-gray-500">{dateStr}</p>}
        </div>
      </div>

      {/* Hero intro */}
      <div className="mx-4 mt-3 mb-3 p-3 rounded-xl bg-magenta-light border border-magenta/20">
        <p className="text-[12px] font-semibold text-dark">Help them plan their wedding</p>
        <p className="text-[10px] text-gray-600 mt-1">
          Browse their picks below. Tap any category to suggest a vendor — they'll see it in their Suggestions feed.
        </p>
      </div>

      {/* Totals */}
      <div className="mx-4 mb-3 flex gap-2">
        <div className="flex-1 p-2.5 rounded-xl bg-empty-bg border border-card-border text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Filled</p>
          <p className="text-[13px] font-bold text-dark mt-0.5">{filled.length}/{activeCategories.length}</p>
        </div>
        <div className="flex-1 p-2.5 rounded-xl bg-empty-bg border border-card-border text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Picked so far</p>
          <p className="text-[13px] font-bold text-magenta mt-0.5">{formatINR(total)}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 space-y-2">
        {activeCategories.map(cat => {
          const selected = listingById(cat.selected_vendor_id)
          const suggestionCount = cat.suggested_vendors.length
          return (
            <button
              key={cat.id}
              onClick={() => setPickCategory(cat)}
              className="w-full text-left p-3 rounded-xl border border-card-border bg-white active:bg-empty-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-empty-bg" style={selected ? bgStyle(selected.photo) : undefined}>
                  {!selected && <div className="w-full h-full flex items-center justify-center"><span className="text-magenta">+</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-dark">{cat.label}</p>
                  {selected ? (
                    <>
                      <p className="text-[10px] text-gray-500 truncate">{selected.style}</p>
                      <p className="text-[11px] font-bold text-mustard mt-0.5">{formatINR(selected.price)}</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-400">No pick yet — your suggestion will help</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {suggestionCount > 0 && (
                    <span className="inline-block bg-mustard-light text-mustard text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-1">
                      {suggestionCount} suggested
                    </span>
                  )}
                  <p className="text-[10px] text-magenta font-medium">Suggest →</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-6 px-6">
        New to Pellikart? <a href="/" className="text-magenta font-medium">Create your own wedding board</a>
      </p>

      {/* Category browse modal */}
      {pickCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setPickCategory(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b border-card-border">
              <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-bold text-dark">{pickCategory.label}</p>
              <p className="text-[10px] text-gray-400">Tap "Suggest" on any vendor to send it to them.</p>
            </div>

            {pickCategory.suggested_vendors.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Already suggested</p>
                <div className="flex flex-wrap gap-1.5">
                  {pickCategory.suggested_vendors.map((s, i) => (
                    <span key={i} className="bg-mustard-light text-mustard text-[9px] font-medium px-2 py-0.5 rounded-full">
                      by {s.suggestedBy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 pt-3 space-y-2">
              {modalListings.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-12">No {pickCategory.label.toLowerCase()} vendors available right now.</p>
              ) : (
                modalListings.map(v => {
                  const alreadyByMe = !!suggesterName && pickCategory.suggested_vendors.some(s => s.vendorId === v.id && s.suggestedBy === suggesterName)
                  return (
                    <div key={v.id} className="flex gap-3 p-2.5 rounded-xl border border-card-border">
                      <div className="w-16 h-16 rounded-lg shrink-0" style={bgStyle(v.photo)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-dark truncate">{v.name}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{v.style}</p>
                        <p className="text-[11px] font-bold text-mustard mt-0.5">{formatINR(v.price)}</p>
                      </div>
                      <button
                        onClick={() => !alreadyByMe && !submitting && onSuggestClick(v, pickCategory)}
                        disabled={alreadyByMe || submitting}
                        className={`shrink-0 self-center text-[10px] font-medium px-3 py-1.5 rounded-lg ${
                          alreadyByMe ? 'bg-green-100 text-green-600' : 'bg-magenta text-white active:opacity-80'
                        }`}
                      >
                        {alreadyByMe ? 'Sent ✓' : 'Suggest'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Name prompt (first-time suggesters) */}
      {namePromptVendor && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <p className="text-[14px] font-bold text-dark mb-1">What's your name?</p>
            <p className="text-[11px] text-gray-500 mb-3">So they know who suggested it.</p>
            <input
              autoFocus
              type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Priya"
              maxLength={40}
              className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-magenta mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setNamePromptVendor(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium">Cancel</button>
              <button
                onClick={() => {
                  const n = tempName.trim()
                  if (!n || !namePromptVendor || !pickCategory) return
                  const vendor = namePromptVendor
                  setNamePromptVendor(null)
                  submitSuggestion(n, vendor, pickCategory)
                }}
                disabled={!tempName.trim()}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold ${tempName.trim() ? 'bg-magenta text-white active:opacity-80' : 'bg-gray-200 text-gray-400'}`}
              >
                Suggest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-dark text-white text-[11px] px-4 py-2.5 rounded-full shadow-lg max-w-[90%] text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

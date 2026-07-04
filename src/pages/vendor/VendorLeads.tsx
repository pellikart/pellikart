import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatDate, formatINR } from '@/lib/helpers'
import type { VendorLead } from '@/lib/vendor-types'

/**
 * Leads: couples who added one of this vendor's listings to their board. For a
 * per-plate venue, each lead shows the plate package the couple picked so the
 * vendor knows exactly what the client wants. Couples stay anonymous until they
 * request a trial or book — no contact here by design.
 */
export default function VendorLeads() {
  const navigate = useNavigate()
  const { vendorLeads } = useVendorStore()

  // Group leads by the listing they picked.
  const byListing = new Map<string, VendorLead[]>()
  for (const lead of vendorLeads) {
    const arr = byListing.get(lead.listingId) || []
    arr.push(lead)
    byListing.set(lead.listingId, arr)
  }
  const groups = [...byListing.values()]

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <div>
          <p className="text-[14px] font-bold text-dark">Leads</p>
          <p className="text-[10px] text-gray-400">Couples who picked your listings</p>
        </div>
      </div>

      <div className="px-4 mt-3 pb-8">
        {vendorLeads.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-semibold text-dark">No leads yet</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[260px] mx-auto">
              When a couple adds one of your listings to their board, it shows up here — including which package they picked.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-gray-400 mb-3">
              {vendorLeads.length} {vendorLeads.length === 1 ? 'couple has' : 'couples have'} picked your listings. Couples stay anonymous until they request a trial or book.
            </p>
            {groups.map((leads) => (
              <div key={leads[0].listingId} className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-[12px] font-semibold text-dark truncate">{leads[0].listingName}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{leads.length} {leads.length === 1 ? 'lead' : 'leads'}</span>
                </div>
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-3 rounded-xl border border-card-border bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-dark">
                            {lead.boardName}
                            {lead.categoryLabel && lead.categoryLabel !== lead.boardName && (
                              <span className="text-[10px] text-gray-400 font-normal"> · {lead.categoryLabel}</span>
                            )}
                          </p>
                          {lead.eventDate && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Event · {formatDate(lead.eventDate)}</p>
                          )}
                        </div>
                        {lead.packageName ? (
                          <div className="text-right shrink-0">
                            <span className="inline-block bg-mustard-light text-mustard text-[10px] font-semibold px-2 py-0.5 rounded-full">{lead.packageName}</span>
                            {lead.packagePrice ? (
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatINR(lead.packagePrice)}/plate</p>
                            ) : null}
                          </div>
                        ) : lead.tierHours ? (
                          <span className="inline-block bg-mustard-light text-mustard text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">{lead.tierHours} hr rental</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

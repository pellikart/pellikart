import { MEHENDI_COVERAGES, MEHENDI_DESIGNS, type MehendiPricing } from '@/lib/vendor-category-config'

interface Props {
  value: MehendiPricing
  onChange: (v: MehendiPricing) => void
}

/**
 * Vendor-facing editor for Mehendi pricing — used both in onboarding and on the
 * edit-pricing screen. Bridal is a coverage×design price matrix; groom and guest
 * mehendi are flat prices.
 */
export default function MehendiPricingEditor({ value, onChange }: Props) {
  function setBridalOffered(offered: boolean) {
    onChange({ ...value, bridalOffered: offered })
  }
  function setBridalPrice(coverage: string, design: string, price: number) {
    const cov = { ...(value.bridal[coverage] || {}), [design]: price }
    onChange({ ...value, bridal: { ...value.bridal, [coverage]: cov } })
  }
  function priceOf(coverage: string, design: string): number {
    return value.bridal[coverage]?.[design] ?? 0
  }

  return (
    <div className="space-y-5">
      {/* Bridal Mehendi? */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-2">Do you offer Bridal Mehendi?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBridalOffered(true)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${value.bridalOffered ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
          >Yes</button>
          <button
            type="button"
            onClick={() => setBridalOffered(false)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${!value.bridalOffered ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
          >No</button>
        </div>
      </div>

      {/* Coverage × design price matrix */}
      {value.bridalOffered && (
        <div>
          <label className="text-[13px] font-semibold text-dark block mb-1">Bridal coverage &amp; design pricing</label>
          <p className="text-[10px] text-gray-400 mb-3">Set a price for each design you offer per coverage. Leave blank if you don't offer it.</p>
          <div className="space-y-3">
            {MEHENDI_COVERAGES.map(coverage => (
              <div key={coverage} className="rounded-xl border border-card-border p-3">
                <p className="text-[12px] font-semibold text-dark mb-2">{coverage}</p>
                <div className="space-y-2">
                  {MEHENDI_DESIGNS.map(design => (
                    <div key={design} className="flex items-center justify-between gap-3">
                      <span className="text-[12px] text-dark">{design}</span>
                      <div className="relative w-[130px] shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                        <input
                          type="number" min={0} step={500}
                          value={priceOf(coverage, design) || ''}
                          onChange={(e) => setBridalPrice(coverage, design, Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groom mehendi */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-1">Groom Mehendi</label>
        <p className="text-[10px] text-gray-400 mb-2">Flat price. Leave blank if not offered.</p>
        <div className="relative w-[160px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
          <input
            type="number" min={0} step={500}
            value={value.groomPrice || ''}
            onChange={(e) => onChange({ ...value, groomPrice: Math.max(0, parseInt(e.target.value) || 0) })}
            placeholder="0"
            className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Guest mehendi */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-1">Guest Mehendi</label>
        <p className="text-[10px] text-gray-400 mb-2">Price per guest. Leave blank if not offered.</p>
        <div className="relative w-[160px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
          <input
            type="number" min={0} step={100}
            value={value.guestPricePerPerson || ''}
            onChange={(e) => onChange({ ...value, guestPricePerPerson: Math.max(0, parseInt(e.target.value) || 0) })}
            placeholder="0"
            className="w-full pl-6 pr-12 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">/ guest</span>
        </div>
      </div>

      {/* Mehendi cones (product) */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-2">Mehendi Cones (Product) included?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, conesIncluded: true })}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${value.conesIncluded === true ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
          >Yes</button>
          <button
            type="button"
            onClick={() => onChange({ ...value, conesIncluded: false })}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${value.conesIncluded === false ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
          >No</button>
        </div>
      </div>
    </div>
  )
}

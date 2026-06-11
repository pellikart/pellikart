import { MAKEUP_EVENTS, type MakeupPricing } from '@/lib/vendor-category-config'

interface Props {
  value: MakeupPricing
  onChange: (v: MakeupPricing) => void
}

/**
 * Vendor-facing editor for Makeup pricing — used in onboarding and the
 * edit-pricing screen. Bridal makeup is priced per look, per event; groom is a
 * flat per-look price; guest is per guest.
 */
export default function MakeupPricingEditor({ value, onChange }: Props) {
  function setEventPrice(event: string, price: number) {
    onChange({ ...value, bridalByEvent: { ...value.bridalByEvent, [event]: price } })
  }

  return (
    <div className="space-y-5">
      {/* Bridal makeup — per event, per look */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-1">Bridal makeup — price per look</label>
        <p className="text-[10px] text-gray-400 mb-3">Set your per-look price for each look category. Leave blank if you don't offer it.</p>
        <div className="rounded-xl border border-card-border divide-y divide-card-border">
          {MAKEUP_EVENTS.map(event => (
            <div key={event} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-[12px] text-dark flex-1 min-w-0 leading-tight">{event}</span>
              <div className="relative w-[120px] shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                <input
                  type="number" min={0} step={500}
                  value={value.bridalByEvent[event] || ''}
                  onChange={(e) => setEventPrice(event, Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full pl-6 pr-12 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">/ look</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Groom makeup */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-1">Groom Makeup</label>
        <p className="text-[10px] text-gray-400 mb-2">Price per look. Leave blank if not offered.</p>
        <div className="relative w-[160px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
          <input
            type="number" min={0} step={500}
            value={value.groomPrice || ''}
            onChange={(e) => onChange({ ...value, groomPrice: Math.max(0, parseInt(e.target.value) || 0) })}
            placeholder="0"
            className="w-full pl-6 pr-12 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">/ look</span>
        </div>
      </div>

      {/* Guest makeup */}
      <div>
        <label className="text-[13px] font-semibold text-dark block mb-1">Guest Makeup</label>
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
    </div>
  )
}

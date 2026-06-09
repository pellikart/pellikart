import { type SareeDrapingPricing } from '@/lib/vendor-category-config'

interface Props {
  value: SareeDrapingPricing
  onChange: (v: SareeDrapingPricing) => void
}

/** A labelled ₹ input with a trailing unit (e.g. "/ look", "/ guest"). */
function PriceField({ label, hint, unit, val, step, onChange }: {
  label: string; hint: string; unit: string; val: number | undefined; step: number; onChange: (n: number) => void
}) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-dark block mb-1">{label}</label>
      <p className="text-[10px] text-gray-400 mb-2">{hint}</p>
      <div className="relative w-[180px]">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
        <input
          type="number" min={0} step={step}
          value={val || ''}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
          className="w-full pl-6 pr-14 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">{unit}</span>
      </div>
    </div>
  )
}

/**
 * Vendor-facing editor for Saree Draping pricing — used in onboarding and the
 * edit-pricing screen. Bridal + groom (panche) are priced per look; guest per guest.
 */
export default function SareeDrapingPricingEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <PriceField
        label="Bridal Saree draping" hint="Price per look. Leave blank if not offered." unit="/ look" step={500}
        val={value.bridalPricePerLook} onChange={(n) => onChange({ ...value, bridalPricePerLook: n })}
      />
      <PriceField
        label="Groom Panche draping" hint="Price per look. Leave blank if not offered." unit="/ look" step={500}
        val={value.groomPricePerLook} onChange={(n) => onChange({ ...value, groomPricePerLook: n })}
      />
      <PriceField
        label="Guest Saree draping" hint="Price per guest. Leave blank if not offered." unit="/ guest" step={100}
        val={value.guestPricePerPerson} onChange={(n) => onChange({ ...value, guestPricePerPerson: n })}
      />
    </div>
  )
}

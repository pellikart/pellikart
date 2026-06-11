import { MAKEUP_ADDONS } from '@/lib/vendor-category-config'

interface Props {
  value: Record<string, number>
  onChange: (v: Record<string, number>) => void
}

/**
 * Vendor-facing editor for makeup add-ons (hair extensions, false lashes, etc.) —
 * a flat price per add-on. Used in onboarding and the edit-pricing screen.
 */
export default function MakeupAddonsEditor({ value, onChange }: Props) {
  return (
    <div className="rounded-xl border border-card-border divide-y divide-card-border">
      {MAKEUP_ADDONS.map(addon => (
        <div key={addon} className="flex items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-[12px] text-dark flex-1 min-w-0 leading-tight">{addon}</span>
          <div className="relative w-[120px] shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
            <input
              type="number" min={0} step={100}
              value={value[addon] || ''}
              onChange={(e) => onChange({ ...value, [addon]: Math.max(0, parseInt(e.target.value) || 0) })}
              placeholder="0"
              className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

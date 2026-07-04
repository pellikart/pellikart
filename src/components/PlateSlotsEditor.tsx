import TimePicker from './TimePicker'
import type { PlateSlot } from '@/lib/vendor-types'

interface Props {
  value: PlateSlot[]
  onChange: (next: PlateSlot[]) => void
}

/**
 * Venue-level service time slots (Morning, Evening, …), shared across all of a
 * venue's plate packages. Vendors name each slot and set its from/to time.
 */
export default function PlateSlotsEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<PlateSlot>) =>
    onChange(value.map((s, si) => (si === i ? { ...s, ...patch } : s)))
  const remove = (i: number) => onChange(value.filter((_, si) => si !== i))
  const add = () =>
    onChange([...value, { id: `sl-${Date.now()}-${value.length}`, name: '', from: '', to: '' }])

  return (
    <div>
      <p className="text-[10px] text-gray-500 mb-1.5">
        Time slots <span className="text-gray-400">(optional · apply to all packages)</span>
      </p>
      {value.length > 0 && (
        <div className="space-y-1.5 mb-1.5">
          {value.map((slot, si) => (
            <div key={slot.id} className="rounded-lg border border-card-border p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slot.name}
                  onChange={(e) => update(si, { name: e.target.value })}
                  placeholder="e.g. Morning"
                  className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                />
                <button
                  type="button"
                  onClick={() => remove(si)}
                  aria-label="Remove slot"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
                >×</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500 w-8 shrink-0">From</span>
                <TimePicker value={slot.from} onChange={(val) => update(si, { from: val })} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500 w-8 shrink-0">To</span>
                <TimePicker value={slot.to} onChange={(val) => update(si, { to: val })} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={add}
        className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-empty-bg text-dark border border-card-border active:bg-mustard-light/40"
      >
        + Add slot
      </button>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { formatINR } from '@/lib/helpers'
import type { SizePrice } from '@/lib/vendor-types'

/** One size row with local string state so number inputs stay responsive
 *  (mirrors the SizeRow inside DesignsEditor). */
function SizeRow({ row, onChange, onRemove }: { row: SizePrice; onChange: (next: SizePrice) => void; onRemove: () => void }) {
  const [w, setW] = useState(row.widthFt ? String(row.widthFt) : '')
  const [h, setH] = useState(row.heightFt ? String(row.heightFt) : '')
  const [p, setP] = useState(row.price ? String(row.price) : '')

  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    onChange({ widthFt: parseFloat(w) || 0, heightFt: parseFloat(h) || 0, price: parseInt(p) || 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, p])

  function sanitizeDecimal(s: string): string {
    const cleaned = s.replace(/[^0-9.]/g, '')
    const firstDot = cleaned.indexOf('.')
    if (firstDot === -1) return cleaned
    return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }

  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="relative flex-1">
        <input type="text" inputMode="decimal" autoComplete="off" value={w}
          onChange={(e) => setW(sanitizeDecimal(e.target.value))} placeholder="W"
          className="w-full pl-2 pr-6 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">ft</span>
      </div>
      <span className="text-[11px] text-gray-400">×</span>
      <div className="relative flex-1">
        <input type="text" inputMode="decimal" autoComplete="off" value={h}
          onChange={(e) => setH(sanitizeDecimal(e.target.value))} placeholder="H"
          className="w-full pl-2 pr-6 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">ft</span>
      </div>
      <div className="relative w-[110px]">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
        <input type="text" inputMode="numeric" autoComplete="off" value={p}
          onChange={(e) => setP(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Price"
          className="w-full pl-6 pr-2 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard" />
      </div>
      <button type="button" onClick={onRemove} aria-label="Remove size"
        className="w-7 h-7 rounded-full bg-empty-bg text-gray-500 text-[12px] flex items-center justify-center active:bg-red-50 active:text-red-500 shrink-0">×</button>
    </div>
  )
}

/** Editable list of width×height→price variants for a Decor listing. */
export default function SizesEditor({ value, onChange }: { value: SizePrice[]; onChange: (next: SizePrice[]) => void }) {
  const prices = value.map(s => s.price || 0).filter(p => p > 0)
  return (
    <div>
      {value.length > 0 && (
        <p className="text-[9px] text-gray-400 mb-1.5">Couples see “from {formatINR(prices.length ? Math.min(...prices) : 0)}”</p>
      )}
      {value.map((sz, i) => (
        <SizeRow
          key={i}
          row={sz}
          onChange={(next) => onChange(value.map((s, j) => j === i ? next : s))}
          onRemove={() => onChange(value.filter((_, j) => j !== i))}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { widthFt: 0, heightFt: 0, price: 0 }])}
        className="w-full py-2 rounded-xl border-2 border-dashed border-mustard/30 text-mustard text-[11px] font-semibold active:bg-mustard-light/20"
      >+ Add size</button>
    </div>
  )
}

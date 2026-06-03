import { useState, useEffect, useRef } from 'react'
import { formatINR } from '@/lib/helpers'
import type { SizePrice } from '@/lib/vendor-types'

/**
 * One size row with its own local string state so the input is always
 * responsive — sidesteps the empty-string ↔ zero round-trip that can
 * happen with `value={num || ''}` on type="number" controlled inputs.
 */
function SizeRow({
  row,
  onChange,
  onRemove,
}: {
  row: SizePrice
  onChange: (next: SizePrice) => void
  onRemove: () => void
}) {
  const [w, setW] = useState(row.widthFt ? String(row.widthFt) : '')
  const [h, setH] = useState(row.heightFt ? String(row.heightFt) : '')
  const [p, setP] = useState(row.price ? String(row.price) : '')

  // Skip the first commit so we don't bounce the parent's state right after mount.
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    onChange({
      widthFt: parseFloat(w) || 0,
      heightFt: parseFloat(h) || 0,
      price: parseInt(p) || 0,
    })
    // We intentionally don't depend on onChange to avoid infinite loops if
    // the parent passes a new reference each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, p])

  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <div className="relative flex-1">
        <input
          type="number" inputMode="decimal" min={0} step="any" value={w}
          onChange={(e) => setW(e.target.value)}
          placeholder="W"
          className="w-full pl-2 pr-6 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">ft</span>
      </div>
      <span className="text-[11px] text-gray-400">×</span>
      <div className="relative flex-1">
        <input
          type="number" inputMode="decimal" min={0} step="any" value={h}
          onChange={(e) => setH(e.target.value)}
          placeholder="H"
          className="w-full pl-2 pr-6 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">ft</span>
      </div>
      <div className="relative w-[110px]">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
        <input
          type="number" inputMode="numeric" min={0} step={1000} value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="Price"
          className="w-full pl-6 pr-2 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove size"
        className="w-7 h-7 rounded-full bg-empty-bg text-gray-500 text-[12px] flex items-center justify-center active:bg-red-50 active:text-red-500 shrink-0"
      >×</button>
    </div>
  )
}

export interface DesignDraft {
  id: string
  name: string
  photos: string[]   // blob URLs in demo, public URLs in live mode after upload
  videos: string[]
  price: number
  /** Optional per-size price variants (width × height in ft, with a price each).
   *  When non-empty the published listing's `price` is set to min(sizes.price). */
  sizes?: SizePrice[]
}

interface Props {
  value: DesignDraft[]
  onChange: (next: DesignDraft[]) => void
  /** Called when raw File objects are added, so the parent can re-upload on publish in live mode. */
  onFilesAdded?: (designId: string, kind: 'photo' | 'video', files: File[]) => void
}

function newDesign(): DesignDraft {
  return {
    id: `dd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    photos: [],
    videos: [],
    price: 0,
  }
}

export default function DesignsEditor({ value, onChange, onFilesAdded }: Props) {
  const [pendingFiles, setPendingFiles] = useState<Record<string, { photos: File[]; videos: File[] }>>({})

  function update(id: string, patch: Partial<DesignDraft>) {
    onChange(value.map(d => d.id === id ? { ...d, ...patch } : d))
  }

  function remove(id: string) {
    onChange(value.filter(d => d.id !== id))
    setPendingFiles(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function addDesign() {
    onChange([...value, newDesign()])
  }

  function handlePhotoSelect(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const design = value.find(d => d.id === id)
    if (!design) return
    const previews = files.map(f => URL.createObjectURL(f))
    update(id, { photos: [...design.photos, ...previews].slice(0, 10) })
    setPendingFiles(prev => ({
      ...prev,
      [id]: {
        photos: [...(prev[id]?.photos || []), ...files],
        videos: prev[id]?.videos || [],
      },
    }))
    if (onFilesAdded) onFilesAdded(id, 'photo', files)
  }

  function handleVideoSelect(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const design = value.find(d => d.id === id)
    if (!design) return
    const previews = files.map(f => URL.createObjectURL(f))
    update(id, { videos: [...design.videos, ...previews].slice(0, 5) })
    setPendingFiles(prev => ({
      ...prev,
      [id]: {
        photos: prev[id]?.photos || [],
        videos: [...(prev[id]?.videos || []), ...files],
      },
    }))
    if (onFilesAdded) onFilesAdded(id, 'video', files)
  }

  function removePhoto(id: string, photoIdx: number) {
    const design = value.find(d => d.id === id)
    if (!design) return
    update(id, { photos: design.photos.filter((_, i) => i !== photoIdx) })
  }

  function removeVideo(id: string, videoIdx: number) {
    const design = value.find(d => d.id === id)
    if (!design) return
    update(id, { videos: design.videos.filter((_, i) => i !== videoIdx) })
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-[11px] text-gray-500 italic">No designs added yet. Each design will appear as its own listing for couples to browse.</p>
      )}

      {value.map((design, idx) => (
        <div key={design.id} className="p-3 rounded-xl bg-white border border-card-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-dark">Design {idx + 1}</p>
            <button
              type="button"
              onClick={() => remove(design.id)}
              className="text-[10px] text-red-500 font-medium"
            >Remove</button>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Design name</label>
            <input
              type="text" value={design.name}
              onChange={(e) => update(design.id, { name: e.target.value })}
              placeholder="e.g. Floral Cascade Mandap"
              className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
            />
          </div>

          {/* Price — either a flat price OR per-size variants. If sizes are added,
              the flat input is hidden and we use the minimum size price as the
              listing's "starting from" price. */}
          {(design.sizes?.length || 0) === 0 && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Price</label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                <input
                  type="number" min={0} step={1000} value={design.price || ''}
                  onChange={(e) => update(design.id, { price: parseInt(e.target.value) || 0 })}
                  placeholder="Price"
                  className="w-full pl-6 pr-2 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard"
                />
              </div>
              {design.price > 0 && <p className="text-[9px] text-gray-400 mt-0.5">{formatINR(design.price)}</p>}
            </div>
          )}

          {/* Sizes & pricing — like Amazon variants, each ft × ft size has its own price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <label className="text-[10px] text-gray-500 block">Sizes &amp; pricing <span className="text-gray-400 font-normal">(optional)</span></label>
                {(design.sizes?.length || 0) > 0 && (
                  <p className="text-[9px] text-gray-400 mt-0.5">Couples see "from {formatINR(Math.min(...(design.sizes || []).map(s => s.price || 0).filter(p => p > 0)) || 0)}"</p>
                )}
              </div>
            </div>

            {(design.sizes || []).map((sz, sizeIdx) => (
              <SizeRow
                key={`${design.id}-${sizeIdx}`}
                row={sz}
                onChange={(nextRow) => {
                  const next = [...(design.sizes || [])]
                  next[sizeIdx] = nextRow
                  update(design.id, { sizes: next })
                }}
                onRemove={() => {
                  const next = (design.sizes || []).filter((_, i) => i !== sizeIdx)
                  update(design.id, { sizes: next.length > 0 ? next : undefined })
                }}
              />
            ))}

            <button
              type="button"
              onClick={() => {
                const next = [...(design.sizes || []), { widthFt: 0, heightFt: 0, price: 0 }]
                update(design.id, { sizes: next })
              }}
              className="w-full py-2 rounded-xl border-2 border-dashed border-mustard/30 text-mustard text-[11px] font-semibold active:bg-mustard-light/20"
            >+ Add size</button>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5">Photos</label>
            <div className="grid grid-cols-3 gap-1.5">
              {design.photos.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(design.id, i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
              {design.photos.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[8px] text-gray-400 mt-0.5">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoSelect(design.id, e)} />
                </label>
              )}
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5">Videos <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="grid grid-cols-3 gap-1.5">
              {design.videos.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden relative group bg-black">
                  <video src={src} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(design.id, i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
              {design.videos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <span className="text-[8px] text-gray-400 mt-0.5">Add video</span>
                  <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleVideoSelect(design.id, e)} />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addDesign}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-mustard/30 text-mustard text-[12px] font-semibold active:bg-mustard-light/20"
      >
        + Add a design
      </button>

      {/* Keep pendingFiles in state for the parent to read on publish — suppress unused warning */}
      {Object.keys(pendingFiles).length > 0 && null}
    </div>
  )
}

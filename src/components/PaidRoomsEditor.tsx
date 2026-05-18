import { useState } from 'react'
import { ROOM_AMENITIES, type PaidRoom } from '@/lib/vendor-types'
import { formatINR } from '@/lib/helpers'

interface Props {
  value: PaidRoom[]
  onChange: (next: PaidRoom[]) => void
  /** Called when the user adds raw File objects, so the parent can upload them in live mode. */
  onFilesAdded?: (roomId: string, files: File[]) => void
}

function newRoom(): PaidRoom {
  return {
    id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sharing: 2,
    count: 1,
    price: 0,
    amenities: [],
    photos: [],
  }
}

export default function PaidRoomsEditor({ value, onChange, onFilesAdded }: Props) {
  // Track local File objects separately so live mode can re-upload them on publish.
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({})

  function update(id: string, patch: Partial<PaidRoom>) {
    onChange(value.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function remove(id: string) {
    onChange(value.filter(r => r.id !== id))
    setPendingFiles(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function addRoom() {
    onChange([...value, newRoom()])
  }

  function toggleAmenity(id: string, amenity: string) {
    const room = value.find(r => r.id === id)
    if (!room) return
    const has = room.amenities.includes(amenity)
    update(id, { amenities: has ? room.amenities.filter(a => a !== amenity) : [...room.amenities, amenity] })
  }

  function handlePhotoSelect(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files).slice(0, 10)
    const room = value.find(r => r.id === id)
    if (!room) return
    const previews = files.map(f => URL.createObjectURL(f))
    update(id, { photos: [...room.photos, ...previews].slice(0, 10) })
    setPendingFiles(prev => ({ ...prev, [id]: [...(prev[id] || []), ...files] }))
    if (onFilesAdded) onFilesAdded(id, files)
  }

  function removePhoto(id: string, photoIdx: number) {
    const room = value.find(r => r.id === id)
    if (!room) return
    update(id, { photos: room.photos.filter((_, i) => i !== photoIdx) })
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-[11px] text-gray-500 italic">No paid rooms added yet.</p>
      )}

      {value.map((room, idx) => (
        <div key={room.id} className="p-3 rounded-xl bg-white border border-card-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-dark">Room option {idx + 1}</p>
            <button
              type="button"
              onClick={() => remove(room.id)}
              className="text-[10px] text-red-500 font-medium"
            >Remove</button>
          </div>

          {/* Sharing + count steppers */}
          <div className="flex gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">People sharing</label>
              <div className="inline-flex items-stretch rounded-xl border border-card-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => update(room.id, { sharing: Math.max(1, room.sharing - 1) })}
                  disabled={room.sharing <= 1}
                  className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >−</button>
                <input
                  type="number" min={1} max={20} value={room.sharing}
                  onChange={(e) => update(room.id, { sharing: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-12 text-center text-[13px] font-medium text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => update(room.id, { sharing: Math.min(20, room.sharing + 1) })}
                  disabled={room.sharing >= 20}
                  className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >+</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">How many such rooms?</label>
              <div className="inline-flex items-stretch rounded-xl border border-card-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => update(room.id, { count: Math.max(1, room.count - 1) })}
                  disabled={room.count <= 1}
                  className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >−</button>
                <input
                  type="number" min={1} max={100} value={room.count}
                  onChange={(e) => update(room.id, { count: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-12 text-center text-[13px] font-medium text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => update(room.id, { count: Math.min(100, room.count + 1) })}
                  disabled={room.count >= 100}
                  className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >+</button>
              </div>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Price per room</label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
              <input
                type="number" min={0} step={500} value={room.price || ''}
                onChange={(e) => update(room.id, { price: parseInt(e.target.value) || 0 })}
                placeholder="Price"
                className="w-full pl-6 pr-2 py-2 rounded-xl border border-card-border text-[11px] outline-none focus:border-mustard"
              />
            </div>
            {room.price > 0 && <p className="text-[9px] text-gray-400 mt-0.5">{formatINR(room.price)} × {room.count} = {formatINR(room.price * room.count)}</p>}
          </div>

          {/* Amenities */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-1.5">
              {ROOM_AMENITIES.map(a => {
                const sel = room.amenities.includes(a)
                return (
                  <button
                    key={a} type="button"
                    onClick={() => toggleAmenity(room.id, a)}
                    className={`py-1 px-2.5 rounded-full text-[10px] font-medium transition-all ${sel ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 border border-card-border'}`}
                  >
                    {sel && <span className="mr-0.5">✓ </span>}{a}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5">Photos</label>
            <div className="grid grid-cols-4 gap-1.5">
              {room.photos.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(room.id, i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
              {room.photos.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[8px] text-gray-400 mt-0.5">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoSelect(room.id, e)} />
                </label>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRoom}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-mustard/30 text-mustard text-[12px] font-semibold active:bg-mustard-light/20"
      >
        + Add a room
      </button>
      {/* Suppress unused warning until live-mode upload wires through */}
      {Object.keys(pendingFiles).length > 0 && null}
    </div>
  )
}

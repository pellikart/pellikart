import { useState } from 'react'
import MenuBuilder from './MenuBuilder'
import type { MenuSection, MenuMode } from '@/lib/vendor-types'

const MAX_MENU_PHOTOS = 15

interface Props {
  /** Structured menu (dish-bank builder), used when mode is 'items'. */
  menu: MenuSection[]
  onMenuChange: (next: MenuSection[]) => void
  /** Uploaded menu photo URLs, used when mode is 'photos'. */
  photos: string[]
  onPhotosChange: (next: string[]) => void
  /** Which input the vendor is using. */
  mode: MenuMode
  onModeChange: (next: MenuMode) => void
  /**
   * Live-mode uploader — returns public URLs for the given files. When omitted
   * (demo mode), the picked files are shown as local object URLs instead. This
   * mirrors how listing photos degrade gracefully off Supabase.
   */
  uploadFn?: (files: File[]) => Promise<string[]>
  foodType?: string
}

/**
 * Menu input with a mode toggle: vendors can either build the menu dish-by-dish
 * (the dish-bank MenuBuilder) or — for large menus that are painful to enter
 * item by item — just upload photos of their printed menu. Only one mode's data
 * is shown to couples (see MenuPicker / ListingDetailSheet), but both are kept
 * so toggling back and forth never loses work.
 */
export default function MenuEditor({
  menu, onMenuChange, photos, onPhotosChange, mode, onModeChange, uploadFn, foodType,
}: Props) {
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files).slice(0, MAX_MENU_PHOTOS - photos.length)
    // Reset the input so the same file can be re-picked after a remove.
    e.target.value = ''
    if (files.length === 0) return
    if (uploadFn) {
      setUploading(true)
      try {
        const urls = await uploadFn(files)
        if (urls.length > 0) onPhotosChange([...photos, ...urls].slice(0, MAX_MENU_PHOTOS))
      } finally {
        setUploading(false)
      }
    } else {
      const urls = files.map(f => URL.createObjectURL(f))
      onPhotosChange([...photos, ...urls].slice(0, MAX_MENU_PHOTOS))
    }
  }

  function removePhoto(idx: number) {
    onPhotosChange(photos.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="inline-flex w-full rounded-lg border border-card-border overflow-hidden p-0.5 bg-empty-bg">
        {(['items', 'photos'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${mode === m ? 'bg-mustard text-white' : 'text-gray-500'}`}
          >
            {m === 'items' ? 'Add items' : 'Upload photos'}
          </button>
        ))}
      </div>

      {mode === 'items' ? (
        <MenuBuilder value={menu} onChange={onMenuChange} foodType={foodType} />
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400">
            Upload photos of your menu — couples see them as reference images. Great for large menus you don’t want to type out.
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-card-border">
                <img src={src} alt={`Menu ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  aria-label="Remove menu photo"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-[11px] leading-none flex items-center justify-center active:bg-black/70"
                >×</button>
              </div>
            ))}
            {photos.length < MAX_MENU_PHOTOS && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer text-mustard">
                {uploading ? (
                  <span className="text-[10px] font-medium animate-pulse">Uploading…</span>
                ) : (
                  <>
                    <span className="text-lg leading-none">+</span>
                    <span className="text-[9px] font-medium mt-0.5">Add photo</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
              </label>
            )}
          </div>
          {photos.length > 0 && (
            <p className="text-[10px] text-gray-400">{photos.length} / {MAX_MENU_PHOTOS} photos</p>
          )}
        </div>
      )}
    </div>
  )
}

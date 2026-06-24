import {
  PHOTOGRAPHY_GUEST_BUCKETS,
  PHOTOGRAPHY_PACKAGE_HOURS,
  photographyGuestBucketLabel,
  type PhotographyGuestPackages,
} from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for guest-based photography packages: a price box for every
 * guest bucket × coverage-hours cell, plus a per-bucket count of how many
 * photographers are present (informational — doesn't change the flat price).
 * Shared by the add-listing and edit-listing flows.
 */
export default function PhotographyGuestPackagesEditor({
  value,
  onChange,
  photographers,
  onPhotographersChange,
  videographers,
  onVideographersChange,
}: {
  value: PhotographyGuestPackages
  onChange: (next: PhotographyGuestPackages) => void
  photographers: Record<string, number>
  onPhotographersChange: (next: Record<string, number>) => void
  videographers: Record<string, number>
  onVideographersChange: (next: Record<string, number>) => void
}) {
  function setCell(bucket: string, hours: number, price: number) {
    const byHours = { ...(value[bucket] || {}) }
    if (price > 0) byHours[String(hours)] = price
    else delete byHours[String(hours)]
    const next: PhotographyGuestPackages = { ...value, [bucket]: byHours }
    if (Object.keys(byHours).length === 0) delete next[bucket]
    onChange(next)
  }

  function setPhotographers(bucket: string, count: number) {
    const n = Math.max(0, count)
    const next = { ...photographers }
    if (n > 0) next[bucket] = n
    else delete next[bucket]
    onPhotographersChange(next)
  }

  function setVideographers(bucket: string, count: number) {
    const n = Math.max(0, count)
    const next = { ...videographers }
    if (n > 0) next[bucket] = n
    else delete next[bucket]
    onVideographersChange(next)
  }

  return (
    <div className="space-y-3">
      {PHOTOGRAPHY_GUEST_BUCKETS.map(bucket => {
        const shooters = photographers[bucket] ?? 0
        const videoShooters = videographers[bucket] ?? 0
        return (
          <div key={bucket} className="p-3 rounded-xl border border-card-border bg-white">
            <p className="text-[12px] font-semibold text-dark mb-2">{photographyGuestBucketLabel(bucket)} guests</p>
            <div className="grid grid-cols-2 gap-2">
              {PHOTOGRAPHY_PACKAGE_HOURS.map(h => {
                const val = value[bucket]?.[String(h)] ?? 0
                return (
                  <div key={h}>
                    <label className="text-[10px] text-gray-400 block mb-0.5">{h} hrs</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                      <input
                        type="number" min={0} step={1000}
                        value={val || ''}
                        placeholder="0"
                        onChange={(e) => setCell(bucket, h, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-6 pr-2 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Photographers present for this guest bracket (informational) */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
              <span className="text-[11px] font-medium text-dark">Photographers present</span>
              <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setPhotographers(bucket, shooters - 1)}
                  disabled={shooters <= 0}
                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >−</button>
                <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{shooters}</span>
                <button
                  type="button"
                  onClick={() => setPhotographers(bucket, shooters + 1)}
                  className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40"
                >+</button>
              </div>
            </div>

            {/* Videographers present for this guest bracket (informational) */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-medium text-dark">Videographers present</span>
              <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setVideographers(bucket, videoShooters - 1)}
                  disabled={videoShooters <= 0}
                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                >−</button>
                <span className="w-8 flex items-center justify-center text-[12px] font-semibold text-dark">{videoShooters}</span>
                <button
                  type="button"
                  onClick={() => setVideographers(bucket, videoShooters + 1)}
                  className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40"
                >+</button>
              </div>
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-gray-400">Fill only the cells you offer — empty ones won't be shown to couples.</p>
    </div>
  )
}

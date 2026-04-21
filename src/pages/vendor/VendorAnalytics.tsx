import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { useState, useEffect } from 'react'
import {
  fetchAnalyticsSummary, fetchDailyViews, fetchListingPerformance,
  type AnalyticsSummary, type DailyCount, type ListingPerformance,
} from '@/lib/supabase-db'

export default function VendorAnalytics() {
  const navigate = useNavigate()
  const { _vendorDbId, _liveMode, vendorListings, vendorAvailability, vendorProfile } = useVendorStore()

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyViews, setDailyViews] = useState<DailyCount[]>([])
  const [listingPerf, setListingPerf] = useState<ListingPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!_liveMode || !_vendorDbId) {
      setLoading(false)
      return
    }
    Promise.all([
      fetchAnalyticsSummary(_vendorDbId),
      fetchDailyViews(_vendorDbId, 30),
      fetchListingPerformance(_vendorDbId),
    ]).then(([s, d, l]) => {
      setSummary(s)
      setDailyViews(d)
      setListingPerf(l)
      setLoading(false)
    })
  }, [_liveMode, _vendorDbId])

  // Compute availability stats
  const availDates = Object.entries(vendorAvailability)
  const blockedCount = availDates.filter(([, v]) => v.status === 'blocked').length
  const bookedCount = availDates.filter(([, v]) => v.status === 'booked').length

  // Compute ritual coverage from listings
  const ritualCounts: Record<string, number> = {}
  for (const l of vendorListings) {
    for (const r of (l.rituals || [])) {
      ritualCounts[r] = (ritualCounts[r] || 0) + 1
    }
  }

  // Profile completeness
  const p = vendorProfile
  const completenessItems = [
    { label: 'Business name', done: !!p?.businessName },
    { label: 'Description', done: !!p?.description },
    { label: 'Portfolio photos', done: (p?.portfolioPhotos?.length || 0) > 0 },
    { label: 'At least 1 listing', done: vendorListings.length > 0 },
    { label: 'Calendar updated', done: availDates.length > 0 },
    { label: 'Contact details', done: !!p?.phone },
  ]
  const completedItems = completenessItems.filter(i => i.done).length
  const completenessPercent = Math.round((completedItems / completenessItems.length) * 100)

  const s = summary

  return (
    <div className="min-h-dvh bg-white page-enter pb-20">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Analytics & Insights</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-[13px] text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <div className="px-4 mt-3 space-y-5">

          {/* ── Summary Cards ── */}
          <div>
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Overview</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Impressions', value: s?.totalImpressions || 0 },
                { label: 'Detail Views', value: s?.totalDetailViews || 0 },
                { label: 'Shortlists', value: s?.totalShortlists || 0 },
                { label: 'Likes', value: s?.totalLikes || 0 },
                { label: 'Selections', value: s?.totalSelections || 0 },
                { label: 'Bookings', value: s?.totalBookings || 0 },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl bg-empty-bg text-center">
                  <p className="text-[18px] font-bold text-dark">{m.value}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Views Over Time (Line Chart) ── */}
          <div>
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Views — Last 30 Days</p>
            <div className="p-3 rounded-xl bg-empty-bg">
              {dailyViews.length > 0 && dailyViews.some(d => d.impressions > 0 || d.detailViews > 0) ? (
                <LineChart data={dailyViews} />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[11px] text-gray-400">No view data yet</p>
                  <p className="text-[9px] text-gray-300 mt-1">Views will appear as couples discover your listings</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Engagement Funnel ── */}
          {s && (s.totalImpressions > 0 || s.totalDetailViews > 0) && (
            <div>
              <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Engagement Funnel</p>
              <div className="p-3 rounded-xl bg-empty-bg">
                <FunnelChart
                  steps={[
                    { label: 'Impressions', value: s.totalImpressions },
                    { label: 'Detail Views', value: s.totalDetailViews },
                    { label: 'Shortlists', value: s.totalShortlists },
                    { label: 'Selections', value: s.totalSelections },
                    { label: 'Bookings', value: s.totalBookings },
                  ]}
                />
              </div>
            </div>
          )}

          {/* ── Listing Performance (Bar Chart) ── */}
          {listingPerf.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Listing Performance</p>
              <div className="p-3 rounded-xl bg-empty-bg">
                <BarChart data={listingPerf} />
              </div>
            </div>
          )}

          {/* ── Ritual Coverage (Donut) ── */}
          {Object.keys(ritualCounts).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Ritual Coverage</p>
              <div className="p-3 rounded-xl bg-empty-bg flex items-center gap-4">
                <DonutChart data={ritualCounts} />
                <div className="flex-1 space-y-1">
                  {Object.entries(ritualCounts).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600">{name}</span>
                      <span className="text-[10px] font-bold text-dark">{count} listing{count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Availability Overview ── */}
          <div>
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Availability</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-empty-bg text-center">
                <p className="text-[18px] font-bold text-dark">{blockedCount}</p>
                <p className="text-[8px] text-gray-400">Blocked</p>
              </div>
              <div className="p-3 rounded-xl bg-empty-bg text-center">
                <p className="text-[18px] font-bold text-magenta">{bookedCount}</p>
                <p className="text-[8px] text-gray-400">Booked</p>
              </div>
              <div className="p-3 rounded-xl bg-empty-bg text-center">
                <p className="text-[18px] font-bold text-dark">{vendorListings.length}</p>
                <p className="text-[8px] text-gray-400">Listings</p>
              </div>
            </div>
          </div>

          {/* ── Profile Completeness ── */}
          <div>
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Profile Completeness</p>
            <div className="p-3 rounded-xl bg-empty-bg">
              <div className="flex items-center gap-3 mb-3">
                <RadialProgress percent={completenessPercent} />
                <div>
                  <p className="text-[14px] font-bold text-dark">{completenessPercent}%</p>
                  <p className="text-[9px] text-gray-400">{completedItems} of {completenessItems.length} completed</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {completenessItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`text-[10px] ${item.done ? 'text-green-500' : 'text-gray-300'}`}>{item.done ? '✓' : '○'}</span>
                    <span className={`text-[10px] ${item.done ? 'text-gray-600' : 'text-gray-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── SVG Chart Components ─────────────────

function LineChart({ data }: { data: DailyCount[] }) {
  const w = 300, h = 100, pad = 20
  const maxVal = Math.max(...data.map(d => Math.max(d.impressions, d.detailViews)), 1)
  const xStep = (w - pad * 2) / Math.max(data.length - 1, 1)

  function points(key: 'impressions' | 'detailViews') {
    return data.map((d, i) => `${pad + i * xStep},${h - pad - ((d[key] / maxVal) * (h - pad * 2))}`).join(' ')
  }

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={pad} x2={w - pad} y1={h - pad - pct * (h - pad * 2)} y2={h - pad - pct * (h - pad * 2)} stroke="#eee" strokeWidth="0.5" />
      ))}
      {/* Impressions line */}
      <polyline points={points('impressions')} fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Detail views line */}
      <polyline points={points('detailViews')} fill="none" stroke="#E91E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Legend */}
      <circle cx={pad} cy={h + 10} r="3" fill="#D4A017" />
      <text x={pad + 8} y={h + 13} fontSize="8" fill="#888">Impressions</text>
      <circle cx={pad + 80} cy={h + 10} r="3" fill="#E91E78" />
      <text x={pad + 88} y={h + 13} fontSize="8" fill="#888">Detail Views</text>
    </svg>
  )
}

function FunnelChart({ steps }: { steps: { label: string; value: number }[] }) {
  const maxVal = Math.max(steps[0]?.value || 1, 1)
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => {
        const pct = Math.max((step.value / maxVal) * 100, 4)
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-gray-500">{step.label}</span>
              <span className="text-[9px] font-bold text-dark">{step.value}</span>
            </div>
            <div className="h-4 bg-white rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, #D4A017 0%, #E91E78 100%)`,
                  opacity: 1 - (i * 0.15),
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BarChart({ data }: { data: ListingPerformance[] }) {
  const maxViews = Math.max(...data.map(d => d.views), 1)
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.listingId}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-gray-600 truncate max-w-[60%]">{d.listingName}</span>
            <span className="text-[9px] text-gray-400">{d.views} views · {d.shortlists} shortlists</span>
          </div>
          <div className="flex gap-1 h-3">
            <div className="h-full rounded-full bg-mustard" style={{ width: `${(d.views / maxViews) * 100}%`, minWidth: '4px' }} />
            <div className="h-full rounded-full bg-magenta opacity-60" style={{ width: `${(d.shortlists / Math.max(maxViews, 1)) * 100}%`, minWidth: d.shortlists > 0 ? '4px' : '0' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const colors = ['#E91E78', '#D4A017', '#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
  const size = 80
  const r = 30, cx = size / 2, cy = size / 2

  let cumAngle = -90
  const arcs = entries.map(([, value], i) => {
    const angle = (value / total) * 360
    const startAngle = cumAngle
    cumAngle += angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = ((startAngle + angle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0

    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={colors[i % colors.length]}
        opacity={0.85}
      />
    )
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs}
      <circle cx={cx} cy={cy} r={16} fill="white" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1A1A2E">{total}</text>
    </svg>
  )
}

function RadialProgress({ percent }: { percent: number }) {
  const r = 22, cx = 28, cy = 28, circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eee" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#D4A017" strokeWidth="5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  )
}

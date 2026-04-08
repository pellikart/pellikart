import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

export default function VendorAnalytics() {
  const navigate = useNavigate()
  const { vendorAnalytics: a } = useVendorStore()

  const sections = [
    {
      title: 'Visibility',
      metrics: [
        { label: 'Profile Views', value: a.profileViews },
        { label: 'Explore Appearances', value: a.exploreAppearances },
        { label: 'Compare Appearances', value: a.compareAppearances },
      ],
    },
    {
      title: 'Engagement',
      metrics: [
        { label: 'Shortlists', value: a.shortlistCount },
        { label: 'Likes', value: a.likeCount },
        { label: 'Suggestions', value: a.suggestionCount },
      ],
    },
    {
      title: 'Conversion',
      metrics: [
        { label: 'Trial Requests', value: a.trialRequests },
        { label: 'Trials → Bookings', value: a.trialsConverted },
        { label: 'Direct Bookings', value: a.directBookings },
        { label: 'Total Bookings', value: a.totalBookings },
        { label: 'Conversion Rate', value: `${a.conversionRate}%` },
      ],
    },
  ]

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Analytics & Insights</p>
      </div>

      <div className="px-4 mt-3">
        {sections.map((s) => (
          <div key={s.title} className="mb-5">
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">{s.title}</p>
            <div className="grid grid-cols-3 gap-2">
              {s.metrics.map((m) => (
                <div key={m.label} className="p-3 rounded-xl bg-empty-bg text-center">
                  <p className="text-[18px] font-bold text-dark">{m.value}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/10 mb-4">
          <p className="text-[10px] font-medium text-dark">Competitive Position</p>
          <p className="text-[10px] text-gray-500 mt-1">You rank <span className="font-bold text-mustard">#3 of 12</span> vendors in your price range</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Your rating is <span className="font-bold text-mustard">above average</span> for Photography</p>
        </div>
      </div>
    </div>
  )
}

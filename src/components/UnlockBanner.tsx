import { useState } from 'react'
import { useStore } from '@/lib/store'
import { SubscriptionTier } from '@/lib/types'

export default function UnlockBanner() {
  const { subscription, subscribe } = useStore()
  const [showPicker, setShowPicker] = useState(false)

  if (subscription !== 'free') return null

  return (
    <>
      <div className="mx-4 mt-3 p-3 rounded-xl bg-magenta-light border border-magenta/20">
        <p className="text-xs text-dark/80 mb-2">
          Vendor names hidden. Unlock to reveal, get trials & book.
        </p>
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-2 rounded-lg bg-magenta text-white font-semibold text-xs active:scale-[0.98] transition-transform"
        >
          View Plans
        </button>
      </div>

      {/* Tier Picker Bottom Sheet */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Choose your plan</p>
            <p className="text-[11px] text-gray-500 mb-4">Unlock vendor names, trial sessions & booking</p>

            <div className="flex gap-3">
              {/* Silver */}
              <TierCard
                tier="silver"
                name="Silver"
                price="₹999"
                features={[
                  'See all vendor names',
                  '1 trial session per category',
                  'Book vendor slots',
                  'Call & WhatsApp vendors',
                ]}
                onSelect={() => { subscribe('silver'); setShowPicker(false) }}
              />

              {/* Gold */}
              <TierCard
                tier="gold"
                name="Gold"
                price="₹1,999"
                popular
                features={[
                  'See all vendor names',
                  '3 trial sessions per category',
                  'Book vendor slots',
                  'Call & WhatsApp vendors',
                ]}
                onSelect={() => { subscribe('gold'); setShowPicker(false) }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TierCard({
  tier, name, price, features, popular, onSelect,
}: {
  tier: SubscriptionTier
  name: string
  price: string
  features: string[]
  popular?: boolean
  onSelect: () => void
}) {
  return (
    <div className={`flex-1 rounded-xl border-2 p-3 relative ${popular ? 'border-magenta bg-magenta-light/30' : 'border-card-border'}`}>
      {popular && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-magenta text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Popular
        </span>
      )}
      <p className="text-[13px] font-bold text-dark">{name}</p>
      <p className="text-lg font-bold text-magenta mt-0.5">{price}</p>
      <ul className="mt-2.5 space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
            <span className="text-magenta mt-px">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`w-full mt-3 py-2 rounded-lg text-[11px] font-semibold active:scale-[0.97] transition-transform ${
          popular
            ? 'bg-magenta text-white'
            : 'border border-magenta text-magenta'
        }`}
      >
        Get {name}
      </button>
    </div>
  )
}

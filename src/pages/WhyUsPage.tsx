import { Link } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'

export default function WhyUsPage() {
  const rows: [string, string][] = [
    ['Browse 5,000 vendor listings', 'Browse curated, verified vendors'],
    ['"Price on request"', 'Real prices, fixed packages'],
    ['Negotiate every quote', 'Book in one tap, no haggling'],
    ['Excel + WhatsApp + chaos', 'One board, one budget, one place'],
    ['No idea what\'s happening post-booking', 'Live progress tracking for every vendor'],
    ['Family spread across 6 group chats', 'One shared board, everyone aligned'],
    ['Discover vendors with hidden fees', 'Every cost upfront, every package transparent'],
    ['Hope for the best', 'Stay in control till the last detail'],
  ]

  return (
    <div className="min-h-screen bg-white" style={{ fontSize: '16px' }}>
      <LandingNav />

      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
            WHY PELLIKART
          </p>
          <h1 className="font-serif text-center text-[36px] md:text-[48px] font-bold text-dark leading-tight mb-3">
            Others list vendors.<br />We craft weddings.
          </h1>
          <p className="text-center text-[16px] text-gray-500 mb-12">
            The difference between scrolling forever and getting it done.
          </p>

          <div className="border border-card-border rounded-2xl overflow-hidden">
            {rows.map(([oldWay, newWay], i) => (
              <div key={i} className={`grid grid-cols-2 ${i < rows.length - 1 ? 'border-b border-card-border' : ''}`}>
                <div className="p-4 text-[14px] text-gray-400 line-through decoration-gray-300">
                  {oldWay}
                </div>
                <div className="p-4 text-[14px] text-dark font-medium flex items-center gap-2 bg-magenta-light/30">
                  <span className="text-magenta shrink-0">✓</span>
                  {newWay}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/try" className="inline-block bg-magenta text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity">
              Try the app →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

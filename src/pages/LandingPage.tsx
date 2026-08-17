import { useState } from 'react'
import { Link } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'
import LandingFooter from '@/components/LandingFooter'
import { supabase } from '@/lib/supabase'
import LandingCategoryExplorer from '@/components/LandingCategoryExplorer'

export default function LandingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault()
    const email = waitlistEmail.trim()
    if (!email) return

    if (!supabase) {
      setWaitlistError("Waitlist is temporarily unavailable. Please try again later.")
      return
    }

    setWaitlistSubmitting(true)
    setWaitlistError(null)

    const { error } = await supabase.from('waitlist').insert({ email })

    setWaitlistSubmitting(false)

    if (error) {
      // Duplicate email — treat as success so the user isn't confused.
      if (error.code === '23505') {
        setWaitlistSubmitted(true)
        setWaitlistEmail('')
        setTimeout(() => setWaitlistSubmitted(false), 4000)
        return
      }
      setWaitlistError("Something went wrong. Please try again.")
      return
    }

    setWaitlistSubmitted(true)
    setWaitlistEmail('')
    setTimeout(() => setWaitlistSubmitted(false), 4000)
  }

  return (
    <div className="min-h-screen bg-white text-dark" style={{ fontSize: '16px' }}>

      <LandingNav transparentOnTop />

      {/* ============ HERO ============ */}
      <section id="top" className="pt-32 pb-20 px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-4">
              HYDERABAD
            </p>
            <h1 className="font-serif text-[40px] md:text-[56px] font-bold text-dark leading-[1.1] mb-6">
              India's only wedding app that understands an Indian wedding.
            </h1>
            <p className="text-[18px] text-gray-500 leading-relaxed mb-8 max-w-[480px]">
              No haggling. No spreadsheets. No surprises. Just your dream wedding, crafted by you, all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link to="/try" className="bg-magenta text-white font-semibold px-6 py-3.5 rounded-xl text-center hover:opacity-90 transition-opacity">
                How it works →
              </Link>
              <a href="#waitlist" className="border-2 border-magenta text-magenta font-semibold px-6 py-3.5 rounded-xl text-center hover:bg-magenta-light transition-colors">
                Join early access
              </a>
            </div>
            <p className="text-[12px] text-gray-400">
              100% free to explore
            </p>
          </div>

          {/* Hero image */}
          <div className="flex justify-center">
            <img src="/hero.png" alt="Pellikart" className="w-full max-w-[480px] h-auto" />
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <LandingCategoryExplorer />

      {/* ============ THE PROBLEM ============ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
            SOUND FAMILIAR?
          </p>
          <h2 className="font-serif text-center text-[34px] md:text-[42px] font-bold text-dark leading-tight mb-12">
            Indian weddings are beautiful.<br />Planning them is brutal.
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Endless vendor hunting',
                body: 'You message 30 vendors. Get 30 different prices. Half say "price on request." You still don\'t know who to book.',
              },
              {
                title: 'Broken budgets',
                body: 'You open Excel to track your budget. It\'s wrong by month two. The final bill is 40% more than planned. Your dad asks "how much total?" for the 11th time.',
              },
              {
                title: 'Vendor radio silence',
                body: 'You book a decorator three months ago. No updates since. Your mom is calling them every week. Nobody knows what\'s happening.',
              },
              {
                title: 'WhatsApp chaos',
                body: '6 WhatsApp groups for one wedding. Nobody has the same information. Decisions take forever. Someone always feels left out.',
              },
            ].map((card, i) => (
              <div key={i} className="border border-card-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-magenta-light flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E91E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-bold text-dark mb-2">{card.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          <p className="text-center italic text-[18px] text-gray-600 mt-12">
            53% of Indian couples go over their wedding budget. The other 47% are lying.
          </p>
        </div>
      </section>


      {/* ============ HOW IT WORKS (horizontal) ============ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
            HOW IT WORKS
          </p>
          <h2 className="font-serif text-center text-[36px] md:text-[44px] font-bold text-dark leading-tight mb-3">
            Your wedding, on one board.
          </h2>
          <p className="text-center text-[16px] text-gray-500 mb-14">
            Five steps. No phone calls. No spreadsheets. No stress.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {[
              { num: '01', title: 'Tell us your vision', body: 'Budget, guests, style, events. Two minutes.' },
              { num: '02', title: 'Build your board', body: 'Pick venue, decor, food, everything. Real prices.' },
              { num: '03', title: 'Make it yours', body: 'Swap, compare, share with family. Live updates.' },
              { num: '04', title: 'Book in one tap', body: 'Lock all your slots. No haggling. No surprises.' },
              { num: '05', title: 'Track till the day', body: 'Live milestones for every vendor. Always in control.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-[40px] font-bold text-magenta mb-2 leading-none">{step.num}</p>
                <h3 className="text-[15px] font-bold text-dark mb-2">{step.title}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WAITLIST ============ */}
      <section id="waitlist" className="py-24 px-6 bg-dark text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-4">
            EARLY ACCESS
          </p>
          <h2 className="font-serif text-[36px] md:text-[44px] font-bold leading-tight mb-4">
            Be one of our first 100 couples.
          </h2>
          <p className="text-[16px] text-gray-300 leading-relaxed mb-8">
            We're launching Pellikart in Hyderabad soon. Join the early access list and get exclusive perks, founding member pricing, and the first invites.
          </p>

          {waitlistSubmitted ? (
            <div className="inline-flex items-center gap-2 bg-magenta/20 border border-magenta px-5 py-3 rounded-xl">
              <span className="text-magenta">✓</span>
              <span className="text-white text-[14px]">You're on the list! We'll be in touch.</span>
            </div>
          ) : (
            <>
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email" required value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={waitlistSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-white text-dark text-[14px] outline-none focus:ring-2 focus:ring-magenta disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={waitlistSubmitting}
                  className="bg-magenta text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {waitlistSubmitting ? 'Joining…' : 'Join early access'}
                </button>
              </form>
              {waitlistError && (
                <p className="text-[13px] text-red-400 mt-3">{waitlistError}</p>
              )}
            </>
          )}

          <p className="text-[12px] text-gray-400 mt-4">
            No spam. Just one update when we launch. Unsubscribe anytime.
          </p>
          <p className="text-[11px] text-mustard mt-2">
            Hyderabad, India
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <LandingFooter />

      {/* Mobile sticky CTA bar — opens the real app (/app needs a full page reload
          to switch the BrowserRouter basename, so use a plain anchor). */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-card-border p-3 z-40 shadow-lg">
        <a href="/app" className="block w-full bg-magenta text-white font-semibold py-3 rounded-xl text-center text-[14px]">
          Go to the app →
        </a>
      </div>
    </div>
  )
}

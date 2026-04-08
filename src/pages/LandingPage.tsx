import { useState } from 'react'
import { Link } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'

export default function LandingPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)

  function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true)
      setTimeout(() => setWaitlistSubmitted(false), 4000)
      setWaitlistEmail('')
    }
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
                Try the app →
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

      {/* ============ THE PROBLEM ============ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Two-column: illustration left, text right */}
          <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
            {/* Illustration */}
            <div className="flex justify-center">
              <img src="/section2.png" alt="" className="w-full max-w-[480px] h-auto" />
            </div>

            {/* Text */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
                SOUND FAMILIAR?
              </p>
              <h2 className="font-serif text-[34px] md:text-[42px] font-bold text-dark leading-tight mb-3">
                Indian weddings are beautiful.<br />Planning them is brutal.
              </h2>
              <p className="text-[16px] text-gray-500 mb-6">
                Every couple in India knows this story.
              </p>

              {/* Emotional gut punch — rhythmic paragraph */}
              <p className="text-[16px] md:text-[17px] text-dark leading-[1.7]">
                You'll message 30 vendors. Get 30 different prices.
                Hear <em>"price on request"</em> twelve times.
                Open Excel. Cry.
                Open WhatsApp. Cry harder.
                Tell your dad it's <em>"under control"</em> for the eleventh time.
                <br /><br />
                <span className="text-magenta font-semibold">It's not under control.</span>
                <br />
                <span className="text-magenta font-semibold">It's never under control.</span>
              </p>
            </div>
          </div>

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
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email" required value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white text-dark text-[14px] outline-none focus:ring-2 focus:ring-magenta"
              />
              <button type="submit" className="bg-magenta text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                Join early access
              </button>
            </form>
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
      <footer className="bg-white border-t border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
                <span className="font-serif text-xl font-bold text-dark">Pellikart</span>
              </div>
              <p className="text-[13px] text-gray-500 mb-4">Others list vendors. We craft weddings.</p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-empty-bg flex items-center justify-center text-gray-500 hover:text-magenta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-empty-bg flex items-center justify-center text-gray-500 hover:text-magenta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-empty-bg flex items-center justify-center text-gray-500 hover:text-magenta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-dark uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/try" className="text-[13px] text-gray-500 hover:text-magenta">Try the app</Link></li>
                <li><Link to="/why" className="text-[13px] text-gray-500 hover:text-magenta">Why us</Link></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-magenta">Subscription tiers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[12px] font-bold text-dark uppercase tracking-wider mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-magenta">About us</a></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-magenta">Contact</a></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-magenta">Careers</a></li>
                <li><a href="#" className="text-[13px] text-gray-500 hover:text-magenta">Press kit</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-card-border flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-gray-400">© 2026 Pellikart. Made in Hyderabad with 🤍</p>
            <div className="flex gap-4">
              <a href="#" className="text-[12px] text-gray-400 hover:text-magenta">Privacy policy</a>
              <a href="#" className="text-[12px] text-gray-400 hover:text-magenta">Terms of service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-card-border p-3 z-40 shadow-lg">
        <Link to="/try" className="block w-full bg-magenta text-white font-semibold py-3 rounded-xl text-center text-[14px]">
          Try the app →
        </Link>
      </div>
    </div>
  )
}

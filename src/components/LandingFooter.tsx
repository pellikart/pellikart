import { Link } from 'react-router-dom'

/** Shared marketing-site footer, used on the landing page and article pages. */
export default function LandingFooter() {
  return (
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
              <li><Link to="/try" className="text-[13px] text-gray-500 hover:text-magenta">How it works</Link></li>
              <li><Link to="/why" className="text-[13px] text-gray-500 hover:text-magenta">Why us</Link></li>
              <li><Link to="/articles" className="text-[13px] text-gray-500 hover:text-magenta">Articles</Link></li>
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
  )
}

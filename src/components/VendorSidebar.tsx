import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { isSingleListingCategory } from '@/lib/vendor-category-config'

type NavItem = { label: string; href: string; icon: ReactNode }

const ICON = 'w-[18px] h-[18px]'

const items: NavItem[] = [
  {
    label: 'Dashboard', href: '/vendor',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  },
  {
    label: 'Listings', href: '/vendor/listings',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  },
  {
    label: 'Calendar', href: '/vendor/calendar',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  },
  {
    label: 'Trials', href: '/vendor/trials',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  },
  {
    label: 'Bids', href: '/vendor/bids',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>,
  },
  {
    label: 'Earnings', href: '/vendor/earnings',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
  {
    label: 'Analytics', href: '/vendor/analytics',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    label: 'Reviews', href: '/vendor/reviews',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
  {
    label: 'Profile', href: '/vendor/profile',
    icon: <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
]

/**
 * Desktop-only left sidebar for the vendor app. Hidden below `md` (the bottom
 * nav remains on mobile). On desktop it becomes the primary nav, surfacing all
 * vendor destinations — not just the four in the bottom bar.
 */
export default function VendorSidebar() {
  const { pathname } = useLocation()
  const { vendorProfile } = useVendorStore()

  // Single-listing categories (Mehendi/Makeup/Saree Draping) manage
  // their one listing from the dashboard — no separate Listings page.
  const visible = isSingleListingCategory(vendorProfile?.category)
    ? items.filter((i) => i.href !== '/vendor/listings')
    : items

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-dvh md:sticky md:top-0 bg-white border-r border-card-border">
      {/* Brand / business */}
      <Link to="/vendor" className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-card-border">
        <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-dark truncate leading-tight">
            {vendorProfile?.businessName || 'Pellikart'}
          </p>
          {vendorProfile?.category && (
            <p className="text-[10px] text-gray-400 truncate">{vendorProfile.category}</p>
          )}
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {visible.map((item) => {
          const active = item.href === '/vendor' ? pathname === '/vendor' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                active ? 'bg-mustard-light text-mustard' : 'text-gray-600 hover:bg-mustard-light/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

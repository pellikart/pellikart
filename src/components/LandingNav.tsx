import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

interface Props {
  /** When true, nav background starts transparent and turns white on scroll. Default false (always white). */
  transparentOnTop?: boolean
}

export default function LandingNav({ transparentOnTop = false }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function goToWaitlist() {
    setMobileMenuOpen(false)
    if (pathname === '/') {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      // Wait for landing to render, then scroll
      setTimeout(() => {
        document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  useEffect(() => {
    if (!transparentOnTop) return
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentOnTop])

  const isWhite = !transparentOnTop || scrolled

  const links: { label: string; href: string; external?: boolean }[] = [
    { label: 'Home', href: '/' },
    { label: 'Why us', href: '/why' },
    { label: 'Try the app', href: '/try' },
    { label: 'App', href: '/app', external: true },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isWhite ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-serif text-xl font-bold text-dark">Pellikart</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => {
            const active = pathname === l.href
            const cls = `text-[14px] transition-colors ${active ? 'text-magenta font-semibold' : 'text-gray-600 hover:text-dark'}`
            // /app needs a full page reload to switch BrowserRouter basename
            return l.external ? (
              <a key={l.href} href={l.href} className={cls}>{l.label}</a>
            ) : (
              <Link key={l.href} to={l.href} className={cls}>{l.label}</Link>
            )
          })}
          <button onClick={goToWaitlist} className="bg-magenta text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Join waitlist
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-dark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen
              ? <path d="M18 6L6 18M6 6l12 12" />
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-card-border">
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((l) =>
              l.external ? (
                <a
                  key={l.href} href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[14px] ${pathname === l.href ? 'text-magenta font-semibold' : 'text-gray-600'}`}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href} to={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[14px] ${pathname === l.href ? 'text-magenta font-semibold' : 'text-gray-600'}`}
                >
                  {l.label}
                </Link>
              )
            )}
            <button onClick={goToWaitlist} className="bg-magenta text-white text-[13px] font-semibold px-4 py-2 rounded-lg text-center">
              Join waitlist
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

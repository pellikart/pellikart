/**
 * Public marketing route — `/showcase` (index) and `/showcase/:slug` (per-category slide).
 *
 * Used to capture LinkedIn carousel images. The index page shows a compact
 * 1200×900 overview grid plus links into each detailed slide. Each detail
 * slide is a 1080×1350 portrait card with the FULL vendor listing detail
 * (every line item, every category-specific field) — the point being that
 * Pellikart listings carry everything a couple would otherwise spend a
 * 47-minute call extracting.
 *
 * Capture: F12 → Elements → right-click the card div (id="capture-card") →
 *          "Capture node screenshot" → drops a ready-to-upload PNG.
 */
import { Link, useParams, useLocation } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'
import { formatINR } from '@/lib/helpers'

const heroUrl = (folder: string, n: number) => `/images/gallery/${folder}/${n}.jpg`

interface SlideConfig {
  slug: string
  category: string
  hero: string
  name: string
  style: string
  area: string
  rating: number
  /** Hook line for the slide (small subtitle near the price). */
  highlight?: string
  pricePrefix?: string
  price: number
  priceSuffix?: string
  /** Optional second pricing line (e.g. alternate tier or "from" indicator). */
  priceSubline?: string
  /** Section blocks rendered in order. */
  sections: SlideSection[]
}

type SlideSection =
  | { type: 'facts'; title: string; items: { label: string; value: string }[] }
  | { type: 'check'; title: string; items: string[] }
  | { type: 'tiers'; title: string; tiers: { label: string; price: number; suffix?: string }[] }
  | { type: 'rooms'; title: string; rooms: { type: string; price: number; amenities: string[] }[] }
  | { type: 'sizes'; title: string; sizes: { w: number; h: number; price: number }[] }
  | { type: 'paragraph'; title: string; body: string }

const SLIDES: Record<string, SlideConfig> = {
  venue: {
    slug: 'venue',
    category: 'Venue',
    hero: heroUrl('venue', 1),
    name: 'The Grand Palace',
    style: 'Royal Heritage',
    area: 'Jubilee Hills, Hyderabad',
    rating: 4.8,
    highlight: 'Capacity 1,500 · Indoor palace · Bundled decor & catering',
    pricePrefix: 'From',
    price: 550000,
    priceSubline: '12 hr ₹5,50,000 · 24 hr ₹8,50,000',
    sections: [
      {
        type: 'tiers',
        title: 'Rental tiers',
        tiers: [
          { label: '12 hr rental', price: 550000 },
          { label: '24 hr rental', price: 850000 },
        ],
      },
      {
        type: 'facts',
        title: 'Venue specs & policies',
        items: [
          { label: 'Venue type', value: 'Palace' },
          { label: 'Setting', value: 'Indoor' },
          { label: 'Capacity', value: '1,500 guests' },
          { label: 'Rooms available', value: '20+' },
          { label: 'Parking', value: '200+ cars' },
          { label: 'Music until', value: '12 AM' },
          { label: 'Food policy', value: 'Veg only' },
          { label: 'Alcohol', value: 'Allowed' },
          { label: 'Outside catering', value: 'Not allowed' },
          { label: 'In-house catering', value: 'Mandatory' },
        ],
      },
      {
        type: 'check',
        title: "What's included",
        items: [
          'AC Hall',
          'Bridal Suite',
          'Valet parking',
          'Sound system',
          'Generator backup',
          'CCTV',
          'Security',
          'Furniture',
          'Basic lighting',
          'Cleaning',
          'Wi-Fi',
          'Transport & logistics included',
        ],
      },
      {
        type: 'rooms',
        title: 'Paid guest rooms',
        rooms: [
          { type: '2-sharing · 8 rooms', price: 12000, amenities: ['AC', 'Hot water 24×7', 'Wi-Fi', 'TV', 'Tea/coffee', 'Breakfast'] },
          { type: '4-sharing · 12 rooms', price: 18000, amenities: ['AC', 'Wi-Fi', 'Mini fridge', 'Room service', 'Breakfast'] },
        ],
      },
    ],
  },

  photography: {
    slug: 'photography',
    category: 'Photography',
    hero: heroUrl('photo', 1),
    name: 'Lens & Light Studio',
    style: 'Candid + Cinematic',
    area: 'Banjara Hills, Hyderabad',
    rating: 4.8,
    highlight: 'Photo + Video · 10 hours · 2 photographers + 1 videographer',
    price: 180000,
    priceSubline: 'Premium 2-day package',
    sections: [
      {
        type: 'facts',
        title: 'Coverage',
        items: [
          { label: 'Coverage type', value: 'Photo + Video' },
          { label: 'Style', value: 'Candid + Cinematic' },
          { label: 'Hours', value: '10 hrs' },
          { label: 'Photographers', value: '2' },
          { label: 'Videographers', value: '1' },
          { label: 'Live coverage', value: 'Add-on' },
        ],
      },
      {
        type: 'facts',
        title: 'Deliverables',
        items: [
          { label: 'Edited photos', value: '800' },
          { label: 'Highlight reel', value: '5 min' },
          { label: 'Full ceremony video', value: 'Yes' },
          { label: 'Drone shots', value: 'Included' },
          { label: 'Same-day edit', value: 'Yes' },
          { label: 'Albums', value: '1 album' },
        ],
      },
      {
        type: 'facts',
        title: 'Delivery',
        items: [
          { label: 'Format', value: 'USB + Google Drive' },
          { label: 'Timeline', value: '30 days' },
          { label: 'Raw files', value: 'On request' },
        ],
      },
      {
        type: 'check',
        title: 'Equipment',
        items: ['Mirrorless camera bodies', 'Drone', 'Gimbal stabilisers', 'Studio lighting', 'Backup gear on-site'],
      },
    ],
  },

  catering: {
    slug: 'catering',
    category: 'Catering',
    hero: heroUrl('catering', 1),
    name: 'Spice Route Caterers',
    style: 'North Indian Royal',
    area: 'Begumpet, Hyderabad',
    rating: 4.7,
    highlight: 'North Indian + Mughlai · 25 menu items · 200–1,000 pax',
    price: 850,
    priceSuffix: '/plate',
    priceSubline: 'Premium 800-pax package · ₹3,20,000 base',
    sections: [
      {
        type: 'facts',
        title: 'Service basics',
        items: [
          { label: 'Cuisine', value: 'North Indian + Mughlai' },
          { label: 'Food type', value: 'Veg + Non-veg' },
          { label: 'Menu items', value: '25' },
          { label: 'Live counters', value: '3' },
          { label: 'Min plates', value: '200' },
          { label: 'Max plates', value: '1,000' },
        ],
      },
      {
        type: 'facts',
        title: 'Operations',
        items: [
          { label: 'Team size', value: '20–40 staff' },
          { label: 'Staff', value: 'Included' },
          { label: 'Crockery + cutlery', value: 'Included' },
          { label: 'Transport', value: '+₹8,000' },
        ],
      },
      {
        type: 'check',
        title: 'Special counters',
        items: ['Chaat Station', 'Dessert Bar', 'Paan Counter'],
      },
      {
        type: 'check',
        title: 'Menu sections (couple picks within each)',
        items: [
          'Starters — couple picks 4 of 8 vegetarian, 3 of 6 non-veg',
          'Main course — picks 5 of 10 curries, 3 breads',
          'Rice & biryani — picks 2 of 4',
          'Desserts — picks 3 of 6',
          'Beverages — picks 4 of 8',
          'Live stations — 3 included from 6 options',
        ],
      },
    ],
  },

  decor: {
    slug: 'decor',
    category: 'Decor',
    hero: heroUrl('decor', 1),
    name: 'Petal & Bloom',
    style: 'Floral Luxury',
    area: 'Madhapur, Hyderabad',
    rating: 4.9,
    highlight: 'Mandap design · 3 size variants · Fresh premium florals',
    pricePrefix: 'From',
    price: 25000,
    priceSubline: 'Price varies by mandap size',
    sections: [
      {
        type: 'sizes',
        title: 'Sizes & pricing',
        sizes: [
          { w: 10, h: 8, price: 25000 },
          { w: 12, h: 10, price: 40000 },
          { w: 15, h: 12, price: 62000 },
        ],
      },
      {
        type: 'facts',
        title: 'Design',
        items: [
          { label: 'Decor type', value: 'Full venue' },
          { label: 'Speciality', value: 'Floral · Ceiling work' },
          { label: 'Flower type', value: 'Fresh (premium grade)' },
          { label: 'LED lighting', value: 'Included' },
          { label: 'Props', value: 'All included' },
          { label: 'Reusable elements', value: 'All fresh' },
        ],
      },
      {
        type: 'facts',
        title: 'Setup',
        items: [
          { label: 'Setup area', value: 'Large (full venue)' },
          { label: 'Team size', value: '8–15 people' },
          { label: 'Setup time', value: '8 hours' },
          { label: 'Teardown', value: 'Included' },
          { label: 'Transport', value: '+₹12,000' },
        ],
      },
      {
        type: 'check',
        title: "What's included",
        items: [
          'Mandap structure + drapes',
          'Fresh floral cascade',
          'Ceiling installation',
          'Entrance & aisle decor',
          'Stage backdrop',
          'Photo-zone props',
          'LED & ambient lighting',
          'Setup + on-site supervisor',
          'Teardown next morning',
        ],
      },
    ],
  },
}

const SLIDE_ORDER: (keyof typeof SLIDES)[] = ['venue', 'photography', 'catering', 'decor']

export default function ShowcasePage() {
  const { slug } = useParams<{ slug?: string }>()
  if (slug === 'compare' || slug?.startsWith('compare-')) {
    return <CompareSlide />
  }
  if (slug && SLIDES[slug]) {
    return <Slide config={SLIDES[slug]} />
  }
  return <Index />
}

// ─── INDEX (overview + carousel navigator) ────────────────────────────────

function Index() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-mustard-light/40 via-white to-magenta-light/30 font-sans">
      <LandingNav />
      <div className="w-full flex flex-col items-center pt-28 pb-12 px-4">
        <h1 className="text-[24px] font-bold text-dark mb-1">Showcase</h1>
        <p className="text-[12px] text-gray-500 max-w-md text-center mb-5">
          Each slide below is a single vendor listing — fully itemised. Open one, then F12 → right-click the card → "Capture node screenshot" to download.
        </p>

        {/* Carousel slide tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl w-full mb-8">
          {SLIDE_ORDER.map((slug, i) => {
            const s = SLIDES[slug]
            return (
              <Link
                key={slug}
                to={`/showcase/${slug}`}
                className="rounded-2xl overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow group"
              >
                <div className="h-32 relative" style={{ background: `url(${s.hero}) center/cover no-repeat` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white bg-magenta/85 px-2 py-0.5 rounded-full">
                    Slide {i + 1}
                  </span>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-[12px] font-bold">{s.category}</p>
                    <p className="text-white/80 text-[10px]">{s.name}</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gray-500 leading-snug">{s.highlight}</p>
                  <p className="text-[10px] text-magenta font-semibold mt-2 group-hover:underline">Open slide →</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Compare feature slides — one per category */}
        <div className="mb-8 w-full max-w-4xl rounded-2xl border border-magenta/30 bg-gradient-to-r from-magenta/10 via-mustard-light/40 to-magenta/10 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-dark">Compare feature slides</p>
            <p className="text-[11px] text-gray-500">Side-by-side vendor table — same questions, best value highlighted</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {COMPARE_ORDER.map((key) => (
              <Link
                key={key}
                to={`/showcase/compare-${key}`}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center hover:shadow-md hover:border-magenta transition-all group"
              >
                <p className="text-[12px] font-bold text-dark">{COMPARE_SLIDES[key].category}</p>
                <p className="text-[10px] font-semibold text-magenta mt-0.5 group-hover:underline">Open slide →</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Compact 1200×900 overview card (existing layout) */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-3">Or use the 1200×900 overview card as a single image</p>
        <div
          id="capture-card"
          className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden"
          style={{ width: 1200, height: 900 }}
        >
          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Pellikart" className="w-11 h-11 rounded-xl object-cover" />
              <div>
                <p className="text-[20px] font-bold text-dark leading-tight">Pellikart</p>
                <p className="text-[11px] text-gray-500">Standardized vendor listings — what's included, line by line</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-magenta font-bold">No more 47-minute discovery calls</span>
          </div>
          {/* Card grid */}
          <div className="grid grid-cols-2 grid-rows-2 gap-4 p-6" style={{ height: 'calc(900px - 80px)' }}>
            {SLIDE_ORDER.map(slug => (
              <OverviewTile key={slug} config={SLIDES[slug]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewTile({ config: c }: { config: SlideConfig }) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden flex bg-white">
      <div className="w-32 shrink-0 relative" style={{ background: `url(${c.hero}) center/cover no-repeat` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white bg-magenta/85 px-2 py-0.5 rounded-full">
          {c.category}
        </span>
        <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full">
          ★ {c.rating}
        </span>
      </div>
      <div className="flex-1 p-4 min-w-0">
        <p className="text-[15px] font-bold text-dark leading-tight">{c.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{c.style} · {c.area}</p>
        <div className="flex items-baseline gap-1 mt-2">
          {c.pricePrefix && <span className="text-[9px] text-gray-400 font-medium">{c.pricePrefix.toUpperCase()}</span>}
          <p className="text-[18px] font-bold text-magenta leading-none">{formatINR(c.price)}</p>
          {c.priceSuffix && <span className="text-[10px] text-gray-500 font-medium">{c.priceSuffix}</span>}
        </div>
        {c.highlight && <p className="text-[10px] text-gray-600 mt-1.5 leading-snug">{c.highlight}</p>}
        <p className="text-[10px] font-semibold text-magenta mt-2">Full detail in carousel slide →</p>
      </div>
    </div>
  )
}

// ─── SLIDE (1080×1350 LinkedIn carousel image) ────────────────────────────

function Slide({ config: c }: { config: SlideConfig }) {
  const { search } = useLocation()
  const bare = new URLSearchParams(search).has('bare')

  // Bare mode: render ONLY the 1080×1350 card with nothing around it.
  // Used by the screenshot script so Chrome headless captures a clean PNG.
  if (bare) {
    return (
      <div style={{ width: 1080, height: 1350, overflow: 'hidden' }} className="font-sans">
        <SlideCard config={c} />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-mustard-light/40 via-white to-magenta-light/30 font-sans">
      <LandingNav />
      <div className="w-full flex flex-col items-center pt-28 pb-12 px-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-3">F12 → right-click card → "Capture node screenshot" — or run <code>tools/capture-slides.ps1</code> to grab all 4 PNGs at once</p>

        <SlideCard config={c} />

        <div className="mt-4 flex items-center gap-3">
          {SLIDE_ORDER.map((slug, i) => (
            <Link
              key={slug}
              to={`/showcase/${slug}`}
              className={`text-[11px] px-3 py-1.5 rounded-full ${slug === c.slug ? 'bg-magenta text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-magenta'}`}
            >
              {i + 1}. {SLIDES[slug].category}
            </Link>
          ))}
          <Link to="/showcase" className="text-[11px] text-gray-500 hover:text-dark ml-2">← Back to index</Link>
        </div>
      </div>
    </div>
  )
}

function SlideCard({ config: c }: { config: SlideConfig }) {
  return (
    <div
      id="capture-card"
      className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative flex flex-col"
      style={{ width: 1080, height: 1350 }}
    >
      {/* Hero header */}
      <div
        className="relative shrink-0"
        style={{ height: 380, background: `url(${c.hero}) center/cover no-repeat` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-white bg-magenta px-3.5 py-1.5 rounded-full">
            {c.category}
          </span>
          <span className="text-[14px] font-bold text-dark bg-white/95 px-3.5 py-1.5 rounded-full">★ {c.rating}</span>
        </div>
        <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[38px] font-bold text-white leading-[1.1] tracking-tight">{c.name}</p>
            <p className="text-[16px] text-white/85 mt-2">{c.style} · {c.area}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1.5">
              {c.pricePrefix && (
                <span className="text-[12px] text-white/75 font-semibold uppercase tracking-wider">{c.pricePrefix}</span>
              )}
              <p className="text-[44px] font-bold text-white leading-none">{formatINR(c.price)}</p>
              {c.priceSuffix && <span className="text-[15px] text-white/80 font-medium">{c.priceSuffix}</span>}
            </div>
            {c.priceSubline && <p className="text-[12px] text-white/80 mt-2 max-w-[280px]">{c.priceSubline}</p>}
          </div>
        </div>
      </div>

      {/* Highlight chip strip */}
      {c.highlight && (
        <div className="shrink-0 px-7 py-3 bg-gradient-to-r from-magenta/10 via-mustard-light/40 to-magenta/10 border-b border-magenta/15">
          <p className="text-[14px] text-dark text-center font-medium leading-snug">{c.highlight}</p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 px-6 py-5 flex flex-col gap-3 overflow-hidden bg-gradient-to-b from-white to-mustard-light/10">
        {c.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-7 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-mustard-light/40 to-magenta-light/30">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Pellikart" className="w-8 h-8 rounded-lg object-cover" />
          <p className="text-[13px] font-bold text-dark">Pellikart</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-magenta font-bold">Every line itemized · No discovery calls</p>
      </div>
    </div>
  )
}

function SectionBlock({ section }: { section: SlideSection }) {
  // Sections take their NATURAL height (shrink-0) and stack from the top.
  // Earlier we used flex-1 to share remaining space evenly, but that forced a
  // tall facts grid into a too-small share (text overlapped the next section)
  // while leaving the short tiers section with lots of empty padding.
  return (
    <div className="shrink-0 rounded-2xl bg-gray-50/70 border border-gray-100 px-5 py-3.5">
      <p className="text-[13px] uppercase tracking-[0.18em] text-magenta font-bold mb-2.5">{section.title}</p>
      {section.type === 'facts' && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {section.items.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-[15px] leading-snug border-b border-gray-200/60 pb-1">
              <span className="text-gray-500">{item.label}</span>
              <span className="text-dark font-semibold text-right">{item.value}</span>
            </div>
          ))}
        </div>
      )}
      {section.type === 'check' && (
        <div className={`grid ${section.items.length >= 8 ? 'grid-cols-3' : 'grid-cols-2'} gap-x-5 gap-y-2.5`}>
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[15px] text-dark leading-snug">
              <span className="text-mustard font-bold shrink-0 mt-0.5">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      {section.type === 'tiers' && (
        <div className="grid grid-cols-2 gap-3">
          {section.tiers.map((t, i) => (
            <div key={i} className="rounded-xl border border-mustard/40 bg-white px-4 py-3 flex items-center justify-between">
              <p className="text-[14px] text-gray-600 font-medium">{t.label}</p>
              <p className="text-[22px] font-bold text-magenta leading-none">{formatINR(t.price)}{t.suffix || ''}</p>
            </div>
          ))}
        </div>
      )}
      {section.type === 'rooms' && (
        <div className="grid grid-cols-2 gap-3">
          {section.rooms.map((r, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] font-semibold text-dark">{r.type}</p>
                <p className="text-[17px] font-bold text-magenta shrink-0">{formatINR(r.price)}<span className="text-[11px] text-gray-500 font-medium">/night</span></p>
              </div>
              <p className="text-[12px] text-gray-500 mt-1.5 leading-snug">{r.amenities.join(' · ')}</p>
            </div>
          ))}
        </div>
      )}
      {section.type === 'sizes' && (
        <div className="grid grid-cols-3 gap-3">
          {section.sizes.map((s, i) => (
            <div key={i} className="rounded-xl bg-white border border-mustard/40 px-4 py-3 text-center">
              <p className="text-[15px] font-semibold text-dark">{s.w} ft × {s.h} ft</p>
              <p className="text-[20px] font-bold text-magenta mt-1 leading-none">{formatINR(s.price)}</p>
            </div>
          ))}
        </div>
      )}
      {section.type === 'paragraph' && (
        <p className="text-[15px] text-dark leading-relaxed">{section.body}</p>
      )}
    </div>
  )
}

// ─── COMPARE SLIDE (1080×1350 LinkedIn portrait — the compare feature) ─────

interface CompareVendor {
  name: string
  area: string
  recommended?: boolean
}

/** A comparison row. `best` marks which column(s) hold the winning value (magenta). */
type CompareRow =
  | { kind: 'value'; label: string; values: string[]; best?: number[] }
  | { kind: 'check'; label: string; values: boolean[] }

interface CompareConfig {
  category: string
  vendors: CompareVendor[]
  /** Optional override for the middle section heading (defaults to "<category> details"). */
  detailLabel?: string
  priceRow: CompareRow
  basicRows: CompareRow[]
  detailRows: CompareRow[]
  inclusionRows: CompareRow[]
}

// Each category deliberately compares a DIFFERENT number of vendors (3–6) so the
// slides show the feature scales beyond a fixed 3-way comparison.
const COMPARE_SLIDES: Record<string, CompareConfig> = {
  photography: {
    category: 'Photography',
    vendors: [
      { name: 'Lens & Light Studio', area: 'Banjara Hills' },
      { name: 'Frame Story', area: 'Jubilee Hills' },
      { name: 'Moments & Co.', area: 'Madhapur', recommended: true },
      { name: 'Pixel Stories', area: 'Kondapur' },
    ],
    priceRow: { kind: 'value', label: 'Package price', values: ['₹1,80,000', '₹1,45,000', '₹2,10,000', '₹1,65,000'], best: [1] },
    basicRows: [
      { kind: 'value', label: 'Style', values: ['Candid + Cinematic', 'Documentary', 'Traditional + Posed', 'Fine Art'] },
      { kind: 'value', label: 'Rating', values: ['★ 4.8', '★ 4.6', '★ 4.9', '★ 4.7'], best: [2] },
      { kind: 'value', label: 'Likes', values: ['♥ 124', '♥ 89', '♥ 156', '♥ 110'], best: [2] },
    ],
    detailRows: [
      { kind: 'value', label: 'Photographers', values: ['2', '1', '3', '2'], best: [2] },
      { kind: 'value', label: 'Videographers', values: ['1', '1', '2', '1'], best: [2] },
      { kind: 'value', label: 'Coverage hours', values: ['10 hrs', '8 hrs', '12 hrs', '10 hrs'], best: [2] },
      { kind: 'value', label: 'Live coverage', values: ['Add-on', 'Not available', 'Yes, included', 'Add-on'] },
      { kind: 'value', label: 'Full ceremony video', values: ['Yes', 'No', 'Yes', 'Yes'] },
      { kind: 'value', label: 'Highlight reel', values: ['Included', 'Not included', 'Included', 'Included'] },
      { kind: 'value', label: 'Same-day reel edit', values: ['Yes', 'No', 'Yes', 'No'] },
      { kind: 'value', label: 'Cinematic trailer', values: ['Available', 'Not available', 'Available', 'Available'] },
      { kind: 'value', label: 'Edited photos', values: ['800', '500', '1,000', '700'], best: [2] },
      { kind: 'value', label: 'Albums', values: ['1 album', 'Not included', '2 albums', '1 album'], best: [2] },
      { kind: 'value', label: 'Sheets per album', values: ['30', 'Not included', '40', '25'], best: [2] },
      { kind: 'value', label: 'Delivery format', values: ['USB + Drive', 'USB Drive', 'Both', 'Google Drive'] },
      { kind: 'value', label: 'Delivery timeline', values: ['30 days', '45 days', '15 days', '30 days'], best: [2] },
    ],
    inclusionRows: [
      { kind: 'check', label: 'Candid photos', values: [true, true, true, true] },
      { kind: 'check', label: 'Traditional photos', values: [true, true, true, true] },
      { kind: 'check', label: 'Drone shots', values: [true, false, true, true] },
      { kind: 'check', label: 'Pre-wedding shoot', values: [true, true, true, false] },
      { kind: 'check', label: 'Photo booth', values: [false, false, true, false] },
      { kind: 'check', label: 'Same-day edit', values: [true, false, true, false] },
      { kind: 'check', label: 'USB drive', values: [true, true, true, true] },
      { kind: 'check', label: 'Google Drive', values: [true, false, true, true] },
      { kind: 'check', label: 'Raw files', values: [false, true, true, false] },
    ],
  },

  venue: {
    category: 'Venue',
    vendors: [
      { name: 'The Grand Palace', area: 'Jubilee Hills' },
      { name: 'Lotus Convention', area: 'Gachibowli' },
      { name: 'Riverside Gardens', area: 'Shamirpet', recommended: true },
      { name: 'Pearl Banquets', area: 'Begumpet' },
      { name: 'Skyline Terrace', area: 'Hitec City' },
    ],
    priceRow: { kind: 'value', label: 'Rental (12 hr, from)', values: ['₹5,50,000', '₹3,80,000', '₹6,20,000', '₹4,50,000', '₹7,00,000'], best: [1] },
    basicRows: [
      { kind: 'value', label: 'Venue type', values: ['Palace', 'Convention', 'Resort', 'Banquet Hall', 'Rooftop'] },
      { kind: 'value', label: 'Setting', values: ['Indoor', 'Indoor', 'In + Outdoor', 'Indoor', 'Outdoor'] },
      { kind: 'value', label: 'Style', values: ['Royal Heritage', 'Modern', 'Garden Party', 'Boutique', 'Rooftop'] },
      { kind: 'value', label: 'Rating', values: ['★ 4.8', '★ 4.6', '★ 4.9', '★ 4.7', '★ 4.5'], best: [2] },
      { kind: 'value', label: 'Likes', values: ['♥ 210', '♥ 134', '♥ 178', '♥ 95', '♥ 120'], best: [0] },
    ],
    detailRows: [
      { kind: 'value', label: 'Guest capacity', values: ['1,500', '800', '2,000', '1,000', '600'], best: [2] },
      { kind: 'value', label: 'Parking', values: ['200+ cars', '100 cars', '200+ cars', '150 cars', '50 cars'], best: [0, 2] },
      { kind: 'value', label: 'Valet parking', values: ['Yes', 'No', 'Yes', 'Yes', 'No'] },
      { kind: 'value', label: 'Complimentary rooms', values: ['20 rooms', 'None', '30 rooms', '15 rooms', 'None'], best: [2] },
      { kind: 'value', label: 'Food policy', values: ['Veg only', 'Non-veg ok', 'Non-veg ok', 'Veg only', 'Non-veg ok'] },
      { kind: 'value', label: 'Alcohol', values: ['Not allowed', 'BYOB only', 'Allowed', 'Not allowed', 'Allowed'] },
      { kind: 'value', label: 'Outside catering', values: ['In-house only', 'Allowed', 'In-house only', 'Allowed', 'Allowed'] },
      { kind: 'value', label: 'Music until', values: ['Till 12 AM', 'Till 10 PM', '24 hr allowed', 'Till 12 AM', '24 hr allowed'], best: [2, 4] },
    ],
    inclusionRows: [
      { kind: 'check', label: 'AC hall', values: [true, true, true, true, true] },
      { kind: 'check', label: 'Bridal suite', values: [true, false, true, true, false] },
      { kind: 'check', label: 'Guest rooms', values: [true, false, true, true, false] },
      { kind: 'check', label: 'Sound system', values: [true, true, true, true, true] },
      { kind: 'check', label: 'In-house catering', values: [true, false, true, true, false] },
      { kind: 'check', label: 'Generator backup', values: [true, true, true, true, true] },
      { kind: 'check', label: 'Lawn area', values: [false, false, true, false, true] },
      { kind: 'check', label: 'Pool access', values: [false, false, true, false, false] },
      { kind: 'check', label: 'Elevator', values: [true, true, false, true, true] },
      { kind: 'check', label: 'Wi-Fi', values: [true, true, true, true, true] },
      { kind: 'check', label: 'CCTV & security', values: [true, true, true, true, true] },
      { kind: 'check', label: 'Furniture & lighting', values: [true, true, true, true, true] },
    ],
  },

  makeup: {
    category: 'Makeup',
    vendors: [
      { name: 'Glamour by Aisha', area: 'Banjara Hills', recommended: true },
      { name: 'Blush Studio', area: 'Kondapur' },
      { name: 'Bridal Bliss', area: 'Himayatnagar' },
    ],
    priceRow: { kind: 'value', label: 'Bridal look (from)', values: ['₹35,000', '₹22,000', '₹28,000'], best: [1] },
    basicRows: [
      { kind: 'value', label: 'Style', values: ['HD Airbrush', 'Natural Glam', 'Traditional'] },
      { kind: 'value', label: 'Rating', values: ['★ 4.9', '★ 4.7', '★ 4.6'], best: [0] },
      { kind: 'value', label: 'Likes', values: ['♥ 198', '♥ 112', '♥ 95'], best: [0] },
    ],
    detailRows: [
      { kind: 'value', label: 'Looks included', values: ['3 looks', '2 looks', '2 looks'], best: [0] },
      { kind: 'value', label: 'Makeup type', values: ['HD + Airbrush', 'HD', 'Airbrush'] },
      { kind: 'value', label: 'Team on day', values: ['2 artists', 'Solo', '2 artists'], best: [0, 2] },
      { kind: 'value', label: 'Hair styling', values: ['Included', 'Add-on', 'Included'] },
      { kind: 'value', label: 'Saree draping', values: ['Included', 'Included', 'Add-on'] },
      { kind: 'value', label: 'Trial session', values: ['Included', 'Extra cost', 'Included'] },
      { kind: 'value', label: 'False lashes', values: ['Included', 'Add-on', 'Included'] },
      { kind: 'value', label: 'Travel to venue', values: ['Included', 'Extra charge', 'Included'] },
      { kind: 'value', label: 'Family makeup', values: ['Available', 'Available', 'Not available'] },
      { kind: 'value', label: 'Guest makeup', values: ['₹3,500/head', '₹2,500/head', '₹3,000/head'], best: [1] },
    ],
    inclusionRows: [
      { kind: 'check', label: 'Bridal makeup', values: [true, true, true] },
      { kind: 'check', label: 'Engagement look', values: [true, true, true] },
      { kind: 'check', label: 'Reception look', values: [true, false, true] },
      { kind: 'check', label: 'Hair styling', values: [true, false, true] },
      { kind: 'check', label: 'Draping', values: [true, true, false] },
      { kind: 'check', label: 'Touch-up kit', values: [true, false, true] },
      { kind: 'check', label: 'False lashes', values: [true, true, true] },
      { kind: 'check', label: 'Nail art', values: [true, false, false] },
      { kind: 'check', label: 'Pre-bridal facial', values: [true, false, true] },
      { kind: 'check', label: 'Contact lenses', values: [false, false, true] },
    ],
  },

  catering: {
    category: 'Catering',
    detailLabel: 'Menu options (per category) & service',
    vendors: [
      { name: 'Spice Route', area: 'Begumpet', recommended: true },
      { name: 'Royal Feast', area: 'Ameerpet' },
      { name: 'Annapurna', area: 'Kukatpally' },
      { name: 'Sizzle & Spice', area: 'Madhapur' },
      { name: 'Saffron Kitchen', area: 'Gachibowli' },
      { name: 'Tadka House', area: 'Kondapur' },
    ],
    priceRow: { kind: 'value', label: 'Per plate (from)', values: ['₹850', '₹650', '₹780', '₹720', '₹900', '₹680'], best: [1] },
    basicRows: [
      { kind: 'value', label: 'Serving style', values: ['Buffet', 'Buffet', 'Plated', 'Buffet', 'Buffet', 'Plated'] },
      { kind: 'value', label: 'Cuisine', values: ['Hyderabadi', 'Andhra', 'Telangana', 'Multi-cuisine', 'North Indian', 'South Indian'] },
      { kind: 'value', label: 'Food type', values: ['Veg + Non-veg', 'Veg only', 'Veg + Non-veg', 'Veg + Non-veg', 'Veg only', 'Veg + Non-veg'] },
      { kind: 'value', label: 'Rating', values: ['★ 4.7', '★ 4.5', '★ 4.8', '★ 4.6', '★ 4.4', '★ 4.7'], best: [2] },
      { kind: 'value', label: 'Likes', values: ['♥ 145', '♥ 98', '♥ 167', '♥ 120', '♥ 85', '♥ 134'], best: [2] },
    ],
    detailRows: [
      { kind: 'value', label: 'Welcome drinks', values: ['4', '2', '5', '3', '2', '4'], best: [2] },
      { kind: 'value', label: 'Veg starters', values: ['8', '6', '10', '7', '5', '8'], best: [2] },
      { kind: 'value', label: 'Non-veg starters', values: ['6', '4', '8', '5', '3', '6'], best: [2] },
      { kind: 'value', label: 'Main curries', values: ['10', '7', '12', '9', '6', '10'], best: [2] },
      { kind: 'value', label: 'Breads', values: ['4', '3', '5', '4', '2', '4'], best: [2] },
      { kind: 'value', label: 'Rice & biryani', values: ['4', '2', '5', '3', '2', '4'], best: [2] },
      { kind: 'value', label: 'Desserts', values: ['6', '4', '8', '5', '3', '6'], best: [2] },
      { kind: 'value', label: 'Live counters', values: ['3', '2', '4+', '3', '1', '3'], best: [2] },
      { kind: 'value', label: 'Min plate count', values: ['200', '100', '300', '150', '250', '200'], best: [1] },
      { kind: 'value', label: 'Max plate count', values: ['1,000', '500', '2,000', '800', '1,200', '1,000'], best: [2] },
      { kind: 'value', label: 'Team on day', values: ['20-40', '10-20', '40+', '20-40', '10-20', '20-40'], best: [2] },
      { kind: 'value', label: 'Service staff', values: ['Included', 'Included', 'Included', 'Included', 'Extra', 'Included'] },
      { kind: 'value', label: 'Crockery & cutlery', values: ['Included', 'Extra', 'Included', 'Included', 'Included', 'Extra'] },
      { kind: 'value', label: 'Order lead time', values: ['15 days', '30 days', '10 days', '20 days', '30 days', '15 days'], best: [2] },
      { kind: 'value', label: 'Backup food/plates', values: ['Yes', 'No', 'Yes', 'Yes', 'No', 'Yes'] },
    ],
    inclusionRows: [
      { kind: 'check', label: 'Welcome drinks', values: [true, false, true, true, false, true] },
      { kind: 'check', label: 'Starters', values: [true, true, true, true, true, true] },
      { kind: 'check', label: 'Main course', values: [true, true, true, true, true, true] },
      { kind: 'check', label: 'Desserts', values: [true, true, true, true, true, true] },
      { kind: 'check', label: 'Chaat station', values: [true, false, true, true, false, true] },
      { kind: 'check', label: 'Ice cream bar', values: [false, false, true, false, false, true] },
      { kind: 'check', label: 'Paan counter', values: [true, false, true, true, false, true] },
      { kind: 'check', label: 'Dosa counter', values: [false, false, true, false, true, false] },
      { kind: 'check', label: 'Juice bar', values: [true, false, true, true, false, true] },
      { kind: 'check', label: 'Crockery & service', values: [true, true, true, true, true, true] },
    ],
  },
}

const COMPARE_ORDER: (keyof typeof COMPARE_SLIDES)[] = ['venue', 'makeup', 'photography', 'catering']

/** Resolve the compare config from the URL slug: `compare` → photography (default),
 *  `compare-venue` / `compare-makeup` / etc. → that category. */
function compareConfigFromSlug(slug?: string): CompareConfig {
  if (!slug) return COMPARE_SLIDES.photography
  const key = slug === 'compare' ? 'photography' : slug.replace(/^compare-/, '')
  return COMPARE_SLIDES[key] || COMPARE_SLIDES.photography
}

function CompareSlide() {
  const { slug } = useParams<{ slug?: string }>()
  const { search } = useLocation()
  const bare = new URLSearchParams(search).has('bare')
  const config = compareConfigFromSlug(slug)

  if (bare) {
    return (
      <div style={{ width: 1080, height: 1350, overflow: 'hidden' }} className="font-sans">
        <CompareSlideCard config={config} />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-mustard-light/40 via-white to-magenta-light/30 font-sans">
      <LandingNav />
      <div className="w-full flex flex-col items-center pt-28 pb-12 px-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-3">F12 → right-click card → "Capture node screenshot" to download this 1080×1350 image (LinkedIn 4:5)</p>
        <CompareSlideCard config={config} />
        <div className="mt-4 flex items-center gap-3 flex-wrap justify-center">
          {COMPARE_ORDER.map((key) => (
            <Link
              key={key}
              to={`/showcase/compare-${key}`}
              className={`text-[11px] px-3 py-1.5 rounded-full capitalize ${config.category.toLowerCase() === key ? 'bg-magenta text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-magenta'}`}
            >
              {COMPARE_SLIDES[key].category}
            </Link>
          ))}
          <Link to="/showcase" className="text-[11px] text-gray-500 hover:text-dark ml-2">← Back to index</Link>
        </div>
      </div>
    </div>
  )
}

/** Font/column sizing that scales down as more vendor columns are added, so a
 *  3-vendor and a 6-vendor slide both fit the same 1080×1350 frame cleanly. */
function compareSizing(n: number) {
  return {
    labelW: n >= 6 ? 134 : n >= 5 ? 144 : n >= 4 ? 152 : 168,
    name: n >= 6 ? 'text-[12px]' : n >= 5 ? 'text-[13px]' : n >= 4 ? 'text-[15px]' : 'text-[17px]',
    area: n >= 5 ? 'text-[9px]' : 'text-[11px]',
    value: n >= 6 ? 'text-[12px]' : n >= 4 ? 'text-[13px]' : 'text-[15px]',
    price: n >= 6 ? 'text-[15px]' : n >= 4 ? 'text-[17px]' : 'text-[19px]',
    label: n >= 6 ? 'text-[12px]' : 'text-[13px]',
    check: n >= 6 ? 'text-[14px]' : 'text-[16px]',
  }
}

function CompareSlideCard({ config }: { config: CompareConfig }) {
  const n = config.vendors.length
  const sz = compareSizing(n)
  const colTemplate = `${sz.labelW}px repeat(${n}, 1fr)`
  return (
    <div
      id="capture-card"
      className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative flex flex-col"
      style={{ width: 1080, height: 1350 }}
    >
      {/* Header */}
      <div className="shrink-0 px-9 pt-7 pb-5 bg-gradient-to-br from-magenta to-[#a01050] text-white">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold uppercase tracking-[0.18em] bg-white/20 px-3.5 py-1.5 rounded-full">Compare</span>
          <span className="text-[13px] font-semibold text-white/85">{config.category} · {n} vendors</span>
        </div>
        <p className="text-[40px] font-bold leading-[1.1] tracking-tight mt-4">{config.category}</p>
        <p className="text-[15px] text-white/85 mt-2.5 leading-snug">Every vendor answers the same questions, so you compare like-for-like, not marketing fluff. Best value in each row is highlighted.</p>
      </div>

      {/* Vendor column headers */}
      <div className="shrink-0 grid items-end border-b-2 border-gray-100 px-7 pt-4 pb-3" style={{ gridTemplateColumns: colTemplate }}>
        <div className="text-[12px] uppercase tracking-[0.15em] text-gray-400 font-bold">Parameter</div>
        {config.vendors.map((v) => (
          <div key={v.name} className="px-1.5 text-center">
            {v.recommended && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-magenta bg-magenta-light rounded-full px-2 py-0.5 mb-1">Most liked</span>
            )}
            <p className={`${sz.name} font-bold text-dark leading-tight`}>{v.name}</p>
            <p className={`${sz.area} text-gray-500 mt-0.5`}>{v.area}</p>
          </div>
        ))}
      </div>

      {/* Rows — share the remaining height evenly so any row count fills the frame */}
      <div className="flex-1 min-h-0 px-7 py-1.5 flex flex-col overflow-hidden">
        <CompareRowEl row={config.priceRow} colTemplate={colTemplate} sz={sz} emphasize />
        {config.basicRows.map((r) => <CompareRowEl key={r.label} row={r} colTemplate={colTemplate} sz={sz} />)}

        <CompareSectionLabel>{config.detailLabel ?? `${config.category} details`}</CompareSectionLabel>
        {config.detailRows.map((r) => <CompareRowEl key={r.label} row={r} colTemplate={colTemplate} sz={sz} />)}

        <CompareSectionLabel>What's included</CompareSectionLabel>
        {config.inclusionRows.map((r) => <CompareRowEl key={r.label} row={r} colTemplate={colTemplate} sz={sz} />)}
      </div>

      {/* Footer */}
      <div className="px-9 py-3 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-mustard-light/40 to-magenta-light/30">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Pellikart" className="w-8 h-8 rounded-lg object-cover" />
          <p className="text-[15px] font-bold text-dark">Pellikart</p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-magenta font-bold">Same questions, every vendor · Decide in minutes</p>
      </div>
    </div>
  )
}

function CompareSectionLabel({ children }: { children: string }) {
  return (
    <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mt-1.5 mb-0.5 pl-1">{children}</p>
  )
}

type CompareSizing = ReturnType<typeof compareSizing>

function CompareRowEl({ row, colTemplate, sz, emphasize }: { row: CompareRow; colTemplate: string; sz: CompareSizing; emphasize?: boolean }) {
  return (
    <div
      className={`flex-1 min-h-0 grid items-center border-b border-gray-100 ${emphasize ? 'rounded-lg bg-mustard-light/40 px-1' : ''}`}
      style={{ gridTemplateColumns: colTemplate }}
    >
      <div className={`pl-1 leading-tight ${emphasize ? `${sz.label} font-bold text-dark` : `${sz.label} text-gray-500`}`}>{row.label}</div>
      {row.kind === 'value'
        ? row.values.map((val, i) => {
            const isBest = row.best?.includes(i)
            return (
              <div key={i} className={`px-1.5 text-center leading-tight ${emphasize ? `${sz.price} font-bold` : sz.value} ${isBest ? 'text-magenta font-bold' : `text-dark ${emphasize ? '' : 'font-medium'}`}`}>
                {val}
              </div>
            )
          })
        : row.values.map((has, i) => (
            <div key={i} className={`px-1.5 text-center ${sz.check} ${has ? 'text-green-600 font-bold' : 'text-gray-300'}`}>
              {has ? '✓' : '✕'}
            </div>
          ))}
    </div>
  )
}

import type { ReactNode } from 'react'
import MarriageRegistrationTelangana from '@/pages/articles/MarriageRegistrationTelangana'
import MuhurthamDates2026 from '@/pages/articles/MuhurthamDates2026'
import TeluguWeddingRituals from '@/pages/articles/TeluguWeddingRituals'
import KashiYatraChecklist from '@/pages/articles/KashiYatraChecklist'
import NischitarthamChecklist from '@/pages/articles/NischitarthamChecklist'
import WeddingGiftIdeas from '@/pages/articles/WeddingGiftIdeas'
import SangeetSongs from '@/pages/articles/SangeetSongs'
import TeluguWeddingChecklist from '@/pages/articles/TeluguWeddingChecklist'
import HyderabadWeddingCost from '@/pages/articles/HyderabadWeddingCost'
import WeddingEmergencyKit from '@/pages/articles/WeddingEmergencyKit'
import NriBrideChecklist from '@/pages/articles/NriBrideChecklist'

/**
 * Articles registry for the marketing site (/articles).
 *
 * To add a new article: append an entry to ARTICLES below. `Body` is a function
 * returning the article's JSX content — plain semantic tags (<h2>, <h3>, <p>,
 * <ul>, <img>, <blockquote>, <a>) are auto-styled by the prose wrapper in
 * ArticlesPage, so you can paste content without styling each element.
 *
 * Keep the newest article first — the index lists them in array order.
 */
export interface Article {
  /** URL slug: the article lives at /articles/<slug>. Keep it kebab-case + unique. */
  slug: string
  /** Headline shown on the card and at the top of the article. */
  title: string
  /** One- or two-line summary shown on the index card. */
  excerpt: string
  /** Optional cover image path under /public (e.g. '/articles/foo.jpg'). */
  cover?: string
  /** Optional display date, e.g. 'July 2026'. */
  date?: string
  /** Optional author name. */
  author?: string
  /** Optional estimated reading time in minutes. */
  readMins?: number
  /**
   * How the article renders:
   *  - 'prose' (default): wrapped in the standard header + auto-styled prose column.
   *  - 'full': the Body is a fully self-designed, full-width page (its own hero,
   *    styling, etc.). Only the shared nav + footer are added around it.
   */
  layout?: 'prose' | 'full'
  /** The article body as JSX. */
  Body: () => ReactNode
}

export const ARTICLES: Article[] = [
  {
    slug: 'nri-bride-wedding-checklist',
    title: "NRI bride's wedding checklist: 84 tasks from 12 months out",
    excerpt:
      'Marrying in India but living abroad. Every task in order, split into what you can do from where you are, what only happens in India, and what to hand to family.',
    cover: '/articles/nri-checklist-hero.jpg',
    date: 'August 2026',
    author: 'Team Pellikart',
    readMins: 6,
    layout: 'full',
    Body: NriBrideChecklist,
  },
  {
    slug: 'telugu-wedding-emergency-kit',
    title: 'Telugu wedding emergency kit: 76 things to pack',
    excerpt:
      'The complete wedding emergency kit checklist — 76 items across wardrobe, beauty, first aid, electronics and food, sorted into four pouches so nothing gets hunted for.',
    cover: '/articles/emergency-kit-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 5,
    layout: 'full',
    Body: WeddingEmergencyKit,
  },
  {
    slug: 'telugu-sangeet-songs-playlists',
    title: 'Sangeet songs: 8 Telugu playlists for every part of the night',
    excerpt:
      'Eight themed Telugu sangeet playlists, from the grand entry to the last hour, with the bride’s side versus groom’s side face off and a set for the parents.',
    cover: '/articles/sangeet-songs-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 5,
    layout: 'full',
    Body: SangeetSongs,
  },
  {
    slug: 'wedding-gift-ideas-by-budget',
    title: 'What to gift at a wedding: 48 ideas by budget',
    excerpt:
      'How much cash to give at a Telugu wedding, why it must end in 1, and 48 gift ideas priced in rupees across four budget bands, each with links.',
    cover: '/articles/wedding-gifts-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 6,
    layout: 'full',
    Body: WeddingGiftIdeas,
  },
  {
    slug: 'telugu-wedding-planning-checklist',
    title: 'Telugu wedding planning checklist: month by month',
    excerpt:
      'A wedding checklist built for a Telugu pelli. Jathakam to appagintalu, with every task tagged to the bride’s side, the groom’s side or the couple.',
    cover: '/articles/planning-checklist-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 6,
    layout: 'full',
    Body: TeluguWeddingChecklist,
  },
  {
    slug: 'hyderabad-wedding-cost',
    title: 'How much does a wedding cost in Hyderabad? Real vendor rates 2026',
    excerpt:
      'Actual Hyderabad wedding costs vendor by vendor — catering per plate, photographer day rates, makeup, decor and flowers, with a live estimator for your guest count.',
    cover: '/articles/wedding-cost-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 6,
    layout: 'full',
    Body: HyderabadWeddingCost,
  },
  {
    slug: 'telugu-nischitartham-checklist',
    title: 'Nischitartham checklist: what you need for a Telugu engagement',
    excerpt:
      'What goes in the nischaya tambulam, what the lagna patrika must contain, and why your invitation cards cannot be printed until it is written.',
    cover: '/articles/nischitartham-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 5,
    layout: 'full',
    Body: NischitarthamChecklist,
  },
  {
    slug: 'kashi-yatra-checklist',
    title: 'Kashi Yatra checklist: everything you need before the priest asks',
    excerpt:
      'The complete Kashi Yatra checklist — all 24 items, what each one means, who is supposed to arrange it, and the mistakes families make every time.',
    cover: '/articles/kashi-yatra-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 5,
    layout: 'full',
    Body: KashiYatraChecklist,
  },
  {
    slug: 'telugu-wedding-rituals-in-order',
    title: 'Telugu wedding rituals in order: the full sequence explained',
    excerpt:
      'Every Telugu wedding ritual in order with the Telugu names, from నిశ్చితార్థం to గృహప్రవేశం. What happens, who does what, and which moments to brief your photographer on.',
    cover: '/articles/rituals-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 6,
    layout: 'full',
    Body: TeluguWeddingRituals,
  },
  {
    slug: 'telugu-muhurtham-dates-2026-2027',
    title: 'Telugu marriage muhurtham dates 2026–2027: which months are open',
    excerpt:
      'Which months have pelli muhurthams between August 2026 and March 2027, which are closed and why, and what your date does to the price of a hall in Hyderabad.',
    cover: '/articles/muhurtham-dates-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 5,
    layout: 'full',
    Body: MuhurthamDates2026,
  },
  {
    slug: 'marriage-registration-telangana',
    title: 'Marriage registration in Telangana: documents, fees and process',
    excerpt:
      'Six documents. One visit. No deadline. A visual guide with the real fees and jurisdiction rules, verified against Registration & Stamps.',
    cover: '/articles/marriage-registration-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 4,
    layout: 'full',
    Body: MarriageRegistrationTelangana,
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

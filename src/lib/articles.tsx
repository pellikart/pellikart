import type { ReactNode } from 'react'
import MarriageRegistrationTelangana from '@/pages/articles/MarriageRegistrationTelangana'
import MuhurthamDates2026 from '@/pages/articles/MuhurthamDates2026'
import TeluguWeddingRituals from '@/pages/articles/TeluguWeddingRituals'
import KashiYatraChecklist from '@/pages/articles/KashiYatraChecklist'
import NischitarthamChecklist from '@/pages/articles/NischitarthamChecklist'

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
    title: 'Kashi Yatra checklist: everything you need for the ceremony',
    excerpt:
      'What the groom carries, what the bride’s family keeps ready, who stops him, and what to brief your photographer and decorator on.',
    cover: '/articles/kashi-yatra-hero.jpg',
    date: 'July 2026',
    author: 'Team Pellikart',
    readMins: 4,
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

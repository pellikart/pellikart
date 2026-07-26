import type { ReactNode } from 'react'
import MarriageRegistrationTelangana from '@/pages/articles/MarriageRegistrationTelangana'

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

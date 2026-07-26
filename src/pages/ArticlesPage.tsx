import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'
import LandingFooter from '@/components/LandingFooter'
import { ARTICLES, getArticle, type Article } from '@/lib/articles'

/** Cover image that falls back to a branded placeholder if the file is missing. */
function Cover({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false)
  if (!src || errored) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-empty-bg">
        <img src="/logo.png" alt="" className="w-12 h-12 rounded-lg object-cover opacity-40" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
    />
  )
}

/**
 * Marketing "Articles" section.
 *  - /articles          → index grid of article cards
 *  - /articles/:slug    → a single article
 */
export default function ArticlesPage() {
  const { slug } = useParams<{ slug: string }>()
  return slug ? <ArticleView slug={slug} /> : <ArticlesIndex />
}

function ArticlesIndex() {
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontSize: '16px' }}>
      <LandingNav />

      <section className="pt-28 pb-16 px-6 flex-1">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
            ARTICLES
          </p>
          <h1 className="font-serif text-center text-[36px] md:text-[48px] font-bold text-dark leading-tight mb-3">
            Wedding wisdom, from us to you
          </h1>
          <p className="text-center text-[16px] text-gray-500 mb-12 max-w-2xl mx-auto">
            Guides, checklists and honest advice for planning an Indian wedding — no fluff, no jargon.
          </p>

          {ARTICLES.length === 0 ? (
            <div className="border border-dashed border-card-border rounded-2xl py-16 text-center">
              <p className="text-[16px] text-dark font-medium mb-1">No articles yet</p>
              <p className="text-[14px] text-gray-500">We're writing our first pieces — check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ARTICLES.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group block border border-card-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[16/10] bg-empty-bg overflow-hidden">
        <Cover src={article.cover} alt={article.title} />
      </div>
      <div className="p-5">
        <ArticleMeta article={article} className="mb-2" />
        <h3 className="font-serif text-[19px] font-bold text-dark leading-snug mb-1.5 group-hover:text-magenta transition-colors">
          {article.title}
        </h3>
        <p className="text-[14px] text-gray-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
      </div>
    </Link>
  )
}

function ArticleMeta({ article, className = '' }: { article: Article; className?: string }) {
  const parts = [article.date, article.author, article.readMins ? `${article.readMins} min read` : null].filter(
    Boolean,
  )
  if (parts.length === 0) return null
  return (
    <p className={`text-[12px] text-gray-400 ${className}`}>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5">·</span>}
          {p}
        </span>
      ))}
    </p>
  )
}

// Auto-styles the plain semantic tags an article's Body returns, so new
// articles can be pasted in without styling each element.
const PROSE =
  'max-w-none ' +
  '[&_h2]:font-serif [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:text-dark [&_h2]:mt-10 [&_h2]:mb-3 ' +
  '[&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:text-dark [&_h3]:mt-8 [&_h3]:mb-2 ' +
  '[&_p]:text-[16px] [&_p]:text-gray-600 [&_p]:leading-[1.75] [&_p]:mb-5 ' +
  '[&_a]:text-magenta [&_a]:underline ' +
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_ul]:space-y-2 ' +
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-5 [&_ol]:space-y-2 ' +
  '[&_li]:text-[16px] [&_li]:text-gray-600 [&_li]:leading-[1.7] ' +
  '[&_img]:rounded-xl [&_img]:my-6 [&_img]:w-full ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-magenta [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6 ' +
  '[&_strong]:text-dark [&_strong]:font-semibold'

function ArticleView({ slug }: { slug: string }) {
  const article = getArticle(slug)

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontSize: '16px' }}>
        <LandingNav />
        <section className="pt-28 pb-16 px-6 flex-1">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-[32px] font-bold text-dark mb-3">Article not found</h1>
            <p className="text-[15px] text-gray-500 mb-8">
              This article doesn't exist or may have moved.
            </p>
            <Link
              to="/articles"
              className="inline-block bg-magenta text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              ← All articles
            </Link>
          </div>
        </section>
        <LandingFooter />
      </div>
    )
  }

  const { Body } = article

  // Self-designed, full-width articles: only wrap with the shared nav + footer.
  if (article.layout === 'full') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNav />
        <div className="flex-1">
          <Body />
        </div>
        <LandingFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontSize: '16px' }}>
      <LandingNav />

      <article className="pt-28 pb-16 px-6 flex-1">
        <div className="max-w-2xl mx-auto">
          <Link to="/articles" className="text-[13px] text-gray-500 hover:text-magenta">
            ← All articles
          </Link>

          <h1 className="font-serif text-[32px] md:text-[42px] font-bold text-dark leading-tight mt-5 mb-3">
            {article.title}
          </h1>
          <ArticleMeta article={article} className="mb-6" />

          {article.cover && (
            <img
              src={article.cover}
              alt={article.title}
              className="w-full rounded-2xl mb-8 object-cover"
            />
          )}

          <div className={PROSE}>
            <Body />
          </div>

          <div className="mt-12 pt-8 border-t border-card-border text-center">
            <Link
              to="/articles"
              className="inline-block text-magenta font-semibold hover:opacity-80 transition-opacity"
            >
              ← Back to all articles
            </Link>
          </div>
        </div>
      </article>

      <LandingFooter />
    </div>
  )
}

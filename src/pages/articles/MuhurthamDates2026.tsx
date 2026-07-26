import { Link } from 'react-router-dom'

/**
 * Article: "Telugu marriage muhurtham dates 2026–2027".
 *
 * A self-contained, designed article (static — no interactive JS beyond the
 * native <details> FAQ). CSS is scoped under `.mhArt` so its global-ish
 * selectors can't leak into the app; palette maps to the Pellikart theme
 * tokens (--color-magenta / --color-mustard).
 *
 * Hero image: /public/articles/muhurtham-dates-hero.jpg (self-hides if missing).
 */

const MONTHS: { cls: 'peak' | 'some' | 'shut'; label: string; head: string; note: string }[] = [
  { cls: 'shut', label: 'Aug 2026', head: 'Closed', note: 'Ashada masam and Chaturmasam. Weddings are avoided entirely.' },
  { cls: 'some', label: 'Sep 2026', head: 'A handful', note: 'Bhadrapada into Ashwin. Around seven dates by most panchangams.' },
  { cls: 'some', label: 'Oct 2026', head: 'Very few', note: 'Pitru Paksha and Sharad Navratri take out most of the month.' },
  { cls: 'peak', label: 'Nov 2026', head: 'Season opens', note: 'Kartika into Margashirsha. The city starts filling up.' },
  { cls: 'peak', label: 'Dec 2026', head: 'Busy', note: 'Margashirsha into Pushya. Best weather of the year.' },
  { cls: 'peak', label: 'Jan 2027', head: 'Busy', note: 'Pushya. Halls quote their highest rates around now.' },
  { cls: 'peak', label: 'Feb 2027', head: 'Busy', note: 'Magha. Peak of the whole season in Hyderabad.' },
  { cls: 'peak', label: 'Mar 2027', head: 'Season closes', note: 'Phalguna. The last stretch before the heat.' },
]

const REASONS: { tag: string; head: string; body: string }[] = [
  { tag: 'July and August', head: 'Ashada masam', body: 'Chaturmasam, when Vishnu is said to sleep. No auspicious ceremonies at all. This is the long gap every family plans around.' },
  { tag: 'Usually September or October', head: 'Pitru Paksha', body: 'A fortnight kept for remembering ancestors. Sharad Navratri follows close behind, which is why October runs so thin.' },
  { tag: 'Some years only', head: 'Adhika masam', body: 'The extra lunar month that appears every few years. When it falls, it is treated as inauspicious for marriage throughout.' },
]

const CHECKS: [string, string][] = [
  ['Both nakshatras', 'The birth stars of the bride and groom, matched against each other.'],
  ['Tithi and vara', 'The lunar day and the weekday. Tuesday and Saturday are generally set aside.'],
  ['The lagna', 'The ascendant at the moment of the ceremony. This is what fixes the hour, not just the day.'],
  ['Rahu kalam', 'The inauspicious window of each day, worked around when the timing is set.'],
]

const ASKS: [string, string][] = [
  ['Ask your priest', 'Which two or three dates work, in order of preference?'],
  ['Ask your priest', 'How wide is the muhurtham window on each one?'],
  ['Ask the venue', 'What does this date cost against a Tuesday that month?'],
  ['Ask the venue', 'Is the rate different for a morning muhurtham?'],
]

const FAQ: [string, string][] = [
  ['Why do two panchangams give different dates?', 'They use different calculation traditions and are set for different locations. A date computed for Hyderabad will not always match one computed elsewhere. Follow the panchangam your family has always used.'],
  ['Can we marry during Ashada masam anyway?', 'Some families do, usually for practical reasons. It is a family decision rather than a rule, but expect resistance from elders and expect the priest to say no.'],
  ['Do we need horoscope matching before fixing a date?', 'Most Telugu families do the matching first, then choose the muhurtham. The nakshatras of both people feed directly into which dates are considered suitable.'],
  ['How early should we book the hall?', 'Six months for a peak date between November and March. Outside the season you can move faster, though the popular convention centres still go early.'],
  ['Is a morning or evening muhurtham better?', 'Neither is inherently better. The lagna decides it. Morning muhurthams often cost less at venues that can then take a second function the same evening.'],
]

const CSS = `
.mhArt{
  --paper:#FFFFFF;
  --ink:#1A1719;
  --pink:var(--color-magenta,#E91E78);
  --yellow:var(--color-mustard,#D4A017);
  --card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;
  --body:'Inter',system-ui,-apple-system,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --rule:rgba(26,23,25,.16);
  --muted:rgba(26,23,25,.60);
  --wrap:1080px;
  background:var(--paper);color:var(--ink);
  font-family:var(--body);font-size:17px;line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
.mhArt *{box-sizing:border-box;margin:0;padding:0}
.mhArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.mhArt section{padding:64px 0}
.mhArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.mhArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.mhArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.mhArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.mhArt .hero{position:relative;min-height:min(90vh,780px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.mhArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.mhArt .scrim{position:relative;z-index:2;width:100%;padding:220px 0 68px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.mhArt .hero .eyebrow{color:var(--yellow)}
.mhArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.4vw,78px);line-height:.98;letter-spacing:-.042em;max-width:13ch}
.mhArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:38ch;color:rgba(255,255,255,.86)}
.mhArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.mhArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.mhArt .legend{display:flex;flex-wrap:wrap;gap:20px;margin-top:26px;font-size:14px;color:var(--muted)}
.mhArt .legend i{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:8px;vertical-align:-2px}
.mhArt .key-peak{background:var(--yellow)}
.mhArt .key-some{background:#fff;border:2px solid var(--pink)}
.mhArt .key-shut{background:var(--ink)}
.mhArt .months{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:26px}
.mhArt .mo{border-radius:14px;padding:22px 20px;min-height:158px;display:flex;flex-direction:column}
.mhArt .mo b{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
.mhArt .mo strong{display:block;font-size:21px;font-weight:700;margin-top:8px;letter-spacing:-.01em}
.mhArt .mo span{display:block;font-size:14px;margin-top:auto;padding-top:14px;line-height:1.45}
.mhArt .peak{background:var(--yellow);color:var(--ink)}
.mhArt .peak span{color:rgba(26,23,25,.72)}
.mhArt .some{background:#fff;border:2px solid var(--pink);color:var(--ink)}
.mhArt .some span{color:var(--muted)}
.mhArt .shut{background:var(--ink);color:#fff}
.mhArt .shut span{color:rgba(255,255,255,.66)}
.mhArt .reasons{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}
.mhArt .reason{border:1.5px solid var(--rule);border-radius:14px;padding:24px}
.mhArt .reason h3{margin-bottom:8px}
.mhArt .reason p{font-size:15px;color:var(--muted)}
.mhArt .reason .tag{font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);display:block;margin-bottom:10px}
.mhArt .steps{margin-top:30px;border-top:1.5px solid var(--rule)}
.mhArt .step{display:grid;grid-template-columns:78px 1fr;gap:26px;align-items:baseline;padding:24px 0;border-bottom:1.5px solid var(--rule)}
.mhArt .num{font-family:var(--display);font-size:44px;font-weight:700;letter-spacing:-.03em;color:var(--pink);line-height:1}
.mhArt .step h3{margin-bottom:5px}
.mhArt .step p{font-size:15.5px;color:var(--muted)}
.mhArt .cost{background:var(--pink);color:#fff}
.mhArt .cost .eyebrow{color:rgba(255,255,255,.72)}
.mhArt .cost h2{color:#fff}
.mhArt .cost .lede{color:rgba(255,255,255,.8)}
.mhArt .money{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.mhArt .money div{border-top:2px solid rgba(255,255,255,.3);padding-top:16px}
.mhArt .money b{display:block;font-family:var(--mono);font-size:clamp(28px,4.2vw,40px);font-weight:500;letter-spacing:-.03em}
.mhArt .money span{display:block;font-size:14px;color:rgba(255,255,255,.72);margin-top:6px}
.mhArt .ask{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:30px}
.mhArt .q{border:1.5px solid var(--rule);border-radius:14px;padding:20px 22px;font-size:16px}
.mhArt .q em{display:block;font-style:normal;font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin-bottom:8px}
.mhArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.mhArt details:first-of-type{border-top:1.5px solid var(--rule)}
.mhArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.mhArt summary::-webkit-details-marker{display:none}
.mhArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.mhArt details[open] summary::after{content:"\\2212"}
.mhArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.mhArt .cta{background:var(--ink);color:#fff;text-align:center}
.mhArt .cta h2{color:#fff;max-width:20ch;margin:0 auto}
.mhArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.mhArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .mhArt .hero{min-height:min(94vh,720px)}
  .mhArt .scrim{padding:260px 0 52px}
  .mhArt .months{grid-template-columns:repeat(2,1fr)}
  .mhArt .reasons,.mhArt .ask,.mhArt .money{grid-template-columns:1fr}
  .mhArt .money{gap:22px}
  .mhArt .step{grid-template-columns:56px 1fr;gap:16px}
  .mhArt .num{font-size:34px}
}
@media (prefers-reduced-motion:reduce){.mhArt *{transition:none!important}}
`

export default function MuhurthamDates2026() {
  return (
    <div className="mhArt">
      <style>{CSS}</style>

      <header className="hero">
        <img
          className="heroImg"
          src="/articles/muhurtham-dates-hero.jpg"
          alt="A Telugu wedding ceremony at the muhurtham"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Muhurtham · 2026 to 2027</div>
            <h1>Pick the date first</h1>
            <p>Every other decision hangs off it. Here is which months are open, which are shut, and what the date does to your bill.</p>
            <div className="chips">
              <span className="chip">No dates in Ashada</span>
              <span className="chip">Nov to Mar is peak</span>
              <span className="chip">Book 6 months out</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">Year at a glance</div>
          <h2>August 2026 to March 2027</h2>
          <p className="lede">Availability by month. Your exact tithi comes from your panchangam, not from this page.</p>
          <div className="legend">
            <span>
              <i className="key-peak" />
              Peak season
            </span>
            <span>
              <i className="key-some" />
              Limited dates
            </span>
            <span>
              <i className="key-shut" />
              No muhurthams
            </span>
          </div>
          <div className="months">
            {MONTHS.map((m) => (
              <div className={`mo ${m.cls}`} key={m.label}>
                <b>{m.label}</b>
                <strong>{m.head}</strong>
                <span>{m.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Why months close</div>
          <h2>Three things that empty the calendar</h2>
          <div className="reasons">
            {REASONS.map((r) => (
              <div className="reason" key={r.head}>
                <span className="tag">{r.tag}</span>
                <h3>{r.head}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">How a date is chosen</div>
          <h2>Four things your priest checks</h2>
          <div className="steps">
            {CHECKS.map(([head, body], i) => (
              <div className="step" key={head}>
                <div className="num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3>{head}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cost">
        <div className="wrap">
          <div className="eyebrow">The part nobody mentions</div>
          <h2>Your date sets your budget</h2>
          <p className="lede">Every Telugu family in Hyderabad is reading the same panchangam. Demand lands on the same forty or fifty days, and halls price accordingly.</p>
          <div className="money">
            <div>
              <b>15 to 20%</b>
              <span>Typical saving on a weekday or non-muhurtham date</span>
            </div>
            <div>
              <b>6 months</b>
              <span>How far ahead the good halls go on peak dates</span>
            </div>
            <div>
              <b>2 to 3</b>
              <span>Dates to get from your priest, not one</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">Before you call the venue</div>
          <h2>Ask for options, not an answer</h2>
          <p className="lede">The single most useful thing you can do is walk out of the priest's house with a shortlist.</p>
          <div className="ask">
            {ASKS.map(([who, q], i) => (
              <div className="q" key={i}>
                <em>{who}</em>
                {q}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Quick answers</div>
          <h2>Still wondering</h2>
          <div style={{ marginTop: 26 }}>
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Got your dates? Find the hall next</h2>
          <Link to="/">Browse Hyderabad venues on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">
          Month by month availability is drawn from Telugu panchangam sources and reflects the pattern they agree on.
          Specific tithis and timings vary between panchangams and depend on both horoscopes, so treat this as a planning
          guide and confirm every date with your family priest before booking anything.
        </p>
      </div>
    </div>
  )
}

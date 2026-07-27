import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "How much does a wedding cost in Hyderabad?".
 *
 * Self-contained designed article. CSS scoped under `.cwArt`; palette mapped to
 * Pellikart theme tokens. The guest-count slider + tier picker + line-item
 * estimator are React state.
 *
 * The estimator is arithmetic on the ranges shown in the rate table, not a
 * quotation. `venue`, `mehendi`, `music`, `priest`, `cards` and `misc` are
 * placeholder figures — overwrite with real vendor quotes when you have them.
 *
 * Hero image: /public/articles/wedding-cost-hero.jpg (self-hides if missing).
 */

type Tier = 'budget' | 'mid' | 'premium'
type Rate = { plate: number; venue: number; photo: number; makeup: number; decor: number; mehendi: number; music: number; priest: number; cards: number; misc: number }

const RATES: Record<Tier, Rate> = {
  budget:  { plate: 600,  venue: 100000, photo: 40000,  makeup: 12000, decor: 60000,  mehendi: 8000,  music: 15000, priest: 8000,  cards: 15000, misc: 40000 },
  mid:     { plate: 1000, venue: 250000, photo: 90000,  makeup: 28000, decor: 250000, mehendi: 20000, music: 40000, priest: 15000, cards: 35000, misc: 90000 },
  premium: { plate: 1800, venue: 550000, photo: 200000, makeup: 50000, decor: 500000, mehendi: 40000, music: 90000, priest: 25000, cards: 75000, misc: 200000 },
}

const TIERS: [Tier, string][] = [
  ['budget', 'Simple'],
  ['mid', 'Mid range'],
  ['premium', 'Premium'],
]

// [label, rate key, per-guest?, note]
const LABELS: [string, keyof Rate, boolean, string][] = [
  ['Catering', 'plate', true, 'per plate'],
  ['Venue', 'venue', false, 'hall and hire'],
  ['Photography and video', 'photo', false, 'one day'],
  ['Decor and flowers', 'decor', false, ''],
  ['Bridal makeup', 'makeup', false, 'all functions'],
  ['Mehendi artist', 'mehendi', false, ''],
  ['Music and sound', 'music', false, ''],
  ['Purohit', 'priest', false, ''],
  ['Invitation cards', 'cards', false, ''],
  ['Everything else', 'misc', false, 'transport, gifts, extras'],
]

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const lakh = (n: number) =>
  n >= 100000 ? '₹' + (n / 100000).toFixed(n >= 1000000 ? 1 : 2) + ' lakh' : inr(n)

const RATE_TABLE: [string, string, string][] = [
  ['Catering', '₹600 to ₹2,000 per plate', 'A biryani inclusive menu adds ₹150 to ₹300 over a standard vegetarian buffet. Ask whether the hall charges a kitchen royalty on outside caterers.'],
  ['Photography', '₹30,000 to ₹1,25,000 per day', 'That is the spread across listed Hyderabad studios. Seasoned names run ₹50,000 to ₹2,50,000. A four hour small function sits between ₹12,000 and ₹1,00,000.'],
  ['Bridal makeup', '₹8,000 to ₹50,000', 'Basic ₹8,000 to ₹15,000. Professional packages ₹15,000 to ₹30,000. HD ₹20,000 to ₹40,000. Airbrush ₹25,000 to ₹50,000 and up.'],
  ['Decor', '₹10,000 to ₹5,00,000', 'Small functions ₹10,000 to ₹20,000. A grand wedding runs ₹2 to ₹5 lakh. Budget roughly 10 to 15 percent of your total for decor.'],
  ['Flowers', '₹1.5 to ₹8 lakh', 'Usually quoted inside the decor number. Marigold sits near ₹80 a kilo, imported hydrangea crosses ₹350 a stem. Ask for the split.'],
  ['Album', '₹25,000 to ₹60,000', 'A 30 page mid tier album costs the studio ₹8,000 to ₹15,000 to produce. Worth knowing before you agree to the upgrade.'],
]

const SPLIT: [string, string][] = [
  ['₹1.45L', 'Mandap'],
  ['₹1.10L', 'Reception backdrop'],
  ['₹62,000', 'Centrepieces across 42 tables'],
  ['₹55,000', 'Entrance'],
  ['₹38,000', 'Haldi and mehendi'],
  ['₹4.6L', 'Total flowers alone'],
]

const TRAPS: [string, string][] = [
  ['The date itself', 'Everyone is reading the same panchangam. A weekday or a non muhurtham date can usually be negotiated 15 to 20 percent lower.'],
  ['Kitchen royalty', 'Many halls charge per plate for letting you bring your own caterer. Get the figure in writing before the advance.'],
  ['Drone and second shooter', 'Assumed by the family, priced separately by the studio. On the day only one photographer arrives.'],
  ['Rigging, not flowers', 'A ₹3.5 lakh hanging installation might hold ₹90,000 of flowers. The rest is scaffolding and labour. Ask for the internal split.'],
  ['Album page count', 'The brochure photos suggest 60 pages. The contract says 30. Check the number, not the pictures.'],
  ['Outstation travel', 'If any vendor travels, expect ₹50,000 to ₹2.5 lakh added depending on crew size and destination.'],
]

const FAQ: [string, string][] = [
  ['What does a typical Hyderabad wedding cost in total?', 'Published estimates put a mid range wedding of 300 to 500 guests at ₹10 to ₹20 lakh, and a 500 guest wedding at ₹15 to ₹30 lakh. The spread is wide because catering and decor scale with guests while photography and makeup do not.'],
  ['What is the single biggest line item?', 'Catering, on almost every wedding. At ₹1,000 a plate, cutting 100 guests saves you a lakh before anything else changes.'],
  ['How much should decor be?', 'Roughly 10 to 15 percent of the total budget is the usual guidance. If a decor quote is running past a fifth of your budget, something inside it needs itemising.'],
  ['How early do I need to book?', 'Six months for a peak muhurtham date between November and March. Decorators are usually recommended at least two months ahead, and popular ones go earlier in season.'],
  ['Is a cheaper photographer a false economy?', 'Compare the deliverable, not the day rate. Budget tier delivers 200 to 400 edited photos, mid tier 600 to 1,200, premium 1,500 to 3,000. Below 400 for a full wedding feels thin later.'],
]

const CSS = `
.cwArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.cwArt *{box-sizing:border-box;margin:0;padding:0}
.cwArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.cwArt section{padding:64px 0}
.cwArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.cwArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.cwArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.cwArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.cwArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.cwArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.cwArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.cwArt .hero .eyebrow{color:var(--yellow)}
.cwArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.2vw,76px);line-height:.99;letter-spacing:-.042em;max-width:15ch}
.cwArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:40ch;color:rgba(255,255,255,.86)}
.cwArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.cwArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.cwArt .calc{background:var(--ink);color:#fff}
.cwArt .calc .eyebrow{color:var(--yellow)}
.cwArt .calc h2{color:#fff}
.cwArt .calc .lede{color:rgba(255,255,255,.72)}
.cwArt .controls{display:grid;grid-template-columns:1.3fr 1fr;gap:34px;margin-top:34px;align-items:start}
.cwArt .ctrl label{display:block;font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:14px}
.cwArt .guestNum{font-family:var(--mono);font-size:clamp(34px,5vw,46px);color:var(--yellow);line-height:1;margin-bottom:16px}
.cwArt input[type=range]{width:100%;accent-color:var(--yellow);height:26px;cursor:pointer}
.cwArt .tierBtns{display:flex;gap:8px;flex-wrap:wrap}
.cwArt .tierBtn{border:1.5px solid rgba(255,255,255,.28);background:transparent;color:#fff;border-radius:999px;padding:11px 20px;cursor:pointer;font:inherit;font-size:15px;transition:.15s}
.cwArt .tierBtn:hover{border-color:#fff}
.cwArt .tierBtn[aria-pressed="true"]{background:var(--yellow);border-color:var(--yellow);color:var(--ink);font-weight:600}
.cwArt .rows{margin-top:38px;border-top:1px solid rgba(255,255,255,.2)}
.cwArt .row{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:baseline;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.cwArt .row span{color:rgba(255,255,255,.82);font-size:16px}
.cwArt .row em{font-style:normal;font-size:13px;color:rgba(255,255,255,.45);margin-left:8px}
.cwArt .row b{font-family:var(--mono);font-size:17px;font-weight:500}
.cwArt .total{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:baseline;padding:22px 0 0;border-top:2px solid var(--yellow);margin-top:6px}
.cwArt .total span{font-size:19px;font-weight:700}
.cwArt .total b{font-family:var(--mono);font-size:clamp(28px,4.4vw,40px);color:var(--yellow);font-weight:500;letter-spacing:-.02em}
.cwArt .excl{margin-top:24px;font-size:14px;color:rgba(255,255,255,.55);line-height:1.6}
.cwArt .rates{margin-top:32px;border-top:2px solid var(--ink)}
.cwArt .rate{display:grid;grid-template-columns:1.15fr .95fr 1.5fr;gap:20px;padding:20px 0;border-bottom:1.5px solid var(--rule);align-items:baseline}
.cwArt .rate h3{font-size:17px}
.cwArt .rate .fig{font-family:var(--mono);font-size:17px;font-weight:500;color:var(--pink)}
.cwArt .rate p{font-size:14.5px;color:var(--muted);line-height:1.5}
.cwArt .real{background:var(--yellow)}
.cwArt .real .eyebrow{color:rgba(26,23,25,.65)}
.cwArt .real .lede{color:rgba(26,23,25,.72);max-width:56ch}
.cwArt .split{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
.cwArt .bit{background:rgba(255,255,255,.55);border-radius:12px;padding:20px}
.cwArt .bit b{display:block;font-family:var(--mono);font-size:24px;letter-spacing:-.02em;font-weight:500}
.cwArt .bit span{display:block;font-size:14px;color:rgba(26,23,25,.68);margin-top:5px}
.cwArt .traps{background:var(--pink);color:#fff}
.cwArt .traps .eyebrow{color:rgba(255,255,255,.72)}
.cwArt .traps h2{color:#fff}
.cwArt .traps .lede{color:rgba(255,255,255,.82)}
.cwArt .trapGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:32px}
.cwArt .trap{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.cwArt .trap h3{margin-bottom:7px}
.cwArt .trap p{font-size:15px;color:rgba(255,255,255,.8)}
.cwArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.cwArt details:first-of-type{border-top:1.5px solid var(--rule)}
.cwArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.cwArt summary::-webkit-details-marker{display:none}
.cwArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.cwArt details[open] summary::after{content:"\\2212"}
.cwArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.cwArt .cta{background:var(--ink);color:#fff;text-align:center}
.cwArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.cwArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.cwArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .cwArt .hero{min-height:min(92vh,700px)}
  .cwArt .scrim{padding:250px 0 52px}
  .cwArt .controls,.cwArt .split,.cwArt .trapGrid{grid-template-columns:1fr}
  .cwArt .controls{gap:28px}
  .cwArt .rate{grid-template-columns:1fr;gap:6px}
  .cwArt .rate .fig{font-size:19px}
}
@media (prefers-reduced-motion:reduce){.cwArt *{transition:none!important}}
`

export default function HyderabadWeddingCost() {
  const [guests, setGuests] = useState(400)
  const [tier, setTier] = useState<Tier>('mid')
  const r = RATES[tier]

  const rows = LABELS.map(([name, key, perGuest, note]) => ({
    name,
    note,
    value: r[key] * (perGuest ? guests : 1),
  }))
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <div className="cwArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/wedding-cost-hero.jpg" alt="A wedding reception at a Hyderabad convention centre" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Budget · Hyderabad</div>
            <h1>What a wedding in Hyderabad actually costs</h1>
            <p>Vendor by vendor, with real 2026 rates. Move the slider to your guest count.</p>
            <div className="chips">
              <span className="chip">₹600 to ₹2,000 a plate</span>
              <span className="chip">Photographer from ₹30,000</span>
              <span className="chip">15 to 20% off a weekday</span>
            </div>
          </div>
        </div>
      </header>

      <section className="calc">
        <div className="wrap">
          <div className="eyebrow">Estimator</div>
          <h2>Your number, not an average</h2>
          <p className="lede">Guest count drives catering, which is the largest single line on almost every Hyderabad wedding.</p>

          <div className="controls">
            <div className="ctrl">
              <label htmlFor="cw-g">Guests</label>
              <div className="guestNum">{guests.toLocaleString('en-IN')}</div>
              <input type="range" id="cw-g" min={100} max={1000} step={25} value={guests} onChange={(e) => setGuests(+e.target.value)} />
            </div>
            <div className="ctrl">
              <label>Standard</label>
              <div className="tierBtns">
                {TIERS.map(([t, label]) => (
                  <button key={t} className="tierBtn" aria-pressed={tier === t} onClick={() => setTier(t)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="rows">
            {rows.map((row) => (
              <div className="row" key={row.name}>
                <span>{row.name}{row.note && <em>{row.note}</em>}</span>
                <b>{inr(row.value)}</b>
              </div>
            ))}
          </div>
          <div className="total"><span>Estimated total</span><b>{lakh(total)}</b></div>
          <p className="excl">Not included: jewellery, the bride’s and groom’s outfits, honeymoon, gifts, and travel or stay for outstation guests. Those four routinely add as much again.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">The rates</div>
          <h2>What each vendor charges</h2>
          <p className="lede">Published Hyderabad market ranges for 2026. Use them to sanity check a quote, not as a fixed price list.</p>
          <div className="rates">
            {RATE_TABLE.map(([name, fig, body]) => (
              <div className="rate" key={name}>
                <h3>{name}</h3>
                <div className="fig">{fig}</div>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="real">
        <div className="wrap">
          <div className="eyebrow">A real Hyderabad wedding</div>
          <h2>Where ₹4.6 lakh of flowers went</h2>
          <p className="lede">400 guests, three functions. This is the actual split, and it is the clearest picture anywhere of how decor money disappears.</p>
          <div className="split">
            {SPLIT.map(([fig, label]) => (
              <div className="bit" key={label}><b>{fig}</b><span>{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="traps">
        <div className="wrap">
          <div className="eyebrow">Read the quote twice</div>
          <h2>Five ways the number grows</h2>
          <p className="lede">None of these are scams. They are all things families assume are included and then find are not.</p>
          <div className="trapGrid">
            {TRAPS.map(([head, body]) => (
              <div className="trap" key={head}><h3>{head}</h3><p>{body}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">Quick answers</div>
          <h2>Still wondering</h2>
          <div style={{ marginTop: 26 }}>
            {FAQ.map(([q, a], i) => (
              <details key={i}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Get real quotes instead of ranges</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Rates are compiled from published Hyderabad vendor listings and 2026 cost guides. Prices move with season, muhurtham date and vendor reputation, and every quote should be confirmed directly. The estimator is arithmetic on the ranges shown above, not a quotation.</p>
      </div>
    </div>
  )
}

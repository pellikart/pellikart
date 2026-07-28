import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Kashi Yatra checklist: everything you need before the priest asks".
 *
 * Self-contained designed article. CSS scoped under `.kyArt`; palette mapped to
 * Pellikart theme tokens. The side filter (groom / bride / priest) + tap-to-tick
 * 24-item checklist + live "ready" counter are React state, and the checklist is
 * printable (a scoped `@media print` block hides everything but the items).
 * Telugu script uses the --telugu font stack (Noto Sans Telugu global).
 *
 * Hero image: /public/articles/kashi-yatra-hero.jpg (self-hides if missing).
 */

const Te = ({ children }: { children: React.ReactNode }) => (
  <span className="te" lang="te">{children}</span>
)

type Side = 'groom' | 'bride' | 'other'
type Item = { title: React.ReactNode; note: string; opt?: boolean }
type Group = { label: string; key: Side; items: Item[] }

const GROUPS: Group[] = [
  {
    label: "Groom's side",
    key: 'groom',
    items: [
      { title: <><Te>గొడుగు</Te> Traditional umbrella</>, note: 'Protection on the journey. Plain is preferred over decorative.' },
      { title: <><Te>కర్ర</Te> Wooden walking stick</>, note: "Discipline and support on the seeker's path. Simple, not ornamental." },
      { title: 'Holy book', note: 'Bhagavad Gita, Ramayana or the Vedas. The pursuit of knowledge.' },
      { title: 'Slippers or sandals', note: 'The symbolic pilgrimage begins on foot. Carried by the groom himself.' },
      { title: <><Te>అంగవస్త్రం</Te> Angavastram</>, note: 'The shawl over the shoulder. Traditional attire for the ritual.' },
    ],
  },
  {
    label: "Bride's side",
    key: 'bride',
    items: [
      { title: <><Te>అక్షతలు</Te> Akshatalu</>, note: 'Turmeric coated rice. Showered on the groom as a blessing of prosperity.' },
      { title: <><Te>కొబ్బరికాయ</Te> Coconut</>, note: 'Purity and completeness. The most sacred of offerings.' },
      { title: <><Te>తమలపాకులు</Te> Betel leaves</>, note: 'Prosperity, hospitality and respect.' },
      { title: <><Te>వక్కలు</Te> Betel nuts</>, note: 'Offered alongside the leaves. Buy both together.' },
      { title: <><Te>పూలు</Te> Fresh flowers</>, note: 'Purity and new beginnings. Same morning only.' },
      { title: 'Flower garland', note: 'Used during the ritual in some families.', opt: true },
      { title: <><Te>దీపం</Te> Deepam</>, note: 'The lamp. Darkness removed, the divine present.' },
      { title: <><Te>కర్పూరం</Te> Camphor</>, note: 'For the aarti at the close.' },
      { title: <><Te>కుంకుమ</Te> Kumkum</>, note: 'Applied during the blessings.' },
      { title: <><Te>పసుపు</Te> Turmeric</>, note: 'Auspiciousness. Keep it separate from the kumkum.' },
      { title: <><Te>గంధం</Te> Sandalwood paste</>, note: 'Applied to the forehead during the ritual.' },
      { title: <><Te>పండ్లు</Te> Fruits</>, note: 'Offered during the pooja and shared afterwards.' },
      { title: 'Sweets', note: 'Naivedyam. Whatever your family traditionally offers.' },
      { title: 'Water vessel', note: 'For the ritual purification and the washing of feet.' },
      { title: <><Te>పూజ పళ్ళెం</Te> Pooja thali</>, note: 'Holds everything above. Assemble it the night before.' },
      { title: <><Te>దక్షిణ</Te> Dakshina</>, note: 'The offering to the priest. Counted, in an envelope, ready.' },
    ],
  },
  {
    label: 'Priest and venue',
    key: 'other',
    items: [
      { title: <><Te>ముహూర్తం</Te> Muhurtham details</>, note: 'The purohit needs the timings in hand. Send them ahead of the day.' },
      { title: <><Te>పీట</Te> Peeta stool</>, note: 'A low stool for the groom. The venue usually provides it, so confirm.' },
      { title: 'Nadaswaram or recorded music', note: 'Lifts the whole ritual. Brief whoever is handling sound.', opt: true },
    ],
  },
]

const FILTERS: [Side | 'all', string][] = [
  ['all', 'Everything'],
  ['groom', "Groom's side"],
  ['bride', "Bride's side"],
  ['other', 'Priest and venue'],
]

const MISTAKES: [string, string][] = [
  ['The umbrella, left to the last minute', 'It is the most visible item in the ritual and the one most often bought that morning in a panic.'],
  ['A decorative walking stick', 'A plain traditional one is the point. An ornamental stick undercuts the whole idea of renouncing comfort.'],
  ['Assuming every priest wants the same list', 'Communities and families differ. Send your purohit this list and ask what to add or drop.'],
  ['Pooja items scattered across four bags', 'Everything on one tray before the ceremony starts, or somebody will be hunting for camphor mid ritual.'],
  ['Flowers bought too early', 'They wilt. Same morning only, and keep them out of the sun at the venue.'],
  ['No dakshina ready', 'Counted, in an envelope, handed to someone who is not the groom. He has his hands full.'],
]

const TIMELINE: [string, string[]][] = [
  ['One week before', ['Buy the umbrella and the walking stick', 'Buy the holy book if your family uses one', 'Send this list to your purohit and confirm it', 'Set aside the angavastram']],
  ['The day before', ['Arrange all pooja materials on one tray', 'Buy fruits and sweets', 'Pack into labelled trays or baskets', 'Count the dakshina into an envelope']],
  ['One hour before', ['Umbrella, stick, slippers and book beside the groom', 'Fresh flowers collected and shaded', 'Pooja tray checked against this list', 'Confirm with the purohit that nothing is missing']],
]

const FAQ: [React.ReactNode, React.ReactNode][] = [
  ['Can we use any umbrella?', 'A plain traditional one is preferred. Decorated versions are sold as part of ready made sets and most families are fine with those, but ask your purohit if yours is particular.'],
  [(<>Does every Telugu wedding include <Te>కాశీ యాత్ర</Te>?</>), 'No. It is common across many Telugu communities but some families skip it entirely. It is also the ritual guests remember best, which is why most keep it.'],
  ['Can it be done indoors?', 'Yes. Most weddings now perform it inside the venue, with the groom walking towards the entrance rather than out onto the road.'],
  ['Who stops the groom?', "Traditionally the bride's father. In some families her brother does it instead, and in some Reddy weddings her mother. Confirm which applies to you and tell the photographer, because it changes where they need to stand."],
  ['Can we buy it all as one set?', 'Pooja and wedding supply shops sell a ready made Kasi yatra set with the umbrella, fan, stick and sandals together. The pooja items, fruits, sweets and flowers you still assemble yourself.'],
  ['How long does it take?', 'Under half an hour including the walk out, the persuasion, the blessings and the return. Treat it as a breather between the heavier rituals.'],
]

const CSS = `
.kyArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.kyArt *{box-sizing:border-box;margin:0;padding:0}
.kyArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.kyArt section{padding:64px 0}
.kyArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.kyArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.kyArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.kyArt .lede{color:var(--muted);max-width:54ch;margin-top:10px}
.kyArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.kyArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 36%;display:block}
.kyArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.kyArt .hero .eyebrow{color:var(--yellow)}
.kyArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(30px,4.4vw,50px);line-height:1.1;letter-spacing:-.032em;max-width:24ch}
.kyArt .hero h1 .te{font-family:var(--telugu);letter-spacing:-.01em}
.kyArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:42ch;color:rgba(255,255,255,.86)}
.kyArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.kyArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.kyArt .what{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:28px}
.kyArt .what p{font-size:16.5px;color:var(--muted)}
.kyArt .what p strong{color:var(--ink)}
.kyArt .bar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-top:26px}
.kyArt .f{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:10px 18px;cursor:pointer;font:inherit;font-size:15px;transition:.15s}
.kyArt .f:hover{border-color:var(--ink)}
.kyArt .f[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.kyArt .printBtn{margin-left:auto;border:1.5px solid var(--pink);background:var(--pink);color:#fff;border-radius:999px;padding:10px 20px;cursor:pointer;font:inherit;font-size:15px;font-weight:600;transition:.15s}
.kyArt .printBtn:hover{background:var(--ink);border-color:var(--ink)}
.kyArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:18px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.kyArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.kyArt .grp{margin-top:32px}
.kyArt .grp > h3{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--pink);margin-bottom:14px;font-weight:400}
.kyArt .items{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kyArt .item{border:1.5px solid var(--rule);border-radius:14px;padding:18px 20px;display:flex;gap:13px;align-items:flex-start;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:.15s}
.kyArt .item:hover{border-color:var(--ink)}
.kyArt .item[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.kyArt .item[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.kyArt .item[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.kyArt .tick{flex:0 0 24px;height:24px;border:2px solid var(--rule);border-radius:7px;display:grid;place-items:center;font-size:13px;font-weight:700;color:transparent;transition:.15s}
.kyArt .item strong{display:block;font-size:16px;line-height:1.35}
.kyArt .item .te{font-family:var(--telugu);font-weight:600}
.kyArt .item small{display:block;margin-top:4px;font-size:13.5px;color:var(--muted);line-height:1.45}
.kyArt .opt strong::after{content:"if followed";font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--pink);border:1px solid var(--pink);border-radius:4px;padding:1px 5px;margin-left:7px;vertical-align:2px}
.kyArt .item[aria-pressed="true"].opt strong::after{color:var(--yellow);border-color:var(--yellow)}
.kyArt .miss{background:var(--pink);color:#fff}
.kyArt .miss .eyebrow{color:rgba(255,255,255,.72)}
.kyArt .miss h2{color:#fff}
.kyArt .miss .lede{color:rgba(255,255,255,.84)}
.kyArt .mgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:32px}
.kyArt .m{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.kyArt .m strong{display:block;font-size:16.5px;margin-bottom:6px}
.kyArt .m span{display:block;font-size:15px;color:rgba(255,255,255,.8);line-height:1.5}
.kyArt .when{background:var(--yellow)}
.kyArt .when .eyebrow{color:rgba(26,23,25,.65)}
.kyArt .when .lede{color:rgba(26,23,25,.72)}
.kyArt .tl{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
.kyArt .t{background:rgba(255,255,255,.55);border-radius:12px;padding:24px}
.kyArt .t b{display:block;font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin-bottom:12px}
.kyArt .t ul{list-style:none}
.kyArt .t li{padding:7px 0 7px 18px;position:relative;font-size:15.5px;line-height:1.45}
.kyArt .t li::before{content:"";position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:50%;background:var(--ink)}
.kyArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.kyArt details:first-of-type{border-top:1.5px solid var(--rule)}
.kyArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.kyArt summary .te{font-family:var(--telugu);font-weight:600}
.kyArt summary::-webkit-details-marker{display:none}
.kyArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.kyArt details[open] summary::after{content:"\\2212"}
.kyArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.kyArt .cta{background:var(--ink);color:#fff;text-align:center}
.kyArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.kyArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.kyArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
.kyArt .printHead{display:none}
@media (max-width:880px){
  .kyArt .hero{min-height:min(92vh,700px)}
  .kyArt .scrim{padding:250px 0 52px}
  .kyArt .what,.kyArt .items,.kyArt .mgrid,.kyArt .tl{grid-template-columns:1fr}
  .kyArt .printBtn{margin-left:0;width:100%;margin-top:6px}
}
@media (prefers-reduced-motion:reduce){.kyArt *{transition:none!important}}
@media print{
  .kyArt .hero,.kyArt .miss,.kyArt .when,.kyArt .cta,.kyArt .src,.kyArt details,.kyArt .bar,.kyArt .counter,.kyArt .intro,.kyArt .credit{display:none!important}
  .kyArt section{padding:0}
  .kyArt .items{display:block}
  .kyArt .item{display:block;border:0;border-bottom:1px solid #999;border-radius:0;padding:7px 0 7px 26px;position:relative;background:#fff!important;color:#000!important}
  .kyArt .item::before{content:"";position:absolute;left:0;top:9px;width:13px;height:13px;border:1.5px solid #000}
  .kyArt .item .tick{display:none}
  .kyArt .item small{color:#444!important;font-size:10pt}
  .kyArt .grp > h3{color:#000;margin-top:16px}
  .kyArt .printHead{display:block!important;margin-bottom:14px}
}
`

export default function KashiYatraChecklist() {
  const [filter, setFilter] = useState<Side | 'all'>('all')
  const [ticked, setTicked] = useState<Record<string, boolean>>({})

  const match = (key: Side) => filter === 'all' || key === filter
  const shownKeys = GROUPS.flatMap((g, gi) =>
    match(g.key) ? g.items.map((_, ii) => `${gi}-${ii}`) : [],
  )
  const done = shownKeys.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className="kyArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/kashi-yatra-hero.jpg" alt="The groom setting off with umbrella and walking stick during Kashi Yatra" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Ceremony guide · 07 of 19</div>
            <h1>Planning a Telugu wedding? Here is everything you will need for <Te>కాశీ యాత్ర</Te> before the priest asks for it.</h1>
            <p>All 24 items, what each one means, and which family is supposed to bring it.</p>
            <div className="chips">
              <span className="chip">24 items</span>
              <span className="chip">Split by family</span>
              <span className="chip">Printable</span>
            </div>
          </div>
        </div>
      </header>

      <section className="intro">
        <div className="wrap">
          <div className="eyebrow">What it is</div>
          <h2>A staged argument about how to live</h2>
          <div className="what">
            <p>The groom announces he is giving up worldly life and leaving for Kashi to pursue knowledge. Umbrella up, stick in hand, bag on the shoulder, he heads for the door.</p>
            <p><strong>The bride’s father stops him.</strong> He argues that the householder’s life is also a sacred path, and offers his daughter’s hand. The groom accepts and turns back. Played for laughs today, but the choice underneath it is a real one.</p>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>Everything you need, and who brings it</h2>
          <p className="lede">Filter to your side of the family. Tap to tick off. Print it and hand it to whoever is doing the shopping.</p>

          <div className="bar">
            {FILTERS.map(([w, label]) => (
              <button key={w} className="f" aria-pressed={filter === w} onClick={() => setFilter(w)}>{label}</button>
            ))}
            <button className="printBtn" onClick={() => window.print()}>Print checklist</button>
          </div>
          <div className="counter"><b>{done}</b> of <span>{shownKeys.length}</span> ready</div>

          <div className="printHead">
            <strong style={{ fontSize: '15pt' }}>Kashi Yatra checklist</strong><br />
            <span style={{ fontSize: '10pt' }}>pellikart.com</span>
          </div>

          <div>
            {GROUPS.map((g, gi) => {
              if (!match(g.key)) return null
              return (
                <div className="grp" key={g.key}>
                  <h3>{g.label}</h3>
                  <div className="items">
                    {g.items.map((it, ii) => {
                      const key = `${gi}-${ii}`
                      return (
                        <button key={key} className={`item${it.opt ? ' opt' : ''}`} aria-pressed={!!ticked[key]} onClick={() => toggle(key)}>
                          <span className="tick">✓</span>
                          <span><strong>{it.title}</strong><small>{it.note}</small></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="miss">
        <div className="wrap">
          <div className="eyebrow">Every single time</div>
          <h2>Six mistakes families make</h2>
          <p className="lede">None of these are anyone’s fault. They are all things that only become obvious once you are standing in the hall.</p>
          <div className="mgrid">
            {MISTAKES.map(([head, body]) => (
              <div className="m" key={head}><strong>{head}</strong><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="when">
        <div className="wrap">
          <div className="eyebrow">Timing</div>
          <h2>When to buy what</h2>
          <p className="lede">Split across three moments so nothing wilts and nothing is forgotten.</p>
          <div className="tl">
            {TIMELINE.map(([when, list]) => (
              <div className="t" key={when}>
                <b>{when}</b>
                <ul>{list.map((li) => <li key={li}>{li}</li>)}</ul>
              </div>
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
          <h2>Find a decorator who has done this before</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Item lists follow common Telugu practice. Requirements vary by community, family and purohit, and some items are used only where a family follows that custom. Confirm your own list with your purohit before buying.</p>
      </div>
    </div>
  )
}

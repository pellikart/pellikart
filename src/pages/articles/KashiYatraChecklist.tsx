import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Kashi Yatra checklist".
 *
 * Self-contained designed article. CSS scoped under `.kyArt`; palette mapped to
 * Pellikart theme tokens. The tick checklist + live "ready" counter is React
 * state. Telugu script uses the --telugu font stack (Noto Sans Telugu global).
 *
 * Hero image: /public/articles/kashi-yatra-hero.jpg (self-hides if missing).
 */

type Item = { te?: string; en: string; note: string; opt?: boolean }
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'What the groom carries',
    items: [
      { te: 'గొడుగు', en: 'Umbrella', note: 'Decorated, bamboo or paper. Against the heat and the rain on the road.' },
      { te: 'కర్ర', en: 'Walking stick', note: 'Bamboo, decorated to match the umbrella.' },
      { te: 'విసనకర్ర', en: 'Hand fan', note: 'The palm leaf fan. Often sold as part of the set.' },
      { en: 'Shoulder bag', note: 'A cloth bundle or jhola. Everything else goes in here.' },
      { te: 'కొబ్బరికాయ', en: 'Coconut', note: 'Food for the journey. One is enough.' },
      { te: 'బియ్యం', en: 'Rice', note: 'A small measure, tied in cloth.' },
      { en: 'Banana', note: 'Goes in the bundle with the coconut.' },
      { en: 'Spare dhoti', note: 'A change of clothes for the pilgrimage he is not going on.' },
      { en: 'Wooden sandals', note: 'Padukas. Common in Brahmin weddings, less so elsewhere.', opt: true },
      { en: 'A scripture', note: 'Sundara Kandam in many families, or the Gita. Some skip it entirely.', opt: true },
    ],
  },
  {
    title: "What the bride's family keeps ready",
    items: [
      { en: 'Water and a vessel', note: 'Her brother washes the groom’s feet once he sits back down.' },
      { en: 'A cash envelope', note: 'A token is given to her brother afterwards. Keep it counted and ready.' },
      { en: 'A clear exit path', note: 'He walks out of the venue and back. Chairs and guests need to be out of the way.' },
      { en: 'Someone to collect the set', note: 'He abandons everything when he turns back. Assign a cousin to gather it.' },
    ],
  },
]

const STEPS: [string, string][] = [
  ['He is dressed simply', 'A plain dhoti, no jewellery. He is leaving the world behind, so he should not look like he is going to a wedding.'],
  ['He declares and walks', 'Umbrella up, stick in hand, bundle on the shoulder. He heads for the entrance and steps out.'],
  ['He is chased down', 'The bride’s brother or father comes up behind him, and in some Reddy families her mother. They talk him out of it and offer the bride’s hand.'],
  ['His feet are washed', 'He sits, her brother washes his feet, and a token of money changes hands.'],
  ['He abandons the set', 'Everything is left behind and he is walked back to the mandapam. Whole thing runs under half an hour.'],
]

const FAQ: [React.ReactNode, React.ReactNode][] = [
  ['Can we buy all of it in one go?', 'Yes. Pooja and wedding supply shops sell a ready made Kasi yatra set with the umbrella, fan, stick and sandals together, usually decorated to match. You add the coconut, rice, banana and dhoti yourself.'],
  ['Who is supposed to stop the groom?', 'Her brother or her father in most families, and her mother in some Reddy weddings. Confirm yours, and tell the photographer, because it decides where they stand.'],
  ['How long should we allow?', 'Under half an hour including the walk out, the persuasion, the feet washing and the return. Plan it as a break between the heavier rituals.'],
  ['Where does it sit in the day?', (<>Before the muhurtham, after the morning pujas. It gives everyone a breather before <span className="te" lang="te">జీలకర్ర బెల్లం</span>.</>)],
  ['Do we have to do it at all?', 'It is one of the more optional rituals and some families skip it. It is also the one guests remember, so most keep it.'],
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
.kyArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.kyArt .hero{position:relative;min-height:min(90vh,780px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.kyArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 36%;display:block}
.kyArt .scrim{position:relative;z-index:2;width:100%;padding:220px 0 68px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.kyArt .hero .eyebrow{color:var(--yellow)}
.kyArt .hero h1{font-family:var(--telugu);font-weight:700;color:#fff;font-size:clamp(46px,8vw,86px);line-height:1.15;letter-spacing:-.02em}
.kyArt .hero h1 small{display:block;font-family:var(--display);font-size:clamp(20px,2.6vw,26px);font-weight:600;letter-spacing:-.01em;color:rgba(255,255,255,.7);margin-top:4px}
.kyArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:38ch;color:rgba(255,255,255,.86)}
.kyArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.kyArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.kyArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:22px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.kyArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.kyArt .group{margin-top:34px}
.kyArt .group > h3{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--pink);margin-bottom:14px;font-weight:400}
.kyArt .items{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kyArt .item{border:1.5px solid var(--rule);border-radius:14px;padding:18px 20px;display:flex;gap:13px;align-items:flex-start;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:border-color .15s,background .15s}
.kyArt .item:hover{border-color:var(--ink)}
.kyArt .item[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.kyArt .item[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.kyArt .item[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.kyArt .tick{flex:0 0 24px;height:24px;border:2px solid var(--rule);border-radius:7px;display:grid;place-items:center;font-size:13px;font-weight:700;color:transparent;transition:.15s}
.kyArt .item strong{display:block;font-size:16px;line-height:1.35}
.kyArt .item .te{font-family:var(--telugu);font-weight:600}
.kyArt .item small{display:block;margin-top:4px;font-size:13.5px;color:var(--muted);line-height:1.45}
.kyArt .opt{opacity:.92}
.kyArt .opt strong::after{content:"varies";font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--pink);border:1px solid var(--pink);border-radius:4px;padding:1px 5px;margin-left:7px;vertical-align:2px}
.kyArt .steps{margin-top:30px;border-top:1.5px solid var(--rule)}
.kyArt .step{display:grid;grid-template-columns:78px 1fr;gap:26px;align-items:baseline;padding:22px 0;border-bottom:1.5px solid var(--rule)}
.kyArt .num{font-family:var(--display);font-size:42px;font-weight:700;letter-spacing:-.03em;color:var(--pink);line-height:1}
.kyArt .step h3{margin-bottom:5px}
.kyArt .step p{font-size:15.5px;color:var(--muted)}
.kyArt .brief{background:var(--pink);color:#fff}
.kyArt .brief .eyebrow{color:rgba(255,255,255,.72)}
.kyArt .brief h2{color:#fff}
.kyArt .brief .lede{color:rgba(255,255,255,.8)}
.kyArt .vendors{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.kyArt .vendor{border-top:2px solid rgba(255,255,255,.3);padding-top:16px}
.kyArt .vendor h3{margin-bottom:10px}
.kyArt .vendor ul{list-style:none;font-size:15px;color:rgba(255,255,255,.84)}
.kyArt .vendor li{padding:5px 0 5px 18px;position:relative}
.kyArt .vendor li::before{content:"";position:absolute;left:0;top:13px;width:7px;height:7px;border-radius:50%;background:var(--yellow)}
.kyArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.kyArt details:first-of-type{border-top:1.5px solid var(--rule)}
.kyArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.kyArt summary .te{font-family:var(--telugu);font-weight:600}
.kyArt summary::-webkit-details-marker{display:none}
.kyArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.kyArt details[open] summary::after{content:"\\2212"}
.kyArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.kyArt details p .te{font-family:var(--telugu);font-weight:600;color:var(--ink)}
.kyArt .cta{background:var(--ink);color:#fff;text-align:center}
.kyArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.kyArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.kyArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .kyArt .hero{min-height:min(94vh,720px)}
  .kyArt .scrim{padding:260px 0 52px}
  .kyArt .items,.kyArt .vendors{grid-template-columns:1fr}
  .kyArt .vendors{gap:26px}
  .kyArt .step{grid-template-columns:56px 1fr;gap:16px}
  .kyArt .num{font-size:34px}
}
@media (prefers-reduced-motion:reduce){.kyArt *{transition:none!important}}
`

export default function KashiYatraChecklist() {
  const allItems = useMemo(() => GROUPS.flatMap((g) => g.items.map((_, i) => `${g.title}-${i}`)), [])
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const done = allItems.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div className="kyArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/kashi-yatra-hero.jpg" alt="The groom setting off with umbrella and walking stick during Kashi Yatra" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Ceremony guide · 07 of 15</div>
            <h1 lang="te">కాశీ యాత్ర<small>Kashi Yatra</small></h1>
            <p>The groom packs a bag and walks out. Here is everything that needs to be in it, and who has to be standing where.</p>
            <div className="chips">
              <span className="chip">Under 30 minutes</span>
              <span className="chip">Before the muhurtham</span>
              <span className="chip">9 things to pack</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>What has to be ready</h2>
          <p className="lede">Tap as you pack. Items marked <em>varies</em> depend on your community, so check with your purohit.</p>
          <div className="counter"><b>{done}</b> of <span>{allItems.length}</span> ready</div>

          {GROUPS.map((g) => (
            <div className="group" key={g.title}>
              <h3>{g.title}</h3>
              <div className="items">
                {g.items.map((it, i) => {
                  const key = `${g.title}-${i}`
                  return (
                    <button key={key} className={`item${it.opt ? ' opt' : ''}`} aria-pressed={!!ticked[key]} onClick={() => toggle(key)}>
                      <span className="tick">✓</span>
                      <span>
                        <strong>{it.te && <span className="te">{it.te} </span>}{it.en}</strong>
                        <small>{it.note}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">How it plays out</div>
          <h2>Five minutes, five beats</h2>
          <div className="steps">
            {STEPS.map(([head, body], i) => (
              <div className="step" key={head}>
                <div className="num">{String(i + 1).padStart(2, '0')}</div>
                <div><h3>{head}</h3><p>{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brief">
        <div className="wrap">
          <div className="eyebrow">Send this to three people</div>
          <h2>The brief nobody writes</h2>
          <p className="lede">This is a moving ritual that leaves the mandapam. It is the single most commonly botched shot of the day.</p>
          <div className="vendors">
            <div className="vendor">
              <h3>Photographer</h3>
              <ul>
                <li>He moves outdoors, so plan the light</li>
                <li>Shoot the walk away from behind</li>
                <li>Second shooter at the entrance</li>
                <li>The feet washing is close and low</li>
              </ul>
            </div>
            <div className="vendor">
              <h3>Decorator</h3>
              <ul>
                <li>Umbrella, stick and fan in one palette</li>
                <li>Contrasting colours so it reads at distance</li>
                <li>Keep the exit path clear of drapes</li>
                <li>Sold as a ready set at pooja shops</li>
              </ul>
            </div>
            <div className="vendor">
              <h3>Purohit</h3>
              <ul>
                <li>Who stops him in your family</li>
                <li>Whether padukas and a text are kept</li>
                <li>Exactly when it sits before the muhurtham</li>
                <li>How long you should allow</li>
              </ul>
            </div>
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
        <p className="src">Item lists are compiled from published descriptions of Kashi Yatra across Telugu and Tamil traditions. Some elements, particularly the wooden sandals and the scripture, are more common in Brahmin weddings than elsewhere. Confirm your own list with your family purohit before buying.</p>
      </div>
    </div>
  )
}

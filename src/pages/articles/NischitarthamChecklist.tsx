import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Nischitartham checklist".
 *
 * Self-contained designed article. CSS scoped under `.nsArt`; palette mapped to
 * Pellikart theme tokens. The tick checklist + live "ready" counter is React
 * state. Telugu script uses the --telugu font stack (Noto Sans Telugu global).
 *
 * Hero image: /public/articles/nischitartham-hero.jpg (self-hides if missing).
 */

type Item = { te?: string; en: string; note: string; opt?: boolean }
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'The nischaya tambulam tray',
    items: [
      { te: 'లగ్న పత్రిక', en: 'Lagna patrika', note: 'The written agreement. The purohit prepares it. See what must be on it below.' },
      { te: 'తాంబూలం', en: 'Tambulam', note: 'Betel leaves and areca nuts, arranged on the tray.' },
      { te: 'పసుపు కుంకుమ', en: 'Pasupu and kumkuma', note: 'Turmeric and vermilion. Small quantities, in separate bowls.' },
      { en: 'Saree for the bride', note: 'From the groom’s side. She usually changes into it during the ceremony.' },
      { en: 'Clothes for the groom', note: 'From the bride’s side, in return. Dhoti or a full set.' },
      { te: 'కొబ్బరికాయ', en: 'Coconuts', note: 'Exchanged between the families in front of the elders.' },
      { en: 'Fruits', note: 'Placed on the tray and given into the bride’s pallu at the end.' },
      { en: 'Trays and cloth', note: 'Two matching trays and cloth to cover them. Count them the night before.' },
    ],
  },
  {
    title: 'People and puja',
    items: [
      { te: 'పురోహితుడు', en: 'Purohit', note: 'Booked and briefed. Most bring the puja samagri themselves, but confirm.' },
      { en: 'Both horoscopes', note: 'He needs them to fix the muhurtham on the day.' },
      { en: 'Puja samagri', note: 'For Vighneshwara puja and Punyahavachanam. Ask what he is not bringing.' },
      { te: 'హారతి', en: 'Harati plate', note: 'The aarti closes the ceremony. Camphor and wicks ready.' },
      { en: 'Pens and a witness list', note: 'Both families sign the patrika. Sounds trivial, gets forgotten.' },
    ],
  },
  {
    title: 'Gifts exchanged',
    items: [
      { en: 'Jewellery for the bride', note: 'From the groom’s family, to the extent the family can afford it.', opt: true },
      { en: 'Rings', note: 'The ring exchange is common now but is not part of the older ceremony.', opt: true },
      { en: 'Sweets and essentials', note: 'Cosmetics, daily items and sweets often travel with the gifts.', opt: true },
    ],
  },
]

const CHAIN: { step: string; te?: string; strong?: string; span: string }[] = [
  { step: 'Step one', te: 'నిశ్చితార్థం', span: 'The purohit writes the lagna patrika and reads it out.' },
  { step: 'Step two', te: 'లగ్న పత్రిక', span: 'Muhurtham, both names, both sets of parents, all fixed on paper.' },
  { step: 'Step three', te: 'పెళ్ళి శుభలేఖలు', span: 'Only now can the invitation cards go to print.' },
  { step: 'Step four', strong: 'Guests book travel', span: 'Which is why an engagement that slips pushes everything after it.' },
]

const PATRIKA: string[] = [
  'The muhurtham. Date and the exact auspicious time.',
  'The bride’s full name, spelled as she uses it.',
  'The groom’s full name, spelled as he uses it.',
  'The names of the bride’s parents.',
  'The names of the groom’s parents.',
  'The venue of the wedding, if it is already fixed.',
  'Signatures from both families, witnessed by the gathering.',
]

const STEPS: [string, string][] = [
  ['Vighneshwara puja', 'Ganesha first, to clear obstacles. Then Maha Sankalpam and Punyahavachanam.'],
  ['New clothes handed over', 'Both families give the new clothes. The couple change into them and return.'],
  ['The patrika is written', 'The purohit fixes the muhurtham from both horoscopes and writes it out.'],
  ['It is read aloud', 'In front of everyone. Both families sign, and the gathering stands witness.'],
  ['Tambulam exchanged', 'The parents exchange the trays. Betel leaves and coconuts pass between the families.'],
  ['Blessings and harati', 'Kumkum and chandan on the bride’s forehead, turmeric and fruit into her pallu, elders bless the couple, aarti closes it.'],
]

const FAQ: [React.ReactNode, React.ReactNode][] = [
  ['Where is it usually held?', 'At the bride’s home in most families. A hotel or a temple is common when either side is travelling, and neither is considered a lesser option.'],
  [(<>Is the <span className="te" lang="te">లగ్న పత్రిక</span> legally binding?</>), 'No. The signatures are recorded and witnessed by the families, but it carries social weight rather than legal force. Your legal marriage happens at registration.'],
  ['How far ahead of the wedding should it be?', 'Far enough that cards can be printed and posted and guests can book travel. Several months is normal, and rushing it compresses everything downstream.'],
  ['Do we exchange rings?', 'Most families do now. It sits alongside the traditional ceremony rather than inside it, so treat it as an addition rather than a requirement.'],
  ['Who brings the puja items?', 'Most purohits supply the samagri as part of the booking. Ask explicitly what is included, because the harati plate, trays and cloth are usually yours to arrange.'],
]

const CSS = `
.nsArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.nsArt *{box-sizing:border-box;margin:0;padding:0}
.nsArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.nsArt section{padding:64px 0}
.nsArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.nsArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.nsArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.nsArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.nsArt .hero{position:relative;min-height:min(90vh,780px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.nsArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 36%;display:block}
.nsArt .scrim{position:relative;z-index:2;width:100%;padding:220px 0 68px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.nsArt .hero .eyebrow{color:var(--yellow)}
.nsArt .hero h1{font-family:var(--telugu);font-weight:700;color:#fff;font-size:clamp(44px,7.6vw,82px);line-height:1.15;letter-spacing:-.02em}
.nsArt .hero h1 small{display:block;font-family:var(--display);font-size:clamp(20px,2.6vw,26px);font-weight:600;letter-spacing:-.01em;color:rgba(255,255,255,.7);margin-top:4px}
.nsArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:38ch;color:rgba(255,255,255,.86)}
.nsArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.nsArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.nsArt .gate{background:var(--pink);color:#fff}
.nsArt .gate .eyebrow{color:rgba(255,255,255,.72)}
.nsArt .gate h2{color:#fff}
.nsArt .gate .lede{color:rgba(255,255,255,.84);max-width:56ch}
.nsArt .chain{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:34px}
.nsArt .link{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.nsArt .link b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px}
.nsArt .link strong{display:block;font-family:var(--telugu);font-size:20px;font-weight:600;line-height:1.4}
.nsArt .link span{display:block;font-size:14px;color:rgba(255,255,255,.74);margin-top:6px;line-height:1.5}
.nsArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:22px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.nsArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.nsArt .group{margin-top:34px}
.nsArt .group > h3{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--pink);margin-bottom:14px;font-weight:400}
.nsArt .items{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.nsArt .item{border:1.5px solid var(--rule);border-radius:14px;padding:18px 20px;display:flex;gap:13px;align-items:flex-start;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:border-color .15s,background .15s}
.nsArt .item:hover{border-color:var(--ink)}
.nsArt .item[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.nsArt .item[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.nsArt .item[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.nsArt .tick{flex:0 0 24px;height:24px;border:2px solid var(--rule);border-radius:7px;display:grid;place-items:center;font-size:13px;font-weight:700;color:transparent;transition:.15s}
.nsArt .item strong{display:block;font-size:16px;line-height:1.35}
.nsArt .item .te{font-family:var(--telugu);font-weight:600}
.nsArt .item small{display:block;margin-top:4px;font-size:13.5px;color:var(--muted);line-height:1.45}
.nsArt .opt strong::after{content:"varies";font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--pink);border:1px solid var(--pink);border-radius:4px;padding:1px 5px;margin-left:7px;vertical-align:2px}
.nsArt .doc{border:2px solid var(--ink);border-radius:14px;padding:28px 30px;margin-top:30px;background:#fff}
.nsArt .doc h3{font-family:var(--telugu);font-size:24px;margin-bottom:4px}
.nsArt .doc > span{display:block;font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin-bottom:16px}
.nsArt .doc ol{list-style:none;counter-reset:d}
.nsArt .doc li{counter-increment:d;padding:11px 0 11px 40px;position:relative;border-bottom:1px solid var(--rule);font-size:16px}
.nsArt .doc li:last-child{border-bottom:0}
.nsArt .doc li::before{content:counter(d,decimal-leading-zero);position:absolute;left:0;top:12px;font-family:var(--mono);font-size:12px;color:var(--pink)}
.nsArt .steps{margin-top:30px;border-top:1.5px solid var(--rule)}
.nsArt .step{display:grid;grid-template-columns:78px 1fr;gap:26px;align-items:baseline;padding:22px 0;border-bottom:1.5px solid var(--rule)}
.nsArt .num{font-family:var(--display);font-size:42px;font-weight:700;letter-spacing:-.03em;color:var(--pink);line-height:1}
.nsArt .step h3{margin-bottom:5px}
.nsArt .step p{font-size:15.5px;color:var(--muted)}
.nsArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.nsArt details:first-of-type{border-top:1.5px solid var(--rule)}
.nsArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.nsArt summary .te{font-family:var(--telugu);font-weight:600}
.nsArt summary::-webkit-details-marker{display:none}
.nsArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.nsArt details[open] summary::after{content:"\\2212"}
.nsArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.nsArt details p .te{font-family:var(--telugu);font-weight:600;color:var(--ink)}
.nsArt .cta{background:var(--ink);color:#fff;text-align:center}
.nsArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.nsArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.nsArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .nsArt .hero{min-height:min(94vh,720px)}
  .nsArt .scrim{padding:260px 0 52px}
  .nsArt .items,.nsArt .chain{grid-template-columns:1fr}
  .nsArt .chain{gap:24px}
  .nsArt .doc{padding:22px 20px}
  .nsArt .step{grid-template-columns:56px 1fr;gap:16px}
  .nsArt .num{font-size:34px}
}
@media (prefers-reduced-motion:reduce){.nsArt *{transition:none!important}}
`

export default function NischitarthamChecklist() {
  const allItems = useMemo(() => GROUPS.flatMap((g) => g.items.map((_, i) => `${g.title}-${i}`)), [])
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const done = allItems.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div className="nsArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/nischitartham-hero.jpg" alt="Families exchanging the nischaya tambulam at a Telugu engagement" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Ceremony guide · 01 of 19</div>
            <h1 lang="te">నిశ్చితార్థం<small>Nischitartham</small></h1>
            <p>The engagement is where the date gets fixed and written down. Nothing else in the wedding can start until this is done.</p>
            <div className="chips">
              <span className="chip">2 to 3 hours</span>
              <span className="chip">At the bride’s home</span>
              <span className="chip">16 things to arrange</span>
            </div>
          </div>
        </div>
      </header>

      <section className="gate">
        <div className="wrap">
          <div className="eyebrow">Read this first</div>
          <h2>Your cards cannot be printed before this</h2>
          <p className="lede">The lagna patrika written at your engagement is what the printer needs. Families lose weeks because nobody tells them the order.</p>
          <div className="chain">
            {CHAIN.map((c) => (
              <div className="link" key={c.step}>
                <b>{c.step}</b>
                {c.te ? <strong lang="te">{c.te}</strong> : <strong>{c.strong}</strong>}
                <span>{c.span}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>What has to be ready</h2>
          <p className="lede">Tap as you arrange. Items marked <em>varies</em> depend on your community and family.</p>
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
          <div className="eyebrow">The document</div>
          <h2>What the lagna patrika must contain</h2>
          <p className="lede">Check it before it is read out. Correcting a name afterwards is awkward for everyone.</p>
          <div className="doc">
            <h3 lang="te">లగ్న పత్రిక</h3>
            <span>Written and read aloud by the purohit</span>
            <ol>
              {PATRIKA.map((line, i) => (<li key={i}>{line}</li>))}
            </ol>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">How it plays out</div>
          <h2>Six beats, start to finish</h2>
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
          <h2>Card printers who work to a muhurtham deadline</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Compiled from published descriptions of Telugu Nischitartham practice. Contents of the nischaya tambulam, the gifts exchanged and the puja sequence vary by family and community. Confirm your own list with your purohit before buying anything.</p>
      </div>
    </div>
  )
}

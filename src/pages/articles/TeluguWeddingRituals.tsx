import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Telugu wedding rituals in order".
 *
 * Self-contained designed article. CSS scoped under `.rtArt`; palette mapped to
 * Pellikart theme tokens. Interactive community tabs are React state. Telugu
 * script uses the --telugu font stack (Noto Sans Telugu loaded globally).
 *
 * Hero image: /public/articles/rituals-hero.jpg (self-hides if missing).
 */

type Phase = { label: string; rites: Rite[] }
type Rite = { code: string; te: string; en: string; body: string; key?: boolean }

const PHASES: Phase[] = [
  {
    label: 'Before the day',
    rites: [
      { code: '01 · Nischitartham', te: 'నిశ్చితార్థం', en: 'The engagement', body: 'Both families make the alliance official. The muhurtham is fixed here, so this is where the whole calendar begins.' },
      { code: '02 · Pellikuthuru and Pellikoduku', te: 'పెళ్ళికూతురు · పెళ్ళికొడుకు', en: 'The turmeric day', body: 'Bride and groom are bathed in turmeric and sandalwood at their own homes. Loud, wet, and the best photographs of the week.' },
      { code: '03 · Snatakam', te: 'స్నాతకం', en: "The groom's thread", body: 'A few hours before the wedding. The groom is given the sacred thread, marking the shift from student to householder.' },
      { code: '04 · Kaapu Kattu', te: 'కాపు కట్టు', en: 'Blessings tied', body: 'A sacred thread is tied and the gods are asked to see the wedding through without obstacle.' },
    ],
  },
  {
    label: 'The wedding day',
    rites: [
      { code: '05 · Mangala Snanam', te: 'మంగళ స్నానం', en: 'The purifying bath', body: 'Early morning, both of them, separately. Everything after this is ceremony.' },
      { code: '06 · Ganapati Puja and Gauri Puja', te: 'గణపతి పూజ · గౌరీ పూజ', en: 'Two prayers, two places', body: 'The groom prays to Ganesha at the venue. The bride prays to Gauri, usually at home.' },
      { code: '07 · Kashi Yatra', te: 'కాశీ యాత్ర', en: 'The groom pretends to leave', body: 'Umbrella, walking stick, and a bag. He sets off for Kashi to renounce the world, and is talked out of it by the bride’s brother or father, depending on your family.' },
      { code: '08 · Vara Mala', te: 'వరమాల', en: 'Garlands exchanged', body: 'The first formal acceptance. Expect the cousins to lift both of them out of reach.' },
      { code: '09 · Kanyadanam', te: 'కన్యాదానం', en: 'Her parents give her hand', body: 'The bride’s parents wash the groom’s feet, then formally give their daughter away. The most emotional ten minutes of the day.' },
      { code: '10 · Madhuparkam', te: 'మధుపర్కం', en: 'Into new silks', body: 'The couple change into the white and gold saree and the dhoti with the red border.' },
      { code: '11 · Jeelakarra Bellam · At the muhurtham', te: 'జీలకర్ర బెల్లం', en: 'The exact moment', key: true, body: 'A curtain has kept them from seeing each other all morning. At the precise muhurtham they press a paste of cumin and jaggery onto each other’s heads, the curtain drops, and they look at one another for the first time. Cumin for strength, jaggery for sweetness, and once mixed they cannot be separated.' },
      { code: '12 · Mangalasutra Dharana', te: 'మంగళసూత్ర ధారణ', en: 'Three knots', body: 'The groom ties the mangalsutra. Three knots, because three can never be undone.' },
      { code: '13 · Talambralu', te: 'తలంబ్రాలు', en: 'The rice fight', body: 'Rice with turmeric and petals, poured over each other’s heads. It starts as a blessing and ends as a competition.' },
      { code: '14 · Saptapadi', te: 'సప్తపది', en: 'Seven steps', body: 'Seven steps around the fire, one vow each. Legally and spiritually, this is the marriage.' },
    ],
  },
  {
    label: 'After',
    rites: [
      { code: '15 · Gruhapravesam', te: 'గృహప్రవేశం', en: 'Into the new house', body: 'The bride enters her husband’s home for the first time, tipping a pot of rice at the threshold.' },
    ],
  },
]

type Diff = { te: string; tag: string; body: string }
const COMMUNITIES: { id: string; label: React.ReactNode; rows: Diff[]; gap?: boolean }[] = [
  {
    id: 'all',
    label: 'All communities',
    rows: [
      { te: 'మేనమామ', tag: 'Who leads', body: 'The bride’s maternal uncle and her brother carry prominent roles throughout the day across Telugu communities. Seat them where the photographer can reach them.' },
      { te: 'ముహూర్తం', tag: 'The timing', body: 'Telugu weddings are often set late in the night rather than the morning, which is unusual among South Indian traditions and changes how you plan catering and guest travel.' },
    ],
  },
  {
    id: 'brahmin',
    label: (<><span className="te" lang="te">బ్రాహ్మణ</span> Brahmin</>),
    rows: [
      { te: 'బ్రహ్మ ముడి', tag: 'Only here', body: 'The edge of the bride’s sari is tied to one end of the groom’s kanduva. This knot is documented as specific to Telugu Brahmin weddings.' },
      { te: 'స్థాలీపాకం', tag: 'After the seven steps', body: 'The groom places silver toe rings on the bride’s feet. A string of black beads is added at the same stage.' },
      { te: 'ఉంగరం ఆట', tag: 'The ring game', body: 'A ring is dropped into a vessel of water and the couple fish for it three times. Whoever wins more often is teased as the one in charge.' },
      { te: 'స్నాతకం', tag: 'Original meaning', body: 'Here Snatakam keeps its older sense, marking the completion of Vedic study before the groom becomes a householder.' },
    ],
  },
  {
    id: 'reddy',
    label: (<><span className="te" lang="te">రెడ్డి</span> Reddy</>),
    rows: [
      { te: 'కాశీ యాత్ర', tag: 'Who stops him', body: 'The groom is held back by the bride’s brother or by her mother. The mother’s role is the part that surprises guests from other communities.' },
      { te: 'నిశ్చితార్థం', tag: 'Written and bundled', body: 'The agreement is written out and tied into yellow cloth with turmeric, betel leaf, nuts and fruit, then blessed by the pujari.' },
      { te: 'స్థాలీపాకం', tag: 'After the seven steps', body: 'Silver toe rings are placed on the bride’s feet, followed by the walk to her new home.' },
    ],
  },
  {
    id: 'kamma',
    label: (<><span className="te" lang="te">కమ్మ</span> Kamma</>),
    rows: [
      { te: 'జాతక పొంతన', tag: 'The gate', body: 'Horoscope matching is treated as a hard gate. Nothing else moves until it clears, which pushes the whole timeline earlier than families expect.' },
      { te: 'ఉమ్మడి క్రమం', tag: 'Same spine', body: 'Sources agree the core sequence matches the common order above. Variation here tends to run by region and family rather than by community.' },
    ],
  },
  {
    id: 'vysya',
    label: (<><span className="te" lang="te">ఆర్య వైశ్య</span> Arya Vysya</>),
    rows: [
      { te: 'పెళ్ళికూతురు', tag: 'Earlier than most', body: 'Held a day or two ahead of the wedding rather than on the eve, which shifts your haldi photography and your guest arrivals.' },
      { te: 'మంగళ స్నానం', tag: 'At dawn', body: 'Performed at first light, with married women from both families taking part.' },
      { te: 'జీలకర్ర బెల్లం', tag: 'Fading in some families', body: 'Still kept by many, but noted as less universal here than in other Telugu communities. Worth confirming rather than assuming.' },
    ],
  },
  {
    id: 'others',
    label: (<><span className="te" lang="te">వెలమ · కాపు</span> Velama, Kapu and others</>),
    gap: true,
    rows: [
      { te: 'వెలమ · కాపు · బలిజ · గౌడ', tag: 'Not yet documented', body: 'We have not found reliable written sources on how these traditions differ, and we would rather leave a gap than print something wrong. If your family keeps rituals not listed above, tell us and we will add them with credit.' },
    ],
  },
]

const CSS = `
.rtArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.rtArt *{box-sizing:border-box;margin:0;padding:0}
.rtArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.rtArt section{padding:64px 0}
.rtArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.rtArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.rtArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.rtArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.rtArt .hero{position:relative;min-height:min(90vh,780px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.rtArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 36%;display:block}
.rtArt .scrim{position:relative;z-index:2;width:100%;padding:220px 0 68px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.rtArt .hero .eyebrow{color:var(--yellow)}
.rtArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.4vw,78px);line-height:.98;letter-spacing:-.042em;max-width:13ch}
.rtArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:38ch;color:rgba(255,255,255,.86)}
.rtArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.rtArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.rtArt .phase{display:flex;align-items:center;gap:16px;margin:44px 0 6px}
.rtArt .phase span{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--yellow);padding:8px 16px;border-radius:999px;white-space:nowrap}
.rtArt .phase i{flex:1;height:2px;background:var(--rule);display:block}
.rtArt .line{position:relative;padding-left:26px}
.rtArt .line::before{content:"";position:absolute;left:5px;top:14px;bottom:14px;width:2px;background:var(--rule)}
.rtArt .rite{position:relative;padding:20px 0 20px 30px}
.rtArt .rite::before{content:"";position:absolute;left:-5px;top:28px;width:12px;height:12px;border-radius:50%;background:var(--pink);border:3px solid var(--paper)}
.rtArt .rite b{font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.rtArt .rite h3{font-family:var(--telugu);font-size:26px;font-weight:600;line-height:1.45;margin:8px 0 2px}
.rtArt .rite em{display:block;font-style:normal;font-size:16px;font-weight:600;color:var(--ink);margin-bottom:6px}
.rtArt .rite p{font-size:15.5px;color:var(--muted);max-width:60ch}
.rtArt .rite.key{background:var(--yellow);border-radius:14px;padding:26px 28px;margin:14px 0}
.rtArt .rite.key::before{background:var(--ink);top:34px}
.rtArt .rite.key b{color:rgba(26,23,25,.7)}
.rtArt .rite.key h3{font-size:34px;line-height:1.35}
.rtArt .rite.key em{font-size:17px}
.rtArt .rite.key p{color:rgba(26,23,25,.78)}
.rtArt .tabs{display:flex;flex-wrap:wrap;gap:9px;margin-top:28px}
.rtArt .tab{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:10px 18px;cursor:pointer;font:inherit;font-size:15px;display:flex;align-items:baseline;gap:8px;transition:border-color .15s,background .15s}
.rtArt .tab:hover{border-color:var(--ink)}
.rtArt .tab[aria-selected="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.rtArt .tab .te{font-family:var(--telugu);font-weight:600;font-size:16px}
.rtArt .tab[aria-selected="true"] .te{color:var(--yellow)}
.rtArt .panel{margin-top:22px}
.rtArt .diffs{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.rtArt .diff{border:1.5px solid var(--rule);border-left:4px solid var(--yellow);border-radius:12px;padding:20px 22px}
.rtArt .diff b{display:block;font-family:var(--telugu);font-size:19px;font-weight:600;line-height:1.4;margin-bottom:4px}
.rtArt .diff i{display:block;font-style:normal;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin-bottom:8px}
.rtArt .diff p{font-size:15px;color:var(--muted)}
.rtArt .gap{border-left-color:var(--pink);background:#FDF0F7}
.rtArt .gap p{color:var(--ink)}
.rtArt .brief{background:var(--pink);color:#fff}
.rtArt .brief .eyebrow{color:rgba(255,255,255,.72)}
.rtArt .brief h2{color:#fff}
.rtArt .brief .lede{color:rgba(255,255,255,.8)}
.rtArt .vendors{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.rtArt .vendor{border-top:2px solid rgba(255,255,255,.3);padding-top:16px}
.rtArt .vendor h3{margin-bottom:10px}
.rtArt .vendor ul{list-style:none;font-size:15px;color:rgba(255,255,255,.82)}
.rtArt .vendor li{padding:5px 0 5px 18px;position:relative}
.rtArt .vendor li span{font-family:var(--telugu);font-weight:600;color:#fff}
.rtArt .vendor li::before{content:"";position:absolute;left:0;top:13px;width:7px;height:7px;border-radius:50%;background:var(--yellow)}
.rtArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.rtArt details:first-of-type{border-top:1.5px solid var(--rule)}
.rtArt summary .te{font-family:var(--telugu);font-weight:600}
.rtArt details p .te{font-family:var(--telugu);font-weight:600;color:var(--ink)}
.rtArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.rtArt summary::-webkit-details-marker{display:none}
.rtArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.rtArt details[open] summary::after{content:"\\2212"}
.rtArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.rtArt .cta{background:var(--ink);color:#fff;text-align:center}
.rtArt .cta h2{color:#fff;max-width:20ch;margin:0 auto}
.rtArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.rtArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .rtArt .hero{min-height:min(94vh,720px)}
  .rtArt .scrim{padding:260px 0 52px}
  .rtArt .vendors{grid-template-columns:1fr;gap:26px}
  .rtArt .line{padding-left:14px}
  .rtArt .rite{padding-left:24px}
  .rtArt .rite.key{padding:22px 20px}
  .rtArt .diffs{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.rtArt *{transition:none!important}}
`

export default function TeluguWeddingRituals() {
  const [active, setActive] = useState('all')
  const community = COMMUNITIES.find((c) => c.id === active) ?? COMMUNITIES[0]

  return (
    <div className="rtArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/rituals-hero.jpg" alt="A Telugu wedding ceremony in progress at the mandapam" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Rituals · Telugu wedding</div>
            <h1>What happens, and when</h1>
            <p>Fifteen rituals in order, from the engagement to the first night in a new house. One line each.</p>
            <div className="chips">
              <span className="chip">2 to 4 hours</span>
              <span className="chip">One exact moment</span>
              <span className="chip">4 must-capture shots</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">The sequence</div>
          <h2>In the order it actually happens</h2>
          <p className="lede">Families vary. Treat this as the spine, and let your purohit adjust it.</p>

          {PHASES.map((phase) => (
            <div key={phase.label}>
              <div className="phase"><span>{phase.label}</span><i /></div>
              <div className="line">
                {phase.rites.map((r) => (
                  <div className={`rite${r.key ? ' key' : ''}`} key={r.code}>
                    <b>{r.code}</b>
                    <h3 lang="te">{r.te}</h3>
                    <em>{r.en}</em>
                    <p>{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">By community</div>
          <h2>What changes for your family</h2>
          <p className="lede">The spine above is shared. These are the differences that are actually documented, community by community.</p>

          <div className="tabs" role="tablist">
            {COMMUNITIES.map((c) => (
              <button key={c.id} className="tab" role="tab" aria-selected={active === c.id} onClick={() => setActive(c.id)}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="panel">
            <div className="diffs">
              {community.rows.map((row, i) => (
                <div className={`diff${community.gap ? ' gap' : ''}`} key={i}>
                  <i>{row.tag}</i>
                  <b lang="te">{row.te}</b>
                  <p>{row.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="brief">
        <div className="wrap">
          <div className="eyebrow">Where this becomes useful</div>
          <h2>Brief your vendors from this list</h2>
          <p className="lede">Most missed shots and most decor mistakes come from a vendor who did not know the running order.</p>
          <div className="vendors">
            <div className="vendor">
              <h3>Photographer</h3>
              <ul>
                <li><span lang="te">కాశీ యాత్ర</span>, the walk away</li>
                <li><span lang="te">జీలకర్ర బెల్లం</span>, the first look</li>
                <li><span lang="te">మంగళసూత్ర ధారణ</span>, the three knots</li>
                <li><span lang="te">తలంబ్రాలు</span>, wide and fast</li>
              </ul>
            </div>
            <div className="vendor">
              <h3>Decorator</h3>
              <ul>
                <li>Umbrella, stick and banana for <span lang="te">కాశీ యాత్ర</span></li>
                <li>The <span lang="te">తెరసాల</span> curtain</li>
                <li>Clear path for <span lang="te">సప్తపది</span></li>
                <li>Rice pot for the threshold</li>
              </ul>
            </div>
            <div className="vendor">
              <h3>Purohit</h3>
              <ul>
                <li>How wide is the muhurtham window</li>
                <li>Which rituals your family keeps</li>
                <li>How long the ceremony will run</li>
                <li>What to arrange the night before</li>
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
            <details><summary>How long does the ceremony take?</summary><p>Usually two to four hours, depending on the muhurtham window and how many Vedic rituals your family keeps. Families who follow the customs closely run longer.</p></details>
            <details><summary>Which single ritual is the marriage?</summary><p><span className="te" lang="te">సప్తపది</span>, the seven steps around the fire. <span className="te" lang="te">జీలకర్ర బెల్లం</span> is the most photographed moment, but the seven steps are what completes the marriage.</p></details>
            <details><summary>Who stops the groom during <span className="te" lang="te">కాశీ యాత్ర</span>?</summary><p>The bride’s brother in some families, her father in others. Ask your purohit which your family follows, and tell your photographer, because it changes where they need to stand.</p></details>
            <details><summary>Why can’t the couple see each other before <span className="te" lang="te">జీలకర్ర బెల్లం</span>?</summary><p>A curtain called the <span className="te" lang="te">తెరసాల</span> or <span className="te" lang="te">అడ్డుతెర</span> is held between them. It comes down at the muhurtham, which is why that first look carries so much weight.</p></details>
            <details><summary>Do Telangana and Andhra families do it differently?</summary><p>The spine is the same. Order, naming and which optional rituals are kept differ by family, region and community, so always check yours rather than a list.</p></details>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Now find the people who will do it properly</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Community differences are limited to what is documented in published sources. Where we found nothing reliable we have said so rather than guessing. Compiled from Telugu wedding tradition as commonly documented. Order, naming and inclusion of individual rituals vary by family, community and region across Telangana and Andhra Pradesh. Confirm your own sequence with your family purohit.</p>
      </div>
    </div>
  )
}

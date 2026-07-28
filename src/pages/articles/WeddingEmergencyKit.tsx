import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Telugu wedding emergency kit: 76 things to pack".
 *
 * Self-contained designed article. CSS scoped under `.ekArt`; palette mapped to
 * Pellikart theme tokens. The pouch filter + tap-to-tick 76-item checklist +
 * live "packed" counter are React state, and the checklist is printable (a
 * scoped `@media print` block hides everything but the items).
 *
 * Hero image: /public/articles/emergency-kit-hero.jpg (self-hides if missing).
 */

type Cat = 'wardrobe' | 'beauty' | 'aid' | 'hygiene' | 'tech' | 'food' | 'fix' | 'kids' | 'night'
type Item = { title: string; note: string }
type Group = { label: string; key: Cat; items: Item[] }

const GROUPS: Group[] = [
  {
    label: 'Wardrobe fixes',
    key: 'wardrobe',
    items: [
      { title: 'Safety pins, small and large', note: 'Sarees, dupattas and dhotis. Buy twice what you think.' },
      { title: 'Saree pins', note: 'Holds pleats and the pallu where they were set.' },
      { title: 'Mini sewing kit', note: 'Loose hooks, torn blouses, a ripped dhoti.' },
      { title: 'Black thread', note: 'For the darker outfits.' },
      { title: 'White thread', note: 'For the lighter ones.' },
      { title: 'Gold thread', note: 'For traditional wear where a dark stitch would show.' },
      { title: 'Extra blouse hooks', note: 'The most common wardrobe failure of the day.' },
      { title: 'Double sided fashion tape', note: 'Necklines and pallus that will not stay put.' },
      { title: 'Small scissors', note: 'Tags, loose threads, flower stems, ribbon.' },
      { title: 'Fabric glue', note: 'When there is no time to stitch.' },
      { title: 'Lint roller', note: 'Sherwanis and silk pick up everything.' },
    ],
  },
  {
    label: 'Beauty and grooming',
    key: 'beauty',
    items: [
      { title: 'Pocket mirror', note: 'Because the changing room is always occupied.' },
      { title: 'Lipstick and lip balm', note: 'The single most requested item after safety pins.' },
      { title: 'Compact powder', note: 'Controls shine under photography lights.' },
      { title: 'Comb', note: 'For everyone who is not the bride.' },
      { title: 'Hair brush', note: 'For the bride, kept separate.' },
      { title: 'Bobby pins', note: 'A hairstyle set at 5am will not survive to midnight.' },
      { title: 'Hair pins', note: 'For flowers and accessories that slip.' },
      { title: 'Hair spray', note: 'One quick pass before the muhurtham photographs.' },
      { title: 'Makeup remover wipes', note: 'For fixing a smudge rather than redoing a face.' },
      { title: 'Deodorant', note: 'Long day, heavy fabrics, warm hall.' },
      { title: 'Perfume', note: 'A refresh before the reception line.' },
    ],
  },
  {
    label: 'First aid and medicines',
    key: 'aid',
    items: [
      { title: 'Plasters', note: 'Shoe bites and small cuts during setup.' },
      { title: 'Antiseptic liquid', note: 'For cleaning a wound before covering it.' },
      { title: 'Antiseptic cream', note: 'Keep with the plasters.' },
      { title: 'Headache tablets', note: 'Stress, noise and no sleep.' },
      { title: 'Acidity relief', note: 'Rich food across several meals.' },
      { title: 'Fever and pain relief', note: 'Basic, over the counter only.' },
      { title: 'Allergy tablets', note: 'Flowers, dust and unfamiliar food.' },
      { title: 'Motion sickness tablets', note: 'For guests travelling in from out of town.' },
      { title: 'ORS sachets', note: 'Long hours, warm hall, not enough water.' },
      { title: 'Digital thermometer', note: 'A quick check before anyone panics.' },
      { title: 'Pain relief spray', note: 'Eight hours standing does something to the back.' },
      { title: 'Cotton and gauze', note: 'The basics that plasters cannot cover.' },
    ],
  },
  {
    label: 'Hygiene',
    key: 'hygiene',
    items: [
      { title: 'Pocket tissues', note: 'Distribute a pack to each pouch.' },
      { title: 'Wet wipes', note: 'Spills, sticky hands, turmeric on skin.' },
      { title: 'Hand sanitiser', note: 'Between rituals and before food.' },
      { title: 'Soap sheets', note: 'For when the washroom has run out.' },
      { title: 'Disposable toothbrush', note: 'Useful after the meal before photographs.' },
      { title: 'Toothpaste', note: 'Pairs with the above. Small tube.' },
      { title: 'Mouth freshener', note: 'Before every conversation with a relative.' },
      { title: 'Face masks', note: 'A couple, in case someone is unwell.' },
    ],
  },
  {
    label: 'Electronics',
    key: 'tech',
    items: [
      { title: 'Power bank', note: 'Fully charged two days before, not the night before.' },
      { title: 'Phone chargers', note: 'USB-C, Lightning and micro USB. Assume nothing.' },
      { title: 'Torch', note: 'Backstage areas and car parks at midnight.' },
      { title: 'Memory card', note: 'A spare, in case the photographer is caught short.' },
      { title: 'Camera batteries', note: 'Only if anyone in the family is shooting.' },
    ],
  },
  {
    label: 'Food and energy',
    key: 'food',
    items: [
      { title: 'Water bottles', note: 'The couple will not drink unless someone hands it over.' },
      { title: 'Energy bars', note: 'Between rituals, when there is no time to eat.' },
      { title: 'Dry fruits', note: 'Easy to eat in wedding clothes.' },
      { title: 'Biscuits', note: 'Plain ones. Nothing that crumbles onto silk.' },
      { title: 'Glucose candies', note: 'For the moment someone goes pale on the mandapam.' },
      { title: 'Chocolates', note: 'For the children, and for whoever is holding it together.' },
    ],
  },
  {
    label: 'Fix-it and admin',
    key: 'fix',
    items: [
      { title: 'Instant adhesive', note: 'Broken accessories, a snapped decor piece.' },
      { title: 'Rubber bands', note: 'Wires, flower bunches, bag mouths.' },
      { title: 'String or rope', note: 'Temporary fixes that hold long enough.' },
      { title: 'Ziplock bags', note: 'Jewellery, cash, phones, anything that must not be lost.' },
      { title: 'Notepad', note: 'Vendor notes, reminders, who to pay what.' },
      { title: 'Marker pen', note: 'Label bags and boxes as they arrive.' },
      { title: 'Paper clips', note: 'For the documents and receipts.' },
      { title: 'Clipboard', note: 'For whoever is coordinating the day.' },
      { title: 'Extra cloth bags', note: 'Gifts accumulate faster than anyone expects.' },
    ],
  },
  {
    label: 'If children are attending',
    key: 'kids',
    items: [
      { title: 'Baby wipes', note: 'Separate from the adult wet wipes.' },
      { title: 'Diapers', note: 'More than the maths suggests.' },
      { title: 'A change of clothes', note: 'Assume one full outfit per child, minimum.' },
      { title: 'Milk bottle', note: 'And whatever goes in it.' },
      { title: 'Small snacks', note: 'The wedding menu will not suit them.' },
      { title: 'A quiet toy', note: 'For the long ritual stretches.' },
      { title: 'Tissues', note: 'Kept where the parents can reach them.' },
    ],
  },
  {
    label: 'If staying overnight',
    key: 'night',
    items: [
      { title: 'Nightwear', note: 'For both of you.' },
      { title: 'Toothbrush and paste', note: 'Separate from the emergency kit ones.' },
      { title: 'Skincare', note: 'Removing bridal makeup properly matters.' },
      { title: 'Phone charger', note: 'A second one. The kit charger stays in the kit.' },
      { title: 'Slippers', note: 'After a day in wedding footwear.' },
      { title: 'A change of clothes', note: 'For the morning after.' },
      { title: 'Basic toiletries', note: 'Assume the room has nothing you want.' },
    ],
  },
]

const FILTERS: [Cat | 'all', string][] = [
  ['all', 'All 76'],
  ['wardrobe', 'Wardrobe'],
  ['beauty', 'Beauty'],
  ['aid', 'First aid'],
  ['hygiene', 'Hygiene'],
  ['tech', 'Electronics'],
  ['food', 'Food'],
  ['fix', 'Fix-it'],
  ['kids', 'Kids'],
  ['night', 'Overnight'],
]

const SCENARIOS: [string, string][] = [
  ['A saree pin gives way', 'Mid ritual, in front of everyone, with photographs happening.'],
  ['Someone gets a shoe bite', 'New footwear plus eight hours standing. It happens to somebody every time.'],
  ["The bride's lipstick vanishes", 'Set down somewhere during the getting ready and never seen again.'],
  ["The groom's phone dies", 'At exactly the moment three relatives are trying to find the hall.'],
  ['Juice on a silk saree', "A cousin's child, moving fast, holding something orange."],
  ['A blouse hook comes off', 'The single most common wardrobe failure at an Indian wedding.'],
]

const POUCHES: [string, string, string][] = [
  ['Pouch one', 'First aid', 'Medicines, plasters, antiseptic. The one you hope stays shut.'],
  ['Pouch two', 'Wardrobe fixes', 'Pins, thread, hooks, tape, scissors. Opened the most, by far.'],
  ['Pouch three', 'Beauty and grooming', 'Touch ups between rituals and before every photograph.'],
  ['Pouch four', 'Electronics', 'Power bank, cables, torch. Keep this one nearest the door.'],
]

const CARRIER: [string, string][] = [
  ['Knows the bag', 'Packed it, or watched it being packed. Can find something without looking.'],
  ['Stays close', 'Within reach of the couple all day, not seated with the guests.'],
  ['Calm under pressure', 'The bag comes out when something has already gone wrong.'],
  ['Not in the rituals', 'Which rules out most of the immediate family. A cousin or a friend is ideal.'],
]

const FAQ: [string, string][] = [
  ['Is 76 items overkill?', 'For a single function, yes. For a full Telugu wedding running across pellikuthuru, the muhurtham and a reception, most of it gets used. Start with the wardrobe and first aid pouches if you are cutting down.'],
  ['What is the one thing people forget?', 'Blouse hooks and matching thread. Safety pins everyone remembers. A hook that has come away needs three minutes and a needle, and nobody has either.'],
  ['Should we carry medicines for guests?', "Basic over the counter items for common complaints are sensible for a long day. Do not hand out anyone's prescription medication, and for anything beyond a headache or a small cut, find a doctor rather than the bag."],
  ['Where should the bag actually sit?', "In the bride's changing room, not at the mandapam. That is where the wardrobe and beauty emergencies happen, and it is the one space that stays private through the day."],
  ['Do we need a second kit?', 'If the functions are in two venues, yes. Duplicate the wardrobe and beauty pouches. It is cheaper than a car sent across Hyderabad for a packet of pins.'],
  ['When should we pack it?', 'Two days before, not the night before. Packing it early is how you discover the power bank is dead and the sewing kit has no black thread.'],
]

const CSS = `
.ekArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.ekArt *{box-sizing:border-box;margin:0;padding:0}
.ekArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.ekArt section{padding:64px 0}
.ekArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.ekArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.ekArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.ekArt .lede{color:var(--muted);max-width:54ch;margin-top:10px}
.ekArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.ekArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.ekArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.ekArt .hero .eyebrow{color:var(--yellow)}
.ekArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(30px,4.4vw,50px);line-height:1.1;letter-spacing:-.032em;max-width:24ch}
.ekArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:42ch;color:rgba(255,255,255,.86)}
.ekArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.ekArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.ekArt .happens{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}
.ekArt .h{border:1.5px solid var(--rule);border-left:4px solid var(--yellow);border-radius:12px;padding:18px 20px}
.ekArt .h b{display:block;font-size:16px;margin-bottom:4px}
.ekArt .h span{display:block;font-size:14px;color:var(--muted);line-height:1.45}
.ekArt .pouch{background:var(--pink);color:#fff}
.ekArt .pouch .eyebrow{color:rgba(255,255,255,.72)}
.ekArt .pouch h2{color:#fff}
.ekArt .pouch .lede{color:rgba(255,255,255,.84);max-width:58ch}
.ekArt .four{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:34px}
.ekArt .p4{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.ekArt .p4 b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px}
.ekArt .p4 strong{display:block;font-size:17px;font-weight:700;line-height:1.35}
.ekArt .p4 span{display:block;font-size:14px;color:rgba(255,255,255,.74);margin-top:6px;line-height:1.5}
.ekArt .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:26px}
.ekArt .f{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:9px 16px;cursor:pointer;font:inherit;font-size:14.5px;transition:.15s}
.ekArt .f:hover{border-color:var(--ink)}
.ekArt .f[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.ekArt .printBtn{margin-left:auto;border:1.5px solid var(--pink);background:var(--pink);color:#fff;border-radius:999px;padding:10px 20px;cursor:pointer;font:inherit;font-size:15px;font-weight:600;transition:.15s}
.ekArt .printBtn:hover{background:var(--ink);border-color:var(--ink)}
.ekArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:18px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.ekArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.ekArt .grp{margin-top:32px}
.ekArt .grp > h3{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--pink);margin-bottom:14px;font-weight:400}
.ekArt .items{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ekArt .item{border:1.5px solid var(--rule);border-radius:13px;padding:15px 17px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:.15s}
.ekArt .item:hover{border-color:var(--ink)}
.ekArt .item[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.ekArt .item[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.ekArt .item[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.ekArt .tick{flex:0 0 22px;height:22px;border:2px solid var(--rule);border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:700;color:transparent;transition:.15s}
.ekArt .item strong{display:block;font-size:15.5px;line-height:1.3}
.ekArt .item small{display:block;margin-top:3px;font-size:13px;color:var(--muted);line-height:1.4}
.ekArt .who{background:var(--yellow)}
.ekArt .who .eyebrow{color:rgba(26,23,25,.65)}
.ekArt .who .lede{color:rgba(26,23,25,.72);max-width:56ch}
.ekArt .wgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:32px}
.ekArt .w{background:rgba(255,255,255,.55);border-radius:12px;padding:20px}
.ekArt .w b{display:block;font-size:16px;margin-bottom:5px}
.ekArt .w span{display:block;font-size:14.5px;color:rgba(26,23,25,.7);line-height:1.5}
.ekArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.ekArt details:first-of-type{border-top:1.5px solid var(--rule)}
.ekArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.ekArt summary::-webkit-details-marker{display:none}
.ekArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.ekArt details[open] summary::after{content:"\\2212"}
.ekArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.ekArt .cta{background:var(--ink);color:#fff;text-align:center}
.ekArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.ekArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.ekArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
.ekArt .printHead{display:none}
@media (max-width:880px){
  .ekArt .hero{min-height:min(92vh,700px)}
  .ekArt .scrim{padding:250px 0 52px}
  .ekArt .happens,.ekArt .four,.ekArt .items,.ekArt .wgrid{grid-template-columns:1fr}
  .ekArt .four,.ekArt .wgrid{gap:22px}
  .ekArt .printBtn{margin-left:0;width:100%;margin-top:6px}
}
@media (prefers-reduced-motion:reduce){.ekArt *{transition:none!important}}
@media print{
  .ekArt .hero,.ekArt .pouch,.ekArt .who,.ekArt .cta,.ekArt .src,.ekArt details,.ekArt .bar,.ekArt .counter,.ekArt .intro,.ekArt .credit{display:none!important}
  .ekArt section{padding:0}
  .ekArt .items{display:block}
  .ekArt .item{display:block;border:0;border-bottom:1px solid #999;border-radius:0;padding:6px 0 6px 24px;position:relative;background:#fff!important;color:#000!important}
  .ekArt .item::before{content:"";position:absolute;left:0;top:8px;width:12px;height:12px;border:1.5px solid #000}
  .ekArt .item .tick{display:none}
  .ekArt .item small{color:#444!important;font-size:9pt}
  .ekArt .grp > h3{color:#000;margin-top:14px}
  .ekArt .printHead{display:block!important;margin-bottom:12px}
}
`

export default function WeddingEmergencyKit() {
  const [filter, setFilter] = useState<Cat | 'all'>('all')
  const [ticked, setTicked] = useState<Record<string, boolean>>({})

  const match = (key: Cat) => filter === 'all' || key === filter
  const shownKeys = GROUPS.flatMap((g, gi) =>
    match(g.key) ? g.items.map((_, ii) => `${gi}-${ii}`) : [],
  )
  const done = shownKeys.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className="ekArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/emergency-kit-hero.jpg" alt="A wedding emergency kit bag with pins, medicines and chargers" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Wedding day · Emergency kit</div>
            <h1>Every Telugu wedding needs one emergency kit. Here is exactly what goes in it.</h1>
            <p>76 things, sorted into four pouches, so nobody is digging through a bag at the muhurtham.</p>
            <div className="chips">
              <span className="chip">76 items</span>
              <span className="chip">4 pouches</span>
              <span className="chip">Printable</span>
            </div>
          </div>
        </div>
      </header>

      <section className="intro">
        <div className="wrap">
          <div className="eyebrow">Why you need one</div>
          <h2>It is never the thing you planned for</h2>
          <p className="lede">However well the wedding is organised, the day runs on small disasters. All of these are fixable in ten seconds, if somebody has the right bag.</p>
          <div className="happens">
            {SCENARIOS.map(([head, body]) => (
              <div className="h" key={head}><b>{head}</b><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="pouch">
        <div className="wrap">
          <div className="eyebrow">Pack it this way</div>
          <h2>Four pouches, not one big bag</h2>
          <p className="lede">When someone asks for a safety pin at the mandapam, nobody has ninety seconds to empty a rucksack. Use four transparent zip pouches so anybody can find anything without you.</p>
          <div className="four">
            {POUCHES.map(([label, head, body]) => (
              <div className="p4" key={head}><b>{label}</b><strong>{head}</strong><span>{body}</span></div>
            ))}
          </div>
          <p className="lede" style={{ marginTop: 26 }}>Hygiene, snacks and the fix-it bits go loose in the main bag. Transparent pouches matter more than the number of them, because the whole point is finding things without opening anything.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>Everything worth packing</h2>
          <p className="lede">Filter to one pouch, tick as you pack, print it for whoever is doing the shopping.</p>

          <div className="bar">
            {FILTERS.map(([w, label]) => (
              <button key={w} className="f" aria-pressed={filter === w} onClick={() => setFilter(w)}>{label}</button>
            ))}
            <button className="printBtn" onClick={() => window.print()}>Print checklist</button>
          </div>
          <div className="counter"><b>{done}</b> of <span>{shownKeys.length}</span> packed</div>

          <div className="printHead">
            <strong style={{ fontSize: '14pt' }}>Wedding emergency kit</strong><br />
            <span style={{ fontSize: '9pt' }}>pellikart.com</span>
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
                        <button key={key} className="item" aria-pressed={!!ticked[key]} onClick={() => toggle(key)}>
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

      <section className="who">
        <div className="wrap">
          <div className="eyebrow">Hand it to the right person</div>
          <h2>Who carries the bag</h2>
          <p className="lede">Not the bride’s mother. She will be pulled into every ritual and the bag will end up under a chair.</p>
          <div className="wgrid">
            {CARRIER.map(([head, body]) => (
              <div className="w" key={head}><b>{head}</b><span>{body}</span></div>
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
          <h2>Everything else the day needs</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">A general preparedness list, not medical advice. Carry only over the counter items you know how to use, never share prescription medication, and consult a doctor for anything beyond minor first aid. Adapt the list to your own functions, venues and guests.</p>
      </div>
    </div>
  )
}

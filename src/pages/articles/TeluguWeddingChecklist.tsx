import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Telugu wedding planning checklist: month by month".
 *
 * Self-contained designed article. CSS scoped under `.wcArt`; palette mapped to
 * Pellikart theme tokens. The side filter (bride / groom / couple) + tap-to-tick
 * tasks + live "done" counter are React state. Telugu script uses the --telugu
 * font stack (Noto Sans Telugu global).
 *
 * Hero image: /public/articles/planning-checklist-hero.jpg (self-hides if missing).
 */

const Te = ({ children }: { children: React.ReactNode }) => (
  <span className="te" lang="te">{children}</span>
)

type Who = 'bride' | 'groom' | 'couple'
const WHO: Record<Who, string> = { bride: "Bride's side", groom: "Groom's side", couple: 'Couple' }

type Task = { title: React.ReactNode; note: React.ReactNode; who: Who }
type Phase = { phase: string; tasks: Task[] }

const PHASES: Phase[] = [
  {
    phase: '9 to 6 months out',
    tasks: [
      { title: <><Te>జాతకం</Te> matched</>, note: 'Both horoscopes checked. Nothing else is real until this clears.', who: 'bride' },
      { title: 'Agree a rough guest number', note: 'Every other number on this list is priced off it.', who: 'couple' },
      { title: 'Agree who pays for what', note: 'Out loud, at the engagement, with both sets of parents present.', who: 'couple' },
      { title: 'Book the purohit', note: 'The same one usually carries you through every ceremony.', who: 'bride' },
      { title: <>Hold <Te>నిశ్చితార్థం</Te></>, note: 'Engagement. The muhurtham gets fixed here.', who: 'bride' },
      { title: <>Collect the <Te>లగ్న పత్రిక</Te></>, note: 'Check every name spelling before it is read aloud.', who: 'couple' },
      { title: 'Book the function hall', note: 'Six months for a November to March date. Ask about kitchen royalty.', who: 'bride' },
      { title: 'Book the reception venue', note: 'If the two functions are in different places.', who: 'groom' },
      { title: 'Open a shared budget sheet', note: 'One document, both families, no side conversations.', who: 'couple' },
    ],
  },
  {
    phase: '6 to 4 months out',
    tasks: [
      { title: 'Book the caterer', note: 'Confirm per plate rate, biryani included or extra, and the final headcount deadline.', who: 'bride' },
      { title: 'Book the photographer', note: 'Ask what is in the package and what is priced separately.', who: 'couple' },
      { title: 'Book the decorator', note: <>Brief them on the mandap and the <Te>తెరసాల</Te> curtain now.</>, who: 'bride' },
      { title: <>Design the <Te>పెళ్ళి శుభలేఖలు</Te></>, note: 'Design can start early. Printing cannot start without the patrika.', who: 'couple' },
      { title: 'Draft both guest lists', note: 'Separately first, then merge. Expect a negotiation.', who: 'couple' },
      { title: 'Book the makeup artist', note: 'Book the same artist for all functions if you can.', who: 'couple' },
      { title: 'Start bridal shopping', note: 'Muhurtham saree first. Everything else styles around it.', who: 'bride' },
      { title: 'Book mehendi artist', note: 'Peak season books out early.', who: 'bride' },
      { title: 'Plan the sangeet', note: 'Who is dancing, and who needs three months of warning.', who: 'couple' },
    ],
  },
  {
    phase: '4 to 2 months out',
    tasks: [
      { title: 'Print the cards', note: 'Only after the lagna patrika exists.', who: 'couple' },
      { title: 'Distribute cards in person', note: 'The first card traditionally goes to the temple. Then the elders.', who: 'bride' },
      { title: 'Post cards to outstation family', note: 'Allow three weeks for them to arrange leave and travel.', who: 'couple' },
      { title: 'Book rooms for outstation guests', note: 'Near the venue, blocked as a group rate.', who: 'groom' },
      { title: <>Buy the <Te>మంగళసూత్రం</Te></>, note: 'Allow time for the goldsmith. Do not leave this late.', who: 'groom' },
      { title: "Groom's outfits", note: 'Muhurtham dhoti, reception, sangeet.', who: 'groom' },
      { title: 'Menu tasting', note: 'Take one relative with strong opinions. It saves arguments later.', who: 'bride' },
      { title: <>Confirm the <Te>మేనమామ</Te> role</>, note: 'He carries the bride in. Tell him, and tell the photographer.', who: 'bride' },
      { title: 'Book music and sound', note: 'Sannai mellam for the ceremony, DJ for the reception.', who: 'couple' },
      { title: 'Arrange transport', note: 'Cars for the couple, buses if guests are moving between venues.', who: 'groom' },
    ],
  },
  {
    phase: '2 months to 2 weeks',
    tasks: [
      { title: 'Final outfit fittings', note: 'Both of you. Leave room for one more alteration.', who: 'couple' },
      { title: 'Buy ritual items', note: 'Turmeric, kumkuma, tamboolam, coconuts, rice, flowers for each function.', who: 'bride' },
      { title: <>Order the <Te>పసుపు</Te> and nalugu supplies</>, note: 'Turmeric, oil, sandalwood for the pellikuthuru function.', who: 'bride' },
      { title: 'Kashi Yatra set', note: 'Umbrella, stick, fan. Sold as one bundle at pooja shops.', who: 'groom' },
      { title: 'Confirm every vendor in writing', note: 'Timings, inclusions, contact person on the day.', who: 'couple' },
      { title: <>Hold <Te>పసుపు కొట్టడం</Te></>, note: <>Then send the <Te>లగ్న కవిడి</Te> to the groom's house.</>, who: 'bride' },
      { title: 'Final headcount to caterer', note: 'The last day you can change it without paying for it.', who: 'bride' },
      { title: 'Assign a family coordinator', note: 'One cousin per function who carries the vendor phone numbers.', who: 'couple' },
      { title: 'Cash envelopes prepared', note: 'For the purohit, the brother at Kashi Yatra, and vendor balances.', who: 'bride' },
      { title: 'Bridal skin and hair prep', note: 'Whatever you are doing, start it now rather than the week before.', who: 'couple' },
    ],
  },
  {
    phase: 'Wedding week',
    tasks: [
      { title: <><Te>పెళ్ళికూతురు</Te> and <Te>పెళ్ళికొడుకు</Te></>, note: 'Turmeric functions at both houses.', who: 'bride' },
      { title: <><Te>స్నాతకం</Te> and <Te>కాపు కట్టు</Te></>, note: 'Confirm with the purohit what he needs supplied.', who: 'groom' },
      { title: 'Pack a bag for the venue', note: 'Safety pins, spare blouse, phone chargers, medicines, snacks.', who: 'couple' },
      { title: 'Brief the photographer on the run order', note: 'Kashi Yatra, jeelakarra bellam, mangalsutra, talambralu, appagintalu.', who: 'couple' },
      { title: <>Leave time for <Te>అప్పగింతలు</Te></>, note: 'It always takes longer than the schedule says. Do not rush it.', who: 'bride' },
      { title: 'Someone assigned to gifts and cash', note: 'One trusted person, one locked bag, all day.', who: 'bride' },
    ],
  },
  {
    phase: 'After the wedding',
    tasks: [
      { title: <><Te>గృహప్రవేశం</Te></>, note: 'Rice pot at the threshold, harati at the door.', who: 'groom' },
      { title: 'Register the marriage', note: 'No deadline under the Hindu Marriage Act, but do it while the card and witnesses are to hand.', who: 'couple' },
      { title: 'Collect all photos and footage', note: 'Chase the studio. Delivery slips if you do not.', who: 'couple' },
      { title: 'Return rented items', note: 'Jewellery, outfits, decor hire. Check the deposit terms.', who: 'couple' },
    ],
  },
]

const CHAIN: [string, string, string][] = [
  ['First', 'జాతకం', 'Horoscopes matched. Nothing is fixed until this clears.'],
  ['Then', 'నిశ్చితార్థం', 'The engagement, where the purohit fixes and writes the muhurtham.'],
  ['Then', 'లగ్న పత్రిక', 'The written agreement. Your printer needs this before anything.'],
  ['Only now', 'పెళ్ళి శుభలేఖలు', 'Cards print, cards go out, guests book travel.'],
]

const QUIRKS: [string, string][] = [
  ['ఆషాఢ మాసం', 'July and August have no muhurthams at all. If your engagement lands near it, your wedding jumps months, not weeks.'],
  ['మేనమామ', 'The maternal uncle carries the bride in and has a role through the day. Tell him early, and tell the photographer.'],
  ['లగ్న కవిడి', "After pasupu kottadam the bride's family sends the lagna kavidi to the groom's house. Someone has to be assigned to carry it."],
  ['అప్పగింతలు', 'The farewell. Emotionally the heaviest moment of the day and the one families forget to leave time for.'],
  ['తెరసాల', 'A curtain is needed between the couple until jeelakarra bellam. Your decorator must know this in advance.'],
  ['ముహూర్తం', 'Telugu muhurthams often fall late at night. That changes your catering shift, your guest travel and your venue hours.'],
]

const FAQ: [React.ReactNode, React.ReactNode][] = [
  ['How long does a Telugu wedding take to plan?', 'Nine months is comfortable. Six is workable. Under four gets hard for a peak muhurtham date between November and March, because the good halls are already gone.'],
  ['Who pays for what?', (<>Traditionally the bride's family carries the wedding and the groom's family the reception, but this is shifting fast and plenty of families now split it or share by function. Agree it at <Te>నిశ్చితార్థం</Te>, in words, with both sets of parents in the room.</>)],
  ['Can we book a venue before the muhurtham is fixed?', 'You can hold a date provisionally, but do not pay a full advance. Panchangams differ and the purohit may move you by a week, which is enough to lose a non refundable booking.'],
  ['What should we do first, today?', 'Horoscope matching if it has not happened, and a rough guest number if it has. Everything downstream is priced off the guest count.'],
  ['Do we need a wedding planner?', 'For under 300 guests in one venue, a well run spreadsheet and one organised cousin usually beats a planner. Past 400 guests across multiple functions and venues, coordination becomes a full time job.'],
]

const CSS = `
.wcArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.wcArt *{box-sizing:border-box;margin:0;padding:0}
.wcArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.wcArt section{padding:64px 0}
.wcArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.wcArt .eyebrow .te{font-family:var(--telugu);font-weight:600;letter-spacing:0}
.wcArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.wcArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.wcArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.wcArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.wcArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.wcArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.wcArt .hero .eyebrow{color:var(--yellow)}
.wcArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.2vw,76px);line-height:.99;letter-spacing:-.042em;max-width:14ch}
.wcArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:40ch;color:rgba(255,255,255,.86)}
.wcArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.wcArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.wcArt .gate{background:var(--pink);color:#fff}
.wcArt .gate .eyebrow{color:rgba(255,255,255,.72)}
.wcArt .gate h2{color:#fff}
.wcArt .gate .lede{color:rgba(255,255,255,.84);max-width:56ch}
.wcArt .chain{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:32px}
.wcArt .link{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.wcArt .link b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px}
.wcArt .link strong{display:block;font-family:var(--telugu);font-size:20px;font-weight:600;line-height:1.4}
.wcArt .link span{display:block;font-size:14px;color:rgba(255,255,255,.74);margin-top:6px;line-height:1.5}
.wcArt .filters{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
.wcArt .f{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:10px 18px;cursor:pointer;font:inherit;font-size:15px;display:flex;align-items:baseline;gap:8px;transition:.15s}
.wcArt .f:hover{border-color:var(--ink)}
.wcArt .f[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.wcArt .f .te{font-family:var(--telugu);font-weight:600;font-size:16px}
.wcArt .f[aria-pressed="true"] .te{color:var(--yellow)}
.wcArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:20px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.wcArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.wcArt .phase{display:flex;align-items:center;gap:16px;margin:44px 0 10px}
.wcArt .phase span{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--yellow);padding:8px 16px;border-radius:999px;white-space:nowrap}
.wcArt .phase i{flex:1;height:2px;background:var(--rule);display:block}
.wcArt .task{border:1.5px solid var(--rule);border-radius:13px;padding:16px 18px;margin-bottom:9px;display:flex;gap:13px;align-items:flex-start;cursor:pointer;width:100%;font:inherit;color:inherit;text-align:left;transition:.15s}
.wcArt .task:hover{border-color:var(--ink)}
.wcArt .task[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.wcArt .task[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.wcArt .task[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.wcArt .task[aria-pressed="true"] .who{border-color:rgba(255,255,255,.4);color:rgba(255,255,255,.8)}
.wcArt .tick{flex:0 0 24px;height:24px;border:2px solid var(--rule);border-radius:7px;display:grid;place-items:center;font-size:13px;font-weight:700;color:transparent;transition:.15s}
.wcArt .task .tbody{flex:1}
.wcArt .task strong{display:block;font-size:16px;line-height:1.35}
.wcArt .task .te{font-family:var(--telugu);font-weight:600}
.wcArt .task small{display:block;margin-top:3px;font-size:13.5px;color:var(--muted);line-height:1.45}
.wcArt .who{flex:0 0 auto;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--rule);border-radius:5px;padding:3px 8px;color:var(--muted);white-space:nowrap}
.wcArt .only{background:var(--yellow)}
.wcArt .only .eyebrow{color:rgba(26,23,25,.65)}
.wcArt .only .lede{color:rgba(26,23,25,.72);max-width:56ch}
.wcArt .quirks{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
.wcArt .quirk{background:rgba(255,255,255,.55);border-radius:12px;padding:22px}
.wcArt .quirk b{display:block;font-family:var(--telugu);font-size:20px;font-weight:600;line-height:1.4;margin-bottom:6px}
.wcArt .quirk span{display:block;font-size:14.5px;color:rgba(26,23,25,.7);line-height:1.5}
.wcArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.wcArt details:first-of-type{border-top:1.5px solid var(--rule)}
.wcArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.wcArt summary .te{font-family:var(--telugu);font-weight:600}
.wcArt summary::-webkit-details-marker{display:none}
.wcArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.wcArt details[open] summary::after{content:"\\2212"}
.wcArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.wcArt details p .te{font-family:var(--telugu);font-weight:600;color:var(--ink)}
.wcArt .cta{background:var(--ink);color:#fff;text-align:center}
.wcArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.wcArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.wcArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .wcArt .hero{min-height:min(92vh,700px)}
  .wcArt .scrim{padding:250px 0 52px}
  .wcArt .chain,.wcArt .quirks{grid-template-columns:1fr}
  .wcArt .chain{gap:24px}
  .wcArt .task{flex-wrap:wrap}
  .wcArt .who{order:3;margin-left:37px}
}
@media (prefers-reduced-motion:reduce){.wcArt *{transition:none!important}}
`

const FILTERS: [Who | 'all', React.ReactNode][] = [
  ['all', 'Everything'],
  ['bride', <><Te>అమ్మాయి వైపు</Te> Bride's side</>],
  ['groom', <><Te>అబ్బాయి వైపు</Te> Groom's side</>],
  ['couple', 'The couple'],
]

export default function TeluguWeddingChecklist() {
  const [filter, setFilter] = useState<Who | 'all'>('all')
  const [ticked, setTicked] = useState<Record<string, boolean>>({})

  const match = (who: Who) => filter === 'all' || who === filter
  const shownKeys = PHASES.flatMap((p, pi) =>
    p.tasks.map((t, ti) => ({ t, key: `${pi}-${ti}` })).filter(({ t }) => match(t.who)),
  ).map(({ key }) => key)
  const done = shownKeys.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className="wcArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/planning-checklist-hero.jpg" alt="A Telugu family preparing for a wedding" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Planning · <Te>పెళ్ళి</Te></div>
            <h1>The Telugu wedding checklist</h1>
            <p>Not a generic list with muhurtham bolted on. Built around how a pelli actually gets planned, and who in the family is supposed to do what.</p>
            <div className="chips">
              <span className="chip">9 months out</span>
              <span className="chip">Split by side</span>
              <span className="chip">48 tasks</span>
            </div>
          </div>
        </div>
      </header>

      <section className="gate">
        <div className="wrap">
          <div className="eyebrow">Get this order right</div>
          <h2>Four things that block everything after them</h2>
          <p className="lede">Most Telugu wedding delays are not laziness. They are families doing the right tasks in the wrong order.</p>
          <div className="chain">
            {CHAIN.map(([label, te, body]) => (
              <div className="link" key={te}><b>{label}</b><strong lang="te">{te}</strong><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>Month by month</h2>
          <p className="lede">Filter to your side of the family. Tap to tick off.</p>

          <div className="filters">
            {FILTERS.map(([w, label]) => (
              <button key={w} className="f" aria-pressed={filter === w} onClick={() => setFilter(w)}>{label}</button>
            ))}
          </div>
          <div className="counter"><b>{done}</b> of <span>{shownKeys.length}</span> done</div>

          <div>
            {PHASES.map((p, pi) => {
              const visible = p.tasks.map((t, ti) => ({ t, key: `${pi}-${ti}` })).filter(({ t }) => match(t.who))
              if (visible.length === 0) return null
              return (
                <div key={p.phase}>
                  <div className="phase"><span>{p.phase}</span><i /></div>
                  {visible.map(({ t, key }) => (
                    <button key={key} className="task" aria-pressed={!!ticked[key]} onClick={() => toggle(key)}>
                      <span className="tick">✓</span>
                      <span className="tbody"><strong>{t.title}</strong><small>{t.note}</small></span>
                      <span className="who">{WHO[t.who]}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="only">
        <div className="wrap">
          <div className="eyebrow">Only in a Telugu wedding</div>
          <h2>What the generic checklists miss</h2>
          <p className="lede">Six things that will not appear on any national wedding planning list, and all six will come up.</p>
          <div className="quirks">
            {QUIRKS.map(([te, body]) => (
              <div className="quirk" key={te}><b lang="te">{te}</b><span>{body}</span></div>
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
          <h2>Start with the venue, it sets everything else</h2>
          <Link to="/">Browse Hyderabad venues on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Timings are planning guidance rather than rules, and every family runs its own sequence. Ritual names and order follow common Telugu practice and vary by community and region. Confirm ceremony dates and requirements with your purohit.</p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "NRI bride's wedding checklist: 84 tasks from 12 months out".
 *
 * Self-contained designed article. CSS scoped under `.nriArt`; palette mapped to
 * Pellikart theme tokens. The location filter (from abroad / only in India /
 * family) + tap-to-tick tasks + live "done" counter are React state. The list is
 * printable (a scoped `@media print` block hides everything but the tasks).
 *
 * Hero image: /public/articles/nri-checklist-hero.jpg (self-hides if missing).
 */

type Who = 'remote' | 'india' | 'family'
const WHO: Record<Who, string> = {
  remote: 'From abroad',
  india: 'Only in India',
  family: 'Family',
}

type Task = { title: string; note: string; who: Who }
type Phase = { phase: string; tasks: Task[] }

const PHASES: Phase[] = [
  {
    phase: '12 to 9 months out',
    tasks: [
      { title: 'Match the horoscopes', note: 'Nothing else is real until this clears. It gates the whole calendar.', who: 'family' },
      { title: 'Agree a rough guest number', note: 'Every cost downstream is priced off it. Decide before anything else.', who: 'remote' },
      { title: 'Agree who pays for what', note: 'Out loud, both sets of parents, before money starts moving.', who: 'remote' },
      { title: 'Set a total budget in one currency', note: 'Pick one and convert. Two currencies in one sheet causes arguments.', who: 'remote' },
      { title: 'Open a shared planning sheet', note: 'One document, visible to both families, no side conversations.', who: 'remote' },
      { title: 'Name your person on the ground', note: 'One relative who signs, pays and shows up. Not the family in general.', who: 'family' },
      { title: 'Book the purohit', note: 'Usually the same one carries you through every ceremony.', who: 'family' },
      { title: 'Check your passport expiry', note: 'Six months validity beyond travel, and renewals take time from abroad.', who: 'remote' },
      { title: 'Check your leave situation', note: 'Three weeks is more leave than most people have. Start that conversation now.', who: 'remote' },
    ],
  },
  {
    phase: '9 to 6 months out',
    tasks: [
      { title: 'Hold the engagement date', note: 'Nischitartham is where the muhurtham gets fixed.', who: 'family' },
      { title: 'Fly in for the engagement, or join by call', note: 'Many NRI families do this remotely. Decide which, and tell everyone.', who: 'india' },
      { title: 'Get the lagna patrika', note: 'Check every name spelling before it is read aloud. Corrections later are awkward.', who: 'family' },
      { title: 'Only now, book your flights', note: 'Panchangams differ and the date can move by a week.', who: 'remote' },
      { title: 'Shortlist venues on video', note: 'Ask for a walkthrough video, not photos. Photos hide the parking and the generator.', who: 'remote' },
      { title: 'Book the function hall', note: 'Six months for a November to March muhurtham. Ask about kitchen royalty in writing.', who: 'family' },
      { title: 'Book the reception venue', note: 'If the two functions are in different places.', who: 'family' },
      { title: 'Set up an Indian bank arrangement', note: "Whether that is your own NRE account or your treasurer's. Sort it before advances fall due.", who: 'remote' },
      { title: 'Get an Indian SIM sorted', note: 'Or at least know exactly which one you will buy on landing.', who: 'remote' },
    ],
  },
  {
    phase: '6 to 4 months out',
    tasks: [
      { title: 'Shortlist and book the photographer', note: 'Ask what is in the package and what is priced separately. Drone and second shooter usually are not.', who: 'remote' },
      { title: 'Book the caterer', note: 'Per plate rate, biryani included or extra, and the final headcount deadline.', who: 'family' },
      { title: 'Book the decorator', note: 'Brief them on the mandap and the terasala curtain now, not in the last week.', who: 'family' },
      { title: 'Book the makeup artist', note: 'Same artist for all functions if you can. Ask for a trial when you land.', who: 'remote' },
      { title: 'Book the mehendi artist', note: 'Peak season books out early.', who: 'family' },
      { title: 'Design the invitation cards', note: 'Design can start now. Printing waits for the lagna patrika.', who: 'remote' },
      { title: 'Draft both guest lists', note: 'Separately first, then merge. Expect a negotiation.', who: 'remote' },
      { title: 'Plan the sangeet', note: 'Who is dancing, and who needs three months of warning to learn it.', who: 'remote' },
      { title: 'Send save the dates to international guests', note: 'Ahead of the printed cards. They need the runway.', who: 'remote' },
      { title: 'Research your outfit shapes', note: 'Not the shopping, the homework. Know what you want before you walk into a store.', who: 'remote' },
      { title: 'Start any skin or hair routine', note: 'Whatever you are doing, it needs months not weeks.', who: 'remote' },
    ],
  },
  {
    phase: '4 to 2 months out',
    tasks: [
      { title: 'Print the cards', note: 'Only after the patrika exists.', who: 'family' },
      { title: 'Post cards to international guests first', note: 'Three months of notice for leave and fares.', who: 'family' },
      { title: 'Distribute cards in person locally', note: 'The first traditionally goes to the temple, then the elders.', who: 'family' },
      { title: 'Block rooms for outstation guests', note: 'Near the venue, at a group rate.', who: 'family' },
      { title: 'Confirm the mangalsutram with the goldsmith', note: 'Allow real time. This is not a last week purchase.', who: 'family' },
      { title: 'Book music and sound', note: 'Sannai mellam for the ceremony, DJ for the reception.', who: 'family' },
      { title: 'Arrange transport', note: 'Cars for the couple, buses if guests move between venues.', who: 'family' },
      { title: 'Book your own accommodation', note: 'If you are not staying at home. Book early in wedding season.', who: 'remote' },
      { title: 'Buy travel insurance', note: 'For the whole travelling party.', who: 'remote' },
      { title: 'Confirm every vendor in writing', note: 'Timings, inclusions, contact person on the day. WhatsApp confirmations are fine.', who: 'remote' },
      { title: 'Plan the honeymoon', note: 'Or at least block the dates so leave lines up.', who: 'remote' },
      { title: 'Check visa needs for the honeymoon', note: 'Some destinations need a marriage certificate you will not have yet.', who: 'remote' },
    ],
  },
  {
    phase: '2 months to landing',
    tasks: [
      { title: 'Final headcount to the caterer', note: 'The last day you can change it without paying for it.', who: 'family' },
      { title: 'Buy your extra baggage allowance', note: 'Online, in advance. Airport rates are punitive.', who: 'remote' },
      { title: 'Photograph your jewellery', note: 'Every piece, with invoices where you have them. For customs and for insurance.', who: 'remote' },
      { title: 'Decide what to ship ahead', note: 'Unaccompanied baggage can arrive up to two months before you do.', who: 'remote' },
      { title: 'Pack medicines in original packaging', note: 'Labels intact, prescription note for anything unusual.', who: 'remote' },
      { title: 'Download the customs declaration app', note: 'You can file up to three days before arrival.', who: 'remote' },
      { title: 'Assign a family coordinator per function', note: 'One cousin each, holding the vendor phone numbers.', who: 'family' },
      { title: 'Send the ritual run order to the photographer', note: 'Kashi Yatra, jeelakarra bellam, mangalsutra, talambralu, appagintalu.', who: 'remote' },
      { title: 'Prepare cash envelopes', note: 'Purohit, the brother at Kashi Yatra, vendor balances.', who: 'family' },
      { title: 'Confirm what your purohit needs supplied', note: "Every family's list differs. Ask, do not assume.", who: 'family' },
    ],
  },
  {
    phase: 'Days 1 to 3 in India',
    tasks: [
      { title: 'Buy the Indian SIM at the airport', note: 'Before anything else. Everything runs through it.', who: 'india' },
      { title: 'Set up UPI', note: 'Now that you have a local number and an account.', who: 'india' },
      { title: 'Sleep', note: 'Seriously. Jet lag plus a 2am muhurtham is the thing nobody plans for.', who: 'india' },
      { title: 'First tailor visit', note: 'Blouses need three days minimum and usually a second fitting.', who: 'india' },
      { title: 'Buy sarees and lehengas', note: 'Before the tailoring, obviously. Give this a full day.', who: 'india' },
      { title: 'Makeup and hair trial', note: 'Photograph the result in daylight and in artificial light.', who: 'india' },
      { title: 'Meet your treasurer and reconcile', note: 'Go through every payment made so far against the sheet.', who: 'india' },
    ],
  },
  {
    phase: 'Days 4 to 8 in India',
    tasks: [
      { title: 'Venue walkthrough', note: 'Parking, green room, generator, kitchen. The things video hides.', who: 'india' },
      { title: 'Menu tasting', note: 'Take one relative with strong opinions. It saves arguments later.', who: 'india' },
      { title: 'Decor sample review', note: 'See the actual flowers and fabric, not a mood board.', who: 'india' },
      { title: 'Jewellery collection and fitting', note: 'Bangles and necklaces need adjusting more often than expected.', who: 'india' },
      { title: 'Second tailor fitting', note: 'Build in time for one more alteration after this.', who: 'india' },
      { title: 'Buy ritual items', note: 'Turmeric, kumkuma, tamboolam, coconuts, rice, per function.', who: 'india' },
      { title: 'Buy return gifts in bulk', note: 'Far cheaper here than anything you could have carried.', who: 'india' },
      { title: 'Meet the purohit', note: 'Confirm the sequence, the timings and what your family keeps.', who: 'india' },
      { title: 'Buy pooja supplies for each function', note: 'Kashi Yatra set, nalugu supplies, pellikuthuru items.', who: 'india' },
    ],
  },
  {
    phase: 'Wedding week',
    tasks: [
      { title: 'Pack the emergency kit', note: 'Four transparent pouches. Someone calm carries it all day.', who: 'india' },
      { title: 'Confirm every vendor arrival time', note: 'A call each, the day before. Not a message.', who: 'india' },
      { title: 'Hand out the run sheet', note: 'Every coordinator, every function, printed.', who: 'india' },
      { title: 'Pellikuthuru and nalugu', note: 'Turmeric functions at both houses.', who: 'india' },
      { title: 'Assign one person to gifts and cash', note: 'One trusted person, one locked bag, all day.', who: 'family' },
      { title: 'Leave real time for appagintalu', note: 'It always runs longer than the schedule says. Do not rush it.', who: 'india' },
      { title: 'Charge everything the night before', note: 'Phones, power banks, cameras.', who: 'india' },
    ],
  },
  {
    phase: 'Before you fly back',
    tasks: [
      { title: 'Register the marriage', note: 'Both of you and three witnesses, in person. Do not leave India first.', who: 'india' },
      { title: 'Collect the certificate', note: 'You need it for the visa, the bank, the name change, everything.', who: 'india' },
      { title: 'Start the apostille', note: 'State or SDM authentication, then the MEA stamp. Begin before you fly.', who: 'india' },
      { title: 'Collect all photos and footage', note: 'On a drive in your hand, not promised by email.', who: 'india' },
      { title: 'Produce the temporary import certificate', note: 'If you brought jewellery on one, show it with the pieces at departure.', who: 'india' },
      { title: 'Get an export certificate', note: 'If taking valuables out that you plan to bring back.', who: 'india' },
      { title: 'Log every gift received', note: 'Who gave what, for thank yous and future reciprocity.', who: 'family' },
      { title: 'Return anything rented', note: 'Jewellery, outfits, decor hire. Check the deposit terms.', who: 'family' },
      { title: 'Arrange shipping for the rest', note: 'Everything that will not fit. Quote it before the last day.', who: 'india' },
      { title: 'Update your name where needed', note: 'Passport, bank, employer, immigration file. Start the list now.', who: 'remote' },
    ],
  },
]

const USE: [string, string, string][] = [
  ['Tag one', 'From abroad', 'Do it on your own time, at your own hour. Roughly half the list. These are the tasks that quietly get left and then crush the trip.'],
  ['Tag two', 'Only in India', 'Needs you physically present. These have to be scheduled into your days on the ground before anything else fills them.'],
  ['Tag three', 'Family', 'Someone in Hyderabad has to do it. Assign each one to a named person, not to the family in general.'],
]

const MISTAKES: [string, string][] = [
  ['Flying home before registering the marriage', 'Both of you and three witnesses have to appear in person at the Sub-Registrar office. Leave first and you are booking another trip or waiting months on a spouse visa file. This is the single most common one.'],
  ['Booking flights before the muhurtham is fixed', 'Panchangams differ and your purohit may move the date by a week. Hold the dates, do not pay for non refundable fares until the lagna patrika exists.'],
  ['Landing three days before', 'Jet lag, a late night muhurtham, three days of functions and three days of tailoring do not fit into seventy two hours. A week is the minimum, two is comfortable.'],
  ['No Indian number until day four', 'UPI, OTPs, vendor calls and every booking confirmation run through an Indian mobile number. Sort it at the airport, not later in the week.'],
]

const CUSTOMS: [string, string][] = [
  ['40g', 'Duty free jewellery for a female passenger of Indian origin living abroad over a year. Value caps were removed.'],
  ['20g', 'The limit for every other passenger. Allowances cannot be pooled between two people.'],
  ['₹75,000', 'General duty free allowance, up from ₹50,000, arriving by any route other than a land border.'],
  ['0', 'Gold coins and bars count for nothing here. They sit outside the jewellery allowance and must be declared.'],
]

const FAQ: [string, string][] = [
  ['How long do I actually need in India?', 'Three weeks is comfortable, two is workable, one is tight. Tailoring alone needs three days with a fitting, and you want to be past jet lag before the functions start.'],
  ['Can I plan the whole thing over video calls?', 'Shortlisting, yes. Venue walkthroughs, menu tasting, fabric and decor samples, and anything involving your own measurements need you there. Book the shortlisting calls early so the in person days are decisions rather than discovery.'],
  ['How do I pay vendors from abroad?', 'Most want UPI or bank transfer, which needs an Indian number and account. In practice one family member in Hyderabad becomes the treasurer. Make that deliberate, keep a shared sheet, and log every payment against a written quote.'],
  ['Should I buy my outfits here or in India?', 'India, almost always. More choice, better prices, and stitching turned around in three days that nothing abroad can match. Carry only the things you genuinely cannot replace.'],
  ['When do I need the marriage certificate apostilled?', 'If you are filing for a spouse visa or updating your marital status abroad. It runs state or SDM authentication first, then the MEA stamp. Start it before you fly, not after.'],
  ['What do I do about guests flying in?', 'Send their cards three months out, earlier than everyone else. International guests need the longest runway for leave and fares, and they are the ones most likely to drop out if told late.'],
]

const FILTERS: [Who | 'all', string][] = [
  ['all', 'All 84'],
  ['remote', 'From abroad'],
  ['india', 'Only in India'],
  ['family', 'Family'],
]

const CSS = `
.nriArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.nriArt *{box-sizing:border-box;margin:0;padding:0}
.nriArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.nriArt section{padding:64px 0}
.nriArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.nriArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.nriArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.nriArt .lede{color:var(--muted);max-width:56ch;margin-top:10px}
.nriArt .hero{position:relative;min-height:min(86vh,740px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.nriArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 38%;display:block}
.nriArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.nriArt .hero .eyebrow{color:var(--yellow)}
.nriArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(32px,4.8vw,54px);line-height:1.06;letter-spacing:-.032em;max-width:22ch}
.nriArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:42ch;color:rgba(255,255,255,.86)}
.nriArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.nriArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.nriArt .use{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}
.nriArt .u{border:1.5px solid var(--rule);border-radius:14px;padding:22px}
.nriArt .u .tag{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);display:block;margin-bottom:9px}
.nriArt .u h3{margin-bottom:6px;font-size:17px}
.nriArt .u p{font-size:14.5px;color:var(--muted);line-height:1.5}
.nriArt .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:26px}
.nriArt .f{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:9px 17px;cursor:pointer;font:inherit;font-size:14.5px;transition:.15s}
.nriArt .f:hover{border-color:var(--ink)}
.nriArt .f[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.nriArt .printBtn{margin-left:auto;border:1.5px solid var(--pink);background:var(--pink);color:#fff;border-radius:999px;padding:10px 20px;cursor:pointer;font:inherit;font-size:15px;font-weight:600;transition:.15s}
.nriArt .printBtn:hover{background:var(--ink);border-color:var(--ink)}
.nriArt .counter{display:inline-flex;align-items:baseline;gap:9px;margin-top:18px;background:var(--ink);color:#fff;border-radius:999px;padding:10px 20px;font-family:var(--mono);font-size:14px}
.nriArt .counter b{color:var(--yellow);font-size:19px;font-weight:500}
.nriArt .phase{display:flex;align-items:center;gap:16px;margin:42px 0 12px}
.nriArt .phase span{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--yellow);padding:8px 16px;border-radius:999px;white-space:nowrap}
.nriArt .phase i{flex:1;height:2px;background:var(--rule);display:block}
.nriArt .task{border:1.5px solid var(--rule);border-radius:13px;padding:15px 17px;margin-bottom:9px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;width:100%;font:inherit;color:inherit;text-align:left;transition:.15s}
.nriArt .task:hover{border-color:var(--ink)}
.nriArt .task[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.nriArt .task[aria-pressed="true"] .tick{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}
.nriArt .task[aria-pressed="true"] small{color:rgba(255,255,255,.7)}
.nriArt .task[aria-pressed="true"] .who{border-color:rgba(255,255,255,.4);color:rgba(255,255,255,.8)}
.nriArt .tick{flex:0 0 22px;height:22px;border:2px solid var(--rule);border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:700;color:transparent;transition:.15s}
.nriArt .task .tbody{flex:1}
.nriArt .task strong{display:block;font-size:16px;line-height:1.3}
.nriArt .task small{display:block;margin-top:3px;font-size:13.5px;color:var(--muted);line-height:1.45}
.nriArt .who{flex:0 0 auto;font-family:var(--mono);font-size:10px;letter-spacing:.09em;text-transform:uppercase;border:1px solid var(--rule);border-radius:5px;padding:3px 8px;color:var(--muted);white-space:nowrap}
.nriArt .warn{background:var(--pink);color:#fff}
.nriArt .warn .eyebrow{color:rgba(255,255,255,.72)}
.nriArt .warn h2{color:#fff}
.nriArt .warn .lede{color:rgba(255,255,255,.84);max-width:58ch}
.nriArt .wgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:32px}
.nriArt .w{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.nriArt .w strong{display:block;font-size:16.5px;margin-bottom:6px}
.nriArt .w span{display:block;font-size:15px;color:rgba(255,255,255,.8);line-height:1.5}
.nriArt .cust{background:var(--yellow)}
.nriArt .cust .eyebrow{color:rgba(26,23,25,.65)}
.nriArt .cust .lede{color:rgba(26,23,25,.74);max-width:58ch}
.nriArt .cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:30px}
.nriArt .c{background:rgba(255,255,255,.6);border-radius:12px;padding:20px}
.nriArt .c b{display:block;font-family:var(--mono);font-size:clamp(20px,2.8vw,26px);font-weight:500;letter-spacing:-.02em}
.nriArt .c span{display:block;font-size:14px;color:rgba(26,23,25,.7);margin-top:7px;line-height:1.45}
.nriArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.nriArt details:first-of-type{border-top:1.5px solid var(--rule)}
.nriArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.nriArt summary::-webkit-details-marker{display:none}
.nriArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.nriArt details[open] summary::after{content:"\\2212"}
.nriArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.nriArt .cta{background:var(--ink);color:#fff;text-align:center}
.nriArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.nriArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.nriArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
.nriArt .printHead{display:none}
@media (max-width:880px){
  .nriArt .hero{min-height:min(92vh,700px)}
  .nriArt .scrim{padding:250px 0 52px}
  .nriArt .use,.nriArt .wgrid,.nriArt .cgrid{grid-template-columns:1fr}
  .nriArt .wgrid,.nriArt .cgrid{gap:22px}
  .nriArt .printBtn{margin-left:0;width:100%;margin-top:6px}
  .nriArt .task{flex-wrap:wrap}
  .nriArt .who{order:3;margin-left:34px}
}
@media (prefers-reduced-motion:reduce){.nriArt *{transition:none!important}}
@media print{
  .nriArt .hero,.nriArt .warn,.nriArt .cust,.nriArt .cta,.nriArt .src,.nriArt details,.nriArt .bar,.nriArt .counter,.nriArt .intro{display:none!important}
  .nriArt section{padding:0}
  .nriArt .task{display:block;border:0;border-bottom:1px solid #999;border-radius:0;padding:6px 0 6px 24px;position:relative;background:#fff!important;color:#000!important;margin:0}
  .nriArt .task::before{content:"";position:absolute;left:0;top:8px;width:12px;height:12px;border:1.5px solid #000}
  .nriArt .task .tick{display:none}
  .nriArt .task small{color:#444!important;font-size:9pt}
  .nriArt .who{border:0;padding:0;color:#666!important;font-size:8pt}
  .nriArt .phase{margin:14px 0 6px}
  .nriArt .phase span{background:none;color:#000;padding:0;font-weight:700}
  .nriArt .phase i{display:none}
  .nriArt .printHead{display:block!important;margin-bottom:12px}
}
`

export default function NriBrideChecklist() {
  const [filter, setFilter] = useState<Who | 'all'>('all')
  const [ticked, setTicked] = useState<Record<string, boolean>>({})

  const match = (who: Who) => filter === 'all' || who === filter
  const shownKeys = PHASES.flatMap((p, pi) =>
    p.tasks.map((t, ti) => ({ t, key: `${pi}-${ti}` })).filter(({ t }) => match(t.who)),
  ).map(({ key }) => key)
  const done = shownKeys.filter((k) => ticked[k]).length
  const toggle = (k: string) => setTicked((prev) => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className="nriArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/nri-checklist-hero.jpg" alt="A bride video calling family in India while planning her wedding" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">NRI bride · Wedding in India</div>
            <h1>Getting married in India but living abroad? Here is every single thing you need to do, in order.</h1>
            <p>84 tasks across 12 months, sorted by what you can do from where you are and what has to wait until you land.</p>
            <div className="chips">
              <span className="chip">84 tasks</span>
              <span className="chip">From abroad or in India</span>
              <span className="chip">Printable</span>
            </div>
          </div>
        </div>
      </header>

      <section className="intro">
        <div className="wrap">
          <div className="eyebrow">How this works</div>
          <h2>Three kinds of task, and only one of them is urgent</h2>
          <p className="lede">Planning from abroad fails for one reason. Everything gets treated as equally postponable until you land, and then two weeks have to absorb six months of decisions.</p>
          <div className="use">
            {USE.map(([tag, head, body]) => (
              <div className="u" key={head}>
                <span className="tag">{tag}</span>
                <h3>{head}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">The checklist</div>
          <h2>Everything, in the order it needs doing</h2>
          <p className="lede">Filter by where it happens. Tick as you go. Print the family column and send it to whoever is holding things together at home.</p>

          <div className="bar">
            {FILTERS.map(([w, label]) => (
              <button key={w} className="f" aria-pressed={filter === w} onClick={() => setFilter(w)}>{label}</button>
            ))}
            <button className="printBtn" onClick={() => window.print()}>Print checklist</button>
          </div>
          <div className="counter"><b>{done}</b> of <span>{shownKeys.length}</span> done</div>

          <div className="printHead">
            <strong style={{ fontSize: '14pt' }}>NRI bride&rsquo;s wedding checklist</strong><br />
            <span style={{ fontSize: '9pt' }}>pellikart.com</span>
          </div>

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

      <section className="warn">
        <div className="wrap">
          <div className="eyebrow">The four that actually go wrong</div>
          <h2>Mistakes that cost NRI brides months</h2>
          <p className="lede">Not small errors. These are the ones that mean a second flight, a delayed visa, or a wedding planned around the wrong date.</p>
          <div className="wgrid">
            {MISTAKES.map(([head, body]) => (
              <div className="w" key={head}><strong>{head}</strong><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="cust">
        <div className="wrap">
          <div className="eyebrow">Packing the jewellery</div>
          <h2>Four customs numbers to know</h2>
          <p className="lede">India rewrote its baggage rules in February 2026, so most of what you will find online is out of date. The short version.</p>
          <div className="cgrid">
            {CUSTOMS.map(([n, body]) => (
              <div className="c" key={n}><b>{n}</b><span>{body}</span></div>
            ))}
          </div>
          <p className="lede" style={{ marginTop: 26 }}>
            <strong>The provision nobody mentions:</strong> if you are carrying the family jewellery for the wedding and taking it back, ask Customs on arrival for a temporary baggage import certificate. Jewellery carried temporarily for an event is handled under that route rather than the 40 gram limit. It expires at your first departure or six months, and you must produce it with the jewellery when you leave.
          </p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">Quick answers</div>
          <h2>Still wondering</h2>
          <div style={{ marginTop: 26 }}>
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>Vendors used to planning with families abroad</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Customs figures follow the Central Board of Indirect Taxes and Customs FAQs on the Baggage Rules 2026, in force from 2 February 2026. Rules change and individual cases are decided at the airport, so confirm at cbic.gov.in before travelling. Timings here are planning guidance, not rules, and every family runs its own sequence.</p>
      </div>
    </div>
  )
}

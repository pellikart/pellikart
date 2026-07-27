import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "What to gift at a wedding: 48 ideas by budget".
 *
 * Self-contained designed article. CSS scoped under `.gfArt`; palette mapped to
 * Pellikart theme tokens. The budget-band tabs + gift grid are React state.
 *
 * Product links open a live search rather than a fixed listing, so nothing 404s
 * when an item goes out of stock. To turn on Amazon affiliate links, append your
 * Associates tag to the amazon.in URLs built by `AMZ` below (e.g. &tag=pellikart-21).
 *
 * Hero image: /public/articles/wedding-gifts-hero.jpg (self-hides if missing).
 */

// Link builders — each returns [label, url]. Search URLs by design.
type L = [string, string]
const AMZ = (q: string): L => ['Amazon', 'https://www.amazon.in/s?k=' + encodeURIComponent(q)]
const FLP = (q: string): L => ['Flipkart', 'https://www.flipkart.com/search?q=' + encodeURIComponent(q)]
const ETS = (q: string): L => ['Etsy', 'https://www.etsy.com/in-en/search?q=' + encodeURIComponent(q)]
const ITK = (q: string): L => ['iTokri', 'https://www.itokri.com/search?q=' + encodeURIComponent(q)]
const OKH = (q: string): L => ['Okhai', 'https://okhai.org/search?q=' + encodeURIComponent(q)]
const GOO = (q: string): L => ['Search', 'https://www.google.com/search?q=' + encodeURIComponent(q)]

type Gift = { name: string; price: string; note: string; links: L[] }
type Band = { key: string; label: string; gifts: Gift[] }

const BANDS: Band[] = [
  {
    key: 'a',
    label: 'Under ₹1,500',
    gifts: [
      { name: 'Shagun cash', price: '₹1,001 or ₹1,101', note: 'The default, and never the wrong answer. Odd ending, name on the cover.', links: [AMZ('shagun envelopes wedding pack'), FLP('money envelope wedding')] },
      { name: 'Bidriware coaster set', price: '₹900 to ₹1,500', note: 'Silver inlaid on blackened alloy, made near Hyderabad. Nobody else will bring one.', links: [AMZ('bidriware coaster set'), ITK('bidri'), GOO('bidriware coasters Hyderabad buy')] },
      { name: 'Avakaya and gongura pickle set', price: '₹700 to ₹1,400', note: 'Hand pounded, from a named maker rather than a supermarket. Deeply Telugu and always finished.', links: [AMZ('avakaya pickle homemade andhra'), FLP('gongura pickle andhra')] },
      { name: 'Star map of the muhurtham', price: '₹800 to ₹1,500', note: 'The sky above the venue at the exact minute they were married. Framed, dated, one of a kind.', links: [ETS('custom star map india print'), AMZ('personalised star map frame')] },
      { name: 'Brass davara tumbler and Araku beans', price: '₹1,000 to ₹1,500', note: 'Filter coffee, done properly. The set they will use every single morning.', links: [AMZ('brass davara tumbler set'), AMZ('araku coffee beans 500g')] },
      { name: 'Nirmal painted keepsake box', price: '₹800 to ₹1,500', note: 'Adilabad craft, hand painted. A gift that says you thought about where they are from.', links: [ITK('nirmal painting'), AMZ('nirmal painted wooden box'), GOO('Nirmal paintings Telangana buy online')] },
      { name: 'Attar set from the old city', price: '₹900 to ₹1,500', note: 'Three vials from a Charminar perfumer. Cheap, unusual, and unmistakably Hyderabadi.', links: [AMZ('attar gift set indian'), GOO('attar shops Charminar Hyderabad')] },
      { name: 'Blank recipe journal', price: '₹600 to ₹1,200', note: 'For her mother’s recipes before they are lost. The most quietly loved gift on this page.', links: [AMZ('recipe journal blank hardcover'), ETS('personalised recipe book')] },
      { name: 'Plantable seed paper frame', price: '₹500 to ₹1,000', note: 'Their wedding date printed on paper that grows into tulsi. Sentimental and not naff.', links: [ETS('seed paper personalised india'), AMZ('plantable seed paper card')] },
      { name: 'Kondapalli toy pair', price: '₹700 to ₹1,400', note: 'Softwood, natural dyes, GI tagged. Sits on a shelf for thirty years.', links: [ITK('kondapalli toys'), AMZ('kondapalli toys wooden'), GOO('Kondapalli toys buy online')] },
      { name: 'Custom brass nameplate', price: '₹1,000 to ₹1,500', note: 'Both their names, for the new door. Practical and the first thing every visitor reads.', links: [ETS('brass nameplate custom india'), AMZ('personalised brass name plate house')] },
      { name: 'Illustrated portrait from a photo', price: '₹800 to ₹1,500', note: 'Send an engagement photo, get back a line drawing. Costs little, gets framed.', links: [ETS('custom couple portrait illustration india'), GOO('custom couple illustration India commission')] },
    ],
  },
  {
    key: 'b',
    label: '₹1,500 to ₹5,000',
    gifts: [
      { name: 'Shagun cash', price: '₹2,101, ₹3,101 or ₹5,001', note: 'Still the most useful thing you can put in their hands.', links: [AMZ('shagun envelope premium set')] },
      { name: 'Cheriyal scroll painting', price: '₹2,500 to ₹5,000', note: 'Telangana’s own scroll art, GI tagged, painted on khadi. A wall piece with a story attached.', links: [ITK('cheriyal painting'), GOO('Cheriyal scroll painting buy online'), AMZ('cheriyal painting wall art')] },
      { name: 'Pembarthi brass urli', price: '₹2,500 to ₹4,500', note: 'Sheet metal craft from Warangal. Floats flowers at every function they ever host.', links: [AMZ('brass urli bowl large'), ITK('brass urli'), GOO('Pembarthi brass craft buy')] },
      { name: 'Silver jeelakarra bellam bowls', price: '₹3,000 to ₹5,000', note: 'A pair of small silver bowls, engraved with the date. Nobody thinks of gifting the ritual back to them.', links: [AMZ('silver bowl pair pooja engraved'), GOO('silver bowls engraving Hyderabad')] },
      { name: 'Printed family recipe book', price: '₹2,000 to ₹4,000', note: 'Collect recipes from both mothers, get it properly bound. Takes effort, lands harder than anything bought.', links: [ETS('custom printed recipe book'), GOO('photobook printing India custom recipe book')] },
      { name: 'Pottery or cooking class for two', price: '₹2,500 to ₹5,000', note: 'A Sunday together instead of an object. Increasingly what younger couples actually want.', links: [GOO('pottery class for couples Hyderabad'), GOO('cooking class Hyderabad couples')] },
      { name: 'Custom neon or LED sign', price: '₹3,000 to ₹5,000', note: 'Their names, or a Telugu line that means something to them. Reused at every party after.', links: [ETS('custom neon sign name india'), AMZ('customised led neon name sign')] },
      { name: 'Handloom Pochampally bedcover', price: '₹2,500 to ₹5,000', note: 'Ikat woven an hour from the city. Better made and more personal than a mall bedsheet.', links: [ITK('pochampally ikat bedcover'), OKH('bedcover'), AMZ('pochampally ikat double bedsheet')] },
      { name: 'Twelve month letter box', price: '₹1,500 to ₹3,000', note: 'Twelve sealed envelopes, one prompt each, opened monthly through their first year.', links: [ETS('first year marriage letter box'), AMZ('keepsake box wooden personalised')] },
      { name: 'Single estate coffee kit', price: '₹2,500 to ₹5,000', note: 'Burr grinder, Araku or Chikmagalur beans, a South Indian filter. For the couple who take it seriously.', links: [AMZ('manual coffee grinder burr'), AMZ('south indian coffee filter stainless steel')] },
      { name: 'Kalamkari wall panel', price: '₹2,000 to ₹4,500', note: 'Hand painted, natural dyes, from Srikalahasti. An heirloom at a mid range price.', links: [ITK('kalamkari wall art'), AMZ('kalamkari painting wall hanging'), GOO('Srikalahasti kalamkari buy online')] },
      { name: 'Personalised map print', price: '₹1,500 to ₹3,000', note: 'Where they met, where they married, coordinates and dates. Simple idea, always framed.', links: [ETS('custom map print couple india'), AMZ('personalised map poster frame')] },
    ],
  },
  {
    key: 'c',
    label: '₹5,000 to ₹15,000',
    gifts: [
      { name: 'Shagun cash', price: '₹5,101 or ₹11,001', note: 'Standard for a close friend or a relative.', links: [AMZ('shagun envelope premium set')] },
      { name: 'Silver pooja thali set', price: '₹6,000 to ₹15,000', note: 'The gift the elders in both families will notice and approve of. Comes out every festival.', links: [AMZ('silver pooja thali set'), FLP('silver puja thali')] },
      { name: 'Weekend stay near Hyderabad', price: '₹6,000 to ₹15,000', note: 'Ananthagiri, Pocharam or Vikarabad. Book it, hand over the confirmation, tell them to just go.', links: [GOO('resorts near Hyderabad weekend Ananthagiri'), GOO('Vikarabad resort booking')] },
      { name: 'Commissioned oil portrait', price: '₹8,000 to ₹15,000', note: 'From their wedding photograph, painted rather than printed. It outlives every appliance on this list.', links: [ETS('commissioned oil portrait from photo india'), GOO('commission portrait painting artist India')] },
      { name: 'Custom teak pooja mandir shelf', price: '₹8,000 to ₹15,000', note: 'Made to fit their flat. The one piece of furniture every new Telugu home needs and nobody gifts.', links: [GOO('custom pooja mandir carpenter Hyderabad'), AMZ('wooden pooja mandir wall mounted teak')] },
      { name: 'Mangalagiri or Gadwal silk saree', price: '₹5,000 to ₹15,000', note: 'Handloom from home. Received better than anything with a designer label on it.', links: [ITK('gadwal saree'), OKH('handloom saree'), AMZ('mangalagiri silk cotton saree')] },
      { name: 'Anniversary shoot, prepaid', price: '₹8,000 to ₹15,000', note: 'Booked for one year out. Nobody gifts the couple a reason to dress up again.', links: [GOO('couple photoshoot Hyderabad booking'), GOO('anniversary photoshoot photographer Hyderabad')] },
      { name: 'Triply cookware set', price: '₹6,000 to ₹12,000', note: 'The upgrade nobody buys themselves in the first five years of a marriage.', links: [AMZ('triply stainless steel cookware set'), FLP('triply cookware set')] },
      { name: 'Framed heirloom restoration', price: '₹6,000 to ₹12,000', note: 'Take a damaged photo of their grandparents, get it restored and framed. Costs little, undoes people.', links: [GOO('old photo restoration service India'), ETS('photo restoration service')] },
      { name: 'Robot vacuum', price: '₹12,000 to ₹15,000', note: 'For two people who both work. The most useful object in this entire band.', links: [AMZ('robot vacuum cleaner'), FLP('robotic vacuum cleaner')] },
      { name: 'Bluetooth speaker, good one', price: '₹7,000 to ₹15,000', note: 'Lives in the house, gets used daily, survives three moves.', links: [AMZ('marshall bluetooth speaker'), FLP('bluetooth speaker premium')] },
      { name: 'Honeymoon contribution', price: '₹5,001 to ₹15,001', note: 'Say exactly what it is for. It turns cash into a memory rather than a number.', links: [GOO('honeymoon packages from Hyderabad')] },
    ],
  },
  {
    key: 'd',
    label: '₹15,000 and up',
    gifts: [
      { name: 'Shagun cash', price: '₹15,001, ₹21,001 or ₹51,001', note: 'Close family territory. The amount follows how close you are, not how loud you want to be.', links: [AMZ('shagun envelope premium set')] },
      { name: 'Gold coin', price: "At the day's rate", note: 'One to five grams. Traditional from the couple’s aunts and uncles. Keep the invoice.', links: [GOO('gold coin buy Hyderabad jeweller today rate'), AMZ('gold coin 24k certified')] },
      { name: 'Night at Taj Falaknuma', price: '₹25,000 to ₹60,000', note: 'A Nizam’s palace, in their own city. The one gift a Hyderabadi couple will talk about for years.', links: [GOO('Taj Falaknuma Palace Hyderabad booking')] },
      { name: 'Kanjeevaram or Dharmavaram silk', price: '₹15,000 to ₹60,000', note: 'A wedding silk from close family. Go and buy it with her mother, not alone.', links: [GOO('Dharmavaram silk saree showroom Hyderabad'), AMZ('kanjivaram pure silk saree')] },
      { name: 'Custom jewellery with a family stone', price: '₹20,000 upward', note: 'Reset a grandmother’s stone into something she will actually wear. Sentiment plus craft.', links: [GOO('custom jewellery designer Hyderabad reset stone')] },
      { name: 'Commissioned family portrait', price: '₹25,000 to ₹60,000', note: 'Both families, painted, one canvas. Ambitious, expensive, and it hangs for generations.', links: [GOO('family portrait painting commission India artist')] },
      { name: 'Washing machine, front load', price: '₹28,000 to ₹45,000', note: 'The appliance that changes a working couple’s week the most. Coordinate so nobody duplicates it.', links: [AMZ('front load washing machine'), FLP('front load washing machine')] },
      { name: 'Air conditioner', price: '₹30,000 to ₹45,000', note: 'In Hyderabad, arguably the most loving object on this page.', links: [AMZ('split air conditioner 1.5 ton'), FLP('split ac 1.5 ton inverter')] },
      { name: 'Refrigerator, double door', price: '₹25,000 to ₹45,000', note: 'Check with the family first. Two fridges is a story the couple will tell against you.', links: [AMZ('double door refrigerator'), FLP('double door refrigerator')] },
      { name: 'Queen mattress', price: '₹18,000 to ₹40,000', note: 'Unglamorous, expensive, and the thing they will never buy well for themselves.', links: [AMZ('queen size mattress memory foam'), FLP('queen size mattress')] },
      { name: 'Full silver pooja set', price: '₹20,000 to ₹50,000', note: 'A generational gift, usually from grandparents. Engrave the date on the base.', links: [AMZ('silver pooja set complete'), GOO('silver pooja articles Hyderabad')] },
      { name: 'Honeymoon flights or hotel', price: '₹15,000 to ₹50,000', note: 'Book it in their names and hand over the confirmation, not the money.', links: [GOO('honeymoon packages from Hyderabad international')] },
    ],
  },
]

const RULES: [string, string][] = [
  ['Write your name on it', 'Families reconcile the envelope list afterwards, for thank yous and for reciprocity at the next family wedding. An unlabelled envelope is a small mystery nobody has time for.'],
  ['Do not hand cash mid ritual', 'Give it to the couple or a designated family member at the reception, or drop it in the gift box at the entrance table.'],
  ['Take the return gift', 'You will be handed something on the way out. Accept it graciously even if it is sweets you have no room for.'],
  ['Pooling is normal', 'Colleagues commonly put in ₹200 to ₹500 each. Whoever seals the envelope adds the extra rupee at the end.'],
  ['Giving both? Still add the one', 'A silk saree plus ₹1,001 is a complete gift. The cash part follows the rule even when it is the smaller half.'],
  ['Give what you can', '₹501 with a real blessing beats skipping the wedding because you could not afford ₹5,001. Families understand, and they remember who came.'],
]

const AVOID: [string, string][] = [
  ['Anything sharp', 'Knife sets, scissors, letter openers. Read as cutting ties, however good the brand.'],
  ['Round numbers', '₹500, ₹1,000, ₹5,000. The single most common mistake, and the easiest to fix.'],
  ['Large boxed items', 'Someone has to carry it from the venue at midnight. Send it to the house instead.'],
  ['Black or leather', 'Both are avoided at auspicious occasions in most families. Not worth the risk on a gift.'],
  ['Anything that needs assembly', 'It will sit in the box for a year. If it is furniture, send it after they have moved in.'],
  ['Something you would not use', 'The decorative elephant lamp is a running joke for a reason.'],
]

const FAQ: [React.ReactNode, React.ReactNode][] = [
  ['How much should I give if I am attending with my family?', 'Scale it. A couple attending together generally gives more than one person, and a family across several functions more again. If you are unsure, ask a mutual friend who is closer to the hosts.'],
  ['Is UPI acceptable now?', 'Some families accept it, many still prefer a physical envelope, and at a Telugu wedding the envelope is safer. If you do send it digitally, follow up with a message so it can be recorded against your name.'],
  ['Do I gift at every function?', 'No. One gift covers the wedding. If you are close to the family and attending the engagement or reception separately, a small token at those is a nice touch but not expected.'],
  ['Is gold appropriate?', 'Gold is traditional from very close family, particularly parents, grandparents and the aunts and uncles of the couple. For everyone else it can feel like an overreach, and cash is more useful anyway.'],
  [(<>What is the <span className="te" lang="te">తాంబూలం</span> I was handed?</>), 'The return gift. Hosts budget for it separately and every guest gets one. Take it, and do not feel you owe anything back for it.'],
  ['What if I genuinely cannot afford much?', 'Then give ₹501 and turn up. Attendance is worth more to the family than the envelope, and nobody is comparing amounts on the day.'],
]

const CSS = `
.gfArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.gfArt *{box-sizing:border-box;margin:0;padding:0}
.gfArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.gfArt section{padding:64px 0}
.gfArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.gfArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.gfArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.gfArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.gfArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.gfArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.gfArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.gfArt .hero .eyebrow{color:var(--yellow)}
.gfArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.2vw,76px);line-height:.99;letter-spacing:-.042em;max-width:14ch}
.gfArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:40ch;color:rgba(255,255,255,.86)}
.gfArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.gfArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.gfArt .cash{background:var(--pink);color:#fff}
.gfArt .cash .eyebrow{color:rgba(255,255,255,.72)}
.gfArt .cash h2{color:#fff}
.gfArt .cash .lede{color:rgba(255,255,255,.84);max-width:56ch}
.gfArt .plusone{display:flex;flex-wrap:wrap;align-items:baseline;gap:14px;margin-top:30px;font-family:var(--mono);font-size:clamp(22px,3.4vw,30px)}
.gfArt .plusone s{color:rgba(255,255,255,.42)}
.gfArt .plusone i{font-style:normal;color:rgba(255,255,255,.5);font-size:20px}
.gfArt .plusone b{color:var(--yellow);font-weight:500}
.gfArt .rel{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px}
.gfArt .rel div{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.gfArt .rel b{display:block;font-family:var(--mono);font-size:clamp(18px,2.6vw,23px);font-weight:500;letter-spacing:-.02em}
.gfArt .rel span{display:block;font-size:14px;color:rgba(255,255,255,.74);margin-top:6px;line-height:1.45}
.gfArt .tabs{display:flex;flex-wrap:wrap;gap:9px;margin-top:28px}
.gfArt .tab{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:11px 20px;cursor:pointer;font:inherit;font-size:15px;transition:.15s}
.gfArt .tab:hover{border-color:var(--ink)}
.gfArt .tab[aria-selected="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.gfArt .gifts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}
.gfArt .gift{border:1.5px solid var(--rule);border-radius:13px;padding:18px 20px}
.gfArt .gift b{display:block;font-size:16px;font-weight:700;line-height:1.35}
.gfArt .gift .price{display:block;font-family:var(--mono);font-size:15px;color:var(--pink);margin:7px 0 6px}
.gfArt .gift span{display:block;font-size:13.5px;color:var(--muted);line-height:1.45}
.gfArt .gift .buy{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.gfArt .gift .buy a{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--pink);border:1.5px solid var(--rule);border-radius:6px;padding:5px 10px;transition:.15s}
.gfArt .gift .buy a:hover{border-color:var(--pink);background:var(--pink);color:#fff}
.gfArt .rules{background:var(--yellow)}
.gfArt .rules .eyebrow{color:rgba(26,23,25,.65)}
.gfArt .rules .lede{color:rgba(26,23,25,.72);max-width:56ch}
.gfArt .rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
.gfArt .rule{background:rgba(255,255,255,.55);border-radius:12px;padding:22px}
.gfArt .rule b{display:block;font-size:16.5px;font-weight:700;margin-bottom:6px}
.gfArt .rule span{display:block;font-size:14.5px;color:rgba(26,23,25,.7);line-height:1.5}
.gfArt .avoid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:30px}
.gfArt .no{border:1.5px solid var(--rule);border-left:4px solid var(--pink);border-radius:12px;padding:18px 20px}
.gfArt .no b{display:block;font-size:16px;margin-bottom:5px}
.gfArt .no span{display:block;font-size:14.5px;color:var(--muted);line-height:1.5}
.gfArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.gfArt details:first-of-type{border-top:1.5px solid var(--rule)}
.gfArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.gfArt summary .te{font-family:var(--telugu);font-weight:600}
.gfArt summary::-webkit-details-marker{display:none}
.gfArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.gfArt details[open] summary::after{content:"\\2212"}
.gfArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.gfArt details p .te{font-family:var(--telugu);font-weight:600;color:var(--ink)}
.gfArt .cta{background:var(--ink);color:#fff;text-align:center}
.gfArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.gfArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.gfArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .gfArt .hero{min-height:min(92vh,700px)}
  .gfArt .scrim{padding:250px 0 52px}
  .gfArt .gifts,.gfArt .rgrid,.gfArt .avoid{grid-template-columns:1fr}
  .gfArt .rel{grid-template-columns:1fr 1fr;gap:22px}
}
@media (prefers-reduced-motion:reduce){.gfArt *{transition:none!important}}
`

export default function WeddingGiftIdeas() {
  const [band, setBand] = useState(0)
  const gifts = BANDS[band].gifts

  return (
    <div className="gfArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/wedding-gifts-hero.jpg" alt="Wedding gift envelopes and a gift box at a reception" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Guest guide · Gifting</div>
            <h1>What to gift at a wedding</h1>
            <p>The honest answer is cash. But if you want to bring something, here are 48 options priced in rupees.</p>
            <div className="chips">
              <span className="chip">Never a round number</span>
              <span className="chip">4 budget bands</span>
              <span className="chip">48 ideas, linked</span>
            </div>
          </div>
        </div>
      </header>

      <section className="cash">
        <div className="wrap">
          <div className="eyebrow">Start here</div>
          <h2>Cash is still the gift</h2>
          <p className="lede">A round number reads as complete and closed. The extra rupee keeps it open, which is the whole point of a blessing.</p>
          <div className="plusone">
            <s>₹500</s><i>becomes</i><b>₹501</b>
            <s>₹1,000</s><i>becomes</i><b>₹1,001</b>
            <s>₹5,000</s><i>becomes</i><b>₹5,001</b>
          </div>
          <div className="rel">
            <div><b>₹1,100 to ₹2,100</b><span>Colleague or acquaintance</span></div>
            <div><b>₹2,100 to ₹5,100</b><span>Friend, attending alone</span></div>
            <div><b>₹5,100 to ₹21,000</b><span>Close friend or relative</span></div>
            <div><b>₹10,000 upward</b><span>Close family</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">If you want to bring something</div>
          <h2>48 gifts, priced and linked</h2>
          <p className="lede">Prices are indicative for Hyderabad in 2026. Links open a live search, so nothing here goes out of stock.</p>
          <div className="tabs" role="tablist">
            {BANDS.map((b, i) => (
              <button key={b.key} className="tab" role="tab" aria-selected={i === band} onClick={() => setBand(i)}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="gifts">
            {gifts.map((g) => (
              <div className="gift" key={g.name}>
                <b>{g.name}</b>
                <span className="price">{g.price}</span>
                <span>{g.note}</span>
                {g.links.length > 0 && (
                  <span className="buy">
                    {g.links.map(([label, url]) => (
                      <a key={label + url} href={url} target="_blank" rel="noopener sponsored">{label}</a>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rules">
        <div className="wrap">
          <div className="eyebrow">Etiquette</div>
          <h2>Six things guests get wrong</h2>
          <p className="lede">None of these cost money. All of them get noticed.</p>
          <div className="rgrid">
            {RULES.map(([head, body]) => (
              <div className="rule" key={head}><b>{head}</b><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">Skip these</div>
          <h2>What not to bring</h2>
          <div className="avoid">
            {AVOID.map(([head, body]) => (
              <div className="no" key={head}><b>{head}</b><span>{body}</span></div>
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
          <h2>Planning the wedding rather than attending one?</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Cash ranges reflect urban Indian norms published for 2026 and vary widely by community, city and family standing. Gift prices are indicative Hyderabad retail ranges and move with brand, season and store. Product links open a live search rather than a fixed listing. When unsure about an amount, ask someone closer to the hosts.</p>
      </div>
    </div>
  )
}

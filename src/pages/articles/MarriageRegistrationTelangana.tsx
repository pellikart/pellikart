import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Marriage registration in Telangana".
 *
 * A self-contained, designed article. All CSS is scoped under `.mrArt` (see the
 * <style> block below) so its global-ish selectors (section, h2, details, *)
 * can't leak into the rest of the app. Palette maps to the Pellikart theme
 * tokens (--color-magenta / --color-mustard). Interactivity (law switcher, doc
 * checklist) is React state; the FAQ uses native <details>.
 *
 * Hero image: place a file at /public/articles/marriage-registration-hero.jpg.
 * Until it exists the hero degrades to its dark background (img self-hides).
 */

const STEPS: Record<'hma' | 'sma', { title: string; list: [string, string][] }> = {
  hma: {
    title: 'Four steps',
    list: [
      ['Fill Form A online', 'Registration & Stamps portal. Pay the fee.'],
      ['Book your slot', 'Pick the Sub-Registrar office that suits you.'],
      ['Go in person', 'Both of you, three witnesses, all originals.'],
      ['Collect the certificate', 'Usually the same day, once verified.'],
    ],
  },
  sma: {
    title: 'Five steps',
    list: [
      ['Establish residence', 'One of you lives in the jurisdiction 30 days.'],
      ['Give notice', 'Thirty days ahead, with the prescribed fee.'],
      ['Wait out objections', 'Thirty days on the public notice board.'],
      ['Solemnise', 'Within the next 60 days, three witnesses present.'],
      ['Sign and collect', 'Notice lapses at 90 days, so do not miss it.'],
    ],
  },
}

const DOCS: [string, string][] = [
  ['Form A', 'Signed by both of you'],
  ['Joint photograph', 'The two of you together'],
  ['Wedding card', 'An affidavit works if lost'],
  ['Age proof', 'SSC memo or passport, both'],
  ['Address proof', 'Either one of you'],
  ['Three witnesses', 'Who attended, with their ID'],
]

const CSS = `
.mrArt{
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
.mrArt *{box-sizing:border-box;margin:0;padding:0}
.mrArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.mrArt section{padding:64px 0}
.mrArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.mrArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.mrArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.mrArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.mrArt .hero{position:relative;min-height:min(90vh,780px);display:flex;align-items:flex-end;overflow:hidden;background:var(--ink)}
.mrArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:52% 30%;display:block}
.mrArt .scrim{position:relative;z-index:2;width:100%;padding:220px 0 68px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.mrArt .hero .eyebrow{color:var(--yellow)}
.mrArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.4vw,78px);line-height:.98;letter-spacing:-.042em;max-width:14ch}
.mrArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:36ch;color:rgba(255,255,255,.86)}
.mrArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.mrArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.mrArt .credit{position:absolute;right:24px;bottom:18px;z-index:3;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:rgba(255,255,255,.6)}
.mrArt .fork{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:34px}
.mrArt .path{background:var(--card);border:1.5px solid var(--rule);border-radius:14px;padding:26px;cursor:pointer;text-align:left;font:inherit;color:inherit;transition:border-color .18s,transform .18s}
.mrArt .path:hover{border-color:var(--ink);transform:translateY(-2px)}
.mrArt .path[aria-pressed="true"]{border-color:var(--pink);border-width:2.5px;background:#FDF0F7}
.mrArt .path .act{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--pink)}
.mrArt .path h3{margin:8px 0 8px}
.mrArt .path p{font-size:15px;color:var(--muted)}
.mrArt .path .time{display:inline-block;margin-top:16px;background:var(--ink);color:var(--yellow);border-radius:6px;padding:5px 12px;font-family:var(--mono);font-size:12.5px}
.mrArt .grid6{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:34px}
.mrArt .doc{background:var(--card);border:1.5px solid var(--rule);border-radius:14px;padding:22px;display:flex;gap:14px;align-items:flex-start;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%;transition:border-color .18s,background .18s}
.mrArt .doc:hover{border-color:var(--ink)}
.mrArt .doc[aria-pressed="true"]{background:var(--pink);border-color:var(--pink);color:#fff}
.mrArt .doc[aria-pressed="true"] .tick{background:#fff;border-color:#fff;color:var(--pink)}
.mrArt .doc[aria-pressed="true"] small{color:rgba(255,255,255,.75)}
.mrArt .tick{flex:0 0 26px;height:26px;border:2px solid var(--rule);border-radius:7px;display:grid;place-items:center;font-size:14px;font-weight:700;color:transparent;transition:.18s}
.mrArt .doc strong{display:block;font-size:16px;line-height:1.3}
.mrArt .doc small{display:block;margin-top:4px;font-size:13.5px;color:var(--muted)}
.mrArt .steps{margin-top:34px;border-top:1.5px solid var(--rule)}
.mrArt .step{display:grid;grid-template-columns:78px 1fr 200px;gap:26px;align-items:center;padding:26px 0;border-bottom:1.5px solid var(--rule)}
.mrArt .num{font-family:var(--display);font-size:44px;font-weight:700;letter-spacing:-.03em;color:var(--pink);line-height:1}
.mrArt .step h3{margin-bottom:5px}
.mrArt .step p{font-size:15.5px;color:var(--muted)}
.mrArt .fees{background:var(--pink);color:#fff}
.mrArt .fees .eyebrow{color:rgba(255,255,255,.72)}
.mrArt .fees h2{color:#fff}
.mrArt .money{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px}
.mrArt .money div{border-top:2px solid rgba(255,255,255,.3);padding-top:16px}
.mrArt .money b{display:block;font-family:var(--mono);font-size:clamp(28px,4.2vw,40px);font-weight:500;letter-spacing:-.03em}
.mrArt .money span{display:block;font-size:14px;color:rgba(255,255,255,.72);margin-top:6px}
.mrArt .helpline{margin-top:34px;font-family:var(--mono);font-size:14px;color:rgba(255,255,255,.8);border-top:1px solid rgba(255,255,255,.22);padding-top:18px}
.mrArt .myth{display:grid;grid-template-columns:1fr 46px 1fr;gap:20px;align-items:center;padding:26px 0;border-bottom:1.5px solid var(--rule)}
.mrArt .myth:first-of-type{border-top:1.5px solid var(--rule)}
.mrArt .wrong{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--pink);text-decoration-thickness:2px;font-size:16px}
.mrArt .arrow{font-family:var(--mono);color:var(--pink);text-align:center;font-size:18px}
.mrArt .right{font-weight:500;font-size:16.5px}
.mrArt .stamp{display:inline-block;transform:rotate(-4deg);border:2.5px solid var(--pink);color:var(--pink);border-radius:8px;padding:6px 14px;margin-top:10px;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.mrArt .where{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:34px}
.mrArt .place{background:var(--card);border:1.5px solid var(--rule);border-radius:14px;padding:26px}
.mrArt .place .eyebrow{margin-bottom:10px}
.mrArt .place p{font-size:15.5px;color:var(--muted);margin-top:6px}
.mrArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.mrArt details:first-of-type{border-top:1.5px solid var(--rule)}
.mrArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.mrArt summary::-webkit-details-marker{display:none}
.mrArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.mrArt details[open] summary::after{content:"\\2212"}
.mrArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.mrArt .cta{background:var(--ink);color:#fff;text-align:center}
.mrArt .cta h2{color:#fff;max-width:20ch;margin:0 auto}
.mrArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.mrArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .mrArt .hero{min-height:min(94vh,720px)}
  .mrArt .heroImg{object-position:56% 22%}
  .mrArt .scrim{padding:260px 0 52px}
  .mrArt .fork,.mrArt .where,.mrArt .grid6,.mrArt .money{grid-template-columns:1fr}
  .mrArt .grid6{gap:10px}
  .mrArt .money{gap:22px}
  .mrArt .step{grid-template-columns:56px 1fr;gap:16px}
  .mrArt .num{font-size:34px}
  .mrArt .myth{grid-template-columns:1fr;gap:8px}
  .mrArt .arrow{text-align:left}
}
@media (prefers-reduced-motion:reduce){.mrArt *{transition:none!important}}
`

export default function MarriageRegistrationTelangana() {
  const [path, setPath] = useState<'hma' | 'sma'>('hma')
  const [ticked, setTicked] = useState<boolean[]>(() => DOCS.map(() => false))
  const step = STEPS[path]

  const toggleDoc = (i: number) =>
    setTicked((prev) => prev.map((t, idx) => (idx === i ? !t : t)))

  return (
    <div className="mrArt">
      <style>{CSS}</style>

      <header className="hero">
        <img
          className="heroImg"
          src="/articles/marriage-registration-hero.jpg"
          alt="A couple signing the register, flowers on the table beside them"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Paperwork · Telangana</div>
            <h1>Register your marriage</h1>
            <p>Six documents. One visit. No deadline, whatever you have been told.</p>
            <div className="chips">
              <span className="chip">₹200 fee</span>
              <span className="chip">₹0 if inter-caste</span>
              <span className="chip">3 witnesses</span>
              <span className="chip">Same day</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">Start here</div>
          <h2>Which law applies to you?</h2>
          <p className="lede">Tap one. The steps below change to match.</p>
          <div className="fork">
            <button className="path" aria-pressed={path === 'hma'} onClick={() => setPath('hma')}>
              <span className="act">Hindu Marriage Act 1955</span>
              <h3>You had a traditional pelli</h3>
              <p>Both Hindu, or Sikh, Buddhist, Arya Samaj, or married by Hindu custom.</p>
              <span className="time">Same day</span>
            </button>
            <button className="path" aria-pressed={path === 'sma'} onClick={() => setPath('sma')}>
              <span className="act">Special Marriage Act 1954</span>
              <h3>Inter-faith, or a civil ceremony</h3>
              <p>Any religion, any caste. Also the route if you want no religious ceremony.</p>
              <span className="time">About 6 weeks</span>
            </button>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Carry these</div>
          <h2>Six things in the folder</h2>
          <p className="lede">Tap to tick them off as you pack.</p>
          <div className="grid6">
            {DOCS.map(([title, note], i) => (
              <button key={title} className="doc" aria-pressed={ticked[i]} onClick={() => toggleDoc(i)}>
                <span className="tick">✓</span>
                <span>
                  <strong>{title}</strong>
                  <small>{note}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="stamp">Names must match your SSC exactly</p>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">The process</div>
          <h2>{step.title}</h2>
          <div className="steps">
            {step.list.map(([head, body], i) => (
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

      <section className="fees">
        <div className="wrap">
          <div className="eyebrow">What it costs</div>
          <h2>Less than the flowers</h2>
          <div className="money">
            <div>
              <b>₹200</b>
              <span>Registration fee</span>
            </div>
            <div>
              <b>₹0</b>
              <span>If inter-caste</span>
            </div>
            <div>
              <b>₹5</b>
              <span>Register extract</span>
            </div>
            <div>
              <b>₹10</b>
              <span>Registered off-site</span>
            </div>
          </div>
          <p className="helpline">Registration &amp; Stamps helpline: 1800 599 4788</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">Correcting the record</div>
          <h2>Three things you were told wrong</h2>
          <div className="myth">
            <p className="wrong">Register within 30 days or pay a penalty</p>
            <p className="arrow">→</p>
            <p className="right">No time limit at all under the Hindu Marriage Act. Married in 2019? Walk in tomorrow.</p>
          </div>
          <div className="myth">
            <p className="wrong">The registration fee is ₹100</p>
            <p className="arrow">→</p>
            <p className="right">The department's published schedule sets it at ₹200, and nothing at all for inter-caste marriages.</p>
          </div>
          <div className="myth">
            <p className="wrong">You must go to your local Sub-Registrar</p>
            <p className="arrow">→</p>
            <p className="right">Inside GHMC, three Deputy Inspector General offices at Nampally can register you too.</p>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Where to go</div>
          <h2>Your Sub-Registrar is your Marriage Officer</h2>
          <div className="where">
            <div className="place">
              <div className="eyebrow">Option one</div>
              <h3>Where you married</h3>
              <p>The office with jurisdiction over the venue.</p>
            </div>
            <div className="place">
              <div className="eyebrow">Option two</div>
              <h3>Where either of you lives</h3>
              <p>If you have been resident there six months before the wedding.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Quick answers</div>
          <h2>Still wondering</h2>
          <div style={{ marginTop: 26 }}>
            <details>
              <summary>Can we do the whole thing online?</summary>
              <p>You can fill the form and pay online. Both of you and all three witnesses still have to appear in person to sign, and the certificate is collected in person.</p>
            </details>
            <details>
              <summary>What if we married outside Telangana?</summary>
              <p>You register where the marriage took place, unless one of you has been resident in a Telangana jurisdiction for six months before the wedding.</p>
            </details>
            <details>
              <summary>Can Muslims or Christians use the Hindu Marriage Act?</summary>
              <p>No. It does not apply to Muslim, Christian, Parsi or Jewish communities. The Special Marriage Act applies to everyone.</p>
            </details>
            <details>
              <summary>Does the certificate expire?</summary>
              <p>Never. It is valid for life and needs no renewal.</p>
            </details>
            <details>
              <summary>We lost the wedding card.</summary>
              <p>An affidavit from the priest who performed the ceremony, or a joint affidavit from you and the witnesses, is generally accepted in its place.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <h2>One less thing to figure out alone</h2>
          <Link to="/">Plan the rest on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">
          Verified against the Registration and Stamps Department, Government of Telangana: Marriage FAQs and Hindu
          Marriage Procedure. Fee schedule from Rule 15, Hindu Marriage Rules 1965. Inter-caste exemption from GO Ms No.
          1175, Home (General-A), 1976. Fees are revised by government order from time to time, so confirm at the counter.
        </p>
      </div>
    </div>
  )
}

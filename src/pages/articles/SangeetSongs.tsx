import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Article: "Sangeet songs: 8 Telugu playlists for every part of the night".
 *
 * Self-contained designed article. CSS scoped under `.sgArt`; palette mapped to
 * Pellikart theme tokens. The playlist tabs + track list are React state.
 *
 * Each track links to a Spotify and YouTube search rather than a fixed track, so
 * nothing breaks when a catalogue changes. To drop in a real embedded playlist,
 * build it in Spotify, Share → Embed playlist, and replace the `.embed` block.
 *
 * Hero image: /public/articles/sangeet-songs-hero.jpg (self-hides if missing).
 */

const SP = (q: string) => 'https://open.spotify.com/search/' + encodeURIComponent(q)
const YT = (q: string) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' song')

type Track = [title: string, film: string]
type Playlist = { name: string; sub: string; note: string; tracks: Track[] }

const PLAYLISTS: Playlist[] = [
  {
    name: 'Grand entry',
    sub: 'The couple walks in',
    note: 'One song, big, and rehearsed to the second. Pick something the room recognises inside four beats.',
    tracks: [
      ['Butta Bomma', 'Ala Vaikunthapurramuloo, 2020'],
      ['Ramuloo Ramulaa', 'Ala Vaikunthapurramuloo, 2020'],
      ['Kalaavathi', 'Sarkaru Vaari Paata, 2022'],
      ['Chuttamalle', 'Devara, 2024'],
      ['Srivalli', 'Pushpa, 2021'],
      ['Yentha Sakkagunnave', 'Rangasthalam, 2018'],
      ['Guche Gulabi', 'Kushi, 2023'],
      ['Naatu Naatu', 'RRR, 2022'],
      ['Adiga Adiga', 'Ninnu Kori, 2017'],
      ['Samajavaragamana', 'Ala Vaikunthapurramuloo, 2020'],
    ],
  },
  {
    name: 'The face off',
    sub: "Bride's side vs groom's side",
    note: 'The bit everyone films. Alternate sides, three songs each, and give both teams the same running time.',
    tracks: [
      ['Naatu Naatu', 'RRR, 2022'],
      ['Ramuloo Ramulaa', 'Ala Vaikunthapurramuloo, 2020'],
      ['Seeti Maar', 'DJ Duvvada Jagannadham, 2017'],
      ['Blockbuster', 'Sarrainodu, 2016'],
      ['Jigelu Rani', 'Rangasthalam, 2018'],
      ['Kurchi Madathapetti', 'Guntur Kaaram, 2024'],
      ['Bangaru Kodi Petta', 'Gabbar Singh, 2012'],
      ['Ringa Ringa', 'Arya 2, 2009'],
      ['Aa Ante Amalapuram', 'Arya, 2004'],
      ['Peelings', 'Pushpa 2, 2024'],
    ],
  },
  {
    name: 'Amma and Nanna',
    sub: 'The set nobody plans',
    note: 'Four songs, that is all it takes. The parents will not ask for this and it will be the clip that travels furthest in the family group.',
    tracks: [
      ['Abbanee Teeyani Debba', 'Jagadeka Veerudu Athiloka Sundari, 1990'],
      ['Priya Priya', 'Geethanjali, 1989'],
      ['Om Namaha', 'Geethanjali, 1989'],
      ['Balapam Patti', 'Sagara Sangamam, 1983'],
      ['Vevela Gopemma', 'Sagara Sangamam, 1983'],
      ['Yamaho Yamaho', 'Indra, 2002'],
      ['Chandamama', 'Nuvvostanante Nenoddantana, 2005'],
      ['Nachavule Nachavule', 'Nuvvostanante Nenoddantana, 2005'],
      ['Chinni Chinni Aasa', 'Roja, 1992'],
      ['Aa Ante Amalapuram', 'Arya, 2004'],
    ],
  },
  {
    name: "The couple's duet",
    sub: 'Slow, and only if you want to',
    note: 'Choose for the tempo you can actually dance to, not the song you love most. Those are rarely the same track.',
    tracks: [
      ['Inkem Inkem Inkem Kaavaale', 'Geetha Govindam, 2018'],
      ['Samajavaragamana', 'Ala Vaikunthapurramuloo, 2020'],
      ['Naa Roja Nuvve', 'Kushi, 2023'],
      ['Nee Kannu Neeli Samudram', 'Uppena, 2021'],
      ['Neeli Neeli Aakasam', '30 Rojullo Preminchadam Ela, 2021'],
      ['Adiga Adiga', 'Ninnu Kori, 2017'],
      ['Vachinde', 'Fidaa, 2017'],
      ['Samayama', 'Hi Nanna, 2023'],
      ['Yentha Sakkagunnave', 'Rangasthalam, 2018'],
      ['Guche Gulabi', 'Kushi, 2023'],
    ],
  },
  {
    name: 'Cousins, full volume',
    sub: 'Peak of the night',
    note: 'Put this block in the middle, never at the start. Everything after it will feel like a comedown.',
    tracks: [
      ['Oo Antava', 'Pushpa, 2021'],
      ['Saami Saami', 'Pushpa, 2021'],
      ['Kissik', 'Pushpa 2, 2024'],
      ['Dum Masala', 'Guntur Kaaram, 2024'],
      ['Jaragandi', 'Game Changer, 2025'],
      ['Sitharala Sirapadu', 'Rangasthalam, 2018'],
      ['Fear Song', 'Devara, 2024'],
      ['Seeti Maar', 'DJ Duvvada Jagannadham, 2017'],
      ['Kevvu Keka', 'Gabbar Singh, 2012'],
      ['Blockbuster', 'Sarrainodu, 2016'],
    ],
  },
  {
    name: 'Pasupu and pindi',
    sub: 'Daytime, haldi, outdoors',
    note: 'Different job entirely. This runs while people are being smeared in turmeric, so it wants folk energy rather than club energy.',
    tracks: [
      ['Rangamma Mangamma', 'Rangasthalam, 2018'],
      ['Jigelu Rani', 'Rangasthalam, 2018'],
      ['Vachinde', 'Fidaa, 2017'],
      ['Sitharala Sirapadu', 'Rangasthalam, 2018'],
      ['Mastaaru Mastaaru', 'Sir, 2023'],
      ['Ramuloo Ramulaa', 'Ala Vaikunthapurramuloo, 2020'],
      ['Bangaru Kodi Petta', 'Gabbar Singh, 2012'],
      ['Butta Bomma', 'Ala Vaikunthapurramuloo, 2020'],
      ['Aa Ante Amalapuram', 'Arya, 2004'],
      ['Saami Saami', 'Pushpa, 2021'],
    ],
  },
  {
    name: 'Mixed crowd',
    sub: 'For guests who do not speak Telugu',
    note: 'Save this for the open floor at the end. Nobody needs to know the words, which is the whole point.',
    tracks: [
      ['Naatu Naatu', 'RRR, 2022'],
      ['London Thumakda', 'Queen, 2014'],
      ['Kala Chashma', 'Baar Baar Dekho, 2016'],
      ['Gallan Goodiyaan', 'Dil Dhadakne Do, 2015'],
      ['Nachde Ne Saare', 'Baar Baar Dekho, 2016'],
      ['Morni Banke', 'Badhaai Ho, 2018'],
      ['Ghungroo', 'War, 2019'],
      ['Bole Chudiyan', 'Kabhi Khushi Kabhie Gham, 2001'],
      ['Desi Girl', 'Dostana, 2008'],
      ['Oo Antava', 'Pushpa, 2021'],
    ],
  },
  {
    name: 'The last hour',
    sub: 'Floor open, no choreography',
    note: 'Only songs the whole room can join. This is not the moment for anyone’s favourite deep cut.',
    tracks: [
      ['Naatu Naatu', 'RRR, 2022'],
      ['Butta Bomma', 'Ala Vaikunthapurramuloo, 2020'],
      ['Oo Antava', 'Pushpa, 2021'],
      ['Ramuloo Ramulaa', 'Ala Vaikunthapurramuloo, 2020'],
      ['Kurchi Madathapetti', 'Guntur Kaaram, 2024'],
      ['Blockbuster', 'Sarrainodu, 2016'],
      ['Seeti Maar', 'DJ Duvvada Jagannadham, 2017'],
      ['Kissik', 'Pushpa 2, 2024'],
      ['Ringa Ringa', 'Arya 2, 2009'],
      ['Kevvu Keka', 'Gabbar Singh, 2012'],
    ],
  },
]

const ARC: [string, string, string][] = [
  ['First hour', 'Warm up', 'People are still eating. Melody, low volume, nobody on the floor yet.'],
  ['Then', 'The entry', 'Couple walks in. One big song, well rehearsed, everyone watching.'],
  ['Then', 'Performances', 'Cousins, siblings, the face off. Peak energy of the night.'],
  ['Then', 'The parents', 'The set nobody expects. Plan it, do not leave it to the DJ.'],
  ['Last hour', 'Free for all', 'Floor opens, no choreography, the songs everyone already knows.'],
]

const BRIEF: [string, string][] = [
  ['A do not play list', 'Shorter and more useful than a play list. Every family has two or three songs attached to someone who has passed, or to a broken alliance.'],
  ['Names, in Telugu, spelled out', 'Give the DJ a written sheet. Announcements butchered on a mic are the thing guests remember badly.'],
  ['Cut versions for performances', 'Two minutes, not five. Send edited tracks a week ahead, not on a pen drive at the venue.'],
  ['One person owns the mic', 'Not the DJ, not the anchor. A cousin who knows who everyone is and when to stop talking.'],
  ['Volume ceiling for the first hour', 'Elders are talking and eating. If they leave early because it is too loud, the room empties with them.'],
  ['A last song, chosen in advance', 'Decide how the night ends rather than letting it fade out when the lights come up.'],
]

const FAQ: [string, string][] = [
  ['How long should a sangeet run?', 'Three to four hours including dinner. Past that, the performances start repeating and the elders have gone home.'],
  ['How many performances is too many?', 'Six to eight, two to three minutes each. More than ten and the audience stops watching, which is unkind to whoever goes last.'],
  ['How far ahead should we start practising?', 'Six weeks for a group with working adults in it. Anyone flying in needs the choreography video a month ahead so they arrive knowing it.'],
  ['Live band or DJ?', 'A DJ for dancing, a small live setup for the first hour if the budget allows. Live only, for a full sangeet, tends to run out of energy.'],
  ['Should the couple perform together?', 'Only if you want to. A well done couple’s dance is lovely and a rushed one is uncomfortable. Sitting it out is a perfectly normal choice.'],
  ['What about non Telugu guests?', 'Use the mixed crowd playlist for the last hour. Everyone knows those songs, which is exactly the point when the floor is open to all.'],
]

const CSS = `
.sgArt{
  --paper:#FFFFFF;--ink:#1A1719;--pink:var(--color-magenta,#E91E78);--yellow:var(--color-mustard,#D4A017);--card:#FFFFFF;
  --display:'Playfair Display',Georgia,serif;--body:'Inter',system-ui,-apple-system,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --telugu:'Noto Sans Telugu','Nirmala UI','Telugu Sangam MN','Kohinoor Telugu',Gautami,sans-serif;
  --rule:rgba(26,23,25,.16);--muted:rgba(26,23,25,.60);--wrap:1080px;
  background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.sgArt *{box-sizing:border-box;margin:0;padding:0}
.sgArt .wrap{max-width:var(--wrap);margin:0 auto;padding:0 24px}
.sgArt section{padding:64px 0}
.sgArt .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--pink);margin-bottom:14px}
.sgArt h2{font-family:var(--display);font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.1;letter-spacing:-.022em}
.sgArt h3{font-family:var(--body);font-size:18px;font-weight:700;line-height:1.3}
.sgArt .lede{color:var(--muted);max-width:52ch;margin-top:10px}
.sgArt .hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;background:var(--yellow)}
.sgArt .heroImg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.sgArt .scrim{position:relative;z-index:2;width:100%;padding:210px 0 66px;background:linear-gradient(to top,rgba(18,14,16,.90) 0%,rgba(18,14,16,.72) 30%,rgba(18,14,16,.34) 58%,rgba(18,14,16,0) 92%)}
.sgArt .hero .eyebrow{color:var(--yellow)}
.sgArt .hero h1{font-family:var(--display);font-weight:700;color:#fff;font-size:clamp(42px,7.2vw,76px);line-height:.99;letter-spacing:-.042em;max-width:13ch}
.sgArt .hero p{margin-top:18px;font-size:clamp(17px,2.2vw,21px);max-width:40ch;color:rgba(255,255,255,.86)}
.sgArt .chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.sgArt .chip{background:var(--yellow);color:var(--ink);border-radius:999px;padding:9px 18px;font-family:var(--mono);font-size:13px;letter-spacing:.02em}
.sgArt .order{background:var(--pink);color:#fff}
.sgArt .order .eyebrow{color:rgba(255,255,255,.72)}
.sgArt .order h2{color:#fff}
.sgArt .order .lede{color:rgba(255,255,255,.84);max-width:56ch}
.sgArt .arc{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:34px}
.sgArt .beat{border-top:2px solid rgba(255,255,255,.32);padding-top:16px}
.sgArt .beat b{display:block;font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);margin-bottom:8px}
.sgArt .beat strong{display:block;font-size:17px;font-weight:700;line-height:1.35}
.sgArt .beat span{display:block;font-size:14px;color:rgba(255,255,255,.74);margin-top:5px;line-height:1.5}
.sgArt .tabs{display:flex;flex-wrap:wrap;gap:9px;margin-top:28px}
.sgArt .tab{border:1.5px solid var(--rule);background:#fff;color:var(--ink);border-radius:999px;padding:11px 19px;cursor:pointer;font:inherit;font-size:15px;transition:.15s}
.sgArt .tab:hover{border-color:var(--ink)}
.sgArt .tab[aria-selected="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.sgArt .plHead{margin-top:32px;padding-bottom:18px;border-bottom:2px solid var(--ink)}
.sgArt .plHead h3{font-size:23px;letter-spacing:-.015em}
.sgArt .plHead p{font-size:15.5px;color:var(--muted);margin-top:6px;max-width:60ch}
.sgArt .track{display:grid;grid-template-columns:34px 1fr auto;gap:16px;align-items:center;padding:14px 0;border-bottom:1.5px solid var(--rule)}
.sgArt .track .n{font-family:var(--mono);font-size:13px;color:var(--muted)}
.sgArt .track b{display:block;font-size:16.5px;font-weight:600;line-height:1.3}
.sgArt .track em{display:block;font-style:normal;font-size:13.5px;color:var(--muted);margin-top:2px}
.sgArt .track .go{display:flex;gap:6px}
.sgArt .track .go a{font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--pink);border:1.5px solid var(--rule);border-radius:6px;padding:5px 9px;transition:.15s;white-space:nowrap}
.sgArt .track .go a:hover{border-color:var(--pink);background:var(--pink);color:#fff}
.sgArt .embed{margin-top:26px;border:1.5px dashed var(--rule);border-radius:12px;padding:20px;font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--muted);line-height:1.7}
.sgArt .brief{background:var(--yellow)}
.sgArt .brief .eyebrow{color:rgba(26,23,25,.65)}
.sgArt .brief .lede{color:rgba(26,23,25,.72);max-width:56ch}
.sgArt .bgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
.sgArt .b{background:rgba(255,255,255,.55);border-radius:12px;padding:22px}
.sgArt .b strong{display:block;font-size:16.5px;margin-bottom:6px}
.sgArt .b span{display:block;font-size:14.5px;color:rgba(26,23,25,.7);line-height:1.5}
.sgArt details{border-bottom:1.5px solid var(--rule);padding:18px 0}
.sgArt details:first-of-type{border-top:1.5px solid var(--rule)}
.sgArt summary{cursor:pointer;font-weight:500;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.sgArt summary::-webkit-details-marker{display:none}
.sgArt summary::after{content:"+";font-family:var(--mono);color:var(--pink);font-size:20px;line-height:1}
.sgArt details[open] summary::after{content:"\\2212"}
.sgArt details p{margin-top:12px;color:var(--muted);font-size:15.5px;max-width:64ch}
.sgArt .cta{background:var(--ink);color:#fff;text-align:center}
.sgArt .cta h2{color:#fff;max-width:22ch;margin:0 auto}
.sgArt .cta a{display:inline-block;margin-top:26px;background:var(--yellow);color:var(--ink);text-decoration:none;font-weight:700;padding:15px 32px;border-radius:999px}
.sgArt .src{font-size:13px;color:var(--muted);padding:34px 0 64px;line-height:1.7}
@media (max-width:880px){
  .sgArt .hero{min-height:min(92vh,700px)}
  .sgArt .scrim{padding:250px 0 52px}
  .sgArt .arc,.sgArt .bgrid{grid-template-columns:1fr}
  .sgArt .arc{gap:24px}
  .sgArt .track{grid-template-columns:26px 1fr;gap:12px}
  .sgArt .track .go{grid-column:2;margin-top:8px}
}
@media (prefers-reduced-motion:reduce){.sgArt *{transition:none!important}}
`

export default function SangeetSongs() {
  const [idx, setIdx] = useState(0)
  const pl = PLAYLISTS[idx]

  return (
    <div className="sgArt">
      <style>{CSS}</style>

      <header className="hero">
        <img className="heroImg" src="/articles/sangeet-songs-hero.jpg" alt="Family dancing at a sangeet" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="scrim">
          <div className="wrap">
            <div className="eyebrow">Sangeet · Playlists</div>
            <h1>Songs that get everyone up</h1>
            <p>Eight playlists built around who is dancing and when. Including the one for your parents, which nobody plans and everybody remembers.</p>
            <div className="chips">
              <span className="chip">8 playlists</span>
              <span className="chip">80 tracks</span>
              <span className="chip">Linked to Spotify</span>
            </div>
          </div>
        </div>
      </header>

      <section className="order">
        <div className="wrap">
          <div className="eyebrow">Build the night in this order</div>
          <h2>A sangeet has an arc</h2>
          <p className="lede">The most common mistake is opening at full volume. You have nowhere left to go by nine.</p>
          <div className="arc">
            {ARC.map(([label, head, body]) => (
              <div className="beat" key={head}><b>{label}</b><strong>{head}</strong><span>{body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="eyebrow">The playlists</div>
          <h2>Pick your moment</h2>
          <p className="lede">Every track links to a Spotify and YouTube search, so nothing breaks when a catalogue changes.</p>
          <div className="tabs" role="tablist">
            {PLAYLISTS.map((p, i) => (
              <button key={p.name} className="tab" role="tab" aria-selected={i === idx} onClick={() => setIdx(i)}>
                {p.name}
              </button>
            ))}
          </div>

          <div>
            <div className="plHead">
              <h3>{pl.name}: {pl.sub}</h3>
              <p>{pl.note}</p>
            </div>
            {pl.tracks.map(([title, film], n) => {
              const q = title + ' ' + film.split(',')[0]
              return (
                <div className="track" key={title + n}>
                  <span className="n">{String(n + 1).padStart(2, '0')}</span>
                  <span><b>{title}</b><em>{film}</em></span>
                  <span className="go">
                    <a href={SP(q)} target="_blank" rel="noopener">Spotify</a>
                    <a href={YT(q)} target="_blank" rel="noopener">YouTube</a>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="embed">
            Spotify embed slot. Build the playlist in your account, then
            Share → Embed playlist, and paste the iframe here.
          </div>
        </div>
      </section>

      <section className="brief">
        <div className="wrap">
          <div className="eyebrow">Send this to your DJ</div>
          <h2>Six lines that fix most sangeets</h2>
          <p className="lede">DJs are good at reading a room. They are not good at guessing your family.</p>
          <div className="bgrid">
            {BRIEF.map(([head, body]) => (
              <div className="b" key={head}><strong>{head}</strong><span>{body}</span></div>
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
          <h2>Sound, lighting and a DJ who turns up on time</h2>
          <Link to="/">Browse Hyderabad vendors on Pellikart</Link>
        </div>
      </section>

      <div className="wrap">
        <p className="src">Track listings are suggestions, not an official playlist. Film and year are given where widely documented. Streaming links open a search rather than a fixed track, so nothing breaks when catalogues change. Availability varies by region and service.</p>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'

type Testimonial = {
  id: string
  src: string
  poster: string
  /** Shown over the bottom of the card. Leave blank to show nothing. */
  name: string
  /** Small line under the name — city, event, role. Leave blank to show nothing. */
  meta: string
}

// The uploaded clips, transcoded to 720p H.264 (the originals were HEVC .MOV,
// which Chrome and Firefox can't decode). Fill in name/meta as you get them.
const TESTIMONIALS: Testimonial[] = [
  { id: 'a', src: '/testimonials/img_8548.mp4', poster: '/testimonials/img_8548.jpg', name: '', meta: '' },
  { id: 'b', src: '/testimonials/img_8550.mp4', poster: '/testimonials/img_8550.jpg', name: '', meta: '' },
  { id: 'c', src: '/testimonials/img_8705.mp4', poster: '/testimonials/img_8705.jpg', name: '', meta: '' },
  { id: 'd', src: '/testimonials/img_8706.mp4', poster: '/testimonials/img_8706.jpg', name: '', meta: '' },
  { id: 'e', src: '/testimonials/wa_20260724.mp4', poster: '/testimonials/wa_20260724.jpg', name: '', meta: '' },
]

/** How long the pointer has to rest on a clip before it starts. Stops a sweep
 *  across the row from firing four bursts of audio. */
const HOVER_INTENT_MS = 160

export default function LandingTestimonials() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [soundId, setSoundId] = useState<string | null>(null)
  // Set when the browser refuses to play unmuted — see `play()`.
  const [soundBlocked, setSoundBlocked] = useState(false)
  const videos = useRef(new Map<string, HTMLVideoElement>())
  const hoverTimer = useRef<number | null>(null)
  // Touch devices have no hover, so there they get tap-to-play instead.
  const [canHover, setCanHover] = useState(true)

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  // Once the visitor clicks anywhere on the page, the browser stops blocking
  // audio, so the "click once for sound" hint can go away.
  useEffect(() => {
    if (!soundBlocked) return
    const clear = () => setSoundBlocked(false)
    document.addEventListener('pointerdown', clear, { once: true })
    document.addEventListener('keydown', clear, { once: true })
    return () => {
      document.removeEventListener('pointerdown', clear)
      document.removeEventListener('keydown', clear)
    }
  }, [soundBlocked])

  const play = useCallback((id: string, withSound: boolean) => {
    // Only ever one clip at a time.
    videos.current.forEach((v, other) => { if (other !== id) { v.pause(); v.muted = true } })
    const video = videos.current.get(id)
    if (!video) return

    video.muted = !withSound
    video.play().then(() => {
      setPlayingId(id)
      setSoundId(withSound ? id : null)
      if (withSound) setSoundBlocked(false)
    }).catch(() => {
      // Hover is not a "user gesture", so until the visitor has clicked
      // somewhere on the page the browser rejects unmuted playback. Play it
      // muted instead rather than showing a dead card.
      if (!withSound) return
      setSoundBlocked(true)
      video.muted = true
      video.play().then(() => {
        setPlayingId(id)
        setSoundId(null)
      }).catch(() => {})
    })
  }, [])

  const pause = useCallback((id: string) => {
    // Position is kept, so moving the mouse away and back resumes the clip.
    const video = videos.current.get(id)
    if (video) { video.pause(); video.muted = true }
    setPlayingId((cur) => (cur === id ? null : cur))
    setSoundId((cur) => (cur === id ? null : cur))
  }, [])

  function handleHoverStart(id: string) {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => play(id, true), HOVER_INTENT_MS)
  }

  function handleHoverEnd(id: string) {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = null
    pause(id)
  }

  useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current) }, [])

  // Stop anything that scrolls out of view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            const video = entry.target as HTMLVideoElement
            video.pause()
            setPlayingId((cur) => {
              const id = [...videos.current.entries()].find(([, v]) => v === video)?.[0]
              return cur === id ? null : cur
            })
          }
        }
      },
      { threshold: 0.35 },
    )
    videos.current.forEach((v) => observer.observe(v))
    return () => observer.disconnect()
  }, [])

  function handleClick(id: string) {
    if (!canHover) {
      // Touch: the tap is the gesture that lets us play with sound.
      if (playingId === id) pause(id)
      else play(id, true)
      return
    }
    // Pointer: hover already starts the clip with sound, so a click mutes it
    // again — and, on the first click, unblocks audio for every later hover.
    if (soundId === id) {
      const video = videos.current.get(id)
      if (video) video.muted = true
      setSoundId(null)
    } else {
      play(id, true)
    }
  }

  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
          TESTIMONIALS
        </p>
        <h2 className="font-serif text-center text-[34px] md:text-[42px] font-bold text-dark leading-tight mb-3">
          Don't take our word for it.
        </h2>
        <p className="text-center text-[16px] text-gray-500 mb-12">
          {!canHover
            ? 'Tap a clip to play it.'
            : soundBlocked
              ? 'Hover over a clip to play it — click once to let your browser turn the sound on.'
              : 'Hover over a clip to play it, with sound.'}
        </p>

        {/* Flex rather than a grid so an odd number of clips leaves a centred
            last row instead of a gap on the right. Widths are the grid maths
            done by hand: 100%/n minus the share of the gaps. */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {TESTIMONIALS.map((t) => {
            const isPlaying = playingId === t.id
            const hasSound = soundId === t.id
            return (
              <div
                key={t.id}
                onMouseEnter={canHover ? () => handleHoverStart(t.id) : undefined}
                onMouseLeave={canHover ? () => handleHoverEnd(t.id) : undefined}
                onClick={() => handleClick(t.id)}
                className="group relative w-[calc(50%-8px)] md:w-[calc(20%-16px)] aspect-[9/16] rounded-2xl overflow-hidden bg-dark border border-card-border cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
              >
                <video
                  ref={(el) => {
                    if (el) videos.current.set(t.id, el)
                    else videos.current.delete(t.id)
                  }}
                  src={t.src}
                  poster={t.poster}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  className="w-full h-full object-cover"
                />

                {/* Play badge — sits over the poster until the clip runs. */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                    isPlaying ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-dark/25" />
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E91E78" className="ml-0.5">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Sound toggle */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClick(t.id) }}
                  aria-label={hasSound ? 'Mute' : 'Unmute'}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-dark/55 backdrop-blur-sm text-white flex items-center justify-center hover:bg-dark/75 transition-colors"
                >
                  {hasSound ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
                    </svg>
                  )}
                </button>

                {/* Only shown when the browser turned the sound down on us. */}
                {isPlaying && !hasSound && soundBlocked && (
                  <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center pointer-events-none">
                    <span className="bg-dark/70 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                      Click for sound
                    </span>
                  </div>
                )}

                {(t.name || t.meta) && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-dark/85 to-transparent pointer-events-none">
                    {t.name && <p className="text-white font-bold text-[15px] leading-tight">{t.name}</p>}
                    {t.meta && <p className="text-white/70 text-[12px] mt-0.5">{t.meta}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

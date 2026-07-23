import { useEffect, useRef, useState } from 'react'

/**
 * Renders multi-line text preserving the line breaks/spacing the author typed
 * (whitespace-pre-line), collapsed to `clampLines` lines with a "See more" /
 * "See less" toggle. The toggle only appears when the text actually overflows
 * the clamp, so short descriptions render untouched.
 */
export default function ExpandableText({
  text,
  className = '',
  clampLines = 5,
}: {
  text: string
  className?: string
  clampLines?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  // Measure while collapsed: if the full text is taller than the clamped box,
  // it overflows and needs a toggle. Skipped while expanded so the flag (and
  // therefore the "See less" button) stays put once the user opens it.
  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded, clampLines])

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line ${className}`}
        style={
          expanded
            ? undefined
            : {
                display: '-webkit-box',
                WebkitLineClamp: clampLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
        }
      >
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-[10px] font-semibold text-mustard"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  )
}

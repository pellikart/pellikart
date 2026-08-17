import { useEffect, useRef } from 'react'

/**
 * The step between "shortlist this" on the public page and the app's own
 * signup + onboarding.
 *
 * It can't host the onboarding form itself: sign-in is Google OAuth, which is a
 * top-level redirect, so the browser leaves this page no matter what. What it
 * does is set expectations for the three screens that follow, and let the
 * visitor back out without losing the listing they were reading.
 */
export default function ShortlistSignupModal({ label, category, onContinue, onClose }: {
  /** The listing being shortlisted, by its public code. */
  label: string
  category: string
  onContinue: () => void
  onClose: () => void
}) {
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    continueRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortlist-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-mustard">
            Shortlisting {label}
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 w-8 h-8 shrink-0 rounded-full text-gray-400 hover:bg-empty-bg hover:text-dark transition-colors"
          >
            ✕
          </button>
        </div>

        <h2 id="shortlist-modal-title" className="mt-3 font-serif text-[24px] font-bold text-dark leading-tight">
          Let's build your wedding board.
        </h2>
        <p className="mt-2 text-[13.5px] text-gray-500 leading-relaxed">
          Tell us about your wedding — events, budget, guest count. Two minutes.
          This {category.toLowerCase()} goes straight onto your board, and we'll
          fill every other category with picks that fit what's left.
        </p>

        <ol className="mt-5 space-y-2.5">
          {[
            'Sign in with Google',
            'Answer a few questions about your wedding',
            `Your board opens with this ${category.toLowerCase()} on it`,
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 mt-px rounded-full bg-magenta-light text-magenta text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[13px] text-dark leading-snug">{step}</span>
            </li>
          ))}
        </ol>

        <button
          ref={continueRef}
          onClick={onContinue}
          className="mt-6 w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[14px] hover:opacity-90 transition-opacity"
        >
          Continue →
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 text-[13px] text-gray-500 hover:text-dark transition-colors"
        >
          Keep browsing
        </button>
      </div>
    </div>
  )
}

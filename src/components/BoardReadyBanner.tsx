import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useOptionalAuth } from '@/lib/auth-context'
import { fetchMyConsultRequests, type ConsultRequestRow } from '@/lib/supabase-db'
import {
  boardReadiness, readLocalConsult, CONSULT_STATUS_LABELS, type ConsultStatus,
} from '@/lib/consult'
import type { RitualBoard } from '@/lib/types'
import ConsultSheet from './ConsultSheet'

/**
 * The end of the couple's journey, made explicit.
 *
 * Without it the board just… stops. They shortlist, they compare, and then
 * there's nothing to press — the vendors aren't on the platform to be booked.
 * This is the press: while the board is thin it points at the next category
 * worth filling, once it's decided it offers the expert call, and after they
 * ask it shows where that request stands.
 */
export default function BoardReadyBanner({ board }: { board: RitualBoard }) {
  const { vendors } = useStore()
  const auth = useOptionalAuth()
  const navigate = useNavigate()

  const [showSheet, setShowSheet] = useState(false)
  // Local mirror first (instant, and the only record an anonymous demo has),
  // then the DB row for a signed-in couple — which also carries our status.
  // HomePage keys this component by board id, so switching events remounts it
  // and this initial read re-runs for the board actually on screen.
  const [requested, setRequested] = useState(() => {
    const local = readLocalConsult()
    return !!local && (!local.boardId || local.boardId === board.id)
  })
  const [row, setRow] = useState<ConsultRequestRow | null>(null)

  useEffect(() => {
    const userId = auth?.user?.id
    if (!userId) return
    let cancelled = false
    fetchMyConsultRequests(userId).then((rows) => {
      if (cancelled) return
      // The request for this board, else the couple's most recent one.
      const mine = rows.find((r) => r.board_id === board.id) ?? rows[0]
      if (!mine) return
      // A closed-out request shouldn't keep suppressing the ask — a couple who
      // planned another event months later deserves the offer again.
      if (mine.status === 'won' || mine.status === 'lost') return
      setRow(mine)
      setRequested(true)
    })
    return () => { cancelled = true }
  }, [auth?.user?.id, board.id])

  const { filled, total, ready, nextCategory } = boardReadiness(board, vendors)

  // Nothing on the board at all — HomePage's own empty state already carries
  // the "add an event" call to action, so stay out of the way.
  if (total === 0) return null

  // The banner's own body, by state. The consult sheet is mounted below this,
  // outside the branch — a successful submit flips the banner to "requested",
  // and the sheet has to survive that to show its confirmation.
  let body: ReactNode

  if (requested) {
    const status: ConsultStatus = row?.status ?? 'new'
    const when = row?.preferred_date
      ? `${new Date(row.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${row.preferred_slot ? `, ${row.preferred_slot}` : ''}`
      : null
    body = (
      <div className="mx-4 mt-3 md:mx-6 p-3 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2.5">
        <span className="text-green-600 text-[13px] leading-none mt-px">✓</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-dark">
            {status === 'scheduled' ? 'Your expert call is booked' : 'Expert call requested'}
          </p>
          <p className="text-[10.5px] text-gray-500 mt-0.5">
            {status === 'new' && 'We\'ll confirm your slot on WhatsApp shortly.'}
            {status === 'contacted' && 'We\'ve reached out — check your WhatsApp.'}
            {status === 'scheduled' && (when ? `${when}. We'll call you then.` : 'We\'ll call you at the agreed time.')}
          </p>
        </div>
        {status !== 'new' && (
          <span className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white text-green-700 border border-green-200">
            {CONSULT_STATUS_LABELS[status]}
          </span>
        )}
      </div>
    )
  } else if (!ready) {
    body = (
      <div className="mx-4 mt-3 md:mx-6 p-3 rounded-xl bg-empty-bg border border-card-border">
        <p className="text-[12px] font-semibold text-dark">
          {filled === 0 ? 'Start with one pick' : `${filled} of ${total} sorted`}
        </p>
        <p className="text-[10.5px] text-gray-500 mt-0.5">
          {nextCategory
            ? `Pick your ${nextCategory.label.toLowerCase()} next — once two categories are decided, a Pellikart expert can take it from there.`
            : 'Fill a couple of categories and an expert can take it from there.'}
        </p>
        <div className="flex items-center gap-3 mt-2.5">
          {nextCategory && (
            <button
              onClick={() => navigate(`/category/${board.id}/${nextCategory.id}`)}
              className="py-1.5 px-3 rounded-lg bg-magenta text-white text-[11px] font-semibold active:scale-[0.98] transition-transform"
            >
              Explore {nextCategory.label} →
            </button>
          )}
          <button
            onClick={() => setShowSheet(true)}
            className="text-[11px] font-medium text-magenta"
          >
            Or talk to an expert
          </button>
        </div>
      </div>
    )
  } else {
    body = (
      <div className="mx-4 mt-3 md:mx-6 p-3.5 rounded-xl bg-magenta-light border border-magenta/25">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-dark">
              {board.name} board is ready 🎉
            </p>
            <p className="text-[10.5px] text-dark/70 mt-0.5 leading-relaxed">
              {filled} of {total} categories decided. We'll call your shortlisted vendors,
              get you real quotes and hold your dates.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="w-full mt-2.5 py-2.5 rounded-lg bg-magenta text-white text-[12px] font-semibold active:scale-[0.98] transition-transform"
        >
          Book a free slot with a Pellikart expert
        </button>
      </div>
    )
  }

  return (
    <>
      {body}
      {showSheet && (
        <ConsultSheet
          board={board}
          source={ready ? 'board_ready' : 'help'}
          onClose={() => setShowSheet(false)}
          onSubmitted={() => setRequested(true)}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/vendor-store'
import { formatDate } from '@/lib/helpers'
import { acceptTrialDb, proposeNewTrialTimeDb } from '@/lib/supabase-db'

export default function VendorTrials() {
  const navigate = useNavigate()
  const { trialSessions, acceptTrial, proposeNewTrialTime, _liveMode } = useStore()
  const { vendorTrials, scheduleTrial: vendorAcceptTrial } = useVendorStore()

  const [proposeId, setProposeId] = useState<{ ritualId: string; categoryId: string; vendorId: string } | null>(null)
  const [proposeDate, setProposeDate] = useState('')
  const [proposeTime, setProposeTime] = useState('')

  // Get trials from main store (user-submitted)
  const userTrials = Object.entries(trialSessions).map(([key, trial]) => {
    const parts = key.split('-')
    // key format: ritualId-categoryId-vendorId (but these contain hyphens)
    // We stored: `${ritualId}-${categoryId}-${vendorId}`
    return { key, trial, ritualId: parts.slice(0, 2).join('-'), categoryId: parts.slice(2, -2).join('-') || parts[2], vendorId: trial.vendorId }
  })

  const pending = userTrials.filter(({ trial }) => trial.status === 'requested')
  const accepted = userTrials.filter(({ trial }) => trial.status === 'accepted' || trial.status === 'confirmed')
  const rescheduled = userTrials.filter(({ trial }) => trial.status === 'rescheduled')
  const done = userTrials.filter(({ trial }) => trial.status === 'done')

  // Also show mock vendor trials for demo richness
  const mockPending = vendorTrials.filter((t) => t.status === 'pending')
  const mockScheduled = vendorTrials.filter((t) => t.status === 'scheduled')
  const mockCompleted = vendorTrials.filter((t) => t.status === 'completed')

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Trial Requests</p>
      </div>

      <div className="px-4 mt-3">

        {/* User-submitted pending trials */}
        {pending.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-magenta uppercase tracking-wider mb-2">New Requests ({pending.length})</p>
            {pending.map(({ key, trial }) => (
              <div key={key} className="p-3 rounded-xl border-2 border-magenta/20 bg-magenta-light/10 mb-2">
                <p className="text-[12px] font-semibold text-dark">{trial.ritualName}</p>
                <p className="text-[10px] text-gray-500">{trial.categoryLabel}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Proposed: {trial.requestedDate} at {trial.requestedTime}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      // Parse key to get ritualId, categoryId
                      // Accept with the user's proposed time
                      const keyParts = key.split(`-${trial.vendorId}`)
                      const prefix = keyParts[0]
                      const catParts = prefix.split('-')
                      const ritId = catParts.slice(0, 2).join('-')
                      const catId = catParts.slice(2).join('-')
                      acceptTrial(ritId, catId, trial.vendorId)
                    }}
                    className="flex-1 py-2 rounded-lg bg-green-500 text-white text-[10px] font-semibold active:scale-[0.97] transition-transform"
                  >
                    Accept time
                  </button>
                  <button
                    onClick={() => {
                      const keyParts = key.split(`-${trial.vendorId}`)
                      const prefix = keyParts[0]
                      const catParts = prefix.split('-')
                      setProposeId({ ritualId: catParts.slice(0, 2).join('-'), categoryId: catParts.slice(2).join('-'), vendorId: trial.vendorId })
                      setProposeDate('')
                      setProposeTime('')
                    }}
                    className="flex-1 py-2 rounded-lg border border-mustard text-mustard text-[10px] font-semibold"
                  >
                    Propose new time
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rescheduled — waiting for user to confirm */}
        {rescheduled.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Awaiting User Confirmation ({rescheduled.length})</p>
            {rescheduled.map(({ key, trial }) => (
              <div key={key} className="p-3 rounded-xl border border-mustard/30 bg-mustard-light/10 mb-2">
                <p className="text-[12px] font-semibold text-dark">{trial.ritualName} · {trial.categoryLabel}</p>
                <p className="text-[10px] text-mustard mt-0.5">Your proposed: {trial.vendorProposedDate} at {trial.vendorProposedTime}</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Waiting for couple to confirm</p>
              </div>
            ))}
          </div>
        )}

        {/* Accepted / Confirmed */}
        {accepted.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-2">Confirmed ({accepted.length})</p>
            {accepted.map(({ key, trial }) => (
              <div key={key} className="p-3 rounded-xl border border-green-200 mb-2">
                <p className="text-[12px] font-semibold text-dark">{trial.ritualName} · {trial.categoryLabel}</p>
                <p className="text-[10px] text-green-600 mt-0.5">Scheduled: {trial.scheduledDate} at {trial.scheduledTime}</p>
              </div>
            ))}
          </div>
        )}

        {/* Done */}
        {done.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Completed ({done.length})</p>
            {done.map(({ key, trial }) => (
              <div key={key} className="p-3 rounded-xl border border-card-border mb-2 opacity-70">
                <p className="text-[12px] font-semibold text-dark">{trial.ritualName} · {trial.categoryLabel}</p>
                <span className="inline-block mt-1 bg-green-100 text-green-600 text-[9px] font-medium px-2 py-0.5 rounded-full">Done ✓</span>
              </div>
            ))}
          </div>
        )}

        {/* Vendor trials from DB (live) or mock (demo) */}
        {mockPending.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-magenta uppercase tracking-wider mb-2">{_liveMode ? 'Trial Requests' : 'Other Requests'} ({mockPending.length})</p>
            {mockPending.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border-2 border-magenta/20 bg-magenta-light/10 mb-2">
                <p className="text-[12px] font-semibold text-dark">{t.coupleNames}</p>
                <p className="text-[10px] text-gray-500">{t.eventName} · {t.category}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Requested: {formatDate(t.requestedDate)}</p>
                {_liveMode && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        vendorAcceptTrial(t.id, t.requestedDate)
                        acceptTrialDb(t.id)
                      }}
                      className="flex-1 py-2 rounded-lg bg-green-500 text-white text-[10px] font-semibold active:scale-[0.97] transition-transform"
                    >Accept</button>
                    <button
                      onClick={() => setProposeId({ ritualId: t.id, categoryId: '', vendorId: '' })}
                      className="flex-1 py-2 rounded-lg border border-mustard text-mustard text-[10px] font-semibold"
                    >Propose new time</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {mockScheduled.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-2">Scheduled ({mockScheduled.length})</p>
            {mockScheduled.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-green-200 mb-2">
                <p className="text-[12px] font-semibold text-dark">{t.coupleNames}</p>
                <p className="text-[10px] text-gray-500">{t.eventName} · {t.category}</p>
                <p className="text-[10px] text-green-600 mt-0.5">Scheduled: {formatDate(t.scheduledDate || t.requestedDate)}</p>
              </div>
            ))}
          </div>
        )}

        {mockCompleted.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Completed ({mockCompleted.length})</p>
            {mockCompleted.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-card-border mb-2 opacity-70">
                <p className="text-[12px] font-semibold text-dark">{t.coupleNames} · {t.eventName}</p>
                <span className="inline-block mt-1 bg-green-100 text-green-600 text-[9px] font-medium px-2 py-0.5 rounded-full">Done</span>
              </div>
            ))}
          </div>
        )}

        {userTrials.length === 0 && vendorTrials.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-12">No trial requests yet</p>
        )}
      </div>

      {/* Propose new time modal */}
      {proposeId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setProposeId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Propose a new time</p>
            <p className="text-[11px] text-gray-400 mb-4">The couple will be notified and can accept your proposed slot.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Date</label>
                <input
                  type="date" value={proposeDate} onChange={(e) => setProposeDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Time</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((t) => (
                    <button
                      key={t} onClick={() => setProposeTime(t)}
                      className={`py-2 rounded-lg text-[10px] font-medium transition-all ${proposeTime === t ? 'bg-mustard text-white' : 'border border-card-border text-gray-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (proposeDate && proposeTime && proposeId) {
                  if (_liveMode && !proposeId.categoryId) {
                    // Live mode: proposeId.ritualId is actually the DB trial UUID
                    proposeNewTrialTimeDb(proposeId.ritualId, proposeDate, proposeTime)
                  } else {
                    proposeNewTrialTime(proposeId.ritualId, proposeId.categoryId, proposeId.vendorId, proposeDate, proposeTime)
                  }
                  setProposeId(null)
                }
              }}
              disabled={!proposeDate || !proposeTime}
              className={`mt-5 w-full py-2.5 rounded-xl font-semibold text-[13px] ${proposeDate && proposeTime ? 'bg-mustard text-white' : 'bg-gray-200 text-gray-400'}`}
            >
              Send proposal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

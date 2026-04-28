import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatDate, bgStyle } from '@/lib/helpers'

export default function TrialsBanner() {
  const { subscription, trialSessions, vendors } = useStore()
  const [showSheet, setShowSheet] = useState(false)

  if (subscription === 'free') return null

  const allTrials = Object.entries(trialSessions)
  if (allTrials.length === 0) return null

  const pendingCount = allTrials.filter(([, t]) => t.status === 'requested').length
  const doneCount = allTrials.filter(([, t]) => t.status === 'done').length

  return (
    <>
      <button
        onClick={() => setShowSheet(true)}
        className="mx-4 mt-3 p-3 rounded-xl bg-mustard-light border border-mustard/20 flex items-center justify-between active:opacity-90 transition-opacity text-left w-[calc(100%-2rem)]"
      >
        <div>
          <p className="text-[11px] font-semibold text-dark">Your Trials</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {pendingCount > 0 && <span>{pendingCount} upcoming</span>}
            {pendingCount > 0 && doneCount > 0 && <span> · </span>}
            {doneCount > 0 && <span>{doneCount} completed</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-mustard text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {allTrials.length}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Trials Sheet */}
      {showSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowSheet(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">All Trials</p>
            <p className="text-[10px] text-gray-500 mb-4">{pendingCount} upcoming · {doneCount} completed</p>

            {/* Upcoming */}
            {pendingCount > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Upcoming</p>
                {allTrials
                  .filter(([, t]) => t.status === 'requested')
                  .sort(([, a], [, b]) => a.scheduledDate.localeCompare(b.scheduledDate))
                  .map(([key, trial]) => {
                    const vendor = vendors[trial.vendorId]
                    return (
                      <div key={key} className="flex items-center gap-3 py-2.5 border-b border-card-border/30">
                        <div className="w-10 h-10 rounded-lg shrink-0" style={bgStyle(vendor?.photo || '')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-magenta-light text-magenta text-[8px] font-medium px-1.5 py-0.5 rounded-full">{trial.categoryLabel}</span>
                            <span className="text-[10px] text-gray-400">{trial.ritualName}</span>
                          </div>
                          <p className="text-[11px] font-medium text-dark mt-0.5">{vendor?.name || vendor?.code}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold text-mustard">{formatDate(trial.scheduledDate)}</p>
                          <p className="text-[8px] text-gray-400">Scheduled</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Completed */}
            {doneCount > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-2">Completed</p>
                {allTrials
                  .filter(([, t]) => t.status === 'done')
                  .map(([key, trial]) => {
                    const vendor = vendors[trial.vendorId]
                    return (
                      <div key={key} className="flex items-center gap-3 py-2.5 border-b border-card-border/30 opacity-70">
                        <div className="w-10 h-10 rounded-lg shrink-0" style={bgStyle(vendor?.photo || '')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-magenta-light text-magenta text-[8px] font-medium px-1.5 py-0.5 rounded-full">{trial.categoryLabel}</span>
                            <span className="text-[10px] text-gray-400">{trial.ritualName}</span>
                          </div>
                          <p className="text-[11px] font-medium text-dark mt-0.5">{vendor?.name || vendor?.code}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="bg-green-100 text-green-600 text-[9px] font-medium px-2 py-0.5 rounded-full">Done ✓</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

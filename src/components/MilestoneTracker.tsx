import { useState } from 'react'
import { useStore } from '@/lib/store'
import { getMilestones } from '@/lib/milestones'

interface Props {
  categoryLabel: string
  vendorId: string
}

export default function MilestoneTracker({ categoryLabel, vendorId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { milestoneProgress, completeMilestone } = useStore()

  const milestones = getMilestones(categoryLabel)
  const totalCount = milestones.length
  const completedCount = milestoneProgress[vendorId] || 0
  const progress = Math.round((completedCount / totalCount) * 100)
  const allDone = completedCount >= totalCount

  const nextMilestone = milestones[completedCount] || null

  return (
    <div className="mt-2">
      {/* Collapsed: progress bar + next step */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-magenta transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] text-gray-400 shrink-0">{completedCount}/{totalCount}</span>
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {nextMilestone && !expanded && (
          <p className="text-[9px] text-gray-400">
            Next: <span className="text-dark font-medium">{nextMilestone.label}</span>
            <span className="text-gray-300 mx-1">·</span>
            {nextMilestone.description}
          </p>
        )}
        {allDone && !expanded && (
          <p className="text-[9px] text-green-500 font-medium">All milestones complete!</p>
        )}
      </button>

      {/* Expanded: full timeline */}
      {expanded && (
        <div className="mt-2 ml-1">
          {milestones.map((m, i) => {
            const isDone = i < completedCount
            const isCurrent = i === completedCount && !allDone
            const isLast = i === milestones.length - 1

            return (
              <div key={i} className="flex gap-2.5">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isDone
                      ? 'bg-magenta border-magenta'
                      : isCurrent
                        ? 'bg-white border-magenta'
                        : 'bg-white border-gray-200'
                  }`}>
                    {isDone && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-magenta animate-pulse" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[24px] ${isDone ? 'bg-magenta' : 'bg-gray-200'}`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-3 flex-1 ${isLast ? 'pb-0' : ''}`}>
                  <p className={`text-[11px] font-medium leading-tight ${
                    isDone ? 'text-magenta' : isCurrent ? 'text-dark' : 'text-gray-400'
                  }`}>
                    {m.label}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${
                    isDone ? 'text-magenta/60' : isCurrent ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    {m.description}
                  </p>

                  {/* Mark Complete button for current milestone */}
                  {isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        completeMilestone(vendorId, totalCount)
                      }}
                      className="mt-1.5 px-3 py-1 rounded-md bg-magenta text-white text-[9px] font-semibold active:scale-[0.96] transition-transform"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

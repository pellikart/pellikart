import { useState } from 'react'
import { useStore } from '@/lib/store'
import GrandTotalBar from '@/components/GrandTotalBar'
import UnlockBanner from '@/components/UnlockBanner'
import TrialsBanner from '@/components/TrialsBanner'
import RitualBoard from '@/components/RitualBoard'

export default function HomePage() {
  const { ritualBoards, addRitualBoard } = useStore()
  const [showAddBoard, setShowAddBoard] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDateStart, setNewDateStart] = useState('')
  const [newDateEnd, setNewDateEnd] = useState('')

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    addRitualBoard(name, newDateStart || undefined, newDateEnd || undefined)
    setNewName('')
    setNewDateStart('')
    setNewDateEnd('')
    setShowAddBoard(false)
  }

  return (
    <div className="pb-8 page-enter">
      <GrandTotalBar />
      <UnlockBanner />
      <TrialsBanner />
      <div className="mt-3">
        {ritualBoards.map((board) => (
          <RitualBoard key={board.id} board={board} />
        ))}

        {/* Add new ritual board card */}
        <button
          onClick={() => setShowAddBoard(true)}
          className="mx-4 mb-4 border-2 border-dashed border-magenta/30 rounded-2xl bg-magenta-light/10 p-6 flex flex-col items-center justify-center gap-2 w-[calc(100%-2rem)] active:bg-magenta-light/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-magenta-light flex items-center justify-center">
            <span className="text-magenta text-xl leading-none">+</span>
          </div>
          <p className="text-[12px] font-medium text-dark">Add new event</p>
          <p className="text-[10px] text-gray-400">Create a board for another event</p>
        </button>
      </div>

      {/* Add board bottom sheet */}
      {showAddBoard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddBoard(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-4">New event board</p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Event name</label>
                <input
                  type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Nalugu, Cocktail Party, Pre-Wedding..."
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Start date (optional)</label>
                  <input
                    type="date" value={newDateStart}
                    onChange={(e) => { setNewDateStart(e.target.value); if (!newDateEnd) setNewDateEnd(e.target.value) }}
                    className="w-full text-[11px] text-dark border border-card-border rounded-lg px-2.5 py-2 outline-none focus:border-magenta"
                  />
                </div>
                <span className="self-end pb-2.5 text-gray-300">→</span>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">End date</label>
                  <input
                    type="date" value={newDateEnd} min={newDateStart}
                    onChange={(e) => setNewDateEnd(e.target.value)}
                    className="w-full text-[11px] text-dark border border-card-border rounded-lg px-2.5 py-2 outline-none focus:border-magenta"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className={`w-full mt-5 py-2.5 rounded-xl font-semibold text-[13px] active:scale-[0.98] transition-transform ${
                newName.trim() ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create board
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

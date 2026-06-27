import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '@/lib/store'
import GrandTotalBar from '@/components/GrandTotalBar'
import UnlockBanner from '@/components/UnlockBanner'
import TrialsBanner from '@/components/TrialsBanner'
import RitualBoard from '@/components/RitualBoard'
import SignOutButton from '@/components/SignOutButton'

export default function HomePage() {
  const { ritualBoards, vendors, addRitualBoard, activeBoardId, setActiveBoardId } = useStore()
  const [showAddBoard, setShowAddBoard] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDateStart, setNewDateStart] = useState('')
  const [newDateEnd, setNewDateEnd] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // The desktop sidebar's "New event" button deep-links here with ?add=1.
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setShowAddBoard(true)
      searchParams.delete('add')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Keep active tab valid as boards change (e.g. after creating a new one or deleting)
  useEffect(() => {
    if (ritualBoards.length === 0) {
      if (activeBoardId !== null) setActiveBoardId(null)
      return
    }
    if (!activeBoardId || !ritualBoards.some((b) => b.id === activeBoardId)) {
      setActiveBoardId(ritualBoards[0].id)
    }
  }, [ritualBoards, activeBoardId])

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    addRitualBoard(name, newDateStart || undefined, newDateEnd || undefined)
    const latest = useStore.getState().ritualBoards
    const newest = latest[latest.length - 1]
    if (newest) setActiveBoardId(newest.id)
    setNewName('')
    setNewDateStart('')
    setNewDateEnd('')
    setShowAddBoard(false)
  }

  const activeBoard = ritualBoards.find((b) => b.id === activeBoardId) ?? ritualBoards[0]

  return (
    <div className="pb-8 page-enter">
      <GrandTotalBar />
      <UnlockBanner />
      <TrialsBanner />

      {/* Ritual board tabs — mobile only; the desktop sidebar replaces these */}
      {ritualBoards.length > 0 && (
        <div className="mt-3 px-4 overflow-x-auto no-scrollbar md:hidden">
          <div className="flex items-center gap-2 w-max">
            {ritualBoards.map((b) => {
              const active = b.id === activeBoard?.id
              const activeCats = b.categories.filter((c) => !c.removed)
              const filled = activeCats.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId]).length
              const total = activeCats.length
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBoardId(b.id)}
                  className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-magenta text-white'
                      : 'bg-empty-bg text-gray-600 active:bg-magenta-light'
                  }`}
                >
                  <span>{b.name}</span>
                  <span className={`text-[9px] ${active ? 'text-white/80' : 'text-gray-400'}`}>
                    {filled}/{total}
                  </span>
                </button>
              )
            })}
            <button
              onClick={() => setShowAddBoard(true)}
              aria-label="Add new event"
              className="shrink-0 w-8 h-8 rounded-full border border-dashed border-magenta/40 text-magenta text-base leading-none flex items-center justify-center active:bg-magenta-light/30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="mt-3">
        {activeBoard ? (
          <RitualBoard key={activeBoard.id} board={activeBoard} />
        ) : (
          <button
            onClick={() => setShowAddBoard(true)}
            className="mx-4 mb-4 border-2 border-dashed border-magenta/30 rounded-2xl bg-magenta-light/10 p-6 flex flex-col items-center justify-center gap-2 w-[calc(100%-2rem)] active:bg-magenta-light/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-magenta-light flex items-center justify-center">
              <span className="text-magenta text-xl leading-none">+</span>
            </div>
            <p className="text-[12px] font-medium text-dark">Add new event</p>
            <p className="text-[10px] text-gray-400">Create a board for your first event</p>
          </button>
        )}
      </div>

      {/* Account */}
      <div className="px-4 mt-8 mb-2 max-w-[480px] mx-auto">
        <SignOutButton />
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
                  placeholder="e.g. Haldi, Cocktail Party, Pre-Wedding..."
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

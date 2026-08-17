import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { fetchConsultRequests, updateConsultRequest, type ConsultRequestRow } from '@/lib/supabase-db'
import { CONSULT_STATUS_LABELS, type ConsultSnapshot, type ConsultStatus } from '@/lib/consult'
import { formatINR } from '@/lib/helpers'

const STATUSES: ConsultStatus[] = ['new', 'contacted', 'scheduled', 'won', 'lost']

const STATUS_STYLES: Record<ConsultStatus, string> = {
  new: 'bg-magenta-light text-magenta',
  contacted: 'bg-mustard-light text-mustard-dark',
  scheduled: 'bg-blue-50 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}

const SOURCE_LABELS: Record<string, string> = {
  board_ready: 'Board ready',
  help: 'Asked for help',
  landing: 'Landing page',
}

/**
 * The other end of the couple-side handoff: every "my board is ready, call me"
 * request, with the board they were looking at when they asked.
 *
 * This is the lead desk. Vendors aren't onboarded, so nothing closes inside the
 * app — it closes on a call, and this is where that call gets worked and tracked.
 */
export default function AdminConsults() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [rows, setRows] = useState<ConsultRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ConsultStatus | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  async function load() {
    const fetched = await fetchConsultRequests()
    setRows(fetched)
    setLoading(false)
  }

  useEffect(() => {
    // The queue is fetched, not derived — nothing to set synchronously here.
    void load()
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length }
    for (const s of STATUSES) c[s] = rows.filter((r) => r.status === s).length
    return c
  }, [rows])

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  async function setStatus(row: ConsultRequestRow, status: ConsultStatus) {
    const prev = rows
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)))
    const ok = await updateConsultRequest(row.id, { status })
    if (!ok) {
      setRows(prev)
      window.alert("Couldn't update that request. Please try again.")
    }
  }

  async function saveNotes(row: ConsultRequestRow, adminNotes: string) {
    if ((row.admin_notes || '') === adminNotes) return
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, admin_notes: adminNotes } : r)))
    const ok = await updateConsultRequest(row.id, { adminNotes })
    if (!ok) window.alert("Couldn't save that note. Please try again.")
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-card-border px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-dark leading-none">Admin · Expert requests</h1>
            <p className="text-[11px] text-gray-400 mt-1">Couples whose board is ready and want a call</p>
          </div>
        </div>
        <button onClick={signOut} className="text-[12px] text-gray-400 hover:text-gray-600">Sign out</button>
      </header>

      {/* Section nav */}
      <div className="bg-white border-b border-card-border px-5">
        <div className="max-w-2xl mx-auto flex gap-5">
          <button
            onClick={() => navigate('/admin')}
            className="py-2.5 text-[13px] font-medium text-gray-500 hover:text-dark border-b-2 border-transparent"
          >
            Vendors
          </button>
          <button className="py-2.5 text-[13px] font-semibold text-dark border-b-2 border-magenta">
            Expert requests
            {counts.new > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-magenta text-white px-1.5 py-0.5 rounded-full">{counts.new}</span>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {(['all', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filter === s ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600'
              }`}
            >
              {s === 'all' ? 'All' : CONSULT_STATUS_LABELS[s]}
              <span className={filter === s ? 'text-white/70 ml-1' : 'text-gray-400 ml-1'}>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[13px] text-gray-400">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-card-border p-8 text-center">
            <p className="text-[14px] text-gray-500">
              {rows.length === 0 ? 'No expert requests yet.' : 'Nothing in this status.'}
            </p>
            <p className="text-[12px] text-gray-400 mt-1">
              They land here the moment a couple books a slot from their board.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {visible.map((r) => (
              <ConsultCard
                key={r.id}
                row={r}
                open={openId === r.id}
                onToggle={() => setOpenId(openId === r.id ? null : r.id)}
                onStatus={(s) => setStatus(r, s)}
                onSaveNotes={(n) => saveNotes(r, n)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function ConsultCard({ row, open, onToggle, onStatus, onSaveNotes }: {
  row: ConsultRequestRow
  open: boolean
  onToggle: () => void
  onStatus: (s: ConsultStatus) => void
  onSaveNotes: (notes: string) => void
}) {
  const [notes, setNotes] = useState(row.admin_notes || '')
  const snap = (row.snapshot || {}) as Partial<ConsultSnapshot>
  const digits = row.phone.replace(/\D/g, '')
  // Indian numbers are stored however the couple typed them; a 10-digit local
  // number needs the country code before WhatsApp will open it.
  const waNumber = digits.length === 10 ? `91${digits}` : digits

  const asked = new Date(row.created_at)
  const when = row.preferred_date
    ? `${new Date(row.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${row.preferred_slot ? ` · ${row.preferred_slot}` : ''}`
    : 'No preference'

  return (
    <li className="bg-white rounded-2xl border border-card-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-dark truncate">
            {row.contact_name || 'Unnamed couple'}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {row.board_name ? `${row.board_name} · ` : ''}
            {snap.picked?.length ? `${snap.picked.length} picked` : 'no picks yet'}
            {typeof snap.total === 'number' && snap.total > 0 ? ` · ${formatINR(snap.total)}` : ''}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[row.status]}`}>
          {CONSULT_STATUS_LABELS[row.status]}
        </span>
      </div>

      {/* Slot + when they asked */}
      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 flex-wrap">
        <span className="px-2 py-1 rounded-lg bg-empty-bg">📞 {when}</span>
        <span>asked {asked.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {asked.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
        <span className="text-gray-300">·</span>
        <span>{SOURCE_LABELS[row.source] || row.source}</span>
        {!row.user_id && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">signed out</span>}
      </div>

      {/* Reach them */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <a href={`tel:${row.phone}`} className="text-[12px] font-semibold text-magenta px-2.5 py-1.5 rounded-lg border border-magenta/30">
          Call {row.phone}
        </a>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank" rel="noopener noreferrer"
          className="text-[12px] font-semibold text-green-700 px-2.5 py-1.5 rounded-lg border border-green-200"
        >
          WhatsApp
        </a>
        {row.email && (
          <a href={`mailto:${row.email}`} className="text-[12px] text-gray-500 truncate">{row.email}</a>
        )}
        <button onClick={onToggle} className="ml-auto text-[12px] font-semibold text-magenta">
          {open ? 'Hide board' : 'View board'}
        </button>
      </div>

      {row.notes && (
        <p className="mt-3 text-[12px] text-dark bg-empty-bg rounded-xl p-2.5">
          <span className="text-gray-400">Their note: </span>{row.notes}
        </p>
      )}

      {open && (
        <div className="mt-3 rounded-xl border border-card-border p-3">
          <p className="text-[11px] font-semibold text-dark">
            {snap.boardName || 'Board'}
            {snap.dateStart ? <span className="text-gray-400 font-normal"> · {snap.dateStart}{snap.dateEnd && snap.dateEnd !== snap.dateStart ? ` → ${snap.dateEnd}` : ''}</span> : null}
            {snap.guests ? <span className="text-gray-400 font-normal"> · {snap.guests} guests</span> : null}
          </p>

          {snap.picked && snap.picked.length > 0 ? (
            <div className="mt-2 space-y-1">
              {snap.picked.map((p, i) => (
                <div key={`${p.category}-${i}`} className="flex items-center gap-2 text-[11.5px]">
                  <span className="text-gray-400 w-24 shrink-0 truncate">{p.category}</span>
                  <span className="text-dark flex-1 truncate">{p.vendor}</span>
                  <span className="text-gray-500">{formatINR(p.price)}</span>
                </div>
              ))}
              {typeof snap.total === 'number' && (
                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-card-border text-[11.5px] font-semibold">
                  <span className="text-dark">Total on board</span>
                  <span className="text-magenta">{formatINR(snap.total)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">No vendors picked on this board.</p>
          )}

          {snap.deciding && snap.deciding.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-2.5">
              <span className="text-gray-400">Still deciding: </span>
              {snap.deciding.map((d) => `${d.category} (${d.shortlisted} shortlisted)`).join(', ')}
            </p>
          )}
          {snap.missing && snap.missing.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              <span className="text-gray-400">Nothing yet: </span>{snap.missing.join(', ')}
            </p>
          )}
          {snap.otherBoards && snap.otherBoards.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              <span className="text-gray-400">Other events: </span>
              {snap.otherBoards.map((b) => `${b.name} ${b.filled}/${b.total}`).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Work it */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
        <select
          value={row.status}
          onChange={(e) => onStatus(e.target.value as ConsultStatus)}
          className="sm:w-40 px-3 py-2 rounded-xl border border-card-border text-[12px] bg-white outline-none focus:border-magenta"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{CONSULT_STATUS_LABELS[s]}</option>)}
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onSaveNotes(notes.trim())}
          placeholder="Call notes — what they need, what we quoted…"
          className="flex-1 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-magenta"
        />
      </div>
    </li>
  )
}

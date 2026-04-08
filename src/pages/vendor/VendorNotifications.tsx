import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

export default function VendorNotifications() {
  const navigate = useNavigate()
  const { vendorNotifications, markNotificationRead, markAllNotificationsRead } = useVendorStore()
  const unread = vendorNotifications.filter((n) => !n.read).length

  const typeIcon: Record<string, string> = {
    booking: '📋', trial: '🧪', bid: '🎨', milestone: '✅',
    payment: '💰', review: '⭐', cancelled: '❌',
  }

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-sm">←</button>
          <p className="text-[14px] font-bold text-dark">Notifications</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllNotificationsRead} className="text-[10px] text-mustard font-medium">Mark all read</button>
        )}
      </div>

      <div className="px-4 mt-1">
        {vendorNotifications.map((n) => {
          const time = new Date(n.timestamp)
          const timeStr = time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' · ' + time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          return (
            <button
              key={n.id}
              onClick={() => { markNotificationRead(n.id); if (n.link) navigate(n.link) }}
              className={`w-full text-left py-3 border-b border-card-border/50 flex gap-3 ${!n.read ? 'bg-mustard-light/20' : ''}`}
            >
              <span className="text-base mt-0.5">{typeIcon[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] ${!n.read ? 'font-semibold text-dark' : 'font-medium text-gray-600'}`}>{n.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-[9px] text-gray-400 mt-1">{timeStr}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-mustard shrink-0 mt-1.5" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

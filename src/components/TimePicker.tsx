/** Hour / minute / AM-PM picker that reads & writes a 'HH:MM' (24h) string.
 *  Shared by the add-listing and edit-listing venue package slot editors. */
export default function TimePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const hasVal = /^\d{1,2}:\d{2}$/.test(value)
  let hour12 = '', minute = '00', period: 'AM' | 'PM' = 'AM'
  if (hasVal) {
    const [h, m] = value.split(':').map(Number)
    period = h < 12 ? 'AM' : 'PM'
    hour12 = String(h % 12 === 0 ? 12 : h % 12)
    minute = String(m).padStart(2, '0')
  }
  const compose = (hr: string, min: string, per: 'AM' | 'PM') => {
    if (!hr) return ''
    let h = parseInt(hr) % 12
    if (per === 'PM') h += 12
    return `${String(h).padStart(2, '0')}:${min}`
  }
  const selCls = 'rounded-lg border border-card-border text-[11px] py-2 px-1.5 outline-none focus:border-mustard bg-white text-dark cursor-pointer disabled:opacity-50'
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <select
        value={hour12}
        onChange={(e) => onChange(compose(e.target.value, minute, period))}
        className={`${selCls} flex-1 ${hour12 ? '' : 'text-gray-400'}`}
      >
        <option value="" disabled>Hr</option>
        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-gray-400 text-[12px]">:</span>
      <select
        value={minute}
        disabled={!hour12}
        onChange={(e) => onChange(compose(hour12, e.target.value, period))}
        className={`${selCls} flex-1`}
      >
        {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select
        value={period}
        disabled={!hour12}
        onChange={(e) => onChange(compose(hour12, minute, e.target.value as 'AM' | 'PM'))}
        className={`${selCls} w-[56px]`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

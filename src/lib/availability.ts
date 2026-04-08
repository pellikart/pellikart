// Mock vendor availability: deterministic based on vendor ID + date
// In production this would be an API call

export function isVendorAvailable(vendorId: string, dateStart: string, dateEnd?: string): boolean {
  // Simple hash: sum of char codes mod 7 gives "blocked day of week"
  let hash = 0
  for (let i = 0; i < vendorId.length; i++) {
    hash += vendorId.charCodeAt(i)
  }

  // Each vendor is unavailable on ~20% of dates (roughly)
  // Check if any date in the range falls on a "blocked" pattern
  const start = new Date(dateStart + 'T00:00:00')
  const end = dateEnd ? new Date(dateEnd + 'T00:00:00') : start
  const blockedDayOffset = hash % 5 // 0-4
  const blockedMonthDay1 = (hash % 28) + 1
  const blockedMonthDay2 = ((hash * 3) % 28) + 1

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfMonth = d.getDate()
    if (dayOfMonth === blockedMonthDay1 || dayOfMonth === blockedMonthDay2) {
      return false
    }
  }

  return true
}

export function getUnavailableVendors(
  vendorIds: string[],
  dateStart: string,
  dateEnd?: string
): string[] {
  return vendorIds.filter((id) => !isVendorAvailable(id, dateStart, dateEnd))
}

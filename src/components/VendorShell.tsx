import type { ReactNode } from 'react'
import VendorSidebar from './VendorSidebar'

/**
 * Layout wrapper for the vendor app. On mobile it reproduces the original
 * centered phone-width column (max-w-[480px] mx-auto) with the bottom nav.
 * On desktop (md+) it lifts the width cap and adds a persistent left sidebar;
 * the bottom nav hides itself at md+ (see VendorBottomNav).
 */
export default function VendorShell({ children }: { children: ReactNode }) {
  return (
    <div className="md:flex md:items-start min-h-dvh">
      <VendorSidebar />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-[480px] mx-auto md:max-w-[1100px] md:mx-0 md:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}

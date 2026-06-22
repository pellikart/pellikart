import type { ReactNode } from 'react'
import { useStore } from '@/lib/store'
import CoupleSidebar from './CoupleSidebar'

/**
 * Layout wrapper for the couple app. On mobile it reproduces the original
 * centered phone-width column exactly (max-w-[480px] mx-auto). On desktop
 * (md+) it lifts the width cap and adds a persistent left sidebar, turning
 * the app into a sidebar + wide content layout. The sidebar only appears once
 * onboarding is complete, so the onboarding flow keeps the focused phone column.
 */
export default function CoupleShell({ children }: { children: ReactNode }) {
  const onboardingComplete = useStore((s) => s.onboardingComplete)

  if (!onboardingComplete) {
    return <div className="w-full max-w-[480px] mx-auto min-h-dvh">{children}</div>
  }

  return (
    <div className="md:flex md:items-start min-h-dvh">
      <CoupleSidebar />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-[480px] mx-auto md:max-w-none md:mx-0 md:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}

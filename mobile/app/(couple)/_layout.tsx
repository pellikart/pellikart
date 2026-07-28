// Couple app shell.
//
// A plain stack, not a tab bar — that matches the web app, where the couple
// side has no bottom nav on mobile (CoupleShell renders a bare 480px column and
// navigation happens through the event-board tabs inside HomePage). The desktop
// sidebar in CoupleSidebar.tsx has no phone equivalent to port.
//
// Routes here map onto the web routes one-for-one:
//   index            → HomePage           (/)
//   onboarding       → OnboardingPage     (/onboarding)
//   category/[…]     → CategoryBoardPage  (/category/:ritualId/:categoryId)
//   booking/[…]      → BookingPage        (/booking/:ritualId)

import { Stack } from 'expo-router'
import { colors } from '@/theme/tokens'

export default function CoupleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.screenBg },
      }}
    />
  )
}

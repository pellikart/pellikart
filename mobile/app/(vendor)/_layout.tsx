// Vendor app shell — a port of the web app's VendorBottomNav.
//
// Same four tabs, same order, same mustard-on-grey active treatment. The web
// icons are inline Feather SVGs (home / grid / calendar / user), so the Feather
// set from @expo/vector-icons reproduces them exactly rather than approximating.
//
// One rule carried over: single-listing categories (Mehendi, Makeup, Saree
// Draping) author and edit their one listing from onboarding and the dashboard,
// so they get no Listings tab.

import { Tabs } from 'expo-router'
import Feather from '@expo/vector-icons/Feather'
import { useVendorStore } from '@shared/vendor-store'
import { isSingleListingCategory } from '@shared/vendor-category-config'
import { colors } from '@/theme/tokens'

export default function VendorLayout() {
  const vendorProfile = useVendorStore((s) => s.vendorProfile)
  const hideListings = isSingleListingCategory(vendorProfile?.category)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mustard,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.cardBorder },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500' },
        sceneStyle: { backgroundColor: colors.screenBg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Listings',
          href: hideListings ? null : undefined,
          tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />

      {/* Reached from the Profile screen, not the tab bar. `href: null` keeps the
          route navigable while hiding it as a tab. */}
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="leads" options={{ href: null }} />
      <Tabs.Screen name="trials" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="listing-new" options={{ href: null }} />
      <Tabs.Screen name="listing-edit" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="payouts" options={{ href: null }} />
    </Tabs>
  )
}

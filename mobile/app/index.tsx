// Entry route: decides where a user belongs and redirects there.
//
// This is the native equivalent of the branching at the bottom of the web app's
// LiveApp component — splash while resolving, auth screen when signed out, the
// role chooser for a brand-new account, then the couple or vendor app.

import { Redirect } from 'expo-router'
import { Splash } from '@/components/ui'
import { useSessionRole } from '@/hooks/useSessionRole'
import { RoleSelectScreen } from '@/screens/RoleSelectScreen'

export default function Index() {
  const session = useSessionRole()

  switch (session.status) {
    case 'loading':
      return <Splash />
    case 'signed-out':
      return <Redirect href="/sign-in" />
    case 'needs-role':
      // Rendered inline rather than as its own route: the chooser is a state of
      // this gate, not a place the user can navigate back to.
      return <RoleSelectScreen onSelect={session.commitRole} />
    case 'ready':
      return <Redirect href={session.role === 'vendor' ? '/(vendor)' : '/(couple)'} />
  }
}
